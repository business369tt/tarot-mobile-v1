import type Stripe from "stripe";
import {
  formatCurrencyMinor,
  getPointPackage,
  getPointsIntent,
  getPointsReturnTo,
  type MaybePointsIntent,
  type PointPackage,
} from "@/lib/points";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  getStripeServer,
  isStripeConfigured,
  stripeProviderLabel,
} from "@/lib/stripe";
import { getAppBaseUrl } from "@/lib/app-env";

export type TopUpOrderStatus = "pending" | "paid" | "canceled" | "failed";

export type TopUpOrderView = {
  id: string;
  status: TopUpOrderStatus;
  packageId: string;
  packageLabel: string;
  packageCaption: string | null;
  points: number;
  amountMinor: number;
  currency: string;
  amountLabel: string;
  providerLabel: string;
  returnTo: string;
  intent: MaybePointsIntent;
  checkoutUrl: string | null;
  errorMessage: string | null;
  createdAt: string;
  paidAt: string | null;
  canceledAt: string | null;
  failedAt: string | null;
};

export type PointsPaymentView =
  | {
      surface: "idle";
      order: null;
      message: null;
    }
  | {
      surface: "settling" | "success" | "canceled" | "failed";
      order: TopUpOrderView | null;
      message: string | null;
    };

type TopUpOrderRecord = Awaited<ReturnType<typeof prisma.topUpOrder.findUnique>>;

type TopUpCheckoutArgs = {
  userId: string;
  packageId: string | null | undefined;
  requestKey: string;
  intent: MaybePointsIntent;
  returnTo: string;
};

function mapIntent(value: string | null): MaybePointsIntent {
  return value === "reading" || value === "followup" ? value : null;
}

function mapRecordToOrderView(record: NonNullable<TopUpOrderRecord>): TopUpOrderView {
  return {
    id: record.id,
    status: record.status as TopUpOrderStatus,
    packageId: record.packageId,
    packageLabel: record.packageLabel,
    packageCaption: record.packageCaption,
    points: record.points,
    amountMinor: record.amountMinor,
    currency: record.currency,
    amountLabel: formatCurrencyMinor(record.amountMinor, record.currency),
    providerLabel: stripeProviderLabel,
    returnTo: record.returnTo,
    intent: mapIntent(record.intent),
    checkoutUrl: record.checkoutUrl ?? null,
    errorMessage: record.errorMessage ?? null,
    createdAt: record.createdAt.toISOString(),
    paidAt: record.paidAt?.toISOString() ?? null,
    canceledAt: record.canceledAt?.toISOString() ?? null,
    failedAt: record.failedAt?.toISOString() ?? null,
  };
}

function getProductDescription(pointPackage: PointPackage) {
  return `${pointPackage.caption} ${pointPackage.points} points will settle into the same balance used for readings and follow-ups.`;
}

async function createStripeCheckoutSession(args: {
  orderId: string;
  userId: string;
  pointPackage: PointPackage;
  requestKey: string;
  intent: MaybePointsIntent;
  returnTo: string;
}) {
  const stripe = getStripeServer();
  const baseUrl = getAppBaseUrl();
  const successUrl = new URL("/points", baseUrl);
  const cancelUrl = new URL("/points", baseUrl);

  if (args.intent) {
    successUrl.searchParams.set("intent", args.intent);
    cancelUrl.searchParams.set("intent", args.intent);
  }

  successUrl.searchParams.set("returnTo", args.returnTo);
  successUrl.searchParams.set("payment", "success");
  successUrl.searchParams.set("order", args.orderId);

  cancelUrl.searchParams.set("returnTo", args.returnTo);
  cancelUrl.searchParams.set("payment", "cancel");
  cancelUrl.searchParams.set("order", args.orderId);

  const metadata = {
    orderId: args.orderId,
    userId: args.userId,
    packageId: args.pointPackage.id,
    requestKey: args.requestKey,
    intent: args.intent ?? "",
    returnTo: args.returnTo,
    points: String(args.pointPackage.points),
  };

  return stripe.checkout.sessions.create(
    {
      mode: "payment",
      success_url: successUrl.toString(),
      cancel_url: cancelUrl.toString(),
      client_reference_id: args.orderId,
      metadata,
      payment_intent_data: {
        metadata,
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: args.pointPackage.currency,
            unit_amount: args.pointPackage.amountMinor,
            product_data: {
              name: args.pointPackage.label,
              description: getProductDescription(args.pointPackage),
            },
          },
        },
      ],
    },
    {
      idempotencyKey: `checkout:${args.requestKey}`,
    },
  );
}

function getTopUpDescription(packageLabel: string) {
  return `Top-up via ${packageLabel} · ${stripeProviderLabel}`;
}

async function settleTopUpOrderById(args: {
  orderId: string;
  providerPaymentId?: string | null;
}) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const order = await tx.topUpOrder.findUnique({
      where: { id: args.orderId },
    });

    if (!order) {
      return null;
    }

    if (order.pointTransactionId) {
      const current = await tx.topUpOrder.findUnique({
        where: { id: order.id },
      });

      return current ? mapRecordToOrderView(current) : null;
    }

    const existingTransaction = await tx.pointTransaction.findUnique({
      where: { requestKey: order.requestKey },
    });

    if (existingTransaction) {
      const current = await tx.topUpOrder.update({
        where: { id: order.id },
        data: {
          status: "paid",
          pointTransactionId: existingTransaction.id,
          providerPaymentId:
            args.providerPaymentId ?? order.providerPaymentId ?? null,
          paidAt: order.paidAt ?? new Date(),
          errorMessage: null,
        },
      });

      return mapRecordToOrderView(current);
    }

    const user = await tx.user.findUnique({
      where: { id: order.userId },
      select: { points: true },
    });

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const balanceAfter = user.points + order.points;
    const transaction = await tx.pointTransaction.create({
      data: {
        userId: order.userId,
        amount: order.points,
        balanceAfter,
        kind: "credit",
        source: "top_up",
        requestKey: order.requestKey,
        description: getTopUpDescription(order.packageLabel),
      },
    });

    await tx.user.update({
      where: { id: order.userId },
      data: {
        points: {
          increment: order.points,
        },
      },
    });

    const current = await tx.topUpOrder.update({
      where: { id: order.id },
      data: {
        status: "paid",
        pointTransactionId: transaction.id,
        providerPaymentId: args.providerPaymentId ?? order.providerPaymentId ?? null,
        paidAt: order.paidAt ?? new Date(),
        errorMessage: null,
      },
    });

    return mapRecordToOrderView(current);
  });
}

async function updateOrderStatusByCheckoutSession(args: {
  checkoutSessionId: string;
  status: TopUpOrderStatus;
  message?: string | null;
  providerPaymentId?: string | null;
}) {
  const order = await prisma.topUpOrder.findUnique({
    where: {
      checkoutSessionId: args.checkoutSessionId,
    },
  });

  if (!order || order.status === "paid") {
    return order ? mapRecordToOrderView(order) : null;
  }

  const now = new Date();
  const current = await prisma.topUpOrder.update({
    where: { id: order.id },
    data: {
      status: args.status,
      errorMessage: args.message ?? null,
      providerPaymentId: args.providerPaymentId ?? order.providerPaymentId ?? null,
      canceledAt:
        args.status === "canceled" ? order.canceledAt ?? now : order.canceledAt,
      failedAt:
        args.status === "failed" ? order.failedAt ?? now : order.failedAt,
    },
  });

  return mapRecordToOrderView(current);
}

async function syncPendingOrderWithStripe(order: NonNullable<TopUpOrderRecord>) {
  if (
    order.status !== "pending" ||
    !order.checkoutSessionId ||
    !isStripeConfigured()
  ) {
    return mapRecordToOrderView(order);
  }

  try {
    const stripe = getStripeServer();
    const checkoutSession = await stripe.checkout.sessions.retrieve(
      order.checkoutSessionId,
      {
        expand: ["payment_intent"],
      },
    );

    const providerPaymentId =
      typeof checkoutSession.payment_intent === "string"
        ? checkoutSession.payment_intent
        : checkoutSession.payment_intent?.id ?? null;

    if (checkoutSession.payment_status === "paid") {
      const settled = await settleTopUpOrderById({
        orderId: order.id,
        providerPaymentId,
      });

      return settled ?? mapRecordToOrderView(order);
    }

    if (checkoutSession.status === "expired") {
      const canceled = await updateOrderStatusByCheckoutSession({
        checkoutSessionId: checkoutSession.id,
        status: "canceled",
      });

      return canceled ?? mapRecordToOrderView(order);
    }

    const paymentIntentStatus =
      typeof checkoutSession.payment_intent === "object" &&
      checkoutSession.payment_intent
        ? checkoutSession.payment_intent.status
        : null;

    if (
      paymentIntentStatus === "canceled" ||
      paymentIntentStatus === "requires_payment_method"
    ) {
      const failed = await updateOrderStatusByCheckoutSession({
        checkoutSessionId: checkoutSession.id,
        status: "failed",
        message: "The payment did not complete this time.",
        providerPaymentId,
      });

      return failed ?? mapRecordToOrderView(order);
    }
  } catch (error) {
    console.error("Unable to sync top-up order with Stripe", error);
  }

  return mapRecordToOrderView(order);
}

export async function createTopUpCheckoutOrder(args: TopUpCheckoutArgs) {
  const intent = getPointsIntent(args.intent ?? undefined);
  const returnTo = getPointsReturnTo(args.returnTo, intent);
  const selectedPackage = getPointPackage(args.packageId);
  const existingOrder = await prisma.topUpOrder.findUnique({
    where: {
      requestKey: args.requestKey,
    },
  });

  if (existingOrder) {
    if (existingOrder.userId !== args.userId) {
      throw new Error("TOP_UP_REQUEST_CONFLICT");
    }

    return {
      order: mapRecordToOrderView(existingOrder),
      checkoutUrl: existingOrder.checkoutUrl,
    };
  }

  const draftOrder = await prisma.topUpOrder.create({
    data: {
      userId: args.userId,
      packageId: selectedPackage.id,
      packageLabel: selectedPackage.label,
      packageCaption: selectedPackage.caption,
      points: selectedPackage.points,
      amountMinor: selectedPackage.amountMinor,
      currency: selectedPackage.currency,
      provider: "stripe_checkout",
      status: "pending",
      requestKey: args.requestKey,
      intent,
      returnTo,
    },
  });

  try {
    const checkoutSession = await createStripeCheckoutSession({
      orderId: draftOrder.id,
      userId: args.userId,
      pointPackage: selectedPackage,
      requestKey: args.requestKey,
      intent,
      returnTo,
    });

    if (!checkoutSession.url) {
      throw new Error("CHECKOUT_URL_MISSING");
    }

    const current = await prisma.topUpOrder.update({
      where: { id: draftOrder.id },
      data: {
        checkoutSessionId: checkoutSession.id,
        checkoutUrl: checkoutSession.url,
      },
    });

    return {
      order: mapRecordToOrderView(current),
      checkoutUrl: checkoutSession.url,
    };
  } catch (error) {
    console.error("Unable to create Stripe Checkout session", error);

    await prisma.topUpOrder.update({
      where: { id: draftOrder.id },
      data: {
        status: "failed",
        errorMessage: "The payment link did not open this time.",
        failedAt: new Date(),
      },
    });

    throw error;
  }
}

export async function getTopUpOrderForViewer(orderId: string, userId: string) {
  const order = await prisma.topUpOrder.findFirst({
    where: {
      id: orderId,
      userId,
    },
  });

  if (!order) {
    return null;
  }

  return syncPendingOrderWithStripe(order);
}

export async function markTopUpOrderCanceledForViewer(
  orderId: string,
  userId: string,
) {
  const order = await prisma.topUpOrder.findFirst({
    where: {
      id: orderId,
      userId,
    },
  });

  if (!order) {
    return null;
  }

  if (order.status === "pending") {
    const current = await prisma.topUpOrder.update({
      where: { id: order.id },
      data: {
        status: "canceled",
        canceledAt: order.canceledAt ?? new Date(),
        errorMessage: null,
      },
    });

    return mapRecordToOrderView(current);
  }

  return mapRecordToOrderView(order);
}

export async function markTopUpOrderFailedForViewer(args: {
  orderId: string;
  userId: string;
  message?: string;
}) {
  const order = await prisma.topUpOrder.findFirst({
    where: {
      id: args.orderId,
      userId: args.userId,
    },
  });

  if (!order) {
    return null;
  }

  if (order.status === "pending") {
    const current = await prisma.topUpOrder.update({
      where: { id: order.id },
      data: {
        status: "failed",
        failedAt: order.failedAt ?? new Date(),
        errorMessage: args.message ?? "The payment did not complete this time.",
      },
    });

    return mapRecordToOrderView(current);
  }

  return mapRecordToOrderView(order);
}

export async function settleTopUpOrderFromCheckoutSession(
  checkoutSession: Stripe.Checkout.Session,
) {
  const orderId =
    checkoutSession.metadata?.orderId ??
    checkoutSession.client_reference_id ??
    null;

  const existingOrder =
    (checkoutSession.id
      ? await prisma.topUpOrder.findUnique({
          where: {
            checkoutSessionId: checkoutSession.id,
          },
        })
      : null) ??
    (orderId
      ? await prisma.topUpOrder.findUnique({
          where: {
            id: orderId,
          },
        })
      : null);

  if (!existingOrder) {
    return null;
  }

  const providerPaymentId =
    typeof checkoutSession.payment_intent === "string"
      ? checkoutSession.payment_intent
      : checkoutSession.payment_intent?.id ?? null;

  return settleTopUpOrderById({
    orderId: existingOrder.id,
    providerPaymentId,
  });
}

export async function markTopUpOrderFromWebhook(args: {
  checkoutSessionId: string;
  status: "canceled" | "failed";
  message?: string | null;
  providerPaymentId?: string | null;
}) {
  return updateOrderStatusByCheckoutSession(args);
}

export async function resolvePointsPaymentView(args: {
  userId: string;
  payment: string | string[] | undefined;
  orderId: string | string[] | undefined;
}) {
  if (typeof args.orderId !== "string" || !args.orderId) {
    return {
      surface: "idle",
      order: null,
      message: null,
    } satisfies PointsPaymentView;
  }

  if (args.payment === "cancel") {
    const order = await markTopUpOrderCanceledForViewer(args.orderId, args.userId);

    return {
      surface: order?.status === "paid" ? "success" : "canceled",
      order,
      message: order
        ? "No points moved yet. You can return to the same restore step whenever you are ready."
        : "That payment return could not be reopened from this profile.",
    } satisfies PointsPaymentView;
  }

  if (args.payment === "failed") {
    const order = await markTopUpOrderFailedForViewer({
      orderId: args.orderId,
      userId: args.userId,
    });

    return {
      surface: "failed",
      order,
      message: order?.errorMessage ?? "The payment did not settle this time.",
    } satisfies PointsPaymentView;
  }

  if (args.payment === "success") {
    const order = await getTopUpOrderForViewer(args.orderId, args.userId);

    if (!order) {
      return {
        surface: "failed",
        order: null,
        message: "The payment return could not be reopened from this profile.",
      } satisfies PointsPaymentView;
    }

    if (order?.status === "paid") {
      return {
        surface: "success",
        order,
        message: "The points have settled into your balance.",
      } satisfies PointsPaymentView;
    }

    if (order?.status === "failed") {
      return {
        surface: "failed",
        order,
        message: order.errorMessage ?? "The payment did not settle this time.",
      } satisfies PointsPaymentView;
    }

    if (order?.status === "canceled") {
      return {
        surface: "canceled",
        order,
        message: "No points moved yet. You can reopen the same restore step whenever you are ready.",
      } satisfies PointsPaymentView;
    }

    return {
      surface: "settling",
      order,
      message: "Payment is confirmed. The balance is settling now.",
    } satisfies PointsPaymentView;
  }

  return {
    surface: "idle",
    order: null,
    message: null,
  } satisfies PointsPaymentView;
}


