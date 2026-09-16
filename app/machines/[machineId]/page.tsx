import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { GachamongMascot } from "@/components/GachamongMascot";
import { PullEffect } from "@/components/PullEffect";

const GRADE_LABEL: Record<string, string> = {
  COMMON: "일반",
  RARE: "레어",
  SUPER_RARE: "슈퍼레어"
};

export const dynamic = "force-dynamic";

export default async function MachineDetailPage({ params }: { params: { machineId: string } }) {
  const machine = await prisma.machine.findUnique({
    where: { id: params.machineId },
    include: { items: { where: { stock: { gt: 0 } } } }
  });
  if (!machine) notFound();

  const totalStock = machine.items.reduce((sum, item) => sum + item.stock, 0);
  const byGrade = ["COMMON", "RARE", "SUPER_RARE"].map((grade) => {
    const items = machine.items.filter((item) => item.grade === grade);
    const total = items.reduce((sum, item) => sum + item.probability, 0);
    return { grade, total };
  });

  return (
    <main className="flex-1 p-4 flex flex-col gap-5">
      <div className="aspect-[1/0.82] flex items-center justify-center bg-[#1d1438] rounded-[22px]">
        <GachamongMascot className="w-40 h-40" />
      </div>

      <div>
        <h1 className="font-display text-lg">{machine.name}</h1>
        <p className="text-sm text-text-dim mt-1">{machine.description}</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {byGrade.map(({ grade, total }) => (
          <span
            key={grade}
            className="text-xs rounded-full border border-panel-line bg-white/5 px-2.5 py-1 text-text-dim"
          >
            {GRADE_LABEL[grade]} {(total * 100).toFixed(1)}%
          </span>
        ))}
      </div>

      <div className="flex justify-between text-sm text-text-dim">
        <span>잔여 수량 {totalStock}개</span>
        <span>{machine.items.length}종</span>
      </div>

      <PullEffect machineId={machine.id} pullPrice={machine.pullPrice} />
    </main>
  );
}
