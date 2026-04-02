"use client";

import { useLocale } from "@/components/i18n/locale-provider";
import {
  getCardDisplayMeta,
  getCardRoleDisplayMeta,
  getOrientationDisplayMeta,
  type SelectedTarotCard,
} from "@/lib/mock-tarot-data";

type CardVariant = "fan" | "compact" | "report" | "stage";

const backSizeClass: Record<CardVariant, string> = {
  fan: "h-[10.6rem] w-[6.35rem] rounded-[1.4rem] p-3 sm:h-[11.25rem] sm:w-[7rem] sm:rounded-[1.55rem]",
  compact:
    "h-[7.8rem] w-full rounded-[1.2rem] p-3 sm:h-[8.5rem] sm:rounded-[1.35rem]",
  report:
    "h-[10rem] w-full rounded-[1.35rem] p-3.5 sm:h-[11.25rem] sm:rounded-[1.5rem] sm:p-4",
  stage:
    "h-[14.25rem] w-full rounded-[1.45rem] p-3.5 sm:h-[17.5rem] sm:rounded-[1.8rem] sm:p-4",
};

const faceSizeClass: Record<CardVariant, string> = {
  fan: "h-[10.6rem] w-[6.35rem] rounded-[1.4rem] p-3 sm:h-[11.25rem] sm:w-[7rem] sm:rounded-[1.55rem]",
  compact:
    "h-[7.8rem] w-full rounded-[1.2rem] p-3 sm:h-[8.5rem] sm:rounded-[1.35rem]",
  report:
    "h-[10rem] w-full rounded-[1.35rem] p-3.5 sm:h-[11.25rem] sm:rounded-[1.5rem] sm:p-4",
  stage:
    "h-[14.25rem] w-full rounded-[1.45rem] p-3.5 sm:h-[17.5rem] sm:rounded-[1.8rem] sm:p-4",
};

const titleClass: Record<CardVariant, string> = {
  fan: "text-[15px] sm:text-base",
  compact: "text-[13px] sm:text-sm",
  report: "text-[15px] sm:text-base",
  stage: "text-base sm:text-lg",
};

const toneClass: Record<CardVariant, string> = {
  fan: "text-[11px] leading-5 max-h-[2.6rem] overflow-hidden sm:text-xs",
  compact:
    "text-[10px] leading-4 max-h-[2.35rem] overflow-hidden sm:text-[11px] sm:leading-5 sm:max-h-[2.5rem]",
  report:
    "text-[11px] leading-5 max-h-[2.6rem] overflow-hidden sm:text-xs sm:max-h-[2.8rem]",
  stage:
    "text-[13px] leading-5 max-h-[3.9rem] overflow-hidden sm:text-sm sm:leading-6 sm:max-h-[4.5rem]",
};

export function TarotCardBack({
  order,
  variant,
  selected = false,
}: Readonly<{
  order: number;
  variant: CardVariant;
  selected?: boolean;
}>) {
  const { t } = useLocale();

  return (
    <div
      className={`${backSizeClass[variant]} relative overflow-hidden border border-white/12 bg-[linear-gradient(180deg,rgba(18,23,38,0.98),rgba(8,10,16,0.98))] shadow-[0_16px_40px_rgba(0,0,0,0.35)] ${
        selected ? "ring-1 ring-[rgba(229,192,142,0.34)]" : ""
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(185,144,93,0.16),_transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0))]" />
      <div className="relative flex h-full flex-col justify-between rounded-[inherit] border border-white/8 px-1 py-1">
        <div className="flex items-center justify-between text-[9px] font-semibold uppercase tracking-[0.24em] text-foreground/34">
          <span>{t("牌背", "Arcana")}</span>
          <span>{String(order).padStart(2, "0")}</span>
        </div>

        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[rgba(229,192,142,0.24)] bg-[radial-gradient(circle,_rgba(185,144,93,0.14),_transparent_68%)]">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 text-sm font-semibold tracking-[0.34em] text-brand-strong">
            OM
          </div>
        </div>

        <p className="text-center text-[9px] font-semibold uppercase tracking-[0.24em] text-foreground/44">
          {t("慢慢選", "Choose gently")}
        </p>
      </div>
    </div>
  );
}

export function TarotCardFace({
  card,
  variant,
  showNarrative = true,
}: Readonly<{
  card: SelectedTarotCard;
  variant: CardVariant;
  showNarrative?: boolean;
}>) {
  const { locale } = useLocale();
  const display = getCardDisplayMeta(card.id);
  const roleDisplay = getCardRoleDisplayMeta(card.role);
  const orientationDisplay = getOrientationDisplayMeta(card.orientation);
  const isZh = locale === "zh-TW";
  const orientationText =
    card.orientation === "upright"
      ? isZh
        ? display.uprightZh
        : display.uprightEn
      : isZh
        ? display.reversedZh
        : display.reversedEn;
  const visibleKeywords = (
    isZh ? display.keywordsZh : display.keywordsEn
  ).slice(0, variant === "compact" ? 1 : variant === "report" ? 2 : 3);
  const keywordClass =
    variant === "compact"
      ? "px-2 py-1 text-[9px] tracking-[0.16em]"
      : variant === "report"
        ? "px-2 py-1 text-[9px] tracking-[0.16em] sm:px-2.5 sm:text-[10px] sm:tracking-[0.18em]"
        : "px-2.5 py-1 text-[10px] tracking-[0.18em]";

  return (
    <div
      className={`${faceSizeClass[variant]} relative overflow-hidden border border-[rgba(229,192,142,0.16)] bg-[linear-gradient(180deg,rgba(25,31,46,0.98),rgba(11,15,24,0.98))] shadow-[0_16px_40px_rgba(0,0,0,0.38)]`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(185,144,93,0.18),_transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0))]" />
      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-brand-strong">
              {isZh ? display.arcanaZh : display.arcanaEn}
            </p>
            <h3
              className={`mt-2 font-display leading-none text-card-foreground ${titleClass[variant]}`}
            >
              {isZh ? display.nameZh : display.nameEn}
            </h3>
          </div>

          <div className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-foreground/56">
            {card.sigil}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 text-[10px]">
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-foreground/60">
            {isZh ? orientationDisplay.zh : orientationDisplay.en}
          </span>
          <span className="text-right text-brand-strong">
            {isZh ? roleDisplay.labelZh : roleDisplay.labelEn}
          </span>
        </div>

        <div className={`mt-4 text-foreground/76 ${toneClass[variant]}`}>
          <p>{isZh ? display.toneZh : display.toneEn}</p>
        </div>

        {showNarrative ? (
          <div className="mt-3">
            <p className="text-sm leading-6 text-muted">{orientationText}</p>
          </div>
        ) : null}

        <div className="mt-auto pt-4">
          <div className="flex flex-wrap gap-2">
            {visibleKeywords.map((keyword) => (
              <span
                key={keyword}
                className={`rounded-full border border-white/10 bg-white/[0.04] text-foreground/54 ${keywordClass}`}
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
