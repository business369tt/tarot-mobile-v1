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
      <div className="space-y-4 pt-3">
        <span className="inline-flex items-center rounded-full border border-[#f1c98d]/18 bg-[#f1c98d]/8 px-3 py-1 text-[0.72rem] font-medium tracking-[0.18em] text-[#f3d4a7]">
          {t("HISTORY ARCHIVE", "HISTORY ARCHIVE")}
        </span>
        <div className="space-y-3">
          <h1 className="max-w-[15rem] text-[2.7rem] font-semibold leading-[1.02] tracking-tight text-card-foreground">
            {t("每一次完成的答案，都會留在這裡", "Every finished reading stays here")}
          </h1>
          <p className="max-w-[18rem] text-base leading-7 text-foreground/62">
            {t(
              "把主解讀、追問與三張牌放回同一條線裡，之後回看時，你不用重新進入整個流程。",
              "Return here to revisit the spread, main reading, and follow-ups together.",
            )}
          </p>
        </div>
      </div>

      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(18,23,38,0.98),rgba(8,10,16,0.98))] p-5 shadow-[var(--shadow-soft)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(185,144,93,0.14),_transparent_38%)]" />
        <div className="pointer-events-none absolute right-[-4rem] top-[-3rem] h-44 w-44 rounded-full border border-[#f0cb97]/10 opacity-60" />

        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/56">
                  {t("已保存紀錄", "Saved readings")}
                </span>
                {latestRecord ? (
                  <span className="text-xs text-foreground/52">
                    {t(`最近更新：${latestRecord.updatedLabel}`, `Latest: ${latestRecord.updatedLabel}`)}
                  </span>
                ) : null}
              </div>
              <h2 className="max-w-[15rem] text-[2rem] font-semibold leading-[1.04] tracking-tight text-card-foreground">
                {t(
                  `目前累積 ${records.length} 份可回看的解讀`,
                  `${records.length} saved readings`,
                )}
              </h2>
              <p className="max-w-[18rem] text-sm leading-7 text-foreground/68">
                {latestRecord
                  ? t(
                      `最新一份建立於 ${latestRecord.createdLabel}，可以直接回到原本的提問、主解讀與後續追問。`,
                      `Your latest reading was saved on ${latestRecord.createdLabel}.`,
                    )
                  : t("完成並保存後，解讀會穩定留在這裡。", "Saved readings will stay here.")}
              </p>
            </div>

            <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-foreground/68">
              {t("可回看", "Archive")}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-[1.3rem] border border-white/10 bg-black/18 p-4">
              <p className="text-sm text-foreground/56">{t("解讀數", "Readings")}</p>
              <p className="mt-2 text-lg font-semibold text-card-foreground">
                {records.length}
              </p>
            </div>
            <div className="rounded-[1.3rem] border border-white/10 bg-black/18 p-4">
              <p className="text-sm text-foreground/56">{t("追問數", "Follow-ups")}</p>
              <p className="mt-2 text-lg font-semibold text-card-foreground">
                {totalFollowups}
              </p>
            </div>
            <div className="rounded-[1.3rem] border border-white/10 bg-black/18 p-4">
              <p className="text-sm text-foreground/56">{t("已用點數", "Points")}</p>
              <p className="mt-2 text-lg font-semibold text-card-foreground">
                {totalSpentPoints}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4">
        {records.map((record) => (
          <article
            key={record.id}
            className="rounded-[1.85rem] border border-white/8 bg-white/[0.04] p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/56">
                    {inlineText(record.categoryLabel)}
                  </span>
                  {record.hasFollowup ? (
                    <span className="rounded-full border border-[#f0cb97]/14 bg-[#f0cb97]/8 px-2.5 py-1 text-[10px] font-medium text-[#f3d4a7]">
                      {t(`含 ${record.followupCount} 則追問`, `${record.followupCount} follow-ups`)}
                    </span>
                  ) : null}
                </div>
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
                  className="rounded-full border border-white/10 bg-black/18 px-3 py-2 text-xs text-foreground/62"
                >
                  {`${inlineText(card.name)} · ${inlineText(card.orientation)}`}
                </span>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-[1.2rem] border border-white/10 bg-black/18 px-4 py-3 text-foreground/62">
                <p>{t("追問數量", "Follow-ups")}</p>
                <p className="mt-1 font-semibold text-card-foreground">
                  {t(`${record.followupCount} 則`, `${record.followupCount} total`)}
                </p>
              </div>
              <div className="rounded-[1.2rem] border border-white/10 bg-black/18 px-4 py-3 text-foreground/62">
                <p>{t("累積點數", "Points spent")}</p>
                <p className="mt-1 font-semibold text-card-foreground">
                  {t(`${record.totalSpentPoints} 點`, `${record.totalSpentPoints} pts`)}
                </p>
              </div>
            </div>

            <Link
              href={`/history/${record.id}`}
              className="mt-5 inline-flex min-h-[3.45rem] w-full items-center justify-center rounded-[1.35rem] border border-[#f7d9b2]/55 bg-[linear-gradient(180deg,#f5d49f_0%,#eabf80_46%,#d89e58_100%)] px-4 text-sm font-semibold text-[#1b1209] shadow-[0_18px_52px_rgba(225,166,92,0.2),inset_0_1px_0_rgba(255,255,255,0.3)] transition hover:-translate-y-px hover:brightness-[1.03]"
            >
              {t("打開這份解讀", "Open this reading")}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
