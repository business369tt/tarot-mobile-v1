# V1 Staging Preflight

Last updated: 2026-04-04

This file records what can be confirmed locally before a real staging run starts. It is not staging evidence.

## Current Snapshot

| Field | Value |
| --- | --- |
| Tester | Codex preflight |
| Date | 2026-04-04 |
| Staging URL | Pending: not found in repo-local env |
| Commit / branch | `main` @ `85dedb9` |
| Workspace status | Dirty working tree with local launch-closing changes |
| Env snapshot location | `D:\00-Codex\tarot-mobile-v1\.env` |

## Local Env Check

- `AUTH_URL` is `http://localhost:3000`, which is local dev, not staging.
- `AUTH_LINE_ID` is empty.
- `AUTH_LINE_SECRET` is empty.
- No ECPay env values are present in `.env`.
- `MINIMAX_API_KEY` is empty.

## Deployment Settings Screenshot Check

- Deployment platform env vars are present for:
  - `AUTH_LINE_ID`
  - `AUTH_LINE_SECRET`
  - `AUTH_URL`
  - `NEXT_PUBLIC_APP_URL`
  - `DATABASE_URL`
  - `AUTH_SECRET`
  - `AUTH_TRUST_HOST`
  - `MINIMAX_MODEL`
  - `READING_COST_POINTS`
  - `FOLLOWUP_COST_POINTS`
  - `POINTS_PAYMENT_CURRENCY`
  - `POINTS_PACKAGE_PRIMARY`
  - `POINTS_PACKAGE_PRIMARY_AMOUNT_MINOR`
  - `POINTS_PACKAGE_SECONDARY`
  - `POINTS_PACKAGE_SECONDARY_AMOUNT_MINOR`
  - `INVITE_REWARD_POINTS`
  - `DAILY_CHECKIN_POINTS`
- The screenshot does not visibly confirm:
  - `MINIMAX_API_KEY`
  - Any `ECPAY_*` variables
  - The actual deployed staging URL
- The screenshot shows a mix of `Production` and `All Environments`, but it does not prove that a dedicated staging / preview deployment is available and healthy.

## Preflight Conclusion

- A real staging URL is still not available from the repo state or the screenshot.
- LINE appears configured in the deployment platform, even though local `.env` is empty.
- ECPay cannot be confirmed from the screenshot.
- MiniMax model configuration can be confirmed from the screenshot, but `MINIMAX_API_KEY` cannot.
- Staging acceptance should not start until the real staging URL and deployed env configuration are confirmed.
