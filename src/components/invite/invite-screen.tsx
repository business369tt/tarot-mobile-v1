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
      setFeedback("邀請連結已複製。 / Invite link copied.");
    } catch {
      setFeedback(
        "目前這個瀏覽器暫時無法複製，但你仍可以直接使用下方顯示的邀請碼。 / Copy is unavailable in this browser right now. You can still use the code shown below.",
      );
    }
  }

  async function handleCopyCode() {
    try {
      await copyText(surface.code);
      setFeedback("邀請碼已複製。 / Invite code copied.");
    } catch {
      setFeedback(
        "目前這個瀏覽器暫時無法複製，但邀請碼仍顯示在下方。 / Copy is unavailable in this browser right now. The code is still visible below.",
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
          title: "塔羅行動版邀請 / Tarot Mobile invite",
          text: `從這個塔羅連結進入，讓下一段解讀從同一個安靜入口開始。`,
          url: surface.inviteLink,
        });
        setFeedback("邀請連結已準備好分享。 / Invite link ready to share.");
        return;
      } catch {
        setFeedback("分享視窗已關閉，連結尚未送出。 / The share sheet closed before the link was sent.");
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
          邀請圈
        </p>
        <p className="mt-1 text-[9px] uppercase tracking-[0.16em] text-foreground/38">
          Invitation circle
        </p>
        <h2 className="mt-4">
          <span className="block font-display text-[2.1rem] leading-[0.94] text-card-foreground sm:text-[2.35rem] sm:leading-[0.92]">
            分享這個入口，
            <br />
            讓獎勵慢慢入帳。
          </span>
          <span className="mt-2 block text-sm leading-6 text-foreground/44">
            Share the doorway, let the reward settle.
          </span>
        </h2>
        <div className="mt-4 max-w-[18rem] space-y-2">
          <p className="text-sm leading-7 text-muted">
            你的連結會替新朋友打開同一個安靜的 LINE 入口。只要對方真的從那裡繼續，獎勵就會回到你的餘額，並出現在點數帳本裡。
          </p>
          <p className="text-xs leading-6 text-foreground/42">
            Your link opens the same quiet LINE entry for someone new. Once they continue through it, the reward settles back into your balance and appears in the ledger.
          </p>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-[1.3rem] border border-white/10 bg-black/18 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/42">
              已邀請人數 / Invited so far
            </p>
            <p className="mt-2 text-lg font-semibold text-card-foreground">
              {surface.invitedCount}
            </p>
            <p className="mt-2 text-xs leading-6 text-muted">
              從你的連結進來的人數。 / Readers who entered through your link.
            </p>
          </div>
          <div className="rounded-[1.3rem] border border-white/10 bg-black/18 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/42">
              已入帳獎勵 / Reward settled
            </p>
            <p className="mt-2 text-lg font-semibold text-card-foreground">
              {surface.totalRewardPoints} pts
            </p>
            <p className="mt-2 text-xs leading-6 text-muted">
              透過邀請回到你帳上的點數總額。 / Total points returned through invitations.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-5 sm:rounded-[1.9rem] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-strong">
              你的邀請碼 / Your invite key
            </p>
            <h3 className="mt-3 font-mono text-[1.6rem] font-semibold tracking-[0.18em] text-card-foreground">
              {surface.code}
            </h3>
            <p className="mt-3 text-sm leading-7 text-muted">
              你可以分享連結或邀請碼；同一條獎勵路徑只會回到這個 LINE 身份。
            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-foreground/56">
            {`每次 +${surface.rewardPerInvite} 點 / +${surface.rewardPerInvite} pts each`}
          </span>
        </div>

        <div className="mt-5 rounded-[1.35rem] border border-white/10 bg-black/18 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-foreground/42">
            邀請連結 / Invite link
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
            分享邀請連結（Share invite link）
          </button>
          <button
            type="button"
            onClick={() => {
              void handleCopyLink();
            }}
            className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 bg-white/[0.05] px-4 py-4 text-sm font-semibold leading-5 text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07] sm:rounded-[1.4rem]"
          >
            複製連結（Copy link）
          </button>
          <button
            type="button"
            onClick={() => {
              void handleCopyCode();
            }}
            className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 bg-black/18 px-4 py-4 text-sm font-semibold leading-5 text-card-foreground transition hover:border-line-strong hover:bg-white/[0.05] sm:rounded-[1.4rem] sm:col-span-2"
          >
            複製邀請碼（Copy invite code）
          </button>
        </div>

        {feedback ? (
          <p className="mt-4 text-sm leading-6 text-brand-strong">{feedback}</p>
        ) : null}
      </div>

      <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-5 sm:rounded-[1.9rem] sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-strong">
          入帳方式 / How it settles
        </p>
        <div className="mt-4 grid gap-3">
          {[
            {
              eyebrow: "你會收到 / You receive",
              body: `當新朋友透過你的連結進入並完成 LINE 綁定後，你會得到 +${surface.rewardPerInvite} 點。`,
            },
            {
              eyebrow: "朋友會收到 / Friend receives",
              body: "對方會從同一個安靜入口直接開始自己的解讀流程，不需要多做額外設定。",
            },
            {
              eyebrow: "下一步 / Next step",
              body: `只要共享入口完成，獎勵就會自動入到你的餘額，並顯示在 /points。`,
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
              獎勵摘要 / Reward summary
            </p>
            <h3 className="mt-3 text-[1.15rem] font-semibold text-card-foreground">
              目前身份底下的邀請進度。
            </h3>
          </div>
          <span className="rounded-full border border-white/10 bg-black/18 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-foreground/56">
            {`${surface.availablePoints} 點可用 / pts available now`}
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
              尚無邀請動態 / No invite movement yet
            </p>
            <h3 className="mt-3 text-[1.1rem] font-semibold leading-7 text-card-foreground">
              第一筆被接受的邀請，會在這裡入帳。
            </h3>
            <p className="mt-3 text-sm leading-7 text-muted">
              只要分享一次連結。當新朋友從那裡進入並綁定 LINE，獎勵就會出現在這裡和點數帳本裡。
            </p>
          </div>
        )}
      </div>

      <div className="mt-auto grid gap-3">
        <Link
          href="/points"
          className="min-h-[3.5rem] rounded-[1.35rem] border border-line-strong bg-brand px-4 py-4 text-center text-sm font-semibold leading-5 text-black transition hover:bg-brand-strong sm:rounded-[1.4rem]"
        >
          打開點數帳本（Open points ledger）
        </Link>
        <Link
          href="/question"
          className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 bg-white/[0.05] px-4 py-4 text-center text-sm font-semibold leading-5 text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07] sm:rounded-[1.4rem]"
        >
          開始新的提問（Begin a new question）
        </Link>
      </div>
    </section>
  );
}
