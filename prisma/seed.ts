import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.machine.findFirst({ where: { name: "말랑 몽글몽글 머신" } });
  if (existing) {
    console.log("Seed already applied, skipping.");
    return;
  }

  await prisma.machine.create({
    data: {
      name: "말랑 몽글몽글 머신",
      description: "구름처럼 몽글몽글한 가챠몽을 모아보세요.",
      pullPrice: 100,
      items: {
        create: [
          { name: "몽글 가챠몽", grade: "COMMON", probability: 0.2334, price: 100, stock: 999 },
          { name: "포근 가챠몽", grade: "COMMON", probability: 0.2333, price: 100, stock: 999 },
          { name: "살랑 가챠몽", grade: "COMMON", probability: 0.2333, price: 100, stock: 999 },
          { name: "반짝 가챠몽", grade: "RARE", probability: 0.125, price: 300, stock: 200 },
          { name: "별빛 가챠몽", grade: "RARE", probability: 0.125, price: 300, stock: 200 },
          { name: "골드 가챠몽", grade: "SUPER_RARE", probability: 0.05, price: 1000, stock: 20 }
        ]
      }
    }
  });

  console.log("Seeded 말랑 몽글몽글 머신 with 6 items.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
