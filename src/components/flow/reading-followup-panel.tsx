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

function getStatusLabel(status: FollowupRecordStatus) {
  if (status === "ready") return "Answered";
  if (status === "needs_points") return "Points";
  if (status === "failed") return "Retry";
  if (status === "generating") return "Continuing";
  return "Idle";
}

export function ReadingFollowupPanel({ canOpen }: { canOpen: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
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
      : { sessionId, status: defaultFollowupStatus, currentRecord: null, records: [], errorMessage: null, pointsState: null };
  const { status, currentRecord, records, errorMessage, pointsState } = state;
  const isLocked = status === "generating" || status === "needs_points";

  useEffect(() => {
    resumeHandledIdRef.current = null;
  }, [sessionId]);

  function applyResponse(response: Awaited<ReturnType<typeof requestCurrentFollowup>>) {
    const currentFollowup = response.data.currentFollowup;
    const followups = response.data.followups ?? [];

    if (currentFollowup?.status === "ready") return setViewState({ sessionId, status: "ready", currentRecord: currentFollowup, records: followups, errorMessage: null, pointsState: null });
    if (currentFollowup?.status === "generating") return setViewState({ sessionId, status: "generating", currentRecord: currentFollowup, records: followups, errorMessage: null, pointsState: null });
    if (currentFollowup?.status === "needs_points") return setViewState({ sessionId, status: "needs_points", currentRecord: currentFollowup, records: followups, errorMessage: response.data.message || currentFollowup.errorMessage || null, pointsState: response.data.points ?? null });
    if (currentFollowup?.status === "failed") return setViewState({ sessionId, status: "failed", currentRecord: currentFollowup, records: followups, errorMessage: currentFollowup.errorMessage || response.data.message || followupFailureMessage, pointsState: null });
    setViewState({ sessionId, status: "idle", currentRecord: null, records: followups, errorMessage: response.data.message || null, pointsState: null });
  }

  async function runFollowup(body?: Partial<{ followupId: string; force: boolean; prompt: string; requestKey: string }>) {
    if (!sessionId || !canOpen) return;
    setViewState((previous) => ({ sessionId, status: "generating", currentRecord: previous.currentRecord, records: previous.records, errorMessage: null, pointsState: null }));
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

  const topUpHref = pointsState?.topUpHref ?? "/points?intent=followup&returnTo=%2Freading";

  return (
    <div className="grid gap-4 motion-safe:[animation:section-rise_1000ms_cubic-bezier(.22,1,.36,1)]">
      <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-5 sm:rounded-[1.95rem] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-strong">Continue the thread</p>
            <h3 className="mt-3 font-display text-[1.85rem] leading-[0.98] text-card-foreground">Ask one quieter<br />question from here.</h3>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-foreground/56">{getStatusLabel(status)}</span>
        </div>

        <p className="mt-4 max-w-[18rem] text-sm leading-7 text-muted">
          {!canOpen
            ? "The follow-up opens after the main report settles, so the next question can stay anchored to this exact spread."
            : status === "needs_points"
              ? "This next question is already held. Restore points once here, then return and let the thread continue."
              : status === "generating"
                ? "The next answer is being composed from the finished report, the revealed spread, and the question you just added."
                : status === "failed"
                  ? errorMessage || followupFailureMessage
                  : "Ask one calmer question that stays inside this same reading, instead of starting a new one from zero."}
        </p>

        <div className="mt-5 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.22em] text-foreground/52">
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2">Follow-up costs {followupCostPoints}</span>
          {currentRecord?.model ? <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2">{currentRecord.model}</span> : null}
          {records.length > 0 ? <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2">{records.length} thread{records.length > 1 ? "s" : ""}</span> : null}
        </div>

        <div className="mt-6 rounded-[1.45rem] border border-white/10 bg-black/18 p-4 sm:rounded-[1.55rem] sm:p-5">
          <label htmlFor="followup-prompt" className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-strong">Follow-up prompt</label>
          <textarea
            id="followup-prompt"
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
            }}
            disabled={!canOpen || isLocked}
            placeholder={!canOpen ? "The main reading settles first, then the next question can open from it." : isLocked ? "This thread is already being carried forward." : "Example: If I follow the quieter option, what shifts first?"}
            rows={4}
            className="mt-4 min-h-[7.5rem] w-full resize-none rounded-[1.2rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm leading-7 text-card-foreground outline-none transition placeholder:text-foreground/30 focus:border-[rgba(229,192,142,0.22)] disabled:cursor-not-allowed disabled:opacity-70"
          />
          <div className="mt-4 flex items-center justify-between gap-4">
            <p className="text-xs leading-6 text-foreground/50">Keep it focused enough to stay inside this same reading.</p>
            <p className="text-[10px] uppercase tracking-[0.22em] text-foreground/42">{draft.trim().length}/320</p>
          </div>
        </div>

        <div className="mt-6 grid gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canOpen || isLocked || !draft.trim()}
            className="min-h-[3.5rem] rounded-[1.35rem] border border-line-strong bg-brand px-4 py-4 text-sm font-semibold leading-5 text-black transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none sm:rounded-[1.4rem]"
          >
            {status === "generating" ? "Continuing this answer" : status === "needs_points" ? "Waiting for points" : "Ask a follow-up"}
          </button>

          {status === "needs_points" ? (
            <Link href={topUpHref} className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 bg-white/[0.05] px-4 py-4 text-center text-sm font-semibold leading-5 text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07] motion-reduce:transition-none sm:rounded-[1.4rem]">
              Add points for this follow-up
            </Link>
          ) : status === "failed" && currentRecord ? (
            <button type="button" onClick={handleRetry} className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 bg-white/[0.05] px-4 py-4 text-sm font-semibold leading-5 text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07] motion-reduce:transition-none sm:rounded-[1.4rem]">
              Try this follow-up again
            </button>
          ) : null}
        </div>
      </div>

      {records.length > 0 ? (
        <div className="grid gap-4">
          {records.map((followup, index) => {
            const isCurrent = currentRecord?.id === followup.id;

            return (
              <article key={followup.id} className="rounded-[1.65rem] border border-white/10 bg-white/[0.04] p-5 sm:rounded-[1.75rem] sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-strong">Follow-up {index + 1}</p>
                    <h3 className="mt-3 text-[1.1rem] font-semibold leading-7 text-card-foreground">{followup.prompt}</h3>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-foreground/56">{getStatusLabel(followup.status)}</span>
                </div>

                <div className="mt-5 h-px w-full bg-[linear-gradient(90deg,rgba(229,192,142,0.24),transparent)]" />

                {followup.status === "ready" ? (
                  <p className="mt-5 whitespace-pre-line text-sm leading-8 text-foreground/76 sm:leading-[2rem]">{followup.answer}</p>
                ) : followup.status === "generating" ? (
                  <div className="mt-5 rounded-[1.3rem] border border-white/10 bg-black/18 p-4">
                    <div className="flex items-center gap-3">
                      <span className="h-2.5 w-2.5 rounded-full bg-brand-strong motion-safe:animate-[altar-pulse_2.2s_ease-in-out_infinite]" />
                      <p className="text-sm leading-7 text-card-foreground">The thread is being carried forward from this exact reading.</p>
                    </div>
                  </div>
                ) : followup.status === "needs_points" ? (
                  <div className="mt-5 rounded-[1.3rem] border border-[rgba(229,192,142,0.18)] bg-[linear-gradient(180deg,rgba(185,144,93,0.12),rgba(185,144,93,0.04))] p-4">
                    <p className="text-sm leading-7 text-card-foreground">{followup.errorMessage || followupNeedsPointsMessage}</p>
                    {isCurrent ? <div className="mt-4 grid gap-3"><Link href={topUpHref} className="min-h-[3.5rem] rounded-[1.35rem] border border-line-strong bg-brand px-4 py-4 text-center text-sm font-semibold leading-5 text-black transition hover:bg-brand-strong motion-reduce:transition-none sm:rounded-[1.4rem]">Restore points and continue</Link></div> : null}
                  </div>
                ) : (
                  <div className="mt-5 rounded-[1.3rem] border border-white/10 bg-black/18 p-4">
                    <p className="text-sm leading-7 text-card-foreground">{followup.errorMessage || followupFailureMessage}</p>
                    {isCurrent ? <div className="mt-4 grid gap-3"><button type="button" onClick={handleRetry} className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 bg-white/[0.05] px-4 py-4 text-sm font-semibold leading-5 text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07] motion-reduce:transition-none sm:rounded-[1.4rem]">Try this follow-up again</button></div> : null}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[1.65rem] border border-white/10 bg-white/[0.04] p-5 sm:rounded-[1.75rem] sm:p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-strong">Follow-up thread</p>
          <p className="mt-4 text-sm leading-7 text-muted">No follow-up has been sent yet. Once the main report feels clear enough, you can ask the next precise question here.</p>
        </div>
      )}
    </div>
  );
}
