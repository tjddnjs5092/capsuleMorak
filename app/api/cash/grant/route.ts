import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DEMO_GRANT_AMOUNT = 500;

export async function POST() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });

  const user = await prisma.user.update({
    where: { id: userId },
    data: { cashBalance: { increment: DEMO_GRANT_AMOUNT } }
  });

  return NextResponse.json({ cashBalance: user.cashBalance });
}
