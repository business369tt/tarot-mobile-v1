import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAppBaseUrl } from "@/lib/app-env";
import {
  buildPointsPaymentRedirectPath,
  getEcpayCheckoutLaunchForViewer,
} from "@/lib/top-up-orders";

export const runtime = "nodejs";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildCheckoutDocument(action: string, fields: Record<string, string>) {
  const inputs = Object.entries(fields)
    .map(
      ([name, value]) =>
        `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}" />`,
    )
    .join("");

  return `<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Redirecting to ECPay</title>
  </head>
  <body>
    <form id="ecpay-checkout" method="post" action="${escapeHtml(action)}">
      ${inputs}
      <noscript>
        <button type="submit">Continue to ECPay</button>
      </noscript>
    </form>
    <script>
      document.getElementById("ecpay-checkout")?.submit();
    </script>
  </body>
</html>`;
}

async function getViewerId() {
  const session = await auth();

  return session?.user?.id ?? null;
}

export async function GET(request: Request) {
  const appBaseUrl = getAppBaseUrl();
  const viewerId = await getViewerId();

  if (!viewerId) {
    return NextResponse.redirect(new URL("/auth/line", appBaseUrl), 303);
  }

  const url = new URL(request.url);
  const orderId = url.searchParams.get("order");

  if (!orderId) {
    return NextResponse.redirect(
      new URL("/points?payment=failed", appBaseUrl),
      303,
    );
  }

  const launch = await getEcpayCheckoutLaunchForViewer(orderId, viewerId);

  if (!launch) {
    return NextResponse.redirect(
      new URL(
        `/points?payment=failed&order=${encodeURIComponent(orderId)}`,
        appBaseUrl,
      ),
      303,
    );
  }

  if (!launch.action || !launch.fields) {
    const payment =
      launch.order.status === "paid"
        ? "success"
        : launch.order.status === "canceled"
          ? "cancel"
          : "failed";
    const redirectPath = buildPointsPaymentRedirectPath(launch.order, payment);

    return NextResponse.redirect(new URL(redirectPath, appBaseUrl), 303);
  }

  const html = buildCheckoutDocument(launch.action, launch.fields);

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
