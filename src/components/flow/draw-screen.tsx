"use client";

import { useRouter } from "next/navigation";
import { startTransition } from "react";
import { TarotCardBack, TarotCardFace } from "@/components/flow/tarot-card";
import { useTarotFlow } from "@/components/flow/tarot-flow-provider";
import { cardRoles, defaultQuestion } from "@/lib/mock-tarot-data";

export function DrawScreen() {
  const router = useRouter();
  const {
    session,
    sessionCategoryMeta,
    spreadCards,
    selectedCards,
    toggleCardSelection,
    removeSelectedCard,
    resetSelection,
    resetReveal,
  } = useTarotFlow();
  const progress = selectedCards.length;
  const isComplete = progress === 3;
  const focusQuestion = session?.question.trim() || defaultQuestion;

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
    <section className="flex flex-1 flex-col gap-4 px-4 pb-5 pt-4 sm:gap-5 sm:px-5 sm:pb-6 sm:pt-5">
      <div className="rounded-[1.7rem] border border-white/10 bg-white/[0.04] p-4 motion-safe:[animation:section-rise_620ms_cubic-bezier(.22,1,.36,1)] sm:rounded-[1.85rem] sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-strong">
              Draw the spread
            </p>
            <p className="mt-3 text-sm leading-7 text-card-foreground">
              &ldquo;{focusQuestion}&rdquo;
            </p>
          </div>

          <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground/54">
            {sessionCategoryMeta.label}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 sm:mt-6 sm:gap-3">
          {cardRoles.map((role, index) => {
            const isActive = index < progress;

            return (
              <div
                key={role.role}
                className={`min-w-0 rounded-[1.1rem] border px-3 py-3 sm:rounded-[1.2rem] ${
                  isActive
                    ? "border-line-strong bg-brand-soft"
                    : "border-white/10 bg-black/18"
                }`}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-strong">
                  0{index + 1}
                </p>
                <p className="mt-2 text-[13px] font-semibold text-card-foreground sm:text-sm">
                  {role.role}
                </p>
                <p className="mt-1 text-[11px] leading-5 text-muted">
                  {role.roleSubtitle}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex items-center justify-between text-[11px] uppercase tracking-[0.22em] text-foreground/46">
          <span>Choose three cards that hold your gaze</span>
          <span>{progress}/3</span>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[1.85rem] border border-white/10 bg-[linear-gradient(180deg,rgba(18,23,38,0.98),rgba(8,10,16,0.98))] px-3 py-5 shadow-[var(--shadow-soft)] motion-safe:[animation:section-rise_760ms_cubic-bezier(.22,1,.36,1)] sm:rounded-[2rem] sm:px-4 sm:py-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(185,144,93,0.12),_transparent_30%)]" />
        <div className="relative h-[min(16.5rem,41svh)] sm:h-[19rem]">
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
                className={`absolute transition-[transform,filter,opacity] duration-500 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none ${
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

        <div className="relative mt-4 rounded-[1.35rem] border border-white/10 bg-black/18 p-4 sm:mt-5 sm:rounded-[1.45rem]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-foreground/42">
            Drawing note
          </p>
          <p className="mt-3 text-sm leading-6 text-muted">
            Do not scan for the best-looking card. Pause over the ones that
            feel quieter, heavier, or harder to ignore.
          </p>
        </div>
      </div>

      <div className="rounded-[1.7rem] border border-white/10 bg-white/[0.04] p-4 motion-safe:[animation:section-rise_900ms_cubic-bezier(.22,1,.36,1)] sm:rounded-[1.85rem] sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-strong">
              Chosen spread
            </p>
            <p className="mt-2 text-sm leading-6 text-muted">
              Each selected card settles into the reading order below.
            </p>
          </div>

          <button
            type="button"
            onClick={resetSelection}
            className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground/56 transition hover:border-line-strong hover:text-card-foreground motion-reduce:transition-none"
          >
            Clear
          </button>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
          {cardRoles.map((role, slot) => {
            const card = selectedCards[slot];

            if (!card) {
              return (
                <div
                  key={role.role}
                  className="min-w-0 rounded-[1.2rem] border border-dashed border-white/10 bg-black/18 px-3 py-4 sm:rounded-[1.35rem]"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/38">
                    {role.role}
                  </p>
                  <p className="mt-3 text-[11px] leading-5 text-muted">
                    Waiting for a card to be drawn into place.
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
                  className="w-full rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/56 transition hover:border-line-strong hover:text-card-foreground motion-reduce:transition-none sm:tracking-[0.2em]"
                >
                  Release
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
        className="mt-auto min-h-[3.5rem] rounded-[1.35rem] border border-line-strong bg-brand px-4 py-4 text-sm font-semibold leading-5 text-black transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none motion-safe:[animation:section-rise_1040ms_cubic-bezier(.22,1,.36,1)] sm:rounded-[1.4rem]"
      >
        Continue to reveal
      </button>
    </section>
  );
}
