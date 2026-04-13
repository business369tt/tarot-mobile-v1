"use client";

import Link from "next/link";
import { useState } from "react";
import { useLocale } from "@/components/i18n/locale-provider";
import type { InviteSurface } from "@/lib/invite-records";

async function copyText(value: string) {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    throw new Error("CLIPBOARD_UNAVAILABLE");
  }

  await navigator.clipboard.writeText(value);
}

export function InviteScreen(props: { surface: InviteSurface }) {
  const { surface } = props;
  const { inlineText, t } = useLocale();
  const [feedback, setFeedback] = useState<string | null>(null);
  const latestReward = surface.recentProgress[0] ?? null;
  const shareMessage = t(
    `我最近在用這個塔羅解讀服務，體驗很不錯。你可以從這裡開始：${surface.inviteLink}。只要透過我的連結完成登入並開始使用，我就能獲得 ${surface.rewardPerInvite} 點邀請回饋。`,
    `I've been using this tarot reading app lately. Start here: ${surface.inviteLink}. If you join through my link, I receive ${surface.rewardPerInvite} invite points.`,
  );

  async function handleCopyLink() {
    try {
      await copyText(surface.inviteLink);
      setFeedback(t("邀請連結已複製。", "Invite link copied."));
    } catch {
      setFeedback(
        t(
          "這裡暫時無法直接複製，不過下方仍有完整連結與邀請碼可以手動使用。",
          "Copy is unavailable here right now, but the full link and code are still shown below.",
        ),
      );
    }
  }

  async function handleCopyCode() {
    try {
      await copyText(surface.code);
      setFeedback(t("邀請碼已複製。", "Invite code copied."));
    } catch {
      setFeedback(
        t(
          "這裡暫時無法直接複製，但下方仍可查看邀請碼。",
          "Copy is unavailable here right now, but the code is still visible below.",
        ),
      );
    }
  }

  async function handleCopyMessage() {
    try {
      await copyText(shareMessage);
      setFeedback(t("分享文案已複製。", "Share message copied."));
    } catch {
      setFeedback(
        t(
          "這裡暫時無法直接複製，但下方仍可查看完整分享文案。",
          "Copy is unavailable here right now, but the share message is still visible below.",
        ),
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
          title: t("塔羅邀請", "Tarot invite"),
          text: shareMessage,
          url: surface.inviteLink,
        });
        setFeedback(t("分享面板已開啟。", "Share sheet opened."));
        return;
      } catch {
        setFeedback(t("已取消分享。", "Share canceled."));
        return;
      }
    }

    await handleCopyLink();
  }

  return (
    <section className="flex flex-1 flex-col gap-5 py-6">
      <div className="space-y-4 pt-6">
        <span className="inline-flex items-center rounded-full border border-[#f1c98d]/18 bg-[#f1c98d]/8 px-3 py-1 text-[0.72rem] font-medium tracking-[0.18em] text-[#f3d4a7]">
          {t("邀請回饋", "INVITE")}
        </span>
        <h1 className="max-w-[14rem] text-[2.6rem] font-semibold leading-[1.02] tracking-tight text-card-foreground">
          {t("把連結送出去，就夠了", "Send the link")}
        </h1>
        <p className="max-w-[19rem] text-base leading-7 text-foreground/62">
          {t(
            `每成功邀請一位新讀者完成開始流程，你就會拿回 ${surface.rewardPerInvite} 點。`,
            `Each successful invite returns ${surface.rewardPerInvite} points to your balance.`,
          )}
        </p>
      </div>

      <div className="rounded-[1.9rem] border border-[rgba(229,192,142,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <span className="inline-flex rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/56">
              {t("分享連結", "Share first")}
            </span>
            <h2 className="max-w-[15rem] text-[1.95rem] font-semibold leading-[1.02] tracking-tight text-card-foreground">
              {t("這一頁最重要的動作，就是先分享", "The main action here is to share")}
            </h2>
            <p className="max-w-[18rem] text-sm leading-7 text-foreground/64">
              {latestReward
                ? t(
                    `最近一次回饋來自 ${inlineText(latestReward.inviteeName)}。下一步還是繼續把這份連結送出去。`,
                    `Your latest reward came from ${inlineText(latestReward.inviteeName)}. The next step is still to share again.`,
                  )
                : t(
                    "先把邀請連結送出去，比先看數字更重要。",
                    "Sending the link matters more than checking the numbers first.",
                  )}
            </p>
          </div>
          <span className="rounded-full border border-[rgba(229,192,142,0.18)] bg-[rgba(185,144,93,0.12)] px-3 py-1.5 text-xs font-medium text-[#f0cb97]">
            {t(
              `${surface.rewardPerInvite} 點 / 每位`,
              `${surface.rewardPerInvite} pts each`,
            )}
          </span>
        </div>

        <div className="mt-5 rounded-[1.4rem] border border-white/10 bg-black/18 p-4">
          <p className="text-sm text-foreground/56">
            {t("建議分享文案", "Suggested message")}
          </p>
          <p className="mt-3 text-sm leading-7 text-card-foreground">
            {shareMessage}
          </p>
        </div>

        <div className="mt-5 grid gap-3">
          <button
            type="button"
            onClick={() => {
              void handleShare();
            }}
            className="min-h-[3.5rem] rounded-[1.35rem] bg-white px-4 py-4 text-sm font-semibold text-black transition hover:opacity-92"
          >
            {t("立即分享邀請", "Share invite now")}
          </button>
          <button
            type="button"
            onClick={() => {
              void handleCopyMessage();
            }}
            className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm font-medium text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07]"
          >
            {t("複製分享文案", "Copy share message")}
          </button>
        </div>

        {feedback ? (
          <p className="mt-4 text-sm leading-6 text-brand-strong">{feedback}</p>
        ) : null}

        <div className="mt-5 grid gap-3">
          <div className="rounded-[1.3rem] border border-white/10 bg-black/18 p-4">
            <p className="text-sm text-foreground/56">
              {t("邀請連結", "Invite link")}
            </p>
            <p className="mt-3 break-all text-sm leading-7 text-card-foreground">
              {surface.inviteLink}
            </p>
          </div>
          <div className="rounded-[1.3rem] border border-white/10 bg-black/18 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-foreground/56">
                  {t("邀請碼", "Invite code")}
                </p>
                <p className="mt-3 font-mono text-[1.5rem] font-semibold tracking-[0.18em] text-card-foreground">
                  {surface.code}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  void handleCopyCode();
                }}
                className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07]"
              >
                {t("複製", "Copy")}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[1.8rem] bg-white/[0.04] p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm text-foreground/46">
              {t("邀請總覽", "Invite summary")}
            </p>
            <h2 className="text-lg font-semibold text-card-foreground">
              {t(
                "分享之後，回饋會在這裡更新",
                "Rewards update here after sharing",
              )}
            </h2>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-foreground/68">
            {t(`${surface.availablePoints} 點`, `${surface.availablePoints} pts`)}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-[1.3rem] border border-white/10 bg-black/18 p-4">
            <p className="text-sm text-foreground/56">
              {t("已成功邀請", "Invited")}
            </p>
            <p className="mt-2 text-2xl font-semibold text-card-foreground">
              {surface.invitedCount}
            </p>
          </div>
          <div className="rounded-[1.3rem] border border-white/10 bg-black/18 p-4">
            <p className="text-sm text-foreground/56">
              {t("累計獎勵", "Rewards")}
            </p>
            <p className="mt-2 text-2xl font-semibold text-card-foreground">
              {surface.totalRewardPoints} {t("點", "pts")}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-[1.8rem] bg-white/[0.04] p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm text-foreground/46">
              {t("最近回饋", "Recent rewards")}
            </p>
            <h3 className="text-lg font-semibold text-card-foreground">
              {surface.recentProgress.length > 0
                ? t(
                    "最近的回饋已經入帳",
                    "Recent rewards already settled",
                  )
                : t(
                    "有人透過你的連結開始使用後，回饋就會顯示在這裡",
                    "Rewards appear here once someone starts through your link",
                  )}
            </h3>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-foreground/68">
            {t(`${surface.availablePoints} 點`, `${surface.availablePoints} pts`)}
          </span>
        </div>

        {surface.recentProgress.length > 0 ? (
          <div className="mt-4 grid gap-3">
            {surface.recentProgress.map((item) => (
              <article
                key={item.id}
                className="rounded-[1.35rem] border border-white/10 bg-black/18 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm text-foreground/56">
                        {item.createdLabel}
                      </p>
                      <span className="text-xs text-foreground/46">
                        {inlineText(item.statusLabel)}
                      </span>
                    </div>
                    <h4 className="text-lg font-semibold text-card-foreground">
                      {inlineText(item.inviteeName)}
                    </h4>
                    <p className="text-sm leading-7 text-foreground/76">
                      {inlineText(item.summary)}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-brand-strong">
                    {inlineText(item.rewardLabel)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm leading-7 text-foreground/62">
            {t(
              "目前還沒有新的邀請回饋。先把上方訊息和連結傳出去，之後再回來查看。",
              "There are no new invite rewards yet. Send the message and link above first, then come back here later.",
            )}
          </p>
        )}
      </div>

      <div className="mt-auto grid gap-3">
        <Link
          href="/points"
          className="min-h-[3.5rem] rounded-[1.35rem] bg-white px-4 py-4 text-center text-sm font-semibold text-black transition hover:opacity-92"
        >
          {t("查看我的點數", "Open points")}
        </Link>
        <Link
          href="/question"
          className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-center text-sm font-medium text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07]"
        >
          {t("開始新的提問", "Start a new question")}
        </Link>
      </div>
    </section>
  );
}
