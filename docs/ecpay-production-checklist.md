# ECPay Production Checklist

Last updated: 2026-04-03

Use this list before enabling live point top-ups in production.

## 1. Merchant And Credentials

- [ ] The ECPay merchant account is activated for live traffic.
- [ ] `ECPAY_ENV` is `production`.
- [ ] `ECPAY_MERCHANT_ID` is the production merchant id.
- [ ] `ECPAY_HASH_KEY` is the production hash key.
- [ ] `ECPAY_HASH_IV` is the production hash iv.
- [ ] Live credentials are stored only in the deployment platform secret manager.

## 2. Callback And Return URLs

- [ ] `AUTH_URL` and `NEXT_PUBLIC_APP_URL` both point at the final public HTTPS origin.
- [ ] LINE Login uses the same final production origin.
- [ ] The ECPay callback URL is:
  - `${AUTH_URL}/api/payments/ecpay/callback`
- [ ] The browser return URL is:
  - `${AUTH_URL}/api/payments/ecpay/return`
- [ ] Reading recovery returns continue back to `/reading`.
- [ ] Follow-up recovery returns continue back to `/reading?resume=followup`.

## 3. Product Config

- [ ] Launch prices match the env values:
  - `POINTS_PACKAGE_PRIMARY_AMOUNT_MINOR`
  - `POINTS_PACKAGE_SECONDARY_AMOUNT_MINOR`
- [ ] Launch point quantities match the env values:
  - `POINTS_PACKAGE_PRIMARY`
  - `POINTS_PACKAGE_SECONDARY`
- [ ] `POINTS_PAYMENT_CURRENCY` is `twd`.
- [ ] Customer-facing package labels and price display are final on `/points`.

## 4. Settlement And Recovery

- [ ] One successful ECPay payment settles points into the same user balance.
- [ ] Canceling ECPay returns to `/points` with clean retry copy.
- [ ] A failed payment stays recoverable from `/points`.
- [ ] Reopening an order from another LINE profile is blocked.
- [ ] Missing ECPay config produces a clean product state instead of a broken redirect.

## 5. Production Smoke Test

- [ ] Start one production top-up from reading recovery.
- [ ] Confirm the payment reaches `/api/payments/ecpay/callback`.
- [ ] Confirm the order status becomes `paid`.
- [ ] Confirm points are credited exactly once.
- [ ] Confirm the user returns to the intended page after payment.
