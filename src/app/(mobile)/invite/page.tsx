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
        title="先登入再查看邀請"
        titleEn="Sign in to view invites"
        body="邀請碼與獎勵都會綁定在同一個 LINE 身份下。"
        bodyEn="Invite rewards stay attached to the same LINE profile."
        primaryHref="/auth/line"
        primaryLabel="使用 LINE 登入"
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
        title="邀請頁暫時打不開"
        titleEn="Invite is unavailable right now"
        body="稍後再試一次，或先回到點數頁。"
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
