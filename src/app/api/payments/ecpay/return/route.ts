import { NextResponse } from "next/server";
import { getAppBaseUrl } from "@/lib/app-env";
import { verifyEcpayCheckMacValue } from "@/lib/ecpay";
import {
  buildPointsPaymentRedirectPath,
  settleOrMarkTopUpOrderFromEcpayPayload,
} from "@/lib/top-up-orders";

export const runtime = "nodejs";

function formDataToPayload(formData: FormData) {
  const payload: Record<string, string> = {};

  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      payload[key] = value;
    }
  }

  return payload;
}

function resolveFallbackRedirect(request: Request, payment: "cancel" | "failed") {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("order");
  const appBaseUrl = getAppBaseUrl();

  return new URL(
    buildPointsPaymentRedirectPath(null, payment, orderId),
    appBaseUrl,
  );
}

export async function GET(request: Request) {
  return NextResponse.redirect(resolveFallbackRedirect(request, "cancel"), 303);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const payload = formDataToPayload(formData);

  if (!verifyEcpayCheckMacValue(payload)) {
    return NextResponse.redirect(resolveFallbackRedirect(request, "failed"), 303);
  }

  try {
    const order = await settleOrMarkTopUpOrderFromEcpayPayload(payload);
    const payment =
      order?.status === "paid"
        ? "success"
        : order?.status === "canceled"
          ? "cancel"
          : "failed";
    const appBaseUrl = getAppBaseUrl();
    const redirectUrl = new URL(
      buildPointsPaymentRedirectPath(order, payment),
      appBaseUrl,
    );

    return NextResponse.redirect(redirectUrl, 303);
  } catch (error) {
    console.error("ECPay return handling failed", error);

    return NextResponse.redirect(resolveFallbackRedirect(request, "failed"), 303);
  }
}
