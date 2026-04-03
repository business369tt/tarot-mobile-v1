import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getPointsIntent,
  getPointsReturnTo,
  type MaybePointsIntent,
} from "@/lib/points";
import { isEcpayConfigured } from "@/lib/ecpay";
import { createTopUpCheckoutOrder } from "@/lib/top-up-orders";
import { hasConfiguredPublicAppUrl } from "@/lib/app-env";

export const runtime = "nodejs";

type TopUpRequestBody = Partial<{
  packageId: string;
  requestKey: string;
  intent: MaybePointsIntent;
  returnTo: string;
}>;

async function getViewerId() {
  const session = await auth();

  return session?.user?.id ?? null;
}

function createRequestKey(userId: string, packageId: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `topup:${userId}:${packageId}:${crypto.randomUUID()}`;
  }

  return `topup:${userId}:${packageId}:${Date.now().toString(36)}`;
}

export async function POST(request: Request) {
  const viewerId = await getViewerId();

  if (!viewerId) {
    return NextResponse.json(
      { message: "請先登入，再補點。" },
      { status: 401 },
    );
  }

  if (!isEcpayConfigured()) {
    return NextResponse.json(
      {
        message: "這個環境目前無法開啟補點，請先完成 ECPay 設定後再試一次。",
      },
      { status: 503 },
    );
  }

  if (!hasConfiguredPublicAppUrl()) {
    return NextResponse.json(
      {
        message:
          "請先設定 AUTH_URL 或 NEXT_PUBLIC_APP_URL，才能開啟這次補點。",
      },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as TopUpRequestBody;
  const intent = getPointsIntent(body.intent ?? undefined);
  const returnTo = getPointsReturnTo(body.returnTo, intent);
  const packageId =
    typeof body.packageId === "string" && body.packageId
      ? body.packageId
      : "reading-topup";
  const requestKey =
    typeof body.requestKey === "string" && body.requestKey
      ? body.requestKey
      : createRequestKey(viewerId, packageId);

  try {
    const { order, checkoutUrl } = await createTopUpCheckoutOrder({
      userId: viewerId,
      packageId,
      requestKey,
      intent,
      returnTo,
    });

    if (!checkoutUrl) {
      return NextResponse.json(
        {
          message: "這筆補點已經建立，請回到同一個點數頁繼續。",
          order,
        },
        { status: 409 },
      );
    }

    return NextResponse.json({
      status: "redirect",
      checkoutUrl,
      order,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "APP_BASE_URL_MISSING" ||
        error.message === "APP_BASE_URL_HTTPS_REQUIRED")
    ) {
      return NextResponse.json(
        {
          message:
            error.message === "APP_BASE_URL_HTTPS_REQUIRED"
              ? "正式環境的 ECPay 補點需要 HTTPS 的 AUTH_URL 或 NEXT_PUBLIC_APP_URL。"
              : "開啟 ECPay 之前，請先設定 AUTH_URL 或 NEXT_PUBLIC_APP_URL。",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        message: "這次沒有順利打開付款頁，請再試一次相同的補點步驟。",
      },
      { status: 502 },
    );
  }
}
