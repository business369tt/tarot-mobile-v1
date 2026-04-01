"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect } from "react";
import { TarotCardBack, TarotCardFace } from "@/components/flow/tarot-card";
import { useTarotFlow } from "@/components/flow/tarot-flow-provider";
import {
  getCardRoleDisplayMeta,
  getOrientationDisplayMeta,
} from "@/lib/mock-tarot-data";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

const revealRhythm = [
  "第一張翻開時，只要先接住它的開場氣氛，不急著立刻解釋。",
  "第二張牌請多停留一會，它通常會把底下真正的壓力說清楚。",
  "最後一張會把整體形狀補齊，等整個場景打開後再一起讀它。",
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
    ? "三張牌都已經翻開了。先在身體裡接住整體形狀，再打開報告。"
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
            翻牌尚未就緒
          </p>
          <h2 className="mt-4">
            <span className="block font-display text-[2rem] leading-[0.94] text-card-foreground">
              你需要先選好
              <br />
              三張牌。
            </span>
            <span className="mt-2 block text-sm leading-6 text-foreground/44">
              Three chosen cards are needed first.
            </span>
          </h2>
          <div className="mt-4 space-y-2">
            <p className="text-sm leading-7 text-muted">
              先回到抽牌畫面，讓牌陣穩定落入三個位置，再打開翻牌場景。
            </p>
            <p className="text-xs leading-6 text-foreground/42">
              Return to the draw surface and let the spread settle into its three positions before opening the reveal scene.
            </p>
          </div>
        </div>

        <Link
          href="/draw"
          className="mt-auto min-h-[3.5rem] rounded-[1.35rem] border border-line-strong bg-brand px-4 py-4 text-center text-sm font-semibold leading-5 text-black transition hover:bg-brand-strong motion-reduce:transition-none sm:rounded-[1.4rem]"
        >
          回到抽牌（Return to the draw）
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
              翻牌順序
            </p>
            <h2 className="mt-3">
              <span className="block font-display text-[1.6rem] leading-[1] text-card-foreground sm:text-[1.75rem] sm:leading-[0.98]">
                讓整個牌陣
                <br />
                慢慢翻開。
              </span>
              <span className="mt-2 block text-sm leading-6 text-foreground/44">
                Let the spread turn slowly.
              </span>
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
            const roleDisplay = getCardRoleDisplayMeta(card.role);

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
                  {roleDisplay.labelZh}
                </p>
                <p className="mt-2 text-[11px] leading-5 text-muted">
                  {isRevealed
                    ? "已翻開 / Revealed"
                    : isNext
                      ? "下一張 / Next to turn"
                      : "等待中 / Waiting"}
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
                翻牌空間
              </p>
              <p className="mt-2 text-sm leading-6 text-muted">
                {allRevealed
                  ? "三張牌已經完整展開。"
                  : `${getCardRoleDisplayMeta(nextCard?.role ?? "Threshold").labelZh} 即將翻開。`}
              </p>
            </div>

            <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-foreground/56">
              {allRevealed ? "完成 / Complete" : "依序 / In sequence"}
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
              讀牌停頓
            </p>
            <p className="mt-3 text-sm leading-7 text-card-foreground">
              {allRevealed
                ? "先用身體感受整個牌陣，再用語言閱讀它。下方報告會承接更完整的解釋。"
                : "每次翻開都先讓它停穩，再去找整體答案。這個場景的設計，就是要讓你慢下來。"}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-4 motion-safe:[animation:section-rise_900ms_cubic-bezier(.22,1,.36,1)] sm:rounded-[1.9rem] sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-strong">
              翻開順序
            </p>
            <p className="mt-2 text-sm leading-6 text-muted">
              每張牌都會保留自己的位置、牌位與正逆狀態。
            </p>
          </div>

          <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-foreground/56">
            慢讀 / Slow read
          </span>
        </div>

        <div className="mt-5 grid gap-3">
          {selectedCards.map((card, index) => {
            const isRevealed = index < revealedCount;
            const orientationDisplay = getOrientationDisplayMeta(card.orientation);
            const roleDisplay = getCardRoleDisplayMeta(card.role);

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
                      {roleDisplay.labelZh}
                    </p>
                    <p className="mt-2 text-sm text-card-foreground">
                      {isRevealed ? card.name : "等待翻開 / Waiting to turn"}
                    </p>
                    <p className="mt-2 text-[11px] leading-5 text-muted">
                      {isRevealed
                        ? roleDisplay.subtitleZh
                        : "在輪到之前，這個位置會先保持封印。 / The position remains sealed until its turn."}
                    </p>
                  </div>

                  <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-foreground/56">
                    {isRevealed
                      ? `${orientationDisplay.zh} / ${orientationDisplay.en}`
                      : "封存 / Sealed"}
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
          {allRevealed
            ? "打開報告（Open the report）"
            : "翻開下一張（Turn next card）"}
        </button>

        <button
          type="button"
          onClick={resetReveal}
          className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 bg-white/[0.05] px-4 py-4 text-sm font-semibold leading-5 text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07] motion-reduce:transition-none sm:rounded-[1.4rem]"
        >
          重新翻牌（Restart reveal）
        </button>
      </div>
    </section>
  );
}
