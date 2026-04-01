import Link from "next/link";
import type { HistoryListItem } from "@/lib/history-records";

export function HistoryListScreen({
  records,
}: {
  records: HistoryListItem[];
}) {
  return (
    <section className="flex flex-1 flex-col gap-4 px-4 pb-5 pt-4 sm:gap-5 sm:px-5 sm:pb-6 sm:pt-5">
      <div className="rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,rgba(21,27,41,0.98),rgba(12,15,24,0.96))] p-5 shadow-[var(--shadow-soft)] sm:rounded-[2rem] sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-brand-strong">
          Destiny archive
        </p>
        <h2 className="mt-4 font-display text-[2rem] leading-[0.96] text-card-foreground sm:text-[2.25rem]">
          A quiet shelf
          <br />
          for past readings.
        </h2>
        <p className="mt-4 max-w-[18rem] text-sm leading-7 text-muted">
          Every saved report stays here with its original question, three-card spread,
          and any follow-up thread that grew from it.
        </p>
      </div>

      <div className="grid gap-4">
        {records.map((record) => (
          <article
            key={record.id}
            className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 shadow-[var(--shadow-soft)] sm:rounded-[1.9rem] sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-strong">
                  {record.categoryLabel}
                </p>
                <h3 className="mt-3 text-[1.15rem] font-semibold leading-7 text-card-foreground">
                  {record.question}
                </h3>
              </div>

              <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-foreground/56">
                {record.createdLabel}
              </span>
            </div>

            <p className="mt-4 text-sm leading-7 text-muted">
              {record.reportTitle ||
                `${record.categoryDescription} held inside a three-card report.`}
            </p>

            <div className="mt-5 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.2em] text-foreground/52">
              {record.cardsSummary.map((card) => (
                <span
                  key={`${record.id}-${card.id}`}
                  className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2"
                >
                  {card.name} {card.orientation}
                </span>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="rounded-[1.25rem] border border-white/10 bg-black/18 p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/42">
                  Follow-up
                </p>
                <p className="mt-2 text-lg font-semibold text-card-foreground">
                  {record.followupCount}
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-white/10 bg-black/18 p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/42">
                  Points
                </p>
                <p className="mt-2 text-lg font-semibold text-card-foreground">
                  {record.totalSpentPoints}
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-white/10 bg-black/18 p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/42">
                  Updated
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-card-foreground">
                  {record.updatedLabel}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              <Link
                href={`/history/${record.id}`}
                className="min-h-[3.5rem] rounded-[1.35rem] border border-line-strong bg-brand px-4 py-4 text-center text-sm font-semibold leading-5 text-black transition hover:bg-brand-strong sm:rounded-[1.4rem]"
              >
                Open this archive
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
