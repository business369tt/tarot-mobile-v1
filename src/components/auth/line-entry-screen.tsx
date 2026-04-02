"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useTarotFlow } from "@/components/flow/tarot-flow-provider";
import { useLocale } from "@/components/i18n/locale-provider";
import type { InviteClaimResult } from "@/lib/invite-records";

function buildInviteCallback(inviteCode: string) {
  const searchParams = new URLSearchParams({
    ref: inviteCode,
  });

  return `/auth/line?${searchParams.toString()}`;
}

function getInviteMessage(
  inviteClaim: InviteClaimResult | null,
  t: (zh: string, en: string) => string,
) {
  if (!inviteClaim) {
    return null;
  }

  if (inviteClaim.status === "rewarded") {
    return t("邀請獎勵已入帳。", "Invite reward added.");
  }

  if (inviteClaim.status === "already_rewarded") {
    return t("這筆邀請獎勵已經入帳。", "This invite reward was already claimed.");
  }

  if (inviteClaim.status === "already_attached") {
    return t("這個邀請已經綁定過。", "This invite is already attached.");
  }

  if (inviteClaim.status === "self") {
    return t("不能使用自己的邀請連結。", "You cannot use your own invite link.");
  }

  if (inviteClaim.status === "invalid") {
    return t("這個邀請碼目前無法使用。", "This invite code is unavailable.");
  }

  return t("邀請狀態暫時無法確認。", "Invite status is unavailable right now.");
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
    lineConfigured,
    beginLineSignIn,
    signOutFromLine,
  } = useAuth();
  const { session, ownsCurrentSession, getResumeRoute, startNewReading } =
    useTarotFlow();
  const { t } = useLocale();
  const hasCurrentReading = Boolean(session && ownsCurrentSession);
  const inviteMessage = getInviteMessage(props.inviteClaim ?? null, t);

  async function handleLineSignIn() {
    await beginLineSignIn(
      props.inviteCode
        ? buildInviteCallback(props.inviteCode)
        : hasCurrentReading
          ? getResumeRoute()
          : "/question",
    );
  }

  function handleStartFresh() {
    void startNewReading().finally(() => {
      startTransition(() => {
        router.push("/question");
      });
    });
  }

  if (!isHydrated) {
    return (
      <section className="flex flex-1 flex-col justify-center py-8">
        <div className="space-y-3 rounded-[2rem] bg-white/[0.04] px-5 py-6">
          <p className="text-sm text-foreground/56">
            {t("準備中", "Preparing")}
          </p>
          <h1 className="text-[2rem] font-semibold leading-tight tracking-tight text-card-foreground">
            {t("正在確認你的登入狀態。", "Checking your sign-in status.")}
          </h1>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-1 flex-col justify-between gap-8 py-6">
      <div className="space-y-6 pt-6">
        <div className="space-y-3">
          <p className="text-sm text-foreground/56">
            {t("LINE 登入", "LINE sign in")}
          </p>
          <h1 className="max-w-[13rem] text-[2.5rem] font-semibold leading-[1.02] tracking-tight text-card-foreground">
            {isAuthenticated
              ? t("已完成登入", "You're signed in")
              : t("先登入再開始", "Sign in first")}
          </h1>
          <p className="max-w-[18rem] text-base leading-7 text-foreground/62">
            {isAuthenticated
              ? displayName ?? t("你的身份已連接。", "Your profile is connected.")
              : t(
                  "登入後就能開始抽牌，並保存紀錄與點數。",
                  "Sign in to begin, save history, and keep your points.",
                )}
          </p>
        </div>

        {inviteMessage ? (
          <div className="rounded-[1.6rem] bg-white/[0.04] px-4 py-4 text-sm leading-6 text-card-foreground">
            {inviteMessage}
          </div>
        ) : null}
      </div>

      {isAuthenticated ? (
        <div className="grid gap-3">
          <Link
            href={hasCurrentReading ? getResumeRoute() : "/question"}
            className="min-h-[3.75rem] rounded-[1.5rem] bg-white px-5 py-4 text-center text-base font-semibold text-black transition hover:opacity-92"
          >
            {hasCurrentReading
              ? t("繼續上次進度", "Continue")
              : t("開始抽牌", "Start")}
          </Link>

          <button
            type="button"
            onClick={handleStartFresh}
            className="min-h-[3.75rem] rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-5 py-4 text-base font-medium text-card-foreground transition hover:border-white/16 hover:bg-white/[0.06]"
          >
            {t("重新開始", "Start over")}
          </button>

          <button
            type="button"
            onClick={() => {
              void signOutFromLine();
            }}
            className="text-sm text-foreground/56 transition hover:text-foreground"
          >
            {t("改用其他 LINE 帳號", "Use another LINE account")}
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          <button
            type="button"
            onClick={() => {
              void handleLineSignIn();
            }}
            disabled={!lineConfigured}
            className="min-h-[3.75rem] rounded-[1.5rem] bg-white px-5 py-4 text-base font-semibold text-black transition hover:opacity-92 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("使用 LINE 登入", "Continue with LINE")}
          </button>

          <Link
            href="/"
            className="min-h-[3.75rem] rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-5 py-4 text-center text-base font-medium text-card-foreground transition hover:border-white/16 hover:bg-white/[0.06]"
          >
            {t("回到首頁", "Back to home")}
          </Link>

          {!lineConfigured ? (
            <p className="text-sm leading-6 text-foreground/50">
              {t("LINE 登入目前尚未完成設定。", "LINE sign-in is not configured yet.")}
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}
