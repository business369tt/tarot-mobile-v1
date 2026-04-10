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
        eyebrow="歷史紀錄"
        eyebrowEn="History"
        title="登入後才能打開這份紀錄"
        titleEn="Sign in to open this record"
        body="這份解讀會保留在當初建立它的帳號底下，登入後就能接回原本的閱讀脈絡。"
        bodyEn="This record stays with the profile that opened it."
        primaryHref="/auth/line"
        primaryLabel="登入後繼續"
        secondaryHref="/history"
        secondaryLabel="返回歷史紀錄"
      />
    );
  }

  const record = await getViewerHistoryDetail(viewerId, id);

  if (!record) {
    return (
      <HistoryStateCard
        eyebrow="紀錄暫時無法開啟"
        eyebrowEn="Record unavailable"
        title="這份解讀目前不在你的可查看範圍內"
        titleEn="This record is unavailable"
        body="它可能屬於其他帳號，或是當初沒有被保存進歷史紀錄。"
        bodyEn="It may belong to another profile, or it may not have been saved."
        primaryHref="/history"
        primaryLabel="回到歷史列表"
        secondaryHref="/question"
        secondaryLabel="開始新的提問"
      />
    );
  }

  return <HistoryDetailScreen record={record} />;
}
