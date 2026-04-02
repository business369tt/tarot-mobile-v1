"use client";

import { useRouter } from "next/navigation";
import { startTransition } from "react";
import { TarotCardBack, TarotCardFace } from "@/components/flow/tarot-card";
import { useTarotFlow } from "@/components/flow/tarot-flow-provider";
import { useLocale } from "@/components/i18n/locale-provider";
import {
  cardRoles,
  defaultQuestionDisplay,
  getCardRoleDisplayMeta,
} from "@/lib/mock-tarot-data";

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
  const progress = selectedCards.length;
  const isComplete = progress === 3;
  const focusQuestion = session?.question.trim() || defaultQuestionDisplay.zh;

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
    <section className="flex flex-1 flex-col gap-5 py-6">
      <div className="space-y-3 pt-4">
        <p className="text-sm text-foreground/56">{t("第三步", "Step three")}</p>
        <h1 className="max-w-[12rem] text-[2.6rem] font-semibold leading-[1.02] tracking-tight text-card-foreground">
          {t("選三張牌", "Choose three cards")}
        </h1>
        <p className="max-w-[18rem] text-base leading-7 text-foreground/62">
          {t("跟著第一直覺選。", "Follow the first card that catches you.")}
        </p>
      </div>

      <div className="rounded-[1.8rem] bg-white/[0.04] p-5">
        <p className="text-sm leading-7 text-card-foreground">&ldquo;{focusQuestion}&rdquo;</p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {cardRoles.map((role, index) => {
            const display = getCardRoleDisplayMeta(role.role);
            const isActive = index < progress;

            return (
              <div
                key={role.role}
                className={`rounded-[1.15rem] border px-3 py-3 ${
                  isActive
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
        <p className="mt-4 text-sm text-foreground/56">
          {t(`已選 ${progress} / 3`, `${progress} / 3 selected`)}
        </p>
      </div>

      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(18,23,38,0.98),rgba(8,10,16,0.98))] px-3 py-5 shadow-[var(--shadow-soft)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(185,144,93,0.12),_transparent_30%)]" />
        <div className="relative h-[min(16.5rem,41svh)]">
          {spreadCards.slice(0, 9).map((card, index) => {
            const angle = -35 + index * 8.75;
            const curveOffset = Math.abs(index - 4) * 9;
            const isSelected = selectedCards.some(
              (selectedCard) => selectedCard.id === card.id,
            );
            const selectedLift = isSelected ? -24 : 0;

            return (
              <button
                key={card.id}
                type="button"
                disabled={isComplete && !isSelected}
                onClick={() => toggleCardSelection(card.id)}
                style={{
                  left: "50%",
                  top: `${6 + curveOffset / 5}%`,
                  transform: `translateX(-50%) rotate(${angle}deg) translateY(${curveOffset + selectedLift}px)`,
                  transformOrigin: "bottom center",
                  zIndex: isSelected ? 40 : index + 1,
                }}
                className={`absolute transition-[transform,filter,opacity] duration-500 ease-[cubic-bezier(.22,1,.36,1)] ${
                  isComplete && !isSelected
                    ? "cursor-default opacity-30"
                    : "hover:brightness-110"
                }`}
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
      </div>

      <div className="rounded-[1.8rem] bg-white/[0.04] p-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-card-foreground">
            {t("目前選擇", "Selected cards")}
          </h2>
          <button
            type="button"
            onClick={resetSelection}
            className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-medium text-foreground/60 transition hover:border-line-strong hover:text-card-foreground"
          >
            {t("清空", "Clear")}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {cardRoles.map((role, slot) => {
            const card = selectedCards[slot];
            const display = getCardRoleDisplayMeta(role.role);

            if (!card) {
              return (
                <div
                  key={role.role}
                  className="rounded-[1.2rem] border border-dashed border-white/10 bg-black/18 px-3 py-4"
                >
                  <p className="text-xs font-semibold text-card-foreground">
                    {locale === "zh-TW" ? display.labelZh : display.labelEn}
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
                  {t("移除", "Remove")}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        disabled={!isComplete}
        onClick={handleContinue}
        className="mt-auto min-h-[3.75rem] rounded-[1.5rem] bg-white px-5 py-4 text-base font-semibold text-black transition hover:opacity-92 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {t("下一步", "Continue")}
      </button>
    </section>
  );
}
