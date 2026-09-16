import Link from "next/link";
import { GachamongMascot } from "./GachamongMascot";

type Machine = { id: string; name: string; description: string; pullPrice: number };

export function MachineCard({ machine }: { machine: Machine }) {
  return (
    <Link
      href={`/machines/${machine.id}`}
      className="block rounded-[22px] overflow-hidden bg-panel border border-panel-line"
    >
      <div className="aspect-[1/0.82] flex items-center justify-center bg-[#1d1438]">
        <GachamongMascot className="w-36 h-36" />
      </div>
      <div className="p-4 flex flex-col gap-2">
        <div className="font-display text-base">{machine.name}</div>
        <p className="text-sm text-text-dim">{machine.description}</p>
        <div className="font-display text-gold">{machine.pullPrice.toLocaleString()} 캐시</div>
      </div>
    </Link>
  );
}
