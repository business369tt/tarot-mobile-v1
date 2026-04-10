import "dotenv/config";
import path from "node:path";
import createJiti from "jiti";

const workspaceRoot = process.cwd();
const scriptPath = path.join(
  workspaceRoot,
  "scripts",
  "validate-three-card-reading.mjs",
);
const srcRoot = path.join(workspaceRoot, "src");
const jiti = createJiti(scriptPath, {
  interopDefault: true,
  alias: {
    "@": srcRoot,
    "@/": `${srcRoot}${path.sep}`,
  },
});

function loadWorkspaceModule(...segments) {
  return jiti(path.join(workspaceRoot, ...segments));
}

const {
  tarotDeck,
  tarotCategories,
  buildSelectedCard,
  getCardDisplayMeta,
  getCardRoleDisplayMeta,
  getOrientationDisplayMeta,
} = loadWorkspaceModule("src", "lib", "mock-tarot-data.ts");
const {
  generateTarotFollowupWithMiniMax,
  generateTarotReadingWithMiniMax,
} = loadWorkspaceModule("src", "lib", "minimax-reading.ts");
const {
  buildReadingSections,
  normalizeStructuredTarotReading,
} = loadWorkspaceModule("src", "lib", "reading-record.ts");

const presetCases = [
  {
    id: "career-collab",
    label: "事業合作邀請",
    question: "我應不應該在這個月主動提出合作邀請？",
    category: "career",
    cardIds: ["the-hermit", "eight-of-swords", "ace-of-wands"],
    followupPrompt: "如果我真的主動提出合作邀請，第一句最適合怎麼說？",
  },
  {
    id: "love-reconnect",
    label: "感情重新聯絡",
    question: "我現在主動重新聯絡這個人，對關係會有幫助嗎？",
    category: "love",
    cardIds: ["two-of-cups", "four-of-cups", "judgement"],
    followupPrompt: "如果要重新開口，我最需要避免哪一種說法？",
  },
  {
    id: "self-burnout",
    label: "自我狀態調整",
    question: "我最近一直很焦慮，我現在最需要先調整的是什麼？",
    category: "self",
    cardIds: ["the-star", "nine-of-swords", "strength"],
    followupPrompt: "如果只能先做一件最小的調整，應該先從哪裡開始？",
  },
  {
    id: "decision-offer",
    label: "抉擇是否接受",
    question: "我應該接受眼前這個新機會，還是再多觀望一下？",
    category: "decision",
    cardIds: ["justice", "two-of-swords", "the-chariot"],
    followupPrompt: "如果我選擇先觀望，最晚應該在什麼訊號出現前做決定？",
  },
  {
    id: "timing-next-step",
    label: "時機與節奏",
    question: "這件事接下來一個月內適合推進，還是先等節奏成熟？",
    category: "timing",
    cardIds: ["wheel-of-fortune", "seven-of-pentacles", "knight-of-wands"],
    followupPrompt: "如果現在不是最佳時機，我應該用什麼方式先布局？",
  },
];

const defaultPresetId = "career-collab";
const presetMap = new Map(presetCases.map((item) => [item.id, item]));
const supportedCategories = new Set(tarotCategories.map((item) => item.id));
const defaultGateConfig = {
  requireLive: false,
  minReadingScore: 90,
  minFollowupScore: 88,
  failOnIssues: false,
  json: false,
};

function parseCliArgs(argv) {
  const parsed = {};

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];

    if (!current.startsWith("--")) {
      continue;
    }

    const eqIndex = current.indexOf("=");

    if (eqIndex >= 0) {
      parsed[current.slice(2, eqIndex)] = current.slice(eqIndex + 1);
      continue;
    }

    const key = current.slice(2);
    const next = argv[index + 1];

    if (!next || next.startsWith("--")) {
      parsed[key] = "true";
      continue;
    }

    parsed[key] = next;
    index += 1;
  }

  return parsed;
}

function splitCardIds(value) {
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function printDivider(title) {
  console.log(`\n=== ${title} ===`);
}

function printPresetList() {
  printDivider("可用案例");

  for (const preset of presetCases) {
    console.log(
      `- ${preset.id}: ${preset.label} / ${preset.category} / ${preset.cardIds.join(", ")}`,
    );
  }
}

function validateConfig(config) {
  if (!config.question) {
    throw new Error("請提供非空白的 --question。");
  }

  if (!supportedCategories.has(config.category)) {
    throw new Error(
      `不支援的 --category: ${config.category}。可用值：${[
        ...supportedCategories,
      ].join(", ")}`,
    );
  }

  if (config.cardIds.length !== 3) {
    throw new Error(
      `直答三張牌驗證需要剛好 3 張牌，目前收到 ${config.cardIds.length} 張。`,
    );
  }

  return config;
}

function parseScoreArg(value, flagName, fallbackValue) {
  if (value === undefined) {
    return fallbackValue;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
    throw new Error(`${flagName} 必須是 0 到 100 之間的數字。`);
  }

  return parsed;
}

function resolveGateConfig(args) {
  return {
    requireLive: args["require-live"] === "true",
    minReadingScore: parseScoreArg(
      args["min-reading-score"],
      "--min-reading-score",
      defaultGateConfig.minReadingScore,
    ),
    minFollowupScore: parseScoreArg(
      args["min-followup-score"],
      "--min-followup-score",
      defaultGateConfig.minFollowupScore,
    ),
    failOnIssues: args["fail-on-issues"] === "true",
    json: args.json === "true",
  };
}

function buildConfigFromArgs(args) {
  const basePreset = presetMap.get(String(args.preset ?? defaultPresetId));

  if (!basePreset) {
    throw new Error(
      `找不到 --preset=${String(args.preset)}。可用 preset: ${presetCases
        .map((item) => item.id)
        .join(", ")}`,
    );
  }

  const followupPrompt =
    args["no-followup"] === "true"
      ? ""
      : typeof args.followup === "string"
        ? args.followup.trim()
        : basePreset.followupPrompt;

  return validateConfig({
    id: basePreset.id,
    label: basePreset.label,
    question: String(args.question ?? basePreset.question).trim(),
    category: String(args.category ?? basePreset.category).trim(),
    cardIds: splitCardIds(args.cards ?? basePreset.cardIds.join(",")),
    followupPrompt,
  });
}

function resolveConfigs(args) {
  if (args.suite === "true") {
    return presetCases.map((preset) => validateConfig({ ...preset }));
  }

  return [buildConfigFromArgs(args)];
}

function pickCards(cardIds) {
  return cardIds.map((cardId, index) => {
    const card = tarotDeck.find((item) => item.id === cardId);

    if (!card) {
      throw new Error(`在 tarotDeck 找不到卡牌 id: ${cardId}`);
    }

    return buildSelectedCard(card, index);
  });
}

function printRunConfig(config) {
  console.log(`案例：${config.id} / ${config.label}`);
  console.log(`問題：${config.question}`);
  console.log(`分類：${config.category}`);
  console.log(`卡牌：${config.cardIds.join(", ")}`);

  if (config.followupPrompt) {
    console.log(`追問：${config.followupPrompt}`);
  } else {
    console.log("追問：已停用");
  }
}

function printCardSummary(cards) {
  printDivider("牌陣");

  for (const card of cards) {
    const display = getCardDisplayMeta(card.id);
    const role = getCardRoleDisplayMeta(card.role);
    const orientation = getOrientationDisplayMeta(card.orientation);

    console.log(`- ${role.labelZh}: ${display.nameZh}（${orientation.zh}）`);
  }
}

function printGenerationMeta(label, meta) {
  printDivider(`${label} 品質資訊`);
  console.log(`修復流程：${meta.usedRepair ? "有" : "無"}`);
  console.log(`後備結果：${meta.usedFallback ? "有" : "無"}`);
  console.log(`原始長度：${meta.rawLength}`);
  console.log(`修復長度：${meta.repairedLength ?? "無"}`);
  console.log(`品質分數：${meta.qualityScore}`);
  console.log(
    `品質警示：${
      meta.qualityIssueCodes.length > 0
        ? meta.qualityIssueCodes.join(", ")
        : "無"
    }`,
  );
}

function printReadingSummary(config, cards, reading, sourceLabel) {
  const mockRecord = {
    id: "validation-reading",
    sessionId: "validation-session",
    userId: "validation-user",
    question: config.question,
    category: config.category,
    cardsSnapshot: cards,
    fullReading: reading,
    source: "minimax",
    model: sourceLabel,
    status: "ready",
    errorMessage: null,
    costPoints: 0,
    chargeRequestKey: null,
    chargeTransactionId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const sections = buildReadingSections(mockRecord);

  printDivider(`主解讀：${sourceLabel}`);
  console.log(`標題：${reading.reportTitle}`);
  console.log(`副標：${reading.reportSubtitle}`);
  console.log(`核心回答：${reading.questionCore}`);
  console.log("行動建議：");
  for (const item of reading.concreteGuidance) {
    console.log(`- ${item}`);
  }
  console.log("段落結構：");
  for (const section of sections) {
    console.log(`- ${section.eyebrow} ${section.title}`);
  }
}

function printFollowupSummary(prompt, answer, sourceLabel) {
  printDivider(`追問回答：${sourceLabel}`);
  console.log(`追問：${prompt}`);
  console.log(`回答：${answer}`);
}

async function runCase(config, apiKey) {
  const cards = pickCards(config.cardIds);

  printDivider(`案例開始：${config.id}`);
  printRunConfig(config);
  printCardSummary(cards);

  if (!apiKey) {
    printDivider("主解讀驗證");
    console.log("尚未設定 MINIMAX_API_KEY，先執行 fallback 結構驗證。");

    const fallbackReading = normalizeStructuredTarotReading(
      null,
      cards,
      config.question,
      config.category,
    );

    printReadingSummary(config, cards, fallbackReading, "fallback-only");

    if (config.followupPrompt) {
      printDivider("追問驗證");
      console.log("尚未設定 MINIMAX_API_KEY，已略過真實追問生成驗證。");
    }

    return {
      id: config.id,
      label: config.label,
      status: "fallback-only",
      readingScore: null,
      followupScore: null,
      readingIssues: [],
      followupIssues: [],
    };
  }

  const readingResult = await generateTarotReadingWithMiniMax({
    question: config.question,
    category: config.category,
    cards,
  });

  printReadingSummary(config, cards, readingResult.reading, readingResult.model);
  printGenerationMeta("主解讀", readingResult.meta);

  let followupScore = null;
  let followupIssues = [];

  if (config.followupPrompt) {
    const followupResult = await generateTarotFollowupWithMiniMax({
      question: config.question,
      category: config.category,
      cards,
      reading: readingResult.reading,
      followupPrompt: config.followupPrompt,
    });

    printFollowupSummary(
      config.followupPrompt,
      followupResult.answer,
      followupResult.model,
    );
    printGenerationMeta("追問", followupResult.meta);
    followupScore = followupResult.meta.qualityScore;
    followupIssues = followupResult.meta.qualityIssueCodes;
  }

  return {
    id: config.id,
    label: config.label,
    status: "live",
    readingScore: readingResult.meta.qualityScore,
    readingIssues: readingResult.meta.qualityIssueCodes,
    followupScore,
    followupIssues,
  };
}

function evaluateGate(result, gateConfig) {
  const reasons = [];

  if (result.status === "error") {
    reasons.push(result.errorMessage ?? "unknown_error");
    return {
      passed: false,
      reasons,
    };
  }

  if (result.status === "fallback-only") {
    if (gateConfig.requireLive) {
      reasons.push("未設定 MINIMAX_API_KEY，未執行真實 MiniMax 驗收。");
    }

    return {
      passed: !gateConfig.requireLive,
      reasons,
    };
  }

  if (
    typeof result.readingScore === "number" &&
    result.readingScore < gateConfig.minReadingScore
  ) {
    reasons.push(
      `主解讀分數 ${result.readingScore} 低於門檻 ${gateConfig.minReadingScore}。`,
    );
  }

  if (
    typeof result.followupScore === "number" &&
    result.followupScore < gateConfig.minFollowupScore
  ) {
    reasons.push(
      `追問分數 ${result.followupScore} 低於門檻 ${gateConfig.minFollowupScore}。`,
    );
  }

  if (gateConfig.failOnIssues && result.readingIssues.length > 0) {
    reasons.push(`主解讀仍有 issue code：${result.readingIssues.join(", ")}。`);
  }

  if (gateConfig.failOnIssues && result.followupIssues.length > 0) {
    reasons.push(`追問仍有 issue code：${result.followupIssues.join(", ")}。`);
  }

  return {
    passed: reasons.length === 0,
    reasons,
  };
}

function printSuiteSummary(results, gateConfig) {
  printDivider("總結");

  for (const result of results) {
    const gate = evaluateGate(result, gateConfig);
    const gateLabel = gate.passed ? "PASS" : "FAIL";

    if (result.status === "error") {
      console.log(`- ${result.id}: ${gateLabel} / error / ${result.errorMessage}`);
      continue;
    }

    if (result.status === "fallback-only") {
      console.log(
        `- ${result.id}: ${gateLabel} / fallback-only / ${
          gate.reasons[0] ?? "未執行真實 MiniMax 驗收"
        }`,
      );
      continue;
    }

    const scoreLine = `主解讀 ${result.readingScore} / 追問 ${
      result.followupScore ?? "未執行"
    }`;
    const reasonLine = gate.reasons.length > 0 ? ` / ${gate.reasons.join(" ")}` : "";

    console.log(`- ${result.id}: ${gateLabel} / live / ${scoreLine}${reasonLine}`);
  }
}

async function main() {
  const args = parseCliArgs(process.argv.slice(2));
  const gateConfig = resolveGateConfig(args);

  if (args["list-presets"] === "true") {
    printPresetList();
    return;
  }

  const configs = resolveConfigs(args);
  const apiKey = process.env.MINIMAX_API_KEY?.trim();
  const results = [];

  for (const config of configs) {
    try {
      results.push(await runCase(config, apiKey));
    } catch (error) {
      results.push({
        id: config.id,
        label: config.label,
        status: "error",
        errorMessage: error instanceof Error ? error.message : "unknown_error",
      });
    }
  }

  if (results.length > 1) {
    printSuiteSummary(results, gateConfig);
  }

  const failed = results.filter(
    (item) => !evaluateGate(item, gateConfig).passed,
  );

  if (gateConfig.json) {
    printDivider("JSON");
    console.log(
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          gateConfig,
          results: results.map((item) => ({
            ...item,
            gate: evaluateGate(item, gateConfig),
          })),
        },
        null,
        2,
      ),
    );
  }

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
