"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useMemo, useState } from "react";
import { useLocale } from "@/components/i18n/locale-provider";
import type { MaybePointsIntent, PointPackage } from "@/lib/points";
import type {
  PointsLedgerData,
  PointsLedgerEntry,
} from "@/lib/points-ledger";
import type {
  PointsPaymentView,
  TopUpOrderView,
} from "@/lib/top-up-orders";

type PointsScreenProps = {
  initialLedger: PointsLedgerData;
  intent: MaybePointsIntent;
  returnTo: string;
  initialPayment: PointsPaymentView;
};

type TopUpCheckoutResponse = {
  status: "redirect";
  checkoutUrl: string;
  order: TopUpOrderView;
};

type TopUpOrderResponse = {
  order: TopUpOrderView | null;
};

type DailyCheckInResponse = {
  status: "claimed" | "already_claimed";
  ledger: PointsLedgerData;
};

const panelClass = "rounded-[1.8rem] border border-white/8 bg-white/[0.04] p-5";
const metricClass = "rounded-[1.25rem] border border-white/10 bg-black/18 p-4";

async function requestPointsLedger() {
  const response = await fetch("/api/points/current", { cache: "no-store" });
  if (!response.ok) throw new Error("POINTS_UNAVAILABLE");
  return (await response.json()) as PointsLedgerData;
}

async function requestTopUp(args: {
  packageId: string;
  requestKey: string;
  intent: MaybePointsIntent;
  returnTo: string;
}) {
  const response = await fetch("/api/points/top-up", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  const data = (await response.json().catch(() => ({}))) as Partial<
    TopUpCheckoutResponse & { message: string }
  >;

  if (!response.ok || !data.checkoutUrl || !data.order) {
    throw new Error(data.message || "這次補點沒有成功建立付款流程，請稍後再試一次。");
  }

  return data as TopUpCheckoutResponse;
}

async function requestTopUpOrder(orderId: string) {
  const response = await fetch(`/api/points/top-up/${orderId}`, {
    cache: "no-store",
  });
  const data = (await response.json().catch(() => ({ order: null }))) as Partial<
    TopUpOrderResponse & { message: string }
  >;

  if (!response.ok) {
    throw new Error(data.message || "這筆補點訂單目前無法查看。");
  }

  return data as TopUpOrderResponse;
}

async function requestDailyCheckIn() {
  const response = await fetch("/api/points/daily-check-in", { method: "POST" });
  if (!response.ok) throw new Error("CHECK_IN_FAILED");
  return (await response.json()) as DailyCheckInResponse;
}

function createTopUpRequestKey(packageId: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `points:${packageId}:${crypto.randomUUID()}`;
  }

  return `points:${packageId}:${Date.now().toString(36)}`;
}

function appendResumeParam(returnTo: string, resumeValue: string) {
  const [pathname, existingQuery = ""] = returnTo.split("?");
  const searchParams = new URLSearchParams(existingQuery);
  searchParams.set("resume", resumeValue);
  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function getPaymentNotice(payment: PointsPaymentView) {
  if (payment.surface === "success" && payment.order) {
    return `已透過 ${payment.order.providerLabel} 補入 ${payment.order.points} 點。`;
  }

  if (payment.surface === "settling") {
    return "付款正在確認中，點數會在完成後自動更新。";
  }

  return null;
}

function getPaymentError(payment: PointsPaymentView) {
  if (payment.surface === "failed") {
    return payment.message || "這次付款沒有完成。";
  }

  return null;
}

function getIntentLabel(intent: MaybePointsIntent) {
  if (intent === "followup") return "追問";
  if (intent === "reading") return "主解讀";
  return "點數";
}

function TransactionItem({
  entry,
  inlineText,
}: {
  entry: PointsLedgerEntry;
  inlineText: (value: string | null | undefined) => string;
}) {
  return (
    <article className={metricClass}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] text-foreground/56">
              {inlineText(entry.typeBadge)}
            </span>
            <span className="text-xs text-foreground/46">{entry.createdLabel}</span>
          </div>
          <h4 className="mt-3 text-lg font-semibold leading-7 text-card-foreground">
            {inlineText(entry.typeLabel)}
          </h4>
          <p className="mt-2 text-sm leading-7 text-foreground/76">
            {inlineText(entry.description)}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold text-card-foreground">
            {inlineText(entry.amountLabel)}
          </p>
          <p className="mt-2 text-sm text-foreground/56">
            {inlineText(entry.balanceAfterLabel)}
          </p>
        </div>
      </div>
      {entry.detailHref && entry.detailLabel ? (
        <Link
          href={entry.detailHref}
          className="mt-4 inline-flex text-sm font-medium text-brand-strong transition hover:text-brand"
        >
          {inlineText(entry.detailLabel)}
        </Link>
      ) : null}
    </article>
  );
}

export function PointsScreen(props: PointsScreenProps) {
  const router = useRouter();
  const { inlineText, t } = useLocale();
  const [ledger, setLedger] = useState(props.initialLedger);
  const [payment, setPayment] = useState(props.initialPayment);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isClaimingCheckIn, setIsClaimingCheckIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    getPaymentError(props.initialPayment),
  );
  const [noticeMessage, setNoticeMessage] = useState<string | null>(
    getPaymentNotice(props.initialPayment),
  );

  useEffect(() => {
    setLedger(props.initialLedger);
  }, [props.initialLedger]);

  useEffect(() => {
    setPayment(props.initialPayment);
    setErrorMessage(getPaymentError(props.initialPayment));
    setNoticeMessage(getPaymentNotice(props.initialPayment));
  }, [props.initialPayment]);

  const intentLabel = getIntentLabel(props.intent);
  const isFollowupIntent = props.intent === "followup";
  const actionCost = isFollowupIntent
    ? ledger.followupCostPoints
    : ledger.readingCostPoints;
  const recommendedPackageId = useMemo(() => {
    const target = props.intent ? actionCost : ledger.followupCostPoints;
    return (
      ledger.packages.find((item) => ledger.points + item.points >= target)?.id ??
      ledger.packages[0]?.id
    );
  }, [actionCost, ledger.followupCostPoints, ledger.packages, ledger.points, props.intent]);
  const recommendedPackage =
    ledger.packages.find((item) => item.id === recommendedPackageId) ?? null;
  const hasClaimedToday = ledger.dailyCheckIn.status === "claimed";
  const shortfallPoints = props.intent ? Math.max(actionCost - ledger.points, 0) : 0;
  const canReturnToFlow = Boolean(
    props.intent &&
      payment.surface !== "settling" &&
      (ledger.points >= actionCost || payment.surface === "success"),
  );
  const flowReturnHref =
    canReturnToFlow && isFollowupIntent
      ? appendResumeParam(props.returnTo, "followup")
      : props.returnTo;
  const showDailyCheckIn = !canReturnToFlow;
  const showPackages = !canReturnToFlow;
  const showTransactions = !props.intent;
  const heroTitle = props.intent
    ? canReturnToFlow
      ? `點數已經足夠，回到這次${intentLabel}`
      : `先補齊這次${intentLabel}需要的點數`
    : "查看點數與補點";

  useEffect(() => {
    if (payment.surface !== "settling" || !payment.order) return;
    let active = true;
    const intervalId = window.setInterval(async () => {
      try {
        const response = await requestTopUpOrder(payment.order!.id);
        if (!active) return;
        const nextOrder = response.order;

        if (!nextOrder) {
          setPayment({ surface: "failed", order: null, message: "這筆補點訂單目前無法重新打開。" });
          setErrorMessage("這筆補點訂單目前無法重新打開。");
          window.clearInterval(intervalId);
          return;
        }

        if (nextOrder.status === "paid") {
          setPayment({ surface: "success", order: nextOrder, message: "點數已經補入你的餘額。" });
          setNoticeMessage(`已透過 ${nextOrder.providerLabel} 補入 ${nextOrder.points} 點。`);
          setErrorMessage(null);
          window.clearInterval(intervalId);
          try {
            const nextLedger = await requestPointsLedger();
            if (!active) return;
            setLedger(nextLedger);
          } catch {
            startTransition(() => router.refresh());
          }
          return;
        }

        if (nextOrder.status === "failed" || nextOrder.status === "canceled") {
          const message =
            nextOrder.status === "failed"
              ? nextOrder.errorMessage || "這次付款沒有完成。"
              : "付款尚未完成，你可以稍後重新打開這筆補點。";
          setPayment({
            surface: nextOrder.status === "failed" ? "failed" : "canceled",
            order: nextOrder,
            message,
          });
          setNoticeMessage(null);
          setErrorMessage(nextOrder.status === "failed" ? message : null);
          window.clearInterval(intervalId);
        }
      } catch {
        if (!active) return;
        setPayment((current) => ({ ...current, surface: "failed", message: "暫時無法重新確認這筆付款，請稍後再試一次。" }));
        setNoticeMessage(null);
        setErrorMessage("暫時無法重新確認這筆付款，請稍後再試一次。");
        window.clearInterval(intervalId);
      }
    }, 2500);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [payment, router]);

  useEffect(() => {
    if (payment.surface !== "success" || !props.intent) return;
    const timer = window.setTimeout(() => {
      startTransition(() => {
        router.push(isFollowupIntent ? appendResumeParam(props.returnTo, "followup") : props.returnTo);
      });
    }, 1400);
    return () => window.clearTimeout(timer);
  }, [isFollowupIntent, payment, props.intent, props.returnTo, router]);

  async function refreshLedger() {
    try {
      const [nextLedger, nextOrder] = await Promise.all([
        requestPointsLedger(),
        payment.order ? requestTopUpOrder(payment.order.id) : Promise.resolve(null),
      ]);
      setLedger(nextLedger);
      if (nextOrder?.order) {
        const order = nextOrder.order;
        setPayment({
          surface:
            order.status === "paid"
              ? "success"
              : order.status === "failed"
                ? "failed"
                : order.status === "canceled"
                  ? "canceled"
                  : "settling",
          order,
          message:
            order.status === "paid"
              ? "點數已經補入你的餘額。"
              : order.status === "failed"
                ? order.errorMessage || "這次付款沒有完成。"
                : order.status === "canceled"
                  ? "付款尚未完成，你可以稍後重新打開這筆補點。"
                  : "付款已確認，系統正在更新點數餘額。",
        });
      }
      setErrorMessage(null);
    } catch {
      setErrorMessage("點數資料暫時無法更新，請稍後再試一次。");
    }
  }

  async function handleTopUp(selectedPackage: PointPackage) {
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setNoticeMessage(null);
      const response = await requestTopUp({
        packageId: selectedPackage.id,
        requestKey: createTopUpRequestKey(selectedPackage.id),
        intent: props.intent,
        returnTo: props.returnTo,
      });
      setPayment({
        surface: "settling",
        order: response.order,
        message: "付款頁面已開啟，系統正在等待付款結果。",
      });
      window.location.assign(response.checkoutUrl);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "這次補點沒有成功建立付款流程，請稍後再試一次。");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleDailyCheckIn() {
    try {
      setIsClaimingCheckIn(true);
      setErrorMessage(null);
      setNoticeMessage(null);
      const response = await requestDailyCheckIn();
      setLedger(response.ledger);
      setNoticeMessage(
        response.status === "claimed"
          ? `今日簽到完成，已補入 ${response.ledger.dailyCheckIn.rewardPoints} 點。`
          : "今天的每日點數你已經領過了。",
      );
      startTransition(() => router.refresh());
    } catch {
      setErrorMessage("今天的每日點數暫時無法領取，請稍後再試一次。");
    } finally {
      setIsClaimingCheckIn(false);
    }
  }

  return (
    <section className="flex flex-1 flex-col gap-5 py-6">
      <div className="space-y-3 pt-4">
        <p className="text-sm text-foreground/56">{props.intent ? `${intentLabel}補點` : "點數中心"}</p>
        <h1 className="max-w-[15rem] text-[2.6rem] font-semibold leading-[1.02] tracking-tight text-card-foreground">
          {heroTitle}
        </h1>
        <p className="max-w-[18rem] text-base leading-7 text-foreground/62">
          {props.intent
            ? canReturnToFlow
              ? "點數一到帳，我們就會把你帶回原本的流程，不需要重來。"
              : `這一步只差點數。補齊後就能回到這次${intentLabel}。`
            : "先看目前餘額，再決定要不要補點。"}
        </p>
      </div>

      {props.intent ? (
        <section className="relative overflow-hidden rounded-[2rem] border border-[rgba(229,192,142,0.18)] bg-[linear-gradient(180deg,rgba(18,23,38,0.98),rgba(8,10,16,0.98))] p-5 shadow-[var(--shadow-soft)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(185,144,93,0.14),_transparent_38%)]" />
          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <p className="text-sm text-foreground/56">{canReturnToFlow ? "已經準備好返回" : "先看清現在差多少"}</p>
                <h2 className="max-w-[15rem] text-[1.95rem] font-semibold leading-[1.02] tracking-tight text-card-foreground">
                  {canReturnToFlow ? `回到這次${intentLabel}繼續看` : `還差 ${shortfallPoints} 點`}
                </h2>
                <p className="max-w-[18rem] text-sm leading-7 text-foreground/68">
                  {canReturnToFlow
                    ? "你已經有足夠點數，不需要再補點。"
                    : `這次${intentLabel}需要 ${actionCost} 點，你目前有 ${ledger.points} 點。`}
                </p>
              </div>
              <span className="rounded-full border border-[rgba(229,192,142,0.18)] bg-[rgba(185,144,93,0.12)] px-3 py-1.5 text-xs font-medium text-[#f0cb97]">
                {canReturnToFlow ? "可返回" : "待補點"}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              {[
                ["目前點數", `${ledger.points}`],
                ["這步需要", `${actionCost}`],
                [canReturnToFlow ? "狀態" : "還差", canReturnToFlow ? "可返回" : `${shortfallPoints}`],
              ].map(([label, value]) => (
                <div key={label} className={metricClass}>
                  <p className="text-sm text-foreground/56">{label}</p>
                  <p className="mt-2 text-lg font-semibold text-card-foreground">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-3">
              {canReturnToFlow ? (
                <Link href={flowReturnHref} className="min-h-[3.6rem] rounded-[1.4rem] bg-white px-4 py-4 text-center text-sm font-semibold text-black transition hover:opacity-92">
                  {`回到這次${intentLabel}`}
                </Link>
              ) : showDailyCheckIn && !hasClaimedToday ? (
                <button type="button" disabled={isClaimingCheckIn} onClick={() => { void handleDailyCheckIn(); }} className="min-h-[3.6rem] rounded-[1.4rem] bg-white px-4 py-4 text-sm font-semibold text-black transition hover:opacity-92 disabled:cursor-not-allowed disabled:opacity-45">
                  {isClaimingCheckIn ? "領取中" : `先領今日 ${ledger.dailyCheckIn.rewardPoints} 點`}
                </button>
              ) : recommendedPackage ? (
                <button type="button" disabled={isProcessing || payment.surface === "settling"} onClick={() => { void handleTopUp(recommendedPackage); }} className="min-h-[3.6rem] rounded-[1.4rem] bg-white px-4 py-4 text-sm font-semibold text-black transition hover:opacity-92 disabled:cursor-not-allowed disabled:opacity-45">
                  {isProcessing ? "正在開啟付款" : "使用推薦補點包"}
                </button>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      <section className={panelClass}>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-card-foreground">點數概況</h2>
            <p className="text-sm leading-7 text-foreground/62">
              {props.intent ? "這裡會同步目前餘額與解讀成本。" : "先看餘額，再決定要不要補點。"}
            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-foreground/68">
            {payment.surface === "settling" ? "同步中" : "已同步"}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {[
            ["目前可用", `${ledger.points} 點`],
            [props.intent ? `這次${intentLabel}成本` : "主解讀成本", `${props.intent ? actionCost : ledger.readingCostPoints} 點`],
            [props.intent ? "追問成本" : "追問成本", `${ledger.followupCostPoints} 點`],
            [props.intent ? "今日簽到" : "今日簽到", `+${ledger.dailyCheckIn.rewardPoints} 點`],
          ].map(([label, value]) => (
            <div key={label} className={metricClass}>
              <p className="text-sm text-foreground/56">{label}</p>
              <p className="mt-2 text-lg font-semibold text-card-foreground">{value}</p>
            </div>
          ))}
        </div>
      </section>

      {noticeMessage ? <div className="rounded-[1.5rem] border border-[rgba(229,192,142,0.18)] bg-[linear-gradient(180deg,rgba(185,144,93,0.12),rgba(185,144,93,0.04))] p-4 text-sm leading-7 text-card-foreground">{inlineText(noticeMessage)}</div> : null}

      {errorMessage ? (
        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
          <p className="text-sm leading-7 text-foreground/76">{inlineText(errorMessage)}</p>
          <button type="button" onClick={() => { void refreshLedger(); }} className="mt-4 text-sm font-medium text-brand-strong transition hover:text-brand">
            重新整理點數狀態
          </button>
        </div>
      ) : null}

      {showDailyCheckIn ? (
        <section className={panelClass}>
          <h2 className="text-lg font-semibold text-card-foreground">每日點數</h2>
          <p className="mt-2 text-sm leading-7 text-foreground/62">
            {hasClaimedToday ? "今天已經領取完成。" : `今天可以免費領取 ${ledger.dailyCheckIn.rewardPoints} 點。`}
          </p>
          <button type="button" disabled={hasClaimedToday || isClaimingCheckIn} onClick={() => { void handleDailyCheckIn(); }} className="mt-5 min-h-[3.5rem] w-full rounded-[1.35rem] bg-white px-4 py-4 text-sm font-semibold text-black transition hover:opacity-92 disabled:cursor-not-allowed disabled:opacity-45">
            {hasClaimedToday ? "今天已領取" : isClaimingCheckIn ? "領取中" : "領取今日點數"}
          </button>
        </section>
      ) : null}

      {showPackages ? (
        <section className={panelClass}>
          <h2 className="text-lg font-semibold text-card-foreground">{props.intent ? `補齊這次${intentLabel}的點數` : "補點方案"}</h2>
          <div className="mt-4 grid gap-3">
            {ledger.packages.map((item) => {
              const isRecommended = item.id === recommendedPackageId;
              return (
                <div key={item.id} className={`${metricClass} ${isRecommended ? "border-[rgba(229,192,142,0.18)]" : ""}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-card-foreground">{inlineText(item.label)}</h3>
                        {isRecommended ? <span className="rounded-full border border-[rgba(229,192,142,0.18)] bg-[rgba(185,144,93,0.12)] px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] text-[#f0cb97]">推薦</span> : null}
                      </div>
                      <p className="mt-2 text-sm leading-7 text-foreground/62">{inlineText(item.caption)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-card-foreground">{item.priceLabel}</p>
                      <p className="mt-2 text-sm text-foreground/56">+{item.points} 點</p>
                    </div>
                  </div>
                  <button type="button" disabled={isProcessing || payment.surface === "settling"} onClick={() => { void handleTopUp(item); }} className="mt-5 min-h-[3.5rem] w-full rounded-[1.35rem] bg-white px-4 py-4 text-sm font-semibold text-black transition hover:opacity-92 disabled:cursor-not-allowed disabled:opacity-45">
                    {isProcessing ? "正在開啟付款" : "選擇這個方案"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {showTransactions ? (
        <section className={panelClass}>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-card-foreground">最近點數動態</h2>
            <span className="text-sm text-foreground/56">{ledger.transactions.length > 0 ? `最近 ${Math.min(ledger.transactions.length, 24)} 筆` : "尚無紀錄"}</span>
          </div>
          {ledger.transactions.length > 0 ? (
            <div className="mt-4 grid gap-3">
              {ledger.transactions.map((entry) => (
                <TransactionItem key={entry.id} entry={entry} inlineText={inlineText} />
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm leading-7 text-foreground/62">補點、扣點與每日簽到之後都會顯示在這裡。</p>
          )}
        </section>
      ) : null}

      {!props.intent || !canReturnToFlow ? (
        <div className="mt-auto grid gap-3">
          <Link href={props.intent ? props.returnTo : "/"} className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-center text-sm font-medium text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07]">
            {props.intent ? "回到剛才流程" : "返回首頁"}
          </Link>
          <Link href="/question" className="min-h-[3.5rem] rounded-[1.35rem] bg-white px-4 py-4 text-center text-sm font-semibold text-black transition hover:opacity-92">
            {t("開始新的提問", "Start a new question")}
          </Link>
        </div>
      ) : null}
    </section>
  );
}
