import {
  getCardDisplayMeta,
  getCardRoleDisplayMeta,
  getCategoryDisplayMeta,
  getOrientationDisplayMeta,
  type SelectedTarotCard,
  type TarotCategoryId,
  type TarotOrientation,
} from "@/lib/mock-tarot-data";

export type ReadingRecordStatus = "idle" | "generating" | "ready" | "failed";
export type ReadingSource = "minimax";

export type StructuredTarotReading = {
  reportTitle: string;
  reportSubtitle: string;
  questionCore: string;
  constellationLine: string;
  spreadAxis: string;
  cardReadings: {
    threshold: string;
    mirror: string;
    horizon: string;
  };
  progression: string;
  nearTermTrend: string;
  concreteGuidance: [string, string, string];
  closingReminder: string;
};

export type ReadingRecord = {
  id: string;
  sessionId: string;
  userId: string;
  question: string;
  category: TarotCategoryId;
  cardsSnapshot: SelectedTarotCard[];
  fullReading: StructuredTarotReading | null;
  source: ReadingSource;
  model: string;
  status: Exclude<ReadingRecordStatus, "idle">;
  errorMessage: string | null;
  costPoints: number;
  chargeRequestKey: string | null;
  chargeTransactionId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ReadingSectionView = {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  accent: string;
};

export const defaultReadingStatus: ReadingRecordStatus = "idle";
export const minimaxReadingSource: ReadingSource = "minimax";
export const readingFailureMessage = "這次解讀沒有完整落下，請再試一次。";
export const readingUnavailableMessage = "這個環境目前無法使用解讀服務。";
export const readingNeedsRevealMessage = "直答三張牌全部翻開後，才能開始 AI 解讀。";

const supportedCategories = ["love", "career", "self", "decision", "timing"] as const;

function isCategoryId(value: unknown): value is TarotCategoryId {
  return supportedCategories.includes(String(value) as TarotCategoryId);
}

function isOrientation(value: unknown): value is TarotOrientation {
  return value === "upright" || value === "reversed";
}

function parseJson<T>(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

const categoryFallbackCopy = {
  love: {
    label: "感情",
    focus: "情感裡真正的需求與界線",
    move: "先講清楚感受與底線",
    trend: "關係會因坦白而出現新方向",
  },
  career: {
    label: "事業",
    focus: "工作方向與現實條件",
    move: "先收斂最值得投入的方向",
    trend: "局勢會在整理之後開始加速",
  },
  self: {
    label: "自我",
    focus: "內在狀態與修復節奏",
    move: "先穩住自己再做決定",
    trend: "你會先看清自己，再看清外部選擇",
  },
  decision: {
    label: "抉擇",
    focus: "取捨成本與真正優先順序",
    move: "先刪掉不必要的分心",
    trend: "答案會在你願意收斂之後變清楚",
  },
  timing: {
    label: "時機",
    focus: "節奏是否成熟與何時出手",
    move: "先對齊節奏，不要搶快",
    trend: "時機不是不來，而是要等對的切點",
  },
} as const satisfies Record<
  TarotCategoryId,
  {
    label: string;
    focus: string;
    move: string;
    trend: string;
  }
>;

function buildFallbackCardMeta(
  card: SelectedTarotCard | undefined,
  fallbackName: string,
  fallbackRoleLabel: string,
  fallbackRoleSubtitle: string,
) {
  if (!card) {
    return {
      nameZh: fallbackName,
      roleLabel: fallbackRoleLabel,
      roleSubtitle: fallbackRoleSubtitle,
      orientationZh: "正位",
      meaning: "這張牌在提醒你回到問題核心，不要被情緒或表面現象帶走。",
      keywordsLine: "主線、節奏、選擇",
      toneZh: "真正的答案通常藏在你一直避開的重點裡。",
    };
  }

  const displayMeta = getCardDisplayMeta(card.id);
  const roleMeta = getCardRoleDisplayMeta(card.role);
  const orientationMeta = getOrientationDisplayMeta(card.orientation);
  const meaning =
    card.orientation === "upright"
      ? displayMeta.uprightZh
      : displayMeta.reversedZh;

  return {
    nameZh: displayMeta.nameZh,
    roleLabel: roleMeta.labelZh,
    roleSubtitle: roleMeta.subtitleZh,
    orientationZh: orientationMeta.zh,
    meaning,
    keywordsLine: displayMeta.keywordsZh.join("、"),
    toneZh: displayMeta.toneZh,
  };
}

function buildFallbackGuidance(args: {
  threshold: ReturnType<typeof buildFallbackCardMeta>;
  mirror: ReturnType<typeof buildFallbackCardMeta>;
  horizon: ReturnType<typeof buildFallbackCardMeta>;
}) {
  return [
    `先把${args.threshold.roleLabel}${args.threshold.nameZh}${args.threshold.orientationZh}指出的起點寫成一句話：${args.threshold.meaning}`,
    `正視${args.mirror.nameZh}${args.mirror.orientationZh}照出的盲點，不要再用拖延或猜測代替判斷；這張牌講的是${args.mirror.keywordsLine}。`,
    `依照${args.horizon.nameZh}${args.horizon.orientationZh}給的方向，把下一步縮成七天內能完成的一個動作，不要再同時拉太多線。`,
  ] as [string, string, string];
}

function normalizeCardsSnapshot(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as SelectedTarotCard[];
  }

  return value
    .slice(0, 3)
    .map((card: unknown, index: number) => {
      if (!card || typeof card !== "object") {
        return null;
      }

      const candidate = card as Partial<SelectedTarotCard>;

      if (
        typeof candidate.id !== "string" ||
        typeof candidate.name !== "string" ||
        typeof candidate.sigil !== "string" ||
        typeof candidate.arcana !== "string" ||
        typeof candidate.tone !== "string" ||
        typeof candidate.uprightText !== "string" ||
        typeof candidate.reversedText !== "string" ||
        !Array.isArray(candidate.keywords) ||
        candidate.keywords.length < 3 ||
        !isOrientation(candidate.orientation) ||
        typeof candidate.role !== "string" ||
        typeof candidate.roleSubtitle !== "string"
      ) {
        return null;
      }

      return {
        id: candidate.id,
        name: candidate.name,
        sigil: candidate.sigil,
        arcana: candidate.arcana,
        tone: candidate.tone,
        uprightText: candidate.uprightText,
        reversedText: candidate.reversedText,
        keywords: [
          String(candidate.keywords[0]),
          String(candidate.keywords[1]),
          String(candidate.keywords[2]),
        ] as [string, string, string],
        orientation: candidate.orientation,
        slot: typeof candidate.slot === "number" ? candidate.slot : index,
        role: candidate.role,
        roleSubtitle: candidate.roleSubtitle,
      } satisfies SelectedTarotCard;
    })
    .filter((card): card is SelectedTarotCard => Boolean(card));
}

export function normalizeStructuredTarotReading(
  value: Partial<StructuredTarotReading> | null | undefined,
  cards: SelectedTarotCard[],
  question: string,
  category: TarotCategoryId,
): StructuredTarotReading {
  const categoryDisplay = getCategoryDisplayMeta(category);
  const categoryCopy = categoryFallbackCopy[category];
  const [threshold, mirror, horizon] = cards;
  const thresholdRole = getCardRoleDisplayMeta(threshold?.role ?? "Threshold");
  const mirrorRole = getCardRoleDisplayMeta(mirror?.role ?? "Mirror");
  const horizonRole = getCardRoleDisplayMeta(horizon?.role ?? "Horizon");
  const thresholdMeta = buildFallbackCardMeta(
    threshold,
    "第一張牌",
    thresholdRole.labelZh,
    thresholdRole.subtitleZh,
  );
  const mirrorMeta = buildFallbackCardMeta(
    mirror,
    "第二張牌",
    mirrorRole.labelZh,
    mirrorRole.subtitleZh,
  );
  const horizonMeta = buildFallbackCardMeta(
    horizon,
    "第三張牌",
    horizonRole.labelZh,
    horizonRole.subtitleZh,
  );
  const guidance =
    Array.isArray(value?.concreteGuidance) && value.concreteGuidance.length >= 3
      ? value.concreteGuidance
          .slice(0, 3)
          .map((item: string) => String(item).trim())
      : buildFallbackGuidance({
          threshold: thresholdMeta,
          mirror: mirrorMeta,
          horizon: horizonMeta,
        });

  return {
    reportTitle:
      String(value?.reportTitle || "").trim() ||
      `${categoryCopy.label}這題，關鍵其實在 ${mirrorMeta.nameZh}`,
    reportSubtitle:
      String(value?.reportSubtitle || "").trim() ||
      `這一局的節奏很清楚：先看${thresholdRole.labelZh}裡真正發生了什麼，再拆開${mirrorRole.labelZh}裡那個拖慢你的點，最後才知道${horizonRole.labelZh}要把局勢帶往哪裡。`,
    questionCore:
      String(value?.questionCore || "").trim() ||
      `如果回到你真正想問的這一題：「${question.trim()}」，眼下最需要先處理的不是表面結果，而是 ${categoryCopy.focus}。先由${thresholdRole.labelZh}看清現在的重心，再把${mirrorRole.labelZh}照出的卡點攤開來，最後才知道${horizonRole.labelZh}要把你帶往哪個方向。`,
    constellationLine:
      String(value?.constellationLine || "").trim() ||
      `${thresholdMeta.nameZh}落在${thresholdRole.labelZh}，先講出局勢此刻真正的起點；${mirrorMeta.nameZh}落在${mirrorRole.labelZh}，把你一直不想正視的核心照出來；${horizonMeta.nameZh}落在${horizonRole.labelZh}，把答案推向下一步行動。`,
    spreadAxis:
      String(value?.spreadAxis || "").trim() ||
      `這副「直答三張牌」把焦點放在${categoryDisplay.labelZh}這條主線上。它不是要你立刻衝結果，而是要你先看懂${thresholdRole.labelZh}、${mirrorRole.labelZh}與${horizonRole.labelZh}之間的連動，否則就算很想推進，也只會在原地打轉。`,
    cardReadings: {
      threshold:
        String(value?.cardReadings?.threshold || "").trim() ||
        `${thresholdMeta.nameZh}${thresholdMeta.orientationZh}落在${thresholdRole.labelZh}，先把局勢的起點講清楚：${thresholdMeta.meaning} 這代表問題一開始就不是單看結果，而是你早就感受到某個訊號，只是還沒有真正對它採取行動。`,
      mirror:
        String(value?.cardReadings?.mirror || "").trim() ||
        `${mirrorMeta.nameZh}${mirrorMeta.orientationZh}落在${mirrorRole.labelZh}，照出你現在最需要正視的盲點：${mirrorMeta.meaning} 它讓你看見，真正拖慢你的不只是外在局勢，還有你對這件事的既有慣性或防衛。`,
      horizon:
        String(value?.cardReadings?.horizon || "").trim() ||
        `${horizonMeta.nameZh}${horizonMeta.orientationZh}落在${horizonRole.labelZh}，指出接下來最可能發生的走向：${horizonMeta.meaning} 這張牌不是在替你下結論，而是在告訴你，只要方向對了，局勢接下來會怎麼鬆動。`,
    },
    progression:
      String(value?.progression || "").trim() ||
      `這副牌的進程很清楚：先由 ${thresholdRole.labelZh} 把真正的起點打開，再透過 ${mirrorRole.labelZh} 看見核心卡點，最後才輪到 ${horizonRole.labelZh} 把局勢推向下一個動作。它不是過去、現在、未來的時間線，而是一條收斂答案的路徑。`,
    nearTermTrend:
      String(value?.nearTermTrend || "").trim() ||
      `短期內最明顯的變化，會出現在你願不願意按照牌意收斂動作。只要你先做到「${categoryCopy.move}」，局勢就不會一直卡住，而會慢慢朝著「${categoryCopy.trend}」那條線移動。`,
    concreteGuidance: [
      guidance[0] || "先做最直接的那一步。",
      guidance[1] || "不要再逃避真正的卡點。",
      guidance[2] || "用更穩的節奏回到主線。",
    ],
    closingReminder:
      String(value?.closingReminder || "").trim() ||
      `${horizonMeta.nameZh}給你的最後提醒不是催你更焦慮，而是要你把力氣用在真正能推動局勢的地方。`,
  };
}

export function parseStructuredTarotReading(
  value: string | null | undefined,
  cards: SelectedTarotCard[],
  question: string,
  category: TarotCategoryId,
) {
  const parsed = parseJson<Partial<StructuredTarotReading>>(value);

  return parsed
    ? normalizeStructuredTarotReading(parsed, cards, question, category)
    : null;
}

export function serializeStructuredTarotReading(reading: StructuredTarotReading) {
  return JSON.stringify(reading);
}

type ReadingRecordInput = {
  id: string;
  sessionId: string;
  userId: string;
  question: string;
  category: string;
  cardsSnapshot: string | null;
  fullReading: string | null;
  model: string;
  status: string;
  errorMessage: string | null;
  costPoints: number;
  chargeRequestKey: string | null;
  chargeTransactionId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export function mapRecordToReadingRecord(record: ReadingRecordInput): ReadingRecord {
  const category = isCategoryId(record.category) ? record.category : "love";
  const cardsSnapshot = normalizeCardsSnapshot(parseJson<unknown[]>(record.cardsSnapshot));

  return {
    id: record.id,
    sessionId: record.sessionId,
    userId: record.userId,
    question: record.question,
    category,
    cardsSnapshot,
    fullReading: parseStructuredTarotReading(
      record.fullReading,
      cardsSnapshot,
      record.question,
      category,
    ),
    source: minimaxReadingSource,
    model: record.model,
    status:
      record.status === "generating" || record.status === "ready" || record.status === "failed"
        ? record.status
        : "failed",
    errorMessage: record.errorMessage ?? null,
    costPoints: record.costPoints,
    chargeRequestKey: record.chargeRequestKey ?? null,
    chargeTransactionId: record.chargeTransactionId ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export function buildReadingSections(record: ReadingRecord): ReadingSectionView[] {
  const reading = record.fullReading;
  const [threshold, mirror, horizon] = record.cardsSnapshot;
  const thresholdRole = getCardRoleDisplayMeta(threshold?.role ?? "Threshold");
  const mirrorRole = getCardRoleDisplayMeta(mirror?.role ?? "Mirror");
  const horizonRole = getCardRoleDisplayMeta(horizon?.role ?? "Horizon");

  if (!reading) {
    return [];
  }

  return [
    {
      id: "core",
      eyebrow: "一、問題核心",
      title: "這副牌真正指出的核心是什麼",
      body: reading.questionCore,
      accent: record.cardsSnapshot[0]?.keywords[0] ?? "focus",
    },
    {
      id: "axis",
      eyebrow: "二、牌陣主線",
      title: "現況核心、隱藏阻力與最佳走向怎麼扣成同一題",
      body: reading.spreadAxis,
      accent: record.cardsSnapshot[1]?.keywords[0] ?? "pattern",
    },
    {
      id: "threshold",
      eyebrow: `三、${thresholdRole.labelZh}`,
      title: `${getCardDisplayMeta(threshold?.id ?? "high-priestess").nameZh}如何說明${thresholdRole.labelZh}`,
      body: reading.cardReadings.threshold,
      accent: threshold?.keywords[1] ?? "opening",
    },
    {
      id: "mirror",
      eyebrow: `四、${mirrorRole.labelZh}`,
      title: `${getCardDisplayMeta(mirror?.id ?? "moon").nameZh}照出了哪個${mirrorRole.labelZh}`,
      body: reading.cardReadings.mirror,
      accent: mirror?.keywords[1] ?? "reflection",
    },
    {
      id: "horizon",
      eyebrow: `五、${horizonRole.labelZh}`,
      title: `${getCardDisplayMeta(horizon?.id ?? "sun").nameZh}把答案帶往哪個${horizonRole.labelZh}`,
      body: reading.cardReadings.horizon,
      accent: horizon?.keywords[1] ?? "direction",
    },
    {
      id: "trend",
      eyebrow: "六、近期走勢",
      title: "接下來一到四週，局勢最可能怎麼動",
      body: reading.nearTermTrend,
      accent: record.cardsSnapshot[2]?.keywords[0] ?? "timing",
    },
    {
      id: "guidance",
      eyebrow: "七、關鍵建議",
      title: "你現在最值得立刻執行的三步",
      body: reading.concreteGuidance.join(" "),
      accent: "practice",
    },
  ];
}

export function isReadingRecordStale(record: ReadingRecord, maxAgeMs = 90_000) {
  if (record.status !== "generating") {
    return false;
  }

  return Date.now() - new Date(record.updatedAt).getTime() > maxAgeMs;
}
