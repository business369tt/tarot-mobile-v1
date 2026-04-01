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
          <h3 className="mt-3">
            <span className="block text-[1.05rem] font-semibold text-card-foreground">
              {route.label.zh}
            </span>
            <span className="mt-1 block text-[11px] uppercase tracking-[0.2em] text-foreground/42">
              {route.label.en}
            </span>
          </h3>
          <div className="mt-3 space-y-2">
            <p className="text-sm leading-6 text-muted">{route.summary.zh}</p>
            <p className="text-xs leading-6 text-foreground/42">{route.summary.en}</p>
          </div>
        </div>

        <span
          className={`rounded-[1rem] border px-2.5 py-1.5 text-center ${badgeStyles[route.status]}`}
        >
          <span className="block text-[10px] font-semibold uppercase tracking-[0.18em]">
            {routeStatusMeta[route.status].short.zh}
          </span>
          <span className="mt-1 block text-[8px] uppercase tracking-[0.14em] text-current/70">
            {routeStatusMeta[route.status].short.en}
          </span>
        </span>
      </div>

      <div className="relative mt-5 flex items-center justify-between gap-3 text-xs font-medium uppercase tracking-[0.18em] text-brand-strong">
        <span>{route.href}</span>
        <span className="text-foreground/34 transition group-hover:text-brand-strong">
          進入 / Open
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
  const primaryLabel = isAuthenticated
    ? "從提問開始（Begin from question）"
    : "使用 LINE 繼續（Continue with LINE）";
  const showResume = Boolean(isAuthenticated && session && ownsCurrentSession);

  return (
    <section className="flex flex-1 flex-col gap-5 px-5 pb-6 pt-5">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(20,25,39,0.98),rgba(12,15,24,0.94))] p-6 shadow-[var(--shadow-soft)]">
        <div className="pointer-events-none absolute right-[-4rem] top-[-4rem] h-40 w-40 rounded-full bg-[radial-gradient(circle,_rgba(185,144,93,0.2),_transparent_68%)] blur-2xl" />
        <div className="pointer-events-none absolute bottom-[-5rem] left-[-3rem] h-32 w-32 rounded-full bg-[radial-gradient(circle,_rgba(63,88,145,0.28),_transparent_72%)] blur-2xl" />

        <div className="relative flex items-center justify-between gap-4">
          <span className="inline-flex rounded-full border border-line-strong bg-brand-soft px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-strong">
            即時解讀流程 / Live reading flow
          </span>

          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-[10px] font-semibold uppercase tracking-[0.18em] text-card-foreground">
              {isAuthenticated ? initials : "AN"}
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-foreground/44">
                {isAuthenticated ? "LINE 已綁定 / LINE linked" : "訪客 / Guest"}
              </p>
              <p className="truncate text-[11px] text-card-foreground">
                {isHydrated
                  ? isAuthenticated
                    ? displayName
                    : "登入後開始 / Sign in to begin"
                  : "正在還原身份 / Restoring profile"}
              </p>
            </div>
          </div>
        </div>

        <h2 className="relative mt-5">
          <span className="block font-display text-[2.9rem] font-semibold leading-[0.9] tracking-tight text-card-foreground">
            一套安靜而完整的塔羅流程，
            <br />
            集中在同一個身份之下。
          </span>
          <span className="mt-3 block max-w-[18rem] text-[13px] leading-6 text-foreground/48 sm:text-sm">
            One quiet tarot flow, kept under one profile.
          </span>
        </h2>

        <div className="relative mt-4 max-w-[17.5rem] space-y-2">
          <p className="text-sm leading-7 text-muted">
            使用 LINE 登入一次後，所有解讀都會綁定在同一身份，可隨時透過紀錄、點數與邀請獎勵回來續接。
          </p>
          <p className="text-xs leading-6 text-foreground/42">
            Sign in once with LINE and keep your readings, points, archive, and invite rewards under one identity.
          </p>
        </div>

        <div className="relative mt-6 grid grid-cols-3 gap-2">
          {[
            { value: entryRoutes.length, label: "入口", labelEn: "Entry" },
            { value: coreFlowRoutes.length, label: "流程", labelEn: "Core" },
            { value: reservedRoutes.length, label: "會員", labelEn: "Member" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] px-3 py-3"
            >
              <p className="text-lg font-semibold text-card-foreground">{item.value}</p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/42">
                {item.label}
              </p>
              <p className="mt-1 text-[9px] uppercase tracking-[0.16em] text-foreground/34">
                {item.labelEn}
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
              回到目前解讀（Return to current reading）
            </Link>
          ) : (
            <Link
              href="/auth/line"
              className="rounded-[1.25rem] border border-white/10 bg-white/[0.05] px-4 py-3 text-center text-sm font-semibold text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07]"
            >
              打開 LINE 入口（Open LINE entry）
            </Link>
          )}
        </div>

        <div className="relative mt-6 flex flex-wrap gap-2">
          {[
            "LINE 登入 / LINE sign-in",
            "身份續接 / Owned return",
            "紀錄與點數 / Archive + points",
            "邀請獎勵 / Invite rewards",
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
        title="入口 / Entry"
        subtitle="從首頁進入，或先用 LINE 綁定身份，讓整段解讀都留在同一個人身上。"
        routes={entryRoutes}
      />

      <SectionBlock
        title="解讀流程 / Reading Flow"
        subtitle="從提問開始，一路經過儀式、抽牌、翻牌，最後進入正式解讀。"
        routes={coreFlowRoutes}
      />

      <SectionBlock
        title="會員頁面 / Member"
        subtitle="紀錄、點數與邀請獎勵都會跟著同一個身份走，不需要重新整理脈絡。"
        routes={reservedRoutes}
      />
    </section>
  );
}
