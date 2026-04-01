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
      eyebrow: "邀請已入帳 / Reward settled",
      title: "這次邀請獎勵已經補入。 / Invite reward settled.",
      body: inviteClaim.inviterName
        ? `${inviteClaim.inviterName} 的邀請獎勵已經回到這個身份下，之後可以直接在點數頁與解讀流程中使用。 / The reward from ${inviteClaim.inviterName} is now attached to this profile and ready to use.`
        : "邀請獎勵已經回到這個身份下，之後可以直接在點數頁與解讀流程中使用。 / The invite reward is now attached to this profile and ready to use.",
    };
  }

  if (inviteClaim.status === "already_rewarded") {
    return {
      eyebrow: "獎勵已領取 / Already settled",
      title: "這份邀請獎勵已經處理完成。 / Reward already settled.",
      body: "這次登入的身份已經領過這筆邀請獎勵，所以不需要再重新補發一次。 / This profile has already received the invite reward.",
    };
  }

  if (inviteClaim.status === "already_attached") {
    return {
      eyebrow: "邀請已綁定 / Already attached",
      title: "這個身份已經接住同一份邀請。 / Invite already attached.",
      body: "這筆邀請已經和目前的 LINE 身份綁定，不會再重新建立一份新的獎勵紀錄。 / This invite is already attached to the current LINE profile.",
    };
  }

  if (inviteClaim.status === "self") {
    return {
      eyebrow: "無法自邀 / Self-invite blocked",
      title: "不能使用自己的邀請連結登入。 / You cannot invite yourself.",
      body: "請改用其他人的邀請連結，或直接以自己的 LINE 身份繼續登入。 / Use someone else's invite link, or continue with your own LINE profile directly.",
    };
  }

  if (inviteClaim.status === "invalid") {
    return {
      eyebrow: "邀請無效 / Invalid invite",
      title: "這組邀請碼目前無法使用。 / Invite code unavailable.",
      body: "可能是邀請碼已失效，或不屬於目前這個流程；你仍然可以先登入，再回頭確認邀請來源。 / The invite code may have expired or not belong to this flow.",
    };
  }

  return {
    eyebrow: "邀請狀態 / Invite status",
    title: "邀請狀態暫時無法確認。 / Invite status unavailable.",
    body: "先用 LINE 登入也沒關係；之後仍可回到邀請頁確認是否有成功綁定。 / You can continue with LINE first and verify the invite later.",
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
            準備 LINE 入口 / Preparing LINE entry
          </p>
          <h2 className="mt-4">
            <span className="block font-display text-[2rem] leading-[0.96] text-card-foreground">
              正在還原你的身份，
              <br />
              入口很快就會開啟。
            </span>
            <span className="mt-2 block text-sm leading-6 text-foreground/44">
              Restoring your access layer.
            </span>
          </h2>
          <div className="mt-4 space-y-2">
            <p className="text-sm leading-7 text-muted">
              我們會先把目前身份與解讀狀態放回原位，再打開這個入口頁。
            </p>
            <p className="text-xs leading-6 text-foreground/42">
              Bringing the current profile and reading state back into place before this entry surface opens fully.
            </p>
          </div>
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
          LINE 入口 / LINE entry
        </p>
        <h2 className="relative mt-4">
          <span className="block font-display text-[2.25rem] leading-[0.92] text-card-foreground">
            讓同一個 LINE 身份
            <br />
            接住這次解讀。
          </span>
          <span className="mt-2 block text-sm leading-6 text-foreground/44">
            Let one LINE profile hold the reading.
          </span>
        </h2>
        <div className="relative mt-4 max-w-[18rem] space-y-2">
          <p className="text-sm leading-7 text-muted">
            解讀從 LINE 入口開始，這樣 session、紀錄、點數與邀請獎勵都會綁定在同一個身份之下。
          </p>
          <p className="text-xs leading-6 text-foreground/42">
            The reading begins through LINE so the session, archive, points, and invite rewards stay attached to one clear identity from the start.
          </p>
        </div>
      </div>

      {props.inviteCode ? (
        <div className="rounded-[1.8rem] border border-[rgba(229,192,142,0.18)] bg-[linear-gradient(180deg,rgba(185,144,93,0.12),rgba(185,144,93,0.04))] p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-strong">
            邀請已帶入 / Invite detected
          </p>
          <p className="mt-3 text-sm leading-7 text-card-foreground">
            這次會連同邀請資訊一起進入。完成 LINE 登入後，我們會把邀請獎勵綁到正確的身份上。
          </p>
        </div>
      ) : null}

      <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-foreground/42">
          為什麼這裡先用 LINE 登入？
        </p>
        <div className="mt-4 grid gap-3">
          {[
            "讓每次回來的解讀、追問與點數都留在同一個身份裡。 / Keep readings, follow-ups, and points under one identity.",
            "避免同一台裝置混進不同人的 session，讓歸屬更清楚。 / Avoid mixing different people's sessions on the same device.",
            "邀請獎勵、歷史紀錄與補點回程也會跟著同一個 LINE 身份走。 / Invite rewards, history, and top-up returns stay with the same LINE profile.",
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
          <p className="mt-3 text-sm leading-7 text-muted">{inviteClaimCopy.body}</p>
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
                目前身份 / Current profile
              </p>
              <p className="mt-2 text-lg font-semibold text-card-foreground">{displayName}</p>
              <p className="mt-2 text-sm leading-6 text-muted">
                這個身份目前由 {authProvider?.toUpperCase()} 接住，之後的解讀、點數與邀請獎勵都會跟著它走。
              </p>
            </div>
          </div>

          {hasForeignSession ? (
            <div className="mt-5 rounded-[1.3rem] border border-white/10 bg-black/18 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-strong">
                已有其他解讀 / Another reading is open
              </p>
              <p className="mt-3 text-sm leading-6 text-muted">
                目前這台裝置裡有一份不屬於這個 LINE 身份的解讀。若要繼續，請從這個身份重新開一條新的流程。
              </p>
            </div>
          ) : null}

          <div className="mt-6 grid gap-3">
            {hasOwnedSession ? (
              <Link
                href={getResumeRoute()}
                className="min-h-[3.5rem] rounded-[1.35rem] border border-line-strong bg-brand px-4 py-4 text-center text-sm font-semibold leading-5 text-black transition hover:bg-brand-strong"
              >
                回到目前解讀（Return to current reading）
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleStartFresh}
                className="min-h-[3.5rem] rounded-[1.35rem] border border-line-strong bg-brand px-4 py-4 text-sm font-semibold leading-5 text-black transition hover:bg-brand-strong"
              >
                從提問開始（Begin from question）
              </button>
            )}

            {hasForeignSession ? (
              <button
                type="button"
                onClick={handleStartFresh}
                className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 bg-white/[0.05] px-4 py-4 text-sm font-semibold leading-5 text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07]"
              >
                在這裡開新解讀（Start a fresh reading here）
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => {
                void signOutFromLine();
              }}
              className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 bg-white/[0.05] px-4 py-4 text-sm font-semibold leading-5 text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07]"
            >
              改用另一個 LINE 身份（Use another LINE profile）
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-strong">
            LINE 登入 / LINE sign-in
          </p>
          <p className="mt-3 text-sm leading-7 text-muted">
            這裡會帶你進入 LINE 官方授權流程。只要 `channel ID` 與 `secret` 已設定完成，就可以正常登入。
          </p>

          {!lineConfigured ? (
            <div className="mt-5 rounded-[1.3rem] border border-white/10 bg-black/18 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-strong">
                尚未完成設定 / Configuration missing
              </p>
              <p className="mt-3 text-sm leading-6 text-muted">
                目前還沒設定好 `channel ID` 與 `secret`，所以 LINE 登入暫時無法啟用。
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
              使用 LINE 繼續（Continue with LINE）
            </button>

            <Link
              href="/"
              className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 bg-white/[0.05] px-4 py-4 text-center text-sm font-semibold leading-5 text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07]"
            >
              回到首頁（Back to home）
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
