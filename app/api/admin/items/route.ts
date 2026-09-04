import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function getDefaultMachine() {
  const machine = await prisma.machine.findFirst({ where: { isActive: true } });
  if (!machine) throw new Error("No active machine found — run the seed script first.");
  return machine;
}

export async function GET() {
  const machine = await getDefaultMachine();
  const items = await prisma.item.findMany({ where: { machineId: machine.id } });
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, grade, imageUrl, probability, price, stock } = body;

  if (
    typeof name !== "string" ||
    !name.trim() ||
    !["COMMON", "RARE", "SUPER_RARE"].includes(grade) ||
    !Number.isFinite(probability) ||
    probability <= 0 ||
    !Number.isFinite(price) ||
    price < 0 ||
    !Number.isFinite(stock) ||
    stock < 0
  ) {
    return NextResponse.json({ error: "입력값을 확인해주세요." }, { status: 400 });
  }

  const machine = await getDefaultMachine();
  const item = await prisma.item.create({
    data: { machineId: machine.id, name, grade, imageUrl: imageUrl ?? null, probability, price, stock }
  });

  return NextResponse.json(item, { status: 201 });
}
