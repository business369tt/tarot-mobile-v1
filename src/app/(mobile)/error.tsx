"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function MobileRouteError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("Mobile route render failed", error);
  }, [error]);

  return (
    <section className="flex flex-1 flex-col gap-4 px-4 pb-5 pt-4 sm:gap-5 sm:px-5 sm:pb-6 sm:pt-5">
      <div className="rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,rgba(21,27,41,0.98),rgba(12,15,24,0.96))] p-5 shadow-[var(--shadow-soft)] sm:rounded-[2rem] sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-brand-strong">
          畫面暫停
        </p>
        <p className="mt-1 text-[9px] uppercase tracking-[0.16em] text-foreground/38">
          Surface paused
        </p>
        <h2 className="mt-4">
          <span className="block font-display text-[2rem] leading-[0.96] text-card-foreground sm:text-[2.25rem]">
            這個頁面
            <br />
            暫時失去焦點了。
          </span>
          <span className="mt-2 block text-sm leading-6 text-foreground/44">
            This page slipped out of focus.
          </span>
        </h2>
        <div className="mt-4 max-w-[18rem] space-y-2">
          <p className="text-sm leading-7 text-muted">
            這個路由遇到了未預期錯誤。你可以重試目前步驟，或先回到穩定頁面，再重新開啟流程。
          </p>
          <p className="text-xs leading-6 text-foreground/42">
            The route hit an unexpected error. Retry the current step, or return to a stable page and reopen the flow from there.
          </p>
        </div>
      </div>

      <div className="mt-auto grid gap-3">
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="min-h-[3.5rem] rounded-[1.35rem] border border-line-strong bg-brand px-4 py-4 text-sm font-semibold leading-5 text-black transition hover:bg-brand-strong sm:rounded-[1.4rem]"
        >
          重試這個頁面（Retry this page）
        </button>
        <Link
          href="/"
          className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 bg-white/[0.05] px-4 py-4 text-center text-sm font-semibold leading-5 text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07] sm:rounded-[1.4rem]"
        >
          回到首頁（Back to home）
        </Link>
      </div>
    </section>
  );
}
