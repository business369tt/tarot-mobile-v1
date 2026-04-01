import Link from "next/link";
import { TarotCardFace } from "@/components/flow/tarot-card";
import type { HistoryDetailRecord } from "@/lib/history-records";

export function HistoryDetailScreen({
  record,
}: {
  record: HistoryDetailRecord;
}) {
  const { reading, followups } = record;

  return (
    <section className="flex flex-1 flex-col gap-4 px-4 pb-5 pt-4 sm:gap-5 sm:px-5 sm:pb-6 sm:pt-5">
      <div className="relative overflow-hidden rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,rgba(21,27,41,0.98),rgba(12,15,24,0.96))] p-5 shadow-[var(--shadow-soft)] sm:rounded-[2rem] sm:p-6">
        <div className="pointer-events-none absolute right-[-4rem] top-[-3rem] h-36 w-36 rounded-full bg-[radial-gradient(circle,_rgba(185,144,93,0.18),_transparent_68%)] blur-3xl" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-brand-strong">
          Saved archive
        </p>
        <h2 className="mt-4 font-display text-[2.05rem] leading-[0.94] text-card-foreground sm:text-[2.3rem]">
          {reading.fullReading?.reportTitle || "Reading archive"}
        </h2>
        <p className="mt-4 max-w-[18rem] text-sm leading-7 text-muted">
          {reading.fullReading?.reportSubtitle ||
            "The original report, the spread that shaped it, and every follow-up that stayed with it."}
        </p>

        <div className="mt-6 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.22em] text-foreground/52">
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2">
            {record.categoryLabel}
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2">
            {record.followupCount} follow-up{record.followupCount === 1 ? "" : "s"}
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2">
            {record.totalSpentPoints} pts
          </span>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 sm:rounded-[1.9rem] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-foreground/42">
              Original question
            </p>
            <p className="mt-3 text-sm leading-7 text-card-foreground">
              &ldquo;{reading.question}&rdquo;
            </p>
          </div>

          <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-foreground/56">
            {record.createdLabel}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-[1.25rem] border border-white/10 bg-black/18 p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/42">
              Reading
            </p>
            <p className="mt-2 text-lg font-semibold text-card-foreground">
              {record.readingSpentPoints} pts
            </p>
          </div>
          <div className="rounded-[1.25rem] border border-white/10 bg-black/18 p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/42">
              Follow-up
            </p>
            <p className="mt-2 text-lg font-semibold text-card-foreground">
              {record.followupSpentPoints} pts
            </p>
          </div>
          <div className="rounded-[1.25rem] border border-white/10 bg-black/18 p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/42">
              Last touched
            </p>
            <p className="mt-2 text-sm font-semibold leading-6 text-card-foreground">
              {record.updatedLabel}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-[1.85rem] border border-white/10 bg-[linear-gradient(180deg,rgba(18,23,38,0.98),rgba(8,10,16,0.98))] p-4 shadow-[var(--shadow-soft)] sm:rounded-[2rem] sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-strong">
              Three-card spread
            </p>
            <p className="mt-2 text-sm leading-6 text-muted">
              The exact spread that shaped this report.
            </p>
          </div>

          <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-foreground/56">
            Full view
          </span>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
          {reading.cardsSnapshot.map((card) => (
            <TarotCardFace
              key={card.id}
              card={card}
              variant="report"
              showNarrative={false}
            />
          ))}
        </div>
      </div>

      <div className="grid gap-5">
        {record.readingSections.map((section) => (
          <article
            key={section.id}
            className="rounded-[1.65rem] border border-white/10 bg-white/[0.04] p-5 sm:rounded-[1.75rem] sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-strong">
                  {section.eyebrow}
                </p>
                <h3 className="mt-3 text-[1.1rem] font-semibold leading-7 text-card-foreground">
                  {section.title}
                </h3>
              </div>

              <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-foreground/56">
                {section.accent}
              </span>
            </div>

            <div className="mt-5 h-px w-full bg-[linear-gradient(90deg,rgba(229,192,142,0.24),transparent)]" />
            <p className="mt-5 text-sm leading-8 text-foreground/76 sm:leading-[2.1rem]">
              {section.body}
            </p>
          </article>
        ))}
      </div>

      <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-5 sm:rounded-[1.95rem] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-strong">
              Follow-up timeline
            </p>
            <h3 className="mt-3 font-display text-[1.8rem] leading-[0.98] text-card-foreground">
              The thread that
              <br />
              continued afterward.
            </h3>
          </div>

          <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-foreground/56">
            {record.followupCount} entries
          </span>
        </div>

        {followups.length > 0 ? (
          <div className="mt-6 grid gap-4">
            {followups.map((followup, index) => (
              <article
                key={followup.id}
                className="rounded-[1.45rem] border border-white/10 bg-black/18 p-4 sm:rounded-[1.55rem] sm:p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-strong">
                      Follow-up {index + 1}
                    </p>
                    <h4 className="mt-3 text-[1.05rem] font-semibold leading-7 text-card-foreground">
                      {followup.prompt}
                    </h4>
                  </div>

                  <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-foreground/56">
                    {followup.costPoints} pts
                  </span>
                </div>

                <p className="mt-3 text-[11px] uppercase tracking-[0.2em] text-foreground/42">
                  {new Intl.DateTimeFormat("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  }).format(new Date(followup.createdAt))}
                </p>

                <div className="mt-4 h-px w-full bg-[linear-gradient(90deg,rgba(229,192,142,0.24),transparent)]" />
                <p className="mt-4 whitespace-pre-line text-sm leading-8 text-foreground/76 sm:leading-[2rem]">
                  {followup.answer}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-[1.45rem] border border-white/10 bg-black/18 p-5">
            <p className="text-sm leading-7 text-muted">
              This report stayed in its original shape. No follow-up thread was added
              after the first answer settled.
            </p>
          </div>
        )}
      </div>

      <div className="grid gap-3">
        <Link
          href="/history"
          className="min-h-[3.5rem] rounded-[1.35rem] border border-line-strong bg-brand px-4 py-4 text-center text-sm font-semibold leading-5 text-black transition hover:bg-brand-strong sm:rounded-[1.4rem]"
        >
          Back to archive
        </Link>
        <Link
          href="/question"
          className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 bg-white/[0.05] px-4 py-4 text-center text-sm font-semibold leading-5 text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07] sm:rounded-[1.4rem]"
        >
          Begin a new question
        </Link>
      </div>
    </section>
  );
}
