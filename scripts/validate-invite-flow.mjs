import "dotenv/config";
import path from "node:path";
import { randomUUID } from "node:crypto";
import createJiti from "jiti";

const workspaceRoot = process.cwd();
const scriptPath = path.join(workspaceRoot, "scripts", "validate-invite-flow.mjs");
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
const { inviteRewardPoints, buildInviteLink } = loadWorkspaceModule(
  "src",
  "lib",
  "invite.ts",
);
const {
  claimInviteForViewer,
  getOrCreateInviteProfile,
  getViewerInviteSurface,
} = loadWorkspaceModule("src", "lib", "invite-records.ts");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function createTestUser(label) {
  return prisma.user.create({
    data: {
      email: `invite-qa-${label}-${Date.now()}-${randomUUID()}@local.test`,
      name: label,
    },
  });
}

const cleanupUserIds = [];

try {
  const inviter = await createTestUser("Invite QA Inviter");
  const invitee = await createTestUser("Invite QA Invitee");
  const selfUser = await createTestUser("Invite QA Self");
  const otherInviter = await createTestUser("Invite QA Other Inviter");
  const attachedInvitee = await createTestUser("Invite QA Attached Invitee");

  cleanupUserIds.push(
    inviter.id,
    invitee.id,
    selfUser.id,
    otherInviter.id,
    attachedInvitee.id,
  );

  const inviterProfile = await getOrCreateInviteProfile(inviter.id);
  const selfProfile = await getOrCreateInviteProfile(selfUser.id);
  const otherInviterProfile = await getOrCreateInviteProfile(otherInviter.id);

  assert(inviterProfile.code.length >= 8, "邀請碼長度異常");
  assert(
    buildInviteLink(inviterProfile.code).includes(inviterProfile.code),
    "邀請連結沒有帶入邀請碼",
  );

  const rewardedClaim = await claimInviteForViewer({
    inviteCode: inviterProfile.code,
    inviteeId: invitee.id,
  });
  assert(rewardedClaim.status === "rewarded", "預期首次邀請應該成功入帳");
  assert(
    rewardedClaim.rewardPoints === inviteRewardPoints,
    "首次邀請回饋點數不正確",
  );
  assert(
    rewardedClaim.inviteeName === invitee.name,
    "首次邀請回傳的受邀者名稱不正確",
  );

  const duplicateClaim = await claimInviteForViewer({
    inviteCode: inviterProfile.code,
    inviteeId: invitee.id,
  });
  assert(
    duplicateClaim.status === "already_rewarded",
    "同一位受邀者重複領取時應回傳 already_rewarded",
  );

  const selfClaim = await claimInviteForViewer({
    inviteCode: selfProfile.code,
    inviteeId: selfUser.id,
  });
  assert(selfClaim.status === "self", "自己的邀請碼應回傳 self");

  const invalidClaim = await claimInviteForViewer({
    inviteCode: "INVALID1",
    inviteeId: invitee.id,
  });
  assert(invalidClaim.status === "invalid", "無效邀請碼應回傳 invalid");

  const attachedFirstClaim = await claimInviteForViewer({
    inviteCode: otherInviterProfile.code,
    inviteeId: attachedInvitee.id,
  });
  assert(
    attachedFirstClaim.status === "rewarded",
    "第二組邀請的首次綁定應該成功",
  );

  const attachedClaim = await claimInviteForViewer({
    inviteCode: inviterProfile.code,
    inviteeId: attachedInvitee.id,
  });
  assert(
    attachedClaim.status === "already_attached",
    "已被其他邀請綁定的受邀者應回傳 already_attached",
  );

  const inviterSurface = await getViewerInviteSurface(inviter.id);
  assert(inviterSurface.code === inviterProfile.code, "邀請頁顯示的邀請碼不一致");
  assert(
    inviterSurface.inviteLink === buildInviteLink(inviterProfile.code),
    "邀請頁顯示的邀請連結不一致",
  );
  assert(inviterSurface.invitedCount === 1, "首次邀請後的已邀請人數不正確");
  assert(
    inviterSurface.totalRewardPoints === inviteRewardPoints,
    "首次邀請後的累計回饋點數不正確",
  );
  assert(
    inviterSurface.availablePoints === inviteRewardPoints,
    "首次邀請後的可用點數不正確",
  );
  assert(
    inviterSurface.rewardPerInvite === inviteRewardPoints,
    "邀請頁顯示的每次回饋點數不正確",
  );
  assert(inviterSurface.recentProgress.length === 1, "最近邀請回饋數量不正確");
  assert(
    inviterSurface.recentProgress[0]?.inviteeName === invitee.name,
    "最近邀請回饋的受邀者名稱不正確",
  );
  assert(
    inviterSurface.recentProgress[0]?.statusLabel === "回饋已入帳",
    "最近邀請回饋狀態文案不正確",
  );
  assert(
    inviterSurface.recentProgress[0]?.rewardLabel === `+${inviteRewardPoints} 點`,
    "最近邀請回饋點數標籤不正確",
  );
  assert(
    inviterSurface.recentProgress[0]?.summary.includes("這筆回饋已經結算到你的帳戶"),
    "最近邀請回饋摘要沒有維持繁中產品語氣",
  );

  const inviterUser = await prisma.user.findUnique({
    where: { id: inviter.id },
    select: { points: true },
  });
  assert(inviterUser?.points === inviteRewardPoints, "邀請成功後的帳戶點數不正確");

  const otherInviterUser = await prisma.user.findUnique({
    where: { id: otherInviter.id },
    select: { points: true },
  });
  assert(
    otherInviterUser?.points === inviteRewardPoints,
    "第二組邀請成功後的帳戶點數不正確",
  );

  const rewardTransactions = await prisma.pointTransaction.findMany({
    where: {
      userId: {
        in: [inviter.id, otherInviter.id],
      },
      source: "invite_reward",
    },
    orderBy: {
      createdAt: "asc",
    },
  });
  assert(rewardTransactions.length === 2, "邀請回饋交易筆數不正確");
  assert(
    rewardTransactions.every((item) => item.amount === inviteRewardPoints),
    "邀請回饋交易金額不正確",
  );
  assert(
    rewardTransactions.every(
      (item) =>
        item.description === "邀請回饋" || item.description.startsWith("邀請回饋："),
    ),
    "邀請回饋交易描述應該維持繁中格式",
  );

  console.log("Invite flow validation passed.");
  console.log(`- inviter code: ${inviterProfile.code}`);
  console.log(`- reward points per invite: ${inviteRewardPoints}`);
  console.log(`- inviter available points: ${inviterSurface.availablePoints}`);
  console.log(`- inviter recent rewards: ${inviterSurface.recentProgress.length}`);
  console.log(`- invite reward transactions: ${rewardTransactions.length}`);
} finally {
  if (cleanupUserIds.length > 0) {
    await prisma.user
      .deleteMany({
        where: {
          id: {
            in: cleanupUserIds,
          },
        },
      })
      .catch(() => null);
  }

  await prisma.$disconnect();
}
