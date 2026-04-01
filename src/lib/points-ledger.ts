import type { DailyCheckInState } from "@/lib/daily-checkin";
import { getDailyCheckInState } from "@/lib/daily-checkin";
import { prisma, type TransactionClient } from "@/lib/prisma";
import {
  dailyCheckInPoints,
  followupCostPoints,
  pointPackages,
  readingCostPoints,
  type PointPackage,
} from "@/lib/points";

const pointsDateFormatter = new Intl.DateTimeFormat("zh-TW", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

async function getPointsLedgerTransactions(userId: string) {
  return prisma.pointTransaction.findMany({
    where: {
      userId,
    },
    include: {
      topUpOrder: {
        select: {
          id: true,
        },
      },
      followupCharge: {
        select: {
          id: true,
          prompt: true,
          readingRecordId: true,
        },
      },
      dailyCheckIn: {
        select: {
          id: true,
          dayKey: true,
        },
      },
      inviteReward: {
        select: {
          id: true,
          inviteeName: true,
        },
      },
      readingCharge: {
        select: {
          id: true,
          question: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 24,
  });
}

type PointTransactionRecord = Awaited<
  ReturnType<typeof getPointsLedgerTransactions>
>[number];

export type PointsLedgerEntry = {
  id: string;
  type:
    | "reading"
    | "followup"
    | "top_up"
    | "invite_reward"
    | "daily_check_in"
    | "adjustment";
  typeLabel: string;
  typeBadge: string;
  amount: number;
  amountLabel: string;
  balanceAfter: number;
  balanceAfterLabel: string;
  description: string;
  createdAt: string;
  createdLabel: string;
  direction: "credit" | "debit";
  detailHref: string | null;
  detailLabel: string | null;
};

export type PointsLedgerData = {
  points: number;
  followupCostPoints: number;
  readingCostPoints: number;
  dailyCheckIn: DailyCheckInState;
  packages: PointPackage[];
  transactions: PointsLedgerEntry[];
  totals: {
    restored: number;
    spent: number;
    reading: number;
    followup: number;
  };
};

type PointsLedgerTotals = PointsLedgerData["totals"];

function trimLine(value: string, maxLength = 88) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(maxLength - 3, 1)).trimEnd()}...`;
}

function mapTransactionToLedgerEntry(
  record: PointTransactionRecord,
): PointsLedgerEntry {
  const direction = record.amount >= 0 ? "credit" : "debit";
  const amountLabel = `${record.amount >= 0 ? "+" : ""}${record.amount} 點 / pts`;
  const topUpLabel = record.description
    ?.replace(/^Top-up via\s+/i, "")
    .trim();

  if (record.source === "reading_charge") {
    return {
      id: record.id,
      type: "reading",
      typeLabel: "命運解讀 / Destiny reading",
      typeBadge: "解讀 / Reading",
      amount: record.amount,
      amountLabel,
      balanceAfter: record.balanceAfter,
      balanceAfterLabel: `這次解讀後剩下 ${record.balanceAfter} 點`,
      description: record.readingCharge?.question
        ? `為「${trimLine(record.readingCharge.question, 64)}」打開完整報告。`
        : "用於開啟一份完整塔羅報告。",
      createdAt: record.createdAt.toISOString(),
      createdLabel: pointsDateFormatter.format(record.createdAt),
      direction,
      detailHref: record.readingCharge?.id
        ? `/history/${record.readingCharge.id}`
        : null,
      detailLabel: record.readingCharge?.id ? "打開解讀（Open reading）" : null,
    };
  }

  if (record.source === "followup_charge") {
    return {
      id: record.id,
      type: "followup",
      typeLabel: "AI 追問 / AI follow-up",
      typeBadge: "追問 / Follow-up",
      amount: record.amount,
      amountLabel,
      balanceAfter: record.balanceAfter,
      balanceAfterLabel: `這次追問後剩下 ${record.balanceAfter} 點`,
      description: record.followupCharge?.prompt
        ? `以「${trimLine(record.followupCharge.prompt, 64)}」續接這條解讀脈絡。`
        : "用於續接同一份解讀裡的追問脈絡。",
      createdAt: record.createdAt.toISOString(),
      createdLabel: pointsDateFormatter.format(record.createdAt),
      direction,
      detailHref: record.followupCharge?.readingRecordId
        ? `/history/${record.followupCharge.readingRecordId}`
        : null,
      detailLabel: record.followupCharge?.readingRecordId ? "打開解讀（Open reading）" : null,
    };
  }

  if (record.source === "top_up") {
    return {
      id: record.id,
      type: "top_up",
      typeLabel: "補回點數 / Points restored",
      typeBadge: "補點 / Top-up",
      amount: record.amount,
      amountLabel,
      balanceAfter: record.balanceAfter,
      balanceAfterLabel: `目前可用 ${record.balanceAfter} 點`,
      description: topUpLabel
        ? `透過 ${topUpLabel} 補回點數。`
        : "為下一次想打開的解讀補回點數。",
      createdAt: record.createdAt.toISOString(),
      createdLabel: pointsDateFormatter.format(record.createdAt),
      direction,
      detailHref: record.topUpOrder?.id
        ? `/points?payment=success&order=${record.topUpOrder.id}`
        : "/points",
      detailLabel: "打開點數頁（Open points）",
    };
  }

  if (record.source === "invite_reward") {
    return {
      id: record.id,
      type: "invite_reward",
      typeLabel: "邀請獎勵 / Invite reward",
      typeBadge: "邀請 / Invite",
      amount: record.amount,
      amountLabel,
      balanceAfter: record.balanceAfter,
      balanceAfterLabel: `目前可用 ${record.balanceAfter} 點`,
      description: record.inviteReward?.inviteeName
        ? `${record.inviteReward.inviteeName} 透過你的分享連結進入。`
        : "有一筆共享邀請已將點數回補到你的餘額中。",
      createdAt: record.createdAt.toISOString(),
      createdLabel: pointsDateFormatter.format(record.createdAt),
      direction,
      detailHref: "/invite",
      detailLabel: "打開邀請頁（Open invite）",
    };
  }

  if (record.source === "daily_check_in") {
    return {
      id: record.id,
      type: "daily_check_in",
      typeLabel: "每日回訪 / Daily return",
      typeBadge: "簽到 / Check-in",
      amount: record.amount,
      amountLabel,
      balanceAfter: record.balanceAfter,
      balanceAfterLabel: `目前可用 ${record.balanceAfter} 點`,
      description: record.dailyCheckIn?.dayKey
        ? `在 ${record.dailyCheckIn.dayKey} 回來簽到，並領取今天的小額點數。`
        : "今天已回來簽到，並領取了一筆小額點數。",
      createdAt: record.createdAt.toISOString(),
      createdLabel: pointsDateFormatter.format(record.createdAt),
      direction,
      detailHref: "/points",
      detailLabel: "打開點數頁（Open points）",
    };
  }

  return {
    id: record.id,
    type: "adjustment",
    typeLabel: "餘額調整 / Balance update",
    typeBadge: "調整 / Adjustment",
    amount: record.amount,
    amountLabel,
    balanceAfter: record.balanceAfter,
    balanceAfterLabel: `目前可用 ${record.balanceAfter} 點`,
    description: record.description || "這裡記錄了一筆點數餘額調整。",
    createdAt: record.createdAt.toISOString(),
    createdLabel: pointsDateFormatter.format(record.createdAt),
    direction,
    detailHref: null,
    detailLabel: null,
  };
}

export function buildReadingChargeRequestKey(sessionId: string) {
  return `reading:${sessionId}:charge`;
}

export async function getViewerPoints(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { points: true },
  });

  return user?.points ?? 0;
}

export async function getPointsSummary(userId: string) {
  return {
    points: await getViewerPoints(userId),
    followupCostPoints,
    readingCostPoints,
    dailyCheckIn: {
      status: "available" as const,
      rewardPoints: dailyCheckInPoints,
      dayKey: "",
      dayLabel: "",
      claimedAt: null,
      claimedLabel: null,
    },
    packages: pointPackages,
  };
}

export async function getViewerPointsLedger(
  userId: string,
): Promise<PointsLedgerData> {
  const [user, transactions, dailyCheckIn] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { points: true },
    }),
    getPointsLedgerTransactions(userId),
    getDailyCheckInState(userId),
  ]);

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  const totals = transactions.reduce(
    (acc: PointsLedgerTotals, transaction: PointTransactionRecord) => {
      if (transaction.amount > 0) {
        acc.restored += transaction.amount;
      } else {
        acc.spent += Math.abs(transaction.amount);
      }

      if (transaction.source === "reading_charge") {
        acc.reading += Math.abs(transaction.amount);
      }

      if (transaction.source === "followup_charge") {
        acc.followup += Math.abs(transaction.amount);
      }

      return acc;
    },
    {
      restored: 0,
      spent: 0,
      reading: 0,
      followup: 0,
    },
  );

  return {
    points: user.points,
    followupCostPoints,
    readingCostPoints,
    dailyCheckIn,
    packages: pointPackages,
    transactions: transactions.map(mapTransactionToLedgerEntry),
    totals,
  };
}

export async function createPointsTopUp(args: {
  userId: string;
  points: number;
  requestKey: string;
  description: string;
}) {
  return prisma.$transaction(async (tx: TransactionClient) => {
    const existingTransaction = await tx.pointTransaction.findUnique({
      where: {
        requestKey: args.requestKey,
      },
    });

    if (existingTransaction) {
      const user = await tx.user.findUnique({
        where: { id: args.userId },
        select: { points: true },
      });

      return {
        transactionId: existingTransaction.id,
        points: user?.points ?? existingTransaction.balanceAfter,
      };
    }

    const user = await tx.user.findUnique({
      where: { id: args.userId },
      select: { points: true },
    });

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const balanceAfter = user.points + args.points;
    const transaction = await tx.pointTransaction.create({
      data: {
        userId: args.userId,
        amount: args.points,
        balanceAfter,
        kind: "credit",
        source: "top_up",
        requestKey: args.requestKey,
        description: args.description,
      },
    });

    await tx.user.update({
      where: { id: args.userId },
      data: {
        points: {
          increment: args.points,
        },
      },
    });

    return {
      transactionId: transaction.id,
      points: balanceAfter,
    };
  });
}

export async function ensureReadingCharge(args: {
  userId: string;
  readingRecordId: string;
  sessionId: string;
  costPoints?: number;
}) {
  const cost = args.costPoints ?? readingCostPoints;
  const requestKey = buildReadingChargeRequestKey(args.sessionId);

  return prisma.$transaction(async (tx: TransactionClient) => {
    const readingRecord = await tx.readingRecord.findUnique({
      where: { id: args.readingRecordId },
      select: {
        id: true,
        chargeTransactionId: true,
      },
    });

    if (!readingRecord) {
      throw new Error("READING_NOT_FOUND");
    }

    const user = await tx.user.findUnique({
      where: { id: args.userId },
      select: { points: true },
    });

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    if (readingRecord.chargeTransactionId) {
      return {
        ok: true as const,
        charged: false,
        requestKey,
        points: user.points,
        transactionId: readingRecord.chargeTransactionId,
      };
    }

    const existingTransaction = await tx.pointTransaction.findUnique({
      where: { requestKey },
      select: {
        id: true,
        balanceAfter: true,
      },
    });

    if (existingTransaction) {
      await tx.readingRecord.update({
        where: { id: args.readingRecordId },
        data: {
          costPoints: cost,
          chargeRequestKey: requestKey,
          chargeTransactionId: existingTransaction.id,
        },
      });

      return {
        ok: true as const,
        charged: false,
        requestKey,
        points: user.points,
        transactionId: existingTransaction.id,
      };
    }

    if (user.points < cost) {
      return {
        ok: false as const,
        charged: false,
        requestKey,
        points: user.points,
        requiredPoints: cost,
      };
    }

    const balanceAfter = user.points - cost;
    const transaction = await tx.pointTransaction.create({
      data: {
        userId: args.userId,
        amount: -cost,
        balanceAfter,
        kind: "debit",
        source: "reading_charge",
        requestKey,
        description: `Reading charge for tarot session ${args.sessionId}`,
      },
    });

    await tx.user.update({
      where: { id: args.userId },
      data: {
        points: {
          decrement: cost,
        },
      },
    });

    await tx.readingRecord.update({
      where: { id: args.readingRecordId },
      data: {
        costPoints: cost,
        chargeRequestKey: requestKey,
        chargeTransactionId: transaction.id,
      },
    });

    return {
      ok: true as const,
      charged: true,
      requestKey,
      points: balanceAfter,
      transactionId: transaction.id,
    };
  });
}

export function buildFollowupChargeRequestKey(requestKey: string) {
  return `followup:${requestKey}:charge`;
}

export async function ensureFollowupCharge(args: {
  userId: string;
  followupRecordId: string;
  requestKey: string;
  costPoints?: number;
}) {
  const cost = args.costPoints ?? followupCostPoints;
  const chargeRequestKey = buildFollowupChargeRequestKey(args.requestKey);

  return prisma.$transaction(async (tx: TransactionClient) => {
    const followupRecord = await tx.followupRecord.findUnique({
      where: { id: args.followupRecordId },
      select: {
        id: true,
        chargeTransactionId: true,
      },
    });

    if (!followupRecord) {
      throw new Error("FOLLOWUP_NOT_FOUND");
    }

    const user = await tx.user.findUnique({
      where: { id: args.userId },
      select: { points: true },
    });

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    if (followupRecord.chargeTransactionId) {
      return {
        ok: true as const,
        charged: false,
        requestKey: chargeRequestKey,
        points: user.points,
        transactionId: followupRecord.chargeTransactionId,
      };
    }

    const existingTransaction = await tx.pointTransaction.findUnique({
      where: { requestKey: chargeRequestKey },
      select: {
        id: true,
      },
    });

    if (existingTransaction) {
      await tx.followupRecord.update({
        where: { id: args.followupRecordId },
        data: {
          costPoints: cost,
          chargeTransactionId: existingTransaction.id,
        },
      });

      return {
        ok: true as const,
        charged: false,
        requestKey: chargeRequestKey,
        points: user.points,
        transactionId: existingTransaction.id,
      };
    }

    if (user.points < cost) {
      return {
        ok: false as const,
        charged: false,
        requestKey: chargeRequestKey,
        points: user.points,
        requiredPoints: cost,
      };
    }

    const balanceAfter = user.points - cost;
    const transaction = await tx.pointTransaction.create({
      data: {
        userId: args.userId,
        amount: -cost,
        balanceAfter,
        kind: "debit",
        source: "followup_charge",
        requestKey: chargeRequestKey,
        description: `Followup charge for request ${args.requestKey}`,
      },
    });

    await tx.user.update({
      where: { id: args.userId },
      data: {
        points: {
          decrement: cost,
        },
      },
    });

    await tx.followupRecord.update({
      where: { id: args.followupRecordId },
      data: {
        costPoints: cost,
        chargeTransactionId: transaction.id,
      },
    });

    return {
      ok: true as const,
      charged: true,
      requestKey: chargeRequestKey,
      points: balanceAfter,
      transactionId: transaction.id,
    };
  });
}
