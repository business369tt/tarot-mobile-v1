"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect } from "react";
import { TarotCardBack, TarotCardFace } from "@/components/flow/tarot-card";
import { useTarotFlow } from "@/components/flow/tarot-flow-provider";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

const revealRhythm = [
  "The first turn sets the opening tone. Let it land before reaching for meaning.",
  "Stay with the second card a moment longer. It usually clarifies the pressure underneath.",
  "The final card completes the shape. Read the full spread only after the scene is fully open.",
];

export function RevealScreen() {
  const router = useRouter();
  const { selectedCards, revealedCount, revealNextCard, resetReveal } =
    useTarotFlow();
  const prefersReducedMotion = usePrefersReducedMotion();
  const isReady = selectedCards.length === 3;
  const allRevealed = revealedCount === 3;
  const nextCard = selectedCards[revealedCount];
  const rhythmLine = allRevealed
    ? "All three cards are now face up. Hold the full shape of the spread before opening the report."
    : revealRhythm[revealedCount] ?? revealRhythm[revealRhythm.length - 1];

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
      <section className="flex flex-1 flex-col gap-4 px-4 pb-5 pt-4 sm:gap-5 sm:px-5 sm:pb-6 sm:pt-5">
        <div className="rounded-[1.85rem] border border-white/10 bg-white/[0.04] p-5 motion-safe:[animation:section-rise_620ms_cubic-bezier(.22,1,.36,1)] sm:rounded-[2rem] sm:p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-strong">
            Reveal is waiting
          </p>
          <h2 className="mt-4 font-display text-[2rem] leading-[0.94] text-card-foreground">
            Three chosen cards
            <br />
            are needed first.
          </h2>
          <p className="mt-4 text-sm leading-7 text-muted">
            Return to the draw surface and let the spread settle into its three
            positions before opening the reveal scene.
          </p>
        </div>

        <Link
          href="/draw"
          className="mt-auto min-h-[3.5rem] rounded-[1.35rem] border border-line-strong bg-brand px-4 py-4 text-center text-sm font-semibold leading-5 text-black transition hover:bg-brand-strong motion-reduce:transition-none sm:rounded-[1.4rem]"
        >
          Return to the draw
        </Link>
      </section>
    );
  }

  return (
    <section className="flex flex-1 flex-col gap-4 px-4 pb-5 pt-4 sm:gap-5 sm:px-5 sm:pb-6 sm:pt-5">
      <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-4 motion-safe:[animation:section-rise_620ms_cubic-bezier(.22,1,.36,1)] sm:rounded-[1.9rem] sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-strong">
              Reveal sequence
            </p>
            <h2 className="mt-3 font-display text-[1.6rem] leading-[1] text-card-foreground sm:text-[1.75rem] sm:leading-[0.98]">
              Let the spread
              <br />
              turn slowly.
            </h2>
          </div>

          <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground/54">
            {revealedCount}/3
          </span>
        </div>

        <p className="mt-4 text-sm leading-7 text-muted">{rhythmLine}</p>

        <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
          {selectedCards.map((card, index) => {
            const isRevealed = index < revealedCount;
            const isNext = index === revealedCount && !allRevealed;

            return (
              <div
                key={card.id}
                className={`min-w-0 rounded-[1.1rem] border px-3 py-3 transition motion-reduce:transition-none sm:rounded-[1.2rem] ${
                  isRevealed
                    ? "border-line-strong bg-brand-soft"
                    : isNext
                      ? "border-white/14 bg-white/[0.06]"
                      : "border-white/10 bg-black/18"
                }`}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-strong">
                  {card.role}
                </p>
                <p className="mt-2 text-[11px] leading-5 text-muted">
                  {isRevealed ? "Revealed" : isNext ? "Next to turn" : "Waiting"}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[1.85rem] border border-white/10 bg-[linear-gradient(180deg,rgba(18,23,38,0.98),rgba(8,10,16,0.98))] px-4 py-6 shadow-[var(--shadow-soft)] motion-safe:[animation:section-rise_760ms_cubic-bezier(.22,1,.36,1)] sm:rounded-[2rem] sm:px-5 sm:py-7">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(185,144,93,0.15),_transparent_34%)]" />
        <div className="pointer-events-none absolute left-1/2 top-[22%] h-44 w-44 -translate-x-1/2 rounded-full border border-[rgba(229,192,142,0.12)] bg-[radial-gradient(circle,_rgba(185,144,93,0.06),_transparent_68%)] blur-[1px]" />
        <div className="pointer-events-none absolute bottom-[-3rem] left-1/2 h-28 w-64 -translate-x-1/2 rounded-full bg-[rgba(185,144,93,0.08)] blur-3xl" />

        <div className="relative">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-foreground/42">
                Turning chamber
              </p>
              <p className="mt-2 text-sm leading-6 text-muted">
                {allRevealed
                  ? "The three-card constellation is fully open."
                  : `The ${nextCard?.role.toLowerCase() ?? "next"} card is about to turn.`}
              </p>
            </div>

            <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-foreground/56">
              {allRevealed ? "complete" : "in sequence"}
            </span>
          </div>

          <div className="relative mt-6 grid grid-cols-3 gap-2 sm:mt-7 sm:gap-3">
            {selectedCards.map((card, index) => {
              const isRevealed = index < revealedCount;

              return (
                <div
                  key={card.id}
                  className={`[perspective:1600px] transition-[transform,opacity] duration-700 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none ${
                    isRevealed
                      ? "translate-y-0 opacity-100"
                      : "translate-y-4 opacity-90"
                  }`}
                  style={{
                    transitionDelay: `${index * 90}ms`,
                  }}
                >
                  <div
                    className={`relative transition duration-[950ms] ease-[cubic-bezier(.22,1,.36,1)] [transform-style:preserve-3d] motion-reduce:transition-none ${
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

          <div className="mt-5 rounded-[1.35rem] border border-white/10 bg-black/18 p-4 sm:mt-6 sm:rounded-[1.45rem]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-foreground/42">
              Reading pause
            </p>
            <p className="mt-3 text-sm leading-7 text-card-foreground">
              {allRevealed
                ? "Read the spread first with your body before reading it with language. The report below will hold the fuller interpretation."
                : "Let each turn finish before looking for the whole answer. The scene is designed to slow the reading down."}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-4 motion-safe:[animation:section-rise_900ms_cubic-bezier(.22,1,.36,1)] sm:rounded-[1.9rem] sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-strong">
              Revealed order
            </p>
            <p className="mt-2 text-sm leading-6 text-muted">
              Each card keeps its role, orientation, and reading position below.
            </p>
          </div>

          <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-foreground/56">
            Slow read
          </span>
        </div>

        <div className="mt-5 grid gap-3">
          {selectedCards.map((card, index) => {
            const isRevealed = index < revealedCount;
            const orientationLabel =
              card.orientation === "upright" ? "Upright" : "Reversed";

            return (
              <div
                key={card.id}
                className={`rounded-[1.35rem] border px-4 py-4 transition motion-reduce:transition-none ${
                  isRevealed
                    ? "border-[rgba(229,192,142,0.18)] bg-[linear-gradient(180deg,rgba(185,144,93,0.1),rgba(185,144,93,0.03))]"
                    : "border-white/10 bg-black/18"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-strong">
                      {card.role}
                    </p>
                    <p className="mt-2 text-sm text-card-foreground">
                      {isRevealed ? card.name : "Waiting to turn"}
                    </p>
                    <p className="mt-2 text-[11px] leading-5 text-muted">
                      {isRevealed ? card.roleSubtitle : "The position remains sealed until its turn."}
                    </p>
                  </div>

                  <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-foreground/56">
                    {isRevealed ? orientationLabel : "sealed"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-auto grid gap-3 motion-safe:[animation:section-rise_1020ms_cubic-bezier(.22,1,.36,1)]">
        <button
          type="button"
          onClick={allRevealed ? handleContinue : revealNextCard}
          className="min-h-[3.5rem] rounded-[1.35rem] border border-line-strong bg-brand px-4 py-4 text-sm font-semibold leading-5 text-black transition hover:bg-brand-strong motion-reduce:transition-none sm:rounded-[1.4rem]"
        >
          {allRevealed ? "Open the report" : "Turn next card"}
        </button>

        <button
          type="button"
          onClick={resetReveal}
          className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 bg-white/[0.05] px-4 py-4 text-sm font-semibold leading-5 text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07] motion-reduce:transition-none sm:rounded-[1.4rem]"
        >
          Restart reveal
        </button>
      </div>
    </section>
  );
}
