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
      { message: "Sign in to restore your balance." },
      { status: 401 },
    );
  }

  if (!isEcpayConfigured()) {
    return NextResponse.json(
      {
        message:
          "Payments are unavailable on this environment. Add the ECPay settings first, then reopen this restore step.",
      },
      { status: 503 },
    );
  }

  if (!hasConfiguredPublicAppUrl()) {
    return NextResponse.json(
      {
        message:
          "Set AUTH_URL or NEXT_PUBLIC_APP_URL before opening ECPay from this environment.",
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
          message:
            "This restore order is already being held. Reopen it from the same points page and continue there.",
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
              ? "ECPay needs an HTTPS AUTH_URL or NEXT_PUBLIC_APP_URL in production."
              : "ECPay needs AUTH_URL or NEXT_PUBLIC_APP_URL before it can open.",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        message:
          "The payment link did not open this time. Try the same top-up step once more.",
      },
      { status: 502 },
    );
  }
}
