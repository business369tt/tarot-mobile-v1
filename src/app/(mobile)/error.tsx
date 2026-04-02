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
    <section className="flex flex-1 flex-col justify-between gap-8 py-6">
      <div className="space-y-3 pt-6">
        <p className="text-sm text-foreground/56">發生問題</p>
        <h1 className="max-w-[14rem] text-[2.5rem] font-semibold leading-[1.02] tracking-tight text-card-foreground">
          這個頁面暫時打不開
        </h1>
        <p className="max-w-[18rem] text-base leading-7 text-foreground/62">
          重新試一次，或先回到首頁再操作。
        </p>
      </div>

      <div className="grid gap-3">
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="min-h-[3.75rem] rounded-[1.5rem] bg-white px-5 py-4 text-base font-semibold text-black transition hover:opacity-92"
        >
          重新整理
        </button>
        <Link
          href="/"
          className="min-h-[3.75rem] rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-5 py-4 text-center text-base font-medium text-card-foreground transition hover:border-white/16 hover:bg-white/[0.06]"
        >
          回到首頁
        </Link>
      </div>
    </section>
  );
}
