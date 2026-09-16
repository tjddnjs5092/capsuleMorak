"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

export function HeaderNav() {
  return (
    <nav className="flex items-center gap-3 text-xs text-text-dim">
      <Link href="/" className="text-gold">
        홈
      </Link>
      <Link href="/inventory">보관함</Link>
      <Link href="/login">로그인</Link>
      <button onClick={() => signOut({ redirect: false })}>로그아웃</button>
    </nav>
  );
}
