import {
  getCardDisplayMeta,
  getCategoryMeta,
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
export const readingNeedsRevealMessage = "三張牌都翻開之後，才能開始解讀。";

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
  const categoryMeta = getCategoryMeta(category);
  const [threshold, mirror, horizon] = cards;
  const guidance =
    Array.isArray(value?.concreteGuidance) && value.concreteGuidance.length >= 3
      ? value.concreteGuidance
          .slice(0, 3)
          .map((item: string) => String(item).trim())
      : [
          "先把下一步縮小成你今天就能做的動作，不要再拖著不決。",
          "不要只看情緒起伏，要看哪一個選擇真的讓局勢往前走。",
          "如果心裡還很亂，就回到牌陣主線，不要被一時的焦慮帶偏。",
        ];

  return {
    reportTitle:
      String(value?.reportTitle || "").trim() || `${categoryMeta.label}解讀`,
    reportSubtitle:
      String(value?.reportSubtitle || "").trim() ||
      "這份牌陣已經把你的問題攤開，重點是看清楚真正的主線。",
    questionCore:
      String(value?.questionCore || "").trim() ||
      `這副牌認為你現在真正卡住的，不只是「${question}」，而是你還沒有看清楚自己最該面對的核心。`,
    constellationLine:
      String(value?.constellationLine || "").trim() ||
      `${threshold?.name ?? "第一張牌"}、${mirror?.name ?? "第二張牌"}與${horizon?.name ?? "第三張牌"}不是三個零散訊號，而是一條連續的答案。`,
    spreadAxis:
      String(value?.spreadAxis || "").trim() ||
      `整個牌陣把焦點放在${categoryMeta.label}這條主線上，提醒你先看懂局勢，再決定怎麼出手。`,
    cardReadings: {
      threshold:
        String(value?.cardReadings?.threshold || "").trim() ||
        `${threshold?.name ?? "第一張牌"}先把局勢的起點說出來，點出事情真正從哪裡開始失衡。`,
      mirror:
        String(value?.cardReadings?.mirror || "").trim() ||
        `${mirror?.name ?? "第二張牌"}照出你現在最需要正視的情緒、盲點或壓力來源。`,
      horizon:
        String(value?.cardReadings?.horizon || "").trim() ||
        `${horizon?.name ?? "第三張牌"}指出接下來最可能發生的走向，以及你該怎麼順勢而行。`,
    },
    progression:
      String(value?.progression || "").trim() ||
      "這副牌的進程很清楚：先看見真相，再拆開卡點，最後才知道下一步怎麼走。",
    nearTermTrend:
      String(value?.nearTermTrend || "").trim() ||
      "短期內局勢不會突然翻盤，但只要你照著牌意調整，方向會慢慢轉正。",
    concreteGuidance: [
      guidance[0] || "先做最直接的那一步。",
      guidance[1] || "不要再逃避真正的卡點。",
      guidance[2] || "用更穩的節奏回到主線。",
    ],
    closingReminder:
      String(value?.closingReminder || "").trim() ||
      "這副牌不是要你更焦慮，而是要你做出更清楚的選擇。",
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
      title: "三張牌一路串起來的整體答案",
      body: reading.spreadAxis,
      accent: record.cardsSnapshot[1]?.keywords[0] ?? "pattern",
    },
    {
      id: "threshold",
      eyebrow: "三、第一張牌",
      title: `${getCardDisplayMeta(threshold?.id ?? "high-priestess").nameZh}在起手位說了什麼`,
      body: reading.cardReadings.threshold,
      accent: threshold?.keywords[1] ?? "opening",
    },
    {
      id: "mirror",
      eyebrow: "四、第二張牌",
      title: `${getCardDisplayMeta(mirror?.id ?? "moon").nameZh}照出了什麼盲點`,
      body: reading.cardReadings.mirror,
      accent: mirror?.keywords[1] ?? "reflection",
    },
    {
      id: "horizon",
      eyebrow: "五、第三張牌",
      title: `${getCardDisplayMeta(horizon?.id ?? "sun").nameZh}把方向帶往哪裡`,
      body: reading.cardReadings.horizon,
      accent: horizon?.keywords[1] ?? "direction",
    },
    {
      id: "trend",
      eyebrow: "六、近期走勢",
      title: "接下來短期內最可能出現的變化",
      body: reading.nearTermTrend,
      accent: record.cardsSnapshot[2]?.keywords[0] ?? "timing",
    },
    {
      id: "guidance",
      eyebrow: "七、實際建議",
      title: "你現在最該立刻採取的動作",
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
