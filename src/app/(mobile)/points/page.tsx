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
        eyebrow="Points access"
        title="Link a profile before opening your balance."
        body="Points stay attached to one LINE identity so every reading, follow-up, and balance movement returns to the same place."
        primaryHref="/auth/line"
        primaryLabel="Continue with LINE"
        secondaryHref="/"
        secondaryLabel="Back to home"
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
        eyebrow="Ledger unavailable"
        title="The points ledger is quiet for a moment."
        body="The balance is still attached to your profile, but this surface needs another pass before it opens clearly again."
        primaryHref={getRetryHref(intent, returnTo)}
        primaryLabel="Try again"
        secondaryHref={intent ? returnTo : "/question"}
        secondaryLabel={intent ? "Back to reading" : "Begin a new question"}
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
