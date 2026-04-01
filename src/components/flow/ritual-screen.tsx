"use client";

import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";
import { useTarotFlow } from "@/components/flow/tarot-flow-provider";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { defaultQuestionDisplay, getCategoryDisplayMeta } from "@/lib/mock-tarot-data";

export function RitualScreen() {
  const router = useRouter();
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
    }, prefersReducedMotion ? 920 : 1450);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isShuffling, prefersReducedMotion, router]);

  function handleShuffle() {
    beginShuffle();
    setIsShuffling(true);
  }

  return (
    <section className="flex flex-1 flex-col gap-4 px-4 pb-5 pt-4 sm:gap-5 sm:px-5 sm:pb-6 sm:pt-5">
      <div className="rounded-[1.7rem] border border-white/10 bg-white/[0.04] p-4 motion-safe:[animation:section-rise_620ms_cubic-bezier(.22,1,.36,1)] sm:rounded-[1.85rem] sm:p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-strong">
          收攏焦點
        </p>
        <p className="mt-4 text-sm leading-7 text-card-foreground">
          &ldquo;{focusQuestion}&rdquo;
        </p>
        <div className="mt-4 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-foreground/48">
          <span>{`${categoryDisplay.labelZh} / ${categoryDisplay.labelEn}`}</span>
          <span className="h-1 w-1 rounded-full bg-white/20" />
          <span>三張牌陣 / Three-card spread</span>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[1.85rem] border border-white/10 bg-[linear-gradient(180deg,rgba(18,23,38,0.98),rgba(8,10,16,0.98))] px-4 py-6 shadow-[var(--shadow-soft)] motion-safe:[animation:section-rise_760ms_cubic-bezier(.22,1,.36,1)] sm:rounded-[2rem] sm:px-5 sm:py-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(185,144,93,0.14),_transparent_34%)]" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-60 w-60 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(229,192,142,0.12)] bg-[radial-gradient(circle,_rgba(185,144,93,0.06),_transparent_68%)]" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/8 motion-safe:animate-[slow-spin_24s_linear_infinite]" />

        <div className="relative flex flex-col items-center">
          <div className="relative mt-2 h-[min(17rem,43svh)] w-full sm:h-[18.5rem]">
            <div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/8 bg-[radial-gradient(circle,_rgba(255,255,255,0.02),_transparent_72%)]" />
            <div
              className={`absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(229,192,142,0.16)] ${
                isShuffling
                  ? "motion-safe:animate-[altar-pulse_2.8s_ease-in-out_infinite]"
                  : "motion-safe:animate-[altar-pulse_5.8s_ease-in-out_infinite]"
              }`}
            />

            <div className="absolute left-[18%] top-[26%] h-4 w-4 rounded-full bg-brand/50 blur-[1px] motion-safe:animate-[drift_6s_ease-in-out_infinite]" />
            <div className="absolute right-[20%] top-[30%] h-3.5 w-3.5 rounded-full bg-white/40 blur-[1px] motion-safe:animate-[drift_7.5s_ease-in-out_infinite]" />
            <div className="absolute bottom-[18%] left-[50%] h-4 w-4 -translate-x-1/2 rounded-full bg-[rgba(121,152,255,0.5)] blur-[1px] motion-safe:animate-[drift_8s_ease-in-out_infinite]" />

            <div
              className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition duration-700 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none ${
                isShuffling ? "scale-[1.04] -translate-y-[52%]" : ""
              }`}
            >
              <div className="relative h-32 w-24 rounded-[1.4rem] border border-[rgba(229,192,142,0.2)] bg-[linear-gradient(180deg,rgba(26,31,47,1),rgba(11,15,23,1))] shadow-[0_22px_46px_rgba(0,0,0,0.45)]">
                <div
                  className={`absolute inset-3 rounded-[1rem] border border-white/10 bg-[radial-gradient(circle,_rgba(185,144,93,0.18),_transparent_68%)] ${
                    isShuffling ? "motion-safe:animate-[drift_1.9s_ease-in-out_infinite]" : ""
                  }`}
                />
                <div className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 text-xs font-semibold tracking-[0.34em] text-brand-strong">
                  OM
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-[16.5rem] text-center sm:max-w-[17rem]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-foreground/42">
              儀式方向
            </p>
            <p className="mt-3 text-sm leading-7 text-muted">
              {isShuffling
                ? "先待在這個停頓裡。牌組正在慢慢鬆開，準備落成牌陣。"
                : "在請牌回答之前，先讓問題在身體裡沉一下。"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 rounded-[1.7rem] border border-white/10 bg-white/[0.04] p-4 motion-safe:[animation:section-rise_900ms_cubic-bezier(.22,1,.36,1)] sm:rounded-[1.85rem] sm:p-5">
        {[
          "呼吸比你平常再慢一點。",
          "讓問題裡最重的那個字先浮出來。",
          "只有當整個空間比剛才更安靜時，再開始。",
        ].map((line, index) => (
          <div
            key={line}
            className="flex items-start gap-3 rounded-[1.3rem] border border-white/8 bg-black/18 px-4 py-3"
          >
            <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-strong">
              0{index + 1}
            </span>
            <p className="text-sm leading-6 text-foreground/76">{line}</p>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleShuffle}
        disabled={isShuffling}
        className="mt-auto min-h-[3.5rem] rounded-[1.35rem] border border-line-strong bg-brand px-4 py-4 text-sm font-semibold leading-5 text-black transition hover:bg-brand-strong disabled:cursor-wait disabled:opacity-85 motion-reduce:transition-none motion-safe:[animation:section-rise_1020ms_cubic-bezier(.22,1,.36,1)] sm:rounded-[1.4rem]"
      >
        {isShuffling
          ? "牌組正在移動（Deck in motion）"
          : "開始洗牌（Begin shuffling）"}
      </button>
    </section>
  );
}
