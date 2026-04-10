import "dotenv/config";
import path from "node:path";
import createJiti from "jiti";

const workspaceRoot = process.cwd();
const scriptPath = path.join(
  workspaceRoot,
  "scripts",
  "validate-history-flow.mjs",
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

const { prisma } = loadWorkspaceModule("src", "lib", "prisma.ts");
const { tarotDeck, buildSelectedCard } = loadWorkspaceModule(
  "src",
  "lib",
  "mock-tarot-data.ts",
);
const {
  createTarotSession,
  normalizeTarotDraft,
  serializeTarotCards,
} = loadWorkspaceModule("src", "lib", "tarot-session.ts");
const {
  serializeStructuredTarotReading,
} = loadWorkspaceModule("src", "lib", "reading-record.ts");
const { getViewerHistoryDetail, getViewerHistoryList } = loadWorkspaceModule(
  "src",
  "lib",
  "history-records.ts",
);
const { followupCostPoints, readingCostPoints } = loadWorkspaceModule(
  "src",
  "lib",
  "points.ts",
);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function pickCards(cardIds) {
  return cardIds.map((cardId, slot) => {
    const card = tarotDeck.find((entry) => entry.id === cardId);

    if (!card) {
      throw new Error(`找不到測試卡牌：${cardId}`);
    }

    return buildSelectedCard(card, slot);
  });
}

function buildReadingFixture(question) {
  return {
    reportTitle: "三張牌主線驗收",
    reportSubtitle: "這份測試解讀用來驗證主解讀、追問與歷史紀錄是否保持同一條線。",
    questionCore:
      "現在先不要急著往前衝。這組三張牌的答案不是單純叫你停下，而是要你先把方向與節奏整理清楚，再決定怎麼行動。",
    constellationLine:
      "現況核心先收斂注意力，隱藏阻力揭開真正卡點，最佳走向則提醒你把力量用在對的時機，而不是更快地出手。",
    spreadAxis:
      "這副直答三張牌的主軸不是要你猜結果，而是看清楚「現在最重要的是什麼、真正卡住的是什麼、接下來該怎麼走」。",
    cardReadings: {
      threshold:
        "現況核心指出你眼前最需要先處理的是判斷與節奏，不要讓焦慮把你推向過早行動。",
      mirror:
        "隱藏阻力其實來自你心裡那個還沒說清楚的擔心，它讓你表面上想推進，實際上卻一直反覆猶豫。",
      horizon:
        "最佳走向不是更快，而是更準。當你把目標和條件講清楚之後，下一步自然會更有力量。",
    },
    progression:
      "接下來的局勢會先要求你收斂，再要求你表態。只要前面這一步做對，後面的推進會比現在順很多。",
    nearTermTrend:
      "未來一到四週最值得注意的，不是外部有沒有立刻回應，而是你能不能把自己真正要說的話整理完整。",
    concreteGuidance: [
      "今天先把你最在意的結果寫成一句話，確認自己到底要的是合作、回應，還是只是安心。",
      "把你準備說出口的第一句話大聲念一遍，刪掉所有模糊、繞路或過度解釋的地方。",
      "替自己設一個最晚決定點，到那個時間就依照現在整理出的方向往前走，不再反覆重想。",
    ],
    closingReminder:
      "真正能讓這份解讀落地的，不是更多猜測，而是把問題、阻力與下一步重新對齊。",
    question,
  };
}

function buildSessionRecordData({ userId, question, category, saveToHistory, cards }) {
  const session = createTarotSession(
    normalizeTarotDraft({
      question,
      category,
      saveToHistory,
    }),
    userId,
  );

  return {
    id: session.sessionId,
    ownerId: userId,
    currentStep: "reading",
    question: session.question,
    category: session.category,
    saveToHistory,
    spreadCardsJson: serializeTarotCards(session.spreadCards),
    selectedCardsJson: serializeTarotCards(cards),
    revealed: cards.length,
    ritualStartedAt: new Date(),
  };
}

let cleanupUserId = null;

try {
  const user = await prisma.user.create({
    data: {
      email: `history-qa-${Date.now()}-${crypto.randomUUID()}@local.test`,
      name: "History QA",
    },
  });
  cleanupUserId = user.id;

  const visibleQuestion = "我應不應該在這個月主動提出合作邀請？";
  const hiddenQuestion = "這筆不保存的測試紀錄不應該出現在歷史列表。";
  const visibleCards = pickCards([
    "the-hermit",
    "eight-of-swords",
    "ace-of-wands",
  ]);
  const hiddenCards = pickCards([
    "justice",
    "two-of-swords",
    "the-chariot",
  ]);
  const visibleSession = await prisma.tarotSession.create({
    data: buildSessionRecordData({
      userId: user.id,
      question: visibleQuestion,
      category: "career",
      saveToHistory: true,
      cards: visibleCards,
    }),
  });
  const hiddenSession = await prisma.tarotSession.create({
    data: buildSessionRecordData({
      userId: user.id,
      question: hiddenQuestion,
      category: "decision",
      saveToHistory: false,
      cards: hiddenCards,
    }),
  });

  const readingFixture = buildReadingFixture(visibleQuestion);
  const hiddenFixture = buildReadingFixture(hiddenQuestion);
  const visibleReading = await prisma.readingRecord.create({
    data: {
      sessionId: visibleSession.id,
      userId: user.id,
      question: visibleQuestion,
      category: "career",
      cardsSnapshot: serializeTarotCards(visibleCards),
      fullReading: serializeStructuredTarotReading(readingFixture),
      source: "minimax",
      model: "MiniMax-M2.5",
      status: "ready",
      errorMessage: null,
      costPoints: readingCostPoints,
    },
  });
  const hiddenReading = await prisma.readingRecord.create({
    data: {
      sessionId: hiddenSession.id,
      userId: user.id,
      question: hiddenQuestion,
      category: "decision",
      cardsSnapshot: serializeTarotCards(hiddenCards),
      fullReading: serializeStructuredTarotReading(hiddenFixture),
      source: "minimax",
      model: "MiniMax-M2.5",
      status: "ready",
      errorMessage: null,
      costPoints: readingCostPoints,
    },
  });

  const followupPrompt = "如果我真的要主動提出合作邀請，第一句最適合怎麼說？";
  const followupAnswer =
    "先用一句已經整理過的價值說明開頭，不要把第一句講成試探。你真正要讓對方感受到的，是你知道自己為什麼現在要開口。";

  await prisma.followupRecord.create({
    data: {
      readingRecordId: visibleReading.id,
      userId: user.id,
      prompt: followupPrompt,
      answer: followupAnswer,
      status: "ready",
      source: "minimax",
      model: "MiniMax-M2.5",
      requestKey: `history-qa-followup:${crypto.randomUUID()}`,
      costPoints: followupCostPoints,
      errorMessage: null,
    },
  });

  const historyList = await getViewerHistoryList(user.id);
  assert(historyList.length === 1, `預期 history list 只有 1 筆，實際為 ${historyList.length}`);

  const [listItem] = historyList;
  assert(listItem.id === visibleReading.id, "history list 沒有回傳保存中的那筆主解讀");
  assert(listItem.question === visibleQuestion, "history list 問題文字不一致");
  assert(listItem.cardsSummary.length === 3, "history list 不是三張牌摘要");
  assert(listItem.followupCount === 1, "history list 追問數量不正確");
  assert(listItem.hasFollowup === true, "history list 沒有正確標示追問存在");
  assert(!listItem.categoryLabel.includes(" / "), "history list 類別標籤不應該再混入英文");
  assert(
    listItem.cardsSummary.every(
      (card) => !card.name.includes(" / ") && !card.orientation.includes(" / "),
    ),
    "history list 卡牌摘要應該只保留繁中顯示",
  );
  assert(
    listItem.totalSpentPoints === readingCostPoints + followupCostPoints,
    "history list 點數統計不一致",
  );
  assert(
    listItem.reportTitle === readingFixture.reportTitle,
    "history list 沒有帶出主解讀標題",
  );
  assert(
    !historyList.some((item) => item.id === hiddenReading.id),
    "saveToHistory=false 的紀錄不應該出現在 history list",
  );

  const historyDetail = await getViewerHistoryDetail(user.id, visibleReading.id);
  assert(historyDetail, "history detail 應該能打開已保存的主解讀");
  assert(historyDetail.reading.id === visibleReading.id, "history detail 主解讀 id 不一致");
  assert(historyDetail.followups.length === 1, "history detail 追問數量不正確");
  assert(
    historyDetail.reading.fullReading?.reportTitle === readingFixture.reportTitle,
    "history detail 主解讀標題不一致",
  );
  assert(
    !historyDetail.categoryLabel.includes(" / ") &&
      !historyDetail.categoryDescription.includes(" / "),
    "history detail 類別資訊不應該再混入英文",
  );
  assert(
    historyDetail.readingSections.length >= 7,
    `history detail 段落數量過少：${historyDetail.readingSections.length}`,
  );
  assert(
    historyDetail.readingSections[0]?.body === readingFixture.questionCore,
    "history detail 第一段沒有對應問題核心",
  );
  assert(
    historyDetail.followups[0]?.prompt === followupPrompt,
    "history detail 追問 prompt 不一致",
  );
  assert(
    historyDetail.followups[0]?.answer === followupAnswer,
    "history detail 追問 answer 不一致",
  );
  assert(
    historyDetail.followupSpentPoints === followupCostPoints,
    "history detail 追問點數統計不一致",
  );
  assert(
    historyDetail.totalSpentPoints === readingCostPoints + followupCostPoints,
    "history detail 總點數統計不一致",
  );

  const hiddenDetail = await getViewerHistoryDetail(user.id, hiddenReading.id);
  assert(hiddenDetail === null, "saveToHistory=false 的紀錄不應該能打開 history detail");

  console.log("History flow validation passed.");
  console.log(`- list count: ${historyList.length}`);
  console.log(`- reading id: ${listItem.id}`);
  console.log(`- reading sections: ${historyDetail.readingSections.length}`);
  console.log(`- followups: ${historyDetail.followups.length}`);
  console.log(`- total spent points: ${historyDetail.totalSpentPoints}`);
} finally {
  if (cleanupUserId) {
    await prisma.user.delete({ where: { id: cleanupUserId } }).catch(() => null);
  }

  await prisma.$disconnect();
}
