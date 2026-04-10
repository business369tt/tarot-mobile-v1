"use client";

import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";
import { useTarotFlow } from "@/components/flow/tarot-flow-provider";
import { useLocale } from "@/components/i18n/locale-provider";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import {
  defaultQuestionDisplay,
  getCategoryDisplayMeta,
} from "@/lib/mock-tarot-data";

const spreadSteps = [
  {
    zhTitle: "現況核心",
    enTitle: "Core reality",
    zhBody: "先讓問題落在你眼前真正正在發生的事。",
    enBody: "Start with what is truly happening now.",
  },
  {
    zhTitle: "隱藏阻力",
    enTitle: "Hidden resistance",
    zhBody: "再看見表面之下那股真正拖住你的力量。",
    enBody: "Then reveal the unseen resistance underneath.",
  },
  {
    zhTitle: "最佳走向",
    enTitle: "Best direction",
    zhBody: "最後把答案收斂成更清楚的下一步。",
    enBody: "End with a clearer direction for the next step.",
  },
] as const;

export function RitualScreen() {
  const router = useRouter();
  const { locale, t } = useLocale();
  const { session, sessionCategoryMeta, beginShuffle } = useTarotFlow();
  const [isShuffling, setIsShuffling] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const focusQuestion = session?.question.trim() || defaultQuestionDisplay.zh;
  const categoryDisplay = getCategoryDisplayMeta(sessionCategoryMeta.id);

  useEffect(() => {
    if (!isShuffling) {
      return;
    }

    const timer = window.setTimeout(() => {
      startTransition(() => {
        router.push("/draw");
      });
    }, prefersReducedMotion ? 900 : 1400);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isShuffling, prefersReducedMotion, router]);

  function handleShuffle() {
    if (isShuffling) {
      return;
    }

    beginShuffle();
    setIsShuffling(true);
  }

  return (
    <section className="flex flex-1 flex-col gap-5 py-6">
      <div className="space-y-4 pt-3">
        <span className="inline-flex items-center rounded-full border border-[#f1c98d]/18 bg-[#f1c98d]/8 px-3 py-1 text-[0.72rem] font-medium tracking-[0.18em] text-[#f3d4a7]">
          {t("抽牌前", "BEFORE THE DRAW")}
        </span>
        <div className="space-y-3">
          <h1 className="max-w-[14rem] text-[2.7rem] font-semibold leading-[1.02] tracking-tight text-card-foreground">
            {t("先把心慢慢放回問題上", "Settle into the question first")}
          </h1>
          <p className="max-w-[18rem] text-base leading-7 text-foreground/62">
            {t(
              "你不需要做複雜儀式，只要停一口氣，讓問題與牌位先對齊。",
              "A brief pause is enough before the draw begins.",
            )}
          </p>
        </div>
      </div>

      <div className="rounded-[1.9rem] border border-white/8 bg-white/[0.04] p-5 backdrop-blur-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/42">
          {t("這次要回答的問題", "Your question")}
        </p>
        <p className="mt-3 text-sm leading-7 text-card-foreground">
          &ldquo;{focusQuestion}&rdquo;
        </p>

        <div className="mt-4 flex flex-wrap gap-2 text-xs text-foreground/56">
          <span className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5">
            {locale === "zh-TW" ? categoryDisplay.labelZh : categoryDisplay.labelEn}
          </span>
          <span className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5">
            {t("牌陣：直答三張牌", "Spread: three-card")}
          </span>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[2.2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(18,23,38,0.98),rgba(8,10,16,0.98))] px-5 py-8 shadow-[var(--shadow-soft)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(185,144,93,0.16),_transparent_34%)]" />
        <div className="pointer-events-none absolute left-1/2 top-[42%] h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/6 motion-safe:animate-[halo-drift_8s_ease-in-out_infinite]" />
        <div className="pointer-events-none absolute left-1/2 top-[42%] h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#f0cb97]/14 motion-safe:animate-[halo-drift_6s_ease-in-out_infinite]" />
        <div className="pointer-events-none absolute left-1/2 top-[42%] h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(229,192,142,0.2),transparent_68%)] blur-xl" />

        <div className="relative flex flex-col items-center gap-6 text-center">
          <p className="max-w-[16rem] text-sm leading-7 text-foreground/64">
            {isShuffling
              ? t(
                  "牌陣正在為這個問題重新落位，接下來就會進入抽牌。",
                  "The spread is settling into place now.",
                )
              : t(
                  "當你按下開始，這次占卜就會正式進入現況核心、隱藏阻力、最佳走向。",
                  "Press start to enter the three-card spread.",
                )}
          </p>

          <button
            type="button"
            onClick={handleShuffle}
            disabled={isShuffling}
            aria-label={t("開始洗牌", "Begin the ritual")}
            className={`group relative flex h-44 w-44 items-center justify-center rounded-full border border-[#f7d9b2]/35 text-[#1b1209] shadow-[0_28px_90px_rgba(225,166,92,0.18)] transition ${
              isShuffling
                ? "cursor-wait"
                : "hover:-translate-y-0.5 hover:brightness-[1.03] active:translate-y-px"
            }`}
          >
            <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(245,212,159,0.28),rgba(234,191,128,0.12)_46%,transparent_78%)] blur-md motion-safe:animate-[orb-glow_4.4s_ease-in-out_infinite]" />
            <span className="absolute inset-[0.35rem] rounded-full border border-[#fff1d9]/20" />
            <span className="absolute inset-[0.85rem] rounded-full border border-[#fff1d9]/12" />
            <span className="absolute inset-[1.35rem] rounded-full bg-[linear-gradient(180deg,#f5d49f_0%,#eabf80_46%,#d89e58_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.36)]" />

            <span className="relative z-10 flex flex-col items-center justify-center">
              <span className="text-[0.72rem] font-semibold tracking-[0.18em] text-[#6c4725]">
                {t("直答三張牌", "THREE CARD")}
              </span>
              <span className="mt-2 text-[1.9rem] font-semibold tracking-[-0.04em]">
                {isShuffling ? t("洗牌中", "Shuffling") : t("開始", "Start")}
              </span>
            </span>
          </button>

          <p className="max-w-[15rem] text-sm leading-7 text-foreground/56">
            {isShuffling
              ? t("保持這個問題在心裡，下一步就進入抽牌。", "Hold the question for one more moment.")
              : t("點一下就開始，不用再做別的設定。", "One tap is enough to begin.")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {spreadSteps.map((step) => (
          <div
            key={step.zhTitle}
            className="rounded-[1.35rem] border border-white/8 bg-white/[0.04] px-3 py-4"
          >
            <p className="text-sm font-semibold text-card-foreground">
              {t(step.zhTitle, step.enTitle)}
            </p>
            <p className="mt-2 text-[11px] leading-5 text-foreground/56">
              {t(step.zhBody, step.enBody)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
