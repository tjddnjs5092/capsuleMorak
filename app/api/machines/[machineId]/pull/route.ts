import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pickWeightedItem, calculateDuplicateRefund } from "@/lib/gacha";

export async function POST(request: Request, { params }: { params: { machineId: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const machine = await prisma.machine.findUnique({
    where: { id: params.machineId },
    include: { items: { where: { stock: { gt: 0 } } } }
  });
  if (!machine || !machine.isActive) {
    return NextResponse.json({ error: "존재하지 않는 머신이에요." }, { status: 404 });
  }
  if (machine.items.length === 0) {
    return NextResponse.json({ error: "재고가 모두 소진됐어요." }, { status: 409 });
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.cashBalance < machine.pullPrice) {
    return NextResponse.json({ error: "캐시가 부족해요." }, { status: 402 });
  }

  const picked = pickWeightedItem(machine.items);

  let result;
  try {
    result = await prisma.$transaction(async (tx) => {
      // Re-check the balance inside the transaction against a fresh read, so two
      // concurrent requests can't both pass the outer pre-check on a stale balance
      // and both decrement. Throwing here rolls back the whole transaction.
      const freshUser = await tx.user.findUniqueOrThrow({ where: { id: userId } });
      if (freshUser.cashBalance < machine.pullPrice) {
        throw new Error("INSUFFICIENT_CASH");
      }

      await tx.user.update({
        where: { id: userId },
        data: { cashBalance: { decrement: machine.pullPrice } }
      });
      await tx.item.update({ where: { id: picked.id }, data: { stock: { decrement: 1 } } });
      await tx.pullLog.create({
        data: { userId, machineId: machine.id, itemId: picked.id, grade: picked.grade }
      });

      const alreadyOwned = await tx.inventoryEntry.findFirst({
        where: { userId, itemId: picked.id, refundedAt: null }
      });

      let refundAmount = 0;
      if (alreadyOwned) {
        refundAmount = calculateDuplicateRefund(picked.price);
        await tx.inventoryEntry.create({
          data: {
            userId,
            itemId: picked.id,
            refundedAt: new Date(),
            refundAmount
          }
        });
        await tx.user.update({ where: { id: userId }, data: { cashBalance: { increment: refundAmount } } });
      } else {
        await tx.inventoryEntry.create({ data: { userId, itemId: picked.id } });
      }

      const updatedUser = await tx.user.findUniqueOrThrow({ where: { id: userId } });

      return {
        item: { id: picked.id, name: picked.name, imageUrl: picked.imageUrl, grade: picked.grade },
        duplicate: Boolean(alreadyOwned),
        refundAmount,
        cashBalance: updatedUser.cashBalance
      };
    });
  } catch (err) {
    if (err instanceof Error && err.message === "INSUFFICIENT_CASH") {
      return NextResponse.json({ error: "캐시가 부족해요." }, { status: 402 });
    }
    throw err;
  }

  return NextResponse.json(result);
}
