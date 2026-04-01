export type RouteStatus = "entry" | "flow" | "reserved";

export type AppRoute = {
  label: string;
  href: string;
  summary: string;
  status: RouteStatus;
  shellTitle: string;
  shellSubtitle: string;
  navLabel?: string;
};

export const routeStatusMeta = {
  entry: {
    label: "Entry",
    short: "Entry",
  },
  flow: {
    label: "Reading Flow",
    short: "Flow",
  },
  reserved: {
    label: "Member Surface",
    short: "Member",
  },
} as const;

export const entryRoutes: AppRoute[] = [
  {
    label: "Home",
    href: "/",
    summary: "Start a reading, resume your session, or move into archive and points.",
    status: "entry",
    shellTitle: "Sanctum",
    shellSubtitle:
      "A quiet home for starting, resuming, and returning to the same reading profile.",
    navLabel: "Home",
  },
  {
    label: "Line Entry",
    href: "/auth/line",
    summary:
      "Sign in with LINE before opening a reading, archive, points, or invite rewards.",
    status: "entry",
    shellTitle: "LINE Access",
    shellSubtitle:
      "Sign in with the LINE profile that should own this reading and its future returns.",
    navLabel: "LINE",
  },
];

export const coreFlowRoutes: AppRoute[] = [
  {
    label: "Question",
    href: "/question",
    summary: "Set the question, reading lens, and archive preference for this session.",
    status: "flow",
    shellTitle: "Question",
    shellSubtitle:
      "Frame the question and set the emotional direction of the session.",
    navLabel: "Question",
  },
  {
    label: "Ritual",
    href: "/ritual",
    summary: "Hold a calm pause before the draw and settle the tone of the session.",
    status: "flow",
    shellTitle: "Ritual",
    shellSubtitle:
      "Hold the moment before the draw and settle the atmosphere of the reading.",
  },
  {
    label: "Draw",
    href: "/draw",
    summary: "Choose the three cards that will shape the reading.",
    status: "flow",
    shellTitle: "Draw",
    shellSubtitle:
      "Choose the three-card spread that will carry the rest of the reading.",
    navLabel: "Draw",
  },
  {
    label: "Reveal",
    href: "/reveal",
    summary: "Reveal the spread in order before opening the report.",
    status: "flow",
    shellTitle: "Reveal",
    shellSubtitle:
      "Let the spread appear in sequence before it moves into the report.",
  },
  {
    label: "Reading",
    href: "/reading",
    summary:
      "Read the report, continue with follow-ups, or recover through points when needed.",
    status: "flow",
    shellTitle: "Reading",
    shellSubtitle:
      "Read the report, continue the thread, and return to the archive when needed.",
    navLabel: "Reading",
  },
];

export const reservedRoutes: AppRoute[] = [
  {
    label: "Points",
    href: "/points",
    summary:
      "Manage balance, daily check-in, recent movement, and return paths for held actions.",
    status: "reserved",
    shellTitle: "Points",
    shellSubtitle:
      "See your balance, daily check-in, recent movement, and any restore step tied to the current profile.",
  },
  {
    label: "History",
    href: "/history",
    summary: "Review saved readings, card spreads, and follow-up threads.",
    status: "reserved",
    shellTitle: "History",
    shellSubtitle:
      "Return to saved readings, reopened threads, and the spread that shaped each report.",
    navLabel: "History",
  },
  {
    label: "Invite",
    href: "/invite",
    summary:
      "Share your invite link, track reward progress, and confirm settled invite points.",
    status: "reserved",
    shellTitle: "Invite",
    shellSubtitle:
      "Share your invite link, track reward progress, and keep invite settlement tied to this profile.",
  },
];

export const allRoutes = [...entryRoutes, ...coreFlowRoutes, ...reservedRoutes];

const routeMap = new Map(allRoutes.map((route) => [route.href, route] as const));

export const shellNavRoutes = [
  "/",
  "/question",
  "/draw",
  "/reading",
  "/history",
].map((href) => {
  const route = routeMap.get(href);

  if (!route) {
    throw new Error(`Missing route metadata for ${href}`);
  }

  return {
    href,
    label: route.navLabel ?? route.label,
  };
});

export function getRouteMeta(pathname: string): AppRoute {
  if (pathname.startsWith("/history/")) {
    const historyRoute = routeMap.get("/history");

    if (historyRoute) {
      return {
        ...historyRoute,
        label: "History Record",
        href: pathname,
        shellTitle: "Archive",
        shellSubtitle:
          "A saved reading with its spread, report, and follow-up thread held together in one place.",
      };
    }
  }

  return (
    routeMap.get(pathname) ?? {
      label: "Surface",
      href: pathname,
      summary: "A mapped surface inside the shared mobile shell.",
      status: "reserved",
      shellTitle: "Surface",
      shellSubtitle: "This screen belongs to the same mobile reading product.",
    }
  );
}
