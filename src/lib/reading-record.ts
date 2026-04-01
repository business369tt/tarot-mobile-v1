import type { ReadingRecord as PrismaReadingRecord } from "@prisma/client";
import {
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
export const readingFailureMessage =
  "The report could not settle into place just yet. Give it another quiet try.";
export const readingUnavailableMessage =
  "The reading service is not available in this environment yet.";
export const readingNeedsRevealMessage =
  "The report opens only after the three-card reveal is fully complete.";
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
    .map((card, index) => {
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
      ? value.concreteGuidance.slice(0, 3).map((item) => String(item).trim())
      : [
          "Keep your next step simple enough to act on without forcing certainty.",
          "Let the strongest emotional signal inform the pace, not the fear around it.",
          "Return to the spread when the body feels divided, not when urgency spikes.",
        ];

  return {
    reportTitle:
      String(value?.reportTitle || "").trim() ||
      `${categoryMeta.label} reading`,
    reportSubtitle:
      String(value?.reportSubtitle || "").trim() ||
      "A complete three-card report shaped from your question and the revealed spread.",
    questionCore:
      String(value?.questionCore || "").trim() ||
      `The cards treat "${question}" as a live question, asking for steadiness before conclusion.`,
    constellationLine:
      String(value?.constellationLine || "").trim() ||
      `${threshold?.name ?? "The first card"}, ${mirror?.name ?? "the second card"}, and ${horizon?.name ?? "the third card"} form one continuous sentence rather than three separate answers.`,
    spreadAxis:
      String(value?.spreadAxis || "").trim() ||
      `The spread moves through ${categoryMeta.label.toLowerCase()} with a quieter, more deliberate rhythm than your first reaction may want.`,
    cardReadings: {
      threshold:
        String(value?.cardReadings?.threshold || "").trim() ||
        `${threshold?.name ?? "The first card"} opens the reading by naming what has already begun to move beneath the surface.`,
      mirror:
        String(value?.cardReadings?.mirror || "").trim() ||
        `${mirror?.name ?? "The second card"} reflects the pressure, longing, or distortion that the situation is asking you to see more clearly.`,
      horizon:
        String(value?.cardReadings?.horizon || "").trim() ||
        `${horizon?.name ?? "The third card"} points toward the next motion that will feel cleaner if you let timing work with you.`,
    },
    progression:
      String(value?.progression || "").trim() ||
      "The three cards move from naming the truth, to clarifying the pattern, to showing the next clean response.",
    nearTermTrend:
      String(value?.nearTermTrend || "").trim() ||
      "In the near term, the reading favors calm alignment over dramatic movement.",
    concreteGuidance: [
      guidance[0] || "Choose the next honest step.",
      guidance[1] || "Protect your pace.",
      guidance[2] || "Let clarity arrive in sequence.",
    ],
    closingReminder:
      String(value?.closingReminder || "").trim() ||
      "Move in the direction that leaves your inner voice less divided afterward.",
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

export function mapRecordToReadingRecord(record: PrismaReadingRecord): ReadingRecord {
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
      eyebrow: "I. Question Core",
      title: "What the reading believes this question is truly about",
      body: reading.questionCore,
      accent: record.cardsSnapshot[0]?.keywords[0] ?? "focus",
    },
    {
      id: "axis",
      eyebrow: "II. Spread Axis",
      title: "The three-card line running through the whole report",
      body: reading.spreadAxis,
      accent: record.cardsSnapshot[1]?.keywords[0] ?? "pattern",
    },
    {
      id: "threshold",
      eyebrow: "III. Threshold Card",
      title: `${threshold?.name ?? "Threshold"} in its opening role`,
      body: reading.cardReadings.threshold,
      accent: threshold?.keywords[1] ?? "opening",
    },
    {
      id: "mirror",
      eyebrow: "IV. Mirror Card",
      title: `${mirror?.name ?? "Mirror"} as the reflective pressure point`,
      body: reading.cardReadings.mirror,
      accent: mirror?.keywords[1] ?? "reflection",
    },
    {
      id: "horizon",
      eyebrow: "V. Horizon Card",
      title: `${horizon?.name ?? "Horizon"} as the next clean movement`,
      body: reading.cardReadings.horizon,
      accent: horizon?.keywords[1] ?? "direction",
    },
    {
      id: "trend",
      eyebrow: "VI. Near-Term Trend",
      title: "What the next stretch of time is asking for",
      body: reading.nearTermTrend,
      accent: record.cardsSnapshot[2]?.keywords[0] ?? "timing",
    },
    {
      id: "guidance",
      eyebrow: "VII. Concrete Guidance",
      title: "How to move with the reading instead of against it",
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
