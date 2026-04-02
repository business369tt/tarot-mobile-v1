"use client";

import Link from "next/link";
import { useLocale } from "@/components/i18n/locale-provider";
import type { HistoryListItem } from "@/lib/history-records";

export function HistoryListScreen({
  records,
}: {
  records: HistoryListItem[];
}) {
  const { inlineText, t } = useLocale();
  const totalFollowups = records.reduce(
    (sum, record) => sum + record.followupCount,
    0,
  );
  const totalSpentPoints = records.reduce(
    (sum, record) => sum + record.totalSpentPoints,
    0,
  );
  const latestRecord = records[0] ?? null;

  return (
    <section className="flex flex-1 flex-col gap-5 py-6">
      <div className="space-y-3 pt-4">
        <p className="text-sm text-foreground/56">{t("我的紀錄", "History")}</p>
        <h1 className="max-w-[13rem] text-[2.6rem] font-semibold leading-[1.02] tracking-tight text-card-foreground">
          {t("每次完整解讀，都留在這裡", "Every finished reading stays here")}
        </h1>
        <p className="max-w-[18rem] text-base leading-7 text-foreground/62">
          {t(
            "回來重看牌面、主解讀與追問時，這裡會替你保留原本的脈絡。",
            "Return here to revisit the spread, main reading, and follow-ups together.",
          )}
        </p>
      </div>

      <div className="rounded-[1.9rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <h2 className="max-w-[14rem] text-[1.95rem] font-semibold leading-[1.02] tracking-tight text-card-foreground">
              {t(
                `已保存 ${records.length} 份解讀`,
                `${records.length} saved readings`,
              )}
            </h2>
            <p className="max-w-[18rem] text-sm leading-7 text-foreground/64">
              {latestRecord
                ? t(
                    `最近一份來自 ${latestRecord.createdLabel}，你可以從這裡重新打開並接回當時的問題。`,
                    `Your latest reading was saved on ${latestRecord.createdLabel}. Open it and return to the same thread.`,
                  )
                : t("完成並保存的解讀，會留在這裡。", "Saved readings will stay here.")}
            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-foreground/68">
            {t("已保存", "Saved")}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-[1.3rem] border border-white/10 bg-black/18 p-4">
            <p className="text-sm text-foreground/56">{t("解讀數量", "Readings")}</p>
            <p className="mt-2 text-lg font-semibold text-card-foreground">
              {records.length}
            </p>
          </div>
          <div className="rounded-[1.3rem] border border-white/10 bg-black/18 p-4">
            <p className="text-sm text-foreground/56">{t("追問次數", "Follow-ups")}</p>
            <p className="mt-2 text-lg font-semibold text-card-foreground">
              {totalFollowups}
            </p>
          </div>
          <div className="rounded-[1.3rem] border border-white/10 bg-black/18 p-4">
            <p className="text-sm text-foreground/56">{t("累計點數", "Points")}</p>
            <p className="mt-2 text-lg font-semibold text-card-foreground">
              {totalSpentPoints}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {records.map((record) => (
          <article
            key={record.id}
            className="rounded-[1.8rem] border border-white/8 bg-white/[0.04] p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-sm text-foreground/56">
                  {inlineText(record.categoryLabel)}
                </p>
                <h2 className="text-xl font-semibold leading-8 text-card-foreground">
                  {record.question}
                </h2>
                <p className="text-sm leading-7 text-foreground/62">
                  {record.reportTitle || inlineText(record.categoryDescription)}
                </p>
              </div>

              <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-foreground/68">
                {record.createdLabel}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {record.cardsSummary.map((card) => (
                <span
                  key={`${record.id}-${card.id}`}
                  className="rounded-full border border-white/10 bg-black/18 px-3 py-2 text-xs text-foreground/60"
                >
                  {`${inlineText(card.name)} · ${inlineText(card.orientation)}`}
                </span>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between gap-4 text-sm text-foreground/56">
              <span>
                {t(
                  `追問 ${record.followupCount} 次`,
                  `${record.followupCount} follow-ups`,
                )}
              </span>
              <span>
                {t(
                  `共 ${record.totalSpentPoints} 點`,
                  `${record.totalSpentPoints} pts spent`,
                )}
              </span>
            </div>

            <Link
              href={`/history/${record.id}`}
              className="mt-5 inline-flex min-h-[3.35rem] w-full items-center justify-center rounded-[1.35rem] bg-white px-4 text-sm font-semibold text-black transition hover:opacity-92"
            >
              {t("重新打開這份解讀", "Open this reading")}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
