"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { useTarotFlow } from "@/components/flow/tarot-flow-provider";
import { useLocale } from "@/components/i18n/locale-provider";

const spreadPoints = [
  {
    zhTitle: "現況核心",
    enTitle: "Core reality",
    zhBody: "先看清現在最重要的主軸。",
    enBody: "See the core first.",
  },
  {
    zhTitle: "隱藏阻力",
    enTitle: "Hidden resistance",
    zhBody: "看見真正拖住你的地方。",
    enBody: "Reveal what slows it down.",
  },
  {
    zhTitle: "最佳走向",
    enTitle: "Best direction",
    zhBody: "把下一步收成更清楚的方向。",
    enBody: "Move toward a clearer next step.",
  },
] as const;

const readingPromises = [
  {
    zh: "不是泛用的過去、現在、未來，而是圍繞你的問題做直答三張牌解讀。",
    en: "This is not a generic past-present-future spread.",
  },
  {
    zh: "AI 會整合牌義、正逆位與牌位關係，給出更貼近問題的解讀與建議。",
    en: "The AI combines card meaning, orientation, and spread position.",
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
    ? t("繼續這次解讀", "Continue this reading")
    : isAuthenticated
      ? t("開始直答三張牌", "Start the three-card spread")
      : t("先用 LINE 登入", "Sign in with LINE");
  const heroNote = hasCurrentReading
    ? t("從上次停下的位置繼續", "Resume from where you left off")
    : t("1 個問題，約 1 分鐘完成一次完整解讀", "A full reading in about one minute");

  return (
    <div className="flex flex-col gap-6 pb-12 pt-4">
      <section className="relative overflow-hidden rounded-[2.7rem] border border-[#f1c98d]/12 bg-[linear-gradient(180deg,#120d0a_0%,#09090d_48%,#05060a_100%)] px-5 pb-8 pt-8 shadow-[0_34px_120px_rgba(0,0,0,0.48)]">
        <div className="pointer-events-none absolute inset-x-0 top-[-5rem] h-56 bg-[radial-gradient(circle,rgba(242,188,110,0.26),rgba(242,188,110,0.04)_44%,transparent_72%)] blur-3xl" />
        <div className="pointer-events-none absolute inset-x-[8%] top-[28%] h-[22rem] rounded-full border border-[#f0cb97]/8 opacity-75 [transform:perspective(1200px)_rotateX(72deg)]" />
        <div className="pointer-events-none absolute inset-x-[20%] top-[34%] h-[18rem] rounded-full border border-[#f0cb97]/10 opacity-70 [transform:perspective(1200px)_rotateX(72deg)]" />
        <div className="pointer-events-none absolute left-[12%] top-[18%] h-1 w-1 rounded-full bg-[#f4d59f] opacity-75 shadow-[0_0_16px_rgba(244,213,159,0.7)]" />
        <div className="pointer-events-none absolute right-[18%] top-[24%] h-1 w-1 rounded-full bg-[#f4d59f] opacity-72 shadow-[0_0_16px_rgba(244,213,159,0.7)]" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <span className="inline-flex items-center rounded-full border border-[#f1c98d]/18 bg-[#f1c98d]/8 px-3 py-1 text-[0.72rem] font-medium tracking-[0.18em] text-[#f3d4a7]">
            {t("直答三張牌", "THREE CARD READING")}
          </span>

          <div className="mt-5 max-w-[18.5rem] space-y-4">
            <h1 className="font-display text-[2.8rem] leading-[0.96] tracking-[-0.05em] text-card-foreground">
              {t(
                "讓問題更快變清楚\n從這三張牌開始",
                "Make the question clearer with three cards",
              )}
            </h1>
            <p className="text-[0.98rem] leading-7 text-foreground/74">
              {t(
                "用現況核心、隱藏阻力、最佳走向，收斂你現在真正該看的答案。",
                "A focused three-card spread for clearer answers.",
              )}
            </p>
          </div>

          <div className="mt-7 flex w-full max-w-[18rem] flex-col items-center gap-3">
            <Link
              href={primaryHref}
              className="flex min-h-[4.4rem] w-full items-center justify-center rounded-[999px] border border-[#f7d9b2]/55 bg-[linear-gradient(180deg,#f5d49f_0%,#eabf80_46%,#d89e58_100%)] px-6 py-4 text-[1.08rem] font-semibold tracking-[-0.02em] text-[#1b1209] shadow-[0_18px_52px_rgba(225,166,92,0.4),inset_0_1px_0_rgba(255,255,255,0.35)] transition hover:-translate-y-px hover:brightness-[1.03] active:translate-y-px"
            >
              {primaryLabel}
            </Link>
            <p className="text-sm font-medium leading-6 text-[#f4dfbf]/76">
              {heroNote}
            </p>
          </div>

          <div className="relative mt-12 flex h-[17rem] w-full max-w-[18rem] items-end justify-center">
            <div className="pointer-events-none absolute inset-x-0 bottom-8 h-28 rounded-[999px] border border-[#f0cb97]/24 opacity-75 [transform:perspective(1200px)_rotateX(74deg)]" />
            <div className="pointer-events-none absolute inset-x-6 bottom-11 h-24 rounded-[999px] border border-[#f0cb97]/20 opacity-82 [transform:perspective(1200px)_rotateX(74deg)]" />
            <div className="pointer-events-none absolute inset-x-12 bottom-14 h-20 rounded-[999px] border border-[#f0cb97]/18 opacity-82 [transform:perspective(1200px)_rotateX(74deg)]" />
            <div className="pointer-events-none absolute inset-x-1 bottom-0 h-36 bg-[radial-gradient(circle,rgba(241,201,141,0.32),transparent_68%)] blur-2xl" />

            <div className="absolute left-[8%] bottom-14 rotate-[-10deg]">
              <TarotBackCard accent="soft" />
            </div>
            <div className="absolute bottom-20 z-10 animate-[altar-pulse_6.2s_ease-in-out_infinite]">
              <TarotBackCard accent="strong" center />
            </div>
            <div className="absolute right-[8%] bottom-14 rotate-[10deg]">
              <TarotBackCard accent="soft" />
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-2">
        {spreadPoints.map((point) => (
          <div
            key={point.zhTitle}
            className="rounded-[1.35rem] border border-white/8 bg-white/[0.04] px-3 py-4 text-center"
          >
            <p className="text-[0.98rem] font-semibold text-card-foreground">
              {t(point.zhTitle, point.enTitle)}
            </p>
            <p className="mt-2 text-[11px] leading-5 text-foreground/56">
              {t(point.zhBody, point.enBody)}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-[1.9rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] px-5 py-5 backdrop-blur-sm">
        <div className="space-y-3">
          <p className="text-sm text-foreground/46">{t("AI 解讀", "AI reading")}</p>
          {readingPromises.map((item) => (
            <p key={item.zh} className="text-sm leading-6 text-card-foreground">
              {t(item.zh, item.en)}
            </p>
          ))}
        </div>
      </section>
    </div>
  );
}

function TarotBackCard({
  accent,
  center = false,
}: Readonly<{
  accent: "soft" | "strong";
  center?: boolean;
}>) {
  const outer =
    accent === "strong"
      ? "border-[#f0cb97]/45 bg-[linear-gradient(180deg,rgba(42,24,15,0.98),rgba(18,13,17,0.98))] shadow-[0_22px_70px_rgba(0,0,0,0.45),0_0_34px_rgba(240,203,151,0.14)]"
      : "border-[#f0cb97]/28 bg-[linear-gradient(180deg,rgba(30,18,15,0.96),rgba(14,11,17,0.96))] shadow-[0_18px_54px_rgba(0,0,0,0.34)]";

  return (
    <div
      className={`relative h-[10.5rem] w-[6.35rem] overflow-hidden rounded-[1.35rem] border p-[0.28rem] ${outer} ${
        center ? "scale-[1.06]" : ""
      }`}
    >
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[1.1rem] border border-[#f0cb97]/22 bg-[radial-gradient(circle_at_top,rgba(240,203,151,0.16),transparent_28%),linear-gradient(180deg,rgba(21,15,18,1),rgba(12,11,17,1))]">
        <div className="pointer-events-none absolute inset-[0.45rem] rounded-[0.95rem] border border-[#f0cb97]/12" />
        <div className="pointer-events-none absolute inset-x-2 top-3 h-[1px] bg-[linear-gradient(90deg,transparent,rgba(240,203,151,0.22),transparent)]" />
        <div className="pointer-events-none absolute inset-x-2 bottom-3 h-[1px] bg-[linear-gradient(90deg,transparent,rgba(240,203,151,0.18),transparent)]" />
        <div className="pointer-events-none absolute left-3 top-3 h-1 w-1 rounded-full bg-[#f0cb97]/55" />
        <div className="pointer-events-none absolute right-3 top-3 h-1 w-1 rounded-full bg-[#f0cb97]/55" />
        <div className="pointer-events-none absolute left-3 bottom-3 h-1 w-1 rounded-full bg-[#f0cb97]/55" />
        <div className="pointer-events-none absolute right-3 bottom-3 h-1 w-1 rounded-full bg-[#f0cb97]/55" />

        <div className="pointer-events-none absolute h-16 w-16 rounded-full border border-[#f0cb97]/18" />
        <div className="pointer-events-none absolute h-9 w-9 rounded-full border border-[#f0cb97]/18" />
        <div className="pointer-events-none absolute h-[1px] w-14 bg-[linear-gradient(90deg,transparent,rgba(240,203,151,0.3),transparent)]" />
        <div className="pointer-events-none absolute h-14 w-[1px] bg-[linear-gradient(180deg,transparent,rgba(240,203,151,0.24),transparent)]" />

        <div className="relative flex h-8 w-8 items-center justify-center rounded-full border border-[#f0cb97]/35 bg-[radial-gradient(circle,rgba(244,213,159,0.24),rgba(244,213,159,0.04)_58%,transparent_72%)]">
          <div className="h-3.5 w-3.5 rounded-full bg-[#f4d59f] shadow-[0_0_18px_rgba(244,213,159,0.75)]" />
        </div>
      </div>
    </div>
  );
}
