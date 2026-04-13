import {
  buildSelectedCard,
  cardRoles,
  buildSpread,
  defaultQuestion,
  getCategoryMeta,
  type SelectedTarotCard,
  type TarotCard,
  type TarotCategoryId,
} from "@/lib/mock-tarot-data";

export type TarotFlowStep = "question" | "ritual" | "draw" | "reveal" | "reading";

export type TarotDraft = {
  question: string;
  category: TarotCategoryId;
  saveToHistory: boolean;
};

export type TarotSession = {
  sessionId: string;
  ownerViewerId: string | null;
  currentStep: TarotFlowStep;
  question: string;
  category: TarotCategoryId;
  saveToHistory: boolean;
  spreadCards: TarotCard[];
  selectedCards: SelectedTarotCard[];
  revealed: number;
  ritualStartedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export const currentTarotSessionCookieName = "tarot-mobile-v1.current-session";

export const tarotStepPathMap: Record<TarotFlowStep, string> = {
  question: "/question",
  ritual: "/ritual",
  draw: "/draw",
  reveal: "/reveal",
  reading: "/reading",
};

const stepRank: Record<TarotFlowStep, number> = {
  question: 0,
  ritual: 1,
  draw: 2,
  reveal: 3,
  reading: 4,
};

export const defaultTarotDraft: TarotDraft = {
  question: "",
  category: "love",
  saveToHistory: false,
};

function nextSeed() {
  return Date.now();
}

function isCategoryId(value: unknown): value is TarotCategoryId {
  return ["love", "career", "self", "decision", "timing"].includes(
    String(value),
  );
}

function createSessionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `tarot-${nextSeed().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function clampRevealCount(revealed: number, cards: SelectedTarotCard[]) {
  return Math.max(0, Math.min(revealed, cards.length));
}

function parseArrayJson<T>(value: string | null | undefined) {
  if (!value) {
    return [] as T[];
  }

  try {
    const parsed = JSON.parse(value);

    return Array.isArray(parsed) ? (parsed as T[]) : ([] as T[]);
  } catch {
    return [] as T[];
  }
}

function normalizeSelectedCards(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as SelectedTarotCard[];
  }

  return value
    .slice(0, cardRoles.length)
    .map((card: unknown, index: number) => {
      if (!card || typeof card !== "object") {
        return null;
      }

      return buildSelectedCard(card as TarotCard, index);
    })
    .filter((card): card is SelectedTarotCard => Boolean(card));
}

export function normalizeTarotDraft(value: Partial<TarotDraft> | null | undefined) {
  return {
    question: String(value?.question || "").slice(0, 180),
    category: isCategoryId(value?.category) ? value.category : "love",
    saveToHistory:
      typeof value?.saveToHistory === "boolean" ? value.saveToHistory : false,
  } satisfies TarotDraft;
}

export function createTarotSession(
  draft: TarotDraft,
  ownerViewerId: string | null,
): TarotSession {
  const now = new Date().toISOString();
  const question = draft.question.trim() || defaultQuestion;

  return {
    sessionId: createSessionId(),
    ownerViewerId,
    currentStep: "ritual",
    question,
    category: draft.category,
    saveToHistory: false,
    spreadCards: buildSpread(nextSeed()),
    selectedCards: [],
    revealed: 0,
    ritualStartedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function deriveSessionStep(session: TarotSession): TarotFlowStep {
  if (!session.question.trim()) {
    return "question";
  }

  if (!session.ritualStartedAt) {
    return "ritual";
  }

  if (session.selectedCards.length < cardRoles.length) {
    return "draw";
  }

  if (session.revealed < cardRoles.length) {
    return "reveal";
  }

  return "reading";
}

export function normalizeTarotSession(session: TarotSession): TarotSession {
  const now = new Date().toISOString();
  const selectedCards = normalizeSelectedCards(session.selectedCards);
  const category = isCategoryId(session.category) ? session.category : "love";
  const spreadCards =
    Array.isArray(session.spreadCards) && session.spreadCards.length > 0
      ? (session.spreadCards.slice(0, 9) as TarotCard[])
      : buildSpread(nextSeed());
  const normalized: TarotSession = {
    sessionId: String(session.sessionId || createSessionId()),
    ownerViewerId:
      typeof session.ownerViewerId === "string" && session.ownerViewerId
        ? session.ownerViewerId
        : null,
    currentStep: "ritual",
    question: String(session.question || "").trim().slice(0, 180),
    category,
    saveToHistory: Boolean(session.saveToHistory),
    spreadCards,
    selectedCards,
    revealed: clampRevealCount(Number(session.revealed) || 0, selectedCards),
    ritualStartedAt:
      typeof session.ritualStartedAt === "string" && session.ritualStartedAt
        ? session.ritualStartedAt
        : null,
    createdAt:
      typeof session.createdAt === "string" && session.createdAt
        ? session.createdAt
        : now,
    updatedAt:
      typeof session.updatedAt === "string" && session.updatedAt
        ? session.updatedAt
        : now,
  };

  return {
    ...normalized,
    currentStep: deriveSessionStep(normalized),
  };
}

export function serializeTarotCards(cards: TarotCard[] | SelectedTarotCard[]) {
  return JSON.stringify(cards);
}

type TarotSessionRecordInput = {
  id: string;
  ownerId: string | null;
  currentStep: string;
  question: string;
  category: string;
  saveToHistory: boolean;
  spreadCardsJson: string | null;
  selectedCardsJson: string | null;
  revealed: number;
  ritualStartedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export function mapRecordToTarotSession(record: TarotSessionRecordInput): TarotSession {
  return normalizeTarotSession({
    sessionId: record.id,
    ownerViewerId: record.ownerId,
    currentStep: (record.currentStep as TarotFlowStep) ?? "ritual",
    question: record.question,
    category: isCategoryId(record.category) ? record.category : "love",
    saveToHistory: record.saveToHistory,
    spreadCards: parseArrayJson<TarotCard>(record.spreadCardsJson),
    selectedCards: parseArrayJson<SelectedTarotCard>(record.selectedCardsJson),
    revealed: record.revealed,
    ritualStartedAt: record.ritualStartedAt?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  });
}

export function getStepRedirect(
  requiredStep: TarotFlowStep,
  session: TarotSession | null,
) {
  if (!session) {
    return tarotStepPathMap.question;
  }

  const allowedStep = deriveSessionStep(normalizeTarotSession(session));

  if (stepRank[allowedStep] >= stepRank[requiredStep]) {
    return null;
  }

  return tarotStepPathMap[allowedStep];
}

export function getSessionResumeRoute(session: TarotSession | null) {
  if (!session) {
    return tarotStepPathMap.question;
  }

  return tarotStepPathMap[deriveSessionStep(normalizeTarotSession(session))];
}

export function getSessionCategoryMeta(session: TarotSession | null) {
  return getCategoryMeta(session?.category ?? "love");
}

export function isSessionOwnedByViewer(
  session: TarotSession | null,
  viewerId: string | null,
) {
  if (!session?.ownerViewerId || !viewerId) {
    return false;
  }

  return session.ownerViewerId === viewerId;
}
