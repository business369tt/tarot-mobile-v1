"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { useTarotFlow } from "@/components/flow/tarot-flow-provider";
import { useLocale } from "@/components/i18n/locale-provider";

const spreadPoints = [
  {
    zhTitle: "過去",
    enTitle: "Past",
    zhBody: "回看這個問題如何一路走到現在。",
    enBody: "See how the story arrived here.",
  },
  {
    zhTitle: "現在",
    enTitle: "Present",
    zhBody: "看清目前最核心的局勢與情緒。",
    enBody: "See what matters most right now.",
  },
  {
    zhTitle: "未來",
    enTitle: "Future",
    zhBody: "理解接下來最可能展開的方向。",
    enBody: "Understand what is likely to unfold next.",
  },
] as const;

const readingPromises = [
  {
    zh: "先看清問題的根源，再進入這次牌陣的核心訊號。",
    en: "Start with the root of the question, then move into the core signal.",
  },
  {
    zh: "用三張牌整理局勢，再交給 AI 做更完整的解讀。",
    en: "Organize the spread with three cards, then turn it into a full AI reading.",
  },
  {
    zh: "讀完後還能回來續問、補點，並保留同一次解讀脈絡。",
    en: "Continue, top up, and return to the same reading thread later.",
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
    <div className="flex flex-col gap-8 pb-12 pt-2">
      <section className="relative overflow-hidden rounded-[2.7rem] border border-[#f1c98d]/12 bg-[linear-gradient(180deg,#140e0b_0%,#09090e_44%,#05060a_100%)] px-5 pb-8 pt-8 shadow-[0_34px_120px_rgba(0,0,0,0.5)]">
        <div className="pointer-events-none absolute inset-x-0 top-[-5rem] h-56 bg-[radial-gradient(circle,rgba(242,188,110,0.34),rgba(242,188,110,0.06)_44%,transparent_72%)] blur-3xl" />
        <div className="pointer-events-none absolute inset-x-[-5%] top-[22%] h-[26rem] rounded-full border border-[#f0cb97]/8 opacity-70 [transform:perspective(1200px)_rotateX(72deg)]" />
        <div className="pointer-events-none absolute inset-x-[8%] top-[28%] h-[22rem] rounded-full border border-[#f0cb97]/10 opacity-85 [transform:perspective(1200px)_rotateX(72deg)]" />
        <div className="pointer-events-none absolute inset-x-[20%] top-[34%] h-[18rem] rounded-full border border-[#f0cb97]/10 opacity-80 [transform:perspective(1200px)_rotateX(72deg)]" />
        <div className="pointer-events-none absolute left-[-8%] top-[8%] h-64 w-64 rounded-full border border-[#f0cb97]/8 opacity-45" />
        <div className="pointer-events-none absolute right-[-10%] top-[12%] h-72 w-72 rounded-full border border-[#f0cb97]/8 opacity-35" />
        <div className="pointer-events-none absolute left-[9%] top-[16%] h-1.5 w-1.5 rounded-full bg-[#f4d59f] opacity-80 shadow-[0_0_18px_rgba(244,213,159,0.9)]" />
        <div className="pointer-events-none absolute left-[18%] top-[30%] h-1 w-1 rounded-full bg-[#f4d59f] opacity-70 shadow-[0_0_18px_rgba(244,213,159,0.85)]" />
        <div className="pointer-events-none absolute right-[18%] top-[18%] h-1.5 w-1.5 rounded-full bg-[#f4d59f] opacity-85 shadow-[0_0_18px_rgba(244,213,159,0.9)]" />
        <div className="pointer-events-none absolute right-[12%] top-[44%] h-1 w-1 rounded-full bg-[#f4d59f] opacity-65 shadow-[0_0_18px_rgba(244,213,159,0.85)]" />
        <div className="pointer-events-none absolute left-[14%] bottom-[20%] h-1.5 w-1.5 rounded-full bg-[#f4d59f] opacity-75 shadow-[0_0_18px_rgba(244,213,159,0.88)]" />
        <div className="pointer-events-none absolute right-[22%] bottom-[16%] h-1 w-1 rounded-full bg-[#f4d59f] opacity-65 shadow-[0_0_18px_rgba(244,213,159,0.82)]" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <span className="inline-flex items-center rounded-full border border-[#f1c98d]/18 bg-[#f1c98d]/8 px-3 py-1 text-[0.72rem] font-medium tracking-[0.18em] text-[#f3d4a7]">
            {t("三張牌解讀", "THREE CARD READING")}
          </span>

          <div className="mt-5 max-w-[18.5rem] space-y-4">
            <h1 className="font-display text-[2.9rem] leading-[0.95] tracking-[-0.05em] text-card-foreground">
              {t(
                "現在抽三張牌\n立刻獲得 AI 深度解讀",
                "Draw three cards now and get an AI reading instantly",
              )}
            </h1>
            <p className="text-[0.98rem] leading-7 text-foreground/74">
              {t(
                "以儀式感抽牌流程結合 AI 解讀，快速看懂感情、事業與當下方向。",
                "A ritual draw flow with AI insight for love, work, and direction.",
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
            {isAuthenticated ? (
              <Link
                href="/history"
                className="inline-flex items-center gap-2 text-sm font-medium text-foreground/56 transition hover:text-foreground"
              >
                <span>{t("查看我的紀錄", "View my archive")}</span>
                <span aria-hidden="true">›</span>
              </Link>
            ) : null}
          </div>

          <div className="relative mt-12 flex h-[18rem] w-full max-w-[18.5rem] items-end justify-center">
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

          <div className="mt-6 grid w-full grid-cols-3 gap-2 text-center">
            {spreadPoints.map((point) => (
              <div key={point.zhTitle} className="space-y-1">
                <p className="text-[1.05rem] font-semibold text-[#f0cb97]">
                  {t(point.zhTitle, point.enTitle)}
                </p>
                <p className="text-xs leading-5 text-foreground/56">
                  {t(point.zhBody, point.enBody)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] px-5 py-6 backdrop-blur-sm">
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-foreground/46">{t("AI 解讀", "AI reading")}</p>
            <h2 className="text-[1.5rem] font-semibold tracking-tight text-card-foreground">
              {t("不是只抽牌，而是更快看懂自己", "Not just a draw, but a clearer answer")}
            </h2>
          </div>

          <div className="space-y-3">
            {readingPromises.map((item) => (
              <div
                key={item.zh}
                className="flex items-start gap-3 border-b border-white/6 pb-3 last:border-b-0 last:pb-0"
              >
                <span className="mt-1.5 h-2 w-2 rounded-full bg-[#f0cb97]" />
                <p className="text-sm leading-6 text-card-foreground">
                  {t(item.zh, item.en)}
                </p>
              </div>
            ))}
          </div>
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
