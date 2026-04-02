import { auth } from "@/auth";
import { PointsScreen } from "@/components/points/points-screen";
import { PointsStateCard } from "@/components/points/points-state-card";
import {
  buildPointsHref,
  getPointsIntent,
  getPointsReturnTo,
  type MaybePointsIntent,
} from "@/lib/points";
import { getViewerPointsLedger } from "@/lib/points-ledger";
import { resolvePointsPaymentView } from "@/lib/top-up-orders";

function getRetryHref(intent: MaybePointsIntent, returnTo: string) {
  if (!intent) {
    return "/points";
  }

  return buildPointsHref({
    intent,
    returnTo,
  });
}

export default async function PointsPage({
  searchParams,
}: {
  searchParams: Promise<{
    intent?: string | string[];
    returnTo?: string | string[];
    payment?: string | string[];
    order?: string | string[];
  }>;
}) {
  const query = await searchParams;
  const intent = getPointsIntent(query.intent);
  const returnTo = getPointsReturnTo(query.returnTo, intent);
  const session = await auth();
  const viewerId = session?.user?.id ?? null;

  if (!viewerId) {
    return (
      <PointsStateCard
        eyebrow="點數"
        eyebrowEn="Points"
        title="先登入再查看點數"
        titleEn="Sign in to view points"
        body="點數與付款紀錄都會綁定在同一個 LINE 身份下。"
        bodyEn="Points and payment history stay attached to the same LINE profile."
        primaryHref="/auth/line"
        primaryLabel="使用 LINE 登入"
        secondaryHref="/"
        secondaryLabel="回到首頁"
      />
    );
  }

  let paymentView;

  try {
    paymentView = await resolvePointsPaymentView({
      userId: viewerId,
      payment: query.payment,
      orderId: query.order,
    });
  } catch {
    paymentView = {
      surface: "failed" as const,
      order: null,
      message:
        "The payment return could not be reopened cleanly. You can still come back to the balance and try again.",
    };
  }

  let ledger = null;

  try {
    ledger = await getViewerPointsLedger(viewerId);
  } catch {
    return (
      <PointsStateCard
        eyebrow="點數"
        eyebrowEn="Points"
        title="點數頁暫時打不開"
        titleEn="Points are unavailable right now"
        body="稍後再試一次，或先回到原本流程。"
        bodyEn="Try again in a moment, or return to your previous flow."
        primaryHref={getRetryHref(intent, returnTo)}
        primaryLabel="重新整理"
        secondaryHref={intent ? returnTo : "/question"}
        secondaryLabel={intent ? "回到原流程" : "開始抽牌"}
      />
    );
  }

  return (
    <PointsScreen
      initialLedger={ledger}
      intent={intent}
      returnTo={returnTo}
      initialPayment={paymentView}
    />
  );
}
