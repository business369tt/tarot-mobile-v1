import "dotenv/config";
import { once } from "node:events";
import { createServer } from "node:net";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import createJiti from "jiti";

const workspaceRoot = process.cwd();
const scriptPath = path.join(workspaceRoot, "scripts", "validate-api-flow.mjs");
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
  currentTarotSessionCookieName,
  normalizeTarotDraft,
  serializeTarotCards,
} = loadWorkspaceModule("src", "lib", "tarot-session.ts");
const {
  createPointsTopUp,
} = loadWorkspaceModule("src", "lib", "points-ledger.ts");
const { getViewerHistoryDetail, getViewerHistoryList } = loadWorkspaceModule(
  "src",
  "lib",
  "history-records.ts",
);
const {
  followupCostPoints,
  readingCostPoints,
} = loadWorkspaceModule("src", "lib", "points.ts");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

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

function parsePositiveInt(value, fallbackValue) {
  if (value === undefined) {
    return fallbackValue;
  }

  const parsed = Number.parseInt(String(value), 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`無效的正整數參數：${value}`);
  }

  return parsed;
}

function formatData(value) {
  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function printDivider(title) {
  console.log(`\n=== ${title} ===`);
}

function pickCards(cardIds) {
  return cardIds.map((cardId, slot) => {
    const card = tarotDeck.find((entry) => entry.id === cardId);

    if (!card) {
      throw new Error(`找不到牌卡：${cardId}`);
    }

    return buildSelectedCard(card, slot);
  });
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

function buildCookieHeader({ sessionToken, tarotSessionId }) {
  return [
    `authjs.session-token=${encodeURIComponent(sessionToken)}`,
    `${currentTarotSessionCookieName}=${encodeURIComponent(tarotSessionId)}`,
  ].join("; ");
}

function createServerLogBuffer(limit = 80) {
  const lines = [];

  return {
    push(chunk) {
      const nextLines = String(chunk)
        .split(/\r?\n/)
        .map((line) => line.trimEnd())
        .filter(Boolean);

      lines.push(...nextLines);

      while (lines.length > limit) {
        lines.shift();
      }
    },
    dump() {
      return lines.join("\n");
    },
  };
}

function startDevServer(port, logBuffer) {
  const command =
    process.platform === "win32"
      ? process.env.ComSpec ?? "cmd.exe"
      : "npm";
  const args =
    process.platform === "win32"
      ? [
          "/d",
          "/s",
          "/c",
          `npm run dev -- --hostname 127.0.0.1 --port ${String(port)}`,
        ]
      : [
          "run",
          "dev",
          "--",
          "--hostname",
          "127.0.0.1",
          "--port",
          String(port),
        ];
  const child = spawn(
    command,
    args,
    {
      cwd: workspaceRoot,
      env: {
        ...process.env,
        NEXT_TELEMETRY_DISABLED: "1",
      },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    },
  );

  child.stdout?.on("data", (chunk) => {
    logBuffer.push(chunk);
  });
  child.stderr?.on("data", (chunk) => {
    logBuffer.push(chunk);
  });

  return child;
}

async function stopWindowsProcessTree(pid) {
  if (!pid) {
    return;
  }

  const command = process.env.ComSpec ?? "cmd.exe";
  const killer = spawn(
    command,
    ["/d", "/s", "/c", `taskkill /PID ${pid} /T /F`],
    {
      stdio: ["ignore", "ignore", "ignore"],
      windowsHide: true,
    },
  );

  await Promise.race([once(killer, "exit"), delay(10_000)]);
}

async function isPortAvailable(port) {
  return new Promise((resolve) => {
    const probe = createServer();

    probe.once("error", () => {
      resolve(false);
    });
    probe.once("listening", () => {
      probe.close(() => resolve(true));
    });
    probe.listen(port, "127.0.0.1");
  });
}

async function findAvailablePort(startPort) {
  for (let offset = 0; offset < 12; offset += 1) {
    const candidate = startPort + offset;

    if (await isPortAvailable(candidate)) {
      return candidate;
    }
  }

  throw new Error(`找不到可用的本地連接埠，起始埠：${startPort}`);
}

async function waitForServerReady(server, port) {
  const url = `http://127.0.0.1:${port}/api/reading/current`;
  let lastError = null;

  for (let attempt = 0; attempt < 90; attempt += 1) {
    if (server.exitCode !== null) {
      throw new Error(`dev server 提前結束，exit code: ${server.exitCode}`);
    }

    try {
      const response = await fetch(url, {
        method: "GET",
        redirect: "manual",
        signal: AbortSignal.timeout(5_000),
      });

      await response.text();
      return;
    } catch (error) {
      lastError = error;
      await delay(1_000);
    }
  }

  throw new Error(
    `dev server 啟動逾時：${lastError instanceof Error ? lastError.message : "unknown_error"}`,
  );
}

async function stopDevServer(server) {
  if (!server || server.exitCode !== null) {
    return;
  }

  if (process.platform === "win32") {
    await stopWindowsProcessTree(server.pid).catch(() => {});
  } else {
    server.kill();
  }

  await Promise.race([once(server, "exit"), delay(5_000)]);

  if (server.exitCode === null) {
    if (process.platform === "win32") {
      await stopWindowsProcessTree(server.pid).catch(() => {});
    } else {
      server.kill("SIGKILL");
    }
    await Promise.race([once(server, "exit"), delay(3_000)]);
  }

  server.stdout?.destroy();
  server.stderr?.destroy();
}

async function apiRequest(port, cookieHeader, pathname, options = {}) {
  const response = await fetch(`http://127.0.0.1:${port}${pathname}`, {
    method: options.method ?? "GET",
    headers: {
      cookie: cookieHeader,
      ...(options.body !== undefined
        ? {
            "content-type": "application/json",
          }
        : {}),
    },
    body:
      options.body !== undefined ? JSON.stringify(options.body) : undefined,
    redirect: "manual",
    signal: AbortSignal.timeout(options.timeoutMs ?? 180_000),
  });
  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  return {
    status: response.status,
    data,
    text,
  };
}

function assertStatus(result, expectedStatus, context) {
  if (result.status !== expectedStatus) {
    throw new Error(
      `${context} 預期 HTTP ${expectedStatus}，實際收到 ${result.status}。\n${formatData(result.data)}`,
    );
  }
}

function ensureMinimaxEnv() {
  assert(
    typeof process.env.MINIMAX_API_KEY === "string" &&
      process.env.MINIMAX_API_KEY.trim().length > 0,
    "缺少 MINIMAX_API_KEY，無法執行真實 API flow 驗收。",
  );
  assert(
    typeof process.env.AUTH_SECRET === "string" &&
      process.env.AUTH_SECRET.trim().length > 0,
    "缺少 AUTH_SECRET，無法建立本地登入 session。",
  );
}

async function main() {
  ensureMinimaxEnv();

  const args = parseCliArgs(process.argv.slice(2));
  const json = args.json === "true";
  const requestedPort = parsePositiveInt(args.port, 3107);
  const port = await findAvailablePort(requestedPort);
  const logBuffer = createServerLogBuffer();
  const scenario = {
    question: "我應不應該在這個月主動提出合作邀請？",
    category: "career",
    cardIds: ["the-hermit", "eight-of-swords", "ace-of-wands"],
    followupPrompt: "如果我真的主動提出合作邀請，第一句最適合怎麼說？",
  };
  const selectedCards = pickCards(scenario.cardIds);

  let server = null;
  let cleanupUserId = null;
  let summary = null;

  try {
    printDivider("建立測試資料");

    const user = await prisma.user.create({
      data: {
        email: `api-flow-qa-${Date.now()}-${randomUUID()}@local.test`,
        name: "API Flow QA",
        points: 0,
      },
    });
    cleanupUserId = user.id;

    const sessionToken = `api-flow-session-${randomUUID()}`;
    const authSession = await prisma.session.create({
      data: {
        sessionToken,
        userId: user.id,
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
    });
    const tarotSession = await prisma.tarotSession.create({
      data: buildSessionRecordData({
        userId: user.id,
        question: scenario.question,
        category: scenario.category,
        saveToHistory: true,
        cards: selectedCards,
      }),
    });
    const cookieHeader = buildCookieHeader({
      sessionToken: authSession.sessionToken,
      tarotSessionId: tarotSession.id,
    });

    console.log(`測試使用者：${user.id}`);
    console.log(`Tarot session：${tarotSession.id}`);
    console.log(`啟動本地 dev server 連接埠：${port}`);

    server = startDevServer(port, logBuffer);
    await waitForServerReady(server, port);

    printDivider("主解讀流程");

    const readingNeedsPoints = await apiRequest(
      port,
      cookieHeader,
      "/api/reading/current",
    );
    assertStatus(readingNeedsPoints, 402, "GET /api/reading/current（點數不足）");
    assert(
      readingNeedsPoints.data?.reading === null,
      "點數不足時 reading 應為 null。",
    );
    assert(
      readingNeedsPoints.data?.points?.required === readingCostPoints,
      "reading 點數需求不一致。",
    );

    await createPointsTopUp({
      userId: user.id,
      points: readingCostPoints,
      requestKey: `api-flow-reading-topup:${randomUUID()}`,
      description: "API flow reading top-up",
    });

    const readingEmpty = await apiRequest(
      port,
      cookieHeader,
      "/api/reading/current",
    );
    assertStatus(readingEmpty, 200, "GET /api/reading/current（已補點但尚未生成）");
    assert(readingEmpty.data?.reading === null, "尚未生成時 reading 應為 null。");

    const readingCreated = await apiRequest(
      port,
      cookieHeader,
      "/api/reading/current",
      {
        method: "POST",
        body: {},
      },
    );
    assertStatus(readingCreated, 200, "POST /api/reading/current");
    assert(
      readingCreated.data?.reading?.status === "ready",
      "主解讀應成功進入 ready 狀態。",
    );
    assert(
      readingCreated.data?.reading?.fullReading?.reportTitle,
      "主解讀缺少 reportTitle。",
    );
    const readingId = readingCreated.data.reading.id;

    const readingFetched = await apiRequest(
      port,
      cookieHeader,
      "/api/reading/current",
    );
    assertStatus(readingFetched, 200, "GET /api/reading/current（生成完成後）");
    assert(
      readingFetched.data?.reading?.id === readingId,
      "重新讀取主解讀時 id 應一致。",
    );

    const readingRepeat = await apiRequest(
      port,
      cookieHeader,
      "/api/reading/current",
      {
        method: "POST",
        body: {},
      },
    );
    assertStatus(readingRepeat, 200, "POST /api/reading/current（重複請求）");
    assert(
      readingRepeat.data?.reading?.id === readingId,
      "重複請求主解讀時應回傳既有紀錄。",
    );

    printDivider("追問流程");

    const followupListEmpty = await apiRequest(
      port,
      cookieHeader,
      "/api/followup/current",
    );
    assertStatus(followupListEmpty, 200, "GET /api/followup/current（尚未建立追問）");
    assert(
      Array.isArray(followupListEmpty.data?.followups) &&
        followupListEmpty.data.followups.length === 0,
      "尚未建立追問時 followups 應為空陣列。",
    );
    assert(
      followupListEmpty.data?.currentFollowup === null,
      "尚未建立追問時 currentFollowup 應為 null。",
    );

    const followupRequestKey = `api-flow-followup:${randomUUID()}`;
    const followupNeedsPoints = await apiRequest(
      port,
      cookieHeader,
      "/api/followup/current",
      {
        method: "POST",
        body: {
          prompt: scenario.followupPrompt,
          requestKey: followupRequestKey,
        },
      },
    );
    assertStatus(
      followupNeedsPoints,
      402,
      "POST /api/followup/current（點數不足）",
    );
    assert(
      followupNeedsPoints.data?.currentFollowup?.status === "needs_points",
      "點數不足時追問狀態應為 needs_points。",
    );
    const followupId = followupNeedsPoints.data.currentFollowup.id;

    const followupNeedsPointsState = await apiRequest(
      port,
      cookieHeader,
      "/api/followup/current",
    );
    assertStatus(
      followupNeedsPointsState,
      200,
      "GET /api/followup/current（等待補點）",
    );
    assert(
      followupNeedsPointsState.data?.currentFollowup?.id === followupId,
      "等待補點時應回傳同一筆追問紀錄。",
    );
    assert(
      followupNeedsPointsState.data?.points?.required === followupCostPoints,
      "followup 點數需求不一致。",
    );

    await createPointsTopUp({
      userId: user.id,
      points: followupCostPoints,
      requestKey: `api-flow-followup-topup:${randomUUID()}`,
      description: "API flow followup top-up",
    });

    const followupCreated = await apiRequest(
      port,
      cookieHeader,
      "/api/followup/current",
      {
        method: "POST",
        body: {
          followupId,
          prompt: scenario.followupPrompt,
          requestKey: followupRequestKey,
          force: true,
        },
      },
    );
    assertStatus(followupCreated, 200, "POST /api/followup/current（補點後重試）");
    assert(
      followupCreated.data?.currentFollowup?.id === followupId,
      "補點後重試應沿用原本的 followup id。",
    );
    assert(
      followupCreated.data?.currentFollowup?.status === "ready",
      "追問生成完成後狀態應為 ready。",
    );
    assert(
      typeof followupCreated.data?.currentFollowup?.answer === "string" &&
        followupCreated.data.currentFollowup.answer.trim().length > 0,
      "追問完成後應有 answer。",
    );

    const followupFetched = await apiRequest(
      port,
      cookieHeader,
      "/api/followup/current",
    );
    assertStatus(followupFetched, 200, "GET /api/followup/current（生成完成後）");
    assert(
      followupFetched.data?.currentFollowup?.id === followupId &&
        followupFetched.data?.currentFollowup?.status === "ready",
      "重新讀取追問時應拿到 ready 狀態的同一筆紀錄。",
    );
    assert(
      Array.isArray(followupFetched.data?.followups) &&
        followupFetched.data.followups.length === 1,
      "追問清單應只保留一筆正式紀錄。",
    );

    printDivider("資料與歷史驗證");

    const [freshUser, readingChargeCount, followupChargeCount] =
      await prisma.$transaction([
        prisma.user.findUnique({
          where: { id: user.id },
          select: { points: true },
        }),
        prisma.pointTransaction.count({
          where: {
            userId: user.id,
            source: "reading_charge",
          },
        }),
        prisma.pointTransaction.count({
          where: {
            userId: user.id,
            source: "followup_charge",
          },
        }),
      ]);

    assert(freshUser, "找不到剛建立的測試使用者。");
    assert(
      freshUser.points === 0,
      `驗收完成後使用者點數應回到 0，實際為 ${freshUser.points}。`,
    );
    assert(
      readingChargeCount === 1,
      `主解讀應只扣點一次，實際為 ${readingChargeCount} 次。`,
    );
    assert(
      followupChargeCount === 1,
      `追問應只扣點一次，實際為 ${followupChargeCount} 次。`,
    );

    const historyList = await getViewerHistoryList(user.id);
    assert(historyList.length === 1, `history list 預期 1 筆，實際為 ${historyList.length} 筆。`);
    assert(
      historyList[0]?.id === readingId,
      "history list 應對應本次 route flow 生成的 reading。",
    );
    assert(
      historyList[0]?.followupCount === 1,
      "history list 應顯示 1 筆追問。",
    );
    assert(
      historyList[0]?.totalSpentPoints === readingCostPoints + followupCostPoints,
      "history list 總消耗點數不正確。",
    );

    const historyDetail = await getViewerHistoryDetail(user.id, readingId);
    assert(historyDetail, "history detail 應可讀取。");
    assert(
      historyDetail.followups.length === 1,
      "history detail 應包含 1 筆追問。",
    );

    summary = {
      port,
      readingId,
      followupId,
      readingChargeCount,
      followupChargeCount,
      finalPoints: freshUser.points,
      historyCount: historyList.length,
      historyFollowups: historyDetail.followups.length,
    };

    printDivider("驗收完成");

    if (json) {
      console.log(JSON.stringify(summary, null, 2));
    } else {
      console.log(`主解讀：${readingId}`);
      console.log(`追問：${followupId}`);
      console.log(`reading charge：${readingChargeCount}`);
      console.log(`followup charge：${followupChargeCount}`);
      console.log(`final points：${freshUser.points}`);
      console.log(`history count：${historyList.length}`);
      console.log(`history followups：${historyDetail.followups.length}`);
    }
  } catch (error) {
    if (logBuffer.dump()) {
      printDivider("dev server logs");
      console.log(logBuffer.dump());
    }

    throw error;
  } finally {
    if (cleanupUserId) {
      await prisma.user
        .delete({
          where: {
            id: cleanupUserId,
          },
        })
        .catch(() => {});
    }

    await stopDevServer(server).catch(() => {});
    await prisma.$disconnect();
  }

  return summary;
}

await main();
