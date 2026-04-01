import { getCategoryMeta, type SelectedTarotCard, type TarotCategoryId } from "@/lib/mock-tarot-data";
import {
  normalizeStructuredTarotReading,
  readingFailureMessage,
  readingUnavailableMessage,
  type StructuredTarotReading,
} from "@/lib/reading-record";
import {
  followupFailureMessage,
  followupUnavailableMessage,
} from "@/lib/followup-record";

const minimaxAnthropicBaseUrl =
  process.env.MINIMAX_BASE_URL?.trim() || "https://api.minimax.io/anthropic";
const minimaxModel = process.env.MINIMAX_MODEL?.trim() || "MiniMax-M2.5";
const anthropicVersion = "2023-06-01";

type MiniMaxMessageResponse = {
  content?: Array<
    | {
        type: "text";
        text?: string;
      }
    | {
        type: string;
        [key: string]: unknown;
      }
  >;
  model?: string;
  error?: {
    message?: string;
    type?: string;
  };
};

export function isMiniMaxConfigured() {
  return Boolean(process.env.MINIMAX_API_KEY?.trim());
}

export function getMiniMaxReadingModel() {
  return minimaxModel;
}

function buildReadingPrompt(args: {
  question: string;
  category: TarotCategoryId;
  cards: SelectedTarotCard[];
}) {
  const categoryMeta = getCategoryMeta(args.category);
  const cardLines = args.cards
    .map((card: SelectedTarotCard) => {
      const orientationLine =
        card.orientation === "upright" ? card.uprightText : card.reversedText;

      return [
        `${card.role} (${card.roleSubtitle})`,
        `Card: ${card.name} [${card.orientation}]`,
        `Tone: ${card.tone}`,
        `Interpretive anchor: ${orientationLine}`,
        `Keywords: ${card.keywords.join(", ")}`,
      ].join("\n");
    })
    .join("\n\n");

  const system = [
    "You are the writing engine for a premium tarot mobile product.",
    "Write in calm, elegant, emotionally intelligent English.",
    "Be insightful and specific, but never fatalistic, manipulative, or absolute.",
    "Base the reading only on the provided question, category, and three selected cards.",
    "Return valid JSON only. Do not wrap the JSON in markdown or code fences.",
  ].join(" ");

  const user = [
    "Generate one complete tarot reading report for the following session.",
    `Question: ${args.question}`,
    `Category: ${categoryMeta.label} — ${categoryMeta.description}`,
    "Selected cards:",
    cardLines,
    "",
    "Return a JSON object with exactly these keys:",
    "{",
    '  "reportTitle": "string",',
    '  "reportSubtitle": "string",',
    '  "questionCore": "string",',
    '  "constellationLine": "string",',
    '  "spreadAxis": "string",',
    '  "cardReadings": {',
    '    "threshold": "string",',
    '    "mirror": "string",',
    '    "horizon": "string"',
    "  },",
    '  "progression": "string",',
    '  "nearTermTrend": "string",',
    '  "concreteGuidance": ["string", "string", "string"],',
    '  "closingReminder": "string"',
    "}",
    "",
    "Writing rules:",
    "1. Keep each field concise enough for a mobile reading product.",
    "2. Mention the exact card names inside the relevant card reading fields.",
    "3. The progression field must explain how the three cards move as one sequence.",
    "4. The nearTermTrend field should focus on the coming days, not months.",
    "5. The concreteGuidance array must contain exactly three practical suggestions.",
    "6. The closingReminder field must be one sentence only.",
  ].join("\n");

  return { system, user };
}

function buildCardContext(cards: SelectedTarotCard[]) {
  return cards
    .map((card: SelectedTarotCard) => {
      const orientationLine =
        card.orientation === "upright" ? card.uprightText : card.reversedText;

      return [
        `${card.role} (${card.roleSubtitle})`,
        `Card: ${card.name} [${card.orientation}]`,
        `Tone: ${card.tone}`,
        `Interpretive anchor: ${orientationLine}`,
        `Keywords: ${card.keywords.join(", ")}`,
      ].join("\n");
    })
    .join("\n\n");
}

function buildFollowupPrompt(args: {
  question: string;
  category: TarotCategoryId;
  cards: SelectedTarotCard[];
  reading: StructuredTarotReading;
  followupPrompt: string;
}) {
  const categoryMeta = getCategoryMeta(args.category);
  const cardsContext = buildCardContext(args.cards);
  const system = [
    "You are the follow-up writing engine for a premium tarot mobile product.",
    "Write in calm, elegant, emotionally intelligent English.",
    "Treat this as a continuation of one existing reading, not a separate chat session.",
    "Use the provided question, category, card spread, completed reading, and follow-up prompt only.",
    "Do not mention policies, system prompts, or hidden reasoning.",
    "Return plain text only, without markdown headings or bullet lists.",
  ].join(" ");

  const user = [
    "Continue the tarot reading with one follow-up answer.",
    `Original question: ${args.question}`,
    `Category: ${categoryMeta.label} — ${categoryMeta.description}`,
    "Selected cards:",
    cardsContext,
    "",
    "Completed reading context:",
    `Report title: ${args.reading.reportTitle}`,
    `Question core: ${args.reading.questionCore}`,
    `Spread axis: ${args.reading.spreadAxis}`,
    `Progression: ${args.reading.progression}`,
    `Near-term trend: ${args.reading.nearTermTrend}`,
    `Concrete guidance: ${args.reading.concreteGuidance.join(" | ")}`,
    `Closing reminder: ${args.reading.closingReminder}`,
    "",
    `Follow-up prompt: ${args.followupPrompt}`,
    "",
    "Writing rules:",
    "1. Write 3 short paragraphs only.",
    "2. Keep the answer clearly anchored to this existing reading.",
    "3. Mention at least one of the card names when it helps answer the follow-up.",
    "4. Be specific, grounded, and emotionally steady.",
    "5. End with one gentle next-step sentence, not a dramatic prediction.",
  ].join("\n");

  return { system, user };
}

function extractJsonObject(raw: string) {
  const direct = raw.trim();

  try {
    return JSON.parse(direct) as Record<string, unknown>;
  } catch {
    // fall through
  }

  const fenced = direct.match(/```json\s*([\s\S]*?)```/i) ?? direct.match(/```\s*([\s\S]*?)```/i);

  if (fenced?.[1]) {
    return JSON.parse(fenced[1]) as Record<string, unknown>;
  }

  const firstBrace = direct.indexOf("{");
  const lastBrace = direct.lastIndexOf("}");

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return JSON.parse(direct.slice(firstBrace, lastBrace + 1)) as Record<string, unknown>;
  }

  throw new Error("MiniMax returned a response that could not be parsed as JSON.");
}

function getTextContent(response: MiniMaxMessageResponse) {
  return (response.content ?? [])
    .filter(
      (block): block is { type: "text"; text?: string } => block.type === "text",
    )
    .map((block: { type: "text"; text?: string }) => block.text?.trim() ?? "")
    .filter(Boolean)
    .join("\n")
    .trim();
}

async function requestMiniMaxText(args: {
  system: string;
  user: string;
  unavailableMessage: string;
  failureMessage: string;
  maxTokens: number;
}) {
  const apiKey = process.env.MINIMAX_API_KEY;

  if (!apiKey) {
    throw new Error(args.unavailableMessage);
  }

  const response = await fetch(`${minimaxAnthropicBaseUrl}/v1/messages`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": anthropicVersion,
    },
    body: JSON.stringify({
      model: minimaxModel,
      max_tokens: args.maxTokens,
      temperature: 0.35,
      top_p: 0.9,
      system: args.system,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: args.user,
            },
          ],
        },
      ],
    }),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as MiniMaxMessageResponse | null;

  if (!response.ok) {
    throw new Error(payload?.error?.message || args.failureMessage);
  }

  const text = payload ? getTextContent(payload) : "";

  if (!text) {
    throw new Error(args.failureMessage);
  }

  return {
    model: payload?.model || minimaxModel,
    text,
  };
}

export async function generateTarotReadingWithMiniMax(args: {
  question: string;
  category: TarotCategoryId;
  cards: SelectedTarotCard[];
}) {
  const { system, user } = buildReadingPrompt(args);
  const response = await requestMiniMaxText({
    system,
    user,
    unavailableMessage: readingUnavailableMessage,
    failureMessage: readingFailureMessage,
    maxTokens: 1400,
  });

  const structured = normalizeStructuredTarotReading(
    extractJsonObject(response.text),
    args.cards,
    args.question,
    args.category,
  );

  return {
    reading: structured as StructuredTarotReading,
    model: response.model,
  };
}

export async function generateTarotFollowupWithMiniMax(args: {
  question: string;
  category: TarotCategoryId;
  cards: SelectedTarotCard[];
  reading: StructuredTarotReading;
  followupPrompt: string;
}) {
  const { system, user } = buildFollowupPrompt(args);
  const response = await requestMiniMaxText({
    system,
    user,
    unavailableMessage: followupUnavailableMessage,
    failureMessage: followupFailureMessage,
    maxTokens: 900,
  });

  return {
    answer: response.text,
    model: response.model,
  };
}
