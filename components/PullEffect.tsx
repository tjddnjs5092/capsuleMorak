"use client";

export function PullEffect({ machineId, pullPrice }: { machineId: string; pullPrice: number }) {
  return (
    <button
      disabled
      className="font-display rounded-xl bg-gold/50 text-[#2a1600] py-3.5 cursor-not-allowed"
      title={`machine ${machineId}`}
    >
      🎰 뽑기 ({pullPrice.toLocaleString()} 캐시) — 준비 중
    </button>
  );
}
