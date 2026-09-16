"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "가입에 실패했어요.");
      return;
    }
    const signInRes = await signIn("credentials", { email, password, redirect: false });
    if (signInRes?.ok) router.push("/");
    else setError("가입은 됐지만 로그인에 실패했어요. 로그인 페이지에서 다시 시도해주세요.");
  }

  return (
    <main className="flex-1 flex flex-col justify-center gap-4 p-6">
      <h1 className="font-display text-xl text-cream">가챠몽 회원가입</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          required
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg bg-[#1d1438] border border-panel-line px-3 py-2 text-sm"
        />
        <input
          type="password"
          required
          minLength={8}
          placeholder="비밀번호 (8자 이상)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg bg-[#1d1438] border border-panel-line px-3 py-2 text-sm"
        />
        {error && <p className="text-sm text-pink">{error}</p>}
        <button
          type="submit"
          className="font-display rounded-xl bg-gold text-[#2a1600] py-3 shadow-[0_5px_0_#b9740f]"
        >
          가입하고 1,000 캐시 받기
        </button>
      </form>
    </main>
  );
}
