# LINE Production Checklist

Last updated: 2026-04-01

Official references:
- https://developers.line.biz/en/docs/line-login/integrate-line-login-v2/
- https://developers.line.biz/en/docs/line-login/development-guidelines/

## Console Setup

- [ ] The production LINE Login channel is the one wired into `AUTH_LINE_ID` and `AUTH_LINE_SECRET`.
- [ ] The channel callback URL includes the final production origin:
  - `${AUTH_URL}/api/auth/callback/line`
- [ ] If staging is also tested against LINE, add the staging callback URL separately instead of reusing production.
- [ ] Channel display name, icon, and basic channel information are final.
- [ ] Team members who must manage production have the correct console roles.

## App Policy And Review Readiness

- [ ] Privacy policy URL is published and reachable from the production domain.
- [ ] Terms of service URL is published and reachable from the production domain.
- [ ] The login button and wording follow LINE Login guidelines.
- [ ] The product behavior matches the permissions actually requested from LINE.
- [ ] Account unlink or app unregister handling is defined operationally, per LINE development guidelines.

## Flow Validation

- [ ] Sign-in from `/auth/line` returns to the intended callback route.
- [ ] Returning users can resume an existing owned reading after LINE login.
- [ ] Invite links using `/auth/line?ref=...` still settle correctly after LINE login.
- [ ] Signing out and signing back in with another LINE account does not reopen another user's reading.
- [ ] Missing LINE credentials disable the button cleanly instead of failing mid-handoff.

## Manual Launch Checks

- [ ] One real production sign-in succeeds on mobile web.
- [ ] One production sign-in succeeds after opening the app from an invite link.
- [ ] One wrong-account scenario is tested to confirm ownership guardrails still redirect correctly.
