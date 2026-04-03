# V1 Staging Evidence Template

Last updated: 2026-04-04

Use this template while executing `docs/v1-staging-acceptance.md`. Fill one row per scenario with a concrete artifact such as a screenshot path, screen recording path, log URL, or ticket link.

## Test Run Summary

| Field | Value |
| --- | --- |
| Tester |  |
| Date |  |
| Staging URL |  |
| Commit / branch |  |
| Env snapshot location |  |

## 1. Entry And Identity

| Scenario | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Home page copy is launch-safe |  |  |  |
| LINE entry page renders |  |  |  |
| LINE sign-in succeeds |  |  |  |
| Account isolation with second LINE profile |  |  |  |

## 2. Reading Flow

| Scenario | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Question entry completes |  |  |  |
| Ritual completes |  |  |  |
| Card draw completes |  |  |  |
| Reveal completes |  |  |  |
| Reading generates successfully |  |  |  |
| Stored MiniMax model is expected |  |  |  |

## 3. Reading Payment Recovery

| Scenario | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Reading pauses in points-required state |  |  |  |
| Restore CTA lands on `/points` with reading intent |  |  |  |
| ECPay payment succeeds |  |  |  |
| Auto-return reaches `/reading` |  |  |  |
| Reading resumes without replaying earlier steps |  |  |  |

## 4. Follow-Up Payment Recovery

| Scenario | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Follow-up pauses in points-required state |  |  |  |
| Restore CTA lands on `/points` with follow-up intent |  |  |  |
| ECPay payment succeeds |  |  |  |
| Auto-return reaches `/reading?resume=followup` |  |  |  |
| Follow-up resumes without retyping |  |  |  |

## 5. ECPay Failure Paths

| Scenario | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Cancel from ECPay |  |  |  |
| `/points` shows canceled recovery state |  |  |  |
| Existing order can be reopened and recovered |  |  |  |

## 6. Archive And Invite

| Scenario | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Saved reading appears in `/history` |  |  |  |
| History detail renders reading and follow-ups |  |  |  |
| Invite page copy is launch-safe |  |  |  |
| Invite claim settles in `/invite` and `/points` |  |  |  |

## 7. Daily Check-In

| Scenario | Result | Evidence | Notes |
| --- | --- | --- | --- |
| First claim succeeds |  |  |  |
| Claimed state persists on refresh |  |  |  |
| Second same-day claim is idempotent |  |  |  |

## 8. Fallbacks

| Scenario | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Bad URL shows branded 404 |  |  |  |
| Forced render error shows branded retry fallback |  |  |  |
| Missing LINE env disables sign-in |  |  |  |
| Missing ECPay env blocks broken payment flow |  |  |  |
| Missing MiniMax env shows unavailable copy |  |  |  |

## 9. Final Verification

| Scenario | Result | Evidence | Notes |
| --- | --- | --- | --- |
| `npm run lint` |  |  |  |
| `npm run build` |  |  |  |
| Local `.next` cleanup decision recorded |  |  |  |

