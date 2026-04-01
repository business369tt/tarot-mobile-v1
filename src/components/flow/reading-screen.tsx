"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useEffectEvent, useState } from "react";
import { ReadingFollowupPanel } from "@/components/flow/reading-followup-panel";
import { TarotCardFace } from "@/components/flow/tarot-card";
import { useTarotFlow } from "@/components/flow/tarot-flow-provider";
import {
  defaultQuestionDisplay,
  getCategoryDisplayMeta,
} from "@/lib/mock-tarot-data";
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
  if (status === "ready") return "已完成 / Ready";
  if (status === "needs_points") return "待補點 / Points";
  if (status === "failed") return "可重試 / Retry";
  return "生成中 / Generating";
}

export function ReadingScreen() {
  const router = useRouter();
  const { session, sessionCategoryMeta, selectedCards, startNewReading } = useTarotFlow();
  const reportCards = selectedCards;
  const focusQuestion = session?.question.trim() || defaultQuestionDisplay.zh;
  const categoryDisplay = getCategoryDisplayMeta(sessionCategoryMeta.id);
  const trioLine = reportCards.map((card) => card.name).join(" / ");
  const historyLabel = session?.saveToHistory
    ? "保留紀錄 / History on"
    : "不保留 / History off";
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
  const heroCopy =
    status === "ready"
      ? {
          titleZh: "牌陣已經\n沉成清楚的畫面。",
          titleEn: "The spread has settled into view.",
          bodyZh:
            activeReading?.reportSubtitle ||
            "請慢慢閱讀。這份報告刻意保留比較安靜的節奏，而不是堆成一整面密集說明。",
          bodyEn:
            "Read this slowly. The report is structured in a quieter rhythm, not as a dense wall of explanation.",
        }
      : status === "needs_points"
        ? {
            titleZh: "你離完整答案\n只差一步。",
            titleEn: "You are one step from the full answer.",
            bodyZh:
              "先在這裡補一次點數，再直接回到這份解讀，讓報告從原本的位置繼續完成。",
            bodyEn:
              "Add points once here, then return directly to this reading and let the report continue from the same place.",
          }
        : status === "failed"
          ? {
              titleZh: "這份報告\n暫時失去焦點了。",
              titleEn: "The report slipped out of focus.",
              bodyZh: errorMessage || readingFailureMessage,
              bodyEn: "The report can be attempted again from the same spread.",
            }
          : {
              titleZh: "報告正在\n慢慢成形。",
              titleEn: "The report is settling into view.",
              bodyZh:
                "系統正根據你的問題、分類與三張已翻開的牌，整理這份解讀內容。",
              bodyEn:
                "The reading is being composed from your question, category, and the three cards you revealed.",
            };
  const cadenceCopy =
    status === "ready"
      ? activeReading?.spreadAxis || cadenceLine
      : status === "needs_points"
        ? "牌陣已經完整，只差補回解讀所需點數，就能打開最後的完整詮釋。"
        : status === "failed"
          ? "牌陣依然完整；等你準備好時，可以再讓這份報告重新生成一次。"
          : "系統正在把三張牌的流動整理成一份完整解讀，完成後就會在下方打開。";

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
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-brand-strong">命運報告</p>
          <p className="mt-1 text-[9px] uppercase tracking-[0.16em] text-foreground/38">Destiny report</p>
          <h2 className="mt-4">
            <span className="block whitespace-pre-line font-display text-[2.05rem] leading-[0.94] text-card-foreground sm:text-[2.35rem] sm:leading-[0.92]">
              {heroCopy.titleZh}
            </span>
            <span className="mt-2 block text-sm leading-6 text-foreground/44">
              {heroCopy.titleEn}
            </span>
          </h2>
          <div className="mt-4 max-w-[18rem] space-y-2">
            <p className="text-[13px] leading-7 text-muted sm:text-sm">{heroCopy.bodyZh}</p>
            <p className="text-xs leading-6 text-foreground/42">{heroCopy.bodyEn}</p>
          </div>
          {activeReading?.reportTitle ? <p className="mt-4 text-sm font-semibold text-card-foreground">{activeReading.reportTitle}</p> : null}
          <div className="mt-6 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.22em] text-foreground/52">
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2">{`${categoryDisplay.labelZh} / ${categoryDisplay.labelEn}`}</span>
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2">{historyLabel}</span>
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2">{getStatusLabel(status)}</span>
            {record?.model ? <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2">{record.model}</span> : null}
          </div>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-4 motion-safe:[animation:section-rise_760ms_cubic-bezier(.22,1,.36,1)] sm:rounded-[1.9rem] sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-foreground/42">提問主軸 / Question held</p>
            <p className="mt-3 text-sm leading-7 text-card-foreground">&ldquo;{focusQuestion}&rdquo;</p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-foreground/56">保持聚焦 / Kept in focus</span>
        </div>
        <div className="mt-4 rounded-[1.3rem] border border-white/10 bg-black/18 p-4 sm:mt-5 sm:rounded-[1.35rem]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-strong">牌陣軸線 / Constellation line</p>
          <p className="mt-3 text-sm leading-7 text-muted">{constellationLine}</p>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[1.85rem] border border-white/10 bg-[linear-gradient(180deg,rgba(18,23,38,0.98),rgba(8,10,16,0.98))] p-4 shadow-[var(--shadow-soft)] motion-safe:[animation:section-rise_860ms_cubic-bezier(.22,1,.36,1)] sm:rounded-[2rem] sm:p-5">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(185,144,93,0.12),_transparent_32%)]" />
        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-strong">三張牌陣 / Three-card spread</p>
              <p className="mt-2 text-sm leading-6 text-muted">先用眼睛讀一次，再用身體讀一次。 / Read the cards once with the eyes, then again with the body.</p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-foreground/56">完整展開 / Full view</span>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
            {reportCards.map((card) => <TarotCardFace key={card.id} card={card} variant="report" showNarrative={false} />)}
          </div>
          <div className="mt-4 rounded-[1.3rem] border border-white/10 bg-black/18 p-4 sm:mt-5 sm:rounded-[1.35rem]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-foreground/42">閱讀節奏 / Reading cadence</p>
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
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-strong">
                {status === "needs_points"
                  ? "還差一步 / One step left"
                  : status === "failed"
                    ? "解讀中斷 / Reading interrupted"
                    : "整理報告 / Composing report"}
              </p>
              <h3 className="mt-3 whitespace-pre-line font-display text-[1.75rem] leading-[0.98] text-card-foreground">
                {status === "needs_points"
                  ? "先補回點數，\n再重新打開答案。"
                  : status === "failed"
                    ? "這份報告需要\n再試一次。"
                    : "這份報告正在\n被寫出來。"}
              </h3>
            </div>
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-foreground/56">{getStatusLabel(status)}</span>
          </div>
          <p className="mt-4 text-sm leading-7 text-muted">
            {status === "needs_points"
              ? errorMessage || "只要把解讀所需點數補回來，這份報告就能接著完成。"
              : status === "failed"
                ? errorMessage || readingFailureMessage
                : "完整解讀正在根據目前問題、所選牌陣與翻牌順序逐步生成。"}
          </p>
          <div className="mt-5 rounded-[1.35rem] border border-white/10 bg-black/18 p-4 sm:rounded-[1.45rem]">
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-brand-strong motion-safe:animate-[altar-pulse_2.2s_ease-in-out_infinite]" />
              <p className="text-sm text-card-foreground">
                {status === "needs_points"
                  ? `目前可用 ${pointsState?.available ?? 0} 點；這份解讀還需要 ${pointsState?.required ?? 0} 點才能繼續。`
                  : status === "failed"
                    ? "牌陣仍然完整，隨時可以再重新送出一次。"
                    : "一旦完成，這份解讀紀錄就會綁定在目前這個 session 上。"}
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-3">
            {status === "needs_points" ? (
              <>
                <Link href={pointsState?.topUpHref ?? "/points?intent=reading&returnTo=%2Freading"} className="min-h-[3.5rem] rounded-[1.35rem] border border-line-strong bg-brand px-4 py-4 text-center text-sm font-semibold leading-5 text-black transition hover:bg-brand-strong motion-reduce:transition-none sm:rounded-[1.4rem]">為這份解讀補點（Add points for this reading）</Link>
                <Link href="/reveal" className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 bg-white/[0.05] px-4 py-4 text-center text-sm font-semibold leading-5 text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07] motion-reduce:transition-none sm:rounded-[1.4rem]">回到翻牌（Back to reveal）</Link>
              </>
            ) : status === "failed" ? (
              <>
                <button type="button" onClick={() => void runGenerateReading(true)} className="min-h-[3.5rem] rounded-[1.35rem] border border-line-strong bg-brand px-4 py-4 text-sm font-semibold leading-5 text-black transition hover:bg-brand-strong motion-reduce:transition-none sm:rounded-[1.4rem]">再試一次解讀（Try the reading again）</button>
                <Link href="/reveal" className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 bg-white/[0.05] px-4 py-4 text-center text-sm font-semibold leading-5 text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07] motion-reduce:transition-none sm:rounded-[1.4rem]">回到翻牌（Return to reveal）</Link>
              </>
            ) : null}
          </div>
        </div>
      )}

      <ReadingFollowupPanel canOpen={status === "ready" && Boolean(activeReading)} />

      <div className="rounded-[1.8rem] border border-[rgba(229,192,142,0.18)] bg-[linear-gradient(180deg,rgba(185,144,93,0.12),rgba(185,144,93,0.04))] p-5 motion-safe:[animation:section-rise_1060ms_cubic-bezier(.22,1,.36,1)] sm:rounded-[1.95rem]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-strong">下一步 / Next step</p>
        <h3 className="mt-3 font-display text-[1.8rem] leading-[0.98] text-card-foreground">把脈絡留住，<br />或帶著更清楚的問題再回來。</h3>
        <p className="mt-4 text-sm leading-7 text-foreground/74">{status === "ready" ? activeReading?.closingReminder || "這份報告目前已完整。留住那條最真實的線，等下一個問題更清楚時再回來。" : status === "needs_points" ? "你可以先在這裡補點，然後直接回到同一份報告，不需要重跑整段儀式。" : "在報告完成前，這裡會先保持簡單，方便你稍後再續接。"}</p>
        <div className="mt-6 grid gap-3">
          <button type="button" onClick={handleStartAgain} className="min-h-[3.5rem] rounded-[1.35rem] border border-line-strong bg-brand px-4 py-4 text-sm font-semibold leading-5 text-black transition hover:bg-brand-strong motion-reduce:transition-none sm:rounded-[1.4rem]">開始新的解讀（Start a new reading）</button>
          <Link href={record && session?.saveToHistory ? `/history/${record.id}` : "/history"} className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 bg-white/[0.05] px-4 py-4 text-center text-sm font-semibold leading-5 text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07] motion-reduce:transition-none sm:rounded-[1.4rem]">{record && session?.saveToHistory ? "查看這份紀錄（View this archive）" : "打開紀錄（Open archive）"}</Link>
        </div>
      </div>
    </section>
  );
}
