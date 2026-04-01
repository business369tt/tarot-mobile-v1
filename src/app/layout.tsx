import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "塔羅行動版 Tarot Mobile V1",
    template: "%s | 塔羅行動版 Tarot Mobile V1",
  },
  description:
    "以繁體中文為主的行動版塔羅解讀流程，整合 LINE 身份、點數、紀錄與 MiniMax 解讀。",
};

export const viewport: Viewport = {
  themeColor: "#07090f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant" className="h-full antialiased">
      <body className="min-h-full bg-background font-sans text-foreground">
        {children}
      </body>
    </html>
  );
}
