"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useEffectEvent, useState } from "react";
import { TarotCardFace } from "@/components/flow/tarot-card";
import { useTarotFlow } from "@/components/flow/tarot-flow-provider";
import { useLocale } from "@/components/i18n/locale-provider";
import {
  cardRoles,
  defaultQuestionDisplay,
  getCardDisplayMeta,
  getCardRoleDisplayMeta,
  getCategoryDisplayMeta,
  getOrientationDisplayMeta,
} from "@/lib/mock-tarot-data";
import {
  readingFailureMessage,
  readingNeedsRevealMessage,
  type ReadingRecord,
  type ReadingRecordStatus,
} from "@/lib/reading-record";
import { defaultOfficialTarotSpread } from "@/lib/tarot-spreads";

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

export function ReadingScreen() {
  const router = useRouter();
  const { inlineText, locale, t } = useLocale();
  const { session, sessionCategoryMeta, selectedCards, startNewReading } =
    useTarotFlow();
  const reportCards = selectedCards;
  const focusQuestion = session?.question.trim() || defaultQuestionDisplay.zh;
  const categoryDisplay = getCategoryDisplayMeta(sessionCategoryMeta.id);
  const sessionId = session?.sessionId ?? null;
  const requiredCards = cardRoles.length;
  const spreadName =
    locale === "zh-TW"
      ? defaultOfficialTarotSpread.nameZh
      : defaultOfficialTarotSpread.nameEn;
  const isSpreadReady = Boolean(
    session &&
      selectedCards.length === requiredCards &&
      session.revealed >= requiredCards,
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
  const statusLabel = getStatusLabel(status, t);
  const heroTitle =
    status === "ready"
      ? activeReading?.reportTitle || t("這次答案", "This reading")
      : status === "needs_points"
        ? t("補點後開啟完整答案", "Add points to open the full answer")
        : status === "failed"
          ? t("這次答案暫時沒有完整落下", "This reading did not fully settle")
          : t("AI 正在整理這次答案", "Your AI reading is being prepared");
  const heroSubtitle =
    status === "ready"
      ? activeReading?.reportSubtitle ||
        (locale === "zh-TW"
          ? `「${spreadName}」與你的提問，已整理成一份完整答案。`
          : `Your ${spreadName} and question are now one complete reading.`)
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
  const guidanceSteps =
    status === "ready"
      ? activeReading?.concreteGuidance
          .map((item) => item.trim())
          .filter(Boolean) ?? []
      : [];
  const cardSpotlights = reportCards.map((card) => {
    const display = getCardDisplayMeta(card.id);
    const roleDisplay = getCardRoleDisplayMeta(card.role);
    const orientationDisplay = getOrientationDisplayMeta(card.orientation);

    return {
      id: card.id,
      roleLabel: locale === "zh-TW" ? roleDisplay.labelZh : roleDisplay.labelEn,
      roleSubtitle:
        locale === "zh-TW" ? roleDisplay.subtitleZh : roleDisplay.subtitleEn,
      name: locale === "zh-TW" ? display.nameZh : display.nameEn,
      orientation:
        locale === "zh-TW" ? orientationDisplay.zh : orientationDisplay.en,
      card,
    };
  });
  const reportSections =
    status === "ready" && activeReading
      ? [
          {
            id: "threshold",
            eyebrow: t("現況核心", "Current core"),
            title: t("現在真正的重點", "The current core"),
            body: activeReading.cardReadings.threshold,
          },
          {
            id: "mirror",
            eyebrow: t("隱藏阻力", "Hidden resistance"),
            title: t("你還沒正視的阻力", "The hidden resistance"),
            body: activeReading.cardReadings.mirror,
          },
          {
            id: "horizon",
            eyebrow: t("最佳走向", "Best direction"),
            title: t("接下來最值得走的方向", "The best direction"),
            body: activeReading.cardReadings.horizon,
          },
        ].filter((section) => section.body.trim().length > 0)
      : [];
  const outlookBody =
    status === "ready"
      ? activeReading?.nearTermTrend || activeReading?.progression || null
      : null;
  const readySummary =
    status === "ready"
      ? heroInsight || activeReading?.reportSubtitle || activeReading?.questionCore || null
      : null;
  const closingNote =
    status === "ready" ? activeReading?.closingReminder?.trim() || null : null;

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
    <section className="flex flex-1 flex-col gap-4 py-6">
      <div className="space-y-3 pt-4">
        <span className="inline-flex items-center rounded-full border border-[#f1c98d]/18 bg-[#f1c98d]/8 px-3 py-1 text-[0.72rem] font-medium tracking-[0.18em] text-[#f3d4a7]">
          {t("完整解讀", "READING")}
        </span>
        <div className="space-y-2">
          <h1 className="max-w-[14rem] text-[2.65rem] font-semibold leading-[1.02] tracking-tight text-card-foreground">
            {status === "ready"
              ? t("這次答案", "This reading")
              : heroTitle}
          </h1>
          <p className="max-w-[19rem] text-base leading-7 text-foreground/62">
            {status === "ready"
              ? t(
                  "一頁看完核心結論、三張牌位置與最後建議。",
                  "One page for the core answer, card positions, and final guidance.",
                )
              : heroSubtitle}
          </p>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[2.2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(18,23,38,0.98),rgba(8,10,16,0.98))] p-5 shadow-[var(--shadow-soft)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(185,144,93,0.14),_transparent_34%)]" />
        <div className="pointer-events-none absolute right-[-8%] top-[-4rem] h-52 w-52 rounded-full border border-[#f0cb97]/10 opacity-60" />
        <div className="pointer-events-none absolute left-[8%] top-[26%] h-36 w-36 rounded-full border border-white/6 opacity-60" />

        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/56">
              {categoryLabel}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-medium text-foreground/56">
              {spreadName}
            </span>
            {status !== "ready" ? (
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-foreground/68">
                {statusLabel}
              </span>
            ) : null}
          </div>

          <h2 className="mt-4 max-w-[17rem] text-[2.15rem] font-semibold leading-[1.04] tracking-tight text-card-foreground">
            {heroTitle}
          </h2>

          <p className="mt-3 max-w-[20rem] text-sm leading-7 text-foreground/72">
            {heroSubtitle}
          </p>

          <div className="mt-5 rounded-[1.6rem] border border-[#f0cb97]/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/44">
              {status === "ready"
                ? t("核心結論", "Core answer")
                : t("這次提問", "This question")}
            </p>
            <p className="mt-3 text-base leading-8 text-card-foreground">
              {status === "ready" && readySummary ? readySummary : `“${focusQuestion}”`}
            </p>

            {status === "ready" ? (
              <p className="mt-4 text-sm leading-6 text-foreground/52">
                &ldquo;{focusQuestion}&rdquo;
              </p>
            ) : (
              <p className="mt-4 text-sm text-foreground/56">
                {t(
                  "直答三張牌會直接回到你現在最在意的重點。",
                  "This three-card spread goes straight to what matters most right now.",
                )}
              </p>
            )}
          </div>
        </div>
      </div>

      {status === "ready" ? (
        <>
          <div className="rounded-[1.9rem] border border-white/8 bg-white/[0.04] p-5 backdrop-blur-sm">
            <div className="space-y-2">
              <p className="text-sm text-foreground/56">{t("三張牌", "Three cards")}</p>
              <h3 className="text-xl font-semibold text-card-foreground">
                {t("答案是怎麼被說清楚的", "How the answer is formed")}
              </h3>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              {cardSpotlights.map((item) => (
                <div key={item.id} className="space-y-3">
                  <TarotCardFace
                    card={item.card}
                    variant="compact"
                    showNarrative={false}
                  />
                  <div className="rounded-[1.2rem] border border-white/10 bg-black/18 px-3 py-3">
                    <p className="text-xs font-semibold text-card-foreground">
                      {item.roleLabel}
                    </p>
                    <p className="mt-2 text-[11px] leading-5 text-foreground/56">
                      {item.name}・{item.orientation}
                    </p>
                    <p className="mt-2 text-[11px] leading-5 text-foreground/42">
                      {item.roleSubtitle}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3">
            {reportSections.map((section, index) => (
              <article
                key={section.id}
                className={`rounded-[1.8rem] border p-5 ${
                  index === 0
                    ? "border-[#f0cb97]/16 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))]"
                    : "border-white/8 bg-white/[0.04]"
                }`}
              >
                <p className="text-sm text-foreground/56">{section.eyebrow}</p>
                <h3 className="mt-2 text-xl font-semibold leading-8 text-card-foreground">
                  {section.title}
                </h3>
                <p className="mt-4 text-sm leading-8 text-foreground/76">
                  {section.body}
                </p>
              </article>
            ))}
          </div>

          <section className="rounded-[1.9rem] border border-[#f0cb97]/16 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] p-5">
            <div className="space-y-2">
              <p className="text-sm text-foreground/56">{t("最後提醒", "Final note")}</p>
              <h3 className="text-xl font-semibold text-card-foreground">
                {t("把這次答案真正帶進接下來的行動", "Take this answer into your next step")}
              </h3>
            </div>

            {closingNote ? (
              <p className="mt-4 text-sm leading-8 text-card-foreground">
                {closingNote}
              </p>
            ) : null}

            {outlookBody ? (
              <div className="mt-4 rounded-[1.35rem] border border-white/10 bg-black/18 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/44">
                  {t("近期結果", "Near-term outlook")}
                </p>
                <p className="mt-3 text-sm leading-7 text-card-foreground">
                  {outlookBody}
                </p>
              </div>
            ) : null}

            {guidanceSteps.length > 0 ? (
              <div className="mt-4 grid gap-3">
                {guidanceSteps.map((step, index) => (
                  <div
                    key={`${index + 1}-${step}`}
                    className="flex gap-4 rounded-[1.3rem] border border-white/10 bg-black/18 px-4 py-4"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#f0cb97]/18 bg-[#f0cb97]/8 text-sm font-semibold text-[#f3d4a7]">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <p className="text-sm leading-7 text-card-foreground">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="mt-5 grid gap-3">
              <button
                type="button"
                onClick={handleStartAgain}
                className="min-h-[3.5rem] rounded-[1.35rem] bg-white px-4 py-4 text-sm font-semibold text-black transition hover:opacity-92"
              >
                {t("開始下一個問題", "Start the next question")}
              </button>
              <Link
                href="/"
                className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-center text-sm font-medium text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07]"
              >
                {t("返回首頁", "Back to home")}
              </Link>
            </div>
          </section>
        </>
      ) : (
        <div className="rounded-[1.85rem] border border-white/8 bg-white/[0.04] p-5">
          <h3 className="text-lg font-semibold text-card-foreground">
            {status === "needs_points"
              ? t("補點後繼續讀取答案", "Add points to continue")
              : status === "failed"
                ? t("再試一次", "Try again")
                : t("答案即將完成", "Almost ready")}
          </h3>
          <p className="mt-3 text-sm leading-7 text-foreground/76">
            {status === "needs_points"
              ? inlineText(
                  errorMessage ||
                    t(
                      `目前有 ${pointsState?.available ?? 0} 點，讀取本次完整答案需要 ${pointsState?.required ?? 0} 點。`,
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
                  className="min-h-[3.6rem] rounded-[1.4rem] border border-[#f7d9b2]/55 bg-[linear-gradient(180deg,#f5d49f_0%,#eabf80_46%,#d89e58_100%)] px-4 py-4 text-center text-sm font-semibold text-[#1b1209] shadow-[0_18px_52px_rgba(225,166,92,0.2),inset_0_1px_0_rgba(255,255,255,0.3)] transition hover:-translate-y-px hover:brightness-[1.03]"
                >
                  {t("補入點數，繼續讀取", "Add points")}
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
                  className="min-h-[3.6rem] rounded-[1.4rem] border border-[#f7d9b2]/55 bg-[linear-gradient(180deg,#f5d49f_0%,#eabf80_46%,#d89e58_100%)] px-4 py-4 text-sm font-semibold text-[#1b1209] shadow-[0_18px_52px_rgba(225,166,92,0.2),inset_0_1px_0_rgba(255,255,255,0.3)] transition hover:-translate-y-px hover:brightness-[1.03]"
                >
                  {t("重新整理這次答案", "Generate again")}
                </button>
                <Link
                  href="/reveal"
                  className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-center text-sm font-medium text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07]"
                >
                  {t("回到牌陣", "Back to reveal")}
                </Link>
              </>
            ) : (
              <button
                type="button"
                onClick={handleStartAgain}
                className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm font-medium text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07]"
              >
                {t("改問新的問題", "Start a new question")}
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
