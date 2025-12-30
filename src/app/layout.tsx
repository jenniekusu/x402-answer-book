import type { Metadata } from "next";
import { AppProviders } from "@/components/AppProviders";

import { hangyaku, notoSerif } from "@/lib/fonts";
import { ConnectButton } from "@rainbow-me/rainbowkit";

import "./globals.css";

export const metadata: Metadata = {
  title: "Answer Book",
  description:
    "A page of answers, a glimmer of starlight, just for self-reflection and entertainment.",
  icons: { icon: "/logo.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${notoSerif.variable} ${hangyaku.variable} min-h-screen antialiased text-zinc-100`}
      >
        <AppProviders>
          <div className="relative min-h-screen w-full">
            <div className="absolute right-6 top-6 z-50">
              <ConnectButton
                chainStatus={{ smallScreen: "none", largeScreen: "none" }}
                showBalance={false}
                accountStatus={{
                  smallScreen: "avatar",
                  largeScreen: "full",
                }}
              />
            </div>

            <main className="min-h-screen w-full">{children}</main>
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
