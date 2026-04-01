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
        eyebrow="紀錄入口"
        eyebrowEn="Archive access"
        title="先連結身份，才能打開你的解讀紀錄。"
        titleEn="Link a profile before opening your archive."
        body="已儲存的解讀會綁定在單一 LINE 身份下，所以這個收藏頁只有在該身份存在時才會開啟。"
        bodyEn="Saved readings stay attached to one LINE identity, so this shelf only opens once that profile is present."
        primaryHref="/auth/line"
        primaryLabel="使用 LINE 繼續（Continue with LINE）"
        secondaryHref="/"
        secondaryLabel="回到首頁（Back to home）"
      />
    );
  }

  const records = await getViewerHistoryList(viewerId);

  if (records.length === 0) {
    return (
      <HistoryStateCard
        eyebrow="紀錄空白"
        eyebrowEn="Archive empty"
        title="這裡還沒有任何已儲存的解讀。"
        titleEn="No saved readings have settled here yet."
        body="當一份報告完成且保留到紀錄後，它就會帶著牌陣與追問脈絡回到這個收藏頁。"
        bodyEn="When a report is completed with history kept on, it will return to this shelf with its cards and follow-up thread."
        primaryHref="/question"
        primaryLabel="開始新的提問（Begin a new question）"
        secondaryHref="/"
        secondaryLabel="回到首頁（Back to home）"
      />
    );
  }

  return <HistoryListScreen records={records} />;
}
