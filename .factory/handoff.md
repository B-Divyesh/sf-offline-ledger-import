# Handoff — polish 3 complete

## Delivered

Resolved every finding in `review-1.md`, `review-2.md`, and `review-3.md`.
The published artifact is code commit `2b1cd6674f49` and is live at
<https://offline-ledger-import.sociobot.in/>. Repair commits were pushed to
`main`; the final evidence map is `.factory/polish-3.md`.

The repair makes demo reset and exit delete the complete demo-only IndexedDB
database and every demo license key. It adds all missing claims and observable
tests, rewrites the remaining ambiguous copy, supplies a real artifact SHA in
the common footer, standardizes route metadata/legal pages, and raises text
actions to a 48px minimum target without changing the cassette-zine visual
system.

## Verification

- Fresh clone at `2b1cd6674f49`: `npm ci`, `npm test` (12/12),
  `npx tsc --noEmit`, and `npm run build` all passed.
- Every one of the 27 commands declared in `.factory/claims.json` was run from
  that clean clone. The final full suite also executed every claim across
  desktop and 390px mobile: `npm run test:e2e` passed **75 tests** with
  **5 intentional project skips** and no failures. Exact command output is in
  `.factory/evidence/polish-3/clean-claims.log` and `clean-e2e.log`.
- Browser suite covers real demo isolation/reset/exit, downloads, local-only
  request allowlists, offline reload, data deletion, metadata/focus/Back,
  desktop/mobile accessibility, and 44px touch targets.
- Live cold checks passed for `/`, `/demo?demo=1`, `/privacy/`, `/terms/`, and
  `/404/`; `verify-url.sh` reports no console errors, one h1, one main, `lang`,
  titles, and complete image/button labels on home and demo.
- A live reset/exit probe wrote demo-only license/receipt state, reset it,
  confirmed no demo keys or receipt remained, then confirmed Start for real
  removed the demo database. The live routes share `build 2b1cd6674f49`.
- Live Playwright Axe scans found zero serious/critical violations on home,
  demo, privacy, terms, and 404. (The Selenium-based Axe CLI cannot launch its
  own Chrome binary in this worker; the repository's Playwright Axe integration
  is the executed accessibility gate.)
- Lighthouse evidence: desktop Performance 100, Accessibility 100,
  Best Practices 96, SEO 100 (LCP 0.4s, CLS 0.002); mobile Performance 98,
  Accessibility 100, Best Practices 100, SEO 100 (LCP 1.5s, CLS 0.074).

## Run and deploy

```sh
npm ci
npm test
npx tsc --noEmit
npm run build
npm run test:e2e
/opt/fleet/lib/deploy-static.sh offline-ledger-import dist
```

## Known gaps

None.
