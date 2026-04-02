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
        eyebrow="查看紀錄"
        eyebrowEn="History"
        title="先登入再打開這筆紀錄"
        titleEn="Sign in to open this record"
        body="這筆內容只會跟著原本的 LINE 身份。"
        bodyEn="This record stays with the LINE profile that opened it."
        primaryHref="/auth/line"
        primaryLabel="使用 LINE 登入"
        secondaryHref="/history"
        secondaryLabel="回到紀錄"
      />
    );
  }

  const record = await getViewerHistoryDetail(viewerId, id);

  if (!record) {
    return (
      <HistoryStateCard
        eyebrow="找不到紀錄"
        eyebrowEn="Record unavailable"
        title="這筆紀錄目前無法打開"
        titleEn="This record is unavailable"
        body="它可能不屬於你目前的身份，或尚未保存。"
        bodyEn="It may belong to another profile, or it may not have been saved."
        primaryHref="/history"
        primaryLabel="回到紀錄"
        secondaryHref="/question"
        secondaryLabel="開始新的解讀"
      />
    );
  }

  return <HistoryDetailScreen record={record} />;
}
