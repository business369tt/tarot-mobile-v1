export type RouteStatus = "entry" | "flow" | "reserved";

export type BilingualCopy = {
  zh: string;
  en: string;
};

export type AppRoute = {
  label: BilingualCopy;
  href: string;
  summary: BilingualCopy;
  status: RouteStatus;
  shellTitle: BilingualCopy;
  shellSubtitle: BilingualCopy;
  navLabel?: BilingualCopy;
};

export const routeStatusMeta = {
  entry: {
    label: {
      zh: "入口區",
      en: "Entry",
    },
    short: {
      zh: "入口",
      en: "Entry",
    },
  },
  flow: {
    label: {
      zh: "解讀流程",
      en: "Reading Flow",
    },
    short: {
      zh: "流程",
      en: "Flow",
    },
  },
  reserved: {
    label: {
      zh: "會員頁面",
      en: "Member Surface",
    },
    short: {
      zh: "會員",
      en: "Member",
    },
  },
} as const;

export const entryRoutes: AppRoute[] = [
  {
    label: {
      zh: "首頁",
      en: "Home",
    },
    href: "/",
    summary: {
      zh: "從這裡開始一段新解讀、續接目前進度，或回到紀錄與點數頁面。",
      en: "Start a new reading, resume your progress, or return to archive and points.",
    },
    status: "entry",
    shellTitle: {
      zh: "入口聖所",
      en: "Sanctum",
    },
    shellSubtitle: {
      zh: "一個安靜的起點，讓你開始、續接，並回到同一份解讀身份。",
      en: "A quiet place to begin, resume, and return to the same reading profile.",
    },
    navLabel: {
      zh: "首頁",
      en: "Home",
    },
  },
  {
    label: {
      zh: "LINE 入口",
      en: "LINE Entry",
    },
    href: "/auth/line",
    summary: {
      zh: "先用 LINE 綁定身份，再進入解讀、紀錄、點數與邀請獎勵。",
      en: "Link your LINE identity before entering readings, archive, points, or invite rewards.",
    },
    status: "entry",
    shellTitle: {
      zh: "LINE 身份入口",
      en: "LINE Access",
    },
    shellSubtitle: {
      zh: "讓正確的 LINE 身份接住這次解讀，以及之後所有回來續接的內容。",
      en: "Let the right LINE profile hold this reading and every return that follows.",
    },
    navLabel: {
      zh: "LINE",
      en: "Auth",
    },
  },
];

export const coreFlowRoutes: AppRoute[] = [
  {
    label: {
      zh: "提問",
      en: "Question",
    },
    href: "/question",
    summary: {
      zh: "設定你的問題、解讀方向，以及是否存入歷史紀錄。",
      en: "Set the question, reading lens, and archive preference for this session.",
    },
    status: "flow",
    shellTitle: {
      zh: "提問",
      en: "Question",
    },
    shellSubtitle: {
      zh: "把這次想釐清的問題說清楚，讓後面的流程有明確重心。",
      en: "Frame the question clearly so the rest of the flow has a steady focus.",
    },
    navLabel: {
      zh: "提問",
      en: "Question",
    },
  },
  {
    label: {
      zh: "儀式",
      en: "Ritual",
    },
    href: "/ritual",
    summary: {
      zh: "在抽牌前先沉澱片刻，安靜地把解讀情緒放回正位。",
      en: "Pause before the draw and settle the emotional tone of the reading.",
    },
    status: "flow",
    shellTitle: {
      zh: "儀式",
      en: "Ritual",
    },
    shellSubtitle: {
      zh: "保留抽牌前的那口氣，讓整段解讀慢慢對焦。",
      en: "Hold the breath before the draw and let the reading come into focus.",
    },
  },
  {
    label: {
      zh: "抽牌",
      en: "Draw",
    },
    href: "/draw",
    summary: {
      zh: "選出這次三張牌的排列，讓整份解讀有具體骨架。",
      en: "Choose the three-card spread that gives the reading its shape.",
    },
    status: "flow",
    shellTitle: {
      zh: "抽牌",
      en: "Draw",
    },
    shellSubtitle: {
      zh: "三張牌會成為這次解讀的主線，順序與位置都重要。",
      en: "These three cards will carry the reading, and their order matters.",
    },
    navLabel: {
      zh: "抽牌",
      en: "Draw",
    },
  },
  {
    label: {
      zh: "翻牌",
      en: "Reveal",
    },
    href: "/reveal",
    summary: {
      zh: "依序翻開三張牌，在進入報告前先完整看見它們。",
      en: "Reveal the spread in sequence before opening the report.",
    },
    status: "flow",
    shellTitle: {
      zh: "翻牌",
      en: "Reveal",
    },
    shellSubtitle: {
      zh: "讓牌面先出現，再把視線交給正式解讀。",
      en: "Let the cards appear before the reading turns into words.",
    },
  },
  {
    label: {
      zh: "解讀",
      en: "Reading",
    },
    href: "/reading",
    summary: {
      zh: "閱讀完整報告、延伸追問，或在需要時回到點數補點。",
      en: "Read the report, continue with follow-ups, or top up points when needed.",
    },
    status: "flow",
    shellTitle: {
      zh: "解讀",
      en: "Reading",
    },
    shellSubtitle: {
      zh: "在同一條脈絡中往下讀、往下問，也能隨時再回來續接。",
      en: "Read, ask again, and return to the same thread whenever you need.",
    },
    navLabel: {
      zh: "解讀",
      en: "Reading",
    },
  },
];

export const reservedRoutes: AppRoute[] = [
  {
    label: {
      zh: "點數",
      en: "Points",
    },
    href: "/points",
    summary: {
      zh: "查看餘額、每日回訪、最近點數流動，以及補點回程。",
      en: "Review balance, daily return, recent movement, and top-up returns.",
    },
    status: "reserved",
    shellTitle: {
      zh: "點數",
      en: "Points",
    },
    shellSubtitle: {
      zh: "所有點數都綁定在同一個身份下，補點後也能回到原本流程。",
      en: "Your balance stays under one identity, and top-ups return to the same flow.",
    },
  },
  {
    label: {
      zh: "紀錄",
      en: "History",
    },
    href: "/history",
    summary: {
      zh: "回看保存過的解讀、牌陣摘要，以及後續追問脈絡。",
      en: "Review saved readings, spreads, and every follow-up thread that came after.",
    },
    status: "reserved",
    shellTitle: {
      zh: "紀錄",
      en: "History",
    },
    shellSubtitle: {
      zh: "每一份保存過的解讀都會留在這裡，方便你之後再回來續接。",
      en: "Saved readings stay here so you can return to them whenever you need.",
    },
    navLabel: {
      zh: "紀錄",
      en: "History",
    },
  },
  {
    label: {
      zh: "邀請",
      en: "Invite",
    },
    href: "/invite",
    summary: {
      zh: "分享邀請連結、追蹤獎勵進度，並確認點數是否已入帳。",
      en: "Share your invite link, track rewards, and confirm when points settle.",
    },
    status: "reserved",
    shellTitle: {
      zh: "邀請",
      en: "Invite",
    },
    shellSubtitle: {
      zh: "邀請獎勵也會綁在同一個身份下，不會和你的解讀脈絡分開。",
      en: "Invite rewards stay tied to the same identity as your readings.",
    },
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
        label: {
          zh: "紀錄詳情",
          en: "History Record",
        },
        href: pathname,
        shellTitle: {
          zh: "解讀檔案",
          en: "Archive",
        },
        shellSubtitle: {
          zh: "一份保存中的解讀，包含牌陣、報告與追問紀錄。",
          en: "A saved reading with its spread, report, and follow-up thread in one place.",
        },
      };
    }
  }

  return (
    routeMap.get(pathname) ?? {
      label: {
        zh: "頁面",
        en: "Surface",
      },
      href: pathname,
      summary: {
        zh: "這是同一個行動版塔羅產品中的一個頁面。",
        en: "This is another surface inside the same mobile tarot product.",
      },
      status: "reserved",
      shellTitle: {
        zh: "頁面",
        en: "Surface",
      },
      shellSubtitle: {
        zh: "你仍然留在同一套解讀流程之內。",
        en: "You are still inside the same reading experience.",
      },
    }
  );
}
