# V1 Staging Acceptance

Last updated: 2026-04-01

Run this document top to bottom on staging before launch. Use staging env values that mirror production behavior as closely as possible.

## 1. Entry And Identity

- [ ] Open `/` and confirm the home page copy does not mention placeholder, reserved, future handoff, or still-dev wording.
- [ ] Open `/auth/line` and confirm the LINE entry page loads correctly.
- [ ] Complete LINE sign-in and confirm you land back inside the app as the signed-in profile.
- [ ] Sign out and sign back in with another LINE profile to confirm ownership isolation still works.

## 2. Reading Flow

- [ ] Complete question entry.
- [ ] Complete ritual.
- [ ] Complete card draw.
- [ ] Complete reveal.
- [ ] Open `/reading` and confirm one full reading is generated successfully.
- [ ] Confirm the generated reading stores the expected MiniMax model.

## 3. Reading Payment Recovery

- [ ] Reduce available points below `READING_COST_POINTS`.
- [ ] Reopen `/reading` and confirm the reading pauses in a clean points-required state.
- [ ] Open the restore CTA and land on `/points` with reading intent.
- [ ] Complete a successful ECPay payment.
- [ ] Confirm automatic return to `/reading`.
- [ ] Confirm the reading completes without replaying ritual, draw, or reveal.

## 4. Follow-Up Payment Recovery

- [ ] Use available points below `FOLLOWUP_COST_POINTS`.
- [ ] Submit a follow-up on `/reading`.
- [ ] Confirm the thread pauses in a clean points-required state.
- [ ] Open the restore CTA and land on `/points` with follow-up intent.
- [ ] Complete a successful ECPay payment.
- [ ] Confirm automatic return to `/reading?resume=followup`.
- [ ] Confirm the same follow-up continues and settles without retyping the prompt.

## 5. ECPay Failure Paths

- [ ] Start ECPay and cancel it.
- [ ] Confirm `/points` shows a clean canceled state with retry copy.
- [ ] Reopen an existing order from the same profile and confirm status recovery still works.

## 6. Archive And Invite

- [ ] Create a reading with history enabled and confirm it appears in `/history`.
- [ ] Open the history detail page and confirm reading sections and follow-ups render correctly.
- [ ] Open `/invite`, copy or share the invite link, and confirm the page does not mention incomplete browser support as a product gap.
- [ ] Complete one invite-claim flow through `/auth/line?ref=...` with a second LINE account.
- [ ] Confirm the invited account sees a clean attached / success state without falsely implying its own `/points` received the invite reward.
- [ ] Switch back to the inviter account and confirm the reward settlement appears in the inviter-side `/invite` and `/points`.

## 7. Daily Check-In

- [ ] Claim the daily check-in reward once.
- [ ] Refresh `/points` and confirm it now shows claimed status for the day.
- [ ] Attempt a second claim on the same day and confirm it stays idempotent.

## 8. Fallbacks

- [ ] Open a bad URL and confirm the branded 404 page renders.
- [ ] Force one render error in staging and confirm the branded route error fallback renders with retry.
- [ ] Remove LINE env values in a staging-like env and confirm the LINE entry page disables sign-in cleanly.
- [ ] Remove ECPay env values in a staging-like env and confirm `/points` does not try to open a broken payment flow.
- [ ] Remove MiniMax env values in a staging-like env and confirm `/reading` and follow-up show productized unavailable states.

## 9. Final Verification

- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] Remove the local `.next` build output after validation if the workspace should stay clean for handoff.
