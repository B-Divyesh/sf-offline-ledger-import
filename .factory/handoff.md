# Handoff — Polish 1

Ledger Import Check remains a static Vite TypeScript PWA with IndexedDB local storage and a hand-written offline service worker. This repair closes every finding in `.factory/review-1.md`.

## Delivered

- Complete demo isolation, including `demo:` license state; demo purchase and verification are unavailable.
- A persistent demo banner and a pre-checked first viewport at 390px.
- Readable CSV/receipt download assertions, a complete claims contract, route metadata, real legal/404 shells, focus handling, and 44px touch targets.
- Plain-language copy, a 1200×630 social image, 180px apple-touch icon, and provenance notes.

## Verification

- Clean install: `npm ci` — passed, 0 vulnerabilities.
- Unit/static contract: `npm test` — 12 passed.
- Typecheck: `npx tsc --noEmit` — passed.
- Deployment build: `npm run build` — passed, `dist/index.html` produced. Initial JS is 25.45 kB (9.85 kB gzip); CSS is 18.31 kB (4.93 kB gzip).
- Browser/accessibility/privacy/offline suite: `npm run test:e2e` — 54 tests passed across desktop and 390px mobile, including Axe serious/critical scans, service-worker offline reload, route focus, and touch targets.
- Every declared `@claim:` test runs from the `/demo` sandbox; focused final claim run for demo isolation, receipt index, price, and first viewport passed 8/8 across both projects.

## Run and deploy

```sh
npm ci
npm test
npx tsc --noEmit
npm run build
npm run test:e2e
/opt/fleet/lib/deploy-static.sh offline-ledger-import dist
```

## Deployment evidence

- Repair commit: `fcf38b71b1eabcac7db298153942c7096bc2d594`.
- Static deployment: Azure Static Web Apps deployment `77b1d9b9-c79b-4859-9ee9-94c521d8dd25` to `https://offline-ledger-import.sociobot.in`.
- Cold live verifier: `.factory/evidence/live/verify-demo/verify.json` — HTTP 200, title `Demo — Ledger Import Check`, `lang=en`, one h1, one main, no console errors, no missing image alt or unnamed button.
- Live production Axe scan at 390×844: zero serious/critical violations.
- Captured live evidence: `.factory/evidence/live/verify-demo/screenshot-desktop.png` and `.factory/evidence/live/verify-demo/screenshot-mobile.png`.

## Known gaps

None.
