"use client";

import Link from "next/link";
import { TarotCardFace } from "@/components/flow/tarot-card";
import { useLocale } from "@/components/i18n/locale-provider";
import type { HistoryDetailRecord } from "@/lib/history-records";

export function HistoryDetailScreen({
  record,
}: {
  record: HistoryDetailRecord;
}) {
  const { inlineText, locale, t } = useLocale();
  const { reading, followups } = record;
  const detailDateFormatter = new Intl.DateTimeFormat(
    locale === "zh-TW" ? "zh-TW" : "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    },
  );

  return (
    <section className="flex flex-1 flex-col gap-5 py-6">
      <div className="space-y-3 pt-4">
        <p className="text-sm text-foreground/56">
          {inlineText(record.categoryLabel)}
        </p>
        <h1 className="max-w-[15rem] text-[2.4rem] font-semibold leading-[1.02] tracking-tight text-card-foreground">
          {reading.fullReading?.reportTitle || reading.question}
        </h1>
        <p className="max-w-[18rem] text-base leading-7 text-foreground/62">
          {reading.fullReading?.reportSubtitle ||
            t("保留當時的牌面、解讀與後續追問。", "This keeps the spread, reading, and later follow-ups together.")}
        </p>
      </div>

      <div className="rounded-[1.8rem] bg-white/[0.04] p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-foreground/56">{t("原始問題", "Question")}</p>
            <p className="mt-2 text-sm leading-7 text-card-foreground">
              &ldquo;{reading.question}&rdquo;
            </p>
          </div>
          <span className="text-sm text-foreground/56">{record.createdLabel}</span>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4 text-sm text-foreground/56">
          <span>
            {t(`解讀 ${record.readingSpentPoints} 點`, `${record.readingSpentPoints} pts`)}
          </span>
          <span>
            {t(`追問 ${record.followupSpentPoints} 點`, `${record.followupSpentPoints} pts follow-up`)}
          </span>
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(18,23,38,0.98),rgba(8,10,16,0.98))] p-4 shadow-[var(--shadow-soft)]">
        <div className="grid grid-cols-3 gap-2">
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

      <div className="grid gap-4">
        {record.readingSections.map((section) => (
          <article
            key={section.id}
            className="rounded-[1.7rem] bg-white/[0.04] p-5"
          >
            <p className="text-sm text-foreground/56">
              {inlineText(section.eyebrow)}
            </p>
            <h3 className="mt-2 text-xl font-semibold leading-8 text-card-foreground">
              {inlineText(section.title)}
            </h3>
            <p className="mt-4 text-sm leading-8 text-foreground/76">
              {section.body}
            </p>
          </article>
        ))}
      </div>

      <div className="rounded-[1.8rem] bg-white/[0.04] p-5">
        <h3 className="text-lg font-semibold text-card-foreground">
          {t("追問紀錄", "Follow-ups")}
        </h3>

        {followups.length > 0 ? (
          <div className="mt-4 grid gap-4">
            {followups.map((followup, index) => (
              <article
                key={followup.id}
                className="rounded-[1.4rem] border border-white/10 bg-black/18 p-4"
              >
                <p className="text-sm text-foreground/56">
                  {t(`追問 ${index + 1}`, `Follow-up ${index + 1}`)}
                </p>
                <h4 className="mt-2 text-lg font-semibold leading-7 text-card-foreground">
                  {followup.prompt}
                </h4>
                <p className="mt-2 text-sm text-foreground/56">
                  {detailDateFormatter.format(new Date(followup.createdAt))}
                </p>
                <p className="mt-4 whitespace-pre-line text-sm leading-8 text-foreground/76">
                  {followup.answer}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm leading-7 text-foreground/62">
            {t("這份解讀還沒有追問。", "There are no follow-ups for this reading yet.")}
          </p>
        )}
      </div>

      <div className="grid gap-3">
        <Link
          href="/history"
          className="min-h-[3.75rem] rounded-[1.5rem] bg-white px-5 py-4 text-center text-base font-semibold text-black transition hover:opacity-92"
        >
          {t("回到紀錄", "Back to history")}
        </Link>
        <Link
          href="/question"
          className="min-h-[3.75rem] rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-5 py-4 text-center text-base font-medium text-card-foreground transition hover:border-white/16 hover:bg-white/[0.06]"
        >
          {t("開始新的解讀", "Start a new reading")}
        </Link>
      </div>
    </section>
  );
}
