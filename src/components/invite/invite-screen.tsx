"use client";

import Link from "next/link";
import { useState } from "react";
import type { InviteSurface } from "@/lib/invite-records";

async function copyText(value: string) {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    throw new Error("CLIPBOARD_UNAVAILABLE");
  }

  await navigator.clipboard.writeText(value);
}

export function InviteScreen(props: { surface: InviteSurface }) {
  const { surface } = props;
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleCopyLink() {
    try {
      await copyText(surface.inviteLink);
      setFeedback("Invite link copied.");
    } catch {
      setFeedback(
        "Copy is unavailable in this browser right now. You can still use the code shown below.",
      );
    }
  }

  async function handleCopyCode() {
    try {
      await copyText(surface.code);
      setFeedback("Invite code copied.");
    } catch {
      setFeedback(
        "Copy is unavailable in this browser right now. The code is still visible below.",
      );
    }
  }

  async function handleShare() {
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function"
    ) {
      try {
        await navigator.share({
          title: "Tarot Mobile invite",
          text: `Enter through this tarot link and let the next reading begin from the same quiet doorway.`,
          url: surface.inviteLink,
        });
        setFeedback("Invite link ready to share.");
        return;
      } catch {
        setFeedback("The share sheet closed before the link was sent.");
        return;
      }
    }

    await handleCopyLink();
  }

  return (
    <section className="flex flex-1 flex-col gap-4 px-4 pb-5 pt-4 sm:gap-5 sm:px-5 sm:pb-6 sm:pt-5">
      <div className="relative overflow-hidden rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,rgba(21,27,41,0.98),rgba(12,15,24,0.96))] p-5 shadow-[var(--shadow-soft)] sm:rounded-[2rem] sm:p-6">
        <div className="pointer-events-none absolute right-[-4rem] top-[-3rem] h-36 w-36 rounded-full bg-[radial-gradient(circle,_rgba(185,144,93,0.18),_transparent_68%)] blur-3xl" />
        <div className="pointer-events-none absolute left-[-4rem] top-12 h-28 w-28 rounded-full bg-[radial-gradient(circle,_rgba(121,152,255,0.1),_transparent_72%)] blur-3xl" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-brand-strong">
          Invitation circle
        </p>
        <h2 className="mt-4 font-display text-[2.1rem] leading-[0.94] text-card-foreground sm:text-[2.35rem] sm:leading-[0.92]">
          Share the doorway,
          <br />
          let the reward settle.
        </h2>
        <p className="mt-4 max-w-[18rem] text-sm leading-7 text-muted">
          Your link opens the same quiet LINE entry for someone new. Once they
          continue through it, the reward settles back into your balance and
          appears in the ledger.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-[1.3rem] border border-white/10 bg-black/18 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/42">
              Invited so far
            </p>
            <p className="mt-2 text-lg font-semibold text-card-foreground">
              {surface.invitedCount}
            </p>
            <p className="mt-2 text-xs leading-6 text-muted">
              Readers who entered through your link.
            </p>
          </div>
          <div className="rounded-[1.3rem] border border-white/10 bg-black/18 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/42">
              Reward settled
            </p>
            <p className="mt-2 text-lg font-semibold text-card-foreground">
              {surface.totalRewardPoints} pts
            </p>
            <p className="mt-2 text-xs leading-6 text-muted">
              Total points returned through invitations.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-5 sm:rounded-[1.9rem] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-strong">
              Your invite key
            </p>
            <h3 className="mt-3 font-mono text-[1.6rem] font-semibold tracking-[0.18em] text-card-foreground">
              {surface.code}
            </h3>
            <p className="mt-3 text-sm leading-7 text-muted">
              Share the link or the code. The same reward path returns to this
              LINE profile only.
            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-foreground/56">
            +{surface.rewardPerInvite} pts each
          </span>
        </div>

        <div className="mt-5 rounded-[1.35rem] border border-white/10 bg-black/18 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-foreground/42">
            Invite link
          </p>
          <p className="mt-3 break-all text-sm leading-7 text-card-foreground">
            {surface.inviteLink}
          </p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              void handleShare();
            }}
            className="min-h-[3.5rem] rounded-[1.35rem] border border-line-strong bg-brand px-4 py-4 text-sm font-semibold leading-5 text-black transition hover:bg-brand-strong sm:rounded-[1.4rem]"
          >
            Share invite link
          </button>
          <button
            type="button"
            onClick={() => {
              void handleCopyLink();
            }}
            className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 bg-white/[0.05] px-4 py-4 text-sm font-semibold leading-5 text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07] sm:rounded-[1.4rem]"
          >
            Copy link
          </button>
          <button
            type="button"
            onClick={() => {
              void handleCopyCode();
            }}
            className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 bg-black/18 px-4 py-4 text-sm font-semibold leading-5 text-card-foreground transition hover:border-line-strong hover:bg-white/[0.05] sm:rounded-[1.4rem] sm:col-span-2"
          >
            Copy invite code
          </button>
        </div>

        {feedback ? (
          <p className="mt-4 text-sm leading-6 text-brand-strong">{feedback}</p>
        ) : null}
      </div>

      <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-5 sm:rounded-[1.9rem] sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-strong">
          How it settles
        </p>
        <div className="mt-4 grid gap-3">
          {[
            {
              eyebrow: "You receive",
              body: `+${surface.rewardPerInvite} points when a new reader continues through your link and links LINE.`,
            },
            {
              eyebrow: "Friend receives",
              body: "A direct start into their own reading path through the same quiet entry, without extra setup.",
            },
            {
              eyebrow: "Next step",
              body: `Once the shared entry is completed, the reward settles into your balance and appears in /points automatically.`,
            },
          ].map((item) => (
            <div
              key={item.eyebrow}
              className="rounded-[1.3rem] border border-white/10 bg-black/18 p-4"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-strong">
                {item.eyebrow}
              </p>
              <p className="mt-3 text-sm leading-7 text-muted">{item.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[1.8rem] border border-[rgba(229,192,142,0.18)] bg-[linear-gradient(180deg,rgba(185,144,93,0.12),rgba(185,144,93,0.04))] p-5 sm:rounded-[1.95rem] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-strong">
              Reward summary
            </p>
            <h3 className="mt-3 text-[1.15rem] font-semibold text-card-foreground">
              Invite progress held under this profile.
            </h3>
          </div>
          <span className="rounded-full border border-white/10 bg-black/18 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-foreground/56">
            {surface.availablePoints} pts available now
          </span>
        </div>

        {surface.recentProgress.length > 0 ? (
          <div className="mt-5 grid gap-3">
            {surface.recentProgress.map((item) => (
              <article
                key={item.id}
                className="rounded-[1.45rem] border border-white/10 bg-black/18 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-foreground/56">
                        {item.statusLabel}
                      </span>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-foreground/42">
                        {item.createdLabel}
                      </p>
                    </div>
                    <h4 className="mt-3 text-[1rem] font-semibold text-card-foreground">
                      {item.inviteeName}
                    </h4>
                    <p className="mt-2 text-sm leading-7 text-muted">
                      {item.summary}
                    </p>
                  </div>
                  <p className="shrink-0 text-[1rem] font-semibold text-brand-strong">
                    {item.rewardLabel}
                  </p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-[1.45rem] border border-dashed border-white/10 bg-black/18 p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-strong">
              No invite movement yet
            </p>
            <h3 className="mt-3 text-[1.1rem] font-semibold leading-7 text-card-foreground">
              The first accepted invite will settle here.
            </h3>
            <p className="mt-3 text-sm leading-7 text-muted">
              Share your link once. When a new reader enters through it and
              links LINE, the reward appears here and in the points ledger.
            </p>
          </div>
        )}
      </div>

      <div className="mt-auto grid gap-3">
        <Link
          href="/points"
          className="min-h-[3.5rem] rounded-[1.35rem] border border-line-strong bg-brand px-4 py-4 text-center text-sm font-semibold leading-5 text-black transition hover:bg-brand-strong sm:rounded-[1.4rem]"
        >
          Open points ledger
        </Link>
        <Link
          href="/question"
          className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 bg-white/[0.05] px-4 py-4 text-center text-sm font-semibold leading-5 text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07] sm:rounded-[1.4rem]"
        >
          Begin a new question
        </Link>
      </div>
    </section>
  );
}
