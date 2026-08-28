# Handoff — Adversarial review 2

The requested no-code review is complete. The product verdict is **FAIL** with
11 findings in `.factory/review-2.md`: 7 blocking, 1 major, and 3 minor. No
product source was modified.

## What was reviewed

- Cold live first read at 390×844 and 1440×900.
- One-click demo, sample visibility, reset, storage isolation, live offline
  reload, and network interception.
- All 17 claim commands from a clean clone.
- Landing/README copy, all earlier review and polish findings, route metadata,
  404, focus/Back behavior, links, visual identity, accessibility, and missed
  leverage.

## Verification

- `npm ci`: passed; 0 vulnerabilities.
- Every exact command in `.factory/claims.json`: exited 0 on desktop and
  mobile, while five assertion gaps are documented in the review.
- `npm test`: 12 passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed; `dist/` produced; initial JS 25.62 kB / 9.89 kB
  gzip.
- `npm run test:e2e`: two full runs were not repeatably green; focused reruns
  passed. See F-2-8.
- Live Axe landing/result scans: zero violations at mobile and desktop.
- `/opt/fleet/lib/verify-url.sh`: passed.
- Live and clean-build HTML/JS/CSS SHA-256 values matched.

## Known gaps / next steps

Implement or remove the promised saved-receipt export. Strengthen the demo
isolation, receipt-index, price/refund, erase, no-analytics, and license-network
claim tests.
Stabilize the complete browser suite, then address the three copy findings and
run review 3 from scratch.
