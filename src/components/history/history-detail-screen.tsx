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
  const heroSummary =
    reading.fullReading?.questionCore ||
    reading.fullReading?.progression ||
    reading.fullReading?.nearTermTrend ||
    null;
  const spotlightSections = record.readingSections.slice(0, 3);
  const remainingSections = record.readingSections.slice(3);

  return (
    <section className="flex flex-1 flex-col gap-5 py-6">
      <div className="space-y-4 pt-3">
        <span className="inline-flex items-center rounded-full border border-[#f1c98d]/18 bg-[#f1c98d]/8 px-3 py-1 text-[0.72rem] font-medium tracking-[0.18em] text-[#f3d4a7]">
          {t("SAVED READING", "SAVED READING")}
        </span>
        <div className="space-y-3">
          <p className="text-sm text-foreground/56">
            {inlineText(record.categoryLabel)}
          </p>
          <h1 className="max-w-[15rem] text-[2.55rem] font-semibold leading-[1.02] tracking-tight text-card-foreground">
            {reading.fullReading?.reportTitle || reading.question}
          </h1>
          <p className="max-w-[18rem] text-base leading-7 text-foreground/62">
            {reading.fullReading?.reportSubtitle ||
              t(
                "這份保存紀錄把當時的三張牌、主解讀與後續追問放回同一條線裡。",
                "This keeps the spread, reading, and later follow-ups together.",
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
                  {t("已保存解讀", "Saved reading")}
                </span>
                <span className="text-xs text-foreground/52">{`MiniMax · ${reading.model}`}</span>
              </div>
              <h2 className="max-w-[16rem] text-[2rem] font-semibold leading-[1.04] tracking-tight text-card-foreground">
                {t(
                  "這份答案保留了當下最完整的脈絡",
                  "This reading keeps the original answer intact",
                )}
              </h2>
              <p className="max-w-[18rem] text-sm leading-7 text-foreground/68">
                {t(
                  "你可以直接回看當時的問題、三張牌、主解讀與後續追問，而不用重新走一次流程。",
                  "Revisit the spread, main reading, and follow-ups without replaying the flow.",
                )}
              </p>
            </div>

            <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-foreground/68">
              {record.createdLabel}
            </span>
          </div>

          <div className="mt-5 rounded-[1.45rem] border border-white/10 bg-black/18 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/42">
              {t("當時的提問", "Question")}
            </p>
            <p className="mt-3 text-sm leading-7 text-card-foreground">
              &ldquo;{reading.question}&rdquo;
            </p>
            {heroSummary ? (
              <p className="mt-3 text-sm leading-7 text-foreground/68">
                {heroSummary}
              </p>
            ) : null}
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-[1.3rem] border border-white/10 bg-black/18 p-4">
              <p className="text-sm text-foreground/56">{t("主解讀點數", "Reading")}</p>
              <p className="mt-2 text-lg font-semibold text-card-foreground">
                {record.readingSpentPoints}
              </p>
            </div>
            <div className="rounded-[1.3rem] border border-white/10 bg-black/18 p-4">
              <p className="text-sm text-foreground/56">{t("追問數量", "Follow-ups")}</p>
              <p className="mt-2 text-lg font-semibold text-card-foreground">
                {record.followupCount}
              </p>
            </div>
            <div className="rounded-[1.3rem] border border-white/10 bg-black/18 p-4">
              <p className="text-sm text-foreground/56">{t("累積點數", "Points")}</p>
              <p className="mt-2 text-lg font-semibold text-card-foreground">
                {record.totalSpentPoints}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(18,23,38,0.98),rgba(8,10,16,0.98))] p-4 shadow-[var(--shadow-soft)]">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-foreground/46">{t("三張牌快照", "Saved spread")}</p>
            <h3 className="mt-2 text-lg font-semibold text-card-foreground">
              {t(
                "保留當時翻出的牌面與位置",
                "Return to the same reading through the original spread",
              )}
            </h3>
          </div>
          <span className="text-sm text-foreground/52">
            {t(`最後更新：${record.updatedLabel}`, `Updated ${record.updatedLabel}`)}
          </span>
        </div>

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
      </section>

      {spotlightSections.length > 0 ? (
        <div className="grid gap-4">
          {spotlightSections.map((section, index) => (
            <article
              key={section.id}
              className={`rounded-[1.8rem] border p-5 ${
                index === 0
                  ? "border-[#f0cb97]/16 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))]"
                  : "border-white/8 bg-white/[0.04]"
              }`}
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
      ) : null}

      {remainingSections.length > 0 ? (
        <div className="grid gap-4">
          {remainingSections.map((section) => (
            <article
              key={section.id}
              className="rounded-[1.8rem] border border-white/8 bg-white/[0.04] p-5"
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
      ) : null}

      <section className="rounded-[1.9rem] border border-white/8 bg-white/[0.04] p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm text-foreground/46">{t("追問紀錄", "Follow-ups")}</p>
            <h3 className="text-lg font-semibold text-card-foreground">
              {followups.length > 0
                ? t("沿著同一條答案繼續下去的提問", "Follow-ups that continued the same thread")
                : t("這份解讀還沒有追問紀錄", "There are no follow-ups yet")}
            </h3>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-foreground/68">
            {t(`${followups.length} 則`, `${followups.length} total`)}
          </span>
        </div>

        {followups.length > 0 ? (
          <div className="mt-4 grid gap-4">
            {followups.map((followup, index) => (
              <article
                key={followup.id}
                className="rounded-[1.45rem] border border-white/10 bg-black/18 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/56">
                        {t(`追問 ${index + 1}`, `Follow-up ${index + 1}`)}
                      </span>
                      <span className="text-xs text-foreground/46">{`MiniMax · ${followup.model}`}</span>
                    </div>
                    <h4 className="text-lg font-semibold leading-7 text-card-foreground">
                      {followup.prompt}
                    </h4>
                  </div>
                  <span className="text-sm text-foreground/52">
                    {detailDateFormatter.format(new Date(followup.createdAt))}
                  </span>
                </div>

                <p className="mt-4 whitespace-pre-line text-sm leading-8 text-foreground/76">
                  {followup.answer}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm leading-7 text-foreground/62">
            {t(
              "如果你之後回到這份解讀繼續追問，新的內容也會一起保留在這裡。",
              "If you continue this reading with follow-ups later, they will also stay here.",
            )}
          </p>
        )}
      </section>

      <div className="grid gap-3">
        <Link
          href="/history"
          className="min-h-[3.75rem] rounded-[1.5rem] bg-white px-5 py-4 text-center text-base font-semibold text-black transition hover:opacity-92"
        >
          {t("返回歷史紀錄", "Back to history")}
        </Link>
        <Link
          href="/question"
          className="min-h-[3.75rem] rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-5 py-4 text-center text-base font-medium text-card-foreground transition hover:border-white/16 hover:bg-white/[0.06]"
        >
          {t("開始新的提問", "Start a new reading")}
        </Link>
      </div>
    </section>
  );
}
