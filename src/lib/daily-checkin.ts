import { dailyCheckInPoints } from "@/lib/points";
import { prisma, type TransactionClient } from "@/lib/prisma";

const dailyCheckInTimeZone = process.env.APP_TIMEZONE || "Asia/Taipei";

const dayKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: dailyCheckInTimeZone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const dayLabelFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: dailyCheckInTimeZone,
  weekday: "short",
  month: "short",
  day: "numeric",
});

const claimedLabelFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: dailyCheckInTimeZone,
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export type DailyCheckInState = {
  status: "available" | "claimed";
  rewardPoints: number;
  dayKey: string;
  dayLabel: string;
  claimedAt: string | null;
  claimedLabel: string | null;
};

export function getDailyCheckInDayKey(date = new Date()) {
  const parts = dayKeyFormatter.formatToParts(date);
  const year = parts.find((part: Intl.DateTimeFormatPart) => part.type === "year")?.value;
  const month = parts.find((part: Intl.DateTimeFormatPart) => part.type === "month")?.value;
  const day = parts.find((part: Intl.DateTimeFormatPart) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

export function buildDailyCheckInRequestKey(userId: string, dayKey: string) {
  return `daily:${userId}:${dayKey}`;
}

function getDayLabel(date = new Date()) {
  return dayLabelFormatter.format(date);
}

export async function getDailyCheckInState(
  userId: string,
): Promise<DailyCheckInState> {
  const dayKey = getDailyCheckInDayKey();
  const claimed = await prisma.dailyCheckIn.findUnique({
    where: {
      userId_dayKey: {
        userId,
        dayKey,
      },
    },
    select: {
      claimedAt: true,
    },
  });

  return {
    status: claimed ? "claimed" : "available",
    rewardPoints: dailyCheckInPoints,
    dayKey,
    dayLabel: getDayLabel(),
    claimedAt: claimed?.claimedAt.toISOString() ?? null,
    claimedLabel: claimed?.claimedAt
      ? claimedLabelFormatter.format(claimed.claimedAt)
      : null,
  };
}

export async function claimDailyCheckIn(userId: string) {
  const dayKey = getDailyCheckInDayKey();
  const requestKey = buildDailyCheckInRequestKey(userId, dayKey);

  return prisma.$transaction(async (tx: TransactionClient) => {
    const existingCheckIn = await tx.dailyCheckIn.findUnique({
      where: {
        userId_dayKey: {
          userId,
          dayKey,
        },
      },
      select: {
        id: true,
        claimedAt: true,
      },
    });

    if (existingCheckIn) {
      return {
        status: "already_claimed" as const,
        state: {
          status: "claimed" as const,
          rewardPoints: dailyCheckInPoints,
          dayKey,
          dayLabel: getDayLabel(),
          claimedAt: existingCheckIn.claimedAt.toISOString(),
          claimedLabel: claimedLabelFormatter.format(existingCheckIn.claimedAt),
        },
      };
    }

    const existingTransaction = await tx.pointTransaction.findUnique({
      where: {
        requestKey,
      },
      select: {
        id: true,
        createdAt: true,
        balanceAfter: true,
      },
    });

    if (existingTransaction) {
      await tx.dailyCheckIn.create({
        data: {
          userId,
          dayKey,
          rewardPoints: dailyCheckInPoints,
          chargeTransactionId: existingTransaction.id,
          claimedAt: existingTransaction.createdAt,
        },
      });

      return {
        status: "already_claimed" as const,
        state: {
          status: "claimed" as const,
          rewardPoints: dailyCheckInPoints,
          dayKey,
          dayLabel: getDayLabel(),
          claimedAt: existingTransaction.createdAt.toISOString(),
          claimedLabel: claimedLabelFormatter.format(existingTransaction.createdAt),
        },
      };
    }

    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { points: true },
    });

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const claimedAt = new Date();
    const balanceAfter = user.points + dailyCheckInPoints;
    const transaction = await tx.pointTransaction.create({
      data: {
        userId,
        amount: dailyCheckInPoints,
        balanceAfter,
        kind: "credit",
        source: "daily_check_in",
        requestKey,
        description: "Daily check-in reward",
      },
    });

    await tx.user.update({
      where: { id: userId },
      data: {
        points: {
          increment: dailyCheckInPoints,
        },
      },
    });

    await tx.dailyCheckIn.create({
      data: {
        userId,
        dayKey,
        rewardPoints: dailyCheckInPoints,
        chargeTransactionId: transaction.id,
        claimedAt,
      },
    });

    return {
      status: "claimed" as const,
      state: {
        status: "claimed" as const,
        rewardPoints: dailyCheckInPoints,
        dayKey,
        dayLabel: getDayLabel(),
        claimedAt: claimedAt.toISOString(),
        claimedLabel: claimedLabelFormatter.format(claimedAt),
      },
    };
  });
}
