import type { Metadata, Viewport } from "next";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "塔羅解讀",
    template: "%s | 塔羅解讀",
  },
  description: "輸入問題、抽牌，立即查看 AI 塔羅解讀。",
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
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
