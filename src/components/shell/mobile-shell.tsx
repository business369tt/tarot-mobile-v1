"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useTarotFlow } from "@/components/flow/tarot-flow-provider";
import {
  getRouteMeta,
  routeStatusMeta,
  shellNavRoutes,
} from "@/lib/route-map";

export function MobileShell({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const pathname = usePathname();
  const currentRoute = getRouteMeta(pathname);
  const currentStatus = routeStatusMeta[currentRoute.status];
  const { isHydrated, isAuthenticated, displayName, initials } = useAuth();
  const { session, ownsCurrentSession } = useTarotFlow();
  const identityLabel = !isHydrated
    ? "Restoring profile"
    : isAuthenticated
      ? displayName ?? "LINE profile"
      : "Guest";
  const ownershipLabel =
    session && ownsCurrentSession ? "Owner" : session ? "Viewer" : "Open";

  return (
    <div className="relative isolate min-h-[100svh] overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(21,31,54,0.85),_transparent_30%)]" />
        <div className="absolute left-1/2 top-[-14rem] h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-[rgba(185,144,93,0.12)] blur-3xl" />
        <div className="absolute bottom-[-10rem] right-[-8rem] h-[24rem] w-[24rem] rounded-full bg-[rgba(35,54,93,0.26)] blur-3xl" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:100%_156px]" />
      </div>

      <div className="mx-auto flex min-h-[100svh] items-stretch justify-center px-2 py-2 sm:min-h-dvh sm:items-center sm:px-8 sm:py-6">
        <div className="relative w-full max-w-[430px]">
          <div className="pointer-events-none absolute -inset-6 hidden rounded-[3rem] bg-[radial-gradient(circle,_rgba(185,144,93,0.18),_transparent_66%)] blur-2xl sm:block" />

          <div className="relative rounded-[2.35rem] border border-white/10 bg-white/[0.04] p-[7px] shadow-[var(--shadow-device)] backdrop-blur-xl sm:rounded-[2.85rem] sm:p-2">
            <div className="pointer-events-none absolute left-1/2 top-[calc(env(safe-area-inset-top)+10px)] z-20 h-1.5 w-24 -translate-x-1/2 rounded-full bg-white/12 sm:top-3 sm:w-28" />

            <div className="relative flex h-[calc(100svh-1rem)] min-h-0 flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(18,23,38,0.98),rgba(8,10,16,0.98))] sm:h-[min(52rem,calc(100dvh-3rem))] sm:min-h-[740px] sm:rounded-[2.3rem]">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(185,144,93,0.12),_transparent_28%),radial-gradient(circle_at_bottom,_rgba(52,72,115,0.22),_transparent_28%)]" />

              <div className="relative flex items-center justify-between px-5 pb-2 pt-[calc(env(safe-area-inset-top)+14px)] text-[9px] font-medium uppercase tracking-[0.28em] text-foreground/42 sm:px-6 sm:pt-5 sm:text-[10px] sm:tracking-[0.32em]">
                <span>Tarot Mobile V1</span>
                <div className="flex items-center gap-2">
                  <span>{currentStatus.short}</span>
                  <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-1 text-[8px] tracking-[0.16em] text-foreground/54 sm:text-[9px]">
                    {isAuthenticated ? "LINE" : "Guest"}
                  </span>
                </div>
              </div>

              <header className="relative border-b border-white/10 px-5 pb-4 pt-2 sm:px-6 sm:pb-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-brand-strong">
                      {currentStatus.label}
                    </p>
                    <h1 className="mt-3 font-display text-[clamp(1.7rem,7.4vw,2.1rem)] font-semibold leading-[0.96] tracking-tight text-foreground">
                      {currentRoute.shellTitle}
                    </h1>
                    <p className="mt-3 max-w-[16.5rem] text-[13px] leading-6 text-muted sm:max-w-[17rem] sm:text-sm">
                      {currentRoute.shellSubtitle}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1.5 text-[9px] font-medium uppercase tracking-[0.16em] text-foreground/56 sm:px-3 sm:py-2 sm:text-[10px] sm:tracking-[0.18em]">
                    {currentRoute.href}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 rounded-[1.2rem] border border-white/10 bg-white/[0.04] px-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-[10px] font-semibold uppercase tracking-[0.18em] text-card-foreground">
                    {isHydrated && isAuthenticated ? initials : "AN"}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-semibold text-card-foreground">
                        {identityLabel}
                      </p>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-foreground/46">
                        {!isHydrated
                          ? "Restoring identity"
                          : isAuthenticated
                            ? "Linked identity"
                            : "Anonymous entry"}
                      </p>
                    </div>
                  </div>

                  <span className="shrink-0 rounded-full border border-white/10 bg-black/18 px-2.5 py-1 text-[9px] uppercase tracking-[0.18em] text-foreground/54">
                    {ownershipLabel}
                  </span>
                </div>
              </header>

              <main className="app-shell-scroll relative flex flex-1 flex-col overflow-y-auto">
                {children}
              </main>

              <footer className="relative border-t border-white/10 bg-black/24 px-2.5 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-2.5 backdrop-blur-xl sm:px-3 sm:pt-3">
                <nav className="grid grid-cols-5 gap-1.5 sm:gap-2">
                  {shellNavRoutes.map((route) => {
                    const isActive =
                      route.href === "/"
                        ? pathname === route.href
                        : pathname === route.href ||
                          pathname.startsWith(`${route.href}/`);

                    return (
                      <Link
                        key={route.href}
                        href={route.href}
                        className={`flex min-h-[3.65rem] flex-col items-center justify-center rounded-[0.95rem] border px-1.5 py-2 text-center transition sm:rounded-[1rem] sm:px-2 sm:py-2.5 ${
                          isActive
                            ? "border-line-strong bg-brand-soft text-foreground"
                            : "border-white/6 bg-white/[0.02] text-foreground/44 hover:border-white/10 hover:text-foreground/72"
                        }`}
                      >
                        <span className="block text-[9px] font-semibold uppercase tracking-[0.16em] sm:text-[10px] sm:tracking-[0.22em]">
                          {route.label}
                        </span>
                        <span
                          className={`mx-auto mt-2 block h-1 w-5 rounded-full sm:w-6 ${
                            isActive ? "bg-brand-strong" : "bg-white/10"
                          }`}
                        />
                      </Link>
                    );
                  })}
                </nav>
              </footer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
