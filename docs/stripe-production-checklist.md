# Stripe Production Checklist

Last updated: 2026-04-01

Official references:
- https://docs.stripe.com/keys
- https://docs.stripe.com/webhooks
- https://docs.stripe.com/payments/checkout/build-integration

## Account And Live Mode

- [ ] The Stripe account is fully activated for live payments.
- [ ] Business verification, payout bank account, and payout schedule are confirmed in the Stripe Dashboard.
- [ ] `STRIPE_SECRET_KEY` uses a live secret key, not a test key.
- [ ] Live key access is stored in the deployment platform's secret manager.
- [ ] Any former team members no longer have access to live keys.

## Checkout And Return URLs

- [ ] `AUTH_URL` and `NEXT_PUBLIC_APP_URL` both point to the final public HTTPS origin.
- [ ] Successful Checkout returns to `/points?payment=success&order=...`.
- [ ] Canceled Checkout returns to `/points?payment=cancel&order=...`.
- [ ] Reading restore returns continue back to `/reading`.
- [ ] Follow-up restore returns continue back to `/reading?resume=followup`.

## Webhooks

- [ ] A live webhook endpoint exists for:
  - `${AUTH_URL}/api/payments/stripe/webhook`
- [ ] `STRIPE_WEBHOOK_SECRET` matches that exact live endpoint.
- [ ] HTTPS is valid end-to-end for the webhook endpoint.
- [ ] At least these events are visible in delivery history during validation:
  - `checkout.session.completed`
  - `checkout.session.async_payment_succeeded`
  - `checkout.session.async_payment_failed`
  - `checkout.session.expired`
- [ ] A real or controlled live validation payment reaches the webhook and settles the order to `paid`.

## Product Config

- [ ] Launch prices match the env values:
  - `POINTS_PACKAGE_PRIMARY_AMOUNT_MINOR`
  - `POINTS_PACKAGE_SECONDARY_AMOUNT_MINOR`
- [ ] Launch point quantities match the env values:
  - `POINTS_PACKAGE_PRIMARY`
  - `POINTS_PACKAGE_SECONDARY`
- [ ] Currency matches `POINTS_PAYMENT_CURRENCY`.
- [ ] Customer-facing package labels and price display are final on `/points`.

## Failure Recovery

- [ ] Cancel from Checkout returns to `/points` with retry copy.
- [ ] Failed or expired payments remain recoverable from `/points`.
- [ ] Reopening an order from another LINE profile is blocked.
- [ ] Missing Stripe config produces a clean product state instead of a broken redirect.
