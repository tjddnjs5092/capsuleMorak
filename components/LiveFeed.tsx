"use client";

import { useEffect, useState } from "react";

const GRADE_LABEL: Record<string, string> = { COMMON: "일반", RARE: "레어", SUPER_RARE: "슈퍼레어" };

type FeedItem = { id: string; userEmail: string; itemName: string; grade: string; createdAt: string };

export function LiveFeed() {
  const [items, setItems] = useState<FeedItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      const res = await fetch("/api/feed");
      const body = await res.json();
      if (!cancelled) setItems(body);
    }
    poll();
    const interval = setInterval(poll, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm text-text-dim">실시간 뽑기 피드</div>
      <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto">
        {items.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center justify-between text-xs rounded-lg bg-panel border border-panel-line px-3 py-2"
          >
            <span className="text-text-dim">{entry.userEmail}</span>
            <span>{entry.itemName}</span>
            <span className={entry.grade === "SUPER_RARE" ? "text-gold" : "text-text-dim"}>
              {entry.grade === "SUPER_RARE" ? "🎉 " : ""}
              {GRADE_LABEL[entry.grade]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
