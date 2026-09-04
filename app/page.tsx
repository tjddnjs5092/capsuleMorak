import { prisma } from "@/lib/prisma";
import { MachineCard } from "@/components/MachineCard";
import { CashBadge } from "@/components/CashBadge";
import { LiveFeed } from "@/components/LiveFeed";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const machines = await prisma.machine.findMany({ where: { isActive: true } });

  return (
    <>
      <header className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-bg/85 backdrop-blur border-b border-panel-line">
        <div className="font-display text-lg text-cream">가챠몽</div>
        <CashBadge />
      </header>
      <main className="flex-1 p-4 flex flex-col gap-4">
        <h1 className="font-display text-lg">오늘은 어떤 가챠몽이 나올까?</h1>
        {machines.map((machine) => (
          <MachineCard key={machine.id} machine={machine} />
        ))}
        <LiveFeed />
      </main>
    </>
  );
}
