# Tarot Mobile V1

Mobile-first tarot reading app built with Next.js App Router, TypeScript, Tailwind CSS, Auth.js, Prisma, LINE Login, ECPay, and MiniMax.

## Local setup

1. Copy `.env.example` into `.env`
2. Generate the Prisma client
3. Initialize the local SQLite database
4. Start the app

```bash
npm install
npm run prisma:generate
npm run db:init
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

Keep these values aligned before staging or production:

```bash
DATABASE_URL="file:./prisma/dev.db"
AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
AUTH_SECRET="replace-with-a-long-random-secret"
APP_TIMEZONE="Asia/Taipei"
AUTH_LINE_ID="your-line-channel-id"
AUTH_LINE_SECRET="your-line-channel-secret"
ECPAY_ENV="test"
ECPAY_MERCHANT_ID="your-ecpay-merchant-id"
ECPAY_HASH_KEY="your-ecpay-hash-key"
ECPAY_HASH_IV="your-ecpay-hash-iv"
MINIMAX_API_KEY="your-minimax-api-key"
MINIMAX_MODEL="MiniMax-M2.5"
MINIMAX_BASE_URL="https://api.minimax.io/anthropic"
READING_COST_POINTS="3"
FOLLOWUP_COST_POINTS="2"
POINTS_PAYMENT_CURRENCY="twd"
POINTS_PACKAGE_PRIMARY="5"
POINTS_PACKAGE_PRIMARY_AMOUNT_MINOR="19000"
POINTS_PACKAGE_SECONDARY="12"
POINTS_PACKAGE_SECONDARY_AMOUNT_MINOR="39000"
INVITE_REWARD_POINTS="4"
DAILY_CHECKIN_POINTS="1"
```

Notes:
- `AUTH_URL` and `NEXT_PUBLIC_APP_URL` should point at the same public origin. ECPay return URLs and invite links both depend on this.
- `APP_TIMEZONE` controls the daily check-in day boundary.
- `MINIMAX_BASE_URL` is the Anthropic-compatible MiniMax endpoint.
- `POINTS_PACKAGE_*_AMOUNT_MINOR` stay in app minor units. With this setup, `19000` maps to `TWD 190.00`, and ECPay receives the converted integer amount `190`.
- The current Prisma adapter is SQLite. For production, run this app on a single writable instance with a persistent volume or shared disk strategy.

## LINE Login

Use this callback URL in the LINE Developers Console:

```bash
${AUTH_URL}/api/auth/callback/line
```

For local development that is usually `http://localhost:3000/api/auth/callback/line`.

## ECPay top-up flow

This app uses ECPay for point top-ups.

1. Fill `ECPAY_ENV`, `ECPAY_MERCHANT_ID`, `ECPAY_HASH_KEY`, `ECPAY_HASH_IV`, `AUTH_URL`, and `NEXT_PUBLIC_APP_URL` in `.env`
2. Start the app:

```bash
npm run dev
```

3. In the ECPay dashboard, set the callback URL to:

```bash
${AUTH_URL}/api/payments/ecpay/callback
```

4. Set the browser return URL to:

```bash
${AUTH_URL}/api/payments/ecpay/return
```

5. Open `/points`, pick a package, and go through the ECPay flow

The return flow is preserved:
- From `/reading`, a successful top-up returns to `/reading`
- From follow-up recovery, a successful top-up returns to `/reading?resume=followup`
- Cancel and failed payment returns stay inside `/points` with productized retry or back paths

## Current app layers

- Real Auth.js session source of truth for viewer identity
- Real server-side Tarot session route at `/api/tarot-session`
- Real server-side reading route at `/api/reading/current`
- Real server-side follow-up route at `/api/followup/current`
- MiniMax-backed tarot reading generation via the official Anthropic-compatible MiniMax endpoint
- Prisma schema for `User`, `Account`, `Session`, `VerificationToken`, and `TarotSession`
- Prisma schema for `ReadingRecord`
- Prisma schema for `FollowupRecord`
- Prisma schema for `PointTransaction` and `User.points`
- Prisma schema for `TopUpOrder`
- Real ECPay top-up order creation, callback settlement, and return recovery
- Local SQLite bootstrap script for development

## Launch docs

- [docs/v1-launch-final-checklist.md](docs/v1-launch-final-checklist.md)
- [docs/v1-staging-acceptance.md](docs/v1-staging-acceptance.md)
- [docs/line-production-checklist.md](docs/line-production-checklist.md)
- [docs/ecpay-production-checklist.md](docs/ecpay-production-checklist.md)
- [docs/minimax-production-checklist.md](docs/minimax-production-checklist.md)

## Verification

```bash
npm run lint
npm run build
```
