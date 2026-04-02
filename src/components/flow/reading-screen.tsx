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
  if (status === "needs_points") return t("需補點", "Needs points");
  if (status === "failed") return t("重試", "Retry");
  return t("生成中", "Generating");
}

function getReadingModelLine(
  record: ReadingRecord | null,
  t: (zh: string, en: string) => string,
) {
  if (!record) {
    return t("AI 深度解讀", "AI reading");
  }

  return `MiniMax · ${record.model}`;
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
  const isSpreadReady = Boolean(
    session && selectedCards.length === 3 && session.revealed >= 3,
  );
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
  const statusLabel = getStatusLabel(status, t);
  const modelLine = getReadingModelLine(record, t);
  const heroTitle =
    status === "ready"
      ? activeReading?.reportTitle || t("你的 AI 深度解讀", "Your AI reading")
      : status === "needs_points"
        ? t("補入點數後，就能展開完整解讀", "Add points to open the full reading")
        : status === "failed"
          ? t("這次解讀沒有完整落下", "This reading did not fully settle")
          : t("AI 正在整理你的牌陣", "Your AI reading is being prepared");
  const heroSubtitle =
    status === "ready"
      ? activeReading?.reportSubtitle ||
        t("三張牌與你的提問已整理成一份完整解讀。", "Your cards and question are now one complete reading.")
      : status === "needs_points"
        ? t("補點後會直接回到這裡，繼續完成 AI 深度解讀。", "Add points and return here to continue the AI reading.")
        : status === "failed"
          ? t("再試一次，讓這次牌陣重新整理成完整報告。", "Try once more to let this spread settle into a full report.")
          : t("牌陣、提問與方向正在被整理成可閱讀的解讀。", "Your cards, question, and direction are being composed into a readable report.");
  const heroInsight =
    status === "ready"
      ? activeReading?.questionCore || activeReading?.progression || null
      : null;
  const categoryLabel =
    locale === "zh-TW" ? categoryDisplay.labelZh : categoryDisplay.labelEn;

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
  }, [isSpreadReady, sessionId]);

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
        <p className="text-sm text-foreground/56">{t("AI 解讀", "AI reading")}</p>
        <h1 className="max-w-[13rem] text-[2.6rem] font-semibold leading-[1.02] tracking-tight text-card-foreground">
          {status === "ready"
            ? t("你的解讀已完成", "Your reading is ready")
            : status === "needs_points"
              ? t("還差一步就能查看", "One more step to open it")
              : status === "failed"
                ? t("這次解讀沒有完整落下", "This reading did not finish")
                : t("AI 正在整理你的解讀", "Your AI reading is forming")}
        </h1>
        <p className="max-w-[18rem] text-base leading-7 text-foreground/62">
          {status === "ready"
            ? t("先看整體訊號，再往下讀完整細節。", "Start with the core signal, then read the full detail.")
            : heroSubtitle}
        </p>
      </div>

      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(18,23,38,0.98),rgba(8,10,16,0.98))] p-5 shadow-[var(--shadow-soft)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(185,144,93,0.14),_transparent_34%)]" />

        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/56">
                  {t("AI 深度解讀", "AI Reading")}
                </span>
                <span className="text-xs text-foreground/52">{modelLine}</span>
              </div>
              <h2 className="max-w-[15rem] text-[2rem] font-semibold leading-[1.04] tracking-tight text-card-foreground">
                {heroTitle}
              </h2>
            </div>

            <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-foreground/68">
              {statusLabel}
            </span>
          </div>

          <p className="mt-4 max-w-[18rem] text-sm leading-7 text-foreground/72">
            {heroSubtitle}
          </p>

          <div className="mt-5 rounded-[1.55rem] border border-white/8 bg-black/18 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/44">
              {t("這次提問", "This question")}
            </p>
            <p className="mt-3 text-sm leading-7 text-card-foreground">
              &ldquo;{focusQuestion}&rdquo;
            </p>
            <p className="mt-4 text-sm text-foreground/56">{categoryLabel}</p>
          </div>

          {heroInsight ? (
            <div className="mt-5 rounded-[1.55rem] border border-[#f0cb97]/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/44">
                {t("AI 核心訊號", "Core signal")}
              </p>
              <p className="mt-3 text-sm leading-7 text-card-foreground">
                {heroInsight}
              </p>
            </div>
          ) : null}

          <div className="mt-5 grid grid-cols-3 gap-2">
            {reportCards.map((card) => (
              <TarotCardFace
                key={card.id}
                card={card}
                variant="compact"
                showNarrative={false}
              />
            ))}
          </div>
        </div>
      </div>

      {status === "ready" ? (
        <div className="grid gap-4">
          {readingSections.map((section, index) => (
            <article
              key={section.id}
              className={`rounded-[1.75rem] border p-5 ${
                index === 0
                  ? "border-[#f0cb97]/16 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))]"
                  : "border-white/8 bg-white/[0.04]"
              }`}
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
        <div className="rounded-[1.8rem] border border-white/8 bg-white/[0.04] p-5">
          <h3 className="text-lg font-semibold text-card-foreground">
            {status === "needs_points"
              ? t("補點後繼續完成解讀", "Add points to continue")
              : status === "failed"
                ? t("再試一次", "Try again")
                : t("解讀即將完成", "Almost ready")}
          </h3>
          <p className="mt-3 text-sm leading-7 text-foreground/76">
            {status === "needs_points"
              ? inlineText(
                  errorMessage ||
                    t(
                      `目前有 ${pointsState?.available ?? 0} 點，完成本次解讀需要 ${pointsState?.required ?? 0} 點。`,
                      `${pointsState?.available ?? 0} points available and ${pointsState?.required ?? 0} required.`,
                    ),
                )
              : status === "failed"
                ? inlineText(errorMessage || readingFailureMessage)
                : t(
                    "系統會在這裡自動完成報告，你不需要重新操作抽牌流程。",
                    "The report will finish here automatically without redoing the draw.",
                  )}
          </p>

          <div className="mt-5 grid gap-3">
            {status === "needs_points" ? (
              <>
                <Link
                  href={
                    pointsState?.topUpHref ??
                    "/points?intent=reading&returnTo=%2Freading"
                  }
                  className="min-h-[3.5rem] rounded-[1.35rem] bg-white px-4 py-4 text-center text-sm font-semibold text-black transition hover:opacity-92"
                >
                  {t("補入點數", "Add points")}
                </Link>
                <Link
                  href="/reveal"
                  className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-center text-sm font-medium text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07]"
                >
                  {t("回到牌陣", "Back to reveal")}
                </Link>
              </>
            ) : status === "failed" ? (
              <>
                <button
                  type="button"
                  onClick={() => void runGenerateReading(true)}
                  className="min-h-[3.5rem] rounded-[1.35rem] bg-white px-4 py-4 text-sm font-semibold text-black transition hover:opacity-92"
                >
                  {t("重新生成解讀", "Generate again")}
                </button>
                <Link
                  href="/reveal"
                  className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-center text-sm font-medium text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07]"
                >
                  {t("回到牌陣", "Back to reveal")}
                </Link>
              </>
            ) : null}
          </div>
        </div>
      )}

      <ReadingFollowupPanel canOpen={status === "ready" && Boolean(activeReading)} />

      <div className="rounded-[1.8rem] border border-white/8 bg-white/[0.04] p-5">
        <h3 className="text-lg font-semibold text-card-foreground">
          {t("接下來", "Next")}
        </h3>
        <p className="mt-3 text-sm leading-7 text-foreground/62">
          {status === "ready"
            ? activeReading?.closingReminder ||
              t(
                "你可以從這裡繼續追問，或把這份解讀留待之後回來閱讀。",
                "You can continue with follow-ups or return to this reading later.",
              )
            : t(
                "等解讀完成後，你就可以決定是否要繼續追問或回到歷史紀錄。",
                "Once the reading is ready, you can decide whether to continue.",
              )}
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
            {t("打開我的紀錄", "Open history")}
          </Link>
        </div>
      </div>
    </section>
  );
}
