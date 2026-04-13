"use client";

import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";
import { TarotCardBack, TarotCardFace } from "@/components/flow/tarot-card";
import { useTarotFlow } from "@/components/flow/tarot-flow-provider";
import { useLocale } from "@/components/i18n/locale-provider";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import {
  cardRoles,
  defaultQuestionDisplay,
  getCardRoleDisplayMeta,
} from "@/lib/mock-tarot-data";
import { defaultOfficialTarotSpread } from "@/lib/tarot-spreads";

export function DrawScreen() {
  const router = useRouter();
  const { locale, t } = useLocale();
  const {
    session,
    spreadCards,
    selectedCards,
    toggleCardSelection,
    removeSelectedCard,
    resetSelection,
    resetReveal,
  } = useTarotFlow();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isDeckReady, setIsDeckReady] = useState(false);
  const requiredCards = cardRoles.length;
  const progress = selectedCards.length;
  const isComplete = progress === requiredCards;
  const focusQuestion = session?.question.trim() || defaultQuestionDisplay.zh;
  const spreadName =
    locale === "zh-TW"
      ? defaultOfficialTarotSpread.nameZh
      : defaultOfficialTarotSpread.nameEn;

  useEffect(() => {
    let frameId = 0;

    if (prefersReducedMotion) {
      frameId = window.requestAnimationFrame(() => {
        setIsDeckReady(true);
      });

      return () => {
        window.cancelAnimationFrame(frameId);
      };
    }

    const timer = window.setTimeout(() => {
      setIsDeckReady(true);
    }, 60);

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
      window.clearTimeout(timer);
    };
  }, [prefersReducedMotion]);

  function handleContinue() {
    if (!isComplete) {
      return;
    }

    resetReveal();
    startTransition(() => {
      router.push("/reveal");
    });
  }

  return (
    <section className="flex flex-1 flex-col justify-between gap-8 py-6">
      <div className="space-y-4 pt-6">
        <span className="inline-flex items-center rounded-full border border-[#f1c98d]/18 bg-[#f1c98d]/8 px-3 py-1 text-[0.72rem] font-medium tracking-[0.18em] text-[#f3d4a7]">
          {t("開始抽牌", "DRAW THE CARDS")}
        </span>
        <h1 className="max-w-[15rem] text-[2.55rem] font-semibold leading-[1.02] tracking-tight text-card-foreground">
          {locale === "zh-TW"
            ? `依直覺完成「${spreadName}」`
            : `Complete "${spreadName}" by intuition`}
        </h1>
        <p className="max-w-[19rem] text-base leading-7 text-foreground/62">
          {isComplete
            ? t(
                "牌陣已經就位，接下來可以直接翻牌。",
                "Your spread is ready to reveal.",
              )
            : t(
                "不用想太久，先選最先把你拉住的那張牌。",
                "Choose the first card that pulls you in.",
              )}
        </p>
      </div>

      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(18,23,38,0.98),rgba(8,10,16,0.98))] px-3 py-6 shadow-[var(--shadow-soft)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(185,144,93,0.12),_transparent_30%)]" />
        <div className="pointer-events-none absolute left-1/2 top-[45%] h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/7" />
        <div className="pointer-events-none absolute left-1/2 top-[45%] h-46 w-46 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#f0cb97]/14 motion-safe:animate-[altar-pulse_4.8s_ease-in-out_infinite]" />

        <div className="relative flex items-start justify-between gap-4 px-2">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/42">
              {t("你的提問", "Your question")}
            </p>
            <p className="max-w-[14rem] text-sm leading-7 text-card-foreground">
              &ldquo;{focusQuestion}&rdquo;
            </p>
          </div>

          <span className="rounded-full border border-[#f0cb97]/18 bg-[#f0cb97]/8 px-3 py-1.5 text-sm font-medium text-[#f3d4a7]">
            {progress}/{requiredCards}
          </span>
        </div>

        <div className="relative mt-5 grid grid-cols-3 gap-2 px-1">
          {cardRoles.map((role, index) => {
            const display = getCardRoleDisplayMeta(role.role);
            const isActive = index < progress;
            const isCurrent = index === progress && !isComplete;

            return (
              <div
                key={role.role}
                className={`rounded-[1.2rem] border px-3 py-3 transition ${
                  isActive
                    ? "border-line-strong bg-brand-soft"
                    : isCurrent
                      ? "border-[#f0cb97]/24 bg-white/[0.06]"
                      : "border-white/10 bg-black/18"
                }`}
              >
                <p className="text-xs font-semibold text-card-foreground">
                  {locale === "zh-TW" ? display.labelZh : display.labelEn}
                </p>
                <p className="mt-2 text-[11px] leading-5 text-foreground/48">
                  {isActive
                    ? t("已選定", "Chosen")
                    : isCurrent
                      ? t("現在抽這張", "Now drawing")
                      : t("等待中", "Waiting")}
                </p>
              </div>
            );
          })}
        </div>

        <div className="relative h-[min(17.75rem,43svh)]">
          {spreadCards.slice(0, 9).map((card, index) => {
            const distanceFromCenter = Math.abs(index - 4);
            const isSelected = selectedCards.some(
              (selectedCard) => selectedCard.id === card.id,
            );
            const hasStartedSelection = progress > 0;
            const angle = isDeckReady ? -34 + index * 8.5 : -6 + (index - 4) * 1.4;
            const curveOffset = isDeckReady
              ? distanceFromCenter * 8.5
              : distanceFromCenter * 2.5;
            const selectedLift = isSelected ? (isComplete ? -36 : -28) : 0;
            const selectedScale = isSelected ? (isComplete ? 1.06 : 1.03) : 1;
            const isDimmed = isComplete
              ? !isSelected
              : hasStartedSelection && !isSelected;

            return (
              <button
                key={card.id}
                type="button"
                disabled={isComplete && !isSelected}
                aria-pressed={isSelected}
                onClick={() => toggleCardSelection(card.id)}
                style={{
                  left: "50%",
                  top: `${8 + curveOffset / 5}%`,
                  transform: `translateX(-50%) rotate(${angle}deg) translateY(${curveOffset + selectedLift}px) scale(${selectedScale})`,
                  transformOrigin: "bottom center",
                  zIndex: isSelected ? 40 : index + 1,
                }}
                className={`absolute transition-[transform,filter,opacity] duration-700 ease-[cubic-bezier(.22,1,.36,1)] ${
                  isComplete && !isSelected
                    ? "cursor-default opacity-18 saturate-75"
                    : isSelected
                      ? "drop-shadow-[0_22px_40px_rgba(240,203,151,0.18)]"
                      : "hover:brightness-110 active:brightness-105"
                } ${isDimmed ? "opacity-72" : "opacity-100"}`}
              >
                <TarotCardBack
                  order={index + 1}
                  variant="fan"
                  selected={isSelected}
                />
              </button>
            );
          })}
        </div>

        <p className="relative text-center text-sm text-foreground/52">
          {isComplete
            ? t("牌陣已經定下來了，下一步就是翻牌。", "The spread is set. Reveal it next.")
            : t("相信第一個拉住你的感覺。", "Trust the first feeling.")}
        </p>

        <div className="relative mt-5 grid grid-cols-3 gap-2 px-1">
          {cardRoles.map((role, slot) => {
            const card = selectedCards[slot];
            const display = getCardRoleDisplayMeta(role.role);

            if (!card) {
              const isPending = slot === progress && !isComplete;

              return (
                <div
                  key={role.role}
                  className={`rounded-[1.25rem] border px-3 py-4 ${
                    isPending
                      ? "border-[#f0cb97]/20 bg-white/[0.05]"
                      : "border-dashed border-white/10 bg-black/18"
                  }`}
                >
                  <p className="text-xs font-semibold text-card-foreground">
                    {locale === "zh-TW" ? display.labelZh : display.labelEn}
                  </p>
                  <p className="mt-3 text-[11px] leading-5 text-foreground/46">
                    {isPending
                      ? t("等待這張牌", "Waiting for this card")
                      : t("尚未選定", "Not chosen yet")}
                  </p>
                </div>
              );
            }

              return (
                <div key={card.id} className="min-w-0 space-y-2">
                  <TarotCardFace card={card} variant="compact" showNarrative={false} />
                  <button
                  type="button"
                  onClick={() => removeSelectedCard(card.id)}
                  className="w-full rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-foreground/60 transition hover:border-line-strong hover:text-card-foreground"
                >
                  {t("換牌", "Change")}
                </button>
              </div>
              );
            })}
        </div>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          disabled={!isComplete}
          onClick={handleContinue}
          className="min-h-[3.9rem] rounded-[1.6rem] bg-white px-5 py-4 text-base font-semibold text-black transition hover:opacity-92 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isComplete
            ? t("翻開牌陣", "Reveal the spread")
            : locale === "zh-TW"
              ? `再選 ${requiredCards - progress} 張牌`
              : `Choose ${requiredCards - progress} more`}
        </button>
        {progress > 0 ? (
          <button
            type="button"
            onClick={resetSelection}
            className="w-full rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07]"
          >
            {t("重新抽這三張", "Reset these cards")}
          </button>
        ) : null}
        {!isComplete ? (
          <p className="text-center text-sm leading-6 text-foreground/52">
            {t(
              "把牌位補齊後，就會進入翻牌與解讀。",
              "Reveal and reading come next.",
            )}
          </p>
        ) : null}
      </div>
    </section>
  );
}
