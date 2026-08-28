# Adversarial first-read review 3 — FAIL

Reviewed 2026-08-28 against `https://offline-ledger-import.sociobot.in` and
repository commit `793f234623d0f5184d362855a07fcae1b6034e7e`.

## Verdict

**FAIL.** The cold first screen is clear, the sample is immediately useful,
every registered claim command exits successfully, and the live offline,
privacy, accessibility, route, and link checks pass. The review still has 13
findings: 3 blocking, 8 major, and 2 minor.

The demo is not fully reset or discarded: saved demo receipts and demo license
keys survive both **Reset demo** and **Start for real**. Two earlier findings
are also only partly fixed: the footer is not a consistent shell and reports a
stale build identifier, while the input is still called both a **bank CSV** and
a **statement** and the form changes **columns** into **tracks**. Several
observable workflow and commercial promises remain absent from
`.factory/claims.json`.

## Findings

### Blocking

#### F-3-1 — Reset and exit leave demo data behind

- **Quote/location:** live banner: **“Demo — sample data, nothing is saved”**;
  actions: **“Reset demo”** and **“Start for real”**; `.factory/demo.md`:
  **“Start for real clears the demo namespace.”**
- **Observed:** in a fresh live context, a cached demo license was used to save
  the sample receipt. **Reset demo** left the receipt visible in the local
  receipt index and left both `demo:sb_license:offline-ledger-import` keys in
  localStorage. After **Start for real**, the `receipts` record still existed
  in `demo:ledger-import-check`, and both demo license keys still existed.
  `src/app.ts` calls only `clearDraft()`, which deletes the `current` draft.
- **Why this fails:** reset does not return the sandbox to a clean slate, and
  leaving demo mode does not discard all demo data as the demo contract and
  repository documentation promise. A verifier can receive state left by an
  earlier demo session.
- **Fix:** add one demo cleanup operation that deletes the full demo IndexedDB
  database and every `demo:` localStorage key. Use it for **Reset demo** before
  reseeding and for **Start for real** before navigation. Extend
  `@claim:demo-isolation` to save a receipt and demo license, then assert that
  reset and exit remove both while production storage remains byte-for-byte
  unchanged.

#### F-1-9 — The common route shell remains inconsistent (reopened)

- **Quote/location:** live home footer: **“No budgeting advice. No bank
  login.”** and **“hero artwork generated for this product with the factory
  image model.”** Privacy, Terms, and 404 omit both. Every route says
  **“build polish-1”**, although the deployed artifact matches the later
  review-2 repair at commit `793f234`.
- **Observed:** headers have the same four labels, and focus routing is fixed.
  Footers are still different documents rather than one consistent shell. The
  supposed build identifier was not changed for polish 2 and cannot identify
  the deployed build.
- **Why this fails:** F-1-9 required the same header/footer and a real
  version/build ID on every route. A legal or error-route visitor gets a
  reduced product statement, and the stale identifier makes deployment
  evidence ambiguous. The work order requires any half-fixed earlier finding
  to block again under its original ID.
- **Fix:** render identical footer copy and links on home, demo, privacy,
  terms, and 404. Replace `polish-1` with an injected immutable version or
  short commit SHA. Test exact shell text and build ID equality across every
  route, not only the presence of “Built by Param Factory.”

#### F-1-11 — The input and mapping terminology is still inconsistent (reopened)

- **Quote/location:** stage rail: **“Choose a statement”**; section heading:
  **“Load the bank CSV”**; mapping copy: **“We guessed from the headings.
  Confirm the tracks before running the check.”** and **“Match CSV columns.”**
- **Observed:** the same uploaded file is still called a **statement** and a
  **bank CSV**. The same column-matching concept is called **columns** and
  **tracks**. These exact terms are live at both 390 px and desktop.
- **Why this fails:** F-1-11 required **bank CSV**, **repeat**, and **balance
  gap** to be used consistently. A first-time visitor must still infer that a
  statement means the CSV file and that tracks means columns. Because the
  earlier finding remains partly fixed, it blocks again under its original ID.
- **Fix:** use **“Choose a bank CSV”** in the stage rail and **column/columns**
  throughout the mapping step. A plain rewrite is: **“We suggested matches
  from the column names. Check each column before running the balance check.”**

### Major

#### F-3-2 — Automatic column matching is an unlisted claim

- **Quote/location:** mapping step: **“We guessed from the headings.”**
- **Why this fails:** the visitor is told that the product selects mappings,
  but no claim entry names that result. Existing end-to-end checks use one
  conveniently named sample and do not assert each suggested selector.
- **Fix:** rewrite as **“We suggested matches from the column names.”** Add a
  `column-suggestions` claim and browser test with nontrivial date,
  description, debit, credit, and balance headers that asserts every selected
  mapping before the check runs.

#### F-3-3 — The row-location promise is stronger than its registered test

- **Quote/location:** running-balance help: **“This pinpoints where a missing
  row starts.”**
- **Why this fails:** `balance-check` asserts a gap count and the closing
  difference, but it does not assert that the live table marks the correct
  source row. “Pinpoints” promises a location, not only detection.
- **Fix:** use **“A running-balance column locates where a balance gap starts.”**
  Add that outcome to `claims.json` and assert the exact marked source row and
  discrepancy in the browser test.

#### F-3-4 — Include/exclude behavior is an unlisted claim

- **Quote/location:** result table caption: **“Uncheck Include to mute a row
  from the cleaned export and balance calculation.”**
- **Why this fails:** no claim test toggles an ordinary transaction and proves
  both promised downstream changes. The CSV export test relies only on the
  sample’s automatically excluded exact repeat.
- **Fix:** add an `include-toggle` claim. Toggle a non-repeat row, assert the
  displayed included total and difference change, then assert that the row is
  absent from the downloaded cleaned CSV. Use **exclude** rather than the
  cassette metaphor **mute**.

#### F-3-5 — Chronological sorting is an unlisted claim

- **Quote/location:** result table caption: **“Transactions in chronological
  order.”**
- **Why this fails:** a visitor can rely on this ordering while checking a
  statement, but no claim entry or tagged test loads out-of-order dates and
  checks the displayed order.
- **Fix:** add a `chronological-order` claim and demo-sandbox test with shuffled
  source rows, including two transactions on the same date. Assert date order
  and stable source order for ties, or remove the sentence.

#### F-3-6 — The required-header sentence is an unlisted import claim

- **Quote/location:** import instructions: **“The first row must contain
  column names.”**
- **Why this fails:** this is a concrete accepted-input rule, but
  `delimited-import` only supplies files that already obey it. It does not
  verify the requirement or the recovery message.
- **Fix:** add a `header-row-required` claim and test that a headerless file is
  rejected with an error that says what happened and what to do next.

#### F-3-7 — “Free” exports are not covered as a commercial claim

- **Quote/location:** README: **“Cleaned CSV and receipt exports are free.”**
  Landing: **“The free checker includes … cleaned CSV, receipt export, and
  draft backups.”**
- **Why this fails:** `csv-export` and `receipt-export` run in demo mode. They
  prove downloads, but do not prove that an unlicensed normal workspace keeps
  those actions available. “Free” is a commercial promise separate from file
  correctness.
- **Fix:** add a `free-exports` claim and test a clean, non-demo, unlicensed
  context through both downloads and draft backup. Assert that no license or
  checkout request occurs.

#### F-3-8 — The saved-workspace exit promise is unlisted and under-tested

- **Quote/location:** README: **“Start for real opens your saved workspace.”**
- **Why this fails:** no claim entry names this result. The isolation test
  seeds a production draft and clicks **Start for real**, but asserts only the
  root URL; it never asserts that the seeded filename and values appear.
- **Fix:** add a `start-real-workspace` claim. Seed a real draft, enter and
  change the demo, choose **Start for real**, and assert that the original real
  filename and values render while all demo state has been discarded.

#### F-3-9 — The privacy sentence combines buying and verification without matching coverage

- **Quote/location:** live Privacy: **“Buying or verifying Proof Kit sends a
  license token to Sociobot billing.”** Claim entry:
  **“Verifying Proof Kit sends only a license token to Sociobot billing.”**
- **Why this fails:** the registered test covers verification only. Buying
  opens an external Sociobot/Dodo checkout and is not the same network action;
  the current wording does not disclose that transition and implies that a
  license token is what starts a purchase.
- **Fix:** write two sentences: **“Buying opens Sociobot/Dodo checkout.
  Verifying sends only your license token to Sociobot billing.”** Add a
  non-spending checkout-network test for the first sentence; keep the existing
  verification test for the second.

### Minor

#### F-3-10 — The external checkout action does not name its destination

- **Quote/location:** landing button: **“Buy Proof Kit”**; target:
  `api.sociobot.in`, which redirects to `checkout.dodopayments.com`.
- **Why this fails:** site structure requires external links to say so. A
  first-time visitor is moved from this local-first site to a payment host
  without that being named on the action.
- **Fix:** rename the action **“Buy on Sociobot”** and add nearby copy
  **“Opens secure Sociobot/Dodo checkout.”**

#### F-3-11 — Receipt actions alternate between “export” and “download”

- **Quote/location:** hero: **“Export cleaned CSV and receipt”**; result
  action: **“Download receipt”**; README: **“receipt exports.”**
- **Why this fails:** the plain-words rule requires one word for one concept.
  The adjacent CSV action says **Export cleaned CSV**, making the switch more
  noticeable.
- **Fix:** use **“Export receipt”** everywhere, including the action and saved
  receipt controls, or use **download** consistently for both files.

## Cold first read

Fresh browser contexts opened the live home at 390×844 and 1440×900. Both
returned HTTP 200 at scroll Y 0 with no console/page errors, no horizontal
overflow, one h1, one main, and no cross-origin requests.

Before scrolling, my answers were:

| Question | 390×844 | 1440×900 |
| --- | --- | --- |
| What does this do? | It checks a bank CSV for repeats and balance gaps before import. | Same. |
| For whom? | Households and freelancers. | Same. |
| What should I click first? | **Try it with sample data.** | Same. |

The exact text that supplied those answers was **“Check bank CSVs before
importing,” “For households and freelancers: find repeats and balance gaps
before importing,”** and **“Try it with sample data.”** The action explanation
and all three facts also intersected both first viewports. This gate passes.

## Copy audit

Counts are whitespace-delimited; standalone separators such as `·`, `/`, and
`—` are not words. The first table covers every initially rendered landing
text unit, including headings, navigation, labels, and actions. The second
covers the conditional/demo/workflow text shipped in the landing document.
No sentence exceeds 22 words. No banned marketing adjective appears.

### Live landing page — initial render

| Copy | Words | Result |
| --- | ---: | --- |
| Skip to ledger check | 4 | pass |
| Ledger Import Check | 3 | pass |
| Demo | 1 | pass |
| Method | 1 | pass |
| Proof Kit | 2 | product name |
| Privacy | 1 | pass |
| Private bank CSV checks | 4 | pass |
| Check bank CSVs before importing | 5 | pass |
| For households and freelancers: find repeats and balance gaps before importing. | 11 | pass |
| Try it with sample data | 5 | pass; result-naming action |
| Loads a checked sample bank CSV in a separate demo. | 10 | registered demo claims |
| Works offline after the first visit | 6 | registered claim |
| No sign-in | 2 | registered claim |
| Export cleaned CSV and receipt | 5 | terminology flag; F-3-11 |
| One local copy. | 3 | registered local-processing claim |
| Finds repeats and balance gaps. | 5 | registered claims |
| Keeps a receipt. | 3 | registered receipt claim |
| Load | 1 | pass |
| Choose a statement | 3 | inconsistent input term; F-1-11 |
| Match | 1 | pass |
| Match CSV columns | 3 | pass |
| Check | 1 | pass |
| Keep the evidence | 3 | understandable in the stage context |
| Track 01 / source | 3 | decorative label |
| Load the bank CSV | 4 | pass |
| CSV, TSV, or semicolon-separated. | 4 | registered claim |
| The first row must contain column names. | 7 | unlisted claim; F-3-6 |
| Choose CSV | 2 | result-naming action |
| or drop it on this workbench | 6 | pass |
| Try it with sample data | 5 | result-naming action |
| Your bank CSV stays in this browser. | 7 | registered claim |
| The draft survives a refresh. | 5 | registered claim |
| Download a backup before you clear browser data. | 8 | instruction |
| Restore draft backup | 3 | result-naming action |
| Optional one-time purchase | 3 | pass |
| Save past receipts with Proof Kit | 6 | pass |
| The free checker includes repeat checks, balance-gap checks, cleaned CSV, receipt export, and draft backups. | 15 | free claim gap; F-3-7 |
| Proof Kit adds a local receipt index for recurring monthly work. | 11 | registered claim |
| $12 one-time · local receipt index | 5 | registered claim |
| Buy Proof Kit | 3 | external-destination flag; F-3-10 |
| Have a license? | 3 | disclosure summary |
| Paste license token | 3 | clear form label |
| Verify license | 2 | result-naming action |
| Ledger Import Check checks a bank CSV before you import it. | 11 | pass |
| No budgeting advice. | 3 | scope statement |
| No bank login. | 3 | registered no-sign-in claim |
| Privacy | 1 | pass |
| Terms | 1 | pass |
| Source (GitHub) | 2 | external destination named |
| Built by Param Factory · build polish-1 · hero artwork generated for this product with the factory image model. | 17 | stale build ID; F-1-9 |

### Live landing page — conditional and workflow copy

| Copy | Words | Result |
| --- | ---: | --- |
| Offline mode — your saved draft and every check still work here. | 11 | registered offline claim |
| Offline setup did not finish. | 5 | clear error |
| Reload this page while online to try again. | 8 | clear recovery |
| Demo — sample data, nothing is saved | 6 | reset/exit failure; F-3-1 |
| Reset demo | 2 | result-naming action; behavior fails F-3-1 |
| Start for real | 3 | exit action; claim gap F-3-8 |
| Demo / March 2026 bank CSV | 5 | pass |
| example-march-2026.csv · 6 rows · opening $1,200.00 · supplied closing $900.00 | 8 | realistic sample data |
| 1 exact repeat | 3 | registered claim |
| 1 balance gap | 3 | registered claim |
| -$30.00 difference | 2 | registered claim |
| The receipt and cleaned CSV are ready below. | 8 | registered export claims |
| You can still change the sample and run the check. | 10 | pass |
| Review a sample bank CSV | 5 | pass |
| Track 02 / alignment | 3 | cassette label; terminology issue F-1-11 |
| Tell us which column is which | 6 | clear heading |
| We guessed from the headings. | 5 | unlisted claim; F-3-2 |
| Confirm the tracks before running the check. | 7 | inconsistent jargon; F-1-11 |
| Date column | 2 | clear label |
| Description column | 2 | clear label |
| Date order | 2 | clear label |
| Auto (month/day if ambiguous) | 4 | pass |
| Month / day / year | 3 | pass |
| Day / month / year | 3 | pass |
| Year / month / day | 3 | pass |
| Amount layout | 2 | clear legend |
| One signed amount | 3 | pass |
| Debit + credit | 3 | pass |
| Amount column | 2 | clear label |
| Payments should be negative; deposits positive. | 6 | clear instruction |
| Debit / money out | 3 | clear label |
| Credit / money in | 3 | clear label |
| Running balance optional | 3 | clear label |
| This pinpoints where a missing row starts. | 7 | stronger unlisted claim; F-3-3 |
| Statement label | 2 | domain label, not the file name |
| Currency code | 2 | clear label |
| Opening balance | 2 | clear label |
| Closing balance | 2 | clear label |
| Preview the first 3 source rows | 6 | result-naming disclosure |
| Run balance check | 3 | result-naming action |
| Download draft backup | 3 | result-naming action |
| Track 03 / evidence | 3 | decorative label |
| Reconciliation receipt | 2 | clear heading |
| Review every marked row before exporting. | 6 | clear instruction |
| Show rows | 2 | clear label |
| All transactions | 2 | clear option |
| Only rows to review | 4 | clear option |
| Included rows | 2 | clear option |
| Excluded rows | 2 | clear option |
| Transactions in chronological order. | 4 | unlisted claim; F-3-5 |
| Uncheck Include to mute a row from the cleaned export and balance calculation. | 13 | unlisted claim and metaphor; F-3-4 |
| Export cleaned CSV | 3 | result-naming action |
| Download receipt | 2 | terminology flag; F-3-11 |
| Print / save PDF | 3 | result-naming action |
| Save to Proof Kit | 4 | result-naming action |
| This checks file consistency only. | 5 | clear scope statement |
| It is not financial, accounting, or tax advice. | 8 | clear scope statement |
| Proof Kit active | 3 | clear status |
| Saved receipt copies stay in this browser. | 7 | registered receipt-index claim |
| Download any saved receipt for backup. | 6 | registered receipt-index claim |
| Local receipt index | 3 | clear heading |
| No saved receipts yet. | 4 | clear empty state |
| Run a check, then choose “Save to Proof Kit.” | 9 | clear empty-state action |
| Install app | 2 | result-naming action |
| A fresh version is ready. | 5 | clear status |
| Install update | 2 | result-naming action |

### README

| Copy | Words | Result |
| --- | ---: | --- |
| Ledger Import Check | 3 | pass |
| Check bank CSVs before importing. | 5 | pass |
| It is for households and freelancers who want to find repeats and balance gaps locally. | 15 | pass |
| The demo includes a checked March 2026 bank CSV. | 9 | registered demo claim |
| It shows one repeat, one balance gap, and a $30.00 difference. | 11 | registered claims |
| It is not budgeting software, financial advice, or a bank connection. | 11 | clear scope statement |
| Live | 1 | pass |
| Try the sample | 3 | clear heading |
| Open the demo. | 3 | clear instruction |
| The demo opens with its sample already checked. | 8 | registered claim |
| Sample work stays separate from your saved workspace. | 8 | registered isolation claim |
| Reset demo restores the sample. | 5 | reset is incomplete; F-3-1 |
| Start for real opens your saved workspace. | 7 | unlisted/under-tested claim; F-3-8 |
| Your data and Proof Kit | 5 | clear heading |
| Your bank CSV stays in this browser during normal checks. | 10 | registered claim |
| The draft survives refresh and can be exported or restored as JSON. | 12 | registered claims |
| Download a backup before clearing browser data. | 7 | clear instruction |
| Cleaned CSV and receipt exports are free. | 7 | unlisted commercial claim; F-3-7 |
| Proof Kit is a one-time $12 license for a local receipt index. | 12 | registered claim |
| See privacy and terms. | 4 | clear instruction |
| The built app adds no analytics or external font/CDN requests. | 10 | registered claims |
| It serves its own app files. | 6 | registered claim |
| Develop and verify | 3 | clear heading |
| Requires a current Node.js release. | 5 | developer requirement |
| npm ci | 2 | command |
| npm run dev | 3 | command |
| npm test | 2 | command |
| npm run build | 3 | command |
| npm run test:e2e | 3 | command |
| The full claim contract is in .factory/claims.json. | 7 | developer reference |
| Workflow claim tests use /demo; landing and legal-copy tests use their published routes. | 13 | accurate developer note |
| Playwright is pinned to 1.58.2. | 5 | accurate developer note |
| Deploy dist/ at the domain root. | 6 | deploy instruction |
| The factory registers the paid product separately. | 7 | factory instruction |
| Structure | 1 | developer heading |
| src/csv.ts — parsing, normalization, and column suggestions | 6 | developer reference |
| src/reconcile.ts — repeat and balance-gap checks | 5 | developer reference |
| src/storage.ts — local draft and receipt storage | 6 | developer reference |
| src/license.ts — one-time Sociobot license storage and verification | 7 | developer reference |
| public/sw-template.js — versioned offline app shell | 5 | developer reference |
| MIT licensed. | 2 | repository fact |
| See LICENSE. | 2 | clear reference |

All initial landing actions use verbs and name a result. The conditional actions
do as well. The copy defects are terminology, unlisted claims, and external
destination disclosure rather than sentence length or banned adjectives.

## Demo and sandbox

- The first hero action opens `/demo?demo=1` in one click at scroll Y 0.
- At 390×844 and 1440×900, the sticky demo banner, sample filename, six-row
  summary, exact repeat, balance gap, and `-$30.00` difference all intersect
  the first viewport.
- The first post-click h1 is **“Review a sample bank CSV.”** The result is
  already computed; the visitor can still change inputs and rerun it.
- A seeded production draft and production license keys remained byte-for-byte
  unchanged through demo entry and reset. Demo/check/export traffic was
  same-origin.
- A live service-worker-controlled demo reloaded at both viewport sizes with
  network access disabled. The banner, sample, offline status, and balance
  check remained usable without console errors.
- Reset and exit cleanup fail as documented in F-3-1.

## Claims audit

Every exact `test` command in `.factory/claims.json` was run independently from
a clean clone at the reviewed commit. All 19 commands exited 0 and each ran in
desktop Chromium and the 390×844 mobile project.

| Claim ID | Command result | Review result |
| --- | --- | --- |
| `demo-isolation` | 2 passed | production isolation passes; full reset/exit cleanup is not covered, F-3-1 |
| `demo-first-viewport` | 2 passed | pass; also confirmed live |
| `first-read-demo` | 2 passed | pass; also confirmed live before scrolling |
| `offline-reload` | 2 passed | pass; live offline check also completed a balance check |
| `local-processing` | 2 passed | pass; live export flow had no cross-origin request |
| `no-sign-in` | 2 passed | pass |
| `duplicate-detection` | 2 passed | pass |
| `balance-check` | 2 passed | detection passes; stronger row-location copy is F-3-3 |
| `csv-export` | 2 passed | pass; payload is read and checked |
| `receipt-export` | 2 passed | pass; payload is read and checked |
| `draft-recovery` | 2 passed | pass |
| `delimited-import` | 2 passed | pass; header requirement remains unlisted, F-3-6 |
| `json-draft-backup` | 2 passed | pass |
| `erase-draft` | 2 passed | pass; IndexedDB deletion is asserted |
| `receipt-index` | 2 passed | pass; storage, reload, and saved download are asserted |
| `proof-kit-price` | 2 passed | pass; recorded contract and live checkout agree |
| `self-hosted-assets` | 2 passed | pass |
| `no-analytics` | 2 passed | pass; workflow allowlist and build scan are asserted |
| `license-verification-network` | 2 passed | pass; dummy request contains only the query token and no body |

No registered command failed. The unlisted claims are F-3-2 through F-3-9.
Until each is removed, weakened to a covered statement, or added to
`claims.json` with an outcome test, the claim inventory is incomplete.

## History verification

`.factory/review-1.md`, `.factory/review-2.md`, `.factory/polish-1.md`,
`.factory/polish-2.md`, and the previous handoff were read in full. Every
earlier finding was checked against both the live site and current code.

| Earlier finding | Live and code result |
| --- | --- |
| F-1-1 demo reads/writes real license storage | Fixed for production isolation. Demo uses `demo:` keys and a separate database. Full demo cleanup is a new failure, F-3-1. |
| F-1-2 demo banner not persistent | Fixed: sticky banner remains in both viewports. |
| F-1-3 sample absent from first mobile viewport | Fixed: filename, repeat, gap, and difference are visible. |
| F-1-4 export tests do not inspect payloads | Fixed: both downloads are read and checked. |
| F-1-5 commercial claims partly tested | Fixed for the registered price/merchant/refund contract. |
| F-1-6 lifecycle claims inaccurate/untested | Fixed for real-draft erase and saved-workspace wording; the latter still lacks its own claim, F-3-8. |
| F-1-7 deployment/privacy claim untested | Fixed: self-hosted assets and no-analytics are separate tests. |
| F-1-8 route metadata/social image incomplete | Fixed across home, demo, privacy, terms, and 404. |
| F-1-9 route focus/common shell inconsistent | **Half-fixed and reopened:** focus works, but footers differ and the build ID is stale. |
| F-1-10 touch targets below 44 px | Fixed: live measurements and regression pass. |
| F-1-11 inconsistent terms | **Half-fixed and reopened:** repeat/balance-gap are consistent, but bank CSV/statement and columns/tracks are not. |
| F-1-12 metaphor headings/tagline | Fixed on the product and legal pages. |
| F-1-13 README length/jargon | Fixed: no README sentence exceeds 22 words. |
| F-1-14 “Update now” action | Fixed: **Install update**. |
| F-2-1 saved receipt export missing | Fixed: saved receipt payload and download survive reload. |
| F-2-2 demo isolation test weak | Fixed for byte-for-byte production storage comparison. It does not cover complete demo deletion; F-3-1. |
| F-2-3 receipt-index test weak | Fixed: row, data, persistence, and download are asserted. |
| F-2-4 checkout test repeated copy | Fixed with the recorded checkout contract; live checkout still shows one-time USD 12 and Dodo. |
| F-2-5 erase test did not inspect storage | Fixed: the record is read as absent before reseeding. |
| F-2-6 no-analytics test allowed telemetry | Fixed with an explicit path allowlist and build scan. |
| F-2-7 license-token disclosure unlisted | Fixed for verification. Buying remains combined into the privacy sentence; F-3-9. |
| F-2-8 full browser suite unstable | Fixed in this run: 54 passed, 4 expected project skips, one worker. |
| F-2-9 purchase/mapping jargon | Purchase wording and **Match** are fixed. **tracks** remains in mapping copy and is included in reopened F-1-11. |
| F-2-10 README claim-route description inaccurate | Fixed. |
| F-2-11 metaphorical 404 h1 | Fixed: **“We could not find that page.”** |

## Structure, accessibility, performance, and links

- Home, demo, privacy, terms, and the designed HTTP 404 have route-specific
  titles, one h1, one main, descriptions, canonicals, Open Graph/Twitter data,
  SVG favicon, and apple-touch icon. The 1200×630 social image and route files
  are live.
- `robots.txt`, `sitemap.xml`, security headers, and the 404 override are
  present. Every discovered internal route/asset returned its expected status.
  The checkout redirected to a live Dodo page with HTTP 200, and GitHub
  returned HTTP 200. No dead link was found.
- Deep links load the right page. Route headings receive focus after load, and
  Back restores the home URL and h1 focus. Skip-link, reduced-motion, 390 px
  overflow, and 44 px target regressions pass.
- Live Axe scans found zero violations on home, checked demo, privacy, terms,
  and 404 at both sizes. `verify-url.sh` reported the correct title,
  `lang=en`, one h1, one main, no missing alt, no unlabeled button, and no
  console error.
- The clean build emits 26.01 KB JavaScript (10.01 KB gzip) plus a 0.76 KB
  style loader, below the static-product budget.
- The cassette-era reconciliation-zine identity is distinctive and matches
  `.factory/design.md`: paper/ink palette, mono display type, tape-stage
  grammar, original cassette artwork, hard shadows, and restrained motion. It
  is not a generic SaaS template.
- Footer consistency and build identity still fail under F-1-9. The checkout
  destination cue fails under F-3-10.

## Missed leverage

No additional AI step is warranted. The core job is deterministic, sensitive,
and useful offline; sending statement rows to an inference gateway would work
against the product’s privacy position. CSV import, cleaned CSV export,
receipt export, JSON draft backup/restore, and a local receipt archive already
cover the obvious import/export loop. Sync would need a new, explicitly
opt-in privacy model rather than being an expected default.

The missing leverage is not another feature. It is reliable control over the
existing sandbox state and test coverage for the workflow behavior already
promised in copy.

## Verification performed

- Clean clone: `/tmp/offline-ledger-import-review3.8eJVSY` at `793f234`.
- `npm ci`: passed with zero reported vulnerabilities.
- `npm test`: 12/12 passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed and produced `dist/`.
- All 19 exact claim commands: passed independently; 38 browser checks.
- `npm run test:e2e`: 54 passed, 4 expected project skips.
- Live home HTML SHA-256 exactly matched the clean build:
  `c5235aa2ee90aee35e784531e48ea94042c1689c68633c89f80bf02705747c24`.
- Live cold mobile/desktop first read, one-click demo, production-storage
  isolation, reset/exit retention probe, offline reload and check, workflow
  request interception, dummy license interception, metadata, focus/Back,
  link crawl, touch sizing, visual inspection, Axe, and `verify-url.sh` were
  run independently.

## What would make this perfect

Delete every demo artifact on reset and exit while preserving real storage.
Finish the old shell and terminology repairs instead of carrying a stale
footer/build label and mixed statement/track words. Register and test every
remaining behavioral, privacy, and commercial promise. Name the external
checkout destination and use one verb for receipt files. Then rerun every
claim command, the full suite, and the live mobile/desktop audit. The next
review can pass only if that rerun produces zero findings and zero untested
claims.
