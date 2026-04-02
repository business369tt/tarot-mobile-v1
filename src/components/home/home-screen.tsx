"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { useTarotFlow } from "@/components/flow/tarot-flow-provider";
import { useLocale } from "@/components/i18n/locale-provider";

export function HomeScreen() {
  const { isAuthenticated } = useAuth();
  const { session, ownsCurrentSession, getResumeRoute } = useTarotFlow();
  const { t } = useLocale();
  const hasCurrentReading = Boolean(session && ownsCurrentSession);
  const primaryHref = hasCurrentReading
    ? getResumeRoute()
    : isAuthenticated
      ? "/question"
      : "/auth/line";
  const primaryLabel = hasCurrentReading
    ? t("繼續上次解讀", "Continue")
    : t("開始抽牌", "Start");
  const trustCopy = isAuthenticated
    ? t("登入後的解讀會自動保存到你的紀錄。", "Your readings are saved to history.")
    : t(
        "使用 LINE 登入後即可開始，解讀也會自動保存。",
        "Sign in with LINE to start and save your readings.",
      );
  const historyCopy = hasCurrentReading
    ? t("先看保存的解讀，再決定下一步。", "Review your saved readings first.")
    : t("回到你保存過的解讀。", "See your saved readings.");

  return (
    <section className="relative flex flex-1 flex-col overflow-hidden py-6">
      <div className="pointer-events-none absolute inset-x-[-12%] top-14 h-[18rem] rounded-full bg-[radial-gradient(circle,rgba(185,144,93,0.18),rgba(185,144,93,0.03)_54%,transparent_76%)] blur-3xl" />
      <div className="pointer-events-none absolute right-[-3.5rem] top-28 h-28 w-28 rounded-full border border-white/6" />

      <div className="relative flex flex-1 flex-col justify-center gap-12 pb-8 pt-10">
        <div className="space-y-6">
          <h1 className="font-display max-w-[12rem] text-[3.45rem] leading-[0.94] tracking-[-0.04em] text-card-foreground">
            {t("開始你的塔羅解讀", "Start your tarot reading")}
          </h1>
          <p className="max-w-[17rem] text-base leading-7 text-foreground/64">
            {t(
              "輸入問題，抽三張牌，立即查看解讀。",
              "Ask a question, draw three cards, and get your reading right away.",
            )}
          </p>
        </div>

        <div className="max-w-sm space-y-4">
          <Link
            href={primaryHref}
            className="flex min-h-[4rem] items-center justify-center rounded-[1.7rem] bg-white px-5 py-4 text-base font-semibold text-black shadow-[0_24px_60px_rgba(0,0,0,0.28)] transition hover:opacity-92"
          >
            {primaryLabel}
          </Link>
          <p className="max-w-[17rem] text-sm leading-6 text-foreground/48">
            {trustCopy}
          </p>
        </div>

        {isAuthenticated ? (
          <Link
            href="/history"
            className="group max-w-sm rounded-[1.6rem] border border-white/8 bg-white/[0.03] px-5 py-4 transition hover:border-white/14 hover:bg-white/[0.05]"
          >
            <p className="text-sm text-foreground/46">{t("我的紀錄", "History")}</p>
            <div className="mt-2 flex items-center justify-between gap-4">
              <p className="text-base font-medium leading-7 text-card-foreground">
                {historyCopy}
              </p>
              <span className="text-sm text-foreground/40 transition group-hover:text-foreground/62">
                {t("查看", "Open")}
              </span>
            </div>
          </Link>
        ) : null}
      </div>
    </section>
  );
}
