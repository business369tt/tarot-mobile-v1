import { auth } from "@/auth";
import { HistoryListScreen } from "@/components/history/history-list-screen";
import { HistoryStateCard } from "@/components/history/history-states";
import { getViewerHistoryList } from "@/lib/history-records";

export default async function HistoryPage() {
  const session = await auth();
  const viewerId = session?.user?.id ?? null;

  if (!viewerId) {
    return (
      <HistoryStateCard
        eyebrow="Archive access"
        title="Link a profile before opening your archive."
        body="Saved readings stay attached to one LINE identity, so this shelf only opens once that profile is present."
        primaryHref="/auth/line"
        primaryLabel="Continue with LINE"
        secondaryHref="/"
        secondaryLabel="Back to home"
      />
    );
  }

  const records = await getViewerHistoryList(viewerId);

  if (records.length === 0) {
    return (
      <HistoryStateCard
        eyebrow="Archive empty"
        title="No saved readings have settled here yet."
        body="When a report is completed with history kept on, it will return to this shelf with its cards and follow-up thread."
        primaryHref="/question"
        primaryLabel="Begin a new question"
        secondaryHref="/"
        secondaryLabel="Back to home"
      />
    );
  }

  return <HistoryListScreen records={records} />;
}
