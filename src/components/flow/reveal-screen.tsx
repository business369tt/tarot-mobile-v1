"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect } from "react";
import { TarotCardBack, TarotCardFace } from "@/components/flow/tarot-card";
import { useTarotFlow } from "@/components/flow/tarot-flow-provider";
import { useLocale } from "@/components/i18n/locale-provider";
import {
  cardRoles,
  getCardDisplayMeta,
  getCardRoleDisplayMeta,
  getOrientationDisplayMeta,
} from "@/lib/mock-tarot-data";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { defaultOfficialTarotSpread } from "@/lib/tarot-spreads";

export function RevealScreen() {
  const router = useRouter();
  const { locale, t } = useLocale();
  const { selectedCards, revealedCount, revealNextCard, resetReveal } =
    useTarotFlow();
  const prefersReducedMotion = usePrefersReducedMotion();
  const requiredCards = cardRoles.length;
  const spreadName =
    locale === "zh-TW"
      ? defaultOfficialTarotSpread.nameZh
      : defaultOfficialTarotSpread.nameEn;
  const isReady = selectedCards.length === requiredCards;
  const allRevealed = isReady && revealedCount >= requiredCards;

  useEffect(() => {
    if (!isReady || allRevealed) {
      return;
    }

    const timer = window.setTimeout(
      () => {
        revealNextCard();
      },
      prefersReducedMotion
        ? revealedCount === 0
          ? 760
          : revealedCount === 1
            ? 900
            : 1040
        : revealedCount === 0
          ? 1120
          : revealedCount === 1
            ? 1380
            : 1560,
    );

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
          <p className="text-sm text-foreground/56">
            {t("快好了", "Almost there")}
          </p>
          <h1 className="max-w-[12rem] text-[2.5rem] font-semibold leading-[1.02] tracking-tight text-card-foreground">
            {locale === "zh-TW"
              ? `先完成「${spreadName}」`
              : `Complete "${spreadName}" first`}
          </h1>
          <p className="max-w-[18rem] text-base leading-7 text-foreground/62">
            {locale === "zh-TW"
              ? `先回到抽牌頁，把 ${requiredCards} 張牌選好，翻牌才會接得上。`
              : `Return to the draw page and choose ${requiredCards} cards first.`}
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
      <div className="space-y-4 pt-3">
        <span className="inline-flex items-center rounded-full border border-[#f1c98d]/18 bg-[#f1c98d]/8 px-3 py-1 text-[0.72rem] font-medium tracking-[0.18em] text-[#f3d4a7]">
          {t("翻牌時刻", "REVEAL MOMENT")}
        </span>
        <div className="space-y-3">
          <h1 className="max-w-[14rem] text-[2.7rem] font-semibold leading-[1.02] tracking-tight text-card-foreground">
            {locale === "zh-TW"
              ? `讓「${spreadName}」一張一張現身`
              : `Let "${spreadName}" appear card by card`}
          </h1>
          <p className="max-w-[18rem] text-base leading-7 text-foreground/62">
            {allRevealed
              ? t(
                  "三張牌都已經到位，現在可以把這次答案完整讀出來。",
                  "All three cards are in place now.",
                )
              : t(
                  "先不要急著解讀，讓牌自己把節奏帶出來。",
                  "Let the cards set the pace before the reading begins.",
                )}
          </p>
        </div>
      </div>

      <div className="rounded-[1.85rem] border border-white/8 bg-white/[0.04] p-5 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-card-foreground">
              {allRevealed
                ? t("牌陣已完整現身", "The spread is fully revealed")
                : t("牌正在依序翻開", "The cards are appearing in order")}
            </p>
            <p className="mt-1 text-sm leading-6 text-foreground/56">
              {allRevealed
                ? t("現況核心、隱藏阻力、最佳走向都已經明朗。", "All three positions are now visible.")
                : t("每翻開一張，答案就會更靠近一點。", "Each reveal brings the answer closer.")}
            </p>
          </div>
          <span className="rounded-full border border-[#f0cb97]/18 bg-[#f0cb97]/8 px-3 py-1.5 text-sm font-medium text-[#f3d4a7]">
            {revealedCount}/{requiredCards}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {selectedCards.map((card, index) => {
            const display = getCardRoleDisplayMeta(card.role);
            const isRevealed = index < revealedCount;

            return (
              <div
                key={card.id}
                className={`rounded-[1.25rem] border px-3 py-3 transition ${
                  isRevealed
                    ? "border-line-strong bg-brand-soft"
                    : index === revealedCount
                      ? "border-[#f0cb97]/20 bg-white/[0.05]"
                      : "border-white/10 bg-black/18"
                }`}
              >
                <p className="text-xs font-semibold text-card-foreground">
                  {locale === "zh-TW" ? display.labelZh : display.labelEn}
                </p>
                <p className="mt-2 text-[11px] leading-5 text-foreground/48">
                  {isRevealed
                    ? t("已現身", "Visible")
                    : index === revealedCount
                      ? t("即將翻開", "Next to reveal")
                      : t("等待中", "Waiting")}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[2.2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(18,23,38,0.98),rgba(8,10,16,0.98))] px-4 py-8 shadow-[var(--shadow-soft)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(185,144,93,0.15),_transparent_34%)]" />
        <svg
          aria-hidden="true"
          viewBox="0 0 600 760"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-45"
        >
          <circle cx="300" cy="292" r="184" stroke="rgba(240,203,151,0.12)" strokeWidth="1.5" />
          <circle cx="300" cy="292" r="132" stroke="rgba(240,203,151,0.14)" strokeWidth="1.2" />
          <path d="M170 430 L300 208 L430 430 Z" stroke="rgba(240,203,151,0.12)" strokeWidth="1.4" fill="none" />
          <path d="M170 430 H430" stroke="rgba(240,203,151,0.1)" strokeWidth="1.2" />
          <path d="M300 152 V468" stroke="rgba(240,203,151,0.08)" strokeWidth="1.2" />
          <circle cx="300" cy="292" r="34" stroke="rgba(240,203,151,0.16)" strokeWidth="1.4" />
          <circle cx="300" cy="292" r="8" fill="rgba(240,203,151,0.18)" />
        </svg>
        <div className="pointer-events-none absolute left-1/2 top-[39%] h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/6 motion-safe:animate-[halo-drift_8s_ease-in-out_infinite]" />
        <div className="pointer-events-none absolute left-1/2 top-[39%] h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#f0cb97]/14 motion-safe:animate-[halo-drift_6s_ease-in-out_infinite]" />
        <div className="pointer-events-none absolute left-1/2 top-[39%] h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(229,192,142,0.22),transparent_72%)] blur-xl" />

        <div className="relative mx-auto flex min-h-[22rem] max-w-[19.5rem] items-end justify-center gap-2 sm:gap-4">
          {selectedCards.map((card, index) => {
            const isRevealed = index < revealedCount;
            const roleDisplay = getCardRoleDisplayMeta(card.role);
            const cardDisplay = getCardDisplayMeta(card.id);
            const orientationDisplay = getOrientationDisplayMeta(card.orientation);
            const isCenter = index === 1;

            return (
              <div
                key={card.id}
                className={`flex w-[31%] flex-col items-center transition-[transform,opacity] duration-700 ease-[cubic-bezier(.22,1,.36,1)] ${
                  isCenter ? "-translate-y-3 sm:-translate-y-4" : "translate-y-4 sm:translate-y-6"
                } ${isRevealed ? "opacity-100" : "opacity-90"}`}
                style={{
                  transitionDelay: `${index * 120}ms`,
                }}
              >
                <div className="mb-3 text-center">
                  <p className="text-[11px] font-semibold tracking-[0.08em] text-[#f0cb97]">
                    {locale === "zh-TW" ? roleDisplay.labelZh : roleDisplay.labelEn}
                  </p>
                  <p className="mt-1 text-[10px] leading-4 text-foreground/48">
                    {isRevealed
                      ? locale === "zh-TW"
                        ? `${cardDisplay.nameZh}・${orientationDisplay.zh}`
                        : `${cardDisplay.nameEn} · ${orientationDisplay.en}`
                      : t("等待翻開", "Waiting to reveal")}
                  </p>
                </div>

                <div className="[perspective:1600px]">
                  <div
                    className={`relative transition duration-[1080ms] ease-[cubic-bezier(.22,1,.36,1)] [transform-style:preserve-3d] ${
                      isRevealed ? "[transform:rotateY(180deg)]" : ""
                    } ${isCenter ? "scale-[1.05]" : "scale-[0.97]"} ${
                      allRevealed && isCenter ? "drop-shadow-[0_24px_56px_rgba(240,203,151,0.18)]" : ""
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
              </div>
            );
          })}
        </div>

        <p className="relative mt-3 text-center text-sm leading-6 text-foreground/58">
          {allRevealed
            ? t(
                "答案已經成形，下一步就是讀取這次完整解讀。",
                "The answer has taken shape. Read it next.",
              )
            : t(
                "不用急，牌會自己把順序與重心帶出來。",
                "There is no rush. Let the cards reveal their own order.",
              )}
        </p>
      </div>

      <div className="rounded-[1.85rem] border border-white/8 bg-white/[0.04] p-5 backdrop-blur-sm">
        <h2 className="text-lg font-semibold text-card-foreground">
          {t("翻牌完成後你會看到", "What this spread is showing")}
        </h2>
        <div className="mt-4 grid gap-3">
          {selectedCards.map((card, index) => {
            const roleDisplay = getCardRoleDisplayMeta(card.role);
            const orientationDisplay = getOrientationDisplayMeta(card.orientation);
            const cardDisplay = getCardDisplayMeta(card.id);
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
                        ? locale === "zh-TW"
                          ? `${cardDisplay.nameZh}・${orientationDisplay.zh}`
                          : `${cardDisplay.nameEn} · ${orientationDisplay.en}`
                        : t("等待翻開", "Waiting to reveal")}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-foreground/42">
                    {index + 1}/{requiredCards}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-auto space-y-2">
        <button
          type="button"
          onClick={allRevealed ? handleContinue : revealNextCard}
          className="min-h-[4rem] rounded-[1.7rem] border border-[#f7d9b2]/55 bg-[linear-gradient(180deg,#f5d49f_0%,#eabf80_46%,#d89e58_100%)] px-5 py-4 text-base font-semibold text-[#1b1209] shadow-[0_18px_52px_rgba(225,166,92,0.26),inset_0_1px_0_rgba(255,255,255,0.3)] transition hover:-translate-y-px hover:brightness-[1.03]"
        >
          {allRevealed
            ? t("讀取這次答案", "Read this answer")
            : t("現在翻開下一張", "Reveal the next card")}
        </button>

        <button
          type="button"
          onClick={resetReveal}
          className="mx-auto block text-sm font-medium text-foreground/56 transition hover:text-foreground"
        >
          {t("重新翻牌", "Restart reveal")}
        </button>
      </div>
    </section>
  );
}
