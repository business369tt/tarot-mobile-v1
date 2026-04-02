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
      data.message ||
        "這次無法從這裡重新打開付款回傳。 / The payment return could not be reopened from here.",
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

function getPaymentNotice(payment: PointsPaymentView) {
  if (payment.surface === "success" && payment.order) {
    return `已透過 ${payment.order.providerLabel} 補入 ${payment.order.points} 點。 / ${payment.order.points} points settled via ${payment.order.providerLabel}.`;
  }

  if (payment.surface === "settling") {
    return "付款正在確認中；點數入帳後這裡會自動更新。 / Payment is settling. This page will update when the points arrive.";
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

function TransactionItem(props: {
  entry: PointsLedgerEntry;
  inlineText: (value: string | null | undefined) => string;
}) {
  const amountTone =
    props.entry.direction === "credit"
      ? "text-brand-strong"
      : "text-card-foreground";

  return (
    <article className="rounded-[1.35rem] border border-white/10 bg-black/18 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-foreground/56">
            {props.entry.createdLabel}
          </p>
          <h4 className="mt-2 text-lg font-semibold leading-7 text-card-foreground">
            {props.inlineText(props.entry.typeLabel)}
          </h4>
          <p className="mt-2 text-sm leading-7 text-foreground/76">
            {props.inlineText(props.entry.description)}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className={`text-sm font-semibold ${amountTone}`}>
            {props.inlineText(props.entry.amountLabel)}
          </p>
          <p className="mt-2 text-sm text-foreground/56">
            {props.inlineText(props.entry.balanceAfterLabel)}
          </p>
        </div>
      </div>

      {props.entry.detailHref && props.entry.detailLabel ? (
        <Link
          href={props.entry.detailHref}
          className="mt-4 inline-flex text-sm font-medium text-brand-strong transition hover:text-brand"
        >
          {props.inlineText(props.entry.detailLabel)}
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

  const isReadingIntent = props.intent === "reading";
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
  }, [
    actionCost,
    ledger.followupCostPoints,
    ledger.packages,
    ledger.points,
    props.intent,
  ]);
  const hasTransactions = ledger.transactions.length > 0;
  const cancelHref = props.intent ? props.returnTo : "/";
  const cancelLabel =
    payment.surface === "success" && props.intent
      ? t("回到原流程", "Return now")
      : props.intent
        ? t("回到原流程", "Back to flow")
        : t("回到首頁", "Back to home");
  const hasClaimedToday = ledger.dailyCheckIn.status === "claimed";

  const heroTitle =
    payment.surface === "success"
      ? props.intent
        ? t("補點完成，可以回去繼續了", "Points added. You can continue now.")
        : t("點數已入帳", "Points added")
      : payment.surface === "settling"
        ? t("付款確認中", "Payment is settling")
        : payment.surface === "canceled"
          ? t("付款已取消", "Payment canceled")
          : payment.surface === "failed"
            ? t("付款沒有完成", "Payment did not complete")
            : props.intent === "reading"
              ? t("先補點再開始解讀", "Top up before reading")
              : props.intent === "followup"
                ? t("先補點再追問", "Top up before follow-up")
                : t("管理你的點數", "Manage your points");
  const heroBody =
    payment.surface === "success"
      ? props.intent
        ? t("點數已補回，回到原本流程就能繼續。", "Your points are ready when you return to the flow.")
        : t("餘額已更新，你可以繼續使用。", "Your balance has been updated.")
      : payment.surface === "settling"
        ? t("系統正在確認這筆付款。", "We are confirming this payment now.")
        : payment.surface === "canceled"
          ? t("這次沒有扣款，也沒有點數變動。", "No charge or points change happened.")
          : payment.surface === "failed"
            ? inlineText(payment.message || getPaymentError(payment))
            : props.intent === "reading"
              ? t("完成後會直接回到這次解讀。", "After top-up, you will return straight to this reading.")
              : props.intent === "followup"
                ? t("完成後會直接回到這次追問。", "After top-up, you will return straight to this follow-up.")
                : t("查看餘額、補點方案與最近的點數變動。", "Review your balance, packages, and recent activity.");

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
            message:
              "這次無法從這個身份重新打開付款回傳。 / The payment return could not be reopened from this profile.",
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
                : "settling";

        setPayment({
          surface,
          order,
          message:
            surface === "success"
              ? "點數已經入到你的餘額中。 / The points have settled into your balance."
              : surface === "failed"
                ? order.errorMessage ||
                  "這次付款沒有成功入帳。 / This payment did not settle into your balance."
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
    <section className="flex flex-1 flex-col gap-5 py-6">
      <div className="space-y-3 pt-4">
        <p className="text-sm text-foreground/56">
          {props.intent ? t("補點", "Top up") : t("點數", "Points")}
        </p>
        <h1 className="max-w-[14rem] text-[2.6rem] font-semibold leading-[1.02] tracking-tight text-card-foreground">
          {heroTitle}
        </h1>
        <p className="max-w-[18rem] text-base leading-7 text-foreground/62">
          {heroBody}
        </p>
      </div>

      <div className="rounded-[1.8rem] bg-white/[0.04] p-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm text-foreground/56">{t("目前餘額", "Available now")}</p>
            <p className="mt-2 text-[2.4rem] font-semibold leading-none text-card-foreground">
              {ledger.points}
            </p>
          </div>
          <p className="text-sm text-foreground/56">pts</p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-[1.3rem] border border-white/10 bg-black/18 p-4">
            <p className="text-sm text-foreground/56">{t("解讀費用", "Reading cost")}</p>
            <p className="mt-2 text-lg font-semibold text-card-foreground">
              {ledger.readingCostPoints} pts
            </p>
          </div>
          <div className="rounded-[1.3rem] border border-white/10 bg-black/18 p-4">
            <p className="text-sm text-foreground/56">{t("追問費用", "Follow-up cost")}</p>
            <p className="mt-2 text-lg font-semibold text-card-foreground">
              {ledger.followupCostPoints} pts
            </p>
          </div>
        </div>

        {props.intent ? (
          <div className="mt-4 rounded-[1.3rem] border border-white/10 bg-black/18 p-4">
            <p className="text-sm text-foreground/56">
              {isReadingIntent
                ? t("這次解讀需要", "This reading needs")
                : t("這次追問需要", "This follow-up needs")}
            </p>
            <p className="mt-2 text-lg font-semibold text-card-foreground">
              {actionCost} pts
            </p>
            <p className="mt-2 text-sm leading-6 text-foreground/62">
              {ledger.points >= actionCost
                ? t("目前餘額已足夠。", "Your current balance is enough.")
                : t("補點後就能直接回到原本流程。", "After top-up, you can return straight to the same flow.")}
            </p>
          </div>
        ) : null}
      </div>

      {noticeMessage ? (
        <div className="rounded-[1.5rem] border border-[rgba(229,192,142,0.18)] bg-[linear-gradient(180deg,rgba(185,144,93,0.12),rgba(185,144,93,0.04))] p-4">
          <p className="text-sm leading-7 text-card-foreground">
            {inlineText(noticeMessage)}
          </p>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
          <p className="text-sm leading-7 text-foreground/76">
            {inlineText(errorMessage)}
          </p>
          <button
            type="button"
            onClick={() => {
              void refreshLedger();
            }}
            className="mt-4 text-sm font-medium text-brand-strong transition hover:text-brand"
          >
            {t("重新整理", "Refresh")}
          </button>
        </div>
      ) : null}

      <div className="rounded-[1.8rem] bg-white/[0.04] p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-card-foreground">
              {t("每日回訪", "Daily return")}
            </h2>
            <p className="mt-2 text-sm leading-7 text-foreground/62">
              {hasClaimedToday
                ? t("今天已經領過了。", "Already collected today.")
                : t(
                    `今天可領 ${ledger.dailyCheckIn.rewardPoints} 點。`,
                    `${ledger.dailyCheckIn.rewardPoints} points are available today.`,
                  )}
            </p>
          </div>
          <span className="text-sm text-foreground/56">
            {hasClaimedToday ? t("已領取", "Collected") : t("可領取", "Available")}
          </span>
        </div>

        <button
          type="button"
          disabled={hasClaimedToday || isClaimingCheckIn}
          onClick={() => {
            void handleDailyCheckIn();
          }}
          className="mt-5 min-h-[3.5rem] w-full rounded-[1.35rem] bg-white px-4 py-4 text-sm font-semibold text-black transition hover:opacity-92 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {hasClaimedToday
            ? t("今日已領取", "Collected today")
            : isClaimingCheckIn
              ? t("領取中", "Collecting")
              : t("領取今日點數", "Collect today")}
        </button>
      </div>

      <div className="rounded-[1.8rem] bg-white/[0.04] p-5">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-card-foreground">
            {t("補點方案", "Packages")}
          </h2>
          <p className="text-sm leading-7 text-foreground/62">
            {t("選一個適合現在的方案。", "Choose the option that fits you now.")}
          </p>
        </div>

        <div className="mt-4 grid gap-3">
          {ledger.packages.map((item) => {
            const isRecommended = item.id === recommendedPackageId;
            const isPaidPackage =
              payment.surface === "success" && payment.order?.packageId === item.id;

            return (
              <div
                key={item.id}
                className={`rounded-[1.5rem] border p-5 ${
                  isRecommended
                    ? "border-[rgba(229,192,142,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))]"
                    : "border-white/10 bg-black/18"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-card-foreground">
                      {inlineText(item.label)}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-foreground/62">
                      {inlineText(item.caption)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-card-foreground">
                      {item.priceLabel}
                    </p>
                    <p className="mt-2 text-sm text-foreground/56">+{item.points} pts</p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isProcessing || payment.surface === "settling"}
                  onClick={() => {
                    void handleTopUp(item);
                  }}
                  className="mt-5 min-h-[3.5rem] w-full rounded-[1.35rem] bg-white px-4 py-4 text-sm font-semibold text-black transition hover:opacity-92 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {isPaidPackage
                    ? t("已入帳", "Paid")
                    : isProcessing
                      ? t("前往付款中", "Opening payment")
                      : payment.surface === "settling"
                        ? t("等待確認", "Waiting")
                        : t("選這個方案", "Choose this")}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-[1.8rem] bg-white/[0.04] p-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-card-foreground">
            {t("最近變動", "Recent activity")}
          </h2>
          <span className="text-sm text-foreground/56">
            {hasTransactions
              ? t(
                  `最近 ${Math.min(ledger.transactions.length, 24)} 筆`,
                  `Last ${Math.min(ledger.transactions.length, 24)}`,
                )
              : t("目前沒有資料", "No activity")}
          </span>
        </div>

        {hasTransactions ? (
          <div className="mt-4 grid gap-3">
            {ledger.transactions.map((entry) => (
              <TransactionItem
                key={entry.id}
                entry={entry}
                inlineText={inlineText}
              />
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm leading-7 text-foreground/62">
            {t(
              "補點、使用點數或領取每日回訪後，這裡會留下紀錄。",
              "Top-ups, spending, and daily returns will appear here.",
            )}
          </p>
        )}
      </div>

      <div className="mt-auto grid gap-3">
        <Link
          href={cancelHref}
          className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-center text-sm font-medium text-card-foreground transition hover:border-line-strong hover:bg-white/[0.07]"
        >
          {cancelLabel}
        </Link>

        {!props.intent ? (
          <Link
            href="/question"
            className="min-h-[3.5rem] rounded-[1.35rem] bg-white px-4 py-4 text-center text-sm font-semibold text-black transition hover:opacity-92"
          >
            {t("開始抽牌", "Start reading")}
          </Link>
        ) : (
          <Link
            href="/history"
            className="min-h-[3.5rem] rounded-[1.35rem] border border-white/10 bg-black/18 px-4 py-4 text-center text-sm font-medium text-card-foreground transition hover:border-line-strong hover:bg-white/[0.05]"
          >
            {t("查看紀錄", "Open history")}
          </Link>
        )}
      </div>
    </section>
  );
}
