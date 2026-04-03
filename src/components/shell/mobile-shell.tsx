"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useTarotFlow } from "@/components/flow/tarot-flow-provider";
import { useLocale } from "@/components/i18n/locale-provider";

const navItems = [
  {
    href: "/",
    zh: "首頁",
    en: "Home",
    match: ["/"],
  },
  {
    href: "/question",
    zh: "抽牌",
    en: "Draw",
    match: ["/question", "/ritual", "/draw", "/reveal", "/reading", "/points"],
  },
  {
    href: "/history",
    zh: "紀錄",
    en: "History",
    match: ["/history", "/invite"],
  },
] as const;

function isActivePath(pathname: string, item: (typeof navItems)[number]) {
  return item.match.some((path) =>
    path === "/"
      ? pathname === path
      : pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function MobileShell({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const pathname = usePathname();
  const { locale, t } = useLocale();
  const { session, ownsCurrentSession, getResumeRoute } = useTarotFlow();
  const flowHref =
    session && ownsCurrentSession ? getResumeRoute() : "/question";
  const isHome = pathname === "/";
  const brandLabel = isHome ? t("塔羅 AI", "Tarot AI") : t("塔羅", "Tarot");

  return (
    <div
      className={`min-h-[100svh] text-foreground ${
        isHome
          ? "bg-[radial-gradient(circle_at_top,rgba(244,236,223,0.06),transparent_32%),radial-gradient(circle_at_50%_18%,rgba(185,144,93,0.14),transparent_26%),linear-gradient(180deg,#090a0f,#05060a)]"
          : "bg-[radial-gradient(circle_at_top,rgba(72,90,138,0.15),transparent_24%),linear-gradient(180deg,#0b0d12,#06070a)]"
      }`}
    >
      <div className="mx-auto flex min-h-[100svh] max-w-[430px] flex-col px-4 pb-4 pt-[calc(env(safe-area-inset-top)+12px)] sm:px-5">
        <header
          className={`flex items-center justify-between ${
            isHome ? "pb-1 pt-3" : "py-3"
          }`}
        >
          <Link
            href="/"
            className={`font-semibold tracking-tight text-card-foreground ${
              isHome ? "text-xl tracking-[-0.03em]" : "text-lg"
            }`}
          >
            {brandLabel}
          </Link>

          <span
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              isHome
                ? "border border-white/8 bg-white/[0.03] text-card-foreground"
                : "border border-white/10 bg-white/[0.04] text-card-foreground"
            }`}
          >
            中文
          </span>
        </header>

        <main className={`flex flex-1 flex-col ${isHome ? "pb-8" : "pb-6"}`}>
          {children}
        </main>

        <footer className="mt-auto pb-[calc(env(safe-area-inset-bottom)+6px)]">
          <nav className="grid grid-cols-3 gap-2 rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-2 backdrop-blur">
            {navItems.map((item) => {
              const href = item.href === "/question" ? flowHref : item.href;
              const isActive = isActivePath(pathname, item);

              return (
                <Link
                  key={item.href}
                  href={href}
                  className={`rounded-[1.2rem] px-3 py-3 text-center text-sm font-medium transition ${
                    isActive
                      ? "bg-white text-black"
                      : "text-foreground/56 hover:text-foreground"
                  }`}
                >
                  {locale === "zh-TW" ? item.zh : item.en}
                </Link>
              );
            })}
          </nav>
        </footer>
      </div>
    </div>
  );
}
