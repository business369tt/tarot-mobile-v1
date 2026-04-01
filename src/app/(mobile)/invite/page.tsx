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
        eyebrow="邀請入口"
        eyebrowEn="Invite access"
        title="先連結身份，才能打開你的邀請頁。"
        titleEn="Link a profile before opening your invite circle."
        body="你的邀請碼、進度與獎勵點數都會綁定在單一 LINE 身份下，所以只有在該身份存在時才會開啟這個頁面。"
        bodyEn="Your invite code, progress, and reward balance stay attached to one LINE identity, so this page opens only once that profile is present."
        primaryHref="/auth/line"
        primaryLabel="使用 LINE 繼續（Continue with LINE）"
        secondaryHref="/"
        secondaryLabel="回到首頁（Back to home）"
      />
    );
  }

  let surface;

  try {
    surface = await getViewerInviteSurface(viewerId);
  } catch {
    return (
      <InviteStateCard
        eyebrow="邀請頁暫停"
        eyebrowEn="Invite unavailable"
        title="邀請頁面目前暫時無法顯示。"
        titleEn="The invite circle is quiet for a moment."
        body="你的邀請路徑仍然綁定在這個身份下，但成長與回饋頁面需要再重新整理一次，才能清楚開啟。"
        bodyEn="Your invite path is still attached to this profile, but the growth surface needs another pass before it opens clearly again."
        primaryHref="/invite"
        primaryLabel="再試一次（Try again）"
        secondaryHref="/points"
        secondaryLabel="打開點數帳本（Open points ledger）"
      />
    );
  }

  return <InviteScreen surface={surface} />;
}
