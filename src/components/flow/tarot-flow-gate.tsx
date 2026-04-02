"use client";

import { usePathname, useRouter } from "next/navigation";
import { startTransition, useEffect } from "react";
import type { ReactNode } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useTarotFlow } from "@/components/flow/tarot-flow-provider";
import { useLocale } from "@/components/i18n/locale-provider";
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
  const { t } = useLocale();
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
    return (
      <section className="flex flex-1 flex-col justify-center py-8">
        <div className="space-y-3 rounded-[2rem] bg-white/[0.04] px-5 py-6">
          <p className="text-sm text-foreground/56">
            {!isHydrated || !isAuthHydrated
              ? t("準備中", "Preparing")
              : t("正在導向", "Redirecting")}
          </p>
          <h1 className="text-[2rem] font-semibold leading-tight tracking-tight text-card-foreground">
            {!isHydrated || !isAuthHydrated
              ? t("正在回到你的流程。", "Restoring your flow.")
              : !isAuthenticated
                ? t("需要先登入。", "Sign-in required.")
                : hasOwnerMismatch
                  ? t("這段解讀屬於另一個身份。", "This reading belongs to another profile.")
                  : t("帶你回到正確步驟。", "Returning to the right step.")}
          </h1>
          <p className="text-sm leading-6 text-foreground/56">
            {!isHydrated || !isAuthHydrated
              ? t("請稍候一下。", "Please wait a moment.")
              : !isAuthenticated
                ? t("登入後才能繼續這段流程。", "You need to sign in before continuing.")
                : hasOwnerMismatch
                  ? t("請使用原本開始這段解讀的帳號，或重新開始。", "Use the profile that started this reading, or begin a new one.")
                  : t("系統會自動帶你回到可以繼續的位置。", "You will be taken to the next valid step automatically.")}
          </p>
        </div>
      </section>
    );
  }

  return <>{children}</>;
}
