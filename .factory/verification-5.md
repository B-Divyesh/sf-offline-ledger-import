# Check bank CSVs before importing — verification 5

Verified 2026-09-06 against implementation candidate
`9271e56d080d4918a524639ab22abae4f5f8f255` and live URL
<https://offline-ledger-import.sociobot.in/>. The documentation checkout was
`5cab4ebabc3966e3fe365395abd5c454b0cbd30a`.

## Verdict

**FAIL — do not accept this release.** The repaired 20 MB path works and all
28 declared claim commands pass. Four other public product promises are still
absent from `.factory/claims.json` and have no complete tagged browser tests.
A PASS requires zero findings and zero untested claims.

Counts: **finding_count: 4; untested_claim_count: 4.** All four findings are
claim-contract coverage defects. I did not reproduce a runtime failure in the
tested core import and reconciliation paths.

## Job, audience, and first action

Before scrolling, fresh 1440×900 desktop and 390×844 phone contexts said:

- Job: **“Check bank CSVs before importing.”**
- Audience: **households and freelancers** who need to find repeats and
  balance gaps.
- First action: **“Try it with sample data.”** The adjacent sentence says it
  loads a checked sample bank CSV in a separate demo.

The first view also shows the offline, no-sign-in, and export facts. Evidence
is in `.factory/evidence/verification-5/fresh-desktop-home.png`,
`fresh-phone-home.png`, and `live-qa.json`.

## Findings

| Finding | Severity | Evidence | Required disposition |
| --- | --- | --- | --- |
| F-5-1 — “Possible repeat” is an undeclared result claim | Minor | `src/app.ts` shows **Possible repeat**, reports its count, and defines it as matching description and amount within three days. `duplicate-detection` covers only exact repeats. No claim entry or test mentions possible repeats. A live two-row probe produced one Possible repeat, so the feature works in that case but is outside the repeatable contract. | Add a `possible-repeat` claim and browser test that asserts the marked row, count, and receipt method, or remove this result promise. |
| F-5-2 — “Print / save PDF” has no claim command | Minor | The checked-result toolbar exposes **Print / save PDF**. No claim entry or test mentions printing. A live smoke test invoked `window.print`, and Chromium produced a valid 53,457-byte PDF, but no clean-checkout claim command verifies the printable receipt or its content. | Add a declared print/PDF claim with an outcome test, or remove the action. |
| F-5-3 — “Install app” has no claim command | Minor | The header exposes **Install app** when `beforeinstallprompt` fires. A live simulated install event invoked the prompt once and hid the button, but neither `.factory/claims.json` nor the tests cover this conditional public action. | Add a declared install claim and browser test for prompt handling, or remove the action. |
| F-5-4 — “A fresh version is ready / Install update” lacks complete claim coverage | Minor | The update toast makes both statements. The unregistered `@regression:sw-update` unit test checks only that a waiting worker reveals the toast. It does not click **Install update** or prove `SKIP_WAITING` and controller replacement. There is no claim entry or tagged browser test. | Add an update-install claim with a controlled two-worker browser test, or remove the public promise. |

The current `.factory/copy-audit.md` also omits **Possible repeat**, **Print /
save PDF**, **Install app**, and **Install update** despite saying it covers
every shipped workflow sentence and label. It does list the update-status
sentence, but not its action.

## Declared claims from a clean checkout

I cloned the repository separately at documentation SHA `5cab4eb`, ran
`npm ci`, then ran every exact `test` value from `.factory/claims.json`
individually. All 28 commands passed in both configured projects where
applicable.

| Declared claim | Result |
| --- | --- |
| `20mb-input-limit` | Pass |
| `demo-isolation` | Pass |
| `demo-first-viewport` | Pass |
| `first-read-demo` | Pass |
| `offline-reload` | Pass |
| `local-processing` | Pass |
| `no-sign-in` | Pass |
| `duplicate-detection` | Pass |
| `balance-check` | Pass |
| `csv-export` | Pass |
| `receipt-export` | Pass |
| `draft-recovery` | Pass |
| `delimited-import` | Pass |
| `json-draft-backup` | Pass |
| `erase-draft` | Pass |
| `receipt-index` | Pass |
| `proof-kit-price` | Pass |
| `self-hosted-assets` | Pass |
| `no-analytics` | Pass |
| `license-verification-network` | Pass |
| `column-suggestions` | Pass |
| `balance-gap-location` | Pass |
| `include-toggle` | Pass |
| `chronological-order` | Pass |
| `header-row-required` | Pass |
| `free-exports` | Pass |
| `start-real-workspace` | Pass |
| `checkout-destination` | Pass |

The registered claim count and result are **28/28 passed**. The four findings
above are additional public claims, so they are not counted as passed merely
because the registered set is green. The command summary is
`.factory/evidence/verification-5/clean-checkout.json`.

## Clean-checkout quality gates

| Command | Result |
| --- | --- |
| `npm ci` | Passed; 0 vulnerabilities |
| `npm test` | Passed; 12 tests |
| `npx tsc --noEmit` | Passed |
| `npm run build` | Passed; `dist/` produced |
| `npm run test:e2e` | Passed on repeat; 77 passed, 5 intended skips |

The first full-suite attempt had 76 passes and 5 skips before the Chromium
process crashed with signal 11 while Playwright was creating the next context.
The affected `no-analytics` claim had already passed independently. An
immediate full rerun completed with 77 passes and 5 skips, so I classified the
first result as a browser-runner crash, not a product defect. It is disclosed
here rather than hidden.

The production build contains 26.65 KB JavaScript (10.23 KB gzip) and 18.35
KB CSS (4.93 KB gzip). Fonts total about 73 KB WOFF2. These are below the
static-product budgets.

## Live workflow and recovery checks

- The one-click demo opened a realistic March 2026 bank CSV already checked.
  Its persistent **“Demo — sample data, nothing is saved”** banner, sample
  label, filename, one exact repeat, one balance gap, and `-$30.00` difference
  intersected the first desktop and phone viewports. The banner remained at
  the top after scrolling to the result and footer.
- Reset demo reported **“Sample reset.”** The declared isolation test saved a
  demo receipt and license state, then proved reset and Start for real removed
  the entire demo namespace while production IndexedDB and license values
  remained byte-for-byte unchanged. Start for real restored the seeded normal
  draft.
- The populated output contained six source rows, five included rows, one
  exact repeat, one balance gap, and a `-$30.00` difference. Cleaned CSV and
  receipt payload tests checked their actual contents.
- A 20,000,000-byte input passed the size gate and reached CSV validation. A
  20,000,001-byte input showed the documented over-20-MB recovery message. A
  smaller replacement then imported and reconciled without a reload.
- Normal, headerless, malformed, delimiter, mapping, invalid-row, ordering,
  include/exclude, erase, restore, and export paths passed in the full suite.
  No console or page error occurred in the live paths.

## Accessibility, routes, privacy, offline, and performance

- `/opt/fleet/lib/verify-url.sh` passed on live home and demo. Fresh desktop
  and phone Axe scans found zero violations on home, demo, privacy, terms,
  `/404/`, and an unknown route.
- Each route has `lang=en`, one h1, one main landmark, a route-specific title,
  and focused h1. The skip link moves focus to `MAIN#main` with a 3 px blue
  focus outline. Reset works with Space. Privacy navigation moves focus to its
  h1.
- At 390 px, all visible controls on all routes were at least 44 px and page
  overflow was 0. A 640 CSS-pixel layout at device scale 2, representing 200%
  desktop zoom, retained the h1 and had no page overflow. Reduced-motion
  contexts had no transition or animation longer than 0.01 ms.
- A fresh live demo registered one service worker and reloaded offline with
  the sample, demo banner, and offline notice. The deterministic update-race
  regression passed, but F-5-4 remains because the public install action is
  not tested end to end or declared as a claim.
- The full live demo/check/export flow made nine requests, all to the product
  origin. No analytics, tracking, account, or bank-upload request appeared.
- Home, demo, privacy, terms, manifest, robots, sitemap, and Source resolved.
  `/404/` is a designed page served at 200; an unknown URL correctly returned
  the same design with HTTP 404. The purchase endpoint returned HTTP 303 to
  Sociobot/Dodo checkout without making a purchase.
- Live headers include CSP, HSTS, `nosniff`, frame denial, Referrer-Policy,
  and Permissions-Policy. HTML is no-cache, the manifest has the correct MIME
  type, and hashed assets are immutable for one year.
- A 60-request invalid-license burst returned 30×200 and 30×429. Every 429
  observed included `Retry-After: 4`.
- Fresh mobile Lighthouse completed without a runtime error: Performance 99,
  Accessibility 100, Best Practices 100, SEO 100; FCP 1.1 s, LCP 1.2 s, TBT
  0 ms, CLS 0.074. Evidence is
  `.factory/evidence/verification-5/lighthouse-mobile.json`.

This is a static PWA. Backend tenant isolation, application-server health,
SQLite restart persistence, CLI installation, and library-consumer checks do
not apply.

## Candidate and live artifact

The live footer identifies documentation build `5cab4ebabc39`. That commit
changes only `.factory/handoff.md` after implementation candidate `9271e56`.
A fresh candidate build's main JavaScript, stylesheet loader, and CSS are
byte-for-byte identical to live. `index.html` differs only in the injected
footer build ID. This is an allowed later documentation deployment, not a
stale-product finding.

## Earlier findings

| Earlier finding set | Current disposition |
| --- | --- |
| Initial verification: missing claims/demo, unclear first screen, shared demo storage, update notification, hosting headers, MIME/cache policy, 404, skip focus, and metadata | Closed by the current first screen, 28 registered claims, isolated demo, service-worker regression, live headers/routes, and keyboard checks. |
| Verification 2: live worker failed, result contrast failed, delimiter/JSON claims were absent | Closed. Offline reload works live, all twelve live Axe route/profile scans are clear, and both claims pass. |
| Review 1 F-1-1 through F-1-14 | Closed by current isolation, persistent demo, first-viewport sample, payload checks, billing contract, lifecycle wording, route metadata/shell, touch targets, terminology, plain copy, and update label. |
| Review 2 F-2-1 through F-2-11 | Closed by receipt persistence/export, byte-for-byte isolation, billing fixture, direct erase proof, request allowlist, stable repeat full-suite run, copy, and 404 checks. |
| Review 3 F-3-1 through F-3-11 | Closed by full namespace cleanup, mapping/gap/include/order/header claims, free exports, saved-workspace exit, checkout/privacy wording, and receipt wording. |
| Verification 4 F-4-1 | Closed. `20mb-input-limit` is registered, its exact command passes, and the live boundary/recovery path works. |

The new F-5 findings do not reopen those runtime repairs. They show that the
public claim inventory remains incomplete.
