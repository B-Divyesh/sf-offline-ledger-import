# Independent verification — FAIL

Verified on 2026-08-28 against candidate commit
`b03af75fafcc6b126e13547def6b96abe372240b` and the live deployment
`https://offline-ledger-import.sociobot.in`.

## Release decision

**FAIL — do not release.** The candidate does not meet the mandatory claims,
first-read, or isolated-demo acceptance gates. The live HTML, main JavaScript,
and CSS SHA-256 values exactly matched this candidate build, so these are
deployed-product findings, not a stale-deployment issue.

## Mandatory gates

### Claims contract: FAIL (release blocker)

`.factory/claims.json` is absent in the clean candidate checkout. Therefore
there were no claim tests to run and the required claim gate cannot be passed.
This is explicitly release-blocking under the work order. `.factory/demo.md`
is also absent.

The landing page and README contain visitor-reliant, unlisted claims including
“Works offline”, “No sign-in”, “You own the exports”, “Nothing leaves this
device”, local processing, duplicate detection, balance checks, and exports.
They have no claim entries or `@claim:<id>` tests. In particular, the privacy
claim has not been tested over the required isolated demo flow.

### Cold first read and sample demo: FAIL (release blocker)

Fresh desktop and 390px live-browser evidence:

- Title: `Ledger Import Check — private bank CSV reconciliation`.
- H1: `Catch the skip before it hits your ledger.` This is a metaphor, not a
  plain-language statement of the job or intended user.
- The only first-screen primary action is `Check a CSV`; there is no visible
  `Try it with sample data` action. The lower-page action is instead `Try the
  example statement`.
- The first screen does not say the product is for privacy-sensitive
  households or freelancers.

This fails the stated first-read requirement independently of the rest of the
test results.

### Demo sandbox: FAIL (release blocker)

Clicking `Try the example statement` persists an active draft in IndexedDB
database `ledger-import-check`. Opening `/?demo=1` in a fresh page restored
that same draft (`example-march-2026.csv … restored from this browser`), used
the same database, and showed no `Demo — sample data, nothing is saved`
banner, Reset demo control, or Start for real control. The candidate has no
separate `demo:` storage namespace and no `/demo` entry point. Sample activity
can therefore read/write the real-data namespace.

## Functional verification

Passed:

- `npm ci` completed with 0 audited vulnerabilities.
- `npm test`: 8/8 unit tests passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed and produced `dist/`.
- `npm run test:e2e`: 6 passed and 2 project-inapplicable tests skipped;
  desktop/mobile example workflow, downloads, existing axe scan, and offline
  reload passed.
- Manual production-browser workflow: the example found one repeat candidate,
  one balance-gap change and a -$30.00 unexplained difference. The cleaned
  CSV had the expected canonical header and 5 included rows; the receipt
  contained the local-processing statement.
- A normal semicolon CSV reconciled successfully. Empty CSV, unclosed quote,
  >20 MB input, missing closing balance, and invalid date/amount each showed
  a recovery message without console/page errors.
- The live PWA controlled the page and reloaded offline after first visit;
  the offline banner appeared. Normal landing and sample flows made only
  same-origin requests. No sign-in flow exists.
- Desktop and 390px mobile had no page-level horizontal overflow or observed
  console/page errors. Visible focused links use a 3px `#075D96` outline.
- Live rate-limit test: 60 parallel invalid-license verification requests to
  `https://api.sociobot.in/api/v1/products/offline-ledger-import/verify`
  produced 30 HTTP 200 responses then 30 HTTP 429 responses. The first 429
  observed was request 31; `Retry-After` was 2–3 seconds. Browser CORS allowed
  only the product origin.
- Lighthouse 12.8.2 against the local production build reported Performance
  97, Accessibility 100, Best Practices 100, SEO 100; FCP 1.4 s, LCP 1.4 s,
  CLS 0.069, TBT 160 ms. (The browser tab crashed after Lighthouse wrote the
  JSON report, so retain this as indicative rather than a clean runner exit.)

`npx @axe-core/cli@4.11.0` could not run because its Selenium launcher could
not find a Chrome binary. The repository Playwright axe test did run and pass
for serious/critical findings on both desktop and mobile projects.

## Defects

### Critical / release-blocking

1. Missing `.factory/claims.json`; required claim tests cannot be executed.
2. First screen is not plain-language compliant and lacks a visible one-click
   `Try it with sample data` action.
3. The purported sample flow is not an isolated demo and directly persists to
   the real-data IndexedDB namespace; `?demo=1` restores real draft state.

### High

1. Service-worker update notification is broken. In a controlled local
   production test, a changed `/sw.js` installed and the registration entered
   `waiting: true`, but `#update-toast` remained hidden. A user is not offered
   the required update action.
2. Live security/hosting policy is incomplete: no `Content-Security-Policy`,
   `X-Frame-Options`, or `Permissions-Policy` header; the manifest is served
   as `application/octet-stream`; and HTML, `sw.js`, and hashed assets all
   receive only `Cache-Control: public, must-revalidate, max-age=30` rather
   than immutable caching for hashed assets.
3. Unknown `/missing-route` returns the app HTML with HTTP 200, not a designed
   404 with a 404 status.

### Medium

1. The skip link changes the fragment to `#main` but leaves keyboard focus on
   `<body>` rather than moving focus to the main landmark.
2. Required site metadata is incomplete: no canonical, Open Graph, or Twitter
   card metadata in `index.html`; no configured real 404 route; and no
   `staticwebapp.config.json` to carry the required routing/security policy.
3. Initial bundle budgets pass (main JS 24.49 kB / 9.59 kB gzip; CSS 17.03 kB
   / 4.69 kB gzip), but the deployment cache policy negates the intended
   hashed-asset caching strategy.

## Deployment identity and evidence

The following candidate/live hashes matched exactly:

| File | SHA-256 |
| --- | --- |
| `index.html` | `3c81da95c32b79d765214aedfdaf0d5db0e0d5bb090cba6f35846e56bb9f84e9` |
| `assets/main-DISGZy_3.js` | `a0d6016680ff850e22abf39382da484d2eeefd09aed2cd40190acdba9b116cfd` |
| `assets/styles-DSSwXMJb.css` | `c2bcb84a6bb800d8262e21209e7654a6b26937a0e08803cd28e670b2ac5abe60` |

This report intentionally makes no product-code changes.
