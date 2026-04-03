# Tarot Mobile V1 Open Items

Last updated: 2026-04-04

This is the remaining launch work after the current codebase cleanup pass. These are not feature requests.

## Must Finish Before Staging Sign-Off

1. Freeze production env values for auth, ECPay, MiniMax, timezone, and point pricing knobs.
2. Complete `docs/line-production-checklist.md`.
3. Complete `docs/ecpay-production-checklist.md`.
4. Complete `docs/minimax-production-checklist.md`.
5. Run the full flow in `docs/v1-staging-acceptance.md`.
6. Capture proof for LINE sign-in, reading recovery, follow-up recovery, invite claim, history reopen, and daily check-in.

## Must Finish Before Production Launch

1. Verify the final production LINE callback URL against the real domain.
2. Verify one successful ECPay callback in production logs.
3. Confirm MiniMax production quota and billing for launch-day traffic.
4. Store all production secrets in the deployment platform instead of repo files.
5. Assign explicit owners for deploy, rollback, and post-launch monitoring.

## Merge Guidance For Current Local Changes

- Merge the A-class changes before staging. These are launch-facing copy, CTA, and product-surface consistency fixes.
- Keep the B-class spacing polish optional if timing gets tight.
- Do not add new scope while the items above are still open.

