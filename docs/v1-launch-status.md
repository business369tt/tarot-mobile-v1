# Tarot Mobile V1 Launch Status

Last updated: 2026-04-04

This document is limited to what can be confirmed directly from the repository on 2026-04-04. It does not replace staging acceptance, production setup, or third-party verification.

## Repo-Confirmed Completed

- Auth.js session wiring, tarot session route, reading route, follow-up route, points ledger, and ECPay top-up order flow are present in the app code and Prisma schema.
- The app has a branded 404 entry at `src/app/not-found.tsx`.
- The mobile route segment has a branded retry fallback at `src/app/(mobile)/error.tsx`.
- The LINE entry screen disables sign-in when LINE credentials are missing and shows explicit copy instead of opening a broken flow.
- The points top-up API blocks payment creation when ECPay config is missing.
- The points top-up API blocks payment creation when `AUTH_URL` or `NEXT_PUBLIC_APP_URL` is missing.
- MiniMax reading and follow-up generation return productized unavailable messages when the MiniMax API key is missing.
- `.gitignore` ignores `.env*`, `.next`, and local Prisma SQLite files.
- `npm run lint` passes on 2026-04-04.
- `npm run build` passes on 2026-04-04.

## Pending Verification

- All production env values in `docs/v1-launch-final-checklist.md`.
- LINE production readiness checklist.
- ECPay production readiness checklist.
- MiniMax production readiness checklist.
- Full staging acceptance in `docs/v1-staging-acceptance.md`.
- Evidence capture for LINE sign-in, reading recovery, follow-up recovery, invite claim, history save/reopen, and daily check-in.
- ECPay cancel and failure path behavior in a real staging environment.
- Production callback URLs and third-party dashboard configuration.
- Production billing, quota, and log observation.
- Assigned rollout owners for deploy, rollback, and post-launch monitoring.

## Not Yet Complete

- No staging evidence artifact is stored in the repo yet.
- No launch operator note records who owns deploy, rollback, and launch-day monitoring.
- The README remains primarily local-development oriented; a launch-facing handoff remains separate from README.

