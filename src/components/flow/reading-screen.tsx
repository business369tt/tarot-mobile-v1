"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useEffectEvent, useState } from "react";
import { ReadingFollowupPanel } from "@/components/flow/reading-followup-panel";
import { TarotCardFace } from "@/components/flow/tarot-card";
import { useTarotFlow } from "@/components/flow/tarot-flow-provider";
import { useLocale } from "@/components/i18n/locale-provider";
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

function getStatusLabel(
  status: ReadingViewStatus,
  t: (zh: string, en: string) => string,
) {
  if (status === "ready") return t("已完成", "Ready");
  if (status === "needs_points") return t("需要點數", "Needs points");
  if (status === "failed") return t("重試", "Retry");
  return t("生成中", "Generating");
}

export function ReadingScreen() {
  const router = useRouter();
  const { inlineText, locale, t } = useLocale();
  const { session, sessionCategoryMeta, selectedCards, startNewReading } =
    useTarotFlow();
  const reportCards = selectedCards;
  const focusQuestion = session?.question.trim() || defaultQuestionDisplay.zh;
  const categoryDisplay = getCategoryDisplayMeta(sessionCategoryMeta.id);
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
      : {
          sessionId,
          status: "idle" as ReadingViewStatus,
          record: null,
          errorMessage: null,
          pointsState: null,
        };
  const { status, record, errorMessage, pointsState } = state;
  const activeReading = record?.fullReading ?? null;
  const readingSections = record ? buildReadingSections(record) : [];

  async function runGenerateReading(
    force = false,
    canUpdate: () => boolean = () => true,
  ) {
    if (!canUpdate() || !sessionId) return;
    setViewState({
      sessionId,
      status: "generating",
      record,
      errorMessage: null,
      pointsState: null,
    });
    const response = await requestCurrentReading("POST", force);
    if (!canUpdate()) return;
    const nextRecord = response.data.reading;

    if (nextRecord?.status === "ready") {
      return setViewState({
        sessionId,
        status: "ready",
        record: nextRecord,
        errorMessage: null,
        pointsState: null,
      });
    }
    if (nextRecord?.status === "generating") {
      return setViewState({
        sessionId,
        status: "generating",
        record: nextRecord,
        errorMessage: null,
        pointsState: null,
      });
    }
    if (nextRecord?.status === "failed") {
      return setViewState({
        sessionId,
        status: "failed",
        record: nextRecord,
        errorMessage:
          nextRecord.errorMessage || response.data.message || readingFailureMessage,
        pointsState: null,
      });
    }
    if (response.status === 402) {
      return setViewState({
        sessionId,
        status: "needs_points",
        record: null,
        errorMessage: response.data.message || null,
        pointsState: response.data.points ?? null,
      });
    }
    if (response.status === 409) {
      return setViewState({
        sessionId,
        status: "failed",
        record: null,
        errorMessage: response.data.message || readingNeedsRevealMessage,
        pointsState: null,
      });
    }
    setViewState({
      sessionId,
      status: "failed",
      record: nextRecord ?? null,
      errorMessage: response.data.message || readingFailureMessage,
      pointsState: null,
    });
  }

  const generateReading = useEffectEvent(runGenerateReading);

  useEffect(() => {
    if (!sessionId || !isSpreadReady) return;
    let active = true;

    async function bootstrapReading() {
      const response = await requestCurrentReading("GET");
      if (!active) return;
      const nextRecord = response.data.reading;
      if (nextRecord?.status === "ready") {
        return setViewState({
          sessionId,
          status: "ready",
          record: nextRecord,
          errorMessage: null,
          pointsState: null,
        });
      }
      if (nextRecord?.status === "failed") {
        return setViewState({
          sessionId,
          status: "failed",
          record: nextRecord,
          errorMessage:
            nextRecord.errorMessage || response.data.message || readingFailureMessage,
          pointsState: null,
        });
      }
      if (nextRecord?.status === "generating") {
        return setViewState({
          sessionId,
          status: "generating",
          record: nextRecord,
          errorMessage: null,
          pointsState: null,
        });
      }
      if (response.status === 402) {
        return setViewState({
          sessionId,
          status: "needs_points",
          record: null,
          errorMessage: response.data.message || null,
          pointsState: response.data.points ?? null,
        });
      }
      if (response.status === 409) {
        return setViewState({
          sessionId,
          status: "failed",
          record: null,
          errorMessage: response.data.message || readingNeedsRevealMessage,
          pointsState: null,
        });
      }
      await generateReading(false, () => active);
    }

    void bootstrapReading();
    return () => {
      active = false;
    };
  }, [generateReading, isSpreadReady, sessionId]);

  useEffect(() => {
    if (status !== "generating" || !sessionId) return;
    let active = true;
    const intervalId = window.setInterval(async () => {
      const response = await requestCurrentReading("GET");
      if (!active) return;
      const nextRecord = response.data.reading;
      if (nextRecord?.status === "ready") {
        setViewState({
          sessionId,
          status: "ready",
          record: nextRecord,
          errorMessage: null,
          pointsState: null,
        });
        return window.clearInterval(intervalId);
      }
      if (nextRecord?.status === "failed") {
        setViewState({
          sessionId,
          status: "failed",
          record: nextRecord,
          errorMessage:
            nextRecord.errorMessage || response.data.message || readingFailureMessage,
          pointsState: null,
        });
        return window.clearInterval(intervalId);
      }
      if (response.status === 402) {
        setViewState({
          sessionId,
          status: "needs_points",
          record: null,
          errorMessage: response.data.message || null,
          pointsState: response.data.points ?? null,
        });
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
    <section className="flex flex-1 flex-col gap-5 py-6">
      <div className="space-y-3 pt-4">
        <p className="text-sm text-foreground/56">{t("結果", "Result")}</p>
        <h1 className="max-w-[13rem] text-[2.6rem] font-semibold leading-[1.02] tracking-tight text-card-foreground">
          {status === "ready"
            ? t("你的解讀", "Your reading")
            : status === "needs_points"
              ? t("還差一步", "One more step")
              : status === "failed"
                ? t("這次沒有完成", "This run did not finish")
                : t("正在生成中", "Preparing your reading")}
        </h1>
        <p className="max-w-[18rem] text-base leading-7 text-foreground/62">
          {status === "ready"
            ? activeReading?.reportSubtitle ||
              t("慢慢看完這份解讀。", "Take a moment to read through it.")
            : status === "needs_points"
              ? t("補點後就能回到這裡繼續。", "Add points and return here to continue.")
              : status === "failed"
                ? inlineText(errorMessage || readingFailureMessage)
                : t("系統正在整理你的牌面與問題。", "Your cards and question are being composed into a reading.")}
        </p>
      </div>

      <div className="rounded-[1.8rem] bg-white/[0.04] p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-foreground/56">
              {locale === "zh-TW" ? categoryDisplay.labelZh : categoryDisplay.labelEn}
            </p>
            <p className="mt-2 text-sm leading-7 text-card-foreground">
              &ldquo;{focusQuestion}&rdquo;
            </p>
          </div>
          <span className="text-sm text-foreground/56">
            {getStatusLabel(status, t)}
          </span>
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(18,23,38,0.98),rgba(8,10,16,0.98))] p-4 shadow-[var(--shadow-soft)]">
        <div className="grid grid-cols-3 gap-2">
          {reportCards.map((card) => (
            <TarotCardFace
              key={card.id}
              card={card}
              variant="report"
              showNarrative={false}
            />
          ))}
        </div>
      </div>

      {status === "ready" ? (
        <div className="grid gap-4">
          {readingSections.map((section) => (
            <article
              key={section.id}
              className="rounded-[1.7rem] bg-white/[0.04] p-5"
            >
              <p className="text-sm text-foreground/56">
                {inlineText(section.eyebrow)}
              </p>
              <h3 className="mt-2 text-xl font-semibold leading-8 text-card-foreground">
                {inlineText(section.title)}
              </h3>
              <p className="mt-4 text-sm leading-8 text-foreground/76">
                {section.body}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-[1.8rem] bg-white/[0.04] p-5">
          <p className="text-sm leading-7 text-foreground/76">
            {status === "needs_points"
              ? inlineText(
                  errorMessage ||
                    t(
                      `目前可用 ${pointsState?.available ?? 0} 點，這次需要 ${pointsState?.required ?? 0} 點。`,
                      `${pointsState?.available ?? 0} points available and ${pointsState?.required ?? 0} required.`,
                    ),
                )
              : status === "failed"
                ? inlineText(errorMessage || readingFailureMessage)
                : t("完成後會自動顯示在這裡。", "It will appear here automatically when ready.")}
          </p>

          <div className="mt-5 grid gap-3">
            {status === "needs_points" ? (
              <>
                <Link
                  href={pointsState?.topUpHref ?? "/points?intent=reading&returnTo=%2Freading"}
                  className="min-h-[3.5rem] rounded-[1.35rem] bg-white px-4 py-4 text-center text-sm font-semibold text-black transition hover:opacity-92"
                >
                  {t("去補點", "Add points")}
                </Link>
                <Link
                  href="/reveal"
                  className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-center text-sm font-medium text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07]"
                >
                  {t("回到翻牌", "Back to reveal")}
                </Link>
              </>
            ) : status === "failed" ? (
              <>
                <button
                  type="button"
                  onClick={() => void runGenerateReading(true)}
                  className="min-h-[3.5rem] rounded-[1.35rem] bg-white px-4 py-4 text-sm font-semibold text-black transition hover:opacity-92"
                >
                  {t("重新生成", "Try again")}
                </button>
                <Link
                  href="/reveal"
                  className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-center text-sm font-medium text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07]"
                >
                  {t("回到翻牌", "Back to reveal")}
                </Link>
              </>
            ) : null}
          </div>
        </div>
      )}

      <ReadingFollowupPanel canOpen={status === "ready" && Boolean(activeReading)} />

      <div className="rounded-[1.8rem] bg-white/[0.04] p-5">
        <h3 className="text-lg font-semibold text-card-foreground">
          {t("接下來", "Next")}
        </h3>
        <p className="mt-3 text-sm leading-7 text-foreground/62">
          {status === "ready"
            ? activeReading?.closingReminder ||
              t("你可以重新開始，或回到紀錄裡再看一次。", "You can start again or return to this reading later in history.")
            : t("等這份解讀完成後，再決定要不要繼續追問。", "Once this reading is ready, you can decide whether to continue with follow-ups.")}
        </p>
        <div className="mt-5 grid gap-3">
          <button
            type="button"
            onClick={handleStartAgain}
            className="min-h-[3.5rem] rounded-[1.35rem] bg-white px-4 py-4 text-sm font-semibold text-black transition hover:opacity-92"
          >
            {t("開始新的解讀", "Start a new reading")}
          </button>
          <Link
            href={record && session?.saveToHistory ? `/history/${record.id}` : "/history"}
            className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-center text-sm font-medium text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07]"
          >
            {t("查看紀錄", "Open history")}
          </Link>
        </div>
      </div>
    </section>
  );
}
