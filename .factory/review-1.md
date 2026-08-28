# Adversarial first-read review 1 — FAIL

Reviewed 2026-08-28 against `https://offline-ledger-import.sociobot.in` and
repository base `34856cb582db35ff66e1ee5fef9978d2b7f2251d`.

## Verdict

**FAIL.** The cold landing screen is clear and every declared claim command
passes, but the demo is not isolated from real license storage. Its required
demo banner also scrolls out of sight before the visitor sees the first demo
screen. There are 14 findings: 3 blocking, 7 major, and 4 minor.

## Findings

### Blocking

#### F-1-1 — Demo mode reads and writes real license storage

- **Quote/location:** `/demo` says **“Demo — sample data, nothing is saved.”**
  `src/license.ts:1-53` always uses the production localStorage keys
  `sb_license:offline-ledger-import` and
  `sb_license:offline-ledger-import:verdict`; demo mode does not namespace
  them. `tests/e2e/app.spec.ts` proves the leak unintentionally by seeding the
  production keys and expecting **“Proof Kit unlocked”** in the demo.
- **Observed:** a fresh live demo read a production-key marker and unlocked
  Proof Kit. Entering `DEMO-WRITES-REAL` in the demo wrote that value and its
  verdict to the production keys. **Reset demo** left the production token in
  place. There were no `demo:` localStorage keys.
- **Why this fails:** the demo contract covers all storage, not only the CSV
  draft. Demo activity can read and mutate real paid-license state while the
  banner promises otherwise.
- **Fix:** either remove live license entry and verification from `/demo`, or
  namespace every demo license key and use a canned verification response.
  Reset must clear only the demo namespace. Add a `@claim:demo-isolation`
  assertion that snapshots IndexedDB and localStorage production values before
  the complete demo flow and confirms that every value is byte-for-byte
  unchanged afterward.

#### F-1-2 — The required demo banner is not persistent

- **Quote/location:** README: **“It starts with … a persistent demo banner”**;
  live banner: **“Demo — sample data, nothing is saved.”**
- **Observed:** clicking the primary action landed at scroll Y 1,855 on the
  390×844 viewport and 1,444 on desktop. `.demo-banner` is ordinary document
  flow (`src/styles.css:53`), so it was outside both first post-click
  viewports. The existing test uses Playwright's layout-level `toBeVisible()`,
  which does not require the banner to intersect the viewport.
- **Why this fails:** the visitor is placed inside a data form with no visible
  indication that it is a disposable sandbox and no visible Reset or Start for
  real escape.
- **Fix:** keep the demo controls sticky or fixed above the stage rail, with
  safe-area spacing and a 44 px minimum target size. Add mobile and desktop
  assertions that the banner's bounding box intersects the viewport after the
  demo finishes loading and after every automatic scroll.

#### F-1-3 — The first mobile demo viewport does not show realistic sample data

- **Quote/location:** primary-action explanation: **“Loads a sample statement
  in a separate demo.”**
- **Observed:** after one click at 390×844, the viewport showed the end of the
  storage note and generic column selectors. The sample filename, sample rows,
  opening/closing balances, repeat, gap, and reconciliation result were all
  outside the viewport. A second action, **Run balance check**, is required to
  reveal the value. Desktop does show the prefilled statement label and
  balances.
- **Why this fails:** the mandatory one-click demo must immediately look like
  the product being used with recognizable sample data on the reviewed phone
  size.
- **Fix:** make `/demo` open on a compact sample summary with the filename,
  representative rows, and precomputed repeat/gap result visible in the first
  390 px viewport. Keep **Run balance check** available for exploration, but do
  not require it to demonstrate the outcome. Add a viewport-level regression
  test.

### Major

#### F-1-4 — Two passing export claim tests do not verify their payloads

- **Quote/location:** claims **“Export cleaned CSV”** and **“Export
  reconciliation receipt”**; `tests/e2e/app.spec.ts:48-64`.
- **Observed:** both tests assert only a filename pattern and that
  `createReadStream()` returns an object. An empty or incorrect file would
  pass. Manual live inspection happened to show a correct five-row cleaned CSV
  and a receipt containing the `-$30.00` difference, but that is not enforced
  by the registered tests.
- **Why this fails:** the claims contract requires the observable result, not
  only evidence that a download began. These two claims remain weakly tested.
- **Fix:** read each download. Assert the CSV header, five included data rows,
  absence of the excluded exact repeat, and expected values. Assert the receipt
  statement name, source hash, row counts, repeat/gap evidence, closing
  difference, and method note.

#### F-1-5 — Commercial claims are unlisted and only partly tested

- **Quote/location:** landing: **“no subscription · checkout and refunds
  handled by Sociobot/Dodo”**; README: **“it uses only the Sociobot hosted
  checkout and license-verification API.”**
- **Observed:** `proof-kit-price` asserts the displayed **“$12 once”** and the
  checkout link URL only. No claim entry verifies no subscription, refund
  handling, merchant identity, or the exclusive API destinations.
- **Why this fails:** a buyer can rely on these payment statements, so each
  must have claim coverage.
- **Fix:** add separate claim entries and non-spending tests against a recorded
  billing fixture/checkout contract, including allowed network origins, or
  remove the unverified statements. Keep **“$12 once”** only if the checkout
  configuration is also checked.

#### F-1-6 — Data-lifecycle claims are unlisted, and one is inaccurate

- **Quote/location:** landing: **“Browser data can be cleared”**; README:
  **“Clearing site data removes the draft, receipt index, and saved license
  token”** and **“Start for real returns to a clean normal workspace.”**
- **Observed:** no claims.json entries cover site-data deletion or the Start
  for real destination. With a pre-existing real draft, Start for real
  correctly restored `real-private.csv`; the workspace was not clean.
- **Why this fails:** the README describes destructive/storage behavior that a
  privacy-sensitive user will rely on, and “clean” conflicts with preservation
  of the user's real draft.
- **Fix:** rewrite the latter as **“Start for real leaves the demo and opens
  your saved workspace.”** Register and test the deletion statement, including
  draft, receipt, and license keys, or replace it with browser-neutral wording
  that does not promise exact deletion behavior.

#### F-1-7 — The README makes an unlisted deployment/privacy claim

- **Quote/location:** README: **“No runtime server, environment variable,
  product ID, analytics script, or external font/CDN is required.”**
- **Observed:** no claim entry or static/network test is assigned to this
  sentence. The normal live flow was same-origin, but that does not prove every
  item in the compound statement.
- **Why this fails:** deployers and privacy-sensitive users can rely on this
  architecture statement.
- **Fix:** split it into testable claims and add a static build scan plus a
  complete browser request allowlist, or remove the sentence. A concise tested
  replacement could be: **“The built app serves its scripts and fonts from
  this site.”**

#### F-1-8 — Route metadata is incomplete and the social image is the wrong size

- **Quote/location:** live `/privacy/`, `/terms/`, `/demo`, and the 404 route.
- **Observed:** Privacy and Terms have no meta description, canonical, Open
  Graph, or Twitter metadata. The 404 has a description but none of the other
  metadata. `/demo` retains the home canonical and home OG title even though
  its document title changes to **“Demo — Ledger Import Check.”** No route has
  an apple-touch icon. The declared OG image is 960×640, not the required
  1200×630.
- **Why this fails:** shared/deep-linked routes present incorrect or missing
  identity, and installed iOS bookmarks lack the required icon declaration.
- **Fix:** add route-specific descriptions, canonicals, OG/Twitter titles and
  descriptions, an original 1200×630 social image, and a 180 px apple-touch
  icon. For `/demo`, update metadata before it is shared or serve dedicated
  HTML.

#### F-1-9 — Route focus and the required common shell are inconsistent

- **Quote/location:** navigating Header → Privacy leaves `document.activeElement`
  on `<body>`. Home has `Demo / Method / Proof Kit / Privacy`; Privacy and Terms
  have only `Checker` plus one legal link; 404 has only `Demo / Privacy`.
  Footers also differ, and none contains **“Built by Param Factory”** or a
  version/build ID. The external **“Source”** link has no external-destination
  cue.
- **Why this fails:** keyboard/screen-reader users are not moved to or informed
  of the new page heading, and visitors cannot rely on a consistent site shell.
- **Fix:** use the same header and footer on every route, include Privacy,
  Terms, factory attribution, and build ID, label Source as external, and focus
  the destination h1 after navigation while announcing it. Add deep-link,
  forward/back, and focus assertions.

#### F-1-10 — Mobile touch targets are below 44 px

- **Quote/location:** live 390 px routes.
- **Observed:** header nav links measured 22 px high, footer links 24 px, the
  wordmark 30 px, and demo **Reset demo** / **Start for real** controls 38 px.
  Equivalent undersized links appear on Privacy, Terms, and 404.
- **Why this fails:** these controls miss the attached accessibility baseline
  and are harder to operate during a 30-second phone visit.
- **Fix:** give every interactive target at least a 44×44 CSS pixel hit area,
  including nav/footer links and demo controls. Add a 390 px bounding-box test.

### Minor

#### F-1-11 — Terms for the same concepts change across the page

- **Quote/location:** **“repeats”**, **“repeated transaction”**, **“duplicate
  checks”**, and **“Exact repeat”** describe the same concept; **“balance
  gaps”**, **“running-balance jump”**, and **“Gap changes”** describe the same
  discrepancy; **“bank CSV”**, **“statement”**, and **“bank export”** all name
  the input.
- **Why this fails:** a first-time user must infer that these labels refer to
  the same things. It also contradicts `.factory/copy-audit.md`'s own
  single-term table.
- **Fix:** use **repeat**, **balance gap**, and **bank CSV** consistently.

#### F-1-12 — Two headings and one tagline are not plain out of context

- **Quote/location:** **“Proof Kit keeps the paper trail.”**, **“Privacy stays
  on your side of the screen.”**, and **“Ledger Import Check is a neutral
  checkpoint before your ledger.”**
- **Why this fails:** “paper trail,” “your side of the screen,” and “neutral
  checkpoint” are metaphors rather than standalone jobs or outcomes.
- **Fix:** use **“Save past receipts with Proof Kit”**, **“Your statement data
  stays in this browser”**, and **“Check a bank CSV before you import it.”**

#### F-1-13 — README sample copy exceeds the hard sentence cap and exposes internals too early

- **Quote/location:** README: **“It starts with a realistic six-row March 2026
  statement, has a persistent demo banner, and keeps its draft in
  `demo:ledger-import-check`, separate from your own `ledger-import-check`
  browser data.”** (27 words.) The user-facing section also uses **“isolated”**
  and **“IndexedDB.”**
- **Why this fails:** it combines three ideas, exceeds 22 words, and asks a
  non-developer to understand storage implementation names.
- **Fix:** **“The demo opens a six-row March 2026 statement. Its sample work
  stays separate from your files. Reset restores the sample.”** Move database
  names and IndexedDB details to the developer section.

#### F-1-14 — The update button does not name its result

- **Quote/location:** update toast button: **“Update now.”**
- **Why this fails:** “now” gives timing, not the result of pressing the button.
- **Fix:** rename it **“Install update.”**

## Cold first read

Both cold contexts returned HTTP 200 with no console/page errors and one h1.
Before scrolling:

| Question | 390×844 | 1440×900 |
| --- | --- | --- |
| What does it do? | **“Check bank CSVs before importing”**; finds repeats and balance gaps. | Same. |
| For whom? | **“For households and freelancers.”** | Same. |
| What first? | **“Try it with sample data”**, with **“Loads a sample statement in a separate demo.”** directly below. | Same action and explanation side by side. |

This part passes. The first screen also shows all three short facts: **“Works
offline after the first visit,” “No sign-in,”** and **“Export cleaned CSV and
receipt.”**

## Copy audit

Counts treat hyphenated terms, paths, and version strings as one word. The
landing table covers every initially rendered copy unit, including headings,
labels, navigation, and buttons. No banned plain-words term appears.

### Live landing page

| Copy | Words | Result |
| --- | ---: | --- |
| Skip to ledger check | 4 | pass |
| Ledger Import Check | 3 | pass |
| Demo | 1 | pass (nav) |
| Method | 1 | pass (nav) |
| Proof Kit | 2 | pass (nav/product name) |
| Privacy | 1 | pass (nav) |
| Private bank CSV checks | 4 | pass |
| Check bank CSVs before importing | 5 | pass |
| For households and freelancers: find repeats and balance gaps before importing. | 11 | pass |
| Try it with sample data | 5 | pass; result-naming action |
| Loads a sample statement in a separate demo. | 8 | pass |
| Works offline after the first visit | 6 | pass |
| No sign-in | 2 | pass |
| Export cleaned CSV and receipt | 5 | pass |
| One local copy. | 3 | unclear claim; F-1-11 |
| Three checks. | 2 | does not name the checks; F-1-11 |
| A receipt you can keep. | 5 | pass |
| Load | 1 | pass (stage label) |
| Choose a statement | 3 | pass |
| Map | 1 | terminology flag; F-1-11 |
| Align the columns | 3 | pass |
| Check | 1 | pass (stage label) |
| Keep the evidence | 3 | pass |
| Track 01 / source | 3 | pass |
| Load the bank export | 4 | terminology flag; F-1-11 |
| CSV, TSV, or semicolon-separated. | 4 | pass for the target audience |
| The first row must contain column names. | 7 | pass |
| Choose CSV | 2 | pass; result-naming action |
| or drop it on this workbench | 6 | pass |
| Try it with sample data | 5 | pass; result-naming action |
| Local | 1 | pass (status stamp) |
| Your statement data stays in this browser. | 7 | pass |
| The draft is kept in browser storage so a refresh does not erase your place. | 15 | pass |
| Browser data can be cleared; download a backup for durable safekeeping. | 11 | unlisted claim; F-1-6 |
| Restore draft backup | 3 | pass; result-naming action |
| Optional one-time unlock | 3 | pass |
| Proof Kit keeps the paper trail. | 6 | metaphor; F-1-12 |
| The free checker includes duplicate checks, balance checks, cleaned CSV, receipt export, and draft backups. | 15 | terminology flag; F-1-11 |
| Proof Kit adds a local receipt index for recurring monthly work. | 11 | pass |
| $12 once | 2 | pass |
| no subscription | 2 | unlisted claim; F-1-5 |
| checkout and refunds handled by Sociobot/Dodo | 6 | unlisted claim; F-1-5 |
| Buy Proof Kit | 3 | pass; result-naming action |
| Have a license? | 3 | pass as a disclosure summary, not a command button |
| Ledger Import Check is a neutral checkpoint before your ledger. | 10 | vague metaphor; F-1-12 |
| No budgeting advice. | 3 | pass |
| No bank login. | 3 | pass |
| Privacy | 1 | pass (link) |
| Terms | 1 | pass (link) |
| Source | 1 | external-link cue missing; F-1-9 |
| Hero artwork generated for this product with the factory image model. | 11 | pass; provenance is documented |
| © 2026 Sociobot. | 2 | pass |

### README

| Copy | Words | Result |
| --- | ---: | --- |
| Ledger Import Check | 3 | pass (heading) |
| Check bank CSVs before importing. | 5 | pass |
| Ledger Import Check is for privacy-sensitive households and freelancers. | 9 | pass |
| The sample demo shows an exact repeated transaction, a running-balance jump, a closing-balance difference, and the cleaned CSV and receipt exports. | 21 | terminology flag; F-1-11 |
| It is not a budgeting app, bank connection, audit, tax calculator, or financial adviser. | 14 | pass |
| Statement data stays in the browser during the normal checking flow. | 11 | pass |
| Live | 1 | pass (label) |
| Try the isolated sample | 4 | jargon; F-1-13 |
| Open the demo. | 3 | pass |
| It starts with a realistic six-row March 2026 statement, has a persistent demo banner, and keeps its draft in demo:ledger-import-check, separate from your own ledger-import-check browser data. | 27 | over 22 and jargon; F-1-2/F-1-13 |
| Reset demo reloads the sample. | 5 | pass |
| Start for real returns to a clean normal workspace. | 9 | inaccurate/unlisted; F-1-6 |
| Local data and paid unlock | 5 | pass (heading) |
| The active draft is stored in IndexedDB and can be exported/restored as JSON. | 13 | user-facing jargon; F-1-13 |
| Cleaned CSV and reconciliation receipt exports are always free. | 9 | pass |
| The optional $12 one-time Proof Kit license adds a local receipt index; it uses only the Sociobot hosted checkout and license-verification API. | 22 | jargon and unlisted API claim; F-1-5/F-1-13 |
| Clearing site data removes the draft, receipt index, and saved license token, so downloaded backups are the durable copy. | 19 | unlisted claim; F-1-6 |
| See privacy and terms. | 4 | pass |
| Develop and verify | 3 | pass (heading) |
| Requires a current Node.js release. | 5 | pass in developer section |
| npm ci | 2 | pass (command) |
| npm run dev | 3 | pass (command) |
| npm test | 2 | pass (command) |
| npm run build — exact deployment build; outputs dist/index.html | 8 | pass in developer section |
| npm run test:e2e — production browser, mobile, axe, and offline checks | 10 | pass in developer section |
| The full claim contract is in .factory/claims.json. | 7 | pass in developer section |
| Each claim command runs from the /demo sandbox. | 8 | pass in developer section |
| Playwright is pinned to 1.58.2. | 5 | pass in developer section |
| In a fresh environment, install Chromium with npx playwright install chromium if it is not already available. | 17 | pass in developer section |
| The Vite build is a static site. | 7 | pass in developer section |
| Deploy the contents of dist/ at the domain root. | 9 | pass in developer section |
| No runtime server, environment variable, product ID, analytics script, or external font/CDN is required. | 14 | unlisted compound claim; F-1-7 |
| The factory registers and activates the paid product separately. | 9 | pass as a deployment instruction |
| Structure | 1 | pass (heading) |
| src/csv.ts — format detection, parsing, normalization, mapping suggestions | 7 | pass in source map |
| src/reconcile.ts — repeat fingerprints and running/end-balance checks | 6 | pass in source map |
| src/storage.ts — IndexedDB draft and receipt index | 6 | pass in source map |
| src/license.ts — one-time Sociobot license capture and daily verification | 8 | pass in source map |
| public/sw-template.js — versioned local app shell and offline routing | 8 | pass in source map |
| .factory/design.md — cassette-zine visual system and artwork provenance | 7 | pass in source map |
| MIT licensed. | 2 | pass |
| See LICENSE. | 2 | pass |

Button audit: the visible landing actions name results. The conditional update
button is the sole non-result label (F-1-14). No banned marketing adjective was
found.

## Demo and sandbox evidence

- One click reaches real `/demo` and loads a six-row March 2026 statement.
- The sample has one exact repeat, one running-balance gap, and a `-$30.00`
  closing difference. Reset restored the original sample.
- Draft records use `demo:ledger-import-check`; a seeded real draft survived
  demo editing, reset, and Start for real unchanged.
- License state does not use the demo namespace and fails isolation (F-1-1).
- The complete check/export flow made only same-origin requests when no license
  action was taken.
- After a first visit, a fresh live service worker controlled `/demo`; with
  network disabled, reload restored the sample and displayed the offline banner.

## Claims audit

Every exact `test` command in `.factory/claims.json` was run independently
from the clean worktree. All passed in both configured projects unless the
test's own project guard made one project inapplicable.

| Claim ID | Result | Evidence |
| --- | --- | --- |
| `demo-isolation` | PASS, contract gap | 2 passed; license storage omitted (F-1-1) |
| `first-read-demo` | PASS | 2 passed |
| `offline-reload` | PASS | 2 passed |
| `local-processing` | PASS | 2 passed |
| `no-sign-in` | PASS | 2 passed |
| `duplicate-detection` | PASS | 2 passed |
| `balance-check` | PASS | 2 passed |
| `csv-export` | PASS, weak assertion | 2 passed; payload not read (F-1-4) |
| `receipt-export` | PASS, weak assertion | 2 passed; payload not read (F-1-4) |
| `draft-recovery` | PASS | 2 passed |
| `delimited-import` | PASS | 2 passed |
| `json-draft-backup` | PASS | 2 passed |
| `receipt-index` | PASS, exposes isolation defect | 2 passed using real license keys |
| `proof-kit-price` | PASS, partial coverage | 2 passed; extra commercial claims remain (F-1-5) |

Unlisted landing/README claims are recorded as F-1-2, F-1-5, F-1-6, and
F-1-7. There is no unreported failing declared command.

## History verification

There are no earlier `.factory/review-*.md` or `.factory/polish-*.md` files.
The existing handoff and three verification reports were read. Each earlier
finding was checked again:

| Earlier finding | Live and code result |
| --- | --- |
| Missing claims/demo contracts | Fixed: both files exist; all 14 commands pass. |
| Metaphorical first screen; no audience or sample CTA | Fixed: cold mobile and desktop first reads pass. |
| Sample used the real draft database | Draft portion fixed, but full isolation is still broken for license storage; F-1-1 is blocking. |
| Broken service-worker update toast | Fixed: a live query-version update probe reached `waiting` and displayed **“A fresh version is ready.”** |
| Missing security/cache headers and wrong manifest MIME | Fixed on live responses. |
| Missing real 404 | Fixed: designed page returned HTTP 404. |
| Skip link did not focus main | Fixed in code and browser regression test. |
| Missing home metadata | Fixed for home; incomplete on other routes remains F-1-8. |
| Deployed service worker failed to install | Fixed: live worker controls the page and offline reload succeeds. |
| Result-state contrast failures | Fixed: live post-result axe scans have zero serious/critical violations on desktop and mobile. |
| Unlisted delimiter and JSON-backup claims | Fixed: both have registered passing tests. |

## Structure, accessibility, and links

- Titles follow the required pattern, each route has one h1 and one main, and
  the 404 is product-specific. Metadata exceptions are F-1-8.
- Direct `/demo`, `/privacy/`, `/terms/`, and unknown-route deep links work.
  Browser Back restored home. Route focus failed as recorded in F-1-9.
- Every discovered link was crawled. Internal destinations returned 200;
  unknown-route self-fragments remained on the intended 404; GitHub returned
  200; the paid checkout returned the intended 303 to Dodo. There were no dead
  links.
- Live checked-result axe: zero serious/critical findings at 390×844 and
  1440×900. Both had 0 px horizontal overflow, no console/page errors, and the
  reduced-motion path used `scroll-behavior: auto` with near-zero transitions.
  Touch-size failures remain F-1-10.
- The cassette/receipt visual system is distinct and matches
  `.factory/design.md`; it is not a generic SaaS template.
- The generated hero asset has documented prompt provenance in `assets/src/`.

## Missed leverage

No finding. The brief's obvious value loop is present: delimited statement
import, column mapping, repeat detection, balance-gap/closing checks, cleaned
CSV export, receipt export, JSON backup/restore, and an optional receipt index.
AI would add remote data handling to a task that is deterministic and explicitly
local-first. Sync would conflict with the stated privacy position unless it
were a separate, explicit feature.

## Verification commands and results

- `npm ci` — passed; 0 vulnerabilities.
- Each of the 14 `npm run test:e2e -- --grep @claim:<id>` commands — passed.
- `npm test` — 12/12 passed.
- `npx tsc --noEmit` — passed.
- `npm run build` — passed; `dist/` produced; initial JS 25.25 KB / 9.86 KB gzip.
- `npm run test:e2e` — 41 passed, 3 intentional project skips.
- Built/live SHA-256 values matched for `index.html`, the main JavaScript, and
  the stylesheet, so live findings apply to this checkout.
- `/opt/fleet/lib/verify-url.sh <live-url> <temp-evidence-dir>` — passed; title,
  lang, one h1, main, image alt, button labels, and console checks passed.
- Live Playwright axe after running the sample — zero serious/critical findings
  on desktop and mobile.

## What would make this perfect

Fix all 14 findings. In particular, make demo mode a complete storage boundary,
keep its controls visible, and show recognizable sample evidence immediately on
a 390 px screen. Then strengthen export assertions, register or remove every
remaining claim, complete route metadata and the common shell, restore route
focus, enlarge touch targets, and complete the copy rewrites. Re-run every
claim command plus the full mobile/desktop suite against the deployed build.
