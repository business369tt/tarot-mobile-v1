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

  return (
    <section className="flex flex-1 flex-col gap-5 py-6">
      <div className="space-y-3 pt-4">
        <p className="text-sm text-foreground/56">{t("我的紀錄", "History")}</p>
        <h1 className="max-w-[12rem] text-[2.6rem] font-semibold leading-[1.02] tracking-tight text-card-foreground">
          {t("回來看之前的解讀", "Return to past readings")}
        </h1>
        <p className="max-w-[18rem] text-base leading-7 text-foreground/62">
          {t("這裡只保留你完成並保存的內容。", "Only finished readings that were saved will stay here.")}
        </p>
      </div>

      <div className="grid gap-4">
        {records.map((record) => (
          <article
            key={record.id}
            className="rounded-[1.8rem] bg-white/[0.04] p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-foreground/56">
                  {inlineText(record.categoryLabel)}
                </p>
                <h2 className="mt-2 text-xl font-semibold leading-8 text-card-foreground">
                  {record.question}
                </h2>
              </div>

              <span className="text-sm text-foreground/56">
                {record.createdLabel}
              </span>
            </div>

            <p className="mt-4 text-sm leading-7 text-foreground/62">
              {record.reportTitle || inlineText(record.categoryDescription)}
            </p>

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
              className="mt-5 inline-flex min-h-[3.2rem] w-full items-center justify-center rounded-[1.3rem] bg-white px-4 text-sm font-semibold text-black transition hover:opacity-92"
            >
              {t("查看", "Open")}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
