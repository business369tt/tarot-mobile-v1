import Link from "next/link";

export default function NotFound() {
  return (
    <section className="flex min-h-screen items-center justify-center bg-background px-5 py-8 text-foreground">
      <div className="w-full max-w-[430px] rounded-[2rem] bg-[linear-gradient(180deg,rgba(18,23,38,0.98),rgba(8,10,16,0.98))] p-6 shadow-[var(--shadow-device)]">
        <p className="text-sm text-foreground/56">找不到頁面</p>
        <h1 className="mt-4 text-[2.2rem] font-semibold leading-[0.96] tracking-tight text-card-foreground">
          這裡沒有內容
        </h1>
        <p className="mt-4 text-sm leading-7 text-foreground/62">
          這個頁面可能不存在，或已經換位置了。
        </p>
        <div className="mt-6 grid gap-3">
          <Link
            href="/"
            className="min-h-[3.5rem] rounded-[1.35rem] bg-white px-4 py-4 text-center text-sm font-semibold leading-5 text-black transition hover:opacity-92"
          >
            回到首頁
          </Link>
          <Link
            href="/question"
            className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 bg-white/[0.05] px-4 py-4 text-center text-sm font-medium leading-5 text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07]"
          >
            開始抽牌
          </Link>
        </div>
      </div>
    </section>
  );
}
