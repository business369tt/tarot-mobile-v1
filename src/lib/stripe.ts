import Stripe from "stripe";

const globalForStripe = globalThis as unknown as {
  stripe?: Stripe;
};

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name}_MISSING`);
  }

  return value;
}

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function isStripeWebhookConfigured() {
  return Boolean(process.env.STRIPE_WEBHOOK_SECRET?.trim());
}

export function getStripeServer() {
  const secretKey = getRequiredEnv("STRIPE_SECRET_KEY");

  if (!globalForStripe.stripe) {
    globalForStripe.stripe = new Stripe(secretKey, {
      maxNetworkRetries: 2,
    });
  }

  return globalForStripe.stripe;
}

export function getStripeWebhookSecret() {
  return getRequiredEnv("STRIPE_WEBHOOK_SECRET");
}

export const stripeProviderLabel = "Stripe 結帳 / Stripe Checkout";
