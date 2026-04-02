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
    <section className="flex flex-1 flex-col gap-6 py-6">
      <div className="space-y-3 pt-4">
        <p className="text-sm text-foreground/56">
          {t("抽牌前", "Before the draw")}
        </p>
        <h1 className="max-w-[13rem] text-[2.55rem] font-semibold leading-[1.02] tracking-tight text-card-foreground">
          {t("先讓牌陣安靜下來", "Let the cards settle first")}
        </h1>
        <p className="max-w-[18rem] text-base leading-7 text-foreground/62">
          {t("停一口氣，再開始抽牌。", "Pause for a breath before you draw.")}
        </p>
      </div>

      <div className="rounded-[1.8rem] border border-white/8 bg-white/[0.04] p-5 backdrop-blur-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/44">
          {t("此刻的問題", "Your question")}
        </p>
        <p className="mt-3 text-sm leading-7 text-card-foreground">
          &ldquo;{focusQuestion}&rdquo;
        </p>
        <p className="mt-4 text-sm text-foreground/56">
          {locale === "zh-TW" ? categoryDisplay.labelZh : categoryDisplay.labelEn}
        </p>
      </div>

      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(18,23,38,0.98),rgba(8,10,16,0.98))] px-5 py-10 shadow-[var(--shadow-soft)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(185,144,93,0.14),_transparent_34%)]" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-60 w-60 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/7" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#f0cb97]/14 motion-safe:animate-[altar-pulse_4.6s_ease-in-out_infinite]" />

        <div className="relative flex flex-col items-center gap-7">
          <div className="relative h-44 w-56">
            <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(229,192,142,0.18),transparent_68%)]" />

            <div
              className={`absolute left-[28%] top-[22%] rounded-[1.45rem] border border-white/10 bg-[linear-gradient(180deg,rgba(24,30,45,0.96),rgba(10,14,23,0.98))] px-4 py-7 shadow-[0_18px_48px_rgba(0,0,0,0.32)] ${
                isShuffling
                  ? "motion-safe:animate-[drift_2.8s_ease-in-out_infinite]"
                  : ""
              }`}
              style={{
                transform: isShuffling
                  ? "rotate(-12deg) translateY(-4px)"
                  : "rotate(-16deg)",
              }}
            >
              <div className="h-18 w-12 rounded-[1rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]" />
            </div>

            <div
              className={`absolute left-1/2 top-[15%] -translate-x-1/2 rounded-[1.55rem] border border-[#f0cb97]/16 bg-[linear-gradient(180deg,rgba(27,33,48,0.98),rgba(12,16,24,0.98))] px-4 py-7 shadow-[0_24px_56px_rgba(0,0,0,0.4)] ${
                isShuffling
                  ? "motion-safe:animate-[altar-pulse_3.2s_ease-in-out_infinite]"
                  : ""
              }`}
            >
              <div className="flex h-18 w-12 items-center justify-center rounded-[1rem] border border-white/10 bg-[radial-gradient(circle,rgba(229,192,142,0.15),transparent_68%)] text-sm font-semibold tracking-[0.28em] text-brand-strong">
                OM
              </div>
            </div>

            <div
              className={`absolute right-[28%] top-[22%] rounded-[1.45rem] border border-white/10 bg-[linear-gradient(180deg,rgba(24,30,45,0.96),rgba(10,14,23,0.98))] px-4 py-7 shadow-[0_18px_48px_rgba(0,0,0,0.32)] ${
                isShuffling
                  ? "motion-safe:animate-[drift_3.3s_ease-in-out_infinite]"
                  : ""
              }`}
              style={{
                transform: isShuffling
                  ? "rotate(12deg) translateY(-3px)"
                  : "rotate(16deg)",
              }}
            >
              <div className="h-18 w-12 rounded-[1rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]" />
            </div>
          </div>

          <p className="max-w-[15rem] text-center text-sm leading-7 text-foreground/64">
            {isShuffling
              ? t(
                  "牌陣正在沉靜，請跟著它的節奏。",
                  "The spread is settling into place.",
                )
              : t(
                  "按下開始後，牌會為這次提問重新排列。",
                  "The cards will align for this question as soon as you begin.",
                )}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleShuffle}
        disabled={isShuffling}
        className="mt-auto min-h-[3.9rem] rounded-[1.6rem] bg-white px-5 py-4 text-base font-semibold text-black transition hover:opacity-92 disabled:cursor-wait disabled:opacity-85"
      >
        {isShuffling
          ? t("牌陣就位中", "Preparing the spread")
          : t("開始洗牌", "Begin the ritual")}
      </button>
    </section>
  );
}
