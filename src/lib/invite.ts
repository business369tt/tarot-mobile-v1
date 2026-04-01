import { getAppBaseUrl } from "@/lib/app-env";

function parsePositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const inviteRewardPoints = parsePositiveInt(
  process.env.INVITE_REWARD_POINTS,
  4,
);

export function getInviteBaseUrl() {
  return getAppBaseUrl();
}

export function buildInviteLink(code: string) {
  const inviteUrl = new URL("/auth/line", getInviteBaseUrl());

  inviteUrl.searchParams.set("ref", code);

  return inviteUrl.toString();
}
