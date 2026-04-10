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
        title="登入後查看邀請回饋"
        titleEn="Sign in to view invites"
        body="邀請獎勵會綁定在同一個已登入帳戶上。"
        bodyEn="Invite rewards stay attached to the same signed-in profile."
        primaryHref="/auth/line"
        primaryLabel="前往登入"
        secondaryHref="/"
        secondaryLabel="返回首頁"
      />
    );
  }

  let surface = null;

  try {
    surface = await getViewerInviteSurface(viewerId);
  } catch {
    return (
      <InviteStateCard
        eyebrow="邀請"
        eyebrowEn="Invite"
        title="邀請頁暫時無法使用"
        titleEn="Invite is unavailable right now"
        body="請稍後再試，或先回到點數頁查看目前餘額。"
        bodyEn="Try again in a moment, or return to points for now."
        primaryHref="/invite"
        primaryLabel="重新整理"
        secondaryHref="/points"
        secondaryLabel="查看點數"
      />
    );
  }

  return <InviteScreen surface={surface} />;
}
