import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json(null);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json(null);

  return NextResponse.json({ email: user.email, cashBalance: user.cashBalance });
}
