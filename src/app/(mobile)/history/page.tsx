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
        eyebrow="查看紀錄"
        eyebrowEn="History"
        title="先登入再看紀錄"
        titleEn="Sign in to view history"
        body="紀錄會綁定在同一個 LINE 身份下。"
        bodyEn="History stays attached to the same LINE profile."
        primaryHref="/auth/line"
        primaryLabel="使用 LINE 登入"
        secondaryHref="/"
        secondaryLabel="回到首頁"
      />
    );
  }

  const records = await getViewerHistoryList(viewerId);

  if (records.length === 0) {
    return (
      <HistoryStateCard
        eyebrow="目前沒有紀錄"
        eyebrowEn="No history yet"
        title="完成的解讀會留在這裡"
        titleEn="Finished readings will appear here"
        body="開始一個新問題，並在完成後保存紀錄。"
        bodyEn="Start a new question and save the reading when it finishes."
        primaryHref="/question"
        primaryLabel="開始抽牌"
        secondaryHref="/"
        secondaryLabel="回到首頁"
      />
    );
  }

  return <HistoryListScreen records={records} />;
}
