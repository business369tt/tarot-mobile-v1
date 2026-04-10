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
        eyebrow="歷史紀錄"
        eyebrowEn="History"
        title="登入後就能回看每一次答案"
        titleEn="Sign in to view history"
        body="你的主解讀、追問與後續紀錄，會跟著同一個登入身分一起保留。"
        bodyEn="History stays attached to the same signed-in profile."
        primaryHref="/auth/line"
        primaryLabel="登入查看紀錄"
        secondaryHref="/"
        secondaryLabel="返回首頁"
      />
    );
  }

  const records = await getViewerHistoryList(viewerId);

  if (records.length === 0) {
    return (
      <HistoryStateCard
        eyebrow="尚未累積紀錄"
        eyebrowEn="No history yet"
        title="完成並保存的解讀，之後都會留在這裡"
        titleEn="Finished readings will appear here"
        body="從一個新問題開始，完成解讀後保留下來，之後就能回來沿著同一條線繼續看。"
        bodyEn="Start a new question and save the reading when it finishes."
        primaryHref="/question"
        primaryLabel="開始新的提問"
        secondaryHref="/"
        secondaryLabel="返回首頁"
      />
    );
  }

  return <HistoryListScreen records={records} />;
}
