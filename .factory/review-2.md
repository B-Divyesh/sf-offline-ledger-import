# Adversarial first-read review 2 — FAIL

Reviewed 2026-08-28 against
`https://offline-ledger-import.sociobot.in` and repository base
`655b5277006000b92bf514714a91d0049e96bfe7`.

## Verdict

**FAIL.** The cold first screen, one-click demo, live offline behavior,
accessibility, routes, and declared command results all work. The review still
has 11 findings: 7 blocking, 1 major, and 3 minor. Five registered claim tests
can pass without proving their full promises, and unlocked Proof Kit copy
promises an archive export that does not exist.

## Findings

### Blocking

#### F-2-1 — Proof Kit promises export of saved receipts, but the archive cannot export them

- **Quote/location:** unlocked Proof Kit panel in `src/app.ts` / live landing:
  **“Receipt snapshots stay in this browser. Export individual receipts for
  durable backup.”**
- **Observed:** `ReceiptRecord` in `src/storage.ts` stores only `id`,
  `statement`, `checkedAt`, and `summary`. The archive renders those fields as
  plain list items. It stores no receipt payload and offers no archive-item
  open or export control. The free current-result **Download receipt** action
  does not export a previously saved snapshot. This sentence has no entry in
  `.factory/claims.json`.
- **Why this fails:** a paying visitor is promised a durable export from the
  saved receipt index, but that result is unavailable. This is both an
  unlisted claim and a false paid-feature claim.
- **Fix:** either store the complete receipt payload and add **Download saved
  receipt** to every archive entry, with a new claim test that reloads and
  downloads the saved item, or replace the sentence with **“Download the
  current receipt before leaving this check.”**

#### F-2-2 — Demo isolation test does not prove production IndexedDB is unchanged (reopens F-1-1)

- **Quote/location:** claim `demo-isolation`: **“Demo — sample data, nothing is
  saved”**; sandbox contract says to snapshot production IndexedDB and license
  keys and confirm every production value is unchanged.
- **Observed:** `tests/e2e/app.spec.ts:12-41` seeds a real draft, but after the
  demo flow it only checks that both database names exist. It never reads the
  real `current` record again or compares it byte-for-byte. It does compare
  localStorage. A demo implementation that overwrote the real draft after the
  initial screen check would still pass.
- **Why this fails:** F-1-1 explicitly required the real draft and license
  state to remain unchanged. The live implementation passed a manual marker
  check in this review, but the registered claim test does not enforce that
  boundary. The claim therefore remains partly untested.
- **Fix:** read and serialize the production `current` record before entering
  `/demo`; after edit, reset, and exit, assert exact equality. Also assert the
  demo database is the only database whose record changes.

#### F-2-3 — The receipt-index claim test never checks that a receipt appears (new claim defect)

- **Quote/location:** claim `receipt-index`: **“Proof Kit adds a local receipt
  index.”** Test at `tests/e2e/app.spec.ts:160-170`.
- **Observed:** the test checks **“Receipt snapshot saved locally.”** and the
  **“Local receipt index”** heading. That heading is already visible to a
  cached licensed user before saving. It does not assert a new archive row,
  its statement/summary, IndexedDB contents, or persistence after reload.
- **Why this fails:** `saveReceipt()` could become a no-op and the test would
  still pass after the status assignment. The paid result is not verified.
- **Fix:** record the initial row count, save the sample receipt, assert one new
  row with the statement and `-$30.00` summary, reload, and assert the same row
  returns from the demo receipt store.

#### F-2-4 — The price/refund test re-asserts product copy instead of the billing result (reopens F-1-5)

- **Quote/location:** claim `proof-kit-price`: **“Proof Kit is a one-time $12
  license; Sociobot/Dodo handles refunds.”** Test at
  `tests/e2e/app.spec.ts:172-179`.
- **Observed:** the test checks `$12` on the product page, the checkout URL,
  and the same merchant/refund sentences on `/terms/`. It never inspects a
  recorded checkout contract or the returned checkout. Manual review followed
  the live 303 and found a Dodo page with a USD 12.00 one-time price and Dodo
  merchant text, but that evidence is absent from the repeatable claim test;
  refund behavior remains only asserted copy.
- **Why this fails:** reading the promise twice does not test it. F-1-5 asked
  for a recorded billing fixture or checkout-contract assertion, so its test
  half-fix remains blocking.
- **Fix:** add a non-spending recorded checkout/API fixture that asserts
  `one_time`, USD 1200, product slug, merchant-of-record, and refund terms. If
  refund handling cannot be tested, remove that part of the claim.

#### F-2-5 — The erase test cannot distinguish deletion from automatic demo reseeding (reopens F-1-6)

- **Quote/location:** claim `erase-draft`: **“Erase local draft removes the
  active bank CSV.”** Test at `tests/e2e/app.spec.ts:181-188`.
- **Observed:** the test confirms that `#file-status` becomes hidden, reloads
  `/demo`, and expects the automatic sample to be visible. It never checks that
  the `current` record was removed. If `clearDraft()` stopped deleting and only
  cleared the UI, the reload could restore the same sample and satisfy the
  assertion.
- **Why this fails:** a privacy-sensitive visitor relies on deletion of stored
  data, not only a temporary hidden status. The registered test does not prove
  the storage outcome.
- **Fix:** after accepting **Erase local draft**, open
  `demo:ledger-import-check` and assert `local-data/current` is absent before
  any reload or automatic reseed. Use a non-sample filename so stale restore is
  also observable.

#### F-2-6 — The no-analytics claim allows same-origin analytics (reopens F-1-7)

- **Quote/location:** README: **“The built app adds no analytics or external
  font/CDN requests.”** Privacy: **“We do not add analytics or tracking.”**
  Claim `self-hosted-assets` carries both promises.
- **Observed:** `tests/e2e/app.spec.ts:190-196` loads only `/`, counts one
  script and one stylesheet, and allows every same-origin request. A request to
  `/analytics`, `/collect`, or another first-party telemetry endpoint would
  pass. The test also does not exercise the demo/check/export flow. Source and
  live inspection found no analytics in this build, but the test does not
  enforce the claim.
- **Why this fails:** F-1-7 replaced a compound claim with a supposedly tested
  one, but the analytics half remains untested. A same-origin allow rule proves
  self-hosting, not absence of tracking.
- **Fix:** split the claims. Keep the same-origin asset assertion for fonts and
  scripts. For no analytics, exercise landing, demo, check, and exports while
  asserting an explicit request-path allowlist; add a build scan for telemetry
  SDKs/endpoints.

#### F-2-7 — The license-token network disclosure is an unlisted claim

- **Quote/location:** live `/privacy/`: **“Buying or verifying Proof Kit sends
  a license token to Sociobot billing.”**
- **Observed:** no `.factory/claims.json` entry names or tests this disclosure.
  `proof-kit-price` checks only price-page copy and a checkout href. Source
  inspection shows verification sends the token to `api.sociobot.in` as a GET
  query parameter, but no browser claim test intercepts that action or checks
  what leaves the device.
- **Why this fails:** this is the only disclosed exception to the product's
  local-processing position. A privacy-sensitive visitor must be able to rely
  on its exact destination and payload.
- **Fix:** add a `license-verification-network` claim with a dummy-token,
  non-spending fixture. Assert that explicit verification contacts only the
  documented Sociobot endpoint and sends no bank CSV, balances, or receipt
  data. Alternatively remove the sentence and verification UI.

### Major

#### F-2-8 — The documented full browser suite is not repeatably green

- **Quote/location:** README verification command: **“npm run test:e2e”**;
  handoff: **“54 tests passed.”**
- **Observed:** two clean-clone full-suite runs failed. Both lost the Chromium
  worker to `SIGSEGV` immediately before the desktop end-to-end export test.
  The second run also transiently reported the mobile lower-page **Try it with
  sample data** button below 44 px. Focused reruns of both tests passed, and a
  direct live measurement found no undersized control.
- **Why this fails:** the browser gate produces different results from the
  same checkout, so a worker cannot rely on the documented one-command
  verification. This is not evidence of a current live touch-target defect,
  but it is a reproducibility defect.
- **Fix:** isolate the Chromium crash and the touch-size race. Wait for fonts
  and layout before measuring, report actual boxes on failure, and adjust test
  lifecycle/concurrency so `npm run test:e2e` passes repeatedly with the
  pinned Playwright 1.58.2 browser.

### Minor

#### F-2-9 — Landing copy uses purchase jargon and an unexplained stage term

- **Quote/location:** landing Proof Kit eyebrow: **“Optional one-time
  unlock.”** The conditional success copy also says **“Proof Kit unlocked.”**
  The stage rail also uses **“Map”** and **“Align the columns.”**
- **Why this fails:** “unlock” is banned by the supplied plain-words standard
  unless literal. Here it is purchase jargon. “Map” is importer jargon for a
  household visitor, while the later h2 already explains the task plainly.
- **Fix:** use **“Optional one-time purchase”**, **“Proof Kit active,”** and
  **“Match / Match CSV columns.”**

#### F-2-10 — README inaccurately says every claim starts in the demo

- **Quote/location:** README: **“Every claim command starts from `/demo`.”**
- **Observed:** `first-read-demo`, `proof-kit-price`, and
  `self-hosted-assets` start at `/`; the price test also opens `/terms/`.
- **Why this fails:** a verifier following the documentation receives an
  incorrect description of the sandbox coverage.
- **Fix:** write **“Workflow claim tests use `/demo`; landing and legal-copy
  tests use their published routes.”**

#### F-2-11 — The 404 h1 is a metaphor rather than a standalone error heading

- **Quote/location:** live 404 h1: **“That page is not on this tape.”**
- **Why this fails:** the cassette metaphor supplies identity, but the heading
  does not plainly say that the page was not found when heard out of context.
- **Fix:** use **“We could not find that page”** as the h1 and keep **“wrong
  track”** as decorative supporting copy.

## Cold first read

Fresh contexts opened the live page at 390×844 and 1440×900. Both returned
HTTP 200 with scroll Y 0, one h1, one main, no horizontal overflow, no console
or page errors, and no cross-origin requests.

| Question | 390×844 | 1440×900 |
| --- | --- | --- |
| What does it do? | **“Check bank CSVs before importing.”** It finds repeats and balance gaps. | Same. |
| For whom? | **“For households and freelancers.”** | Same. |
| What first? | **“Try it with sample data,”** followed by **“Loads a sample statement in a separate demo.”** | Same. |

The primary action and all three facts—offline after first visit, no sign-in,
and cleaned CSV/receipt export—intersected the initial viewport at both sizes.
This gate passes.

## Copy audit

Counts use whitespace-delimited words; hyphenated terms count as one. Step
numbers and the decorative arrow are not sentences. Every initially visible
landing prose unit, heading, label, and action is included below, followed by
the global conditional messages reviewed in source. No item exceeds 22 words.
Buttons name a result.

### Live landing page

| Copy | Words | Result |
| --- | ---: | --- |
| Skip to ledger check | 4 | pass |
| Ledger Import Check | 3 | pass |
| Demo | 1 | pass |
| Method | 1 | plain but less direct than “How it works” |
| Proof Kit | 2 | product name |
| Privacy | 1 | pass |
| Private bank CSV checks | 4 | pass |
| Check bank CSVs before importing | 5 | pass |
| For households and freelancers: find repeats and balance gaps before importing. | 11 | pass |
| Try it with sample data | 5 | pass; result-naming action |
| Loads a sample statement in a separate demo. | 8 | pass |
| Works offline after the first visit | 6 | pass; registered claim |
| No sign-in | 2 | pass; registered claim |
| Export cleaned CSV and receipt | 5 | pass; registered claims |
| One local copy. | 3 | pass; local-processing claim |
| Finds repeats and balance gaps. | 5 | pass; registered claims |
| Keeps a receipt. | 3 | pass; registered claim |
| Load | 1 | pass |
| Choose a statement | 3 | pass |
| Map | 1 | jargon; use “Match” |
| Align the columns | 3 | metaphor; use “Match CSV columns” |
| Check | 1 | pass |
| Keep the evidence | 3 | pass |
| Track 01 / source | 4 | decorative label |
| Load the bank CSV | 4 | pass |
| CSV, TSV, or semicolon-separated. | 4 | pass; registered claim |
| The first row must contain column names. | 7 | pass; import requirement |
| Choose CSV | 2 | pass; result-naming action |
| or drop it on this workbench | 6 | pass |
| Try it with sample data | 5 | pass; result-naming action |
| Local | 1 | status label |
| Your bank CSV stays in this browser. | 7 | pass; registered claim |
| The draft survives a refresh. | 5 | pass; registered claim |
| Download a backup before you clear browser data. | 8 | pass |
| Restore draft backup | 3 | pass; result-naming action |
| Optional one-time unlock | 3 | **flag: banned purchase jargon; F-2-9** |
| Save past receipts with Proof Kit | 6 | pass |
| The free checker includes repeat checks, balance-gap checks, cleaned CSV, receipt export, and draft backups. | 15 | pass; registered behaviors |
| Proof Kit adds a local receipt index for recurring monthly work. | 11 | claim test gap; F-2-3 |
| $12 one-time · local receipt index | 6 | claim test gap; F-2-4 |
| Buy Proof Kit | 3 | pass; result-naming action |
| Have a license? | 3 | disclosure summary, not a button |
| Ledger Import Check checks a bank CSV before you import it. | 11 | pass |
| No budgeting advice. | 3 | pass; scope statement |
| No bank login. | 3 | pass; covered by no-sign-in flow |
| Privacy | 1 | pass |
| Terms | 1 | pass |
| Source (GitHub) | 2 | pass; external destination is named |
| Built by Param Factory · build polish-1 · hero artwork generated for this product with the factory image model. | 19 | pass; provenance exists |
| Install app | 2 | pass; conditional result-naming action |
| Offline mode — your saved draft and every check still work here. | 11 | pass; conditional registered claim state |
| Offline setup did not finish. | 5 | pass; conditional error |
| Reload this page while online to try again. | 8 | pass; recovery action is explicit |
| Paste license token | 3 | pass; conditional form label |
| Verify license | 2 | pass; result-naming action |
| Proof Kit unlocked | 3 | **flag: banned purchase jargon; F-2-9** |
| Receipt snapshots stay in this browser. | 6 | covered by local receipt-index behavior |
| Export individual receipts for durable backup. | 6 | **false/unlisted claim; F-2-1** |
| No saved receipts yet. | 4 | pass; conditional empty state |
| Run a check, then choose “Save to Proof Kit.” | 9 | pass; conditional empty-state action |
| A fresh version is ready. | 5 | pass; conditional update status |
| Install update | 2 | pass; conditional result-naming action |

The stage labels **“Map”** and **“Align the columns”** are included in F-2-9.

### README

| Copy | Words | Result |
| --- | ---: | --- |
| Ledger Import Check | 3 | pass |
| Check bank CSVs before importing. | 5 | pass |
| It is for households and freelancers who want to find repeats and balance gaps locally. | 15 | pass |
| The demo includes a March 2026 bank CSV. | 8 | pass |
| It shows one repeat, one balance gap, and a $30.00 difference. | 11 | pass |
| It is not budgeting software, financial advice, or a bank connection. | 11 | pass |
| Live | 1 | pass |
| Try the sample | 3 | pass |
| Open the demo. | 3 | pass |
| The demo opens with its sample already checked. | 8 | pass |
| Sample work stays separate from your saved workspace. | 8 | claim-test gap; F-2-2 |
| Reset demo restores the sample. | 5 | pass |
| Start for real opens your saved workspace. | 7 | pass in live behavior |
| Your data and Proof Kit | 5 | pass |
| Your bank CSV stays in this browser during normal checks. | 10 | pass; registered claim |
| The draft survives refresh and can be exported or restored as JSON. | 12 | pass; registered claims |
| Download a backup before clearing browser data. | 7 | pass |
| Cleaned CSV and receipt exports are free. | 7 | pass in unlicensed demo |
| Proof Kit is a one-time $12 license for a local receipt index. | 12 | claim-test gaps; F-2-3/F-2-4 |
| See privacy and terms. | 4 | pass |
| The built app adds no analytics or external font/CDN requests. | 10 | claim-test gap; F-2-6 |
| It serves its own app files. | 6 | pass; same-origin requests verified |
| Develop and verify | 3 | pass |
| Requires a current Node.js release. | 5 | pass |
| npm ci | 2 | command |
| npm run dev | 3 | command |
| npm test | 2 | command |
| npm run build | 3 | command |
| npm run test:e2e | 3 | command; unstable in F-2-8 |
| The full claim contract is in .factory/claims.json. | 7 | pass |
| Every claim command starts from /demo. | 6 | **inaccurate; F-2-10** |
| Playwright is pinned to 1.58.2. | 5 | pass |
| Deploy dist/ at the domain root. | 6 | pass |
| The factory registers the paid product separately. | 7 | pass |
| Structure | 1 | pass |
| src/csv.ts — parsing, normalization, and column suggestions | 7 | developer reference |
| src/reconcile.ts — repeat and balance-gap checks | 6 | developer reference |
| src/storage.ts — local draft and receipt storage | 7 | developer reference |
| src/license.ts — one-time Sociobot license storage and verification | 8 | developer reference |
| public/sw-template.js — versioned offline app shell | 6 | developer reference |
| MIT licensed. | 2 | pass |
| See LICENSE. | 2 | pass |

There are no over-22-word sentences or marketing adjectives in either table.
The only banned word is **“unlock”** on the landing page. All visible landing
buttons use verbs that name their result.

## Demo and sandbox

- One click from the cold hero opens the real `/demo` URL at scroll Y 0.
- At 390×844 and 1440×900, the sticky **“Demo — sample data, nothing is
  saved”** banner, `example-march-2026.csv`, six rows, one exact repeat, one
  balance gap, and `-$30.00` difference all intersect the first viewport.
- **Reset demo** displayed **“Sample reset.”** and restored the shipped sample.
- A seeded production draft remained byte-for-byte unchanged during the live
  demo/reset probe. Seeded production license keys were unchanged until
  **Start for real** entered normal mode, where the app correctly performed
  normal license verification.
- Demo/check/export traffic was same-origin. A fresh live service worker then
  reloaded `/demo` offline with the demo banner, sample filename, and offline
  notice visible and no errors.
- The implementation behavior passes. The missing enforcement in the
  registered isolation test is F-2-2.

## Claims audit

Every exact `test` string in `.factory/claims.json` was run independently from
a clean clone at the reviewed commit. All 17 commands exited 0 and each passed
on desktop Chromium and the 390×844 mobile project.

| Claim ID | Command result | Review result |
| --- | --- | --- |
| `demo-isolation` | 2 passed | **insufficient IndexedDB assertion; F-2-2** |
| `demo-first-viewport` | 2 passed | pass |
| `first-read-demo` | 2 passed | pass; manually confirmed viewport intersection |
| `offline-reload` | 2 passed | pass; also confirmed live offline |
| `local-processing` | 2 passed | pass |
| `no-sign-in` | 2 passed | pass |
| `duplicate-detection` | 2 passed | pass |
| `balance-check` | 2 passed | pass |
| `csv-export` | 2 passed | pass; payload read and checked |
| `receipt-export` | 2 passed | pass; payload read and checked |
| `draft-recovery` | 2 passed | pass |
| `delimited-import` | 2 passed | pass |
| `json-draft-backup` | 2 passed | pass |
| `erase-draft` | 2 passed | **storage deletion not asserted; F-2-5** |
| `receipt-index` | 2 passed | **new row/persistence not asserted; F-2-3** |
| `proof-kit-price` | 2 passed | **merchant/refund outcome not asserted; F-2-4** |
| `self-hosted-assets` | 2 passed | **no-analytics outcome not asserted; F-2-6** |

The unlocked archive-export sentence (F-2-1) and the privacy page's
license-token disclosure (F-2-7) are unlisted claims. There is no declared
command with a nonzero exit status, but the five marked commands do not satisfy
the claims skill's observable-outcome requirement.

## History verification

`.factory/review-1.md`, `.factory/polish-1.md`, and the current handoff were
read in full. Each earlier finding was checked against the live site and code.

| Earlier finding | Live and code result |
| --- | --- |
| F-1-1 demo reads/writes real license storage | Implementation fixed: demo license state is `demo:`-prefixed and purchase/verification UI is hidden. Test closure is incomplete for production IndexedDB; F-2-2 reopens the enforcement portion. |
| F-1-2 demo banner not persistent | Fixed: banner is sticky and remains in the viewport. |
| F-1-3 sample absent from first mobile viewport | Fixed: compact prechecked summary is visible at 390 px. |
| F-1-4 export tests do not inspect payloads | Fixed: both tests read and validate their downloads. |
| F-1-5 commercial claims only partly tested | Half-fixed: live checkout currently shows one-time USD 12 and Dodo merchant text, but the registered test still repeats product copy; F-2-4. |
| F-1-6 lifecycle claims unlisted/inaccurate | Copy fixed. The new erase claim test does not establish deletion; F-2-5. |
| F-1-7 deployment/privacy claim untested | Self-hosting is tested; the no-analytics half is not; F-2-6. |
| F-1-8 route metadata/social image incomplete | Fixed on home, demo, privacy, terms, and 404; social image is 1200×630 and apple icon is 180×180. |
| F-1-9 route focus/common shell inconsistent | Fixed: common four-link header/footer, factory/build line, external-source cue, focused h1, and Back restoration all pass. |
| F-1-10 touch targets under 44 px | Live implementation fixed; direct mobile measurement found none. One full-suite transient remains part of F-2-8. |
| F-1-11 inconsistent terms | Fixed for bank CSV, repeat, and balance gap. “Map/Align” remains jargon but not a terminology conflict. |
| F-1-12 metaphorical product headings/tagline | Fixed on the landing page. The separate 404 metaphor is F-2-11. |
| F-1-13 README sentence length/jargon | Fixed: no README sentence exceeds 22 words. |
| F-1-14 “Update now” does not name result | Fixed: **Install update**. |

## Structure, accessibility, and links

- Home, demo, privacy, terms, and 404 have route-specific titles, one h1, one
  main, descriptions, canonicals, OG/Twitter metadata, SVG favicon, and
  180×180 apple-touch icon. The live 404 returns HTTP 404.
- Route navigation focuses the destination h1; Back restores home and focuses
  its h1. The route announcement is present. The only heading-copy exception
  is F-2-11.
- `robots.txt` and `sitemap.xml` are live and list the four public routes.
  Security headers and the static-host 404 override are present.
- Every discovered internal asset/route returned 200. The checkout returned
  its intended 303 to a live Dodo page, then 200. GitHub Source returned 200.
  No dead link was found.
- Fresh live Axe scans found no violations on the landing or checked-result
  state at mobile or desktop sizes. Both result views had zero horizontal
  overflow, no undersized controls in direct measurement, and no console/page
  errors. `/opt/fleet/lib/verify-url.sh` passed.
- The cassette-era reconciliation-zine identity is recognizably specific to
  the job and matches `.factory/design.md`; it is not a generic SaaS template.
  Asset provenance is present in `assets/src/` and the design document.

## Missed leverage

The deterministic local workflow already includes delimited import, mapping,
repeat and balance-gap checks, cleaned CSV, receipt, JSON backup/restore, and a
local receipt index. Runtime AI would send sensitive statement content away
from the local-first workflow without adding an obvious necessary step, so no
AI finding is warranted. Sync would likewise contradict the product's privacy
position unless separately opt-in. The one missing export a user would expect
is the saved-receipt export that the paid copy already promises (F-2-1).

## Verification performed

- Clean clone at `655b527`: `npm ci` passed with 0 vulnerabilities.
- All 17 exact claim commands: passed independently; 34 browser checks total.
- `npm test`: 12/12 passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed and produced `dist/`; initial JavaScript is 25.62 kB
  (9.89 kB gzip).
- `npm run test:e2e`: failed twice as described in F-2-8; focused reruns of the
  reported tests passed.
- Live/local SHA-256 values matched for `index.html`, the main JavaScript, and
  the main stylesheet, confirming that live observations apply to this commit.
- Live cold browser, one-click demo, reset/isolation marker, network
  interception, offline reload, route metadata/focus/Back, link crawl, touch
  sizes, and Axe checks were performed at 390×844 and 1440×900.

## What would make this perfect

Remove or implement the saved-receipt export promise. Strengthen the five
claim tests so each proves storage, persistence, billing, or analytics behavior
rather than adjacent copy or UI. Make the full browser suite repeatably green.
Then replace purchase jargon, correct the README's route statement, and make
the 404 h1 literal. Re-run every individual claim command, the complete suite,
and the live mobile/desktop audit; only a zero-finding result should pass.
