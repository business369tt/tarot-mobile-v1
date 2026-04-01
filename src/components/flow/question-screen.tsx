"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useDeferredValue, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useTarotFlow } from "@/components/flow/tarot-flow-provider";
import {
  defaultQuestion,
  tarotCategories,
} from "@/lib/mock-tarot-data";

const sparkPrompts = [
  "What am I not seeing clearly in this connection?",
  "What wants to shift in my work direction?",
  "Where should I stop forcing the outcome?",
];

export function QuestionScreen() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAuthenticated, isHydrated: isAuthHydrated } = useAuth();
  const {
    session,
    ownsCurrentSession,
    question,
    categoryId,
    saveToHistory,
    setQuestion,
    setCategoryId,
    setSaveToHistory,
    createSessionFromDraft,
    startNewReading,
  } = useTarotFlow();
  const previewQuestion = useDeferredValue(question.trim() || defaultQuestion);
  const selectedCategory = tarotCategories.find(
    (category) => category.id === categoryId,
  );
  const canContinue = question.trim().length > 0;

  if (!isAuthHydrated) {
    return (
      <section className="flex flex-1 flex-col justify-center gap-4 px-4 pb-5 pt-4 sm:px-5 sm:pb-6 sm:pt-5">
        <div className="rounded-[1.85rem] border border-white/10 bg-white/[0.04] p-5 shadow-[var(--shadow-soft)] sm:rounded-[2rem] sm:p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-brand-strong">
            Restoring identity
          </p>
          <h2 className="mt-4 font-display text-[2rem] leading-[0.96] text-card-foreground">
            Preparing your
            <br />
            question entry.
          </h2>
          <p className="mt-4 text-sm leading-7 text-muted">
            Holding the question surface until the current LINE profile is back
            in place.
          </p>
        </div>
      </section>
    );
  }

  if (isAuthHydrated && !isAuthenticated) {
    return (
      <section className="flex flex-1 flex-col gap-4 px-4 pb-5 pt-4 sm:gap-5 sm:px-5 sm:pb-6 sm:pt-5">
        <div className="relative overflow-hidden rounded-[1.85rem] border border-white/10 bg-[linear-gradient(180deg,rgba(21,27,41,0.98),rgba(12,15,24,0.96))] p-5 shadow-[var(--shadow-soft)] sm:rounded-[2rem] sm:p-6">
          <div className="pointer-events-none absolute right-[-3rem] top-[-4rem] h-32 w-32 rounded-full bg-[radial-gradient(circle,_rgba(185,144,93,0.18),_transparent_68%)] blur-2xl" />
          <p className="relative text-[10px] font-semibold uppercase tracking-[0.32em] text-brand-strong">
            LINE first
          </p>
          <h2 className="relative mt-4 font-display text-[2.15rem] leading-[0.92] text-card-foreground sm:text-[2.5rem] sm:leading-[0.9]">
            Let one identity
            <br />
            hold the reading.
          </h2>
          <p className="relative mt-4 max-w-[18rem] text-[13px] leading-7 text-muted sm:text-sm">
            Before the question is written, the reading is tied to one LINE
            profile so the session can stay coherent from ritual to report.
          </p>
        </div>

        <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 sm:rounded-[1.9rem] sm:p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-foreground/42">
            Why this matters
          </p>
          <div className="mt-4 grid gap-3">
            {[
              "The question, chosen cards, and final report stay attached to one person.",
              "Archive, points, and invite rewards stay attached to the same LINE profile.",
              "Refreshing or returning to the session remains stable inside the same identity.",
            ].map((line, index) => (
              <div
                key={line}
                className="rounded-[1.3rem] border border-white/10 bg-black/18 px-4 py-3"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-strong">
                  0{index + 1}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted">{line}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto grid gap-3">
          <Link
            href="/auth/line"
            className="min-h-[3.5rem] rounded-[1.35rem] border border-line-strong bg-brand px-4 py-4 text-center text-sm font-semibold leading-5 text-black transition hover:bg-brand-strong motion-reduce:transition-none sm:rounded-[1.4rem]"
          >
            Continue with LINE
          </Link>

          <Link
            href="/"
            className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 bg-white/[0.05] px-4 py-4 text-center text-sm font-semibold leading-5 text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07] motion-reduce:transition-none sm:rounded-[1.4rem]"
          >
            Back to home
          </Link>
        </div>
      </section>
    );
  }

  if (session && !ownsCurrentSession) {
    return (
      <section className="flex flex-1 flex-col gap-4 px-4 pb-5 pt-4 sm:gap-5 sm:px-5 sm:pb-6 sm:pt-5">
        <div className="relative overflow-hidden rounded-[1.85rem] border border-white/10 bg-[linear-gradient(180deg,rgba(21,27,41,0.98),rgba(12,15,24,0.96))] p-5 shadow-[var(--shadow-soft)] sm:rounded-[2rem] sm:p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-brand-strong">
            Start a fresh thread
          </p>
          <h2 className="mt-4 font-display text-[2.15rem] leading-[0.92] text-card-foreground sm:text-[2.5rem] sm:leading-[0.9]">
            This browser already
            <br />
            holds a different reading.
          </h2>
          <p className="mt-4 max-w-[18rem] text-[13px] leading-7 text-muted sm:text-sm">
            To keep ownership clear, begin a fresh question from the current
            LINE profile before opening a new session here.
          </p>
        </div>

        <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 sm:rounded-[1.9rem] sm:p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-foreground/42">
            What happens next
          </p>
          <p className="mt-3 text-sm leading-7 text-muted">
            Starting fresh clears the current browser session and keeps the new
            reading attached to the profile that is signed in now.
          </p>
        </div>

        <div className="mt-auto grid gap-3">
          <button
            type="button"
            onClick={startNewReading}
            className="min-h-[3.5rem] rounded-[1.35rem] border border-line-strong bg-brand px-4 py-4 text-sm font-semibold leading-5 text-black transition hover:bg-brand-strong motion-reduce:transition-none sm:rounded-[1.4rem]"
          >
            Clear and begin here
          </button>

          <Link
            href="/auth/line"
            className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 bg-white/[0.05] px-4 py-4 text-center text-sm font-semibold leading-5 text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07] motion-reduce:transition-none sm:rounded-[1.4rem]"
          >
            Return to LINE entry
          </Link>
        </div>
      </section>
    );
  }

  async function handleBegin() {
    if (!canContinue || isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);

      const nextSession = await createSessionFromDraft();

      if (!nextSession) {
        return;
      }

      startTransition(() => {
        router.push("/ritual");
      });
    } catch {
      return;
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="flex flex-1 flex-col gap-4 px-4 pb-5 pt-4 sm:gap-5 sm:px-5 sm:pb-6 sm:pt-5">
      <div className="relative overflow-hidden rounded-[1.85rem] border border-white/10 bg-[linear-gradient(180deg,rgba(21,27,41,0.98),rgba(12,15,24,0.96))] p-5 shadow-[var(--shadow-soft)] motion-safe:[animation:section-rise_620ms_cubic-bezier(.22,1,.36,1)] sm:rounded-[2rem] sm:p-6">
        <div className="pointer-events-none absolute right-[-3rem] top-[-4rem] h-32 w-32 rounded-full bg-[radial-gradient(circle,_rgba(185,144,93,0.18),_transparent_68%)] blur-2xl" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0))]" />

        <div className="relative">
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-brand-strong">
            Question entry
          </p>
          <h2 className="mt-4 font-display text-[2.15rem] leading-[0.92] text-card-foreground sm:text-[2.5rem] sm:leading-[0.9]">
            Name the thread
            <br />
            the cards should hold.
          </h2>
          <p className="mt-4 max-w-[18rem] text-[13px] leading-7 text-muted sm:text-sm">
            Keep the question exact. The quieter and more honest the wording
            feels here, the stronger the reading will land later.
          </p>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 motion-safe:[animation:section-rise_720ms_cubic-bezier(.22,1,.36,1)] sm:rounded-[1.9rem] sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-foreground/42">
              Question thread
            </p>
            <p className="mt-2 text-[13px] leading-6 text-muted sm:text-sm">
              Ask the one question you want this session to illuminate.
            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-foreground/54">
            {question.trim().length}/180
          </span>
        </div>

        <textarea
          value={question}
          maxLength={180}
          placeholder="Name the question you want the cards to carry tonight."
          onChange={(event) => setQuestion(event.target.value)}
          className="mt-5 h-32 w-full resize-none rounded-[1.4rem] border border-white/10 bg-black/24 px-4 py-4 text-[0.95rem] leading-7 text-card-foreground outline-none transition placeholder:text-muted/70 focus:border-line-strong sm:h-36 sm:rounded-[1.55rem] sm:leading-8"
        />

        <div className="mt-5 flex flex-wrap gap-2">
          {sparkPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => setQuestion(prompt)}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-left text-[11px] text-foreground/66 transition hover:border-line-strong hover:text-card-foreground motion-reduce:transition-none"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 motion-safe:[animation:section-rise_820ms_cubic-bezier(.22,1,.36,1)] sm:rounded-[1.9rem] sm:p-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-foreground/42">
            Session settings
          </p>
          <p className="mt-2 text-[13px] leading-6 text-muted sm:text-sm">
            Set the reading lens first, then decide whether this session should
            stay in your archive afterward.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {tarotCategories.map((category) => {
            const isActive = category.id === categoryId;

            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setCategoryId(category.id)}
                className={`rounded-[1.25rem] border p-3.5 text-left transition motion-reduce:transition-none sm:rounded-[1.4rem] sm:p-4 ${
                  isActive
                    ? "border-line-strong bg-brand-soft"
                    : "border-white/10 bg-black/18 hover:border-white/16 hover:bg-white/[0.04]"
                }`}
              >
                <p className="text-sm font-semibold text-card-foreground">
                  {category.label}
                </p>
                <p className="mt-2 text-xs leading-5 text-muted">
                  {category.description}
                </p>
              </button>
            );
          })}
        </div>

        <div className="mt-5 rounded-[1.35rem] border border-white/10 bg-black/18 p-4 sm:rounded-[1.5rem]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-strong">
                Session memory
              </p>
              <p className="mt-2 text-sm leading-6 text-muted">
                Keep this reading available in your archive after it settles.
              </p>
            </div>

            <button
              type="button"
              aria-pressed={saveToHistory}
              onClick={() => setSaveToHistory(!saveToHistory)}
              className={`relative mt-1 flex h-8 w-14 items-center rounded-full border transition motion-reduce:transition-none ${
                saveToHistory
                  ? "border-line-strong bg-brand-soft"
                  : "border-white/10 bg-black/24"
              }`}
            >
              <span
                className={`mx-1 block h-5 w-5 rounded-full bg-card-foreground transition motion-reduce:transition-none ${
                  saveToHistory ? "translate-x-6" : ""
                }`}
              />
            </button>
          </div>

          <div className="mt-4 rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-foreground/42">
              Preview
            </p>
            <p className="mt-3 text-sm leading-7 text-card-foreground">
              &ldquo;{previewQuestion}&rdquo;
            </p>
            <div className="mt-4 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-foreground/48">
              <span>{selectedCategory?.label}</span>
              <span className="h-1 w-1 rounded-full bg-white/20" />
              <span>{saveToHistory ? "History on" : "History off"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto grid gap-3 motion-safe:[animation:section-rise_920ms_cubic-bezier(.22,1,.36,1)]">
        <button
          type="button"
          onClick={() => {
            void handleBegin();
          }}
          disabled={!canContinue || isSubmitting}
          className="min-h-[3.5rem] rounded-[1.35rem] border border-line-strong bg-brand px-4 py-4 text-sm font-semibold leading-5 text-black transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none sm:rounded-[1.4rem]"
        >
          {isSubmitting ? "Opening ritual" : "Continue to ritual"}
        </button>

        <Link
          href="/"
          className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 bg-white/[0.05] px-4 py-4 text-center text-sm font-semibold leading-5 text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07] motion-reduce:transition-none sm:rounded-[1.4rem]"
        >
          Back to home
        </Link>
      </div>
    </section>
  );
}
