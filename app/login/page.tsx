"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.ok) router.push("/");
    else setError("이메일 또는 비밀번호가 올바르지 않아요.");
  }

  return (
    <main className="flex-1 flex flex-col justify-center gap-4 p-6">
      <h1 className="font-display text-xl text-cream">가챠몽 로그인</h1>
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
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg bg-[#1d1438] border border-panel-line px-3 py-2 text-sm"
        />
        {error && <p className="text-sm text-pink">{error}</p>}
        <button
          type="submit"
          className="font-display rounded-xl bg-gold text-[#2a1600] py-3 shadow-[0_5px_0_#b9740f]"
        >
          로그인
        </button>
      </form>
    </main>
  );
}
