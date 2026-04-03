import {
  buildEcpayCheckoutFields,
  createEcpayMerchantTradeNo,
  getEcpayProviderLabel,
  type EcpayCheckoutFields,
  toEcpayTotalAmount,
} from "@/lib/ecpay";
import { getAppBaseUrl } from "@/lib/app-env";
import {
  formatCurrencyMinor,
  getPointPackage,
  getPointsIntent,
  getPointsReturnTo,
  type MaybePointsIntent,
} from "@/lib/points";
import { prisma, type TransactionClient } from "@/lib/prisma";

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

export type EcpayCheckoutLaunch =
  | {
      order: TopUpOrderView;
      action: string;
      fields: EcpayCheckoutFields;
    }
  | {
      order: TopUpOrderView;
      action: null;
      fields: null;
    };

type TopUpCheckoutArgs = {
  userId: string;
  packageId: string | null | undefined;
  requestKey: string;
  intent: MaybePointsIntent;
  returnTo: string;
};

type TopUpOrderRecord = Awaited<ReturnType<typeof prisma.topUpOrder.findUnique>>;

function mapIntent(value: string | null): MaybePointsIntent {
  return value === "reading" || value === "followup" ? value : null;
}

function getEcpayCheckoutPath(orderId: string) {
  return `/api/payments/ecpay/checkout?order=${encodeURIComponent(orderId)}`;
}

function buildPointsPathFromOrder(
  order: Pick<TopUpOrderView, "id" | "intent" | "returnTo">,
  payment: "success" | "cancel" | "failed",
) {
  const searchParams = new URLSearchParams({
    payment,
    order: order.id,
    returnTo: order.returnTo,
  });

  if (order.intent) {
    searchParams.set("intent", order.intent);
  }

  return `/points?${searchParams.toString()}`;
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
    providerLabel: getEcpayProviderLabel(record.provider),
    returnTo: record.returnTo,
    intent: mapIntent(record.intent),
    checkoutUrl:
      record.checkoutUrl ??
      (record.provider === "ecpay" ? getEcpayCheckoutPath(record.id) : null),
    errorMessage: record.errorMessage ?? null,
    createdAt: record.createdAt.toISOString(),
    paidAt: record.paidAt?.toISOString() ?? null,
    canceledAt: record.canceledAt?.toISOString() ?? null,
    failedAt: record.failedAt?.toISOString() ?? null,
  };
}

function getTopUpDescription(order: {
  packageLabel: string;
  provider: string;
}) {
  return `Top-up via ${getEcpayProviderLabel(order.provider)} · ${order.packageLabel}`;
}

function getProviderPaymentIdFromEcpay(payload: Record<string, string>) {
  return payload.TradeNo?.trim() || payload.PaymentNo?.trim() || null;
}

function getFailureMessageFromEcpay(payload: Record<string, string>) {
  const providerMessage = payload.RtnMsg?.trim();

  if (providerMessage) {
    return `ECPay 付款未完成：${providerMessage}`;
  }

  return "這次付款沒有完成。";
}

function buildEcpayReturnUrls(order: NonNullable<TopUpOrderRecord>) {
  const baseUrl = getAppBaseUrl();
  const callbackUrl = new URL("/api/payments/ecpay/callback", baseUrl);
  const orderResultUrl = new URL("/api/payments/ecpay/return", baseUrl);
  const clientBackUrl = new URL(
    buildPointsPathFromOrder(mapRecordToOrderView(order), "cancel"),
    baseUrl,
  );

  orderResultUrl.searchParams.set("order", order.id);

  if (order.intent) {
    orderResultUrl.searchParams.set("intent", order.intent);
  }

  orderResultUrl.searchParams.set("returnTo", order.returnTo);

  return {
    callbackUrl: callbackUrl.toString(),
    orderResultUrl: orderResultUrl.toString(),
    clientBackUrl: clientBackUrl.toString(),
  };
}

async function settleTopUpOrderById(args: {
  orderId: string;
  providerPaymentId?: string | null;
}) {
  return prisma.$transaction(async (tx: TransactionClient) => {
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
        description: getTopUpDescription(order),
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

async function updateOrderStatusByMerchantTradeNo(args: {
  merchantTradeNo: string;
  status: "canceled" | "failed";
  message?: string | null;
  providerPaymentId?: string | null;
}) {
  const order = await prisma.topUpOrder.findUnique({
    where: {
      checkoutSessionId: args.merchantTradeNo,
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

    const order = mapRecordToOrderView(existingOrder);

    return {
      order,
      checkoutUrl: order.checkoutUrl,
    };
  }

  const order = await prisma.topUpOrder.create({
    data: {
      userId: args.userId,
      packageId: selectedPackage.id,
      packageLabel: selectedPackage.label,
      packageCaption: selectedPackage.caption,
      points: selectedPackage.points,
      amountMinor: selectedPackage.amountMinor,
      currency: selectedPackage.currency,
      provider: "ecpay",
      status: "pending",
      requestKey: args.requestKey,
      intent,
      returnTo,
      checkoutSessionId: createEcpayMerchantTradeNo(),
    },
  });

  const current = await prisma.topUpOrder.update({
    where: { id: order.id },
    data: {
      checkoutUrl: getEcpayCheckoutPath(order.id),
    },
  });

  const view = mapRecordToOrderView(current);

  return {
    order: view,
    checkoutUrl: view.checkoutUrl,
  };
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

  return mapRecordToOrderView(order);
}

export async function getEcpayCheckoutLaunchForViewer(
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

  const view = mapRecordToOrderView(order);

  if (
    order.provider !== "ecpay" ||
    order.status !== "pending" ||
    !order.checkoutSessionId
  ) {
    return {
      order: view,
      action: null,
      fields: null,
    } satisfies EcpayCheckoutLaunch;
  }

  const urls = buildEcpayReturnUrls(order);
  const totalAmount = toEcpayTotalAmount(order.amountMinor, order.currency);
  const checkout = buildEcpayCheckoutFields({
    merchantTradeNo: order.checkoutSessionId,
    merchantTradeDate: order.createdAt,
    totalAmount,
    tradeDesc: "Tarot mobile points top-up",
    itemName: `${order.packageLabel} x 1`,
    returnUrl: urls.callbackUrl,
    orderResultUrl: urls.orderResultUrl,
    clientBackUrl: urls.clientBackUrl,
  });

  return {
    order: view,
    action: checkout.action,
    fields: checkout.fields,
  } satisfies EcpayCheckoutLaunch;
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
        errorMessage: args.message ?? "這次付款沒有完成。",
      },
    });

    return mapRecordToOrderView(current);
  }

  return mapRecordToOrderView(order);
}

export async function settleTopUpOrderFromEcpay(args: {
  merchantTradeNo: string;
  providerPaymentId?: string | null;
}) {
  const order = await prisma.topUpOrder.findUnique({
    where: {
      checkoutSessionId: args.merchantTradeNo,
    },
  });

  if (!order) {
    return null;
  }

  return settleTopUpOrderById({
    orderId: order.id,
    providerPaymentId: args.providerPaymentId,
  });
}

export async function markTopUpOrderFromEcpay(args: {
  merchantTradeNo: string;
  status: "canceled" | "failed";
  message?: string | null;
  providerPaymentId?: string | null;
}) {
  return updateOrderStatusByMerchantTradeNo(args);
}

export async function settleOrMarkTopUpOrderFromEcpayPayload(
  payload: Record<string, string>,
) {
  const merchantTradeNo = payload.MerchantTradeNo?.trim();

  if (!merchantTradeNo) {
    return null;
  }

  const providerPaymentId = getProviderPaymentIdFromEcpay(payload);

  if (payload.RtnCode?.trim() === "1") {
    return settleTopUpOrderFromEcpay({
      merchantTradeNo,
      providerPaymentId,
    });
  }

  return markTopUpOrderFromEcpay({
    merchantTradeNo,
    status: "failed",
    message: getFailureMessageFromEcpay(payload),
    providerPaymentId,
  });
}

export function buildPointsPaymentRedirectPath(
  order: Pick<TopUpOrderView, "id" | "intent" | "returnTo"> | null,
  payment: "success" | "cancel" | "failed",
  fallbackOrderId?: string | null,
) {
  if (!order) {
    const searchParams = new URLSearchParams({ payment });

    if (fallbackOrderId) {
      searchParams.set("order", fallbackOrderId);
    }

    return `/points?${searchParams.toString()}`;
  }

  return buildPointsPathFromOrder(order, payment);
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
        ? order.status === "paid"
          ? "點數已經補入你的餘額。"
          : "付款尚未完成，你可以稍後重新打開這筆補點。"
        : "這筆付款無法在目前帳號下重新開啟。",
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
      message: order?.errorMessage ?? "這次付款沒有完成。",
    } satisfies PointsPaymentView;
  }

  if (args.payment === "success") {
    const order = await getTopUpOrderForViewer(args.orderId, args.userId);

    if (!order) {
      return {
        surface: "failed",
        order: null,
        message: "這筆付款無法在目前帳號下重新開啟。",
      } satisfies PointsPaymentView;
    }

    if (order.status === "paid") {
      return {
        surface: "success",
        order,
        message: "點數已經補入你的餘額。",
      } satisfies PointsPaymentView;
    }

    if (order.status === "failed") {
      return {
        surface: "failed",
        order,
        message: order.errorMessage ?? "這次付款沒有完成。",
      } satisfies PointsPaymentView;
    }

    if (order.status === "canceled") {
      return {
        surface: "canceled",
        order,
        message: "付款尚未完成，你可以稍後重新打開這筆補點。",
      } satisfies PointsPaymentView;
    }

    return {
      surface: "settling",
      order,
      message: "付款已確認，系統正在更新點數餘額。",
    } satisfies PointsPaymentView;
  }

  return {
    surface: "idle",
    order: null,
    message: null,
  } satisfies PointsPaymentView;
}
