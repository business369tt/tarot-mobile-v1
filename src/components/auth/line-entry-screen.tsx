"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useTarotFlow } from "@/components/flow/tarot-flow-provider";
import type { InviteClaimResult } from "@/lib/invite-records";

function buildInviteCallback(inviteCode: string) {
  const searchParams = new URLSearchParams({
    ref: inviteCode,
  });

  return `/auth/line?${searchParams.toString()}`;
}

function getInviteClaimCopy(inviteClaim: InviteClaimResult | null) {
  if (!inviteClaim) {
    return null;
  }

  if (inviteClaim.status === "rewarded") {
    return {
      eyebrow: "Invite settled",
      title: "This shared entry has been attached cleanly.",
      body: inviteClaim.inviterName
        ? `The link from ${inviteClaim.inviterName} has been recognized. Their reward has already settled, and your own reading path can begin from here.`
        : "This shared link has been recognized. The reward has settled quietly, and your own reading path can begin from here.",
    };
  }

  if (inviteClaim.status === "already_rewarded") {
    return {
      eyebrow: "Already attached",
      title: "This invitation is already held by this profile.",
      body: "The shared path has already been recognized here, so nothing else needs to settle before you continue.",
    };
  }

  if (inviteClaim.status === "already_attached") {
    return {
      eyebrow: "Invite already used",
      title: "Another shared path is already attached here.",
      body: "This LINE profile has already continued through another invite, so a second invite cannot settle on top of it.",
    };
  }

  if (inviteClaim.status === "self") {
    return {
      eyebrow: "Own link",
      title: "This invite already belongs to your profile.",
      body: "Share this link outward instead of using it on the same LINE account that created it.",
    };
  }

  if (inviteClaim.status === "invalid") {
    return {
      eyebrow: "Invite unavailable",
      title: "This shared link can no longer be restored.",
      body: "The code attached to this entry was not found, so the reward path cannot settle from here.",
    };
  }

  return {
    eyebrow: "Invite paused",
    title: "The invite could not settle just yet.",
    body: "The shared path is still quiet for the moment. You can continue with LINE again shortly if needed.",
  };
}

export function LineEntryScreen(props: {
  inviteCode?: string | null;
  inviteClaim?: InviteClaimResult | null;
}) {
  const router = useRouter();
  const {
    isHydrated,
    isAuthenticated,
    displayName,
    authProvider,
    initials,
    lineConfigured,
    beginLineSignIn,
    signOutFromLine,
  } = useAuth();
  const { session, ownsCurrentSession, getResumeRoute, startNewReading } =
    useTarotFlow();
  const hasOwnedSession = Boolean(session && ownsCurrentSession);
  const hasForeignSession = Boolean(session && !ownsCurrentSession);
  const inviteClaimCopy = getInviteClaimCopy(props.inviteClaim ?? null);

  async function handleLineSignIn() {
    await beginLineSignIn(
      props.inviteCode
        ? buildInviteCallback(props.inviteCode)
        : hasOwnedSession
          ? getResumeRoute()
          : "/question",
    );
  }

  function handleStartFresh() {
    startNewReading();
    startTransition(() => {
      router.push("/question");
    });
  }

  if (!isHydrated) {
    return (
      <section className="flex flex-1 flex-col justify-center gap-4 px-4 pb-5 pt-4 sm:px-5 sm:pb-6 sm:pt-5">
        <div className="rounded-[1.9rem] border border-white/10 bg-white/[0.04] p-6 shadow-[var(--shadow-soft)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-brand-strong">
            Preparing LINE entry
          </p>
          <h2 className="mt-4 font-display text-[2rem] leading-[0.96] text-card-foreground">
            Restoring your
            <br />
            access layer.
          </h2>
          <p className="mt-4 text-sm leading-7 text-muted">
            Bringing the current profile and reading state back into place
            before this entry surface opens fully.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-1 flex-col gap-4 px-4 pb-5 pt-4 sm:gap-5 sm:px-5 sm:pb-6 sm:pt-5">
      <div className="relative overflow-hidden rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,rgba(21,27,41,0.98),rgba(12,15,24,0.96))] p-6 shadow-[var(--shadow-soft)]">
        <div className="pointer-events-none absolute right-[-4rem] top-[-3rem] h-40 w-40 rounded-full bg-[radial-gradient(circle,_rgba(55,199,89,0.22),_transparent_68%)] blur-2xl" />
        <div className="pointer-events-none absolute left-[-3rem] bottom-[-3rem] h-28 w-28 rounded-full bg-[radial-gradient(circle,_rgba(185,144,93,0.16),_transparent_72%)] blur-2xl" />

        <p className="relative text-[10px] font-semibold uppercase tracking-[0.32em] text-brand-strong">
          LINE entry
        </p>
        <h2 className="relative mt-4 font-display text-[2.25rem] leading-[0.92] text-card-foreground">
          Let one LINE
          <br />
          profile hold the reading.
        </h2>
        <p className="relative mt-4 max-w-[18rem] text-sm leading-7 text-muted">
          The reading begins through LINE so the session, archive, points, and
          invite rewards stay attached to one clear identity from the start.
        </p>
      </div>

      {props.inviteCode ? (
        <div className="rounded-[1.8rem] border border-[rgba(229,192,142,0.18)] bg-[linear-gradient(180deg,rgba(185,144,93,0.12),rgba(185,144,93,0.04))] p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-strong">
            Shared entry
          </p>
          <p className="mt-3 text-sm leading-7 text-card-foreground">
            An invitation is already attached to this doorway. Continue with
            LINE and the shared path will settle automatically before the
            reading begins.
          </p>
        </div>
      ) : null}

      <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-foreground/42">
          Why LINE starts the flow
        </p>
        <div className="mt-4 grid gap-3">
          {[
            "Your question, chosen cards, and final report remain attached to one person.",
            "Session return, archive, and follow-up recovery stay tied to the same LINE profile.",
            "Points, invite rewards, and saved history stay under the same identity that opened the reading.",
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

      {inviteClaimCopy ? (
        <div className="rounded-[1.8rem] border border-[rgba(229,192,142,0.18)] bg-[linear-gradient(180deg,rgba(185,144,93,0.12),rgba(185,144,93,0.04))] p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-strong">
            {inviteClaimCopy.eyebrow}
          </p>
          <h3 className="mt-3 text-[1.1rem] font-semibold leading-7 text-card-foreground">
            {inviteClaimCopy.title}
          </h3>
          <p className="mt-3 text-sm leading-7 text-muted">
            {inviteClaimCopy.body}
          </p>
        </div>
      ) : null}

      {isAuthenticated ? (
        <div className="rounded-[1.8rem] border border-[rgba(229,192,142,0.18)] bg-[linear-gradient(180deg,rgba(185,144,93,0.12),rgba(185,144,93,0.04))] p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-sm font-semibold tracking-[0.18em] text-card-foreground">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-strong">
                Current profile
              </p>
              <p className="mt-2 text-lg font-semibold text-card-foreground">
                {displayName}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted">
                Connected through {authProvider?.toUpperCase()}. This profile
                is ready to begin or continue a reading.
              </p>
            </div>
          </div>

          {hasForeignSession ? (
            <div className="mt-5 rounded-[1.3rem] border border-white/10 bg-black/18 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-strong">
                Reading ownership
              </p>
              <p className="mt-3 text-sm leading-6 text-muted">
                A reading is already open in this browser, but it is not tied
                to this LINE profile. Begin a fresh one from this account to
                keep the path clean.
              </p>
            </div>
          ) : null}

          <div className="mt-6 grid gap-3">
            {hasOwnedSession ? (
              <Link
                href={getResumeRoute()}
                className="min-h-[3.5rem] rounded-[1.35rem] border border-line-strong bg-brand px-4 py-4 text-center text-sm font-semibold leading-5 text-black transition hover:bg-brand-strong"
              >
                Return to current reading
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleStartFresh}
                className="min-h-[3.5rem] rounded-[1.35rem] border border-line-strong bg-brand px-4 py-4 text-sm font-semibold leading-5 text-black transition hover:bg-brand-strong"
              >
                Begin from question
              </button>
            )}

            {hasForeignSession ? (
              <button
                type="button"
                onClick={handleStartFresh}
                className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 bg-white/[0.05] px-4 py-4 text-sm font-semibold leading-5 text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07]"
              >
                Start a fresh reading here
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => {
                void signOutFromLine();
              }}
              className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 bg-white/[0.05] px-4 py-4 text-sm font-semibold leading-5 text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07]"
            >
              Use another LINE profile
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-strong">
            LINE sign-in
          </p>
          <p className="mt-3 text-sm leading-7 text-muted">
            This entry uses the real LINE auth route. Once the channel ID and
            secret are present in this environment, the button below opens the
            standard LINE login handoff.
          </p>

          {!lineConfigured ? (
            <div className="mt-5 rounded-[1.3rem] border border-white/10 bg-black/18 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-strong">
                Current environment
              </p>
              <p className="mt-3 text-sm leading-6 text-muted">
                LINE sign-in is paused on this environment until the channel ID
                and secret are added.
              </p>
            </div>
          ) : null}

          <div className="mt-6 grid gap-3">
            <button
              type="button"
              onClick={() => {
                void handleLineSignIn();
              }}
              disabled={!lineConfigured}
              className="min-h-[3.5rem] rounded-[1.35rem] border border-[rgba(55,199,89,0.28)] bg-[linear-gradient(180deg,rgba(55,199,89,0.92),rgba(41,171,72,0.9))] px-4 py-4 text-sm font-semibold leading-5 text-black transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Continue with LINE
            </button>

            <Link
              href="/"
              className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 bg-white/[0.05] px-4 py-4 text-center text-sm font-semibold leading-5 text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07]"
            >
              Back to home
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
