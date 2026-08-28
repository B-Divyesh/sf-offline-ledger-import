# Independent verification 2 — FAIL

Verified 2026-08-28 against candidate commit
`3594075df9435a8c0a3c3f751e1dca7140357fa7` and the live deployment
`https://offline-ledger-import.sociobot.in`.

## Release decision

**FAIL — do not release.** The deployed HTML, JavaScript, and CSS are an exact
match for the candidate build, so the two release blockers below are defects
of this candidate in its actual hosting environment, not a stale deployment.

| artifact | SHA-256 |
| --- | --- |
| `index.html` | `c5bdd812b72a099b42ec39103e21d2a6bf1d640451667af5f218dbd872ee354d` |
| `assets/main-D1schYy7.js` | `0967f45922b55019058cc8316b0581152c56ced44e094d0910666367df144f8d` |
| `assets/styles-Dm9Y_k1k.css` | `32fa98eb26ca648c847f206c06d7b2ee4cc83082410b20343e864ce0d38b3f79` |

## Release blockers

### Critical — live service worker never installs; offline claim is false

Fresh live Chromium contexts had **zero** service-worker registrations after
seven seconds. The generated `/sw.js` precache list includes
`/staticwebapp.config.json`, but the deployed host returns `404 text/html` for
that URL. `cache.addAll(PRECACHE)` therefore rejects during install. The app
catches and discards the registration error, so no console error is shown.

Fresh evidence:

- `navigator.serviceWorker.getRegistrations()` returned `[]` after loading
  `/demo`.
- After the first online visit, setting the browser offline and reloading
  `/demo` failed with `net::ERR_INTERNET_DISCONNECTED`.
- Manually calling `navigator.serviceWorker.register('/sw.js')` initially
  returned an installing worker, then it disappeared after the failed
  precache.

This contradicts the listed and visitor-visible **“Works offline after the
first visit”** claim and prevents testing the required update flow on the
deployed PWA. The local Vite preview serves the configuration file, masking
the deployment-only failure. Exclude host configuration from the SW precache
and add a deployed-host service-worker-install/offline regression test.

### High — axe serious contrast failures in the live result screen

Using `@axe-core/playwright` on live `/demo` after running the sample found
the serious `color-contrast` rule violation (six nodes). This fails both the
accessibility acceptance gate and the required 4.5:1 text contrast minimum.

- Excluded transaction text is rendered as effective `#80796e` on `#fdf1d3`:
  **3.83:1**. Affected nodes include the excluded duplicate's description,
  detail, amount, and balance.
- `.finding-warn` is effective `#8e6c2d` on `#fdf1d3`: **4.31:1**.

The current repository axe test scans only the landing page, so it does not
exercise the failing result state.

### High — claims contract remains incomplete

The claims listed in `.factory/claims.json` have tests, but visitor-reliant
claims outside that list still lack the required one-to-one demo test. Examples
are the landing promise **“CSV, TSV, or semicolon-separated”** and the README
claim that an active draft “can be exported/restored as JSON.” Unit tests or a
visible control are not the required sandbox claim test. Add entries and
observable `/demo` tests, or remove/qualify the claims.

## Mandatory claims gate

All twelve exact commands from `.factory/claims.json` were run from the clean
checkout and passed on both Desktop Chromium and the 390px mobile project:

`demo-isolation`, `first-read-demo`, `offline-reload`, `local-processing`,
`no-sign-in`, `duplicate-detection`, `balance-check`, `csv-export`,
`receipt-export`, `draft-recovery`, `receipt-index`, and `proof-kit-price`.

These are local production-preview results. The separately observed live
service-worker failure means the local `offline-reload` claim result does not
establish the live claim and is a release blocker.

## First read and demo

**PASS.** On a cold live desktop page the first screen plainly states:

- what: “Check bank CSVs before importing”;
- for whom/value: “For households and freelancers: find repeats and balance
  gaps before importing.”;
- first action: visible one-click **Try it with sample data**, with the
  adjacent explanation that it loads a separate sample statement.

The live `/demo` banner reads “Demo — sample data, nothing is saved” and has
Reset demo and Start for real. Local claim coverage proved the separate
`demo:ledger-import-check` IndexedDB namespace.

## Verification performed

- Clean install: `npm ci` passed; audit reported 0 vulnerabilities.
- Unit/integration: `npm test` passed, 10/10 tests.
- Type check: `npx tsc --noEmit` passed.
- Exact production build: `npm run build` passed and produced `dist/`.
- Browser suite: `npm run test:e2e` completed with Playwright last-run status
  `passed`, no failed tests (34 tests across desktop/mobile).
- Manual live flow: sample found the exact repeat, one balance jump, and the
  unexplained `-$30.00`; the cleaned CSV had the canonical header and six
  lines (header plus five included transactions); the receipt included the
  method note and a `-$30.00` unexplained difference.
- Manual input/recovery: empty CSV, unclosed quote, and non-delimited input
  each gave a specific recovery message with no console/page error. A normal
  semicolon-delimited one-row statement reconciled. An invalid date was
  retained and marked “Date not understood,” rather than crashing.
- Mobile 390×844 live result screen: 0px page-level horizontal overflow.
  Reduced motion reported `scroll-behavior: auto` and near-zero transition
  duration. The keyboard skip link moved focus to `MAIN#main`.
- No console/page errors were observed in normal live landing, demo, input,
  export, legal, or 404 flows. (The failed SW registration is silently caught.)
- Live landing and result semantic checks: title, `lang`, a single h1, main,
  image alt text, and visible demo controls passed. Landing axe had no
  serious/critical findings; the result state did, as recorded above.
- Privacy/network: normal demo/import/export requests were same-origin; no
  sign-in UI or non-Sociobot account provider exists. The paid verification
  endpoint is the declared Sociobot API only.
- Rate limit: a rapid 60-request burst to the invalid-license verification URL
  returned 429 responses with `Retry-After` (observed 1s, then 4s on a later
  shared-window burst). In the first burst observed in the active window,
  2 requests returned 200 and 58 returned 429, so throttling is active. The
  endpoint is rate-limited, although a clean isolated threshold cannot be
  inferred from a shared production rate bucket.
- Headers/routes: HTTPS/HSTS, CSP, X-Frame-Options DENY, X-Content-Type-
  Options, Referrer-Policy, Permissions-Policy, and correct manifest MIME are
  live. The app shell and SW are no-cache; hashed JS is immutable for one
  year; `/missing-route` is a real HTTP 404.
- Performance: Lighthouse 13.4.1 against live landing reported Performance
  100, Accessibility 100, Best Practices 100, SEO 100; FCP 1.4s, LCP 1.4s,
  CLS 0.013, TBT 0ms. Built initial JS is 25.25 KB (9.85 KB gzip) and CSS is
  17.57 KB (4.78 KB gzip), within budget.

## Required remediation and re-verification

1. Remove `/staticwebapp.config.json` from the service-worker precache (or
   serve it successfully), surface registration failures, and prove a fresh
   deployed `/demo` stays available after offline reload. Then verify the
   waiting-worker update toast on the live host.
2. Correct result-state colors/opacity so every affected text combination is
   at least 4.5:1; run axe after loading and checking the sample, on desktop
   and mobile.
3. Bring every remaining visitor claim into `.factory/claims.json` with an
   exact observable demo test, or remove it.

This report made no product-code changes.
