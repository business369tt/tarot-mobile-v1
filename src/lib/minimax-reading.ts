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
        `${card.role}｜${card.roleSubtitle}`,
        `牌名｜${card.name}`,
        `牌位方向｜${card.orientation === "upright" ? "正位" : "逆位"}`,
        `解讀錨點｜${card.tone}`,
        `關鍵句｜${orientationLine}`,
        `關鍵詞｜${card.keywords.join("、")}`,
      ].join("\n");
    })
    .join("\n\n");

  const system = [
    "你是一位資深塔羅占卜師，擅長用三張牌牌陣為提問者做直接、清楚、準確的解讀。",
    "你只能使用台灣繁體中文回答，禁止使用英文、雙語、簡體中文、網路口語、模板化心靈雞湯。",
    "你的語氣要像真正有經驗的塔羅占卜師，能夠看出問題核心、指出局勢走向、直說盲點，並給出可執行的建議。",
    "你的回答必須明確，不要曖昧，不要閃躲，不要只講可能性，不要把關鍵判斷說得模糊。",
    "你可以保留塔羅的細膩與分寸，但每一段都要讓提問者知道這副牌到底在說什麼、接下來該怎麼做。",
    "你只能輸出合法 JSON，不要輸出 markdown、前言、結語或任何額外說明。",
  ].join(" ");

  const user = [
    "請根據以下問題與三張牌，產出一份完整的塔羅主解讀。",
    `提問｜${args.question}`,
    `主題｜${categoryMeta.label}｜${categoryMeta.description}`,
    "三張牌如下：",
    cardLines,
    "",
    "請只輸出這個 JSON 結構：",
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
    "寫作規則：",
    "1. 所有欄位都只能用繁體中文。",
    "2. reportTitle 要像真正占卜報告的標題，短、準、有判斷，不要空泛。",
    "3. reportSubtitle 要用一句話點出這次解讀的主軸與走向。",
    "4. questionCore 要直接指出提問者現在真正卡住的是什麼，不要只重述問題。",
    "5. constellationLine 要把三張牌串成一句完整判斷，說出這個牌陣的主線。",
    "6. spreadAxis 要講清楚整體局勢怎麼發展，現在最重要的力量是什麼。",
    "7. cardReadings.threshold、mirror、horizon 必須分別依照該張牌的牌名、正逆位、牌位任務來解釋，不能互相重複。",
    "8. progression 要講出事情接下來最可能如何推進，語氣要明確。",
    "9. nearTermTrend 要講近期走勢，讓提問者知道短期內會看到什麼變化。",
    "10. concreteGuidance 一定要給三條具體可做的建議，而且是可以立刻採取的動作，不要空話。",
    "11. closingReminder 要像占卜師最後的叮嚀，短而有力。",
    "12. 解讀時一定要緊扣每張牌本身的象徵與正逆位，不可胡亂泛談，也不可只講抽象心理。",
    "13. 回答要像真人占卜師，不是客服、不是老師、不是一般 AI 助手。",
  ].join("\n");

  return { system, user };
}

function buildCardContext(cards: SelectedTarotCard[]) {
  return cards
    .map((card: SelectedTarotCard) => {
      const orientationLine =
        card.orientation === "upright" ? card.uprightText : card.reversedText;

      return [
        `${card.role}｜${card.roleSubtitle}`,
        `牌名｜${card.name}`,
        `牌位方向｜${card.orientation === "upright" ? "正位" : "逆位"}`,
        `解讀錨點｜${card.tone}`,
        `關鍵句｜${orientationLine}`,
        `關鍵詞｜${card.keywords.join("、")}`,
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
    "你是一位資深塔羅占卜師，正在延續同一副牌的主解讀，回覆提問者的追問。",
    "你只能使用台灣繁體中文，禁止英文、雙語、簡體中文與模糊空話。",
    "你的回答要像真正占卜師的追問解答：承接原本牌陣、直指核心、說清楚局勢，不繞圈。",
    "你不能離開這三張牌原本的範圍亂發揮，所有追問都必須以既有牌陣與主解讀為根據。",
    "請直接輸出純文字答案，不要 markdown，不要條列，不要 JSON。",
  ].join(" ");

  const user = [
    "請延續這一副牌的主解讀，回答新的追問。",
    `原始提問｜${args.question}`,
    `主題｜${categoryMeta.label}｜${categoryMeta.description}`,
    "三張牌如下：",
    cardsContext,
    "",
    "主解讀摘要：",
    `報告標題｜${args.reading.reportTitle}`,
    `問題核心｜${args.reading.questionCore}`,
    `牌陣主線｜${args.reading.spreadAxis}`,
    `進程判斷｜${args.reading.progression}`,
    `近期走勢｜${args.reading.nearTermTrend}`,
    `實際建議｜${args.reading.concreteGuidance.join("、")}`,
    `收尾提醒｜${args.reading.closingReminder}`,
    "",
    `追問｜${args.followupPrompt}`,
    "",
    "回覆規則：",
    "1. 用繁體中文完整回答。",
    "2. 要明確回答追問，不要只說抽象方向。",
    "3. 要承接原本牌陣，指出是哪一張牌或哪條主線支撐這個判斷。",
    "4. 可以提醒限制與代價，但不能把回答講成模稜兩可。",
    "5. 最後用一句簡短叮嚀收尾，像占卜師的提醒。",
  ].join("\n");

  return { system, user };
}

function normalizeJsonCandidate(candidate: string) {
  return candidate
    .replace(/^\uFEFF/, "")
    .replace(/,\s*([}\]])/g, "$1")
    .trim();
}

function extractBalancedJsonObjects(raw: string) {
  const candidates: string[] = [];
  let start = -1;
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = 0; index < raw.length; index += 1) {
    const char = raw[index];

    if (start < 0) {
      if (char === "{") {
        start = index;
        depth = 1;
        inString = false;
        escaped = false;
      }

      continue;
    }

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\" && inString) {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (char === "{") {
      depth += 1;
      continue;
    }

    if (char !== "}") {
      continue;
    }

    depth -= 1;

    if (depth === 0) {
      candidates.push(raw.slice(start, index + 1));
      start = -1;
    }
  }

  return candidates;
}

function tryParseJsonCandidate(candidate: string) {
  try {
    const parsed = JSON.parse(normalizeJsonCandidate(candidate)) as unknown;

    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // ignore parse failures and keep trying the next candidate
  }

  return null;
}

function extractJsonObject(raw: string) {
  const direct = raw.trim();
  const candidates: string[] = [];

  function pushCandidate(value: string | undefined) {
    const candidate = value?.trim();

    if (!candidate || candidates.includes(candidate)) {
      return;
    }

    candidates.push(candidate);
  }

  pushCandidate(direct);

  const fenced =
    direct.match(/```json\s*([\s\S]*?)```/i) ??
    direct.match(/```\s*([\s\S]*?)```/i);

  pushCandidate(fenced?.[1]);

  for (const candidate of extractBalancedJsonObjects(direct)) {
    pushCandidate(candidate);
  }

  if (fenced?.[1]) {
    for (const candidate of extractBalancedJsonObjects(fenced[1])) {
      pushCandidate(candidate);
    }
  }

  for (const candidate of candidates) {
    const parsed = tryParseJsonCandidate(candidate);

    if (parsed) {
      return parsed;
    }
  }

  throw new Error("MiniMax returned a response that could not be parsed as JSON.");
}

function getReadingPreview(raw: string, maxLength = 280) {
  const preview = raw.replace(/\s+/g, " ").trim();

  if (preview.length <= maxLength) {
    return preview;
  }

  return `${preview.slice(0, maxLength)}...`;
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
  let parsed: Record<string, unknown> | null = null;

  try {
    parsed = extractJsonObject(response.text);
  } catch (error) {
    console.warn(
      "MiniMax reading parse failed; falling back to normalized defaults.",
      error,
      getReadingPreview(response.text),
    );
  }

  const structured = normalizeStructuredTarotReading(
    parsed,
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
