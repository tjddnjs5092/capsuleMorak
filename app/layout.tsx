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
