import { auth } from "@/auth";
import { LineEntryScreen } from "@/components/auth/line-entry-screen";
import {
  claimInviteForViewer,
  type InviteClaimResult,
} from "@/lib/invite-records";

function getInviteCode(value: string | string[] | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim().toUpperCase();

  return trimmed || null;
}

export default async function LineAuthPage({
  searchParams,
}: {
  searchParams: Promise<{
    ref?: string | string[];
  }>;
}) {
  const query = await searchParams;
  const inviteCode = getInviteCode(query.ref);
  const session = await auth();
  const viewerId = session?.user?.id ?? null;
  let inviteClaim: InviteClaimResult | null = null;

  if (inviteCode && viewerId) {
    inviteClaim = await claimInviteForViewer({
      inviteCode,
      inviteeId: viewerId,
    });
  }

  return <LineEntryScreen inviteCode={inviteCode} inviteClaim={inviteClaim} />;
}
