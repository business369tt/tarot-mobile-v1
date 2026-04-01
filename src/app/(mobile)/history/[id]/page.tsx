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
        eyebrow="紀錄入口"
        eyebrowEn="Archive access"
        title="先連結身份，才能打開這份紀錄。"
        titleEn="Link a profile before opening this record."
        body="已儲存的報告只能從最初持有它的 LINE 身份重新開啟。"
        bodyEn="A saved report can only be reopened from the LINE profile that originally held it."
        primaryHref="/auth/line"
        primaryLabel="使用 LINE 繼續（Continue with LINE）"
        secondaryHref="/history"
        secondaryLabel="回到紀錄（Back to archive）"
      />
    );
  }

  const record = await getViewerHistoryDetail(viewerId, id);

  if (!record) {
    return (
      <HistoryStateCard
        eyebrow="紀錄不可用"
        eyebrowEn="Archive unavailable"
        title="目前身份無法開啟這份紀錄。"
        titleEn="This record is not available from the current profile."
        body="它可能屬於另一個 LINE 身份，或一開始就沒有被保存進紀錄中。"
        bodyEn="It may belong to another LINE identity, or it may never have been saved into the archive in the first place."
        primaryHref="/history"
        primaryLabel="回到紀錄（Back to archive）"
        secondaryHref="/question"
        secondaryLabel="開始新的提問（Begin a new question）"
      />
    );
  }

  return <HistoryDetailScreen record={record} />;
}
