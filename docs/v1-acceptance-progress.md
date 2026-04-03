# Tarot Mobile V1 Acceptance Progress

Last updated: 2026-04-04

This document records acceptance progress based on repo state, prior terminal checks, and user-provided screenshots in this thread. It is a working checkpoint, not a final sign-off.

## Current Environment Snapshot

- Render production service is live at `https://tarot-mobile-v1.onrender.com`.
- Render logs show the service booted successfully on 2026-04-04 and reached a ready state after `npm run db:init && npm start`.
- Render environment screenshots confirm production values exist for Auth, database, and ECPay-related variables.
- A separate Vercel production deployment screenshot also exists and shows a ready deployment from `main`.
- A Cloudflare screenshot confirms `tarotai.cc` has been purchased, but these screenshots do not prove DNS cutover to the live app.

## Current Git / Repo Snapshot

- Local branch: `main`
- Earlier terminal check confirmed `origin/main` reached commit `0985986` for docs updates.
- The local workspace still has uncommitted launch-closeout code changes, including:
  - homepage polish
  - zh-TW-only locale lock
  - copy consistency work across reading, follow-up, points, and ECPay flows
- Because those files remain modified locally, the current deployed site should be treated as older than the latest local closeout pass.

## Acceptance Status By Area

### 1. Entry And Identity

Status: Partially evidenced

- Home page loads successfully on the deployed site.
- The deployed home page copy appears productized and launch-safe.
- A prior manual check in this thread confirmed:
  - `/auth/line` loaded successfully
  - first LINE login succeeded
  - second LINE login succeeded
  - account isolation behaved correctly
- No dedicated screenshot of the LINE sign-in success state is stored in the repo yet.

### 2. Reading Flow

Status: Mostly evidenced

- `/question` page renders correctly.
- Ritual screen renders correctly.
- Card draw screen renders correctly.
- Three-card selection completes successfully.
- Reveal screen renders correctly.
- `/reading` successfully generated a reading.
- The reading screen shows the model label `MiniMax - MiniMax M2.5`.

Notes:

- The deployed reading result is still largely English.
- The deployed UI still shows an `EN` toggle in screenshots.
- This suggests the current deployed environment does not yet reflect the latest single-language / zh-TW closeout changes in the local workspace.

### 3. Reading Payment Recovery

Status: Not yet evidenced

- No screenshot or manual result confirms the points-required pause state.
- No screenshot or manual result confirms ECPay success and automatic return to `/reading`.

### 4. Follow-Up Payment Recovery

Status: Not yet evidenced

- No screenshot or manual result confirms the follow-up pause state.
- No screenshot or manual result confirms ECPay success and automatic return to `/reading?resume=followup`.

### 5. ECPay Failure Paths

Status: Not yet evidenced

- No screenshot or manual result confirms cancel flow, failed flow, or reopening an existing order.

### 6. Archive And Invite

Status: Partially evidenced

- `/history` renders correctly.
- Saved readings appear in history.
- A concrete saved reading entry for `test` is visible in history.
- The screenshot shows prior readings with follow-up counts, which suggests persisted archive data exists.
- No screenshot or manual result confirms invite claim end-to-end settlement in both `/invite` and `/points`.

### 7. Daily Check-In

Status: Not yet evidenced

- No screenshot or manual result confirms first claim, refresh persistence, or same-day idempotency.

### 8. Fallbacks

Status: Not yet evidenced

- No screenshot or manual result confirms branded 404.
- No screenshot or manual result confirms branded route error fallback.
- No screenshot or manual result confirms missing LINE / ECPay / MiniMax env fallback behavior.

## Launch Risks Visible From Current Evidence

1. Deployed copy is not fully aligned with the intended zh-TW-only launch surface.
2. The deployed site still shows an `EN` toggle, so the single-language closeout is not yet fully live there.
3. The generated reading content shown in evidence is English, which is inconsistent with the intended final product tone.
4. Deployment ownership is currently split across at least Render and Vercel in the evidence set, which creates launch-surface ambiguity.
5. The custom domain purchase is confirmed, but live domain cutover is not yet evidenced.

## Practical Checkpoint

If we stop and resume later, the safest summary is:

- Entry and core reading flow have been exercised through to a successful generated reading.
- History persistence is evidenced.
- LINE sign-in and account isolation were manually confirmed earlier in this thread.
- Payment recovery, invite, daily check-in, and fallback acceptance are still pending.
- The deployed environment shown in screenshots is not yet the final zh-TW-only launch surface.

## Recommended Next Step

Resume from `Reading Payment Recovery` in `docs/v1-staging-acceptance.md` after deciding which deployment target is the true launch environment and after shipping the remaining local closeout code changes that are still uncommitted.
