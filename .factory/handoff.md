# Ledger Import Check — review 1 handoff

## Outcome

Adversarial first-read review 1 is complete. Verdict: **FAIL** with 14 findings
(3 blocking, 7 major, 4 minor). No product code was changed.

The blocking defects are:

1. `/demo` reads and writes the production Proof Kit license keys.
2. The demo banner scrolls out of the initial demo viewport and is not persistent.
3. The first 390×844 demo viewport does not show recognizable sample data or a result.

Full evidence, exact copy, fixes, claim results, and history checks are in
`.factory/review-1.md`.

## Verification performed

- Cold live Chromium at 390×844 and 1440×900.
- One-click live demo, Reset, Start for real, real-draft preservation, license
  storage isolation probe, same-origin request capture, and offline reload.
- All 14 exact claims.json test commands, independently: passed.
- `npm test`: 12/12 passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed; `dist/` produced.
- `npm run test:e2e`: 41 passed, 3 intentional project skips.
- Live route metadata/status scan and complete link crawl.
- Live checked-result Playwright axe at desktop and mobile: zero
  serious/critical findings.
- `/opt/fleet/lib/verify-url.sh`: passed when run with a temporary evidence
  directory.
- Live service-worker update probe: a waiting worker displayed the update toast.

## Files changed

- `.factory/review-1.md` — new independent review.
- `.factory/handoff.md` — review handoff replacing the earlier repair handoff.

## Next step

Repair F-1-1 through F-1-14, deploy, and run a new full review from a fresh
browser context. Do not treat the passing automated suite as acceptance until
the demo isolation and viewport-level demo checks are added.
