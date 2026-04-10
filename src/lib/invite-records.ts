import { randomBytes } from "node:crypto";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { buildInviteLink, inviteRewardPoints } from "@/lib/invite";
import { prisma, type TransactionClient } from "@/lib/prisma";

const inviteDateFormatter = new Intl.DateTimeFormat("zh-TW", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const inviteCodeAlphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export type InviteProgressItem = {
  id: string;
  inviteeName: string;
  status: "rewarded";
  statusLabel: string;
  rewardPoints: number;
  rewardLabel: string;
  summary: string;
  createdAt: string;
  createdLabel: string;
};

export type InviteSurface = {
  code: string;
  inviteLink: string;
  invitedCount: number;
  totalRewardPoints: number;
  availablePoints: number;
  rewardPerInvite: number;
  recentProgress: InviteProgressItem[];
};

export type InviteClaimResult =
  | {
      status: "rewarded";
      inviterName: string | null;
      rewardPoints: number;
      inviteeName: string | null;
    }
  | {
      status:
        | "already_rewarded"
        | "already_attached"
        | "self"
        | "invalid"
        | "error";
      inviterName?: string | null;
    };

function createInviteCode(length = 8) {
  const bytes = randomBytes(length);
  let code = "";

  for (let index = 0; index < length; index += 1) {
    code += inviteCodeAlphabet[bytes[index] % inviteCodeAlphabet.length];
  }

  return code;
}

function getInviteeDisplayName(inviteeName: string | null | undefined) {
  return inviteeName?.trim() || "一位新讀者";
}

function buildInviteProgressSummary(inviteeName: string | null | undefined) {
  const displayName = inviteeName?.trim();

  if (displayName) {
    return `${displayName} 已經透過你的邀請開始使用，這筆回饋已經結算到你的帳戶。`;
  }

  return "有一位新讀者透過你的邀請開始使用，這筆回饋已經結算到你的帳戶。";
}

async function createInviteProfile(userId: string) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      return await prisma.inviteProfile.create({
        data: {
          userId,
          code: createInviteCode(),
        },
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const existingProfile = await prisma.inviteProfile.findUnique({
          where: { userId },
        });

        if (existingProfile) {
          return existingProfile;
        }

        continue;
      }

      throw error;
    }
  }

  throw new Error("INVITE_CODE_CREATE_FAILED");
}

async function getInviteRecentProgress(userId: string) {
  return prisma.inviteReferral.findMany({
    where: {
      inviterId: userId,
      rewardTransactionId: {
        not: null,
      },
    },
    orderBy: {
      rewardedAt: "desc",
    },
    take: 6,
  });
}

type InviteRecentProgressRecord = Awaited<
  ReturnType<typeof getInviteRecentProgress>
>[number];

export async function getOrCreateInviteProfile(userId: string) {
  const existingProfile = await prisma.inviteProfile.findUnique({
    where: { userId },
  });

  if (existingProfile) {
    return existingProfile;
  }

  return createInviteProfile(userId);
}

export async function getViewerInviteSurface(
  userId: string,
): Promise<InviteSurface> {
  const [profile, user, recentProgress, aggregates] = await Promise.all([
    getOrCreateInviteProfile(userId),
    prisma.user.findUnique({
      where: { id: userId },
      select: { points: true },
    }),
    getInviteRecentProgress(userId),
    prisma.inviteReferral.aggregate({
      where: {
        inviterId: userId,
        rewardTransactionId: {
          not: null,
        },
      },
      _count: {
        id: true,
      },
      _sum: {
        rewardPoints: true,
      },
    }),
  ]);

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  return {
    code: profile.code,
    inviteLink: buildInviteLink(profile.code),
    invitedCount: aggregates._count.id,
    totalRewardPoints: aggregates._sum.rewardPoints ?? 0,
    availablePoints: user.points,
    rewardPerInvite: inviteRewardPoints,
    recentProgress: recentProgress.map((record: InviteRecentProgressRecord) => ({
      id: record.id,
      inviteeName: getInviteeDisplayName(record.inviteeName),
      status: "rewarded",
      statusLabel: "回饋已入帳",
      rewardPoints: record.rewardPoints,
      rewardLabel: `+${record.rewardPoints} 點`,
      summary: buildInviteProgressSummary(record.inviteeName),
      createdAt: (record.rewardedAt ?? record.createdAt).toISOString(),
      createdLabel: inviteDateFormatter.format(
        record.rewardedAt ?? record.createdAt,
      ),
    })),
  };
}

export async function claimInviteForViewer(args: {
  inviteCode: string;
  inviteeId: string;
}): Promise<InviteClaimResult> {
  const normalizedCode = args.inviteCode.trim().toUpperCase();

  if (!normalizedCode) {
    return {
      status: "invalid",
    };
  }

  try {
    return await prisma.$transaction(async (tx: TransactionClient) => {
      const profile = await tx.inviteProfile.findUnique({
        where: {
          code: normalizedCode,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              points: true,
            },
          },
        },
      });

      if (!profile) {
        return {
          status: "invalid" as const,
        };
      }

      if (profile.userId === args.inviteeId) {
        return {
          status: "self" as const,
          inviterName: profile.user.name ?? null,
        };
      }

      const existingReferral = await tx.inviteReferral.findUnique({
        where: {
          inviteeId: args.inviteeId,
        },
        include: {
          inviter: {
            select: {
              name: true,
            },
          },
        },
      });

      if (existingReferral) {
        if (existingReferral.inviterId === profile.userId) {
          return {
            status: "already_rewarded" as const,
            inviterName: existingReferral.inviter.name ?? null,
          };
        }

        return {
          status: "already_attached" as const,
          inviterName: existingReferral.inviter.name ?? null,
        };
      }

      const invitee = await tx.user.findUnique({
        where: { id: args.inviteeId },
        select: {
          name: true,
        },
      });

      if (!invitee) {
        throw new Error("INVITEE_NOT_FOUND");
      }

      const rewardReferral = await tx.inviteReferral.create({
        data: {
          inviteProfileId: profile.id,
          inviterId: profile.userId,
          inviteeId: args.inviteeId,
          inviteeName: invitee.name,
          status: "rewarded",
          rewardPoints: inviteRewardPoints,
          claimedAt: new Date(),
          rewardedAt: new Date(),
        },
      });

      const requestKey = `invite:${rewardReferral.id}:reward`;
      const balanceAfter = profile.user.points + inviteRewardPoints;
      const rewardTransaction = await tx.pointTransaction.create({
        data: {
          userId: profile.userId,
          amount: inviteRewardPoints,
          balanceAfter,
          kind: "credit",
          source: "invite_reward",
          requestKey,
          description: invitee.name
            ? `邀請回饋：${invitee.name}`
            : "邀請回饋",
        },
      });

      await tx.user.update({
        where: { id: profile.userId },
        data: {
          points: {
            increment: inviteRewardPoints,
          },
        },
      });

      await tx.inviteReferral.update({
        where: { id: rewardReferral.id },
        data: {
          rewardTransactionId: rewardTransaction.id,
        },
      });

      return {
        status: "rewarded" as const,
        inviterName: profile.user.name ?? null,
        rewardPoints: inviteRewardPoints,
        inviteeName: invitee.name ?? null,
      };
    });
  } catch {
    return {
      status: "error",
    };
  }
}
