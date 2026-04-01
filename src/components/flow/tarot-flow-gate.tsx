"use client";

import { usePathname, useRouter } from "next/navigation";
import { startTransition, useEffect } from "react";
import type { ReactNode } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useTarotFlow } from "@/components/flow/tarot-flow-provider";
import {
  getStepRedirect,
  type TarotFlowStep,
} from "@/lib/tarot-session";

export function TarotFlowGate({
  requiredStep,
  children,
}: Readonly<{
  requiredStep: TarotFlowStep;
  children: ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const { isHydrated: isAuthHydrated, isAuthenticated, ownsViewerId } = useAuth();
  const { isHydrated, session } = useTarotFlow();
  const hasOwnerMismatch = Boolean(session && !ownsViewerId(session.ownerViewerId));
  const redirectTo =
    isHydrated && isAuthHydrated
      ? !isAuthenticated || hasOwnerMismatch
        ? "/auth/line"
        : getStepRedirect(requiredStep, session)
      : null;

  useEffect(() => {
    if (!isHydrated || !isAuthHydrated || !redirectTo || redirectTo === pathname) {
      return;
    }

    startTransition(() => {
      router.replace(redirectTo);
    });
  }, [isAuthHydrated, isHydrated, pathname, redirectTo, router]);

  if (!isHydrated || !isAuthHydrated || redirectTo) {
    const title =
      !isHydrated || !isAuthHydrated
        ? "Restoring the reading thread."
        : !isAuthenticated
          ? "A LINE profile is needed before the reading continues."
          : hasOwnerMismatch
            ? "This reading stays with the profile that opened it."
            : "Returning you to the right moment.";
    const body =
      !isHydrated || !isAuthHydrated
        ? "Bringing your last question, chosen cards, and place in the ritual back into view."
        : !isAuthenticated
          ? "Sign in first so the session, archive, and reading path stay attached to one identity."
          : hasOwnerMismatch
            ? "Continue with the profile that began this reading, or start a fresh one from the current LINE account."
            : "The next scene will open from the last complete step, so the flow still feels whole.";

    return (
      <section className="flex flex-1 flex-col justify-center gap-4 px-4 pb-5 pt-4 sm:px-5 sm:pb-6 sm:pt-5">
        <div className="rounded-[1.85rem] border border-white/10 bg-white/[0.04] p-5 shadow-[var(--shadow-soft)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-brand-strong">
            {isHydrated ? "Guiding the flow" : "Restoring session"}
          </p>
          <h2 className="mt-4 font-display text-[2rem] leading-[0.96] text-card-foreground">
            {title}
          </h2>
          <p className="mt-4 text-sm leading-7 text-muted">{body}</p>
          <div className="mt-5 flex items-center gap-3 text-[11px] uppercase tracking-[0.22em] text-foreground/48">
            <span className="h-2 w-2 rounded-full bg-brand-strong motion-safe:animate-[altar-pulse_2.2s_ease-in-out_infinite]" />
            <span>Hold for a brief pause</span>
          </div>
        </div>
      </section>
    );
  }

  return <>{children}</>;
}
