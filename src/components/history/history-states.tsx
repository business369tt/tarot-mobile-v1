"use client";

import Link from "next/link";
import { useLocale } from "@/components/i18n/locale-provider";

export function HistoryStateCard(props: {
  eyebrow: string;
  eyebrowEn?: string;
  title: string;
  titleEn?: string;
  body: string;
  bodyEn?: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  const { locale } = useLocale();

  return (
    <section className="flex flex-1 flex-col justify-between gap-8 py-6">
      <div className="space-y-3 pt-6">
        <p className="text-sm text-foreground/56">
          {locale === "zh-TW" ? props.eyebrow : (props.eyebrowEn ?? props.eyebrow)}
        </p>
        <h1 className="max-w-[14rem] text-[2.5rem] font-semibold leading-[1.02] tracking-tight text-card-foreground">
          {locale === "zh-TW" ? props.title : (props.titleEn ?? props.title)}
        </h1>
        <p className="max-w-[18rem] text-base leading-7 text-foreground/62">
          {locale === "zh-TW" ? props.body : (props.bodyEn ?? props.body)}
        </p>
      </div>

      <div className="grid gap-3">
        <Link
          href={props.primaryHref}
          className="min-h-[3.75rem] rounded-[1.5rem] bg-white px-5 py-4 text-center text-base font-semibold text-black transition hover:opacity-92"
        >
          {props.primaryLabel}
        </Link>

        {props.secondaryHref && props.secondaryLabel ? (
          <Link
            href={props.secondaryHref}
            className="min-h-[3.75rem] rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-5 py-4 text-center text-base font-medium text-card-foreground transition hover:border-white/16 hover:bg-white/[0.06]"
          >
            {props.secondaryLabel}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
