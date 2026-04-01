"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { useTarotFlow } from "@/components/flow/tarot-flow-provider";
import {
  coreFlowRoutes,
  entryRoutes,
  reservedRoutes,
  routeStatusMeta,
  type AppRoute,
} from "@/lib/route-map";

const badgeStyles = {
  entry: "border-line-strong bg-brand-soft text-brand-strong",
  flow: "border-white/10 bg-white/[0.05] text-foreground/74",
  reserved: "border-white/10 bg-white/[0.03] text-muted-strong",
} as const;

function RouteCard({
  route,
  index,
}: Readonly<{
  route: AppRoute;
  index: number;
}>) {
  return (
    <Link
      href={route.href}
      className="group relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-4 transition hover:-translate-y-0.5 hover:border-line-strong hover:bg-white/[0.06]"
    >
      <div className="pointer-events-none absolute right-[-1.5rem] top-[-1.5rem] h-20 w-20 rounded-full bg-[radial-gradient(circle,_rgba(185,144,93,0.14),_transparent_68%)] opacity-0 blur-xl transition group-hover:opacity-100" />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-foreground/42">
            {String(index + 1).padStart(2, "0")}
          </p>
          <h3 className="mt-3 text-[1.05rem] font-semibold text-card-foreground">
            {route.label}
          </h3>
          <p className="mt-3 text-sm leading-6 text-muted">{route.summary}</p>
        </div>

        <span
          className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${badgeStyles[route.status]}`}
        >
          {routeStatusMeta[route.status].short}
        </span>
      </div>

      <div className="relative mt-5 flex items-center justify-between gap-3 text-xs font-medium uppercase tracking-[0.18em] text-brand-strong">
        <span>{route.href}</span>
        <span className="text-foreground/34 transition group-hover:text-brand-strong">
          Open
        </span>
      </div>
    </Link>
  );
}

function SectionBlock({
  title,
  subtitle,
  routes,
}: Readonly<{
  title: string;
  subtitle: string;
  routes: AppRoute[];
}>) {
  return (
    <section className="space-y-3">
      <div className="px-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-foreground/42">
          {title}
        </p>
        <p className="mt-2 text-sm leading-6 text-muted">{subtitle}</p>
      </div>

      <div className="grid gap-3">
        {routes.map((route, index) => (
          <RouteCard key={route.href} route={route} index={index} />
        ))}
      </div>
    </section>
  );
}

export function HomeScreen() {
  const { isHydrated, isAuthenticated, displayName, initials } = useAuth();
  const { session, ownsCurrentSession, getResumeRoute } = useTarotFlow();
  const primaryHref = isAuthenticated ? "/question" : "/auth/line";
  const primaryLabel = isAuthenticated ? "Begin from question" : "Continue with LINE";
  const showResume = Boolean(isAuthenticated && session && ownsCurrentSession);

  return (
    <section className="flex flex-1 flex-col gap-5 px-5 pb-6 pt-5">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(20,25,39,0.98),rgba(12,15,24,0.94))] p-6 shadow-[var(--shadow-soft)]">
        <div className="pointer-events-none absolute right-[-4rem] top-[-4rem] h-40 w-40 rounded-full bg-[radial-gradient(circle,_rgba(185,144,93,0.2),_transparent_68%)] blur-2xl" />
        <div className="pointer-events-none absolute bottom-[-5rem] left-[-3rem] h-32 w-32 rounded-full bg-[radial-gradient(circle,_rgba(63,88,145,0.28),_transparent_72%)] blur-2xl" />

        <div className="relative flex items-center justify-between gap-4">
          <span className="inline-flex rounded-full border border-line-strong bg-brand-soft px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-strong">
            Live reading flow
          </span>

          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-[10px] font-semibold uppercase tracking-[0.18em] text-card-foreground">
              {isAuthenticated ? initials : "AN"}
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-foreground/44">
                {isAuthenticated ? "LINE linked" : "Guest"}
              </p>
              <p className="truncate text-[11px] text-card-foreground">
                {isHydrated
                  ? isAuthenticated
                    ? displayName
                    : "Sign in to begin"
                  : "Restoring profile"}
              </p>
            </div>
          </div>
        </div>

        <h2 className="relative mt-5 font-display text-[2.9rem] font-semibold leading-[0.9] tracking-tight text-card-foreground">
          One quiet tarot flow,
          <br />
          kept under one profile.
        </h2>

        <p className="relative mt-4 max-w-[17.5rem] text-sm leading-7 text-muted">
          Sign in once with LINE, keep the reading attached to the same
          identity, and return through archive, points, and invite rewards
          without losing the thread.
        </p>

        <div className="relative mt-6 grid grid-cols-3 gap-2">
            {[
              { value: entryRoutes.length, label: "Entry" },
              { value: coreFlowRoutes.length, label: "Core" },
              { value: reservedRoutes.length, label: "Member" },
            ].map((item) => (
            <div
              key={item.label}
              className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] px-3 py-3"
            >
              <p className="text-lg font-semibold text-card-foreground">
                {item.value}
              </p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/42">
                {item.label}
              </p>
            </div>
          ))}
        </div>

        <div className="relative mt-6 grid gap-3">
          <Link
            href={primaryHref}
            className="rounded-[1.25rem] border border-line-strong bg-brand px-4 py-3 text-center text-sm font-semibold text-black transition hover:bg-brand-strong"
          >
            {primaryLabel}
          </Link>

          {showResume ? (
            <Link
              href={getResumeRoute()}
              className="rounded-[1.25rem] border border-white/10 bg-white/[0.05] px-4 py-3 text-center text-sm font-semibold text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07]"
            >
              Return to current reading
            </Link>
          ) : (
            <Link
              href="/auth/line"
              className="rounded-[1.25rem] border border-white/10 bg-white/[0.05] px-4 py-3 text-center text-sm font-semibold text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07]"
            >
              Open LINE entry
            </Link>
          )}
        </div>

        <div className="relative mt-6 flex flex-wrap gap-2">
          {[
            "LINE sign-in",
            "Owned session return",
            "Archive + points",
            "Invite rewards",
          ].map((item) => (
            <span
              key={item}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] text-muted"
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      <SectionBlock
        title="Entry"
        subtitle="Start from home, then sign in with the LINE profile that should own the reading and every later return."
        routes={entryRoutes}
      />

      <SectionBlock
        title="Reading Flow"
        subtitle="Move from question to report in one continuous path, with the same profile carrying the reading all the way through."
        routes={coreFlowRoutes}
      />

      <SectionBlock
        title="Member"
        subtitle="Archive, points, and invite rewards all stay attached to the same LINE profile that opened the reading."
        routes={reservedRoutes}
      />
    </section>
  );
}
