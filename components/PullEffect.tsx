"use client";

import { useEffect, useRef, useState } from "react";
import { GachamongMascot } from "./GachamongMascot";

const GRADE_LABEL: Record<string, { text: string; color: string }> = {
  COMMON: { text: "★☆☆ COMMON", color: "#6fe7c4" },
  RARE: { text: "★★☆ RARE", color: "#ff6fa5" },
  SUPER_RARE: { text: "★★★ SUPER RARE", color: "#ffc94d" }
};

type PullResult = {
  item: { id: string; name: string; imageUrl: string | null; grade: string };
  duplicate: boolean;
  refundAmount: number;
  cashBalance: number;
};

export function PullEffect({ machineId, pullPrice }: { machineId: string; pullPrice: number }) {
  const [open, setOpen] = useState(false);
  const [videoDone, setVideoDone] = useState(false);
  const [result, setResult] = useState<PullResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Trigger playback after the overlay (and its <video> element) has actually mounted.
  // Doing this synchronously inside startPull() instead is unreliable: on the very first
  // pull, `open` is still false when startPull() runs its check, so the <video> (rendered
  // only when `open` is true) hasn't been committed to the DOM yet and videoRef.current is
  // still null — the play() call would silently no-op. Keying this effect on `attempt` (in
  // addition to `open`) also makes "다시 뽑기" restart playback even though `open` stays true.
  useEffect(() => {
    if (!open) return;
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      // Skip the animated video entirely and jump straight to the result once it's ready.
      videoRef.current?.pause();
    } else if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }, [open, attempt]);

  async function startPull() {
    setError(null);
    setResult(null);
    setVideoDone(false);
    setOpen(true);
    setAttempt((a) => a + 1);

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const pullPromise = fetch(`/api/machines/${machineId}/pull`, { method: "POST" }).then((res) =>
      res.json()
    );

    const body = await pullPromise;
    if (body.error) {
      setError(body.error);
      setOpen(false);
      return;
    }
    setResult(body as PullResult);
    if (prefersReducedMotion) setVideoDone(true);
    window.dispatchEvent(new Event("gachamong:cash-changed"));
  }

  function handleVideoEnded() {
    setVideoDone(true);
  }

  function close() {
    setOpen(false);
    videoRef.current?.pause();
  }

  const showResult = videoDone && result;

  return (
    <>
      <button
        onClick={startPull}
        className="font-display rounded-xl bg-gold text-[#2a1600] py-3.5 shadow-[0_6px_0_#b9740f] active:translate-y-1 active:shadow-none transition-transform"
      >
        🎰 뽑기 ({pullPrice.toLocaleString()} 캐시)
      </button>
      {error && <p className="text-sm text-pink">{error}</p>}

      {open && (
        <div className="fixed inset-0 z-50 bg-[#0b0716] flex items-center justify-center">
          <div className="relative w-full max-w-[460px] h-full">
            <button
              onClick={close}
              className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/45 text-white flex items-center justify-center"
              aria-label="닫기"
            >
              ✕
            </button>

            <video
              ref={videoRef}
              muted
              playsInline
              onEnded={handleVideoEnded}
              className="w-full h-full object-cover transition-opacity duration-300"
              style={{ opacity: showResult ? 0 : 1 }}
            >
              <source src="/videos/pull-effect.mp4" type="video/mp4" />
            </video>

            {showResult && result && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center bg-bg">
                <GachamongMascot className="w-32 h-32 drop-shadow-[0_10px_16px_rgba(0,0,0,.4)]" />
                <span
                  className="font-display text-sm"
                  style={{ color: GRADE_LABEL[result.item.grade].color }}
                >
                  {GRADE_LABEL[result.item.grade].text}
                </span>
                <div className="font-display text-2xl text-cream">{result.item.name}</div>
                <p className="text-sm text-text-dim">
                  {result.duplicate
                    ? `중복 아이템! ${result.refundAmount.toLocaleString()} 캐시로 즉시 환급됐어요.`
                    : "보관함에 담겼어요."}
                </p>
                <div className="flex gap-2 w-full mt-2">
                  <button
                    onClick={close}
                    className="flex-1 rounded-xl border border-white/20 bg-white/10 py-3 text-sm"
                  >
                    닫기
                  </button>
                  <button
                    onClick={startPull}
                    className="font-display flex-1 rounded-xl bg-gold text-[#2a1600] py-3 shadow-[0_5px_0_#b9740f]"
                  >
                    🎰 다시 뽑기
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
