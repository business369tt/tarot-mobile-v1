"use client";

import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";
import { useTarotFlow } from "@/components/flow/tarot-flow-provider";
import { useLocale } from "@/components/i18n/locale-provider";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { defaultQuestionDisplay, getCategoryDisplayMeta } from "@/lib/mock-tarot-data";

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
    beginShuffle();
    setIsShuffling(true);
  }

  return (
    <section className="flex flex-1 flex-col gap-6 py-6">
      <div className="space-y-3 pt-4">
        <p className="text-sm text-foreground/56">{t("第二步", "Step two")}</p>
        <h1 className="max-w-[12rem] text-[2.6rem] font-semibold leading-[1.02] tracking-tight text-card-foreground">
          {t("準備抽牌", "Get ready to draw")}
        </h1>
        <p className="max-w-[18rem] text-base leading-7 text-foreground/62">
          {t("深呼吸一下，接著就開始。", "Take a breath. Then begin.")}
        </p>
      </div>

      <div className="rounded-[1.8rem] bg-white/[0.04] p-5">
        <p className="text-sm leading-7 text-card-foreground">&ldquo;{focusQuestion}&rdquo;</p>
        <p className="mt-3 text-sm text-foreground/56">
          {locale === "zh-TW" ? categoryDisplay.labelZh : categoryDisplay.labelEn}
        </p>
      </div>

      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(18,23,38,0.98),rgba(8,10,16,0.98))] px-5 py-8 shadow-[var(--shadow-soft)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(185,144,93,0.14),_transparent_34%)]" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/8" />

        <div className="relative flex flex-col items-center gap-6">
          <div
            className={`flex h-36 w-28 items-center justify-center rounded-[1.6rem] border border-[rgba(229,192,142,0.24)] bg-[linear-gradient(180deg,rgba(26,31,47,1),rgba(11,15,23,1))] shadow-[0_22px_46px_rgba(0,0,0,0.45)] transition duration-700 ${
              isShuffling ? "scale-[1.04] -translate-y-1" : ""
            }`}
          >
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-full border border-white/10 text-sm font-semibold tracking-[0.28em] text-brand-strong ${
                isShuffling ? "motion-safe:animate-[slow-spin_2.8s_linear_infinite]" : ""
              }`}
            >
              OM
            </div>
          </div>

          <p className="max-w-[14rem] text-center text-sm leading-7 text-foreground/62">
            {isShuffling
              ? t("正在整理牌面，準備帶你進入抽牌。", "The cards are settling into place for your draw.")
              : t("按下開始後，就會進入抽牌畫面。", "Once you begin, the draw will open right away.")}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleShuffle}
        disabled={isShuffling}
        className="mt-auto min-h-[3.75rem] rounded-[1.5rem] bg-white px-5 py-4 text-base font-semibold text-black transition hover:opacity-92 disabled:cursor-wait disabled:opacity-85"
      >
        {isShuffling ? t("正在開始", "Opening") : t("開始抽牌", "Begin")}
      </button>
    </section>
  );
}
