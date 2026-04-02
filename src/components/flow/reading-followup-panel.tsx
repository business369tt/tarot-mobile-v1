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
  if (status === "needs_points") return t("需補點", "Needs points");
  if (status === "failed") return t("重試", "Retry");
  if (status === "generating") return t("生成中", "Generating");
  return t("待命", "Idle");
}

function getFollowupModelLine(
  record: FollowupRecord | null,
  t: (zh: string, en: string) => string,
) {
  if (!record) {
    return t("AI 追問", "AI follow-up");
  }

  return `MiniMax · ${record.model}`;
}

export function ReadingFollowupPanel({ canOpen }: { canOpen: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { inlineText, t } = useLocale();
  const { session } = useTarotFlow();
  const sessionId = session?.sessionId ?? null;
  const resumeIntent = searchParams.get("resume");
  const [draft, setDraft] = useState("");
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
  const statusLabel = getStatusLabel(status, t);
  const modelLine = getFollowupModelLine(currentRecord, t);
  const introTitle = !canOpen
    ? t("主解讀完成後，就能繼續追問", "Follow-up opens once the reading is ready")
    : status === "needs_points"
      ? t("補點後，繼續把這條線問下去", "Add points to continue this thread")
      : status === "failed"
        ? t("這次追問沒有完整落下", "This follow-up did not fully settle")
        : status === "generating"
          ? t("AI 正在整理你的下一個問題", "Your next question is being prepared")
          : t("想再深入一點，就再問一次", "Ask one more question to go deeper");
  const introBody = !canOpen
    ? t("等主解讀完成後，這裡就會開放。", "This opens after the main reading is ready.")
    : status === "needs_points"
      ? inlineText(errorMessage || followupNeedsPointsMessage)
      : status === "failed"
        ? inlineText(errorMessage || followupFailureMessage)
        : status === "generating"
          ? t(
              "AI 會沿著你剛才的主解讀往下整理，請稍等片刻。",
              "The AI is continuing from your main reading now.",
            )
          : t(
              `每次追問會消耗 ${followupCostPoints} 點，回答會直接接在這份解讀後面。`,
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
      <section className="rounded-[1.9rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/56">
                {t("AI 追問", "AI follow-up")}
              </span>
              <span className="text-xs text-foreground/52">{modelLine}</span>
            </div>
            <h3 className="max-w-[15rem] text-[1.95rem] font-semibold leading-[1.02] tracking-tight text-card-foreground">
              {introTitle}
            </h3>
            <p className="max-w-[18rem] text-sm leading-7 text-foreground/64">
              {introBody}
            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-foreground/68">
            {statusLabel}
          </span>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 rounded-[1.3rem] border border-white/10 bg-black/18 px-4 py-3">
          <p className="text-sm text-foreground/62">
            {t("每次追問", "Per follow-up")}
          </p>
          <p className="text-sm font-semibold text-card-foreground">
            {t(`${followupCostPoints} 點`, `${followupCostPoints} points`)}
          </p>
        </div>

        <div className="mt-5 rounded-[1.45rem] border border-white/10 bg-black/18 p-4">
          <textarea
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
            }}
            disabled={!canOpen || isLocked}
            placeholder={t(
              "例如：我接下來最該注意的是什麼？",
              "For example: What should I pay attention to next?",
            )}
            rows={4}
            className="min-h-[7rem] w-full resize-none bg-transparent text-sm leading-7 text-card-foreground outline-none placeholder:text-foreground/30 disabled:cursor-not-allowed disabled:opacity-70"
          />
        </div>

        <p className="mt-3 text-sm leading-6 text-foreground/52">
          {!canOpen
            ? t("主解讀完成後，這裡會自動開放。", "This opens after the main reading is ready.")
            : t(
                "追問會沿著你剛才的解讀往下延伸，不需要重新抽牌。",
                "Your follow-up continues from this reading without a new draw.",
              )}
        </p>

        <div className="mt-5 grid gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canOpen || isLocked || !draft.trim()}
            className="min-h-[3.65rem] rounded-[1.45rem] bg-white px-4 py-4 text-sm font-semibold text-black transition hover:opacity-92 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {status === "generating"
              ? t("AI 追問生成中", "Generating follow-up")
              : status === "needs_points"
                ? t("先補點再繼續", "Add points first")
                : t("送出追問", "Ask follow-up")}
          </button>

          {status === "needs_points" ? (
            <Link
              href={topUpHref}
              className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-center text-sm font-medium text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07]"
            >
              {t("補入點數", "Add points")}
            </Link>
          ) : status === "failed" && currentRecord ? (
            <button
              type="button"
              onClick={handleRetry}
              className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm font-medium text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07]"
            >
              {t("重新送出追問", "Try again")}
            </button>
          ) : null}
        </div>
      </section>

      {records.length > 0 ? (
        <section className="grid gap-4">
          <div className="space-y-2">
            <p className="text-sm text-foreground/46">
              {t("追問紀錄", "Follow-up history")}
            </p>
            <h3 className="text-[1.45rem] font-semibold tracking-tight text-card-foreground">
              {t("沿著同一條線往下看", "Continue the same thread")}
            </h3>
          </div>

          {records.map((followup, index) => {
            const isCurrent = currentRecord?.id === followup.id;
            const modelLabel = `MiniMax · ${followup.model}`;

            return (
              <article
                key={followup.id}
                className={`rounded-[1.7rem] border p-5 ${
                  isCurrent
                    ? "border-[#f0cb97]/16 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))]"
                    : "border-white/8 bg-white/[0.04]"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm text-foreground/56">
                        {t(`追問 ${index + 1}`, `Follow-up ${index + 1}`)}
                      </p>
                      <span className="text-xs text-foreground/46">{modelLabel}</span>
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
                  <p className="mt-4 whitespace-pre-line text-sm leading-8 text-foreground/76">
                    {followup.answer}
                  </p>
                ) : followup.status === "generating" ? (
                  <p className="mt-4 text-sm leading-7 text-foreground/62">
                    {t("AI 正在整理這次追問。", "This follow-up is still being prepared.")}
                  </p>
                ) : followup.status === "needs_points" ? (
                  <div className="mt-4 space-y-3">
                    <p className="text-sm leading-7 text-foreground/76">
                      {inlineText(followup.errorMessage || followupNeedsPointsMessage)}
                    </p>
                    {isCurrent ? (
                      <Link
                        href={topUpHref}
                        className="inline-flex min-h-[3rem] items-center justify-center rounded-[1.2rem] bg-white px-4 text-sm font-semibold text-black transition hover:opacity-92"
                      >
                        {t("補點後繼續", "Add points")}
                      </Link>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    <p className="text-sm leading-7 text-foreground/76">
                      {inlineText(followup.errorMessage || followupFailureMessage)}
                    </p>
                    {isCurrent ? (
                      <button
                        type="button"
                        onClick={handleRetry}
                        className="inline-flex min-h-[3rem] items-center justify-center rounded-[1.2rem] border border-white/10 bg-white/[0.04] px-4 text-sm font-medium text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07]"
                      >
                        {t("重新送出", "Try again")}
                      </button>
                    ) : null}
                  </div>
                )}
              </article>
            );
          })}
        </section>
      ) : null}
    </div>
  );
}
