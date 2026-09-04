"use client";

import { useEffect, useState } from "react";
import { GachamongMascot } from "@/components/GachamongMascot";

const GRADE_LABEL: Record<string, string> = { COMMON: "일반", RARE: "레어", SUPER_RARE: "슈퍼레어" };

type Entry = { id: string; item: { name: string; imageUrl: string | null; grade: string }; acquiredAt: string };

export default function InventoryPage() {
  const [entries, setEntries] = useState<Entry[] | null>(null);

  useEffect(() => {
    fetch("/api/inventory")
      .then((res) => res.json())
      .then(setEntries);
  }, []);

  return (
    <main className="flex-1 p-4 flex flex-col gap-4">
      <h1 className="font-display text-lg">보관함</h1>
      {entries === null && <p className="text-sm text-text-dim">불러오는 중...</p>}
      {entries?.length === 0 && (
        <p className="text-sm text-text-dim">아직 뽑은 아이템이 없어요. 첫 뽑기를 해보세요!</p>
      )}
      <div className="grid grid-cols-2 gap-3">
        {entries?.map((entry) => (
          <div key={entry.id} className="rounded-2xl bg-panel border border-panel-line p-3 flex flex-col gap-2">
            <div className="aspect-square rounded-xl bg-[#1d1438] flex items-center justify-center">
              <GachamongMascot className="w-16 h-16" />
            </div>
            <div className="text-sm truncate">{entry.item.name}</div>
            <div className="text-xs text-text-dim">{GRADE_LABEL[entry.item.grade]}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
