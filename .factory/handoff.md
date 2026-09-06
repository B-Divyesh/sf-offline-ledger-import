# Handoff — repair 3 complete

## Outcome

Closed F-4-1 from `verification-4.md`. A bank CSV larger than **20 MB
(20,000,000 bytes)** is rejected with a clear recovery step. The user can then
import and reconcile a smaller bank CSV without reloading.

Implementation commit: `9271e56d080d4918a524639ab22abae4f5f8f255`

The live HTTPS artifact was deployed from that implementation and identifies
itself as `build 9271e56d080d`. Documentation/evidence commits made after this
handoff do not change the deployed product artifact.

## What changed

- Added `20mb-input-limit` to `.factory/claims.json`.
- Added an outcome-based browser test. It selects a 20,000,001-byte CSV,
  observes the recovery message, then imports and reconciles a smaller CSV.
- Made the implementation's advertised limit exact: 20 MB is
  `20,000,000` bytes, rather than an implicit 20 MiB threshold.
- Copied the verb-first catalog description to
  `/work/.evidence/catalog-description.txt`.

## Verification

From a fresh GitHub checkout of `9271e56`:

```sh
npm ci
npm test
npx tsc --noEmit
npm run build
# each of the 28 exact commands in .factory/claims.json
npm run test:e2e
```

Results:

- `npm test`: 12 passed.
- Type check and production build: passed; `dist/index.html` produced.
- All 28 declared claim commands passed independently, including the new
  browser boundary/recovery claim in desktop and 390px phone projects.
- Full Playwright suite: 77 passed and 5 intentional project skips (82
  scheduled checks).

Live deployment and cold-browser checks:

- Deployed with `/opt/fleet/lib/deploy-static.sh offline-ledger-import dist`.
  The existing static product configuration was reused; no backend, volume,
  or replica settings were changed.
- HTTPS home returned 200 with the implementation build ID, CSP, HSTS,
  `nosniff`, framing protection, Referrer-Policy, and Permissions-Policy.
- Fresh desktop and 390×844 phone pages said, before scrolling: job **“Check
  bank CSVs before importing”**, audience **households and freelancers**, and
  first action **“Try it with sample data.”**
- On both devices the one-click demo showed the persistent sample banner,
  filename, exact repeat, balance gap, and `-$30.00` difference. Reset restored
  the sample. A temporary seeded normal draft survived demo reset and
  **Start for real** unchanged.
- The deployed 20,000,001-byte boundary flow showed the recovery message, then
  a smaller CSV reconciled successfully. No console or page errors occurred.
- A fresh live service worker controlled `/demo?demo=1`; its demo reloaded
  offline with the sample and offline notice.
- `/opt/fleet/lib/verify-url.sh` passed: HTTPS 200, title, `lang=en`, one h1,
  main landmark, complete image alt text, labeled buttons, and no console
  errors.
- Live Playwright Axe scans on desktop and phone found zero serious/critical
  issues on home, demo, privacy, terms, the styled `/404/` route, and an
  unknown route. The unknown route correctly returned HTTP 404; its expected
  browser resource warning was not treated as a product error.
- The public one-time Proof Kit checkout remains active: the product checkout
  endpoint returned HTTP 303 to Sociobot/Dodo. No payment was made and no
  billing registration work was needed.

## Prior findings

The fresh claim matrix and full suite reran the repair coverage recorded in
`polish-3.md`. Review findings F-1-1 through F-1-14, F-2-1 through F-2-11,
and F-3-1 through F-3-11 remain closed. F-4-1 is now closed by the new
registered boundary/recovery claim.

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
