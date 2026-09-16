import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function maskEmail(email: string): string {
  const [name, domain] = email.split("@");
  if (!domain || name.length <= 2) return `${name[0] ?? "?"}**`;
  return `${name.slice(0, 2)}${"*".repeat(Math.max(name.length - 2, 1))}`;
}

export async function GET() {
  const logs = await prisma.pullLog.findMany({
    take: 20,
    orderBy: { createdAt: "desc" },
    include: { item: true, user: true }
  });

  return NextResponse.json(
    logs.map((log) => ({
      id: log.id,
      userEmail: maskEmail(log.user.email),
      itemName: log.item.name,
      grade: log.grade,
      createdAt: log.createdAt
    }))
  );
}
