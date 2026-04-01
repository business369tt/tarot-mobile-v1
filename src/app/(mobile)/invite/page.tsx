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
        eyebrow="Invite access"
        title="Link a profile before opening your invite circle."
        body="Your invite code, progress, and reward balance stay attached to one LINE identity, so this page opens only once that profile is present."
        primaryHref="/auth/line"
        primaryLabel="Continue with LINE"
        secondaryHref="/"
        secondaryLabel="Back to home"
      />
    );
  }

  let surface;

  try {
    surface = await getViewerInviteSurface(viewerId);
  } catch {
    return (
      <InviteStateCard
        eyebrow="Invite unavailable"
        title="The invite circle is quiet for a moment."
        body="Your invite path is still attached to this profile, but the growth surface needs another pass before it opens clearly again."
        primaryHref="/invite"
        primaryLabel="Try again"
        secondaryHref="/points"
        secondaryLabel="Open points ledger"
      />
    );
  }

  return <InviteScreen surface={surface} />;
}
