import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Answer Book",
  description: "一页答案，一点星光，只为自我反思与娱乐。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-b from-zinc-950 via-black to-zinc-900 text-zinc-100`}
      >
        <div className="min-h-screen flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-xl rounded-3xl border border-zinc-800/70 bg-zinc-950/70 shadow-2xl shadow-purple-900/20 backdrop-blur-xl">
            <header className="px-6 pt-6 pb-3 border-b border-zinc-800/60">
              <h1 className="text-lg font-semibold tracking-wide text-zinc-100">
                Answer Book
              </h1>
              <p className="mt-1 text-xs text-zinc-400">
                一页答案，一点星光。仅供自我反思与娱乐，不构成任何专业建议。
              </p>
            </header>
            <main className="px-6 pb-6 pt-4">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}

