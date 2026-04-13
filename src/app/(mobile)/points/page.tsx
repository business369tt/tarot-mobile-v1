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
        title="登入後才能查看點數與補點狀態"
        titleEn="Sign in to view points"
        body="你的點數與付款狀態，會跟著同一個登入身分一起保留。"
        bodyEn="Points and payment status stay attached to the same signed-in profile."
        primaryHref="/auth/line"
        primaryLabel="登入查看點數"
        secondaryHref="/"
        secondaryLabel="返回首頁"
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
      message: "付款回傳狀態暫時無法重新打開，你仍然可以回到點數頁後再試一次。",
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
        title="點數資料暫時無法讀取"
        titleEn="Points are unavailable right now"
        body="請稍後再試一次，或先回到剛才的流程，之後再回來補點。"
        bodyEn="Try again in a moment, or return to your previous flow."
        primaryHref={getRetryHref(intent, returnTo)}
        primaryLabel="重新整理"
        secondaryHref={intent ? returnTo : "/question"}
        secondaryLabel={intent ? "回到剛才流程" : "開始新的提問"}
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
