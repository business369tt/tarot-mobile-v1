import Link from "next/link";

export default function NotFound() {
  return (
    <section className="flex min-h-screen items-center justify-center bg-background px-5 py-8 text-foreground">
      <div className="w-full max-w-[430px] rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(18,23,38,0.98),rgba(8,10,16,0.98))] p-6 shadow-[var(--shadow-device)]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-brand-strong">
          Not found
        </p>
        <h1 className="mt-4 font-display text-[2.2rem] leading-[0.94] text-card-foreground">
          This doorway
          <br />
          is not part of the reading.
        </h1>
        <p className="mt-4 text-sm leading-7 text-muted">
          The page may have moved, expired, or never belonged to this flow.
          Return home and reopen the next step from there.
        </p>
        <div className="mt-6 grid gap-3">
          <Link
            href="/"
            className="min-h-[3.5rem] rounded-[1.35rem] border border-line-strong bg-brand px-4 py-4 text-center text-sm font-semibold leading-5 text-black transition hover:bg-brand-strong"
          >
            Back to home
          </Link>
          <Link
            href="/reading"
            className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 bg-white/[0.05] px-4 py-4 text-center text-sm font-semibold leading-5 text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07]"
          >
            Open reading
          </Link>
        </div>
      </div>
    </section>
  );
}
