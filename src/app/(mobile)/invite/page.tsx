import { auth } from "@/auth";
import { InviteScreen } from "@/components/invite/invite-screen";
import { InviteStateCard } from "@/components/invite/invite-state-card";
import { getViewerInviteSurface } from "@/lib/invite-records";

export default async function InvitePage() {
  const session = await auth();
  const viewerId = session?.user?.id ?? null;

  if (!viewerId) {
    return (
      <InviteStateCard
        eyebrow="邀請"
        eyebrowEn="Invite"
        title="先登入再看邀請"
        titleEn="Sign in to view invites"
        body="邀請碼與獎勵都會綁定在同一個登入身份下。"
        bodyEn="Invite rewards stay attached to the same signed-in profile."
        primaryHref="/auth/line"
        primaryLabel="前往登入"
        secondaryHref="/"
        secondaryLabel="回到首頁"
      />
    );
  }

  let surface;

  try {
    surface = await getViewerInviteSurface(viewerId);
  } catch {
    return (
      <InviteStateCard
        eyebrow="邀請"
        eyebrowEn="Invite"
        title="邀請目前暫時不可用"
        titleEn="Invite is unavailable right now"
        body="稍後再試，或先回到點數頁。"
        bodyEn="Try again in a moment, or return to points for now."
        primaryHref="/invite"
        primaryLabel="重新整理"
        secondaryHref="/points"
        secondaryLabel="前往點數"
      />
    );
  }

  return <InviteScreen surface={surface} />;
}
