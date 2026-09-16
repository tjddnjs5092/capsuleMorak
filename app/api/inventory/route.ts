import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });

  const entries = await prisma.inventoryEntry.findMany({
    where: { userId, refundedAt: null },
    include: { item: true },
    orderBy: { acquiredAt: "desc" }
  });

  return NextResponse.json(
    entries.map((entry) => ({
      id: entry.id,
      item: { name: entry.item.name, imageUrl: entry.item.imageUrl, grade: entry.item.grade },
      acquiredAt: entry.acquiredAt
    }))
  );
}
