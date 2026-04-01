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
        eyebrow="點數入口"
        eyebrowEn="Points access"
        title="先連結身份，才能打開你的點數餘額。"
        titleEn="Link a profile before opening your balance."
        body="點數會綁定在單一 LINE 身份下，因此每次解讀、追問與點數變動都會回到同一個位置。"
        bodyEn="Points stay attached to one LINE identity so every reading, follow-up, and balance movement returns to the same place."
        primaryHref="/auth/line"
        primaryLabel="使用 LINE 繼續（Continue with LINE）"
        secondaryHref="/"
        secondaryLabel="回到首頁（Back to home）"
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
        eyebrow="點數帳本暫停"
        eyebrowEn="Ledger unavailable"
        title="點數帳本目前暫時無法顯示。"
        titleEn="The points ledger is quiet for a moment."
        body="你的點數仍然綁定在目前身份下，但這個頁面需要再重新整理一次，才能清楚開啟。"
        bodyEn="The balance is still attached to your profile, but this surface needs another pass before it opens clearly again."
        primaryHref={getRetryHref(intent, returnTo)}
        primaryLabel="再試一次（Try again）"
        secondaryHref={intent ? returnTo : "/question"}
        secondaryLabel={
          intent
            ? "回到解讀（Back to reading）"
            : "開始新的提問（Begin a new question）"
        }
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
