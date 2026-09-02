# 가챠몽 MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working Next.js demo of the 가챠몽 online gacha shop — browse a machine, pull a capsule with a cinematic video effect, see the result, and manage a virtual-cash inventory — backed by a real Postgres database (no real payments).

**Architecture:** Next.js 14 (App Router) full-stack app. Server-side API route handlers own all game logic (weighted item pick, cash debit, duplicate refund) so nothing security-relevant runs client-side. Prisma is the only DB access layer. Auth.js (NextAuth, credentials provider) issues the session used to identify the user on every API route. Pure game-logic functions (weighted pick, refund calc) are unit-tested with Vitest; routes and pages are verified by running the dev server and exercising them in the browser, since mocking Next's route-handler internals buys little real confidence over hitting the live route.

**Tech Stack:** Next.js 14 (App Router, TypeScript), Tailwind CSS, PostgreSQL, Prisma 5, NextAuth 4 (credentials provider), bcryptjs, Vitest.

**Spec:** [docs/superpowers/specs/2026-09-02-gachamong-design.md](../specs/2026-09-02-gachamong-design.md)

## Global Constraints

- No real payment/PG integration — all cash is virtual (`User.cashBalance`), topped up via a "테스트 캐시 지급" endpoint, not a purchase flow.
- No real shipping/inventory logistics — "보관함" is purely digital.
- Item odds (`Item.probability`) must always be readable by the client before a pull (등급별 확률 상시 공개) — never hide odds behind a paywall or omit them from the machine-detail API response.
- All game-affecting logic (item selection, cash debit, stock decrement, duplicate refund) runs server-side inside a single Prisma transaction — the client never sends "what I won."
- UI copy is Korean, matching the tone already validated in the demo artifacts (casual, cute, brand name 가챠몽).
- Respect `prefers-reduced-motion` in the pull-effect component (already required by the spec's effect section).
- Target Node.js 18+.

---

## File Structure

```
gachamong/
  package.json
  tsconfig.json
  next.config.mjs
  tailwind.config.ts
  postcss.config.js
  vitest.config.ts
  docker-compose.yml
  .env.example
  types/
    next-auth.d.ts
  prisma/
    schema.prisma
    seed.ts
  lib/
    prisma.ts
    gacha.ts
    gacha.test.ts
    auth.ts
  app/
    layout.tsx
    globals.css
    page.tsx                        (home)
    login/page.tsx
    register/page.tsx
    machines/[machineId]/page.tsx
    inventory/page.tsx
    admin/items/page.tsx
    api/
      auth/[...nextauth]/route.ts
      register/route.ts
      machines/[machineId]/pull/route.ts
      feed/route.ts
      cash/grant/route.ts
      admin/items/route.ts
  components/
    GachamongMascot.tsx
    MachineCard.tsx
    PullEffect.tsx
    LiveFeed.tsx
    CashBadge.tsx
  public/
    videos/pull-effect.mp4
```

---

### Task 1: Project scaffold (Next.js + TypeScript + Tailwind)

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.mjs`
- Create: `tailwind.config.ts`
- Create: `postcss.config.js`
- Create: `app/layout.tsx`
- Create: `app/globals.css`
- Create: `app/page.tsx`
- Create: `.gitignore`

**Interfaces:**
- Produces: Tailwind theme tokens `bg`, `panel`, `panel-line`, `cream`, `gold`, `pink`, `mint`, `text`, `text-dim` (used by every later component/page).

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "gachamong",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "prisma:migrate": "prisma migrate dev",
    "prisma:seed": "tsx prisma/seed.ts"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "next-auth": "^4.24.7",
    "@prisma/client": "^5.14.0",
    "bcryptjs": "^2.4.3"
  },
  "devDependencies": {
    "typescript": "^5.4.5",
    "@types/node": "^20.12.12",
    "@types/react": "^18.3.2",
    "@types/react-dom": "^18.3.0",
    "@types/bcryptjs": "^2.4.6",
    "tailwindcss": "^3.4.3",
    "postcss": "^8.4.38",
    "autoprefixer": "^10.4.19",
    "prisma": "^5.14.0",
    "vitest": "^1.6.0",
    "tsx": "^4.10.5"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./*"] },
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create `next.config.mjs`**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {};
export default nextConfig;
```

- [ ] **Step 4: Create `tailwind.config.ts`**

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#190f2e",
        panel: "#241a42",
        "panel-line": "#3a2a5e",
        cream: "#fff8ec",
        gold: "#ffc94d",
        "gold-deep": "#e69a1f",
        pink: "#ff6fa5",
        mint: "#6fe7c4",
        text: "#f5efff",
        "text-dim": "#b7a9d9"
      },
      fontFamily: {
        display: ["Jua", "sans-serif"],
        body: ["Gowun Dodum", "sans-serif"]
      }
    }
  },
  plugins: []
};
export default config;
```

- [ ] **Step 5: Create `postcss.config.js`**

```js
module.exports = {
  plugins: { tailwindcss: {}, autoprefixer: {} }
};
```

- [ ] **Step 6: Create `app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url("https://fonts.googleapis.com/css2?family=Jua&family=Gowun+Dodum&display=swap");

body {
  background-color: #190f2e;
  color: #f5efff;
}
```

- [ ] **Step 7: Create `app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "가챠몽",
  description: "가챠몽 온라인 가챠샵"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="font-body min-h-screen">
        <div className="mx-auto max-w-[460px] min-h-screen flex flex-col">{children}</div>
      </body>
    </html>
  );
}
```

- [ ] **Step 8: Create a placeholder `app/page.tsx`** (replaced fully in Task 6)

```tsx
export default function HomePage() {
  return <main className="p-6">가챠몽 홈 — 준비 중</main>;
}
```

- [ ] **Step 9: Create `.gitignore`**

```
node_modules
.next
.env
.env.local
*.tsbuildinfo
```

- [ ] **Step 10: Install and verify the dev server boots**

Run: `npm install`
Run: `npm run dev`
Expected: server starts on `http://localhost:3000` and shows "가챠몽 홈 — 준비 중". Stop the server (Ctrl+C).

- [ ] **Step 11: Commit**

```bash
git add package.json tsconfig.json next.config.mjs tailwind.config.ts postcss.config.js app .gitignore
git commit -m "chore: scaffold Next.js + Tailwind project"
```

---

### Task 2: Database schema, migration, seed data

**Files:**
- Create: `docker-compose.yml`
- Create: `.env.example`
- Create: `prisma/schema.prisma`
- Create: `lib/prisma.ts`
- Create: `prisma/seed.ts`

**Interfaces:**
- Produces: Prisma models `User`, `Machine`, `Item`, `PullLog`, `InventoryEntry`, enum `Grade` (`COMMON`, `RARE`, `SUPER_RARE`); singleton `prisma` client export from `lib/prisma.ts`.
- Produces: seeded `Machine` with slug-free `id`, `pullPrice: 100`, and 6 `Item`s (3 common / 2 rare / 1 super rare) whose `probability` fields sum to `1.0` — later tasks (pull route, machine page) rely on this seed existing.

- [ ] **Step 1: Create `docker-compose.yml`** (local Postgres for dev)

```yaml
services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: gachamong
      POSTGRES_PASSWORD: gachamong
      POSTGRES_DB: gachamong
    ports:
      - "5432:5432"
    volumes:
      - gachamong_pgdata:/var/lib/postgresql/data
volumes:
  gachamong_pgdata:
```

- [ ] **Step 2: Create `.env.example`**

```
DATABASE_URL="postgresql://gachamong:gachamong@localhost:5432/gachamong"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-with-openssl-rand-base64-32"
```

Copy it: `cp .env.example .env` and fill `NEXTAUTH_SECRET` with the output of `openssl rand -base64 32` (or any random 32+ char string for local dev).

- [ ] **Step 3: Start Postgres**

Run: `docker compose up -d`
Expected: `docker compose ps` shows the `db` service as `running (healthy)` or `Up`.

- [ ] **Step 4: Create `prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Grade {
  COMMON
  RARE
  SUPER_RARE
}

model User {
  id           String            @id @default(cuid())
  email        String            @unique
  passwordHash String
  cashBalance  Int               @default(1000)
  createdAt    DateTime          @default(now())
  pullLogs     PullLog[]
  inventory    InventoryEntry[]
}

model Machine {
  id          String    @id @default(cuid())
  name        String
  description String
  imageUrl    String?
  pullPrice   Int       @default(100)
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  items       Item[]
  pullLogs    PullLog[]
}

model Item {
  id               String            @id @default(cuid())
  machineId        String
  machine          Machine           @relation(fields: [machineId], references: [id])
  name             String
  imageUrl         String?
  grade            Grade
  probability      Float
  price            Int
  stock            Int
  pullLogs         PullLog[]
  inventoryEntries InventoryEntry[]
}

model PullLog {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  machineId String
  machine   Machine  @relation(fields: [machineId], references: [id])
  itemId    String
  item      Item     @relation(fields: [itemId], references: [id])
  grade     Grade
  createdAt DateTime @default(now())
}

model InventoryEntry {
  id           String    @id @default(cuid())
  userId       String
  user         User      @relation(fields: [userId], references: [id])
  itemId       String
  item         Item      @relation(fields: [itemId], references: [id])
  acquiredAt   DateTime  @default(now())
  refundedAt   DateTime?
  refundAmount Int?
}
```

- [ ] **Step 5: Run the migration**

Run: `npx prisma migrate dev --name init`
Expected: migration succeeds, prints `Your database is now in sync with your schema.`

- [ ] **Step 6: Create `lib/prisma.ts`** (singleton client, avoids exhausting connections on hot reload)

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

- [ ] **Step 7: Create `prisma/seed.ts`**

```ts
import { PrismaClient, Grade } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.machine.findFirst({ where: { name: "말랑 몽글몽글 머신" } });
  if (existing) {
    console.log("Seed already applied, skipping.");
    return;
  }

  await prisma.machine.create({
    data: {
      name: "말랑 몽글몽글 머신",
      description: "구름처럼 몽글몽글한 가챠몽을 모아보세요.",
      pullPrice: 100,
      items: {
        create: [
          { name: "몽글 가챠몽", grade: Grade.COMMON, probability: 0.2334, price: 100, stock: 999 },
          { name: "포근 가챠몽", grade: Grade.COMMON, probability: 0.2333, price: 100, stock: 999 },
          { name: "살랑 가챠몽", grade: Grade.COMMON, probability: 0.2333, price: 100, stock: 999 },
          { name: "반짝 가챠몽", grade: Grade.RARE, probability: 0.125, price: 300, stock: 200 },
          { name: "별빛 가챠몽", grade: Grade.RARE, probability: 0.125, price: 300, stock: 200 },
          { name: "골드 가챠몽", grade: Grade.SUPER_RARE, probability: 0.05, price: 1000, stock: 20 }
        ]
      }
    }
  });

  console.log("Seeded 말랑 몽글몽글 머신 with 6 items.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 8: Run the seed**

Run: `npx tsx prisma/seed.ts`
Expected: prints `Seeded 말랑 몽글몽글 머신 with 6 items.`

- [ ] **Step 9: Commit**

```bash
git add docker-compose.yml .env.example prisma lib/prisma.ts package.json
git commit -m "feat: add Prisma schema, migration, and seed data"
```

---

### Task 3: Gacha pick + refund logic (unit-tested)

**Files:**
- Create: `vitest.config.ts`
- Create: `lib/gacha.ts`
- Test: `lib/gacha.test.ts`

**Interfaces:**
- Produces: `pickWeightedItem<T extends { id: string; probability: number }>(items: T[], rng?: () => number): T` and `calculateDuplicateRefund(price: number): number` — the pull API route (Task 5) calls both.

- [ ] **Step 1: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node"
  }
});
```

- [ ] **Step 2: Write the failing tests in `lib/gacha.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { pickWeightedItem, calculateDuplicateRefund } from "./gacha";

describe("pickWeightedItem", () => {
  it("returns the only item when there is exactly one", () => {
    const items = [{ id: "a", probability: 1 }];
    expect(pickWeightedItem(items, () => 0.5).id).toBe("a");
  });

  it("picks the first item when rng lands in its range", () => {
    const items = [
      { id: "a", probability: 0.7 },
      { id: "b", probability: 0.3 }
    ];
    expect(pickWeightedItem(items, () => 0.1).id).toBe("a");
  });

  it("picks the second item when rng lands past the first item's range", () => {
    const items = [
      { id: "a", probability: 0.7 },
      { id: "b", probability: 0.3 }
    ];
    expect(pickWeightedItem(items, () => 0.99).id).toBe("b");
  });

  it("throws on an empty item list", () => {
    expect(() => pickWeightedItem([], () => 0.5)).toThrow("No items to pick from");
  });

  it("throws when total probability is zero", () => {
    const items = [{ id: "a", probability: 0 }];
    expect(() => pickWeightedItem(items, () => 0.5)).toThrow("Total probability must be positive");
  });
});

describe("calculateDuplicateRefund", () => {
  it("returns 50% of price, rounded down", () => {
    expect(calculateDuplicateRefund(300)).toBe(150);
    expect(calculateDuplicateRefund(101)).toBe(50);
  });

  it("returns 0 for a zero price", () => {
    expect(calculateDuplicateRefund(0)).toBe(0);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run lib/gacha.test.ts`
Expected: FAIL — `lib/gacha.ts` does not exist yet.

- [ ] **Step 4: Implement `lib/gacha.ts`**

```ts
export type PullableItem = { id: string; probability: number };

export function pickWeightedItem<T extends PullableItem>(
  items: T[],
  rng: () => number = Math.random
): T {
  if (items.length === 0) {
    throw new Error("No items to pick from");
  }
  const total = items.reduce((sum, item) => sum + item.probability, 0);
  if (total <= 0) {
    throw new Error("Total probability must be positive");
  }
  let roll = rng() * total;
  for (const item of items) {
    if (roll < item.probability) {
      return item;
    }
    roll -= item.probability;
  }
  return items[items.length - 1];
}

export function calculateDuplicateRefund(price: number): number {
  return Math.floor(price * 0.5);
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run lib/gacha.test.ts`
Expected: PASS — 7 tests passing.

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts lib/gacha.ts lib/gacha.test.ts package.json
git commit -m "feat: add weighted pick and duplicate-refund logic with tests"
```

---

### Task 4: Auth (register + credentials login)

**Files:**
- Create: `types/next-auth.d.ts`
- Create: `lib/auth.ts`
- Create: `app/api/auth/[...nextauth]/route.ts`
- Create: `app/api/register/route.ts`
- Create: `app/register/page.tsx`
- Create: `app/login/page.tsx`

**Interfaces:**
- Consumes: `prisma` from `lib/prisma.ts` (Task 2).
- Produces: `authOptions` (NextAuth config, used by any server code needing `getServerSession(authOptions)`); session `user.id` available on every authenticated route (Task 5, 8, 9, 10, 11 all depend on this).

- [ ] **Step 1: Create `types/next-auth.d.ts`** (module augmentation — without this, `strict: true` rejects `token.id`/`session.user.id` as unknown properties)

```ts
import type { DefaultSession } from "next-auth";
import type { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & { id: string };
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
  }
}
```

- [ ] **Step 2: Create `lib/auth.ts`**

```ts
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "이메일", type: "email" },
        password: { label: "비밀번호", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user) return null;
        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;
        return { id: user.id, email: user.email };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) session.user.id = token.id;
      return session;
    }
  },
  pages: { signIn: "/login" }
};
```

- [ ] **Step 3: Create `app/api/auth/[...nextauth]/route.ts`**

```ts
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

- [ ] **Step 4: Create `app/api/register/route.ts`** (creates the user and grants starting cash)

```ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (typeof email !== "string" || typeof password !== "string" || password.length < 8) {
    return NextResponse.json(
      { error: "이메일과 8자 이상의 비밀번호를 입력해주세요." },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "이미 가입된 이메일이에요." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash, cashBalance: 1000 }
  });

  return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
}
```

- [ ] **Step 5: Create `app/register/page.tsx`**

```tsx
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
```

- [ ] **Step 6: Create `app/login/page.tsx`**

```tsx
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
```

- [ ] **Step 7: Manual verification**

Run: `npm run dev`, open `http://localhost:3000/register`, submit a test email + password (8+ chars).
Expected: redirected to `/` with no console errors; `npx prisma studio` shows the new row in `User` with `cashBalance = 1000` and a bcrypt `passwordHash`.

- [ ] **Step 8: Commit**

```bash
git add types/next-auth.d.ts lib/auth.ts app/api/auth app/api/register app/register app/login
git commit -m "feat: add credentials auth (register + login)"
```

---

### Task 5: Pull API route

**Files:**
- Create: `app/api/machines/[machineId]/pull/route.ts`

**Interfaces:**
- Consumes: `pickWeightedItem`, `calculateDuplicateRefund` (Task 3); `authOptions` (Task 4); `prisma` (Task 2).
- Produces: `POST /api/machines/:machineId/pull` → `{ item: { id, name, imageUrl, grade }, duplicate: boolean, refundAmount: number, cashBalance: number }` on success — the pull-effect component (Task 8) calls this and renders its response.

- [ ] **Step 1: Implement `app/api/machines/[machineId]/pull/route.ts`**

```ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pickWeightedItem, calculateDuplicateRefund } from "@/lib/gacha";

export async function POST(request: Request, { params }: { params: { machineId: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const machine = await prisma.machine.findUnique({
    where: { id: params.machineId },
    include: { items: { where: { stock: { gt: 0 } } } }
  });
  if (!machine || !machine.isActive) {
    return NextResponse.json({ error: "존재하지 않는 머신이에요." }, { status: 404 });
  }
  if (machine.items.length === 0) {
    return NextResponse.json({ error: "재고가 모두 소진됐어요." }, { status: 409 });
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.cashBalance < machine.pullPrice) {
    return NextResponse.json({ error: "캐시가 부족해요." }, { status: 402 });
  }

  const picked = pickWeightedItem(machine.items);

  const result = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { cashBalance: { decrement: machine.pullPrice } }
    });
    await tx.item.update({ where: { id: picked.id }, data: { stock: { decrement: 1 } } });
    await tx.pullLog.create({
      data: { userId, machineId: machine.id, itemId: picked.id, grade: picked.grade }
    });

    const alreadyOwned = await tx.inventoryEntry.findFirst({
      where: { userId, itemId: picked.id, refundedAt: null }
    });

    let refundAmount = 0;
    if (alreadyOwned) {
      refundAmount = calculateDuplicateRefund(picked.price);
      await tx.inventoryEntry.create({
        data: {
          userId,
          itemId: picked.id,
          refundedAt: new Date(),
          refundAmount
        }
      });
      await tx.user.update({ where: { id: userId }, data: { cashBalance: { increment: refundAmount } } });
    } else {
      await tx.inventoryEntry.create({ data: { userId, itemId: picked.id } });
    }

    const updatedUser = await tx.user.findUniqueOrThrow({ where: { id: userId } });

    return {
      item: { id: picked.id, name: picked.name, imageUrl: picked.imageUrl, grade: picked.grade },
      duplicate: Boolean(alreadyOwned),
      refundAmount,
      cashBalance: updatedUser.cashBalance
    };
  });

  return NextResponse.json(result);
}
```

- [ ] **Step 2: Manual verification**

Run: `npm run dev`, then in a second terminal (after logging in via the browser and copying the `next-auth.session-token` cookie, or temporarily calling the route from a logged-in browser tab's devtools console with `fetch`):

```js
fetch("/api/machines/" + "<machine id from prisma studio>" + "/pull", { method: "POST" })
  .then((r) => r.json())
  .then(console.log);
```

Expected: JSON with an `item`, `duplicate: false` on the first pull of that item, and `cashBalance` reduced by 100. Run it 7+ times and confirm a repeat item returns `duplicate: true` with `refundAmount` equal to half that item's seeded `price`, and `cashBalance` reflects the refund.

- [ ] **Step 3: Commit**

```bash
git add app/api/machines
git commit -m "feat: add server-side pull route with weighted pick and duplicate refund"
```

---

### Task 6: Mascot component + Home page (machine list)

**Files:**
- Create: `components/GachamongMascot.tsx`
- Create: `components/MachineCard.tsx`
- Create: `components/CashBadge.tsx`
- Create: `app/api/me/route.ts`
- Modify: `app/page.tsx`

**Interfaces:**
- Produces: `<GachamongMascot className? />` (reused by Task 8's result screen); `<MachineCard machine={{ id, name, description, pullPrice }} />`; `GET /api/me` → `{ email, cashBalance } | null`.

- [ ] **Step 1: Create `components/GachamongMascot.tsx`**

```tsx
export function GachamongMascot({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="mBody" cx="40%" cy="28%" r="80%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="60%" stopColor="#fff8ec" />
          <stop offset="100%" stopColor="#e9dcc2" />
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="176" rx="46" ry="8" fill="#0f0a1e" opacity=".25" />
      <path
        d="M60 108 C42 108 34 88 46 74 C36 56 50 34 72 34 C78 14 100 4 118 16 C138 6 160 22 156 44 C176 50 180 76 162 88 C170 108 152 128 132 122 C130 148 112 162 96 162 C78 162 62 148 60 124 C52 122 48 114 60 108 Z"
        fill="url(#mBody)"
        stroke="#e9dcc2"
        strokeWidth="2"
      />
      <ellipse cx="72" cy="108" rx="24" ry="16" fill="#ffb9cf" opacity=".55" />
      <ellipse cx="128" cy="108" rx="24" ry="16" fill="#ffb9cf" opacity=".55" />
      <circle cx="78" cy="94" r="6.5" fill="#3a2c22" />
      <circle cx="122" cy="94" r="6.5" fill="#3a2c22" />
      <path d="M83 116 Q100 132 117 116" fill="none" stroke="#3a2c22" strokeWidth="4.5" strokeLinecap="round" />
    </svg>
  );
}
```

- [ ] **Step 2: Create `app/api/me/route.ts`**

```ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json(null);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json(null);

  return NextResponse.json({ email: user.email, cashBalance: user.cashBalance });
}
```

- [ ] **Step 3: Create `components/CashBadge.tsx`**

```tsx
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
```

- [ ] **Step 4: Create `components/MachineCard.tsx`**

```tsx
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
```

- [ ] **Step 5: Replace `app/page.tsx`**

```tsx
import { prisma } from "@/lib/prisma";
import { MachineCard } from "@/components/MachineCard";
import { CashBadge } from "@/components/CashBadge";

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
      </main>
    </>
  );
}
```

- [ ] **Step 6: Manual verification**

Run: `npm run dev`, open `http://localhost:3000` while logged in.
Expected: header shows the 🪙 cash badge with the current balance, and the seeded "말랑 몽글몽글 머신" card is listed and links to `/machines/<id>`.

- [ ] **Step 7: Commit**

```bash
git add components app/page.tsx app/api/me
git commit -m "feat: add home page with machine list and cash badge"
```

---

### Task 7: Machine detail page (odds + pull trigger)

**Files:**
- Create: `app/machines/[machineId]/page.tsx`

**Interfaces:**
- Consumes: `GachamongMascot` (Task 6), `PullEffect` (Task 8 — stub it minimally here, fill in fully in Task 8).
- Produces: page that renders odds and hands a `machineId` + `pullPrice` to `PullEffect`.

- [ ] **Step 1: Create `app/machines/[machineId]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { GachamongMascot } from "@/components/GachamongMascot";
import { PullEffect } from "@/components/PullEffect";

const GRADE_LABEL: Record<string, string> = {
  COMMON: "일반",
  RARE: "레어",
  SUPER_RARE: "슈퍼레어"
};

export const dynamic = "force-dynamic";

export default async function MachineDetailPage({ params }: { params: { machineId: string } }) {
  const machine = await prisma.machine.findUnique({
    where: { id: params.machineId },
    include: { items: true }
  });
  if (!machine) notFound();

  const totalStock = machine.items.reduce((sum, item) => sum + item.stock, 0);
  const byGrade = ["COMMON", "RARE", "SUPER_RARE"].map((grade) => {
    const items = machine.items.filter((item) => item.grade === grade);
    const total = items.reduce((sum, item) => sum + item.probability, 0);
    return { grade, total };
  });

  return (
    <main className="flex-1 p-4 flex flex-col gap-5">
      <div className="aspect-[1/0.82] flex items-center justify-center bg-[#1d1438] rounded-[22px]">
        <GachamongMascot className="w-40 h-40" />
      </div>

      <div>
        <h1 className="font-display text-lg">{machine.name}</h1>
        <p className="text-sm text-text-dim mt-1">{machine.description}</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {byGrade.map(({ grade, total }) => (
          <span
            key={grade}
            className="text-xs rounded-full border border-panel-line bg-white/5 px-2.5 py-1 text-text-dim"
          >
            {GRADE_LABEL[grade]} {(total * 100).toFixed(1)}%
          </span>
        ))}
      </div>

      <div className="flex justify-between text-sm text-text-dim">
        <span>잔여 수량 {totalStock}개</span>
        <span>{machine.items.length}종</span>
      </div>

      <PullEffect machineId={machine.id} pullPrice={machine.pullPrice} />
    </main>
  );
}
```

- [ ] **Step 2: Manual verification (partial — full pull flow verified in Task 8)**

Run: `npm run dev`, open `http://localhost:3000/machines/<seeded machine id>`.
Expected: page renders name, description, three grade badges with percentages summing to 100.0%, and stock count — no console errors, even though the pull button isn't wired up until Task 8.

- [ ] **Step 3: Commit**

```bash
git add app/machines
git commit -m "feat: add machine detail page with odds display"
```

---

### Task 8: Pull effect component (video + result reveal)

**Files:**
- Create: `public/videos/pull-effect.mp4`
- Create: `components/PullEffect.tsx`

**Interfaces:**
- Consumes: `POST /api/machines/:machineId/pull` (Task 5); `GachamongMascot` (Task 6).
- Produces: `<PullEffect machineId pullPrice />`, self-contained (owns its own overlay/video/result state); dispatches a `window` event `"gachamong:cash-changed"` after a successful pull so `CashBadge` (Task 6) refreshes without prop-drilling.

- [ ] **Step 1: Copy the real pull-effect video into the project**

Run:

```bash
mkdir -p public/videos
cp "/c/Users/ktg/Downloads/video.mp4" public/videos/pull-effect.mp4
```

Expected: `ls -la public/videos/pull-effect.mp4` shows the ~4MB file. (Served as a normal static file — no base64 embedding needed once it lives in `public/`.)

- [ ] **Step 2: Create `components/PullEffect.tsx`**

```tsx
"use client";

import { useRef, useState } from "react";
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
  const videoRef = useRef<HTMLVideoElement>(null);

  async function startPull() {
    setError(null);
    setResult(null);
    setVideoDone(false);
    setOpen(true);

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const pullPromise = fetch(`/api/machines/${machineId}/pull`, { method: "POST" }).then((res) =>
      res.json()
    );

    if (prefersReducedMotion) {
      // Skip the animated video entirely and jump straight to the result once it's ready.
      videoRef.current?.pause();
    } else if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }

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
```

- [ ] **Step 3: Manual verification (full end-to-end pull)**

Run: `npm run dev`, log in, open a machine detail page, click "🎰 뽑기".
Expected: video plays full-screen; when it ends, it fades out and a result screen appears with the mascot, grade badge, item name, and a duplicate/refund message where applicable; header cash badge (navigate back to `/`) reflects the new balance. Click "🎰 다시 뽑기" and confirm it replays cleanly from the top.

- [ ] **Step 4: Commit**

```bash
git add public/videos/pull-effect.mp4 components/PullEffect.tsx
git commit -m "feat: add pull-effect video overlay wired to the pull API"
```

---

### Task 9: Inventory page (보관함)

**Files:**
- Create: `app/api/inventory/route.ts`
- Create: `app/inventory/page.tsx`

**Interfaces:**
- Consumes: `authOptions`, `prisma`.
- Produces: `GET /api/inventory` → `{ id, item: { name, imageUrl, grade }, acquiredAt, refunded: boolean }[]`.

- [ ] **Step 1: Create `app/api/inventory/route.ts`**

```ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });

  const entries = await prisma.inventoryEntry.findMany({
    where: { userId, refundedAt: null },
    include: { item: true },
    orderBy: { acquiredAt: "desc" }
  });

  return NextResponse.json(
    entries.map((entry) => ({
      id: entry.id,
      item: { name: entry.item.name, imageUrl: entry.item.imageUrl, grade: entry.item.grade },
      acquiredAt: entry.acquiredAt
    }))
  );
}
```

- [ ] **Step 2: Create `app/inventory/page.tsx`**

```tsx
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
```

- [ ] **Step 3: Manual verification**

After pulling at least twice (Task 8), open `http://localhost:3000/inventory`.
Expected: grid shows one card per non-refunded pull (duplicates that were refunded do not appear, since `refundedAt` is set on them).

- [ ] **Step 4: Commit**

```bash
git add app/api/inventory app/inventory
git commit -m "feat: add inventory page"
```

---

### Task 10: Live pull feed

**Files:**
- Create: `app/api/feed/route.ts`
- Create: `components/LiveFeed.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Produces: `GET /api/feed` → `{ id, userEmail: string, itemName: string, grade: string, createdAt: string }[]` (last 20 pulls across all users, masked email); `<LiveFeed />` polls it every 5s.

- [ ] **Step 1: Create `app/api/feed/route.ts`**

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function maskEmail(email: string): string {
  const [name, domain] = email.split("@");
  if (!domain || name.length <= 2) return `${name[0] ?? "?"}**`;
  return `${name.slice(0, 2)}${"*".repeat(Math.max(name.length - 2, 1))}`;
}

export async function GET() {
  const logs = await prisma.pullLog.findMany({
    take: 20,
    orderBy: { createdAt: "desc" },
    include: { item: true, user: true }
  });

  return NextResponse.json(
    logs.map((log) => ({
      id: log.id,
      userEmail: maskEmail(log.user.email),
      itemName: log.item.name,
      grade: log.grade,
      createdAt: log.createdAt
    }))
  );
}
```

- [ ] **Step 2: Create `components/LiveFeed.tsx`**

```tsx
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
```

- [ ] **Step 3: Add `<LiveFeed />` to the home page**

In `app/page.tsx`, import `LiveFeed` from `@/components/LiveFeed` and render it after the machine cards, inside `<main>`:

```tsx
        {machines.map((machine) => (
          <MachineCard key={machine.id} machine={machine} />
        ))}
        <LiveFeed />
```

- [ ] **Step 4: Manual verification**

Pull at least once (Task 8), then open `http://localhost:3000` in a second browser tab.
Expected: the feed shows the pull within 5 seconds, with a masked email, item name, and grade; a `SUPER_RARE` pull shows the 🎉 highlight.

- [ ] **Step 5: Commit**

```bash
git add app/api/feed components/LiveFeed.tsx app/page.tsx
git commit -m "feat: add live pull feed"
```

---

### Task 11: Cash grant endpoint (demo top-up)

**Files:**
- Create: `app/api/cash/grant/route.ts`
- Modify: `components/CashBadge.tsx`

**Interfaces:**
- Produces: `POST /api/cash/grant` → `{ cashBalance: number }`, grants a fixed 500 cash (demo-only stand-in for a real payment).

- [ ] **Step 1: Create `app/api/cash/grant/route.ts`**

```ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DEMO_GRANT_AMOUNT = 500;

export async function POST() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });

  const user = await prisma.user.update({
    where: { id: userId },
    data: { cashBalance: { increment: DEMO_GRANT_AMOUNT } }
  });

  return NextResponse.json({ cashBalance: user.cashBalance });
}
```

- [ ] **Step 2: Add a grant button to `components/CashBadge.tsx`**

Replace the file's contents with:

```tsx
"use client";

import { useEffect, useState } from "react";

export function CashBadge() {
  const [cash, setCash] = useState<number | null>(null);

  async function refresh() {
    const res = await fetch("/api/me");
    const body = await res.json();
    setCash(body?.cashBalance ?? null);
  }

  async function grant() {
    const res = await fetch("/api/cash/grant", { method: "POST" });
    if (res.ok) {
      const body = await res.json();
      setCash(body.cashBalance);
      window.dispatchEvent(new Event("gachamong:cash-changed"));
    }
  }

  useEffect(() => {
    refresh();
    window.addEventListener("gachamong:cash-changed", refresh);
    return () => window.removeEventListener("gachamong:cash-changed", refresh);
  }, []);

  if (cash === null) return null;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 rounded-full bg-panel border border-panel-line px-3 py-1.5 text-sm text-gold">
        🪙 {cash.toLocaleString()}
      </div>
      <button
        onClick={grant}
        className="text-xs rounded-full border border-panel-line bg-white/5 px-2.5 py-1.5 text-text-dim"
      >
        + 캐시 받기
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Manual verification**

Open `http://localhost:3000`, click "+ 캐시 받기" in the header.
Expected: cash badge increases by 500 immediately; refreshing the page shows the same persisted balance (confirms it hit the DB, not just local state).

- [ ] **Step 4: Commit**

```bash
git add app/api/cash components/CashBadge.tsx
git commit -m "feat: add demo cash grant endpoint and header button"
```

---

### Task 12: Admin item management page

**Files:**
- Create: `app/api/admin/items/route.ts`
- Create: `app/admin/items/page.tsx`

**Interfaces:**
- Consumes: `prisma`, seeded `Machine` (Task 2).
- Produces: `GET /api/admin/items` → all items for the seeded machine; `POST /api/admin/items` (`{ name, grade, imageUrl?, probability, price, stock }`) → creates an `Item` on that machine. No auth gate (local-only demo tool, matching the spec's "관리자 화면" placeholder) — note this explicitly as a follow-up before any real deployment.

- [ ] **Step 1: Create `app/api/admin/items/route.ts`**

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function getDefaultMachine() {
  const machine = await prisma.machine.findFirst({ where: { isActive: true } });
  if (!machine) throw new Error("No active machine found — run the seed script first.");
  return machine;
}

export async function GET() {
  const machine = await getDefaultMachine();
  const items = await prisma.item.findMany({ where: { machineId: machine.id } });
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, grade, imageUrl, probability, price, stock } = body;

  if (
    typeof name !== "string" ||
    !name.trim() ||
    !["COMMON", "RARE", "SUPER_RARE"].includes(grade) ||
    typeof probability !== "number" ||
    probability <= 0 ||
    typeof price !== "number" ||
    typeof stock !== "number"
  ) {
    return NextResponse.json({ error: "입력값을 확인해주세요." }, { status: 400 });
  }

  const machine = await getDefaultMachine();
  const item = await prisma.item.create({
    data: { machineId: machine.id, name, grade, imageUrl: imageUrl ?? null, probability, price, stock }
  });

  return NextResponse.json(item, { status: 201 });
}
```

- [ ] **Step 2: Create `app/admin/items/page.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";

const GRADE_LABEL: Record<string, string> = { COMMON: "일반", RARE: "레어", SUPER_RARE: "슈퍼레어" };

type Item = { id: string; name: string; grade: string; imageUrl: string | null; probability: number; price: number; stock: number };

export default function AdminItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("COMMON");
  const [probability, setProbability] = useState("0.1");
  const [price, setPrice] = useState("100");
  const [stock, setStock] = useState("100");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/admin/items");
    setItems(await res.json());
  }

  useEffect(() => {
    refresh();
  }, []);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function addItem() {
    setError(null);
    const res = await fetch("/api/admin/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        grade,
        imageUrl,
        probability: Number(probability),
        price: Number(price),
        stock: Number(stock)
      })
    });
    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "추가에 실패했어요.");
      return;
    }
    setName("");
    setImageUrl(null);
    await refresh();
  }

  return (
    <main className="flex-1 p-4 flex flex-col gap-5">
      <h1 className="font-display text-lg">아이템 관리</h1>

      <div className="flex flex-col gap-3 rounded-2xl bg-panel border border-panel-line p-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-[#1d1438] border border-dashed border-panel-line flex items-center justify-center overflow-hidden">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
            ) : (
              "🖼️"
            )}
          </div>
          <label className="text-sm text-text-dim rounded-lg border border-panel-line px-3 py-2 cursor-pointer">
            이미지 선택
            <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </label>
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="아이템 이름"
          className="rounded-lg bg-[#1d1438] border border-panel-line px-3 py-2 text-sm"
        />
        <select
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          className="rounded-lg bg-[#1d1438] border border-panel-line px-3 py-2 text-sm"
        >
          <option value="COMMON">일반</option>
          <option value="RARE">레어</option>
          <option value="SUPER_RARE">슈퍼레어</option>
        </select>
        <div className="grid grid-cols-3 gap-2">
          <input
            value={probability}
            onChange={(e) => setProbability(e.target.value)}
            placeholder="확률 (0~1)"
            className="rounded-lg bg-[#1d1438] border border-panel-line px-2 py-2 text-xs"
          />
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="가격"
            className="rounded-lg bg-[#1d1438] border border-panel-line px-2 py-2 text-xs"
          />
          <input
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            placeholder="재고"
            className="rounded-lg bg-[#1d1438] border border-panel-line px-2 py-2 text-xs"
          />
        </div>
        {error && <p className="text-sm text-pink">{error}</p>}
        <button
          onClick={addItem}
          className="font-display rounded-xl bg-gold text-[#2a1600] py-2.5 shadow-[0_5px_0_#b9740f]"
        >
          + 아이템 풀에 추가
        </button>
      </div>

      <div className="text-sm text-text-dim">등록된 아이템 {items.length}개</div>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2 rounded-xl bg-panel border border-panel-line p-2.5">
            <div className="w-11 h-11 rounded-lg bg-[#1d1438] overflow-hidden flex-shrink-0">
              {item.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-sm truncate">{item.name}</div>
              <div className="text-xs text-text-dim">{GRADE_LABEL[item.grade]}</div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Manual verification**

Open `http://localhost:3000/admin/items`, add an item with a name, an uploaded image, grade "레어", probability `0.05`, price `300`, stock `50`.
Expected: it appears immediately in the grid below; open a machine detail page and pull repeatedly (Task 8) until it's possible to see the new item show up as a pull result (probabilities are unnormalized after manual additions — that's expected for this demo tool, note it in the follow-up below).

- [ ] **Step 4: Commit**

```bash
git add app/api/admin app/admin
git commit -m "feat: add admin item management page"
```

---

## Post-implementation follow-ups (not part of this plan's scope)

- Normalize `Item.probability` across a machine automatically when items are added/removed via the admin page (currently the admin tool trusts the operator's numbers, matching the spec's "관리자 확정 필요" note).
- Gate `/admin/items` and its API behind an authenticated admin role before any real deployment — it is intentionally open in this MVP per the spec's demo scope.
- Re-encode `public/videos/pull-effect.mp4` for web delivery (compressed mp4 + webm fallback) once file size/quality trade-offs are decided.
- Replace the placeholder mascot name "가챠몽" character label if/when the user finalizes a name other than "몽글이".
