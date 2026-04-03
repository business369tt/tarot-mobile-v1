# V1 Launch Final Checklist

Last updated: 2026-04-01

This checklist is the final release gate for `tarot-mobile-v1`. It is limited to production hardening, staging acceptance, and launch cleanliness. No new feature scope should be added here.

## 1. Env And Config Freeze

- [ ] `AUTH_URL` and `NEXT_PUBLIC_APP_URL` both point to the same public HTTPS origin.
- [ ] `AUTH_SECRET` is rotated to a production-only secret.
- [ ] `DATABASE_URL` points to a persistent SQLite file path on a single writable production instance.
- [ ] `APP_TIMEZONE` is set to the business timezone used for daily check-in settlement.
- [ ] `AUTH_LINE_ID` and `AUTH_LINE_SECRET` are production credentials, not dev or test values.
- [ ] `ECPAY_ENV` is set to `production`.
- [ ] `ECPAY_MERCHANT_ID`, `ECPAY_HASH_KEY`, and `ECPAY_HASH_IV` are production values.
- [ ] `MINIMAX_API_KEY` is a production key with enough quota for launch traffic.
- [ ] `MINIMAX_BASE_URL` is `https://api.minimax.io/anthropic` unless MiniMax changes the official Anthropic-compatible endpoint again.
- [ ] `MINIMAX_MODEL` is a currently enabled production model on the chosen MiniMax plan.
- [ ] Product knobs are frozen for launch:
  - `READING_COST_POINTS`
  - `FOLLOWUP_COST_POINTS`
  - `POINTS_PACKAGE_PRIMARY`
  - `POINTS_PACKAGE_PRIMARY_AMOUNT_MINOR`
  - `POINTS_PACKAGE_SECONDARY`
  - `POINTS_PACKAGE_SECONDARY_AMOUNT_MINOR`
  - `INVITE_REWARD_POINTS`
  - `DAILY_CHECKIN_POINTS`

## 2. Third-Party Production Readiness

- [ ] Review and complete [docs/line-production-checklist.md](./line-production-checklist.md).
- [ ] Review and complete [docs/ecpay-production-checklist.md](./ecpay-production-checklist.md).
- [ ] Review and complete [docs/minimax-production-checklist.md](./minimax-production-checklist.md).

## 3. Staging Acceptance

- [ ] Run the full acceptance pass in [docs/v1-staging-acceptance.md](./v1-staging-acceptance.md).
- [ ] Capture one successful evidence pass for:
  - LINE sign-in
  - Reading purchase recovery
  - Follow-up purchase recovery
  - Invite claim
  - History save and reopen
  - Daily check-in

## 4. Fallback And Error-State Pass

- [ ] Unmatched routes show the branded 404 page.
- [ ] Unexpected mobile route render errors show the branded retry fallback.
- [ ] Missing LINE credentials disable LINE sign-in with clear copy.
- [ ] Missing ECPay config returns a clear payment unavailable state instead of opening a broken payment flow.
- [ ] Missing app base URL blocks ECPay creation with a config-specific message.
- [ ] Missing MiniMax config produces productized unavailable copy for reading and follow-up generation.
- [ ] Invite, points, and history recovery states use production-safe wording and do not mention placeholder or future surfaces.

## 5. Repo And Build Cleanliness

- [ ] Dead placeholder files are removed from the codebase.
- [ ] `.env*`, `.next`, and local SQLite files remain ignored.
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.
- [ ] No launch docs or README instructions still reference dev-only behavior as the primary path.

## 6. Final Go / No-Go

- [ ] Production secrets are stored in the deployment platform, not in repo files.
- [ ] One successful ECPay callback has been observed in production logs.
- [ ] LINE callback URL has been checked against the final production domain.
- [ ] MiniMax billing and quota are confirmed for launch day traffic.
- [ ] Rollback owner, deploy owner, and post-launch monitor owner are explicitly assigned.
