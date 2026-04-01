import Link from "next/link";

export function PointsStateCard(props: {
  eyebrow: string;
  title: string;
  body: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <section className="flex flex-1 flex-col gap-4 px-4 pb-5 pt-4 sm:gap-5 sm:px-5 sm:pb-6 sm:pt-5">
      <div className="rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,rgba(21,27,41,0.98),rgba(12,15,24,0.96))] p-5 shadow-[var(--shadow-soft)] sm:rounded-[2rem] sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-brand-strong">
          {props.eyebrow}
        </p>
        <h2 className="mt-4 font-display text-[2rem] leading-[0.96] text-card-foreground sm:text-[2.25rem]">
          {props.title}
        </h2>
        <p className="mt-4 max-w-[18rem] text-sm leading-7 text-muted">
          {props.body}
        </p>
      </div>

      <div className="mt-auto grid gap-3">
        <Link
          href={props.primaryHref}
          className="min-h-[3.5rem] rounded-[1.35rem] border border-line-strong bg-brand px-4 py-4 text-center text-sm font-semibold leading-5 text-black transition hover:bg-brand-strong sm:rounded-[1.4rem]"
        >
          {props.primaryLabel}
        </Link>

        {props.secondaryHref && props.secondaryLabel ? (
          <Link
            href={props.secondaryHref}
            className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 bg-white/[0.05] px-4 py-4 text-center text-sm font-semibold leading-5 text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07] sm:rounded-[1.4rem]"
          >
            {props.secondaryLabel}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
