import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  getStripeServer,
  getStripeWebhookSecret,
  isStripeConfigured,
  isStripeWebhookConfigured,
} from "@/lib/stripe";
import {
  markTopUpOrderFromWebhook,
  settleTopUpOrderFromCheckoutSession,
} from "@/lib/top-up-orders";

export const runtime = "nodejs";

function getProviderPaymentId(checkoutSession: Stripe.Checkout.Session) {
  return typeof checkoutSession.payment_intent === "string"
    ? checkoutSession.payment_intent
    : checkoutSession.payment_intent?.id ?? null;
}

export async function POST(request: Request) {
  if (!isStripeConfigured() || !isStripeWebhookConfigured()) {
    return NextResponse.json(
      { message: "Stripe webhook is not configured." },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { message: "Missing Stripe signature." },
      { status: 400 },
    );
  }

  const payload = await request.text();
  const stripe = getStripeServer();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      getStripeWebhookSecret(),
    );
  } catch (error) {
    console.error("Stripe webhook signature verification failed", error);

    return NextResponse.json(
      { message: "Unable to verify Stripe webhook." },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        await settleTopUpOrderFromCheckoutSession(
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      }
      case "checkout.session.async_payment_failed": {
        const checkoutSession = event.data.object as Stripe.Checkout.Session;
        await markTopUpOrderFromWebhook({
          checkoutSessionId: checkoutSession.id,
          status: "failed",
          message: "The payment did not complete this time.",
          providerPaymentId: getProviderPaymentId(checkoutSession),
        });
        break;
      }
      case "checkout.session.expired": {
        const checkoutSession = event.data.object as Stripe.Checkout.Session;
        await markTopUpOrderFromWebhook({
          checkoutSessionId: checkoutSession.id,
          status: "canceled",
          providerPaymentId: getProviderPaymentId(checkoutSession),
        });
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error("Stripe webhook handling failed", error);

    return NextResponse.json(
      { message: "Stripe webhook handling failed." },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
