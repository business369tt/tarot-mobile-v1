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
    return inviteClaim.inviterName
      ? t(
          `已連結邀請關係，獎勵點數已加入 ${inviteClaim.inviterName} 的帳戶。`,
          `Invite linked. The reward was added to ${inviteClaim.inviterName}'s balance.`,
        )
      : t(
          "已連結邀請關係，獎勵點數已加入分享者的帳戶。",
          "Invite linked. The reward was added to the sharer's balance.",
        );
  }

  if (inviteClaim.status === "already_rewarded") {
    return t(
      "這組邀請獎勵已經領取過了。",
      "This invite reward was already claimed.",
    );
  }

  if (inviteClaim.status === "already_attached") {
    return t(
      "這組邀請已經綁定到其他帳戶。",
      "This invite is already attached.",
    );
  }

  if (inviteClaim.status === "self") {
    return t("不能使用自己的邀請連結。", "You cannot use your own invite link.");
  }

  if (inviteClaim.status === "invalid") {
    return t("這組邀請碼目前無法使用。", "This invite code is unavailable.");
  }

  return t(
    "邀請狀態暫時無法確認，請稍後再試。",
    "Invite status is unavailable right now.",
  );
}

export function LineEntryScreen(props: {
  inviteCode?: string | null;
  inviteClaim?: InviteClaimResult | null;
}) {
  const router = useRouter();
  const {
    isHydrated,
    isAuthenticated,
    authProvider,
    displayName,
    lineConfigured,
    googleConfigured,
    beginLineSignIn,
    beginGoogleSignIn,
    signOutViewer,
  } = useAuth();
  const { session, ownsCurrentSession, getResumeRoute, startNewReading } =
    useTarotFlow();
  const { t } = useLocale();
  const hasCurrentReading = Boolean(session && ownsCurrentSession);
  const inviteMessage = getInviteMessage(props.inviteClaim ?? null, t);
  const callbackUrl = props.inviteCode
    ? buildInviteCallback(props.inviteCode)
    : hasCurrentReading
      ? getResumeRoute()
      : "/question";
  const hasAnyProvider = lineConfigured || googleConfigured;
  const providerLabel =
    authProvider === "google"
      ? t("Google", "Google")
      : authProvider === "line"
        ? t("LINE", "LINE")
        : t("帳戶", "account");

  async function handleLineSignIn() {
    await beginLineSignIn(callbackUrl);
  }

  async function handleGoogleSignIn() {
    await beginGoogleSignIn(callbackUrl);
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
            {t("正在準備", "Preparing")}
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
          <span className="inline-flex items-center rounded-full border border-[#f1c98d]/18 bg-[#f1c98d]/8 px-3 py-1 text-[0.72rem] font-medium tracking-[0.18em] text-[#f3d4a7]">
            {t("登入", "SIGN IN")}
          </span>
          <h1 className="max-w-[14rem] text-[2.5rem] font-semibold leading-[1.02] tracking-tight text-card-foreground">
            {isAuthenticated
              ? t("已完成登入", "You're signed in")
              : t("先登入再開始", "Sign in first")}
          </h1>
          <p className="max-w-[19rem] text-base leading-7 text-foreground/62">
            {isAuthenticated
              ? displayName
                ? t(
                    `${displayName} 已連結到這次的解讀流程。`,
                    `${displayName} is connected to this reading flow.`,
                  )
                : t("你的帳戶已連結到目前流程。", "Your account is connected.")
              : t(
                  "登入後即可開始解讀，並保留點數與邀請進度。",
                  "Sign in to begin and keep your points and invite progress.",
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
              ? t("繼續這次解讀", "Continue")
              : t("開始新的解讀", "Start")}
          </Link>

          {hasCurrentReading ? (
            <button
              type="button"
              onClick={handleStartFresh}
              className="min-h-[3.75rem] rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-5 py-4 text-base font-medium text-card-foreground transition hover:border-white/16 hover:bg-white/[0.06]"
            >
              {t("重新開始", "Start over")}
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => {
              void signOutViewer();
            }}
            className="text-sm text-foreground/56 transition hover:text-foreground"
          >
            {t(
              `改用其他 ${providerLabel}`,
              `Use another ${providerLabel}`,
            )}
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {lineConfigured ? (
            <button
              type="button"
              onClick={() => {
                void handleLineSignIn();
              }}
              className="min-h-[3.75rem] rounded-[1.5rem] bg-white px-5 py-4 text-base font-semibold text-black transition hover:opacity-92"
            >
              {t("使用 LINE 繼續", "Continue with LINE")}
            </button>
          ) : null}

          {googleConfigured ? (
            <button
              type="button"
              onClick={() => {
                void handleGoogleSignIn();
              }}
              className="min-h-[3.75rem] rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-5 py-4 text-base font-medium text-card-foreground transition hover:border-white/16 hover:bg-white/[0.06]"
            >
              {t("使用 Google 繼續", "Continue with Google")}
            </button>
          ) : null}

          {!hasAnyProvider ? (
            <p className="text-sm leading-6 text-foreground/50">
              {t(
                "目前尚未設定可用的登入方式。",
                "No sign-in provider is configured yet.",
              )}
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}
