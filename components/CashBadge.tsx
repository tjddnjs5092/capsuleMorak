"use client";

import { useEffect, useState } from "react";

export function CashBadge() {
  const [cash, setCash] = useState<number | null>(null);

  async function refresh() {
    const res = await fetch("/api/me");
    const body = await res.json();
    setCash(body?.cashBalance ?? null);
  }

  useEffect(() => {
    refresh();
    window.addEventListener("gachamong:cash-changed", refresh);
    return () => window.removeEventListener("gachamong:cash-changed", refresh);
  }, []);

  if (cash === null) return null;

  return (
    <div className="flex items-center gap-1 rounded-full bg-panel border border-panel-line px-3 py-1.5 text-sm text-gold">
      🪙 {cash.toLocaleString()}
    </div>
  );
}
