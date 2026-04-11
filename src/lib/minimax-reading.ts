import {
  getCardDisplayMeta,
  getCardRoleDisplayMeta,
  getCategoryDisplayMeta,
  getOrientationDisplayMeta,
  type SelectedTarotCard,
  type TarotCategoryId,
} from "@/lib/mock-tarot-data";
import { logAiEvent } from "@/lib/ai-monitoring";
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

const blockedAiPhrases =
  /作為AI|作为AI|我是AI|語言模型|语言模型|language model|大型模型|無法保證|无法保证|以下是/i;
const markdownFencePattern = /```/;
const commonSimplifiedPattern =
  /[这来为们个后会让应还开点话说将并与题读独谈继续显脑责项战错准备冲讲别摊]/;

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

type RequestMiniMaxTextArgs = {
  system: string;
  user: string;
  unavailableMessage: string;
  failureMessage: string;
  maxTokens: number;
  temperature?: number;
  topP?: number;
};

export type MiniMaxGenerationMeta = {
  usedRepair: boolean;
  usedFallback: boolean;
  rawLength: number;
  repairedLength: number | null;
  qualityScore: number;
  qualityIssueCodes: string[];
};

type AiQualitySeverity = "warning" | "error";

type AiQualityIssueCode =
  | "too_short"
  | "not_traditional_chinese"
  | "contains_markdown"
  | "contains_json"
  | "format_invalid"
  | "mentions_ai"
  | "template_tone"
  | "too_vague"
  | "question_detached"
  | "directness_weak"
  | "tarot_anchor_missing"
  | "guidance_count_invalid"
  | "guidance_not_actionable"
  | "duplicate_sections";

type AiQualityIssue = {
  code: AiQualityIssueCode;
  field: string;
  severity: AiQualitySeverity;
  message: string;
};

type AiQualityResult = {
  passed: boolean;
  score: number;
  issues: AiQualityIssue[];
  issueCodes: AiQualityIssueCode[];
};

const structuredReadingRepairWarningCodes = new Set<AiQualityIssueCode>([
  "template_tone",
  "question_detached",
  "guidance_not_actionable",
]);

const explicitAiPattern =
  /作為AI|身為AI|我是AI|人工智慧|語言模型|large language model/i;
const templatePhrasePattern =
  /以下是|以下為|以上分析|總結來說|總的來說|希望這能幫助你|祝你好運|首先|其次|最後/;
const weakLeadPattern =
  /^(先看|先說|整體來看|整體而言|從牌面來看|根據.*牌|這組牌|先回到你的問題)/;
const vaguePhrasePattern =
  /可能|也許|或許|似乎|看起來|感覺上|某種程度|不一定|有機會|傾向|彷彿/g;
const actionableLeadPattern =
  /^(先|把|停止|開始|保持|直接|立刻|暫停|接受|回頭|確認|收斂|避開|提出|對齊|整理|等待|拒絕|推進|修正|安排|限定|拆開|留意|處理|說清楚|問清楚|寫下|補上|完成|建立)/;
const questionStopSignals = new Set([
  "我想",
  "請問",
  "想問",
  "是否",
  "會不會",
  "可以",
  "能不能",
  "最近",
  "現在",
  "這個",
  "這段",
  "為什麼",
  "怎麼",
  "如何",
  "嗎",
]);

export function isMiniMaxConfigured() {
  return Boolean(process.env.MINIMAX_API_KEY?.trim());
}

export function getMiniMaxReadingModel() {
  return minimaxModel;
}

function normalizeAnswerTextV2(value: string) {
  return normalizeTraditionalChinese(stripMarkdownFences(value))
    .replace(/联/g, "聯")
    .replace(/请/g, "請")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeComparisonTextV2(value: string) {
  return normalizeAnswerTextV2(value)
    .replace(/[\s,，。！？；：「」『』（）()、\-—…]/g, "")
    .toLowerCase();
}

function extractFirstSentenceV2(value: string) {
  const [firstSentence = ""] = normalizeAnswerTextV2(value).split(/[。！？\n]/);

  return firstSentence.trim();
}

function extractQuestionSignalsV2(question: string) {
  const normalized = normalizeTraditionalChinese(question)
    .replace(/[^\u3400-\u9fffA-Za-z0-9]+/g, " ")
    .trim();

  if (!normalized) {
    return [];
  }

  const signals = new Set<string>();
  const chunks = normalized.split(/\s+/).filter(Boolean);

  for (const chunk of chunks) {
    if (/^[A-Za-z0-9]+$/.test(chunk)) {
      if (chunk.length >= 2) {
        signals.add(chunk.toLowerCase());
      }

      continue;
    }

    for (let size = Math.min(4, chunk.length); size >= 2; size -= 1) {
      for (let start = 0; start <= chunk.length - size; start += 1) {
        const token = chunk.slice(start, start + size);

        if (zhTwQuestionStopSignals.has(token)) {
          continue;
        }

        signals.add(token);
      }
    }
  }

  return [...signals].slice(0, 120);
}

function containsQuestionSignalV2(value: string, question: string) {
  const normalized = normalizeAnswerTextV2(value);
  const signals = extractQuestionSignalsV2(question);

  if (signals.length === 0) {
    return true;
  }

  if (signals.some((signal) => signal.length >= 2 && normalized.includes(signal))) {
    return true;
  }

  const normalizedQuestion = normalizeTraditionalChinese(question).replace(/\s+/g, "");
  const firstSentence = extractFirstSentenceV2(normalized);

  if (
    /(?:應不應該|該不該|要不要|會不會|能不能|適不適合|還是)/.test(
      normalizedQuestion,
    ) &&
    /(?:建議|不建議|適合|不適合|可以|不可以|應該|先緩一緩|先等一等|先等等|先不要|先觀望|接受|觀望|推進|等待|暫緩|有幫助|沒幫助)/.test(
      firstSentence,
    )
  ) {
    return true;
  }

  return false;
}

function isNaturalTraditionalChineseTextV2(value: string) {
  const normalized = normalizeAnswerTextV2(value);

  if (!normalized || normalized.length < 6) {
    return false;
  }

  if (markdownFencePattern.test(normalized) || hasBlockedAiPhrase(normalized)) {
    return false;
  }

  if (/^\s*[\[{]/.test(normalized)) {
    return false;
  }

  const cjkCount = countCjkCharacters(normalized);
  const minCjkCount = normalized.length >= 24 ? 12 : 4;

  if (cjkCount < minCjkCount) {
    return false;
  }

  const latinCount = (normalized.match(/[A-Za-z]/g) ?? []).length;

  if (latinCount > cjkCount * 0.35) {
    return false;
  }

  const residualSimplifiedCount =
    normalized.match(/[这们为说会开关时后来过还让从种应动点实里问吗样观风审担复并产气两给对没机个线话觉处体办触号与达进边迟远门广华听联请于经资决潜变试带绪类语质单纯当钟础稳压缩态独谈继续显脑责项战错准备冲讲别摊]/g)?.length ??
    0;

  return residualSimplifiedCount <= 6;
}

function isActionableGuidanceV2(value: string) {
  const normalized = normalizeAnswerTextV2(value);

  return (
    zhTwActionableLeadPattern.test(normalized) ||
    /(?:先|寫下|列出|整理|釐清|確認|不要|停止|直接|安排|給自己|回去|保留|收斂|觀察|準備|今天開始|找一個|拿一張紙|說一句|留出|花十分鐘|用一個|用這句)/.test(
      normalized,
    )
  );
}

function mergeStructuredReadingCandidate(
  candidate: Partial<StructuredTarotReading> | null,
  fallbackBase: StructuredTarotReading,
) {
  if (!candidate) {
    return null;
  }

  const guidance = Array.isArray(candidate.concreteGuidance)
    ? candidate.concreteGuidance
        .map((item) => normalizeAnswerTextV2(String(item ?? "")))
        .filter(Boolean)
        .slice(0, 3)
    : [];

  function preferField(
    value: string | undefined,
    fallbackValue: string,
    minLength: number,
  ) {
    const normalized = normalizeAnswerTextV2(String(value ?? ""));

    return normalized.length >= minLength ? normalized : fallbackValue;
  }

  const mergedGuidance = fallbackBase.concreteGuidance.map((fallbackItem, index) => {
    const candidateItem = guidance[index];

    if (candidateItem && candidateItem.length >= 12 && isActionableGuidanceV2(candidateItem)) {
      return candidateItem;
    }

    return fallbackItem;
  }) as [string, string, string];

  return {
    ...candidate,
    reportTitle: preferField(candidate.reportTitle, fallbackBase.reportTitle, 4),
    reportSubtitle: preferField(
      candidate.reportSubtitle,
      fallbackBase.reportSubtitle,
      18,
    ),
    questionCore: preferField(candidate.questionCore, fallbackBase.questionCore, 28),
    constellationLine: preferField(
      candidate.constellationLine,
      fallbackBase.constellationLine,
      18,
    ),
    spreadAxis: preferField(candidate.spreadAxis, fallbackBase.spreadAxis, 24),
    cardReadings: {
      threshold: preferField(
        candidate.cardReadings?.threshold,
        fallbackBase.cardReadings.threshold,
        24,
      ),
      mirror: preferField(
        candidate.cardReadings?.mirror,
        fallbackBase.cardReadings.mirror,
        24,
      ),
      horizon: preferField(
        candidate.cardReadings?.horizon,
        fallbackBase.cardReadings.horizon,
        24,
      ),
    },
    progression: preferField(candidate.progression, fallbackBase.progression, 24),
    nearTermTrend: preferField(
      candidate.nearTermTrend,
      fallbackBase.nearTermTrend,
      18,
    ),
    concreteGuidance: mergedGuidance,
    closingReminder: preferField(
      candidate.closingReminder,
      fallbackBase.closingReminder,
      16,
    ),
  } satisfies Partial<StructuredTarotReading>;
}

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const zhTwBlockedAiPattern =
  /(?:作為|身為|我是|我是一個)?\s*(?:AI|人工智慧|語言模型)|language model/i;
const zhTwResidualSimplifiedPattern =
  /[这们为说会开关时后来过还让从种应动点实里问吗样观风审担复并产气两给对没机个线话觉处体办触号与达进边迟远门广华听独谈继续显脑责项战错准备冲讲别摊]/;
const zhTwTemplatePattern =
  /(?:這件事的關鍵不在表面結果|這副直答三張牌不是要你一次看完整個未來|先用現況核心抓住現在真正的重心|再正面處理隱藏阻力指出的卡點|直答三張牌先用現況核心(?:抓住現在真正的重心|定住局勢)，再(?:正面處理|由)隱藏阻力(?:指出的|照出)卡點，最後把答案收斂到最佳走向)/;
const zhTwWeakLeadPattern =
  /^(?:也許|可能|某種程度上|整體來說|大致上|看起來|可以先理解成)/;
const zhTwVaguePattern =
  /(?:某種程度|某個部分|也許|似乎|看起來|有可能|一些情況|慢慢來|之後再看看)/g;
const zhTwActionableLeadPattern =
  /^(?:先|先把|正視|依照|把|列出|寫下|釐清|確認|停止|暫停|直接|回去|保留|收斂|安排|觀察|記下|刪掉|補上|設定|只做|今天先|今天開始|這週先|先別|不要|試著|開始|找一個|拿一張紙|拿出|留出|花十分鐘|花一點時間|說一句|用)/;
const zhTwQuestionStopSignals = new Set([
  "我",
  "你",
  "他",
  "她",
  "它",
  "現在",
  "最近",
  "這件事",
  "這個人",
  "這個月",
  "如果",
  "真的",
  "主動",
  "應該",
  "不應該",
  "要不要",
  "還是",
  "最",
  "什麼",
  "怎麼",
  "哪一種",
  "一個月",
  "一件",
  "哪裡",
  "先",
  "再",
  "會",
  "有",
  "嗎",
]);
const simplifiedPhraseReplacements = [
  ["这个月", "這個月"],
  ["这件事", "這件事"],
  ["这个人", "這個人"],
  ["这个", "這個"],
  ["合作邀请", "合作邀請"],
  ["重新联络", "重新聯絡"],
  ["资源清单", "資源清單"],
  ["资源", "資源"],
  ["清单", "清單"],
  ["等于", "等於"],
  ["回应", "回應"],
  ["这种", "這種"],
  ["内在", "內在"],
  ["时机", "時機"],
  ["强行", "強行"],
  ["状态", "狀態"],
  ["过度", "過度"],
  ["处理", "處理"],
  ["后果", "後果"],
  ["压力", "壓力"],
  ["讯号", "訊號"],
  ["独处", "獨處"],
  ["谈合作", "談合作"],
  ["继续", "繼續"],
  ["显得", "顯得"],
  ["大脑", "大腦"],
  ["责任", "責任"],
  ["选项", "選項"],
  ["战车", "戰車"],
  ["错过", "錯過"],
  ["准备", "準備"],
  ["冲动", "衝動"],
  ["冲刺", "衝刺"],
  ["布局", "佈局"],
  ["摊开", "攤開"],
  ["讲清楚", "講清楚"],
  ["讲的是", "講的是"],
  ["第一句话", "第一句話"],
  ["第一句", "第一句"],
  ["什么信号", "什麼訊號"],
  ["风声", "風聲"],
] as const;
const simplifiedCharMap: Record<string, string> = {
  这: "這",
  个: "個",
  们: "們",
  为: "為",
  说: "說",
  会: "會",
  开: "開",
  关: "關",
  时: "時",
  后: "後",
  来: "來",
  过: "過",
  还: "還",
  让: "讓",
  从: "從",
  种: "種",
  应: "應",
  动: "動",
  点: "點",
  实: "實",
  里: "裡",
  问: "問",
  吗: "嗎",
  样: "樣",
  观: "觀",
  风: "風",
  审: "審",
  担: "擔",
  复: "複",
  并: "並",
  产: "產",
  气: "氣",
  两: "兩",
  给: "給",
  对: "對",
  没: "沒",
  机: "機",
  线: "線",
  话: "話",
  觉: "覺",
  处: "處",
  体: "體",
  办: "辦",
  触: "觸",
  号: "號",
  与: "與",
  达: "達",
  进: "進",
  边: "邊",
  迟: "遲",
  远: "遠",
  门: "門",
  广: "廣",
  华: "華",
  听: "聽",
  于: "於",
  经: "經",
  资: "資",
  决: "決",
  潜: "潛",
  变: "變",
  试: "試",
  带: "帶",
  绪: "緒",
  类: "類",
  语: "語",
  质: "質",
  单: "單",
  纯: "純",
  当: "當",
  钟: "鐘",
  础: "礎",
  稳: "穩",
  压: "壓",
  缩: "縮",
  态: "態",
  独: "獨",
  谈: "談",
  继: "繼",
  续: "續",
  显: "顯",
  脑: "腦",
  责: "責",
  项: "項",
  战: "戰",
  错: "錯",
  准: "準",
  备: "備",
  冲: "衝",
  讲: "講",
  别: "別",
  摊: "攤",
};

void [
  blockedAiPhrases,
  commonSimplifiedPattern,
  explicitAiPattern,
  templatePhrasePattern,
  weakLeadPattern,
  vaguePhrasePattern,
  actionableLeadPattern,
  questionStopSignals,
  normalizeComparisonText,
  extractFirstSentence,
  extractQuestionSignals,
  containsQuestionSignal,
  isNaturalTraditionalChineseText,
];

function normalizeTraditionalChinese(value: string) {
  let normalized = value;

  for (const [source, target] of simplifiedPhraseReplacements) {
    normalized = normalized.replaceAll(source, target);
  }

  return normalized.replace(
    /[这们为说会开关时后来过还让从种应动点实里问吗样观风审担复并产气两给对没机个线话觉处体办触号与达进边迟远门广华听于经资决潜变试带绪类语质单纯当钟础稳压缩态独谈继续显脑责项战错准备冲讲别摊]/g,
    (character) => simplifiedCharMap[character] ?? character,
  );
}

function hasBlockedAiPhrase(value: string) {
  return zhTwBlockedAiPattern.test(value);
}

function hasQualityErrors(result: AiQualityResult) {
  return result.issues.some((issue) => issue.severity === "error");
}

function countCjkCharacters(value: string) {
  return (value.match(/[\u3400-\u4dbf\u4e00-\u9fff]/g) ?? []).length;
}

function stripMarkdownFences(value: string) {
  return value
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

function normalizeAnswerText(value: string) {
  return normalizeAnswerTextV2(value);
}

function normalizeComparisonText(value: string) {
  return normalizeAnswerText(value)
    .replace(/[，。！？、：「」『』（）()【】〔〕《》〈〉\s]/g, "")
    .toLowerCase();
}

function countPatternMatches(value: string, pattern: RegExp) {
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
  const matcher = new RegExp(pattern.source, flags);

  return value.match(matcher)?.length ?? 0;
}

function extractFirstSentence(value: string) {
  const [firstSentence = ""] = normalizeAnswerText(value).split(/[。！？\n]/);

  return firstSentence.trim();
}

function uniqueIssueCodes(issues: AiQualityIssue[]) {
  return [...new Set(issues.map((issue) => issue.code))];
}

function buildQualityResult(issues: AiQualityIssue[]) {
  const uniqueIssues = [...issues].reduce((map, issue) => {
    const existing = map.get(issue.code);

    if (
      !existing ||
      (issue.severity === "error" && existing.severity !== "error")
    ) {
      map.set(issue.code, issue);
    }

    return map;
  }, new Map<AiQualityIssueCode, AiQualityIssue>());
  const score = Math.max(
    0,
    100 -
      [...uniqueIssues.values()].reduce(
        (total, issue) => total + (issue.severity === "error" ? 16 : 5),
        0,
      ),
  );
  const issueCodes = uniqueIssueCodes([...uniqueIssues.values()]);
  const passed =
    ![...uniqueIssues.values()].some((issue) => issue.severity === "error") &&
    score >= 84;

  return {
    passed,
    score,
    issues,
    issueCodes,
  } satisfies AiQualityResult;
}

function createQualityIssue(
  code: AiQualityIssueCode,
  field: string,
  severity: AiQualitySeverity,
  message: string,
) {
  return {
    code,
    field,
    severity,
    message,
  } satisfies AiQualityIssue;
}

function extractQuestionSignals(question: string) {
  const normalized = question
    .replace(/[^\u3400-\u9fffA-Za-z0-9]+/g, " ")
    .trim();

  if (!normalized) {
    return [];
  }

  const signals = new Set<string>();
  const chunks = normalized.split(/\s+/).filter(Boolean);

  for (const chunk of chunks) {
    if (/^[A-Za-z0-9]+$/.test(chunk)) {
      if (chunk.length >= 2) {
        signals.add(chunk.toLowerCase());
      }

      continue;
    }

    for (let size = Math.min(4, chunk.length); size >= 2; size -= 1) {
      for (let start = 0; start <= chunk.length - size; start += 1) {
        const token = chunk.slice(start, start + size);

        if (questionStopSignals.has(token)) {
          continue;
        }

        signals.add(token);
      }
    }
  }

  return [...signals].slice(0, 10);
}

function containsQuestionSignal(value: string, question: string) {
  const normalized = normalizeAnswerTextV2(value);
  const signals = extractQuestionSignalsV2(question);

  if (signals.length === 0) {
    return true;
  }

  return signals.some((signal) => signal.length >= 2 && normalized.includes(signal));
}

function getCardReadingFieldKey(role: string) {
  if (role === "Threshold") {
    return "cardReadings.threshold";
  }

  if (role === "Mirror") {
    return "cardReadings.mirror";
  }

  return "cardReadings.horizon";
}

function sectionMentionsCardAnchor(value: string, card: SelectedTarotCard) {
  const normalized = normalizeAnswerTextV2(value);
  const displayMeta = getCardDisplayMeta(card.id);
  const roleMeta = getCardRoleDisplayMeta(card.role);
  const orientationMeta = getOrientationDisplayMeta(card.orientation);

  return (
    normalized.includes(displayMeta.nameZh) ||
    (normalized.includes(roleMeta.labelZh) && normalized.includes(orientationMeta.zh)) ||
    displayMeta.keywordsZh.some((keyword) => keyword && normalized.includes(keyword))
  );
}

function evaluateTextQuality(args: {
  field: string;
  text: string | null | undefined;
  minLength: number;
  maxVagueCount?: number;
  requireQuestionSignal?: boolean;
  question?: string;
  checkDirectLead?: boolean;
}) {
  const normalized = normalizeAnswerTextV2(String(args.text ?? ""));
  const issues: AiQualityIssue[] = [];

  if (normalized.length < args.minLength) {
    issues.push(
      createQualityIssue(
        "too_short",
        args.field,
        "error",
        `${args.field} 太短，內容不夠完整。`,
      ),
    );
  }

  if (markdownFencePattern.test(normalized)) {
    issues.push(
      createQualityIssue(
        "contains_markdown",
        args.field,
        "error",
        `${args.field} 不應包含 markdown fence。`,
      ),
    );
  }

  if (/^\s*[\[{]/.test(normalized)) {
    issues.push(
      createQualityIssue(
        "contains_json",
        args.field,
        "error",
        `${args.field} 看起來像 JSON 或結構化輸出，不像自然回答。`,
      ),
    );
  }

  if (hasBlockedAiPhrase(normalized) || explicitAiPattern.test(normalized)) {
    issues.push(
      createQualityIssue(
        "mentions_ai",
        args.field,
        "error",
        `${args.field} 出現 AI 或模型自稱。`,
      ),
    );
  }

  if (!isNaturalTraditionalChineseTextV2(normalized)) {
    issues.push(
      createQualityIssue(
        "not_traditional_chinese",
        args.field,
        "warning",
        `${args.field} 不是自然的繁體中文。`,
      ),
    );
  }

  if (zhTwTemplatePattern.test(normalized)) {
    issues.push(
      createQualityIssue(
        "template_tone",
        args.field,
        "warning",
        `${args.field} 有模板感或客服腔。`,
      ),
    );
  }

  const vagueCount = countPatternMatches(normalized, zhTwVaguePattern);

  if (vagueCount > (args.maxVagueCount ?? 2)) {
    issues.push(
      createQualityIssue(
        "too_vague",
        args.field,
        "warning",
        `${args.field} 模糊詞過多，回答不夠明確。`,
      ),
    );
  }

  if (
    args.requireQuestionSignal &&
    args.question &&
    !containsQuestionSignalV2(normalized, args.question)
  ) {
    issues.push(
      createQualityIssue(
        "question_detached",
        args.field,
        "warning",
        `${args.field} 沒有直接扣住提問核心。`,
      ),
    );
  }

  if (args.checkDirectLead) {
    const firstSentence = extractFirstSentenceV2(normalized);

    if (!firstSentence || zhTwWeakLeadPattern.test(firstSentence)) {
      issues.push(
        createQualityIssue(
          "directness_weak",
          args.field,
          "warning",
          `${args.field} 開頭不夠直接。`,
        ),
      );
    }
  }

  return issues;
}

function evaluateStructuredReadingQuality(args: {
  value: Partial<StructuredTarotReading> | null;
  question: string;
  cards: SelectedTarotCard[];
}) {
  const issues: AiQualityIssue[] = [];

  if (!args.value) {
    issues.push(
      createQualityIssue(
        "contains_json",
        "reading",
        "error",
        "主解讀無法解析為有效內容。",
      ),
    );

    return buildQualityResult(issues);
  }

  issues.push(
    ...evaluateTextQuality({
      field: "reportTitle",
      text: args.value.reportTitle,
      minLength: 4,
      maxVagueCount: 0,
    }),
    ...evaluateTextQuality({
      field: "reportSubtitle",
      text: args.value.reportSubtitle,
      minLength: 18,
      maxVagueCount: 1,
    }),
    ...evaluateTextQuality({
      field: "questionCore",
      text: args.value.questionCore,
      minLength: 28,
      maxVagueCount: 1,
      requireQuestionSignal: true,
      question: args.question,
      checkDirectLead: true,
    }),
    ...evaluateTextQuality({
      field: "constellationLine",
      text: args.value.constellationLine,
      minLength: 18,
      maxVagueCount: 1,
    }),
    ...evaluateTextQuality({
      field: "spreadAxis",
      text: args.value.spreadAxis,
      minLength: 24,
      maxVagueCount: 1,
    }),
    ...evaluateTextQuality({
      field: "progression",
      text: args.value.progression,
      minLength: 24,
      maxVagueCount: 2,
    }),
    ...evaluateTextQuality({
      field: "nearTermTrend",
      text: args.value.nearTermTrend,
      minLength: 18,
      maxVagueCount: 2,
    }),
    ...evaluateTextQuality({
      field: "closingReminder",
      text: args.value.closingReminder,
      minLength: 16,
      maxVagueCount: 1,
    }),
  );

  const cardSections = [
    {
      field: "cardReadings.threshold",
      value: args.value.cardReadings?.threshold,
      card: args.cards[0],
    },
    {
      field: "cardReadings.mirror",
      value: args.value.cardReadings?.mirror,
      card: args.cards[1],
    },
    {
      field: "cardReadings.horizon",
      value: args.value.cardReadings?.horizon,
      card: args.cards[2],
    },
  ];

  for (const section of cardSections) {
    issues.push(
      ...evaluateTextQuality({
        field: section.field,
        text: section.value,
        minLength: 24,
        maxVagueCount: 1,
      }),
    );

    if (section.card && !sectionMentionsCardAnchor(String(section.value ?? ""), section.card)) {
      issues.push(
        createQualityIssue(
          "tarot_anchor_missing",
          section.field,
          "error",
          `${section.field} 沒有明確點出對應的牌位或牌義依據。`,
        ),
      );
    }
  }

  const guidance = Array.isArray(args.value.concreteGuidance)
    ? args.value.concreteGuidance.slice(0, 3)
    : [];

  if (guidance.length !== 3) {
    issues.push(
      createQualityIssue(
        "guidance_count_invalid",
        "concreteGuidance",
        "error",
        "具體建議必須剛好 3 條。",
      ),
    );
  }

  const actionableCount = guidance.filter((item) =>
    isActionableGuidanceV2(item),
  ).length;

  if (guidance.length > 0 && actionableCount < Math.min(2, guidance.length)) {
    issues.push(
      createQualityIssue(
        "guidance_not_actionable",
        "concreteGuidance",
        "warning",
        "具體建議不夠像可執行動作。",
      ),
    );
  }

  const normalizedSections = cardSections
    .map((section) => normalizeComparisonTextV2(String(section.value ?? "")))
    .filter(Boolean);
  const normalizedGuidance = guidance
    .map((item) => normalizeComparisonTextV2(String(item ?? "")))
    .filter(Boolean);

  if (
    new Set(normalizedSections).size < normalizedSections.length ||
    new Set(normalizedGuidance).size < normalizedGuidance.length
  ) {
    issues.push(
      createQualityIssue(
        "duplicate_sections",
        "reading",
        "warning",
        "不同段落內容過於重複。",
      ),
    );
  }

  return buildQualityResult(issues);
}

function evaluateFollowupAnswerQuality(args: {
  answer: string;
  question: string;
  followupPrompt: string;
  cards: SelectedTarotCard[];
}) {
  const issues = evaluateTextQuality({
    field: "followup.answer",
    text: args.answer,
    minLength: 90,
    maxVagueCount: 2,
    requireQuestionSignal: true,
    question: args.followupPrompt || args.question,
    checkDirectLead: true,
  });

  if (!args.cards.some((card) => sectionMentionsCardAnchor(args.answer, card))) {
    issues.push(
      createQualityIssue(
        "tarot_anchor_missing",
        "followup.answer",
        "error",
        "追問回答沒有明確連回牌面依據。",
      ),
    );
  }

  return buildQualityResult(issues);
}

function buildQualityRepairFocus(issueCodes: AiQualityIssueCode[]) {
  if (issueCodes.length === 0) {
    return "";
  }

  const descriptions = issueCodes.map((code) => {
    switch (code) {
      case "too_short":
        return "- 內容太短，請補足到像完整解讀，不要只剩骨架。";
      case "not_traditional_chinese":
        return "- 全文只能使用自然的繁體中文，不能夾簡體或英文句型。";
      case "contains_markdown":
      case "contains_json":
        return "- 不要輸出 markdown、程式碼框、JSON 包裝或額外說明文字。";
      case "format_invalid":
        return "- 請嚴格遵守指定的輸出格式，不要漏標籤、不要混用其他格式。";
      case "mentions_ai":
        return "- 移除任何 AI、自我介紹或助手口吻。";
      case "template_tone":
        return "- 拿掉模板句，語氣要像真的塔羅師，不像機器人。";
      case "too_vague":
        return "- 少用模糊詞，直接把判斷講清楚。";
      case "question_detached":
        return "- 回答要緊扣使用者原本的問題，不要講成泛用勸告。";
      case "directness_weak":
        return "- 第一段第一句就先回答問題，不要先鋪陳。";
      case "tarot_anchor_missing":
        return "- 要明確連回牌名、牌位與正逆位，不可脫離牌面亂講。";
      case "guidance_count_invalid":
        return "- 具體建議一定要剛好三條。";
      case "guidance_not_actionable":
        return "- 建議要能立刻執行，不要只是抽象鼓勵。";
      case "duplicate_sections":
        return "- 各段內容不要重複，每段都要有不同作用。";
      default:
        return "- 把這份回答修到更自然、更準確。";
    }
  });

  return ["前一版沒有通過的品質規則：", ...descriptions].join("\n");
}

function getDirectAnswerRoleDisplays(cards: SelectedTarotCard[]) {
  return {
    threshold: getCardRoleDisplayMeta(cards[0]?.role ?? "Threshold"),
    mirror: getCardRoleDisplayMeta(cards[1]?.role ?? "Mirror"),
    horizon: getCardRoleDisplayMeta(cards[2]?.role ?? "Horizon"),
  };
}

function buildDirectAnswerSpreadGuardrails(cards: SelectedTarotCard[]) {
  const roles = getDirectAnswerRoleDisplays(cards);

  return [
    "本次官方牌陣是「直答三張牌」。",
    "這不是過去／現在／未來牌陣，不能寫成時間線。",
    `threshold = ${roles.threshold.labelZh}：${roles.threshold.subtitleZh}。`,
    `mirror = ${roles.mirror.labelZh}：${roles.mirror.subtitleZh}。`,
    `horizon = ${roles.horizon.labelZh}：${roles.horizon.subtitleZh}。`,
  ].join("\n");
}

function buildReadingQualityChecklist(cards: SelectedTarotCard[]) {
  const roles = getDirectAnswerRoleDisplays(cards);
  const perCardRules = cards.map((card) => {
    const displayMeta = getCardDisplayMeta(card.id);
    const roleMeta = getCardRoleDisplayMeta(card.role);
    const orientationMeta = getOrientationDisplayMeta(card.orientation);

    return `- ${getCardReadingFieldKey(card.role)} 必須明確提到 ${displayMeta.nameZh}、${roleMeta.labelZh}、${orientationMeta.zh}，再解釋這張牌如何影響這個問題。`;
  });

  return [
    "你必須同時滿足以下品質規則：",
    "- 全文只能使用自然、流暢的繁體中文。",
    "- 語氣要像成熟的塔羅師，不像 AI 助手、客服或文章模板。",
    "- 這是「直答三張牌」，不可把三張牌誤寫成過去／現在／未來。",
    `- 三個牌位必須分別對應 ${roles.threshold.labelZh}、${roles.mirror.labelZh}、${roles.horizon.labelZh}。`,
    "- questionCore 的第一句就要直接回答使用者最在意的核心問題。",
    "- 不要使用『整體來看』『首先』『其次』『最後』『希望這能幫助你』這種模板開場。",
    "- concreteGuidance 必須剛好有三條，而且每條都要是可執行動作。",
    "- 不要輸出 markdown、程式碼框、JSON 解釋或 schema 以外的多餘文字。",
    ...perCardRules,
  ].join("\n");
}

function buildFollowupQualityChecklist(cards: SelectedTarotCard[]) {
  const roles = getDirectAnswerRoleDisplays(cards);
  const cardRule = cards
    .map((card) => {
      const displayMeta = getCardDisplayMeta(card.id);
      const roleMeta = getCardRoleDisplayMeta(card.role);
      const orientationMeta = getOrientationDisplayMeta(card.orientation);

      return `${displayMeta.nameZh}／${roleMeta.labelZh}／${orientationMeta.zh}`;
    })
    .join("；");

  return [
    "你必須同時滿足以下品質規則：",
    "- 全文只能使用自然的繁體中文。",
    "- 這一局仍然是「直答三張牌」，不要改寫成過去／現在／未來。",
    `- 回答時要延續 ${roles.threshold.labelZh}、${roles.mirror.labelZh}、${roles.horizon.labelZh} 這三個牌位邏輯。`,
    "- 第一段第一句就直接回答這則追問。",
    "- 回答中必須明確連回至少一張牌的牌名、牌位或正逆位。",
    `- 這一局可用的牌面錨點是：${cardRule}。`,
    "- 不要自稱 AI，不要像模板，不要輸出 markdown 或 code fence。",
    "- 回答要清楚、具體，而且真的建立在塔羅解讀上。",
  ].join("\n");
}

function isNaturalTraditionalChineseText(value: string) {
  const normalized = normalizeAnswerTextV2(value);

  if (!normalized || normalized.length < 12) {
    return false;
  }

  if (markdownFencePattern.test(normalized) || hasBlockedAiPhrase(normalized)) {
    return false;
  }

  if (/^\s*[\[{]/.test(normalized)) {
    return false;
  }

  const cjkCount = countCjkCharacters(normalized);

  if (cjkCount < 12) {
    return false;
  }

  const latinCount = (normalized.match(/[A-Za-z]/g) ?? []).length;

  if (latinCount > cjkCount * 0.35) {
    return false;
  }

  return (normalized.match(zhTwResidualSimplifiedPattern)?.length ?? 0) <= 2;
}

function collectStructuredReadingFields(value: Partial<StructuredTarotReading>) {
  return [
    value.reportTitle,
    value.reportSubtitle,
    value.questionCore,
    value.constellationLine,
    value.spreadAxis,
    value.cardReadings?.threshold,
    value.cardReadings?.mirror,
    value.cardReadings?.horizon,
    value.progression,
    value.nearTermTrend,
    ...(Array.isArray(value.concreteGuidance) ? value.concreteGuidance : []),
    value.closingReminder,
  ]
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);
}

function shouldRepairStructuredReading(args: {
  value: Partial<StructuredTarotReading> | null;
  question: string;
  cards: SelectedTarotCard[];
}) {
  if (!args.value) {
    return true;
  }

  const fields = collectStructuredReadingFields(args.value);

  if (fields.length < 10) {
    return true;
  }

  const quality = evaluateStructuredReadingQuality(args);

  if (hasQualityErrors(quality)) {
    return true;
  }

  return quality.issueCodes.some((code) =>
    structuredReadingRepairWarningCodes.has(code),
  );
}

function shouldRepairFollowupAnswer(args: {
  answer: string;
  question: string;
  followupPrompt: string;
  cards: SelectedTarotCard[];
}) {
  return !evaluateFollowupAnswerQuality(args).passed;
}

function formatCardForPrompt(card: SelectedTarotCard) {
  const displayMeta = getCardDisplayMeta(card.id);
  const roleMeta = getCardRoleDisplayMeta(card.role);
  const orientationMeta = getOrientationDisplayMeta(card.orientation);
  const orientationMeaning =
    card.orientation === "upright"
      ? displayMeta.uprightZh
      : displayMeta.reversedZh;

  return [
    `${roleMeta.labelZh}｜${roleMeta.subtitleZh}`,
    `牌名：${displayMeta.nameZh}`,
    `正逆位：${orientationMeta.zh}`,
    `牌性主調：${displayMeta.toneZh}`,
    `此位解讀重點：${orientationMeaning}`,
    `關鍵字：${displayMeta.keywordsZh.join("、")}`,
  ].join("\n");
}

function buildCardsContext(cards: SelectedTarotCard[]) {
  return cards.map(formatCardForPrompt).join("\n\n");
}

function buildReadingPrompt(args: {
  question: string;
  category: TarotCategoryId;
  cards: SelectedTarotCard[];
}) {
  const categoryMeta = getCategoryDisplayMeta(args.category);
  const cardsContext = buildCardsContext(args.cards);
  const spreadGuardrails = buildDirectAnswerSpreadGuardrails(args.cards);

  const system = [
    "你是一位成熟、準確、有真人感的塔羅占卜師，只能使用繁體中文作答。",
    "你必須嚴格依照三張牌的牌位、正逆位、牌義與使用者問題來解讀，不能忽略任何一張牌。",
    "你的回答要先直面問題，再解釋原因，語氣清楚、明確、不拐彎。",
    "不要自稱 AI，不要說自己是模型，不要使用模板化開場，不要說空話，也不要把答案寫得像說明書。",
    "不要輸出簡體中文、英文段落、markdown、code fence 或任何標籤結構以外的多餘文字。",
    "你可以保留塔羅的語感，但不能神化、嚇人、或做絕對命運式斷言。",
  ].join(" ");

  const user = [
    "請根據以下資訊，輸出一份可直接給使用者閱讀的塔羅解讀。",
    `問題：${args.question.trim()}`,
    `主題：${categoryMeta.labelZh}｜${categoryMeta.descriptionZh}`,
    "",
    "牌陣規則：",
    spreadGuardrails,
    "",
    "三張牌資料：",
    cardsContext,
    "",
    "請只輸出以下標籤結構，不能加任何前言、後記或說明：",
    "<reading>",
    "<reportTitle>...</reportTitle>",
    "<reportSubtitle>...</reportSubtitle>",
    "<questionCore>...</questionCore>",
    "<constellationLine>...</constellationLine>",
    "<spreadAxis>...</spreadAxis>",
    "<cardReadings>",
    "<threshold>...</threshold>",
    "<mirror>...</mirror>",
    "<horizon>...</horizon>",
    "</cardReadings>",
    "<progression>...</progression>",
    "<nearTermTrend>...</nearTermTrend>",
    "<concreteGuidance>",
    "<item>...</item>",
    "<item>...</item>",
    "<item>...</item>",
    "</concreteGuidance>",
    "<closingReminder>...</closingReminder>",
    "</reading>",
    "",
    "欄位要求：",
    "1. 所有欄位都必須是自然、完整、流暢的繁體中文。",
    "2. reportTitle 要像這次牌陣的主題標題，不能只是『塔羅解讀』這種空泛詞。",
    "3. reportSubtitle 要用一句話說出這次解讀的核心氣氛。",
    "3-1. reportSubtitle 最好能帶出現況核心、隱藏阻力、最佳走向這三層結構。",
    "4. questionCore 的第一句就要直接回答使用者最想知道的重點，不能先鋪陳。",
    "4-1. 如果問題屬於『會不會』『能不能』『該不該』這類判斷題，第一句就先給傾向，再補條件與原因。",
    "5. constellationLine 要寫出三張牌如何彼此牽動，形成什麼整體訊號，不能寫成過去、現在、未來。",
    "6. spreadAxis 要說清楚這局牌陣的主軸與真正的矛盾點。",
    "7. cardReadings 三個欄位都必須真的對應各自牌位與正逆位，不可互相重複。",
    "7-1. threshold 只能回答現況核心，mirror 只能回答隱藏阻力，horizon 只能回答最佳走向。",
    "8. progression 要點出事情現在正往哪裡發展。",
    "9. nearTermTrend 要聚焦未來一到四週，不要模糊拖長。",
    "10. concreteGuidance 必須給三條可執行、可落地的建議，每條都要明確。",
    "11. closingReminder 要收束整體方向，像一位有經驗的塔羅師留下的最後提醒。",
    "12. 不要使用『整體而言』『從牌面上看』『宇宙要你』這類生硬模板語。",
    "13. 你的輸出內容必須完整包在 <reading>...</reading> 裡。",
  ].join("\n");

  return {
    system: `${system}\n\n${buildReadingQualityChecklist(args.cards)}`,
    user,
  };
}

function buildReadingRepairPrompt(args: {
  question: string;
  category: TarotCategoryId;
  cards: SelectedTarotCard[];
  rawText: string;
  issueCodes: AiQualityIssueCode[];
}) {
  const categoryMeta = getCategoryDisplayMeta(args.category);
  const cardsContext = buildCardsContext(args.cards);
  const spreadGuardrails = buildDirectAnswerSpreadGuardrails(args.cards);

  const system = [
    "你是塔羅解讀內容總編輯。",
    "你的任務是把一段格式混亂或語氣不佳的塔羅草稿，修復成有效的 reading 標籤結構。",
    "只能使用繁體中文，不能輸出任何標籤結構以外的內容。",
    "要保留塔羅解讀的判斷感與人味，並且先回答問題，再說明原因。",
  ].join(" ");

  const user = [
    `問題：${args.question.trim()}`,
    `主題：${categoryMeta.labelZh}｜${categoryMeta.descriptionZh}`,
    "",
    "牌陣規則：",
    spreadGuardrails,
    "",
    "三張牌資料：",
    cardsContext,
    "",
    "以下是待修復草稿：",
    args.rawText,
    "",
    "請修復成以下標籤結構：",
    "<reading>",
    "<reportTitle>...</reportTitle>",
    "<reportSubtitle>...</reportSubtitle>",
    "<questionCore>...</questionCore>",
    "<constellationLine>...</constellationLine>",
    "<spreadAxis>...</spreadAxis>",
    "<cardReadings>",
    "<threshold>...</threshold>",
    "<mirror>...</mirror>",
    "<horizon>...</horizon>",
    "</cardReadings>",
    "<progression>...</progression>",
    "<nearTermTrend>...</nearTermTrend>",
    "<concreteGuidance>",
    "<item>...</item>",
    "<item>...</item>",
    "<item>...</item>",
    "</concreteGuidance>",
    "<closingReminder>...</closingReminder>",
    "</reading>",
  ].join("\n");

  const repairFocus = buildQualityRepairFocus(args.issueCodes);

  return {
    system: `${system}\n\n${buildReadingQualityChecklist(args.cards)}`,
    user: repairFocus ? `${user}\n\n${repairFocus}` : user,
  };
}

function buildFollowupPrompt(args: {
  question: string;
  category: TarotCategoryId;
  cards: SelectedTarotCard[];
  reading: StructuredTarotReading;
  followupPrompt: string;
}) {
  const categoryMeta = getCategoryDisplayMeta(args.category);
  const cardsContext = buildCardsContext(args.cards);
  const spreadGuardrails = buildDirectAnswerSpreadGuardrails(args.cards);

  const system = [
    "你是延續同一局解讀的塔羅師，只能使用繁體中文回答。",
    "你必須根據主解讀、三張牌的牌位與正逆位、以及使用者的追問來作答。",
    "回答的前兩句就要直面追問，不可繞圈或先講一堆空話。",
    "如果問題本身帶有是非、取捨或方向判斷，要先給明確傾向，再補上條件與原因。",
    "不要自稱 AI，不要用模板句，不要寫成教科書，也不要脫離牌面自由發揮。",
    "不要輸出 markdown、條列符號過多、code fence 或簡體中文。",
  ].join(" ");

  const user = [
    `原始問題：${args.question.trim()}`,
    `主題：${categoryMeta.labelZh}｜${categoryMeta.descriptionZh}`,
    "",
    "牌陣規則：",
    spreadGuardrails,
    "",
    "三張牌資料：",
    cardsContext,
    "",
    "主解讀摘要：",
    `標題：${args.reading.reportTitle}`,
    `核心答案：${args.reading.questionCore}`,
    `牌陣主軸：${args.reading.spreadAxis}`,
    `發展方向：${args.reading.progression}`,
    `近況趨勢：${args.reading.nearTermTrend}`,
    `建議：${args.reading.concreteGuidance.join("；")}`,
    "",
    `使用者追問：${args.followupPrompt.trim()}`,
    "",
    "回答要求：",
    "1. 直接回答追問，不要先講虛詞。",
    "1-1. 如果追問本身是在問可不可以、該不該、會不會，第一句就先給清楚傾向。",
    "2. 要讓人讀起來像資深塔羅師在當面說話，而不是 AI 模板。",
    "3. 必須延續這一局牌，不可重開新題。",
    "3-1. 不可把這一局改寫成過去／現在／未來的時間線。",
    "4. 長度控制在 2 到 4 段，清楚但不要冗長。",
    "5. 如果需要提醒風險，要說出原因與條件，不要只丟模糊警告。",
  ].join("\n");

  return {
    system: `${system}\n\n${buildFollowupQualityChecklist(args.cards)}`,
    user,
  };
}

function buildFollowupRepairPrompt(args: {
  question: string;
  category: TarotCategoryId;
  cards: SelectedTarotCard[];
  reading: StructuredTarotReading;
  followupPrompt: string;
  rawAnswer: string;
  issueCodes: AiQualityIssueCode[];
}) {
  const categoryMeta = getCategoryDisplayMeta(args.category);
  const cardsContext = buildCardsContext(args.cards);
  const spreadGuardrails = buildDirectAnswerSpreadGuardrails(args.cards);

  const system = [
    "你是塔羅追問回答的文字編修者。",
    "請把一段不夠自然、格式混亂或不夠直接的追問答案，重寫成自然的繁體中文。",
    "回答要像真人塔羅師，直面問題、說清楚、延續同一局牌。",
    "不要輸出 markdown、不要自稱 AI、不要加入 JSON。",
  ].join(" ");

  const user = [
    `原始問題：${args.question.trim()}`,
    `主題：${categoryMeta.labelZh}｜${categoryMeta.descriptionZh}`,
    `追問：${args.followupPrompt.trim()}`,
    "",
    "牌陣規則：",
    spreadGuardrails,
    "",
    "三張牌資料：",
    cardsContext,
    "",
    "主解讀摘要：",
    `核心答案：${args.reading.questionCore}`,
    `牌陣主軸：${args.reading.spreadAxis}`,
    `發展方向：${args.reading.progression}`,
    `近況趨勢：${args.reading.nearTermTrend}`,
    "",
    "待重寫草稿：",
    args.rawAnswer,
    "",
    "請重寫成 2 到 4 段繁體中文，前兩句就先回答追問，之後再補充牌義與建議。",
  ].join("\n");

  const repairFocus = buildQualityRepairFocus(args.issueCodes);

  return {
    system: `${system}\n\n${buildFollowupQualityChecklist(args.cards)}`,
    user: repairFocus ? `${user}\n\n${repairFocus}` : user,
  };
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

function extractTagValue(raw: string, tag: string) {
  const match = raw.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i"));

  return match?.[1]?.trim() ?? null;
}

function extractTagValues(raw: string, tag: string) {
  return [...raw.matchAll(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "gi"))]
    .map((match) => match[1]?.trim() ?? "")
    .filter(Boolean);
}

function tryParseTaggedReading(raw: string) {
  const direct = raw.trim();
  const fenced =
    direct.match(/```xml\s*([\s\S]*?)```/i) ??
    direct.match(/```html\s*([\s\S]*?)```/i) ??
    direct.match(/```\s*([\s\S]*?)```/i);
  const candidates = [direct, fenced?.[1]?.trim()].filter(
    (candidate): candidate is string => Boolean(candidate),
  );

  for (const candidate of candidates) {
    const root = extractTagValue(candidate, "reading") ?? candidate;
    const cardReadingsBlock = extractTagValue(root, "cardReadings") ?? "";
    const guidanceBlock = extractTagValue(root, "concreteGuidance") ?? "";
    const parsed = {
      reportTitle: extractTagValue(root, "reportTitle") ?? undefined,
      reportSubtitle: extractTagValue(root, "reportSubtitle") ?? undefined,
      questionCore: extractTagValue(root, "questionCore") ?? undefined,
      constellationLine: extractTagValue(root, "constellationLine") ?? undefined,
      spreadAxis: extractTagValue(root, "spreadAxis") ?? undefined,
      cardReadings: {
        threshold: extractTagValue(cardReadingsBlock, "threshold") ?? undefined,
        mirror: extractTagValue(cardReadingsBlock, "mirror") ?? undefined,
        horizon: extractTagValue(cardReadingsBlock, "horizon") ?? undefined,
      },
      progression: extractTagValue(root, "progression") ?? undefined,
      nearTermTrend: extractTagValue(root, "nearTermTrend") ?? undefined,
      concreteGuidance: extractTagValues(guidanceBlock, "item"),
      closingReminder: extractTagValue(root, "closingReminder") ?? undefined,
    } as Partial<StructuredTarotReading>;

    const hasMinimumContent = Boolean(
      parsed.reportTitle ||
        parsed.questionCore ||
        parsed.spreadAxis ||
        parsed.cardReadings?.threshold ||
        parsed.cardReadings?.mirror ||
        parsed.cardReadings?.horizon,
    );

    if (hasMinimumContent) {
      return parsed;
    }
  }

  return null;
}

function extractStructuredReadingObject(raw: string) {
  try {
    return extractJsonObject(raw);
  } catch (jsonError) {
    const tagged = tryParseTaggedReading(raw);

    if (tagged) {
      return tagged;
    }

    throw new Error(
      jsonError instanceof Error
        ? jsonError.message
        : "MiniMax returned a response that could not be parsed as structured reading content.",
    );
  }
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

async function requestMiniMaxText(args: RequestMiniMaxTextArgs) {
  const apiKey = process.env.MINIMAX_API_KEY;

  if (!apiKey) {
    throw new Error(args.unavailableMessage);
  }

  let response: Response | null = null;
  let payload: MiniMaxMessageResponse | null = null;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      response = await fetch(`${minimaxAnthropicBaseUrl}/v1/messages`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": anthropicVersion,
        },
        body: JSON.stringify({
          model: minimaxModel,
          max_tokens: args.maxTokens,
          temperature: args.temperature ?? 0.28,
          top_p: args.topP ?? 0.88,
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

      payload = (await response.json().catch(() => null)) as MiniMaxMessageResponse | null;

      if (
        response.ok ||
        ![408, 429, 500, 502, 503, 504].includes(response.status) ||
        attempt === 2
      ) {
        break;
      }
    } catch (error) {
      lastError =
        error instanceof Error ? error : new Error("unknown_fetch_error");

      if (attempt === 2) {
        throw lastError;
      }
    }

    await delay(1200 * (attempt + 1));
  }

  if (!response) {
    throw lastError ?? new Error(args.failureMessage);
  }

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

async function repairStructuredReading(args: {
  question: string;
  category: TarotCategoryId;
  cards: SelectedTarotCard[];
  rawText: string;
  issueCodes: AiQualityIssueCode[];
}) {
  const { system, user } = buildReadingRepairPrompt(args);
  const response = await requestMiniMaxText({
    system,
    user,
    unavailableMessage: readingUnavailableMessage,
    failureMessage: readingFailureMessage,
    maxTokens: 1400,
    temperature: 0.12,
    topP: 0.8,
  });

  return {
    model: response.model,
    parsed: extractStructuredReadingObject(response.text),
    text: response.text,
  };
}

async function repairFollowupAnswer(args: {
  question: string;
  category: TarotCategoryId;
  cards: SelectedTarotCard[];
  reading: StructuredTarotReading;
  followupPrompt: string;
  rawAnswer: string;
  issueCodes: AiQualityIssueCode[];
}) {
  const { system, user } = buildFollowupRepairPrompt(args);
  const response = await requestMiniMaxText({
    system,
    user,
    unavailableMessage: followupUnavailableMessage,
    failureMessage: followupFailureMessage,
    maxTokens: 900,
    temperature: 0.18,
    topP: 0.82,
  });

  return {
    model: response.model,
    text: normalizeAnswerTextV2(response.text),
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
    temperature: 0.18,
    topP: 0.82,
  });
  const fallbackBase = normalizeStructuredTarotReading(
    null,
    args.cards,
    args.question,
    args.category,
  );

  let parsed: Record<string, unknown> | null = null;
  let usedRepair = false;
  let repairedLength: number | null = null;
  let qualityResult: AiQualityResult | null = null;
  let repairIssueCodes: AiQualityIssueCode[] = [];

  try {
    parsed = extractStructuredReadingObject(response.text);
  } catch {
    repairIssueCodes = ["format_invalid"];
    logAiEvent(
      "reading.parse.repair_attempt",
      {
        rawLength: response.text.length,
        reason: "structured_parse_failed",
        qualityIssueCodes: repairIssueCodes,
      },
      "warn",
    );
  }

  if (parsed) {
    parsed = mergeStructuredReadingCandidate(
      parsed as Partial<StructuredTarotReading>,
      fallbackBase,
    ) as Record<string, unknown>;
    qualityResult = evaluateStructuredReadingQuality({
      value: parsed as Partial<StructuredTarotReading>,
      question: args.question,
      cards: args.cards,
    });
  }

  if (
    !parsed ||
    shouldRepairStructuredReading({
      value: parsed as Partial<StructuredTarotReading> | null,
      question: args.question,
      cards: args.cards,
    })
  ) {
    usedRepair = true;
    repairIssueCodes =
      repairIssueCodes.length > 0
        ? repairIssueCodes
        : qualityResult?.issueCodes ?? ["not_traditional_chinese"];

    if (parsed && qualityResult && !qualityResult.passed) {
      logAiEvent(
        "reading.quality.repair_attempt",
        {
          rawLength: response.text.length,
          qualityScore: qualityResult.score,
          qualityIssueCodes: repairIssueCodes,
        },
        "warn",
      );
    }

    try {
      const previousParsed = parsed;
      const previousQuality = qualityResult;
      const repaired = await repairStructuredReading({
        question: args.question,
        category: args.category,
        cards: args.cards,
        rawText: response.text,
        issueCodes: repairIssueCodes,
      });

      parsed = mergeStructuredReadingCandidate(
        repaired.parsed as Partial<StructuredTarotReading>,
        fallbackBase,
      ) as Record<string, unknown>;
      repairedLength = repaired.text.length;
      qualityResult = evaluateStructuredReadingQuality({
        value: parsed as Partial<StructuredTarotReading>,
        question: args.question,
        cards: args.cards,
      });

      logAiEvent("reading.parse.repair_applied", {
        rawLength: response.text.length,
        repairedLength,
        qualityScore: qualityResult.score,
        qualityIssueCodes: qualityResult.issueCodes,
      });

      if (
        previousParsed &&
        previousQuality &&
        qualityResult.score < previousQuality.score
      ) {
        parsed = previousParsed;
        qualityResult = previousQuality;
      }

      if (qualityResult && hasQualityErrors(qualityResult)) {
        logAiEvent(
          "reading.parse.fallback_defaults",
          {
            rawLength: response.text.length,
            reason: "quality_gate_failed_after_repair",
            qualityScore: qualityResult.score,
            qualityIssueCodes: qualityResult.issueCodes,
          },
          "warn",
        );
      }
    } catch (error) {
      logAiEvent(
        "reading.parse.fallback_defaults",
        {
          rawLength: response.text.length,
          qualityIssueCodes: repairIssueCodes,
          error:
            error instanceof Error ? error.message : "unknown_repair_error",
        },
        "warn",
      );
    }
  }

  const structured = normalizeStructuredTarotReading(
    parsed,
    args.cards,
    args.question,
    args.category,
  );
  const finalQuality = evaluateStructuredReadingQuality({
    value: structured,
    question: args.question,
    cards: args.cards,
  });

  return {
    reading: structured as StructuredTarotReading,
    model: response.model,
    meta: {
      usedRepair,
      usedFallback: parsed === null,
      rawLength: response.text.length,
      repairedLength,
      qualityScore: finalQuality.score,
      qualityIssueCodes: finalQuality.issueCodes,
    } satisfies MiniMaxGenerationMeta,
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
    temperature: 0.24,
    topP: 0.85,
  });

  let answer = normalizeAnswerTextV2(response.text);
  let usedRepair = false;
  let repairedLength: number | null = null;
  let qualityResult = evaluateFollowupAnswerQuality({
    answer,
    question: args.question,
    followupPrompt: args.followupPrompt,
    cards: args.cards,
  });

  if (
    shouldRepairFollowupAnswer({
      answer,
      question: args.question,
      followupPrompt: args.followupPrompt,
      cards: args.cards,
    })
  ) {
    usedRepair = true;
    logAiEvent(
      "followup.answer.repair_attempt",
      {
        rawLength: answer.length,
        reason: "quality_gate_failed",
        qualityScore: qualityResult.score,
        qualityIssueCodes: qualityResult.issueCodes,
      },
      "warn",
    );

    try {
      const repaired = await repairFollowupAnswer({
        question: args.question,
        category: args.category,
        cards: args.cards,
        reading: args.reading,
        followupPrompt: args.followupPrompt,
        rawAnswer: answer,
        issueCodes: qualityResult.issueCodes,
      });

      answer = repaired.text;
      repairedLength = repaired.text.length;
      qualityResult = evaluateFollowupAnswerQuality({
        answer,
        question: args.question,
        followupPrompt: args.followupPrompt,
        cards: args.cards,
      });

      logAiEvent("followup.answer.repair_applied", {
        rawLength: response.text.length,
        repairedLength,
        qualityScore: qualityResult.score,
        qualityIssueCodes: qualityResult.issueCodes,
      });
    } catch (error) {
      logAiEvent(
        "followup.answer.repair_failed",
        {
          rawLength: response.text.length,
          qualityIssueCodes: qualityResult.issueCodes,
          error:
            error instanceof Error ? error.message : "unknown_repair_error",
        },
        "warn",
      );
    }
  }

  if (!qualityResult.passed) {
    logAiEvent(
      "followup.answer.quality_rejected",
      {
        rawLength: answer.length,
        qualityScore: qualityResult.score,
        qualityIssueCodes: qualityResult.issueCodes,
      },
      "warn",
    );
    throw new Error(followupFailureMessage);
  }

  return {
    answer,
    model: response.model,
    meta: {
      usedRepair,
      usedFallback: false,
      rawLength: response.text.length,
      repairedLength,
      qualityScore: qualityResult.score,
      qualityIssueCodes: qualityResult.issueCodes,
    } satisfies MiniMaxGenerationMeta,
  };
}
