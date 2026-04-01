"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useMemo, useState } from "react";
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

async function requestPointsLedger() {
  const response = await fetch("/api/points/current", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("POINTS_UNAVAILABLE");
  }

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
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
  });
  const data = (await response.json().catch(() => ({}))) as Partial<
    TopUpCheckoutResponse & {
      message: string;
    }
  >;

  if (!response.ok || !data.checkoutUrl || !data.order) {
    throw new Error(
      data.message ||
        "這次沒有順利打開付款連結，請再試一次同一個補點步驟。 / The payment link did not open this time. Try the same top-up step once more.",
    );
  }

  return data as TopUpCheckoutResponse;
}

async function requestTopUpOrder(orderId: string) {
  const response = await fetch(`/api/points/top-up/${orderId}`, {
    cache: "no-store",
  });
  const data = (await response.json().catch(() => ({ order: null }))) as Partial<
    TopUpOrderResponse & {
      message: string;
    }
  >;

  if (!response.ok) {
    throw new Error(
      data.message || "這次無法從這裡重新打開付款回傳。 / The payment return could not be reopened from here.",
    );
  }

  return data as TopUpOrderResponse;
}

async function requestDailyCheckIn() {
  const response = await fetch("/api/points/daily-check-in", {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("CHECK_IN_FAILED");
  }

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

function SummaryMetric(props: {
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <div className="rounded-[1.3rem] border border-white/10 bg-black/18 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/42">
        {props.label}
      </p>
      <p className="mt-2 text-lg font-semibold text-card-foreground">
        {props.value}
      </p>
      <p className="mt-2 text-xs leading-6 text-muted">{props.caption}</p>
    </div>
  );
}

function TransactionItem(props: { entry: PointsLedgerEntry }) {
  const amountTone =
    props.entry.direction === "credit"
      ? "text-brand-strong"
      : "text-card-foreground";

  return (
    <article className="rounded-[1.45rem] border border-white/10 bg-black/18 p-4 sm:rounded-[1.55rem]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-foreground/56">
              {props.entry.typeBadge}
            </span>
            <p className="text-[11px] uppercase tracking-[0.2em] text-foreground/42">
              {props.entry.createdLabel}
            </p>
          </div>
          <h3 className="mt-3 text-[1rem] font-semibold leading-6 text-card-foreground">
            {props.entry.typeLabel}
          </h3>
          <p className="mt-2 text-sm leading-7 text-muted">
            {props.entry.description}
          </p>
        </div>

      <div className="shrink-0 text-right">
          <p className={`text-[1rem] font-semibold ${amountTone}`}>
            {props.entry.amountLabel}
          </p>
          <p className="mt-2 text-[11px] leading-5 text-foreground/42">
            {props.entry.balanceAfterLabel}
          </p>
        </div>
      </div>

      {props.entry.detailHref && props.entry.detailLabel ? (
        <div className="mt-4">
          <Link
            href={props.entry.detailHref}
            className="text-sm font-medium text-brand-strong transition hover:text-brand motion-reduce:transition-none"
          >
            {props.entry.detailLabel}
          </Link>
        </div>
      ) : null}
    </article>
  );
}

function getPaymentHeroTitle(args: {
  payment: PointsPaymentView;
  intent: MaybePointsIntent;
}) {
  if (args.payment.surface === "success") {
    return args.intent
      ? "點數已經補入\n可以回到解讀了。 / Points settled for your reading."
      : "點數已經補入\n餘額已更新。 / Points settled into your balance.";
  }

  if (args.payment.surface === "settling") {
    return "付款正在確認中\n點數即將入帳。 / Payment is settling.";
  }

  if (args.payment.surface === "canceled") {
    return args.intent
      ? "付款已取消\n可隨時回到原本流程。 / Payment canceled."
      : "付款已取消\n這次沒有點數變動。 / Payment canceled with no balance change.";
  }

  if (args.payment.surface === "failed") {
    return "付款沒有完成\n這次尚未入帳。 / Payment did not complete.";
  }

  if (args.intent === "reading") {
    return "解讀前補點\n準備進入本次抽牌。 / Top up before reading.";
  }

  if (args.intent === "followup") {
    return "追問前補點\n延續同一段解讀。 / Top up before follow-up.";
  }

  return "點數頁\n管理你的餘額與補點。 / Points page.";
}

function getPaymentHeroBody(args: {
  payment: PointsPaymentView;
  intent: MaybePointsIntent;
}) {
  if (args.payment.surface === "success") {
    return args.intent
      ? `已補入 ${args.payment.order?.points ?? 0} 點，回到原本流程後就能繼續這次解讀。 / ${args.payment.order?.points ?? 0} points settled and ready when you return to the flow.`
      : `已補入 ${args.payment.order?.points ?? 0} 點，目前餘額已更新，可繼續使用。 / ${args.payment.order?.points ?? 0} points settled into your current balance.`;
  }

  if (args.payment.surface === "settling") {
    return "我們正在安靜確認這筆付款，完成後點數會自動回到你的餘額。 / We are quietly confirming this payment. Points will settle automatically once it completes.";
  }

  if (args.payment.surface === "canceled") {
    return args.intent
      ? "這次沒有扣款，也沒有點數異動；準備好時可以回到原本步驟再試一次。 / No charge or points change happened. You can return to the same step when ready."
      : "這次沒有扣款，也沒有點數異動；等你準備好時再重新打開補點流程即可。 / No charge or points change happened. Reopen the top-up flow whenever you are ready.";
  }

  if (args.payment.surface === "failed") {
    return (
      args.payment.message ||
      "這次付款沒有完成入帳，請稍後再試一次。 / This payment did not settle successfully."
    );
  }

  if (args.intent === "reading") {
    return "你目前正準備進入正式解讀；補點完成後就能直接回到抽牌流程。 / You are about to begin a reading. After top-up, you can return straight to the flow.";
  }

  if (args.intent === "followup") {
    return "你目前正準備追問同一份解讀；補點完成後就能延續原本脈絡。 / You are about to continue a follow-up. After top-up, you can resume the same thread.";
  }

  return "這裡整理了目前餘額、補點方案與最近點數變動，讓你回來時能快速續接。 / Review your balance, top-up options, and recent point activity here.";
}

function getPaymentNotice(payment: PointsPaymentView) {
  if (payment.surface === "success" && payment.order) {
    return `已透過 ${payment.order.providerLabel} 補入 ${payment.order.points} 點。 / ${payment.order.points} points settled via ${payment.order.providerLabel}.`;
  }

  if (payment.surface === "settling") {
    return "付款正在確認中；我們會在點數入帳後自動更新這裡。 / Payment is settling. We will update this page once the points arrive.";
  }

  return null;
}

function getPaymentError(payment: PointsPaymentView) {
  if (payment.surface === "failed") {
    return (
      payment.message ||
      "這次付款沒有順利完成，你可以稍後重新打開同一個補點步驟。 / The payment did not complete this time. You can reopen the same top-up step later."
    );
  }

  return null;
}

export function PointsScreen(props: PointsScreenProps) {
  const router = useRouter();
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

  const isReadingIntent = props.intent === "reading";
  const isFollowupIntent = props.intent === "followup";
  const actionCost = isFollowupIntent
    ? ledger.followupCostPoints
    : ledger.readingCostPoints;
  const actionLabel = isReadingIntent
    ? "正式解讀 / Reading"
    : isFollowupIntent
      ? "追問延伸 / Follow-up"
      : "點數使用 / Points";
  const actionSummary = isReadingIntent
    ? "這次補點會保留你目前的提問進度，完成後可直接回到解讀流程。 / This top-up keeps your current question intact so you can return straight to the reading."
    : isFollowupIntent
      ? "這次補點會保留同一份解讀脈絡，完成後可回到追問流程繼續延伸。 / This top-up keeps the same reading thread so you can resume the follow-up flow."
      : "先補足餘額，再決定要拿來開新問題、追問或留到之後使用。 / Refill your balance now, then use it for a new question, a follow-up, or later.";
  const heroTitle = getPaymentHeroTitle({
    payment,
    intent: props.intent,
  });
  const heroBody = getPaymentHeroBody({
    payment,
    intent: props.intent,
  });
  const recommendedPackageId = useMemo(() => {
    const target = props.intent ? actionCost : ledger.followupCostPoints;

    return (
      ledger.packages.find((item) => ledger.points + item.points >= target)?.id ??
      ledger.packages[0]?.id
    );
  }, [
    actionCost,
    ledger.followupCostPoints,
    ledger.packages,
    ledger.points,
    props.intent,
  ]);
  const canCoverAction = ledger.points >= actionCost;
  const hasTransactions = ledger.transactions.length > 0;
  const cancelHref = props.intent ? props.returnTo : "/";
  const cancelLabel =
    payment.surface === "success" && props.intent
      ? "立即回到解讀（Return now）"
      : props.intent
        ? "回到解讀（Back to reading）"
        : "回到首頁（Back to home）";
  const hasClaimedToday = ledger.dailyCheckIn.status === "claimed";
  const dailyCardTitle = hasClaimedToday
    ? "今日回訪已領取。 / Today's return collected."
    : "今日回訪已開啟，可領取一筆安靜補點。 / Today's return is ready.";
  const dailyCardBody = hasClaimedToday
    ? ledger.dailyCheckIn.claimedLabel
      ? `你今天已領取 ${ledger.dailyCheckIn.rewardPoints} 點，時間是 ${ledger.dailyCheckIn.claimedLabel}。 / You collected ${ledger.dailyCheckIn.rewardPoints} points at ${ledger.dailyCheckIn.claimedLabel}.`
      : `你今天已領取 ${ledger.dailyCheckIn.rewardPoints} 點。 / You already collected ${ledger.dailyCheckIn.rewardPoints} points today.`
    : `今天回來簽到可領取 ${ledger.dailyCheckIn.rewardPoints} 點，讓餘額慢慢累積起來。 / Collect ${ledger.dailyCheckIn.rewardPoints} points today to build your balance.`;

  useEffect(() => {
    if (payment.surface !== "settling" || !payment.order) {
      return;
    }

    let active = true;
    const intervalId = window.setInterval(async () => {
      try {
        const response = await requestTopUpOrder(payment.order!.id);

        if (!active) {
          return;
        }

        const nextOrder = response.order;

            if (!nextOrder) {
              setPayment({
                surface: "failed",
                order: null,
                message: "這次無法從這個身份重新打開付款回傳。 / The payment return could not be reopened from this profile.",
              });
              setErrorMessage(
                "這次無法從這個身份重新打開付款回傳。 / The payment return could not be reopened from this profile.",
              );
          window.clearInterval(intervalId);
          return;
        }

            if (nextOrder.status === "paid") {
              setPayment({
                surface: "success",
                order: nextOrder,
                message: "點數已經入到你的餘額中。 / The points have settled into your balance.",
              });
              setNoticeMessage(
                `已透過 ${nextOrder.providerLabel} 補入 ${nextOrder.points} 點。 / ${nextOrder.points} points settled via ${nextOrder.providerLabel}.`, 
              );
          setErrorMessage(null);
          window.clearInterval(intervalId);

          try {
            const nextLedger = await requestPointsLedger();

            if (!active) {
              return;
            }

            setLedger(nextLedger);
          } catch {
            startTransition(() => {
              router.refresh();
            });
          }

          return;
        }

        if (nextOrder.status === "failed") {
          setPayment({
            surface: "failed",
            order: nextOrder,
                message:
                  nextOrder.errorMessage ||
                  "這次付款沒有完成入帳。 / This payment did not settle into your balance.",
              });
              setNoticeMessage(null);
              setErrorMessage(
                nextOrder.errorMessage ||
                  "這次付款沒有完成入帳。 / This payment did not settle into your balance.",
              );
          window.clearInterval(intervalId);
          return;
        }

        if (nextOrder.status === "canceled") {
          setPayment({
            surface: "canceled",
            order: nextOrder,
                message:
                  "目前還沒有點數變動；等你準備好時，可以重新打開同一個補點步驟。 / No points moved yet. You can reopen the same top-up step whenever you are ready.",
              });
          setNoticeMessage(null);
          setErrorMessage(null);
          window.clearInterval(intervalId);
        }
      } catch {
        if (!active) {
          return;
        }

        setPayment((current) => ({
          ...current,
          surface: "failed",
          message:
          "剛剛無法確認這次付款回傳，請重新打開點數頁再試一次。 / The payment return could not be checked just now. Reopen the points page and try again.",
        }));
        setNoticeMessage(null);
        setErrorMessage(
          "剛剛無法確認這次付款回傳，請重新打開點數頁再試一次。 / The payment return could not be checked just now. Reopen the points page and try again.",
        );
        window.clearInterval(intervalId);
      }
    }, 2500);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [payment, router]);

  useEffect(() => {
    if (payment.surface !== "success" || !props.intent) {
      return;
    }

    const timer = window.setTimeout(() => {
      startTransition(() => {
        router.push(
          isFollowupIntent
            ? appendResumeParam(props.returnTo, "followup")
            : props.returnTo,
        );
      });
    }, 1400);

    return () => {
      window.clearTimeout(timer);
    };
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
        const surface: Exclude<PointsPaymentView["surface"], "idle"> =
          order.status === "paid"
            ? "success"
            : order.status === "failed"
              ? "failed"
              : order.status === "canceled"
                ? "canceled"
                : payment.surface === "failed" || payment.surface === "canceled"
                  ? "settling"
                  : payment.surface === "success"
                    ? "settling"
                    : "settling";

        setPayment({
          surface,
          order,
          message:
            surface === "success"
              ? "點數已經入到你的餘額中。 / The points have settled into your balance."
              : surface === "failed"
                ? order.errorMessage || "這次付款沒有成功入帳。 / This payment did not settle into your balance."
                : surface === "canceled"
                  ? "目前還沒有點數變動；等你準備好時，可以重新打開同一個補點步驟。 / No points moved yet. You can reopen the same top-up step whenever you are ready."
                  : payment.message,
        });
      }

      setErrorMessage(null);
    } catch {
      setErrorMessage(
        "點數帳本暫時安靜了一下，請稍後再試一次。 / The ledger is quiet for a moment. Give it another try shortly.",
      );
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
        message: "正在打開安全付款頁面。 / Opening secure payment...",
      });
      window.location.assign(response.checkoutUrl);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "這次沒有順利打開付款連結，請再安靜試一次。 / The payment link did not open this time. Give it another quiet try.",
      );
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
          ? `今日回訪的 ${response.ledger.dailyCheckIn.rewardPoints} 點已補入餘額。 / Today's ${response.ledger.dailyCheckIn.rewardPoints} points have been added to your balance.`
          : "今日回訪已經領取過了，點數狀態也已更新。 / Today's return was already collected, and your balance is up to date.",
      );
      startTransition(() => {
        router.refresh();
      });
    } catch {
      setErrorMessage(
        "今日回訪暫時還沒有補入，請稍後再試一次。 / Today's return did not settle just yet. Give it another quiet try.",
      );
    } finally {
      setIsClaimingCheckIn(false);
    }
  }

  return (
    <section className="flex flex-1 flex-col gap-4 px-4 pb-5 pt-4 sm:gap-5 sm:px-5 sm:pb-6 sm:pt-5">
      <div className="relative overflow-hidden rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,rgba(21,27,41,0.98),rgba(12,15,24,0.96))] p-5 shadow-[var(--shadow-soft)] sm:rounded-[2rem] sm:p-6">
        <div className="pointer-events-none absolute right-[-4rem] top-[-3rem] h-36 w-36 rounded-full bg-[radial-gradient(circle,_rgba(185,144,93,0.18),_transparent_68%)] blur-3xl" />
        <div className="pointer-events-none absolute left-[-4rem] top-12 h-28 w-28 rounded-full bg-[radial-gradient(circle,_rgba(121,152,255,0.1),_transparent_72%)] blur-3xl" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-brand-strong">
          {props.intent ? "補點流程 / Top-up flow" : "點數中心 / Points center"}
        </p>
        <h2 className="mt-4 whitespace-pre-line font-display text-[2.05rem] leading-[0.94] text-card-foreground sm:text-[2.35rem] sm:leading-[0.92]">
          {heroTitle}
        </h2>
        <p className="mt-4 max-w-[18rem] text-sm leading-7 text-muted">
          {heroBody}
        </p>
        <div className="mt-6 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.22em] text-foreground/52">
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2">
            {`${ledger.points} 點可用 / pts available`}
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2">
            {props.intent
              ? `${actionCost} 點需求 / ${actionLabel}`
              : "最近點數變動 / Recent movement"}
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2">
            {payment.surface === "settling"
                ? "付款確認中 / Payment settling"
              : hasClaimedToday
                  ? "今日已簽到 / Checked in today"
                  : "今日可領取 / Today's return open"}
          </span>
        </div>
      </div>

      <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-5 sm:rounded-[1.9rem] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-strong">
              目前餘額 / Available now
            </p>
            <p className="mt-3 text-[2rem] font-semibold leading-none text-card-foreground">
              {ledger.points}
            </p>
            <p className="mt-3 text-sm leading-6 text-muted">
              所有點數都綁定在同一個 LINE 身份下，補點後可用於新問題、追問與之後回來續接。 / Your points stay under the same LINE identity, ready for new questions, follow-ups, and returns.            </p>
          </div>

          <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-foreground/56">
            {props.intent ? "保留用途 / Held action" : "資產頁 / Balance page"}
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <SummaryMetric
            label="正式解讀費用 / Reading cost"
            value={`${ledger.readingCostPoints} pts`}
            caption="開始一次正式解讀所需的點數。 / Points needed to start a full reading."
          />
          <SummaryMetric
            label="追問費用 / Follow-up cost"
            value={`${ledger.followupCostPoints} pts`}
            caption="延伸一次 AI 追問所需的點數。 / Points needed for one AI follow-up."
          />
          <SummaryMetric
            label="最近補回 / Restored recently"
            value={`${ledger.totals.restored} pts`}
            caption="最近補回到餘額中的點數總和。 / Points recently restored to your balance."
          />
          <SummaryMetric
            label="最近使用 / Spent recently"
            value={`${ledger.totals.spent} pts`}
            caption="最近用在解讀與追問上的點數總和。 / Points recently spent on readings and follow-ups."
          />
        </div>

        {props.intent ? (
          <div className="mt-5 rounded-[1.3rem] border border-[rgba(229,192,142,0.18)] bg-[linear-gradient(180deg,rgba(185,144,93,0.12),rgba(185,144,93,0.04))] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-strong">
                  保留流程 / Held return
                </p>
                <p className="mt-3 text-sm leading-7 text-card-foreground">
                  {actionSummary}
                </p>
              </div>
              <span className="rounded-full border border-white/10 bg-black/18 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-foreground/56">
                {canCoverAction ? "可以繼續 / Ready" : "需要補點 / Needs points"}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <SummaryMetric
                label="本次需求 / This action"
                value={`${actionCost} pts`}
                caption={
                  isFollowupIntent
                    ? "這次追問會消耗的點數。 / Points used by this follow-up."
                    : "這次解讀會消耗的點數。 / Points used by this reading."
                }
              />
              <SummaryMetric
                label="扣除後餘額 / After charge"
                value={`${Math.max(ledger.points - actionCost, 0)} pts`}
                caption="完成後預估還會保留的餘額。 / Estimated balance after this charge."
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="rounded-[1.8rem] border border-[rgba(229,192,142,0.18)] bg-[linear-gradient(180deg,rgba(185,144,93,0.12),rgba(185,144,93,0.04))] p-5 sm:rounded-[1.95rem] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-strong">
              每日回訪 / Daily return
            </p>
            <h3 className="mt-3 text-[1.15rem] font-semibold text-card-foreground">
              {dailyCardTitle}
            </h3>
            <p className="mt-3 text-sm leading-7 text-muted">{dailyCardBody}</p>
          </div>
          <span className="rounded-full border border-white/10 bg-black/18 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-foreground/56">
            {hasClaimedToday ? "已領取 / Collected" : ledger.dailyCheckIn.dayLabel}
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <SummaryMetric
            label="今日回訪 / Today's return"
            value={`${ledger.dailyCheckIn.rewardPoints} pts`}
            caption="今天回來可以領取並補入的點數。 / Points you can collect today."
          />
          <SummaryMetric
            label="狀態 / Status"
            value={hasClaimedToday ? "已領取 / Collected" : "可領取 / Available"}
            caption={
              hasClaimedToday
                ? ledger.dailyCheckIn.claimedLabel
                  ? `於 ${ledger.dailyCheckIn.claimedLabel} 領取。 / Collected at ${ledger.dailyCheckIn.claimedLabel}.`
                  : "今日回訪已完成。 / Today's return is already collected."
                : "今日回訪仍可領取一次。 / Today's return is still available."
            }
          />
        </div>

        <div className="mt-5 grid gap-3">
          <button
            type="button"
            disabled={hasClaimedToday || isClaimingCheckIn}
            onClick={() => {
              void handleDailyCheckIn();
            }}
            className="min-h-[3.5rem] rounded-[1.35rem] border border-line-strong bg-brand px-4 py-4 text-sm font-semibold leading-5 text-black transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-45 sm:rounded-[1.4rem]"
          >
            {hasClaimedToday
              ? "今日回訪已領取（Collected today）"
              : isClaimingCheckIn
                ? "正在領取今日點數（Collecting today's points）"
                : `領取今日 ${ledger.dailyCheckIn.rewardPoints} 點（Collect today's points）`}
          </button>

          <Link
            href="/question"
            className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 bg-white/[0.05] px-4 py-4 text-center text-sm font-semibold leading-5 text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07] sm:rounded-[1.4rem]"
          >
            用這筆餘額開新問題（Use this balance on a new question）          </Link>
        </div>
      </div>

      <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-5 sm:rounded-[1.9rem] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-strong">
              最近點數流動 / Recent movement
            </p>
            <h3 className="mt-3 text-[1.15rem] font-semibold text-card-foreground">
              最近的點數流動會留在這裡，方便你回來續接。 / Recent point activity stays here.            </h3>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-foreground/56">
            {`最近 ${Math.min(ledger.transactions.length, 24)} 筆 / Last ${Math.min(ledger.transactions.length, 24)}`}
          </span>
        </div>

        {hasTransactions ? (
          <div className="mt-5 grid gap-3">
            {ledger.transactions.map((entry) => (
              <TransactionItem key={entry.id} entry={entry} />
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-[1.45rem] border border-dashed border-white/10 bg-black/18 p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-strong">
              帳本目前安靜 / Ledger empty
            </p>
            <h3 className="mt-3 text-[1.1rem] font-semibold leading-7 text-card-foreground">
              目前還沒有點數異動，之後會留在這裡。            </h3>
            <p className="mt-3 text-sm leading-7 text-muted">
              當你補點、使用點數或領取每日回訪後，這裡會留下一份安靜的紀錄，方便你下次續接。            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Link
                href="/question"
                className="min-h-[3.5rem] rounded-[1.35rem] border border-line-strong bg-brand px-4 py-4 text-center text-sm font-semibold leading-5 text-black transition hover:bg-brand-strong sm:rounded-[1.4rem]"
              >
                開始新問題（Begin a new question）              </Link>
              <Link
                href="/history"
                className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 bg-white/[0.05] px-4 py-4 text-center text-sm font-semibold leading-5 text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07] sm:rounded-[1.4rem]"
              >
                打開紀錄（Open archive）              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-[1.8rem] border border-[rgba(229,192,142,0.18)] bg-[linear-gradient(180deg,rgba(185,144,93,0.12),rgba(185,144,93,0.04))] p-5 sm:rounded-[1.95rem] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-strong">
              補點方案 / Restore balance
            </p>
            <h3 className="mt-3 text-[1.15rem] font-semibold text-card-foreground">
              挑一個適合現在步調的方案，讓點數回到餘額中。            </h3>
            <p className="mt-3 text-sm leading-7 text-muted">
              這裡會帶你前往安全付款頁面；完成後點數會回到同一個身份之下，方便之後續接。            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-black/18 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-foreground/56">
            {props.intent ? "保留流程 / Return held" : "安全補點 / Secure restore"}
          </span>
        </div>

        <div className="mt-5 grid gap-3">
          {ledger.packages.map((item) => {
            const isRecommended = item.id === recommendedPackageId;
            const isPaidPackage =
              payment.surface === "success" && payment.order?.packageId === item.id;

            return (
              <div
                key={item.id}
                className={`rounded-[1.6rem] border p-5 sm:rounded-[1.7rem] sm:p-6 ${
                  isRecommended
                    ? "border-[rgba(229,192,142,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))]"
                    : "border-white/10 bg-black/18"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-strong">
                      {isRecommended ? "推薦方案 / Recommended" : "補點方案 / Package"}
                    </p>
                    <h4 className="mt-3 text-[1.05rem] font-semibold text-card-foreground">
                      {item.label}
                    </h4>
                    <p className="mt-3 text-sm leading-7 text-muted">
                      {item.caption}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-foreground/56">
                      +{item.points} pts
                    </span>
                    <p className="mt-3 text-sm font-semibold text-card-foreground">
                      {item.priceLabel}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isProcessing || payment.surface === "settling"}
                  onClick={() => {
                    void handleTopUp(item);
                  }}
                  className="mt-5 min-h-[3.5rem] w-full rounded-[1.35rem] border border-line-strong bg-brand px-4 py-4 text-sm font-semibold leading-5 text-black transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-45 sm:rounded-[1.4rem]"
                >
                  {isPaidPackage
                    ? "點數已入帳（Points settled）"
                    : isProcessing
                      ? "正在打開安全付款頁（Opening secure payment）"
                      : payment.surface === "settling"
                        ? "等待付款確認（Waiting for settlement）"
                        : `以 ${item.priceLabel} 補入 ${item.points} 點（Restore ${item.points} points）`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {noticeMessage ? (
        <div className="rounded-[1.5rem] border border-[rgba(229,192,142,0.18)] bg-[linear-gradient(180deg,rgba(185,144,93,0.12),rgba(185,144,93,0.04))] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-strong">
            {payment.surface === "settling" ? "確認中 / Settling" : "已入帳 / Settled"}
          </p>
          <p className="mt-3 text-sm leading-7 text-card-foreground">
            {noticeMessage}
          </p>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-strong">
            {payment.surface === "failed" ? "付款暫停 / Payment paused" : "稍候一下 / Hold for a moment"}
          </p>
          <p className="mt-3 text-sm leading-7 text-muted">{errorMessage}</p>
          <button
            type="button"
            onClick={() => {
              void refreshLedger();
            }}
            className="mt-4 text-sm font-medium text-brand-strong transition hover:text-brand motion-reduce:transition-none"
          >
            重新整理點數帳本（Refresh the ledger）          </button>
        </div>
      ) : null}

      <div className="mt-auto grid gap-3">
        <Link
          href={cancelHref}
          className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 bg-white/[0.05] px-4 py-4 text-center text-sm font-semibold leading-5 text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07] sm:rounded-[1.4rem]"
        >
          {cancelLabel}
        </Link>

        {!props.intent ? (
          <Link
            href="/question"
            className="min-h-[3.5rem] rounded-[1.35rem] border border-line-strong bg-brand px-4 py-4 text-center text-sm font-semibold leading-5 text-black transition hover:bg-brand-strong sm:rounded-[1.4rem]"
          >
            開始新問題（Begin a new question）          </Link>
        ) : (
          <Link
            href="/history"
            className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 bg-black/18 px-4 py-4 text-center text-sm font-semibold leading-5 text-card-foreground transition hover:border-line-strong hover:bg-white/[0.05] sm:rounded-[1.4rem]"
          >
            打開紀錄（Open archive）          </Link>
        )}
      </div>
    </section>
  );
}
