"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useEffectEvent, useState } from "react";
import { ReadingFollowupPanel } from "@/components/flow/reading-followup-panel";
import { TarotCardFace } from "@/components/flow/tarot-card";
import { useTarotFlow } from "@/components/flow/tarot-flow-provider";
import { defaultQuestion } from "@/lib/mock-tarot-data";
import {
  buildReadingSections,
  readingFailureMessage,
  readingNeedsRevealMessage,
  type ReadingRecord,
  type ReadingRecordStatus,
} from "@/lib/reading-record";

type PointsState = {
  available: number;
  required: number;
  topUpHref: string;
};

type CurrentReadingApiResponse = {
  reading: ReadingRecord | null;
  message?: string | null;
  points?: PointsState | null;
};

type ReadingViewStatus = ReadingRecordStatus | "needs_points";

type ReadingScreenState = {
  sessionId: string | null;
  status: ReadingViewStatus;
  record: ReadingRecord | null;
  errorMessage: string | null;
  pointsState: PointsState | null;
};

async function requestCurrentReading(method: "GET" | "POST", force = false) {
  const response = await fetch("/api/reading/current", {
    method,
    cache: "no-store",
    headers: method === "POST" ? { "Content-Type": "application/json" } : undefined,
    body: method === "POST" ? JSON.stringify({ force }) : undefined,
  });
  const data = (await response
    .json()
    .catch(() => ({ reading: null, message: readingFailureMessage }))) as CurrentReadingApiResponse;

  return { status: response.status, data };
}

function getStatusLabel(status: ReadingViewStatus) {
  if (status === "ready") return "Ready";
  if (status === "needs_points") return "Points";
  if (status === "failed") return "Retry";
  return "Generating";
}

export function ReadingScreen() {
  const router = useRouter();
  const { session, sessionCategoryMeta, selectedCards, startNewReading } = useTarotFlow();
  const reportCards = selectedCards;
  const focusQuestion = session?.question.trim() || defaultQuestion;
  const trioLine = reportCards.map((card) => card.name).join(" / ");
  const historyLabel = session?.saveToHistory ? "History on" : "History off";
  const sessionId = session?.sessionId ?? null;
  const isSpreadReady = Boolean(session && selectedCards.length === 3 && session.revealed >= 3);
  const [viewState, setViewState] = useState<ReadingScreenState>({
    sessionId,
    status: "idle",
    record: null,
    errorMessage: null,
    pointsState: null,
  });
  const state =
    viewState.sessionId === sessionId
      ? viewState
      : { sessionId, status: "idle" as ReadingViewStatus, record: null, errorMessage: null, pointsState: null };
  const { status, record, errorMessage, pointsState } = state;
  const activeReading = record?.fullReading ?? null;
  const readingSections = record ? buildReadingSections(record) : [];
  const cadenceLine =
    activeReading?.progression ||
    "The report is being shaped from the revealed spread and the question that brought it here.";
  const constellationLine =
    activeReading?.constellationLine ||
    (trioLine
      ? `${trioLine} form the tonal spine of this reading. Let their order matter as much as their individual meanings.`
      : "The chosen spread will settle into a single line once the report is ready.");
  const heroTitle =
    status === "ready"
      ? "The spread has\nsettled into view."
      : status === "needs_points"
        ? "You are one step\nfrom the full answer."
        : status === "failed"
          ? "The report slipped\nout of focus."
          : "The report is\nsettling into view.";
  const heroBody =
    status === "ready"
      ? activeReading?.reportSubtitle ||
        "Read this slowly. The report is structured in a quieter rhythm, not as a dense wall of explanation."
      : status === "needs_points"
        ? "Add points once here, then return directly to this reading and let the report continue from the same place."
        : status === "failed"
          ? errorMessage || readingFailureMessage
          : "The reading is being composed from your question, category, and the three cards you revealed.";
  const cadenceCopy =
    status === "ready"
      ? activeReading?.spreadAxis || cadenceLine
      : status === "needs_points"
        ? "The spread is already complete. It only needs the reading balance restored before the final interpretation can open."
        : status === "failed"
          ? "The cards are still intact. Try composing the report again when you are ready."
          : "The report is aligning the three-card movement into a complete reading before it opens below.";

  async function runGenerateReading(force = false, canUpdate: () => boolean = () => true) {
    if (!canUpdate() || !sessionId) return;
    setViewState({ sessionId, status: "generating", record, errorMessage: null, pointsState: null });
    const response = await requestCurrentReading("POST", force);
    if (!canUpdate()) return;
    const nextRecord = response.data.reading;

    if (nextRecord?.status === "ready") return setViewState({ sessionId, status: "ready", record: nextRecord, errorMessage: null, pointsState: null });
    if (nextRecord?.status === "generating") return setViewState({ sessionId, status: "generating", record: nextRecord, errorMessage: null, pointsState: null });
    if (nextRecord?.status === "failed") return setViewState({ sessionId, status: "failed", record: nextRecord, errorMessage: nextRecord.errorMessage || response.data.message || readingFailureMessage, pointsState: null });
    if (response.status === 402) return setViewState({ sessionId, status: "needs_points", record: null, errorMessage: response.data.message || null, pointsState: response.data.points ?? null });
    if (response.status === 409) return setViewState({ sessionId, status: "failed", record: null, errorMessage: response.data.message || readingNeedsRevealMessage, pointsState: null });
    setViewState({ sessionId, status: "failed", record: nextRecord ?? null, errorMessage: response.data.message || readingFailureMessage, pointsState: null });
  }

  const generateReading = useEffectEvent(runGenerateReading);

  useEffect(() => {
    if (!sessionId || !isSpreadReady) return;
    let active = true;

    async function bootstrapReading() {
      const response = await requestCurrentReading("GET");
      if (!active) return;
      const nextRecord = response.data.reading;
      if (nextRecord?.status === "ready") return setViewState({ sessionId, status: "ready", record: nextRecord, errorMessage: null, pointsState: null });
      if (nextRecord?.status === "failed") return setViewState({ sessionId, status: "failed", record: nextRecord, errorMessage: nextRecord.errorMessage || response.data.message || readingFailureMessage, pointsState: null });
      if (nextRecord?.status === "generating") return setViewState({ sessionId, status: "generating", record: nextRecord, errorMessage: null, pointsState: null });
      if (response.status === 402) return setViewState({ sessionId, status: "needs_points", record: null, errorMessage: response.data.message || null, pointsState: response.data.points ?? null });
      if (response.status === 409) return setViewState({ sessionId, status: "failed", record: null, errorMessage: response.data.message || readingNeedsRevealMessage, pointsState: null });
      await generateReading(false, () => active);
    }

    void bootstrapReading();
    return () => {
      active = false;
    };
  }, [isSpreadReady, sessionId]);

  useEffect(() => {
    if (status !== "generating" || !sessionId) return;
    let active = true;
    const intervalId = window.setInterval(async () => {
      const response = await requestCurrentReading("GET");
      if (!active) return;
      const nextRecord = response.data.reading;
      if (nextRecord?.status === "ready") {
        setViewState({ sessionId, status: "ready", record: nextRecord, errorMessage: null, pointsState: null });
        return window.clearInterval(intervalId);
      }
      if (nextRecord?.status === "failed") {
        setViewState({ sessionId, status: "failed", record: nextRecord, errorMessage: nextRecord.errorMessage || response.data.message || readingFailureMessage, pointsState: null });
        return window.clearInterval(intervalId);
      }
      if (response.status === 402) {
        setViewState({ sessionId, status: "needs_points", record: null, errorMessage: response.data.message || null, pointsState: response.data.points ?? null });
        window.clearInterval(intervalId);
      }
    }, 2500);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [sessionId, status]);

  function handleStartAgain() {
    void startNewReading().finally(() => {
      startTransition(() => {
        router.push("/question");
      });
    });
  }

  return (
    <section className="flex flex-1 flex-col gap-4 px-4 pb-5 pt-4 sm:gap-5 sm:px-5 sm:pb-6 sm:pt-5">
      <div className="relative overflow-hidden rounded-[1.85rem] border border-white/10 bg-[linear-gradient(180deg,rgba(21,27,41,0.98),rgba(12,15,24,0.96))] p-5 shadow-[var(--shadow-soft)] motion-safe:[animation:section-rise_620ms_cubic-bezier(.22,1,.36,1)] sm:rounded-[2rem] sm:p-6">
        <div className="pointer-events-none absolute right-[-4rem] top-[-3rem] h-36 w-36 rounded-full bg-[radial-gradient(circle,_rgba(185,144,93,0.18),_transparent_68%)] blur-3xl" />
        <div className="pointer-events-none absolute left-[-4rem] top-12 h-28 w-28 rounded-full bg-[radial-gradient(circle,_rgba(121,152,255,0.1),_transparent_72%)] blur-3xl" />
        <div className="relative">
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-brand-strong">Destiny report</p>
          <h2 className="mt-4 whitespace-pre-line font-display text-[2.05rem] leading-[0.94] text-card-foreground sm:text-[2.35rem] sm:leading-[0.92]">{heroTitle}</h2>
          <p className="mt-4 max-w-[18rem] text-[13px] leading-7 text-muted sm:text-sm">{heroBody}</p>
          {activeReading?.reportTitle ? <p className="mt-4 text-sm font-semibold text-card-foreground">{activeReading.reportTitle}</p> : null}
          <div className="mt-6 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.22em] text-foreground/52">
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2">{sessionCategoryMeta.label}</span>
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2">{historyLabel}</span>
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2">{getStatusLabel(status)}</span>
            {record?.model ? <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2">{record.model}</span> : null}
          </div>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-4 motion-safe:[animation:section-rise_760ms_cubic-bezier(.22,1,.36,1)] sm:rounded-[1.9rem] sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-foreground/42">Question held</p>
            <p className="mt-3 text-sm leading-7 text-card-foreground">&ldquo;{focusQuestion}&rdquo;</p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-foreground/56">Kept in focus</span>
        </div>
        <div className="mt-4 rounded-[1.3rem] border border-white/10 bg-black/18 p-4 sm:mt-5 sm:rounded-[1.35rem]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-strong">Constellation line</p>
          <p className="mt-3 text-sm leading-7 text-muted">{constellationLine}</p>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[1.85rem] border border-white/10 bg-[linear-gradient(180deg,rgba(18,23,38,0.98),rgba(8,10,16,0.98))] p-4 shadow-[var(--shadow-soft)] motion-safe:[animation:section-rise_860ms_cubic-bezier(.22,1,.36,1)] sm:rounded-[2rem] sm:p-5">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(185,144,93,0.12),_transparent_32%)]" />
        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-strong">Three-card spread</p>
              <p className="mt-2 text-sm leading-6 text-muted">Read the cards once with the eyes, then again with the body.</p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-foreground/56">Full view</span>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
            {reportCards.map((card) => <TarotCardFace key={card.id} card={card} variant="report" showNarrative={false} />)}
          </div>
          <div className="mt-4 rounded-[1.3rem] border border-white/10 bg-black/18 p-4 sm:mt-5 sm:rounded-[1.35rem]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-foreground/42">Reading cadence</p>
            <p className="mt-3 text-sm leading-7 text-card-foreground">{cadenceCopy}</p>
          </div>
        </div>
      </div>

      {status === "ready" ? (
        <div className="grid gap-5 motion-safe:[animation:section-rise_960ms_cubic-bezier(.22,1,.36,1)]">
          {readingSections.map((section) => (
            <article key={section.id} className="rounded-[1.65rem] border border-white/10 bg-white/[0.04] p-5 sm:rounded-[1.75rem] sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-strong">{section.eyebrow}</p>
                  <h3 className="mt-3 text-[1.1rem] font-semibold leading-7 text-card-foreground">{section.title}</h3>
                </div>
                <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-foreground/56">{section.accent}</span>
              </div>
              <div className="mt-5 h-px w-full bg-[linear-gradient(90deg,rgba(229,192,142,0.24),transparent)]" />
              <p className="mt-5 text-sm leading-8 text-foreground/76 sm:leading-[2.1rem]">{section.body}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 motion-safe:[animation:section-rise_960ms_cubic-bezier(.22,1,.36,1)] sm:rounded-[1.9rem] sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-strong">{status === "needs_points" ? "One step left" : status === "failed" ? "Reading interrupted" : "Composing report"}</p>
              <h3 className="mt-3 whitespace-pre-line font-display text-[1.75rem] leading-[0.98] text-card-foreground">{status === "needs_points" ? "Restore the points,\nthen reopen the answer." : status === "failed" ? "The report needs\nanother pass." : "The report is\nbeing written now."}</h3>
            </div>
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-foreground/56">{getStatusLabel(status)}</span>
          </div>
          <p className="mt-4 text-sm leading-7 text-muted">{status === "needs_points" ? errorMessage || "This report is ready to continue as soon as the reading balance is restored." : status === "failed" ? errorMessage || readingFailureMessage : "A full interpretation is being composed from the held question, the chosen spread, and the revealed order of the cards."}</p>
          <div className="mt-5 rounded-[1.35rem] border border-white/10 bg-black/18 p-4 sm:rounded-[1.45rem]">
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-brand-strong motion-safe:animate-[altar-pulse_2.2s_ease-in-out_infinite]" />
              <p className="text-sm text-card-foreground">{status === "needs_points" ? `Available now: ${pointsState?.available ?? 0} pts. This reading needs ${pointsState?.required ?? 0} pts to continue.` : status === "failed" ? "The spread is still intact and can be sent through again." : "The reading record will stay attached to this session once it settles."}</p>
            </div>
          </div>
          <div className="mt-6 grid gap-3">
            {status === "needs_points" ? (
              <>
                <Link href={pointsState?.topUpHref ?? "/points?intent=reading&returnTo=%2Freading"} className="min-h-[3.5rem] rounded-[1.35rem] border border-line-strong bg-brand px-4 py-4 text-center text-sm font-semibold leading-5 text-black transition hover:bg-brand-strong motion-reduce:transition-none sm:rounded-[1.4rem]">Add points for this reading</Link>
                <Link href="/reveal" className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 bg-white/[0.05] px-4 py-4 text-center text-sm font-semibold leading-5 text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07] motion-reduce:transition-none sm:rounded-[1.4rem]">Back to reveal</Link>
              </>
            ) : status === "failed" ? (
              <>
                <button type="button" onClick={() => void runGenerateReading(true)} className="min-h-[3.5rem] rounded-[1.35rem] border border-line-strong bg-brand px-4 py-4 text-sm font-semibold leading-5 text-black transition hover:bg-brand-strong motion-reduce:transition-none sm:rounded-[1.4rem]">Try the reading again</button>
                <Link href="/reveal" className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 bg-white/[0.05] px-4 py-4 text-center text-sm font-semibold leading-5 text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07] motion-reduce:transition-none sm:rounded-[1.4rem]">Return to reveal</Link>
              </>
            ) : null}
          </div>
        </div>
      )}

      <ReadingFollowupPanel canOpen={status === "ready" && Boolean(activeReading)} />

      <div className="rounded-[1.8rem] border border-[rgba(229,192,142,0.18)] bg-[linear-gradient(180deg,rgba(185,144,93,0.12),rgba(185,144,93,0.04))] p-5 motion-safe:[animation:section-rise_1060ms_cubic-bezier(.22,1,.36,1)] sm:rounded-[1.95rem]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-strong">Next step</p>
        <h3 className="mt-3 font-display text-[1.8rem] leading-[0.98] text-card-foreground">Keep the thread,<br />or return with a cleaner question.</h3>
        <p className="mt-4 text-sm leading-7 text-foreground/74">{status === "ready" ? activeReading?.closingReminder || "The report is complete for now. Keep the line that feels truest, and return only when the next question is cleaner." : status === "needs_points" ? "You can restore points here and return directly to this same report, without replaying the ritual." : "The CTA below stays simple while the report is composing or waiting to be tried again."}</p>
        <div className="mt-6 grid gap-3">
          <button type="button" onClick={handleStartAgain} className="min-h-[3.5rem] rounded-[1.35rem] border border-line-strong bg-brand px-4 py-4 text-sm font-semibold leading-5 text-black transition hover:bg-brand-strong motion-reduce:transition-none sm:rounded-[1.4rem]">Start a new reading</button>
          <Link href={record && session?.saveToHistory ? `/history/${record.id}` : "/history"} className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 bg-white/[0.05] px-4 py-4 text-center text-sm font-semibold leading-5 text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07] motion-reduce:transition-none sm:rounded-[1.4rem]">{record && session?.saveToHistory ? "View this archive" : "Open archive"}</Link>
        </div>
      </div>
    </section>
  );
}
