"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  startTransition,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import { useTarotFlow } from "@/components/flow/tarot-flow-provider";
import { useLocale } from "@/components/i18n/locale-provider";
import {
  defaultFollowupStatus,
  followupFailureMessage,
  followupNeedsPointsMessage,
  type FollowupRecord,
  type FollowupRecordStatus,
} from "@/lib/followup-record";
import { followupCostPoints } from "@/lib/points";

type PointsState = {
  available: number;
  required: number;
  topUpHref: string;
};

type CurrentFollowupApiResponse = {
  currentFollowup: FollowupRecord | null;
  followups: FollowupRecord[];
  message?: string | null;
  points?: PointsState | null;
};

type FollowupScreenState = {
  sessionId: string | null;
  status: FollowupRecordStatus;
  currentRecord: FollowupRecord | null;
  records: FollowupRecord[];
  errorMessage: string | null;
  pointsState: PointsState | null;
};

const followupPromptSuggestions = [
  {
    zh: "如果我現在主動跨出一步，最先要做的是什麼？",
    en: "If I act now, what is the very first move?",
  },
  {
    zh: "這件事接下來最不該忽略的訊號是什麼？",
    en: "What signal should I not ignore next?",
  },
  {
    zh: "如果我先觀望一小段時間，局勢會怎麼變？",
    en: "If I wait a little longer, how will the situation shift?",
  },
];

async function requestCurrentFollowup(
  method: "GET" | "POST",
  body?: Partial<{
    followupId: string;
    force: boolean;
    prompt: string;
    requestKey: string;
  }>,
) {
  const response = await fetch("/api/followup/current", {
    method,
    cache: "no-store",
    headers: method === "POST" ? { "Content-Type": "application/json" } : undefined,
    body: method === "POST" ? JSON.stringify(body ?? {}) : undefined,
  });
  const data = (await response.json().catch(() => ({
    currentFollowup: null,
    followups: [],
    message: followupFailureMessage,
  }))) as CurrentFollowupApiResponse;

  return { status: response.status, data };
}

function createFollowupRequestKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `followup:${crypto.randomUUID()}`;
  }

  return `followup:${Date.now().toString(36)}`;
}

function getStatusLabel(
  status: FollowupRecordStatus,
  t: (zh: string, en: string) => string,
) {
  if (status === "ready") return t("已完成", "Ready");
  if (status === "needs_points") return t("待補點", "Needs points");
  if (status === "failed") return t("可重試", "Retry");
  if (status === "generating") return t("生成中", "Generating");
  return t("待命中", "Idle");
}

function getFollowupModelLine(
  record: FollowupRecord | null,
  t: (zh: string, en: string) => string,
) {
  if (!record) {
    return t("AI 延伸解讀", "AI follow-up");
  }

  return `MiniMax · ${record.model}`;
}

function formatFollowupTime(isoString: string, locale: "zh-TW" | "en") {
  const date = new Date(isoString);

  if (Number.isNaN(date.getTime())) {
    return locale === "zh-TW" ? "剛剛更新" : "Just updated";
  }

  return new Intl.DateTimeFormat(locale, {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function ReadingFollowupPanel({ canOpen }: { canOpen: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { inlineText, locale, t } = useLocale();
  const { session } = useTarotFlow();
  const sessionId = session?.sessionId ?? null;
  const resumeIntent = searchParams.get("resume");
  const [draft, setDraft] = useState("");
  const [historyState, setHistoryState] = useState({
    sessionId,
    expanded: false,
  });
  const resumeHandledIdRef = useRef<string | null>(null);
  const [viewState, setViewState] = useState<FollowupScreenState>({
    sessionId,
    status: defaultFollowupStatus,
    currentRecord: null,
    records: [],
    errorMessage: null,
    pointsState: null,
  });
  const state =
    viewState.sessionId === sessionId
      ? viewState
      : {
          sessionId,
          status: defaultFollowupStatus,
          currentRecord: null,
          records: [],
          errorMessage: null,
          pointsState: null,
        };
  const { status, currentRecord, records, errorMessage, pointsState } = state;
  const isLocked = status === "generating" || status === "needs_points";
  const showHistory =
    historyState.sessionId === sessionId ? historyState.expanded : false;
  const orderedRecords = [...records].reverse();
  const latestRecord = orderedRecords[0] ?? null;
  const visibleRecords = showHistory
    ? orderedRecords
    : latestRecord
      ? [latestRecord]
      : [];
  const hiddenRecordCount = Math.max(orderedRecords.length - visibleRecords.length, 0);
  const statusLabel = getStatusLabel(status, t);
  const modelLine = getFollowupModelLine(currentRecord, t);
  const introTitle = !canOpen
    ? t("主解讀完成後，就能沿著答案繼續問", "Follow-ups open once the reading is ready")
    : status === "needs_points"
      ? t("補入點數，繼續這條線索", "Add points to continue this thread")
      : status === "failed"
        ? t("這次追問還沒完整落下", "This follow-up did not fully settle")
        : status === "generating"
          ? t("AI 正沿著剛才的答案往下推進", "Your next question is being prepared")
          : t("順著這次答案，再問深一層", "Ask one more question to go deeper");
  const introBody = !canOpen
    ? t("先完成主解讀，追問就會接在同一份答案後面，不需要重新抽牌。", "Follow-ups continue from the same reading without a new draw.")
    : status === "needs_points"
      ? inlineText(errorMessage || followupNeedsPointsMessage)
      : status === "failed"
        ? inlineText(errorMessage || followupFailureMessage)
        : status === "generating"
          ? t(
              "你的問題、主解讀與三張牌正在被重新整合，等一下就會回到這裡。",
              "The AI is continuing from your main reading now.",
            )
          : t(
              `每次追問會花費 ${followupCostPoints} 點，並直接延續這次直答三張牌的脈絡。`,
              `Each follow-up costs ${followupCostPoints} points and continues this reading.`,
            );

  useEffect(() => {
    resumeHandledIdRef.current = null;
  }, [sessionId]);

  function applyResponse(response: Awaited<ReturnType<typeof requestCurrentFollowup>>) {
    const currentFollowup = response.data.currentFollowup;
    const followups = response.data.followups ?? [];

    if (currentFollowup?.status === "ready") {
      return setViewState({
        sessionId,
        status: "ready",
        currentRecord: currentFollowup,
        records: followups,
        errorMessage: null,
        pointsState: null,
      });
    }

    if (currentFollowup?.status === "generating") {
      return setViewState({
        sessionId,
        status: "generating",
        currentRecord: currentFollowup,
        records: followups,
        errorMessage: null,
        pointsState: null,
      });
    }

    if (currentFollowup?.status === "needs_points") {
      return setViewState({
        sessionId,
        status: "needs_points",
        currentRecord: currentFollowup,
        records: followups,
        errorMessage:
          response.data.message || currentFollowup.errorMessage || null,
        pointsState: response.data.points ?? null,
      });
    }

    if (currentFollowup?.status === "failed") {
      return setViewState({
        sessionId,
        status: "failed",
        currentRecord: currentFollowup,
        records: followups,
        errorMessage:
          currentFollowup.errorMessage ||
          response.data.message ||
          followupFailureMessage,
        pointsState: null,
      });
    }

    setViewState({
      sessionId,
      status: "idle",
      currentRecord: null,
      records: followups,
      errorMessage: response.data.message || null,
      pointsState: null,
    });
  }

  async function runFollowup(
    body?: Partial<{
      followupId: string;
      force: boolean;
      prompt: string;
      requestKey: string;
    }>,
  ) {
    if (!sessionId || !canOpen) return;
    setViewState((previous) => ({
      sessionId,
      status: "generating",
      currentRecord: previous.currentRecord,
      records: previous.records,
      errorMessage: null,
      pointsState: null,
    }));
    const response = await requestCurrentFollowup("POST", body);
    applyResponse(response);
  }

  const applyFollowupResponse = useEffectEvent(applyResponse);
  const continueFollowup = useEffectEvent(runFollowup);

  useEffect(() => {
    if (!sessionId || !canOpen) return;
    let active = true;

    async function bootstrap() {
      const response = await requestCurrentFollowup("GET");
      if (!active) return;
      applyFollowupResponse(response);
    }

    void bootstrap();
    return () => {
      active = false;
    };
  }, [canOpen, sessionId]);

  useEffect(() => {
    if (!sessionId || status !== "generating") return;
    let active = true;
    const intervalId = window.setInterval(async () => {
      const response = await requestCurrentFollowup("GET");
      if (!active) return;
      applyFollowupResponse(response);
      if (response.data.currentFollowup?.status !== "generating") {
        window.clearInterval(intervalId);
      }
    }, 2500);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [sessionId, status]);

  useEffect(() => {
    if (
      resumeIntent !== "followup" ||
      !currentRecord ||
      currentRecord.status !== "needs_points" ||
      resumeHandledIdRef.current === currentRecord.id
    ) {
      return;
    }
    resumeHandledIdRef.current = currentRecord.id;
    startTransition(() => {
      router.replace(pathname);
    });
    void continueFollowup({ followupId: currentRecord.id, force: true });
  }, [currentRecord, pathname, resumeIntent, router]);

  function handleSubmit() {
    const prompt = draft.trim();
    if (!prompt || !canOpen || isLocked) return;
    setDraft("");
    void runFollowup({ prompt, requestKey: createFollowupRequestKey() });
  }

  function handleRetry() {
    if (!currentRecord) return;
    void runFollowup({ followupId: currentRecord.id, force: true });
  }

  const topUpHref =
    pointsState?.topUpHref ?? "/points?intent=followup&returnTo=%2Freading";

  return (
    <div className="grid gap-4">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(18,23,38,0.98),rgba(8,10,16,0.98))] p-5 shadow-[var(--shadow-soft)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(185,144,93,0.14),_transparent_38%)]" />
        <div className="pointer-events-none absolute right-[-4rem] top-[-3rem] h-44 w-44 rounded-full border border-[#f0cb97]/10 opacity-60" />
        <div className="pointer-events-none absolute left-[10%] top-[35%] h-24 w-24 rounded-full border border-white/6 opacity-70" />

        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[#f1c98d]/18 bg-[#f1c98d]/8 px-3 py-1 text-[0.72rem] font-medium tracking-[0.18em] text-[#f3d4a7]">
                  {t("延伸追問", "FOLLOW-UP")}
                </span>
                <span className="text-xs text-foreground/52">{modelLine}</span>
              </div>
              <h3 className="max-w-[15rem] text-[2rem] font-semibold leading-[1.02] tracking-tight text-card-foreground">
                {introTitle}
              </h3>
              <p className="max-w-[18rem] text-sm leading-7 text-foreground/68">
                {introBody}
              </p>
            </div>

            <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-foreground/68">
              {statusLabel}
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.35rem] border border-white/10 bg-black/18 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/42">
                {t("每次追問", "Per follow-up")}
              </p>
              <p className="mt-2 text-sm font-semibold text-card-foreground">
                {t(`${followupCostPoints} 點`, `${followupCostPoints} points`)}
              </p>
            </div>
            <div className="rounded-[1.35rem] border border-white/10 bg-black/18 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/42">
                {t("流程方式", "Flow")}
              </p>
              <p className="mt-2 text-sm font-semibold text-card-foreground">
                {t("不重新抽牌", "No redraw")}
              </p>
            </div>
            <div className="rounded-[1.35rem] border border-white/10 bg-black/18 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/42">
                {t("目前累積", "Current thread")}
              </p>
              <p className="mt-2 text-sm font-semibold text-card-foreground">
                {t(`${records.length} 則追問`, `${records.length} follow-ups`)}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-[1.55rem] border border-white/10 bg-black/20 p-4">
            <p className="text-sm text-foreground/56">
              {t("把你現在最想追下去的一句話問清楚。", "Ask the next question that matters most.")}
            </p>
            <textarea
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
              }}
              disabled={!canOpen || isLocked}
              placeholder={t(
                "例如：如果我這週主動聯絡對方，最需要留意的反應是什麼？",
                "For example: What should I pay attention to next?",
              )}
              rows={5}
              className="mt-3 min-h-[8rem] w-full resize-none bg-transparent text-sm leading-7 text-card-foreground outline-none placeholder:text-foreground/30 disabled:cursor-not-allowed disabled:opacity-70"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {followupPromptSuggestions.map((suggestion) => (
              <button
                key={suggestion.zh}
                type="button"
                disabled={!canOpen || isLocked}
                onClick={() => setDraft(t(suggestion.zh, suggestion.en))}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-left text-xs leading-5 text-foreground/68 transition hover:border-line-strong hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {t(suggestion.zh, suggestion.en)}
              </button>
            ))}
          </div>

          <p className="mt-4 text-sm leading-6 text-foreground/52">
            {!canOpen
              ? t("主解讀完成後，這裡會直接承接同一份答案。", "This opens after the main reading is ready.")
              : t(
                  "追問會沿用這次三張牌與主解讀脈絡，不需要重新抽牌，也不會打斷目前的閱讀節奏。",
                  "Your follow-up continues from this reading without a new draw.",
                )}
          </p>

          <div className="mt-5 grid gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canOpen || isLocked || !draft.trim()}
              className="min-h-[3.7rem] rounded-[1.4rem] border border-[#f7d9b2]/55 bg-[linear-gradient(180deg,#f5d49f_0%,#eabf80_46%,#d89e58_100%)] px-4 py-4 text-sm font-semibold text-[#1b1209] shadow-[0_18px_52px_rgba(225,166,92,0.2),inset_0_1px_0_rgba(255,255,255,0.3)] transition hover:-translate-y-px hover:brightness-[1.03] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 disabled:hover:brightness-100"
            >
              {status === "generating"
                ? t("AI 正在延伸答案", "Generating follow-up")
                : status === "needs_points"
                  ? t("先補點，再送出追問", "Add points first")
                  : t("送出這次追問", "Ask follow-up")}
            </button>

            {status === "needs_points" ? (
              <Link
                href={topUpHref}
                className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-center text-sm font-medium text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07]"
              >
                {t("補入點數，回到這裡", "Add points")}
              </Link>
            ) : status === "failed" && currentRecord ? (
              <button
                type="button"
                onClick={handleRetry}
                className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm font-medium text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07]"
              >
                {t("重新嘗試這次追問", "Try again")}
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {records.length > 0 ? (
        <section className="grid gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-sm text-foreground/46">
                {showHistory ? t("完整追問脈絡", "Follow-up history") : t("最新一則追問", "Latest follow-up")}
              </p>
              <h3 className="text-[1.45rem] font-semibold tracking-tight text-card-foreground">
                {showHistory
                  ? t("沿著同一條答案，往回看整段線索", "Continue the same thread")
                  : t("先從最新回覆開始讀", "Start with the newest reply first")}
              </h3>
            </div>

            {records.length > 1 ? (
              <button
                type="button"
                onClick={() =>
                  setHistoryState((previous) => ({
                    sessionId,
                    expanded:
                      previous.sessionId === sessionId ? !previous.expanded : true,
                  }))
                }
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07]"
              >
                {showHistory
                  ? t("收起較早追問", "Hide earlier replies")
                  : t(`展開更早的 ${hiddenRecordCount} 則`, `Show ${hiddenRecordCount} earlier`)}
              </button>
            ) : null}
          </div>

          <div className="grid gap-4">
            {visibleRecords.map((followup, index) => {
              const isCurrent = currentRecord?.id === followup.id;
              const recordNumber = orderedRecords.length - index;
              const timestamp = formatFollowupTime(followup.createdAt, locale);

              return (
                <article
                  key={followup.id}
                  className={`rounded-[1.75rem] border p-5 ${
                    isCurrent
                      ? "border-[#f0cb97]/16 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))]"
                      : "border-white/8 bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/56">
                          {t(`追問 ${recordNumber}`, `Follow-up ${recordNumber}`)}
                        </span>
                        <span className="text-xs text-foreground/46">{timestamp}</span>
                        <span className="text-xs text-foreground/46">{`MiniMax · ${followup.model}`}</span>
                      </div>
                      <h4 className="text-lg font-semibold leading-7 text-card-foreground">
                        {followup.prompt}
                      </h4>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-foreground/68">
                      {getStatusLabel(followup.status, t)}
                    </span>
                  </div>

                  {followup.status === "ready" ? (
                    <div className="mt-4 rounded-[1.35rem] border border-white/10 bg-black/18 px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/42">
                        {t("AI 延伸回答", "AI answer")}
                      </p>
                      <p className="mt-3 whitespace-pre-line text-sm leading-8 text-foreground/76">
                        {followup.answer}
                      </p>
                    </div>
                  ) : followup.status === "generating" ? (
                    <div className="mt-4 rounded-[1.35rem] border border-white/10 bg-black/18 px-4 py-4">
                      <p className="text-sm leading-7 text-foreground/68">
                        {t("AI 正在根據主解讀與這則問題繼續整理答案，完成後會直接顯示在這裡。", "This follow-up is still being prepared.")}
                      </p>
                    </div>
                  ) : followup.status === "needs_points" ? (
                    <div className="mt-4 space-y-3 rounded-[1.35rem] border border-white/10 bg-black/18 px-4 py-4">
                      <p className="text-sm leading-7 text-foreground/76">
                        {inlineText(followup.errorMessage || followupNeedsPointsMessage)}
                      </p>
                      {isCurrent ? (
                        <Link
                          href={topUpHref}
                          className="inline-flex min-h-[3rem] items-center justify-center rounded-[1.2rem] bg-white px-4 text-sm font-semibold text-black transition hover:opacity-92"
                        >
                          {t("補入點數", "Add points")}
                        </Link>
                      ) : null}
                    </div>
                  ) : (
                    <div className="mt-4 space-y-3 rounded-[1.35rem] border border-white/10 bg-black/18 px-4 py-4">
                      <p className="text-sm leading-7 text-foreground/76">
                        {inlineText(followup.errorMessage || followupFailureMessage)}
                      </p>
                      {isCurrent ? (
                        <button
                          type="button"
                          onClick={handleRetry}
                          className="inline-flex min-h-[3rem] items-center justify-center rounded-[1.2rem] border border-white/10 bg-white/[0.04] px-4 text-sm font-medium text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07]"
                        >
                          {t("重新嘗試", "Try again")}
                        </button>
                      ) : null}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
