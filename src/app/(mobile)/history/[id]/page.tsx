import { auth } from "@/auth";
import { HistoryDetailScreen } from "@/components/history/history-detail-screen";
import { HistoryStateCard } from "@/components/history/history-states";
import { getViewerHistoryDetail } from "@/lib/history-records";

export default async function HistoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const viewerId = session?.user?.id ?? null;

  if (!viewerId) {
    return (
      <HistoryStateCard
        eyebrow="Archive access"
        title="Link a profile before opening this record."
        body="A saved report can only be reopened from the LINE profile that originally held it."
        primaryHref="/auth/line"
        primaryLabel="Continue with LINE"
        secondaryHref="/history"
        secondaryLabel="Back to archive"
      />
    );
  }

  const record = await getViewerHistoryDetail(viewerId, id);

  if (!record) {
    return (
      <HistoryStateCard
        eyebrow="Archive unavailable"
        title="This record is not available from the current profile."
        body="It may belong to another LINE identity, or it may never have been saved into the archive in the first place."
        primaryHref="/history"
        primaryLabel="Back to archive"
        secondaryHref="/question"
        secondaryLabel="Begin a new question"
      />
    );
  }

  return <HistoryDetailScreen record={record} />;
}
