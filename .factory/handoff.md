# Handoff — adversarial review 3

## Delivered

Added `.factory/review-3.md` with a fresh cold-read, copy, demo, claim,
history, routing, accessibility, link, performance, and missed-leverage review
of the live product. No product code was changed.

Verdict: **FAIL** with 13 findings: 3 blocking, 8 major, and 2 minor. The main
blocker is incomplete demo cleanup: saved demo receipts and demo license keys
survive both Reset demo and Start for real. Earlier F-1-9 and F-1-11 are
reopened because the shared footer/build identifier and terminology repairs
remain incomplete.

## Verification

- Clean clone at commit `793f234623d0f5184d362855a07fcae1b6034e7e`.
- `npm ci`, `npm test` (12/12), `npx tsc --noEmit`, and `npm run build` passed.
- Every exact command in `.factory/claims.json` passed independently: 19
  commands and 38 desktop/mobile browser checks.
- `npm run test:e2e` passed 54 checks with 4 expected project skips.
- Live 390×844 and 1440×900 cold first read, one-click demo, reset, storage
  isolation, demo-retention probe, offline workflow, network interception,
  route metadata, focus/Back, link crawl, touch targets, and visual identity
  were checked.
- Live Axe scans on home, demo result, privacy, terms, and 404 returned zero
  violations at both viewport sizes. `verify-url.sh` returned no errors.
- Live home HTML exactly matched the clean build by SHA-256.

## Known gaps / next steps

Implement the concrete fixes in `.factory/review-3.md`, starting with F-3-1,
F-1-9, and F-1-11. Add claim entries and observable browser tests for the
unlisted workflow, free-export, saved-workspace, and checkout-disclosure
statements. Re-run the full review from scratch; this round is not acceptable
until no findings or untested claims remain.
