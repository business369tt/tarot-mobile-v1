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

  async function handleCopyLink() {
    try {
      await copyText(surface.inviteLink);
      setFeedback(t("已複製邀請連結。", "Invite link copied."));
    } catch {
      setFeedback(
        t(
          "這個瀏覽器目前不能直接複製，你仍然可以手動使用下方連結或邀請碼。",
          "Copy is unavailable here right now. You can still use the link or code below.",
        ),
      );
    }
  }

  async function handleCopyCode() {
    try {
      await copyText(surface.code);
      setFeedback(t("已複製邀請碼。", "Invite code copied."));
    } catch {
      setFeedback(
        t(
          "這個瀏覽器目前不能直接複製，但邀請碼仍然顯示在下方。",
          "Copy is unavailable here right now, but the code is still visible below.",
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
          text: t(
            "用這個連結一起開始塔羅解讀。",
            "Start a tarot reading with this link.",
          ),
          url: surface.inviteLink,
        });
        setFeedback(t("已打開分享視窗。", "Share sheet opened."));
        return;
      } catch {
        setFeedback(t("分享已取消。", "Share canceled."));
        return;
      }
    }

    await handleCopyLink();
  }

  return (
    <section className="flex flex-1 flex-col gap-5 py-6">
      <div className="space-y-3 pt-4">
        <p className="text-sm text-foreground/56">{t("邀請", "Invite")}</p>
        <h1 className="max-w-[13rem] text-[2.6rem] font-semibold leading-[1.02] tracking-tight text-card-foreground">
          {t("分享給朋友", "Share with a friend")}
        </h1>
        <p className="max-w-[18rem] text-base leading-7 text-foreground/62">
          {t(
            "對方透過你的連結開始後，獎勵就會回到你的點數餘額。",
            "Once someone starts through your link, the reward returns to your balance.",
          )}
        </p>
      </div>

      <div className="rounded-[1.8rem] bg-white/[0.04] p-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[1.3rem] border border-white/10 bg-black/18 p-4">
            <p className="text-sm text-foreground/56">{t("已邀請", "Invited")}</p>
            <p className="mt-2 text-2xl font-semibold text-card-foreground">
              {surface.invitedCount}
            </p>
          </div>
          <div className="rounded-[1.3rem] border border-white/10 bg-black/18 p-4">
            <p className="text-sm text-foreground/56">{t("已入帳", "Rewards")}</p>
            <p className="mt-2 text-2xl font-semibold text-card-foreground">
              {surface.totalRewardPoints} pts
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-[1.8rem] bg-white/[0.04] p-5">
        <p className="text-sm text-foreground/56">{t("邀請碼", "Invite code")}</p>
        <h2 className="mt-3 font-mono text-[1.8rem] font-semibold tracking-[0.18em] text-card-foreground">
          {surface.code}
        </h2>
        <p className="mt-4 break-all text-sm leading-7 text-foreground/76">
          {surface.inviteLink}
        </p>
        <p className="mt-4 text-sm text-foreground/56">
          {t(
            `每成功一位可得 ${surface.rewardPerInvite} 點。`,
            `${surface.rewardPerInvite} points per successful invite.`,
          )}
        </p>

        <div className="mt-5 grid gap-3">
          <button
            type="button"
            onClick={() => {
              void handleShare();
            }}
            className="min-h-[3.5rem] rounded-[1.35rem] bg-white px-4 py-4 text-sm font-semibold text-black transition hover:opacity-92"
          >
            {t("分享連結", "Share link")}
          </button>
          <button
            type="button"
            onClick={() => {
              void handleCopyLink();
            }}
            className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm font-medium text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07]"
          >
            {t("複製連結", "Copy link")}
          </button>
          <button
            type="button"
            onClick={() => {
              void handleCopyCode();
            }}
            className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 bg-black/18 px-4 py-4 text-sm font-medium text-card-foreground transition hover:border-line-strong hover:bg-white/[0.05]"
          >
            {t("複製邀請碼", "Copy code")}
          </button>
        </div>

        {feedback ? (
          <p className="mt-4 text-sm leading-6 text-brand-strong">{feedback}</p>
        ) : null}
      </div>

      <div className="rounded-[1.8rem] bg-white/[0.04] p-5">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-card-foreground">
            {t("最近獎勵", "Recent rewards")}
          </h3>
          <span className="text-sm text-foreground/56">
            {t(`${surface.availablePoints} 點可用`, `${surface.availablePoints} pts`)}
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
                  <div>
                    <p className="text-sm text-foreground/56">
                      {item.createdLabel}
                    </p>
                    <h4 className="mt-2 text-lg font-semibold text-card-foreground">
                      {inlineText(item.inviteeName)}
                    </h4>
                    <p className="mt-2 text-sm leading-7 text-foreground/76">
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
            {t("還沒有邀請獎勵，分享出去後會顯示在這裡。", "No rewards yet. They will appear here after someone joins through your link.")}
          </p>
        )}
      </div>

      <div className="mt-auto grid gap-3">
        <Link
          href="/points"
          className="min-h-[3.5rem] rounded-[1.35rem] bg-white px-4 py-4 text-center text-sm font-semibold text-black transition hover:opacity-92"
        >
          {t("查看點數", "Open points")}
        </Link>
        <Link
          href="/question"
          className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-center text-sm font-medium text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07]"
        >
          {t("開始新的解讀", "Start a new reading")}
        </Link>
      </div>
    </section>
  );
}
