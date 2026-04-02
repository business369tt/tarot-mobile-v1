"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { useTarotFlow } from "@/components/flow/tarot-flow-provider";
import { useLocale } from "@/components/i18n/locale-provider";

export function HomeScreen() {
  const { isAuthenticated, displayName } = useAuth();
  const { session, ownsCurrentSession, getResumeRoute, startNewReading } =
    useTarotFlow();
  const { t } = useLocale();
  const hasCurrentReading = Boolean(session && ownsCurrentSession);
  const primaryHref = isAuthenticated ? "/question" : "/auth/line";
  const secondaryHref = isAuthenticated ? "/history" : "/auth/line";

  return (
    <section className="flex flex-1 flex-col justify-between gap-8 py-6">
      <div className="space-y-8 pt-6">
        <div className="space-y-3">
          <p className="text-sm text-foreground/56">
            {isAuthenticated
              ? displayName ?? t("已登入", "Signed in")
              : t("手機版", "Mobile")}
          </p>
          <h1 className="max-w-[13rem] text-[2.7rem] font-semibold leading-[1.02] tracking-tight text-card-foreground">
            {t("開始你的塔羅解讀", "Start your tarot reading")}
          </h1>
          <p className="max-w-[18rem] text-base leading-7 text-foreground/62">
            {t(
              "輸入問題、抽牌，立即查看 AI 解讀。",
              "Ask a question, draw cards, and view your AI reading right away.",
            )}
          </p>
        </div>

        <div className="grid gap-3">
          <Link
            href={primaryHref}
            className="min-h-[3.9rem] rounded-[1.6rem] bg-white px-5 py-4 text-center text-base font-semibold text-black transition hover:opacity-92"
          >
            {isAuthenticated
              ? t("開始抽牌", "Start")
              : t("登入開始", "Sign in")}
          </Link>

          <Link
            href={secondaryHref}
            className="min-h-[3.9rem] rounded-[1.6rem] border border-white/10 bg-white/[0.04] px-5 py-4 text-center text-base font-medium text-card-foreground transition hover:border-white/16 hover:bg-white/[0.06]"
          >
            {isAuthenticated
              ? t("查看紀錄", "View history")
              : t("登入保存紀錄", "Save with LINE")}
          </Link>
        </div>

        <p className="text-sm leading-6 text-foreground/50">
          {isAuthenticated
            ? t(
                "你的解讀會綁定同一個身份，之後可以回來續接。",
                "Your readings stay under one profile so you can return later.",
              )
            : t(
                "目前需要先用 LINE 登入，紀錄與點數才會保存。",
                "LINE sign-in is required before readings, history, and points can be kept.",
              )}
        </p>
      </div>

      <div className="rounded-[2rem] bg-white/[0.04] px-5 py-6">
        {hasCurrentReading ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-foreground/56">
                {t("你有一段進行中的解讀", "You have an active reading")}
              </p>
              <p className="text-xl font-semibold leading-8 text-card-foreground">
                {session?.question ||
                  t("回到上次進度", "Return to your current reading")}
              </p>
            </div>

            <div className="grid gap-3">
              <Link
                href={getResumeRoute()}
                className="min-h-[3.5rem] rounded-[1.35rem] bg-brand px-4 py-4 text-center text-sm font-semibold text-black transition hover:bg-brand-strong"
              >
                {t("繼續", "Continue")}
              </Link>
              <button
                type="button"
                onClick={startNewReading}
                className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 px-4 py-4 text-sm font-medium text-card-foreground transition hover:border-white/16 hover:bg-white/[0.05]"
              >
                {t("重新開始", "Start over")}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-foreground/56">
              {t("最短路徑", "Shortest path")}
            </p>
            <p className="max-w-[15rem] text-lg font-semibold leading-8 text-card-foreground">
              {t(
                "只要提出問題，就能開始。",
                "Just ask your question and begin.",
              )}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
