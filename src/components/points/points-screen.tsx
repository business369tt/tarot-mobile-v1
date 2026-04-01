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
        "The payment link did not open this time. Try the same restore step once more.",
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
      data.message || "The payment return could not be reopened from here.",
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
      ? "Points settled.\nReturning you now."
      : "Points settled.\nHeld in your balance.";
  }

  if (args.payment.surface === "settling") {
    return "Payment received.\nSettling your balance.";
  }

  if (args.payment.surface === "canceled") {
    return args.intent
      ? "No points moved.\nThe answer is still waiting."
      : "No points moved.\nYou can return anytime.";
  }

  if (args.payment.surface === "failed") {
    return "The payment did\nnot settle.";
  }

  if (args.intent === "reading") {
    return "You are one quiet\nstep from this reading.";
  }

  if (args.intent === "followup") {
    return "Only one quiet step\nbefore the next answer.";
  }

  return "A clear ledger\nfor what your balance carried.";
}

function getPaymentHeroBody(args: {
  payment: PointsPaymentView;
  intent: MaybePointsIntent;
}) {
  if (args.payment.surface === "success") {
    return args.intent
      ? `Added ${args.payment.order?.points ?? 0} points. The held step can continue from the same place.`
      : `Added ${args.payment.order?.points ?? 0} points. Your balance is updated and ready for the next reading.`;
  }

  if (args.payment.surface === "settling") {
    return "The secure payment has returned here. The balance is being confirmed before the points settle into the ledger.";
  }

  if (args.payment.surface === "canceled") {
    return args.intent
      ? "The held reading or follow-up is still waiting. You can reopen the same restore step whenever you want."
      : "No balance moved this time. The ledger stays here whenever you want to return and restore points.";
  }

  if (args.payment.surface === "failed") {
    return (
      args.payment.message ||
      "The payment did not complete this time. You can reopen the same restore step and try again."
    );
  }

  if (args.intent === "reading") {
    return "Restore the points needed for this report, then return without replaying the ritual.";
  }

  if (args.intent === "followup") {
    return "Restore the points needed for this next question, then continue the same thread without retyping it.";
  }

  return "See what remains, what was spent, and where each movement of balance was used.";
}

function getPaymentNotice(payment: PointsPaymentView) {
  if (payment.surface === "success" && payment.order) {
    return `Added ${payment.order.points} points through ${payment.order.providerLabel}.`;
  }

  if (payment.surface === "settling") {
    return "The payment returned successfully. The points will appear here as soon as the settlement finishes.";
  }

  return null;
}

function getPaymentError(payment: PointsPaymentView) {
  if (payment.surface === "failed") {
    return (
      payment.message ||
      "The payment did not settle this time. Try the same restore step again."
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
    ? "this reading"
    : isFollowupIntent
      ? "this follow-up"
      : "your next paid step";
  const actionSummary = isReadingIntent
    ? "The report is already held in place. As soon as the balance is restored here, you can return straight to the same reading."
    : isFollowupIntent
      ? "The next question is already attached to this thread. Restore the balance here, then return straight to the same follow-up."
      : "Keep a small reserve here so the next reading or follow-up can continue without friction.";
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
      ? "Return now"
      : props.intent
        ? "Back to reading"
        : "Back to home";
  const hasClaimedToday = ledger.dailyCheckIn.status === "claimed";
  const dailyCardTitle = hasClaimedToday
    ? "Today's return is already settled."
    : "Come back today and gather a little balance.";
  const dailyCardBody = hasClaimedToday
    ? ledger.dailyCheckIn.claimedLabel
      ? `Today's ${ledger.dailyCheckIn.rewardPoints} points settled at ${ledger.dailyCheckIn.claimedLabel}. The balance is already waiting above.`
      : `Today's ${ledger.dailyCheckIn.rewardPoints} points have already been settled into your balance.`
    : `Return once each day and gather ${ledger.dailyCheckIn.rewardPoints} quiet points for the next reading or follow-up.`;

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
            message: "The payment return could not be reopened from this profile.",
          });
          setErrorMessage(
            "The payment return could not be reopened from this profile.",
          );
          window.clearInterval(intervalId);
          return;
        }

        if (nextOrder.status === "paid") {
          setPayment({
            surface: "success",
            order: nextOrder,
            message: "The points have settled into your balance.",
          });
          setNoticeMessage(
            `Added ${nextOrder.points} points through ${nextOrder.providerLabel}.`,
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
              "The payment did not complete this time.",
          });
          setNoticeMessage(null);
          setErrorMessage(
            nextOrder.errorMessage ||
              "The payment did not complete this time.",
          );
          window.clearInterval(intervalId);
          return;
        }

        if (nextOrder.status === "canceled") {
          setPayment({
            surface: "canceled",
            order: nextOrder,
            message:
              "No points moved yet. You can reopen the same restore step whenever you are ready.",
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
            "The payment return could not be checked just now. Reopen the points page and try again.",
        }));
        setNoticeMessage(null);
        setErrorMessage(
          "The payment return could not be checked just now. Reopen the points page and try again.",
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
              ? "The points have settled into your balance."
              : surface === "failed"
                ? order.errorMessage || "The payment did not settle this time."
                : surface === "canceled"
                  ? "No points moved yet. You can reopen the same restore step whenever you are ready."
                  : payment.message,
        });
      }

      setErrorMessage(null);
    } catch {
      setErrorMessage(
        "The ledger is quiet for a moment. Give it another try shortly.",
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
        message: "Opening secure payment...",
      });
      window.location.assign(response.checkoutUrl);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The payment link did not open this time. Give it another quiet try.",
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
          ? `Today's ${response.ledger.dailyCheckIn.rewardPoints} points have settled into your balance.`
          : "Today's return is already held in your balance.",
      );
      startTransition(() => {
        router.refresh();
      });
    } catch {
      setErrorMessage(
        "Today's return did not settle just yet. Give it another quiet try.",
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
          {props.intent ? "Points restore" : "Points ledger"}
        </p>
        <h2 className="mt-4 whitespace-pre-line font-display text-[2.05rem] leading-[0.94] text-card-foreground sm:text-[2.35rem] sm:leading-[0.92]">
          {heroTitle}
        </h2>
        <p className="mt-4 max-w-[18rem] text-sm leading-7 text-muted">
          {heroBody}
        </p>
        <div className="mt-6 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.22em] text-foreground/52">
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2">
            {ledger.points} pts available
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2">
            {props.intent
              ? `${actionCost} pts for ${actionLabel}`
              : "Recent movement"}
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2">
            {payment.surface === "settling"
              ? "Payment settling"
              : hasClaimedToday
                ? "Checked in today"
                : "Today's return open"}
          </span>
        </div>
      </div>

      <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-5 sm:rounded-[1.9rem] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-strong">
              Available now
            </p>
            <p className="mt-3 text-[2rem] font-semibold leading-none text-card-foreground">
              {ledger.points}
            </p>
            <p className="mt-3 text-sm leading-6 text-muted">
              Held under this LINE profile and ready for the next paid action.
            </p>
          </div>

          <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-foreground/56">
            {props.intent ? "Held action" : "Asset page"}
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <SummaryMetric
            label="Reading cost"
            value={`${ledger.readingCostPoints} pts`}
            caption="Needed to open one full destiny report."
          />
          <SummaryMetric
            label="Follow-up cost"
            value={`${ledger.followupCostPoints} pts`}
            caption="Needed to continue one AI follow-up thread."
          />
          <SummaryMetric
            label="Restored recently"
            value={`${ledger.totals.restored} pts`}
            caption="Credits across the most recent movement shown below."
          />
          <SummaryMetric
            label="Spent recently"
            value={`${ledger.totals.spent} pts`}
            caption="Debits across the same visible ledger range."
          />
        </div>

        {props.intent ? (
          <div className="mt-5 rounded-[1.3rem] border border-[rgba(229,192,142,0.18)] bg-[linear-gradient(180deg,rgba(185,144,93,0.12),rgba(185,144,93,0.04))] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-strong">
                  Held return
                </p>
                <p className="mt-3 text-sm leading-7 text-card-foreground">
                  {actionSummary}
                </p>
              </div>
              <span className="rounded-full border border-white/10 bg-black/18 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-foreground/56">
                {canCoverAction ? "Ready" : "Needs points"}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <SummaryMetric
                label="This action"
                value={`${actionCost} pts`}
                caption={
                  isFollowupIntent
                    ? "Needed for this follow-up."
                    : "Needed for this reading."
                }
              />
              <SummaryMetric
                label="After charge"
                value={`${Math.max(ledger.points - actionCost, 0)} pts`}
                caption="Projected balance once this step settles."
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="rounded-[1.8rem] border border-[rgba(229,192,142,0.18)] bg-[linear-gradient(180deg,rgba(185,144,93,0.12),rgba(185,144,93,0.04))] p-5 sm:rounded-[1.95rem] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-strong">
              Daily return
            </p>
            <h3 className="mt-3 text-[1.15rem] font-semibold text-card-foreground">
              {dailyCardTitle}
            </h3>
            <p className="mt-3 text-sm leading-7 text-muted">{dailyCardBody}</p>
          </div>
          <span className="rounded-full border border-white/10 bg-black/18 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-foreground/56">
            {hasClaimedToday ? "Collected" : ledger.dailyCheckIn.dayLabel}
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <SummaryMetric
            label="Today's return"
            value={`${ledger.dailyCheckIn.rewardPoints} pts`}
            caption="A small balance for returning once today."
          />
          <SummaryMetric
            label="Status"
            value={hasClaimedToday ? "Collected" : "Available"}
            caption={
              hasClaimedToday
                ? ledger.dailyCheckIn.claimedLabel
                  ? `Settled at ${ledger.dailyCheckIn.claimedLabel}.`
                  : "Already gathered today."
                : "Available once for this day only."
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
              ? "Today's return already gathered"
              : isClaimingCheckIn
                ? "Gathering today's points"
                : `Collect ${ledger.dailyCheckIn.rewardPoints} points today`}
          </button>

          <Link
            href="/question"
            className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 bg-white/[0.05] px-4 py-4 text-center text-sm font-semibold leading-5 text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07] sm:rounded-[1.4rem]"
          >
            Use this balance on a new question
          </Link>
        </div>
      </div>

      <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-5 sm:rounded-[1.9rem] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-strong">
              Recent movement
            </p>
            <h3 className="mt-3 text-[1.15rem] font-semibold text-card-foreground">
              What your balance has carried lately.
            </h3>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-foreground/56">
            Last {Math.min(ledger.transactions.length, 24)}
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
              Ledger empty
            </p>
            <h3 className="mt-3 text-[1.1rem] font-semibold leading-7 text-card-foreground">
              No point movement has settled here yet.
            </h3>
            <p className="mt-3 text-sm leading-7 text-muted">
              The first reading, follow-up, daily return, or balance restore will appear here with its purpose and its timing.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Link
                href="/question"
                className="min-h-[3.5rem] rounded-[1.35rem] border border-line-strong bg-brand px-4 py-4 text-center text-sm font-semibold leading-5 text-black transition hover:bg-brand-strong sm:rounded-[1.4rem]"
              >
                Begin a new question
              </Link>
              <Link
                href="/history"
                className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 bg-white/[0.05] px-4 py-4 text-center text-sm font-semibold leading-5 text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07] sm:rounded-[1.4rem]"
              >
                Open archive
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-[1.8rem] border border-[rgba(229,192,142,0.18)] bg-[linear-gradient(180deg,rgba(185,144,93,0.12),rgba(185,144,93,0.04))] p-5 sm:rounded-[1.95rem] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-strong">
              Restore balance
            </p>
            <h3 className="mt-3 text-[1.15rem] font-semibold text-card-foreground">
              Keep a small reserve for the next quiet step.
            </h3>
            <p className="mt-3 text-sm leading-7 text-muted">
              The balance now opens through a secure payment step, while the ledger and the return flow stay attached to this same profile.
            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-black/18 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-foreground/56">
            {props.intent ? "Return held" : "Secure restore"}
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
                      {isRecommended ? "Recommended" : "Package"}
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
                    ? "Points settled"
                    : isProcessing
                      ? "Opening secure payment"
                      : payment.surface === "settling"
                        ? "Waiting for settlement"
                        : `Pay ${item.priceLabel} for ${item.points} points`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {noticeMessage ? (
        <div className="rounded-[1.5rem] border border-[rgba(229,192,142,0.18)] bg-[linear-gradient(180deg,rgba(185,144,93,0.12),rgba(185,144,93,0.04))] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-strong">
            {payment.surface === "settling" ? "Settling" : "Settled"}
          </p>
          <p className="mt-3 text-sm leading-7 text-card-foreground">
            {noticeMessage}
          </p>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-strong">
            {payment.surface === "failed" ? "Payment paused" : "Hold for a moment"}
          </p>
          <p className="mt-3 text-sm leading-7 text-muted">{errorMessage}</p>
          <button
            type="button"
            onClick={() => {
              void refreshLedger();
            }}
            className="mt-4 text-sm font-medium text-brand-strong transition hover:text-brand motion-reduce:transition-none"
          >
            Refresh the ledger
          </button>
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
            Begin a new question
          </Link>
        ) : (
          <Link
            href="/history"
            className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 bg-black/18 px-4 py-4 text-center text-sm font-semibold leading-5 text-card-foreground transition hover:border-line-strong hover:bg-white/[0.05] sm:rounded-[1.4rem]"
          >
            Open archive
          </Link>
        )}
      </div>
    </section>
  );
}
