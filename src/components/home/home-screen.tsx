"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { useTarotFlow } from "@/components/flow/tarot-flow-provider";
import { useLocale } from "@/components/i18n/locale-provider";

const steps = [
  {
    id: "01",
    zhTitle: "輸入問題",
    enTitle: "Ask",
    zhBody: "把現在最想問的事說清楚。",
    enBody: "Name the question clearly.",
  },
  {
    id: "02",
    zhTitle: "抽三張牌",
    enTitle: "Draw",
    zhBody: "跟著流程完成抽牌與翻牌。",
    enBody: "Draw and reveal three cards.",
  },
  {
    id: "03",
    zhTitle: "看懂方向",
    enTitle: "Read",
    zhBody: "立即取得 AI 深度解讀。",
    enBody: "Get an AI reading right away.",
  },
] as const;

const values = [
  {
    zh: "聚焦感情、事業與當下方向",
    en: "Clarity for love, work, and direction",
  },
  {
    zh: "用更直觀的方式讀懂牌意",
    en: "Understand the cards more intuitively",
  },
  {
    zh: "完成後可回來查看保存的解讀",
    en: "Come back to saved readings anytime",
  },
] as const;

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
    : isAuthenticated
      ? t("立即抽三張牌", "Draw three cards now")
      : t("使用 LINE 立即開始", "Start with LINE");
  const heroNote = hasCurrentReading
    ? t("從剛才的位置繼續完成解讀", "Resume from where you left off")
    : t("約 1 分鐘完成抽牌流程", "About 1 minute to finish");

  return (
    <div className="flex flex-col gap-18 pb-12 pt-3">
      <section className="relative flex min-h-[30rem] flex-col justify-center overflow-hidden">
        <div className="pointer-events-none absolute inset-x-[-8%] top-10 h-[17rem] rounded-full bg-[radial-gradient(circle,rgba(119,143,255,0.12),transparent_56%)] blur-3xl" />
        <div className="pointer-events-none absolute inset-x-[10%] top-24 h-[15rem] rounded-full bg-[radial-gradient(circle,rgba(185,144,93,0.16),rgba(185,144,93,0.02)_58%,transparent_78%)] blur-3xl" />

        <div className="pointer-events-none absolute right-[-2.5rem] top-14 h-48 w-48 rounded-full border border-white/7 opacity-70" />
        <div className="pointer-events-none absolute right-8 top-18 h-32 w-32 rounded-full border border-white/7 opacity-35" />

        <div className="pointer-events-none absolute right-6 top-24 rotate-[10deg] rounded-[1.8rem] border border-white/12 bg-white/[0.06] px-5 py-8 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-sm">
          <div className="h-20 w-12 rounded-[1rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.02))]" />
        </div>
        <div className="pointer-events-none absolute right-20 top-34 -rotate-[14deg] rounded-[1.8rem] border border-white/10 bg-white/[0.05] px-5 py-8 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-sm">
          <div className="h-20 w-12 rounded-[1rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.02))]" />
        </div>
        <div className="pointer-events-none absolute right-14 top-52 rotate-[4deg] rounded-[1.8rem] border border-[#f4d5ac]/18 bg-[linear-gradient(180deg,rgba(229,192,142,0.12),rgba(255,255,255,0.03))] px-5 py-8 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-sm">
          <div className="h-20 w-12 rounded-[1rem] border border-[#f4d5ac]/16 bg-[linear-gradient(180deg,rgba(244,213,172,0.14),rgba(255,255,255,0.03))]" />
        </div>

        <div className="relative max-w-[18.5rem] space-y-6">
          <div className="space-y-3">
            <h1 className="font-display text-[2.9rem] leading-[0.96] tracking-[-0.045em] text-card-foreground">
              {t(
                "現在抽三張牌，立刻獲得 AI 深度解讀",
                "Draw three cards now and get an AI reading instantly",
              )}
            </h1>
            <p className="max-w-[17rem] text-[0.97rem] leading-6 text-foreground/74">
              {t(
                "以儀式感抽牌流程結合 AI 解讀，快速看懂感情、事業與當下方向。",
                "A ritual draw flow with AI insight for love, work, and direction.",
              )}
            </p>
          </div>

          <div className="max-w-[16.5rem] space-y-3">
            <Link
              href={primaryHref}
              className="flex min-h-[4.35rem] items-center justify-center rounded-[1.85rem] border border-[#f7d8ad]/60 bg-[linear-gradient(180deg,#f8d7a7_0%,#ebc187_46%,#ddaa67_100%)] px-5 py-4 text-[1.05rem] font-semibold tracking-[-0.01em] text-[#17120b] shadow-[0_18px_56px_rgba(221,170,103,0.34),inset_0_1px_0_rgba(255,255,255,0.36)] transition hover:-translate-y-px hover:brightness-[1.03] active:translate-y-px"
            >
              {primaryLabel}
            </Link>
            <p className="text-sm font-medium leading-6 text-foreground/82">
              {heroNote}
            </p>
            {isAuthenticated ? (
              <Link
                href="/history"
                className="inline-flex w-fit items-center gap-2 text-sm font-medium text-foreground/56 transition hover:text-foreground"
              >
                <span>{t("查看我的紀錄", "View history")}</span>
                <span aria-hidden="true">›</span>
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-foreground/46">{t("三步完成", "Three steps")}</p>
          <h2 className="text-[1.45rem] font-semibold tracking-tight text-card-foreground">
            {t("把開始這件事變得更簡單", "A simpler way to begin")}
          </h2>
        </div>

        <div className="grid gap-3">
          {steps.map((step) => (
            <div
              key={step.id}
              className="rounded-[1.6rem] border border-white/8 bg-white/[0.04] px-4 py-4 backdrop-blur-sm"
            >
              <div className="flex items-start gap-4">
                <div className="pt-0.5 text-sm font-semibold text-[#f0cb97]">
                  {step.id}
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-medium text-card-foreground">
                    {t(step.zhTitle, step.enTitle)}
                  </h3>
                  <p className="text-sm leading-6 text-foreground/62">
                    {t(step.zhBody, step.enBody)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-foreground/46">{t("AI 解讀", "AI reading")}</p>
          <h2 className="text-[1.45rem] font-semibold tracking-tight text-card-foreground">
            {t("不是只抽牌，而是更快看懂自己", "Not just cards, but clearer insight")}
          </h2>
        </div>

        <div className="rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] px-5 py-5 backdrop-blur-sm">
          <div className="space-y-3">
            {values.map((value) => (
              <div
                key={value.zh}
                className="flex items-start gap-3 border-b border-white/6 pb-3 last:border-b-0 last:pb-0"
              >
                <span className="mt-1 h-2 w-2 rounded-full bg-[#f0cb97]" />
                <p className="text-sm leading-6 text-card-foreground">
                  {t(value.zh, value.en)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/8 bg-white/[0.04] px-5 py-6 backdrop-blur-sm">
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-foreground/46">{t("現在開始", "Start now")}</p>
            <h2 className="text-[1.45rem] font-semibold tracking-tight text-card-foreground">
              {t("把問題交給塔羅，讓 AI 幫你看得更清楚", "Bring your question to the cards")}
            </h2>
          </div>

          <Link
            href={primaryHref}
            className="flex min-h-[4rem] items-center justify-center rounded-[1.65rem] bg-white px-5 py-4 text-base font-semibold text-black transition hover:opacity-92"
          >
            {primaryLabel}
          </Link>
        </div>
      </section>
    </div>
  );
}
