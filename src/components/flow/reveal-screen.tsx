"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect } from "react";
import { TarotCardBack, TarotCardFace } from "@/components/flow/tarot-card";
import { useTarotFlow } from "@/components/flow/tarot-flow-provider";
import { useLocale } from "@/components/i18n/locale-provider";
import {
  getCardRoleDisplayMeta,
  getOrientationDisplayMeta,
} from "@/lib/mock-tarot-data";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

export function RevealScreen() {
  const router = useRouter();
  const { locale, t } = useLocale();
  const { selectedCards, revealedCount, revealNextCard, resetReveal } =
    useTarotFlow();
  const prefersReducedMotion = usePrefersReducedMotion();
  const isReady = selectedCards.length === 3;
  const allRevealed = revealedCount === 3;

  useEffect(() => {
    if (!isReady || allRevealed) {
      return;
    }

    const timer = window.setTimeout(() => {
      revealNextCard();
    }, prefersReducedMotion
      ? revealedCount === 0
        ? 760
        : revealedCount === 1
          ? 900
          : 1040
      : revealedCount === 0
        ? 1120
        : revealedCount === 1
          ? 1380
          : 1560);

    return () => {
      window.clearTimeout(timer);
    };
  }, [allRevealed, isReady, prefersReducedMotion, revealNextCard, revealedCount]);

  function handleContinue() {
    if (!allRevealed) {
      return;
    }

    startTransition(() => {
      router.push("/reading");
    });
  }

  if (!isReady) {
    return (
      <section className="flex flex-1 flex-col justify-between gap-8 py-6">
        <div className="space-y-3 pt-6">
          <p className="text-sm text-foreground/56">{t("還差一步", "Almost there")}</p>
          <h1 className="max-w-[12rem] text-[2.5rem] font-semibold leading-[1.02] tracking-tight text-card-foreground">
            {t("先選滿三張牌", "Choose three cards first")}
          </h1>
          <p className="max-w-[18rem] text-base leading-7 text-foreground/62">
            {t(
              "回到抽牌頁，選好三張牌後再繼續。",
              "Return to the draw page, choose three cards, then continue.",
            )}
          </p>
        </div>

        <Link
          href="/draw"
          className="min-h-[3.75rem] rounded-[1.5rem] bg-white px-5 py-4 text-center text-base font-semibold text-black transition hover:opacity-92"
        >
          {t("回到抽牌", "Back to draw")}
        </Link>
      </section>
    );
  }

  return (
    <section className="flex flex-1 flex-col gap-5 py-6">
      <div className="space-y-3 pt-4">
        <p className="text-sm text-foreground/56">{t("第四步", "Step four")}</p>
        <h1 className="max-w-[12rem] text-[2.6rem] font-semibold leading-[1.02] tracking-tight text-card-foreground">
          {t("翻開牌面", "Reveal the spread")}
        </h1>
        <p className="max-w-[18rem] text-base leading-7 text-foreground/62">
          {allRevealed
            ? t("三張牌都準備好了。", "All three cards are ready.")
            : t("讓牌面一張一張打開。", "Let the spread turn one card at a time.")}
        </p>
      </div>

      <div className="rounded-[1.8rem] bg-white/[0.04] p-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-card-foreground">
            {t("目前進度", "Progress")}
          </h2>
          <span className="text-sm text-foreground/56">{revealedCount}/3</span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {selectedCards.map((card, index) => {
            const display = getCardRoleDisplayMeta(card.role);
            const isRevealed = index < revealedCount;

            return (
              <div
                key={card.id}
                className={`rounded-[1.2rem] border px-3 py-3 ${
                  isRevealed
                    ? "border-line-strong bg-brand-soft"
                    : "border-white/10 bg-black/18"
                }`}
              >
                <p className="text-xs font-semibold text-card-foreground">
                  {locale === "zh-TW" ? display.labelZh : display.labelEn}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(18,23,38,0.98),rgba(8,10,16,0.98))] px-4 py-6 shadow-[var(--shadow-soft)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(185,144,93,0.15),_transparent_34%)]" />

        <div className="relative grid grid-cols-3 gap-2">
          {selectedCards.map((card, index) => {
            const isRevealed = index < revealedCount;

            return (
              <div
                key={card.id}
                className={`[perspective:1600px] transition-[transform,opacity] duration-700 ease-[cubic-bezier(.22,1,.36,1)] ${
                  isRevealed
                    ? "translate-y-0 opacity-100"
                    : "translate-y-4 opacity-90"
                }`}
                style={{
                  transitionDelay: `${index * 90}ms`,
                }}
              >
                <div
                  className={`relative transition duration-[950ms] ease-[cubic-bezier(.22,1,.36,1)] [transform-style:preserve-3d] ${
                    isRevealed ? "[transform:rotateY(180deg)]" : ""
                  }`}
                >
                  <div className="[backface-visibility:hidden]">
                    <TarotCardBack order={index + 1} variant="stage" />
                  </div>
                  <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                    <TarotCardFace card={card} variant="stage" showNarrative={false} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-[1.8rem] bg-white/[0.04] p-5">
        <h2 className="text-lg font-semibold text-card-foreground">
          {t("三張牌", "Your cards")}
        </h2>
        <div className="mt-4 grid gap-3">
          {selectedCards.map((card, index) => {
            const roleDisplay = getCardRoleDisplayMeta(card.role);
            const orientationDisplay = getOrientationDisplayMeta(card.orientation);
            const isRevealed = index < revealedCount;

            return (
              <div
                key={card.id}
                className="rounded-[1.3rem] border border-white/10 bg-black/18 px-4 py-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-card-foreground">
                      {locale === "zh-TW" ? roleDisplay.labelZh : roleDisplay.labelEn}
                    </p>
                    <p className="mt-2 text-sm text-foreground/56">
                      {isRevealed
                        ? `${card.name} · ${locale === "zh-TW" ? orientationDisplay.zh : orientationDisplay.en}`
                        : t("等待翻開", "Waiting")}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-auto grid gap-3">
        <button
          type="button"
          onClick={allRevealed ? handleContinue : revealNextCard}
          className="min-h-[3.75rem] rounded-[1.5rem] bg-white px-5 py-4 text-base font-semibold text-black transition hover:opacity-92"
        >
          {allRevealed ? t("查看解讀", "Open reading") : t("翻下一張", "Reveal next")}
        </button>

        <button
          type="button"
          onClick={resetReveal}
          className="min-h-[3.75rem] rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-5 py-4 text-base font-medium text-card-foreground transition hover:border-white/16 hover:bg-white/[0.06]"
        >
          {t("重新翻牌", "Restart reveal")}
        </button>
      </div>
    </section>
  );
}
