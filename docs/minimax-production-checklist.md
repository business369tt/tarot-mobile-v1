# MiniMax Production Checklist

Last updated: 2026-04-01

Official references:
- https://platform.minimax.io/docs/api-reference/text-anthropic-api
- https://platform.minimax.io/docs/api-reference/api-overview
- https://platform.minimax.io/docs/guides/rate-limits

## API And Account

- [ ] `MINIMAX_API_KEY` is a production key owned by the correct MiniMax account.
- [ ] Billing or plan status is active for launch traffic.
- [ ] The selected model is enabled on the account and supported by the Anthropic-compatible endpoint.
- [ ] `MINIMAX_BASE_URL` is set to `https://api.minimax.io/anthropic` unless official docs change.
- [ ] `MINIMAX_MODEL` is explicitly frozen for launch instead of relying on a stale default.

## Throughput And Stability

- [ ] Rate limits for the chosen plan are reviewed against launch-day traffic assumptions.
- [ ] Expected peak traffic fits within request and token limits with retry margin.
- [ ] Operational owner knows where to check MiniMax usage, quota, and error responses during launch.
- [ ] A rollback or temporary degraded-mode decision is defined if MiniMax returns sustained upstream errors.

## Product Validation

- [ ] One full reading request succeeds in staging with production-like env values.
- [ ] One follow-up request succeeds in staging with production-like env values.
- [ ] Failed upstream generation returns productized fallback copy, not raw provider errors.
- [ ] Missing MiniMax config produces the intended unavailable state for both reading and follow-up.
- [ ] The stored `model` field on generated records matches the expected launch model.

## Prompt And Output Sanity Check

- [ ] Reading output is valid JSON and normalizes correctly into app sections.
- [ ] Follow-up output remains plain text with three short paragraphs.
- [ ] The selected launch model produces tone and latency that are acceptable for production.
