# Independent verification 4 — FAIL

Verified 2026-09-05 against implementation candidate
`2b1cd6674f499339c24cb7b556a43afbd2b43f79` and live URL
<https://offline-ledger-import.sociobot.in/>. The checkout used for tests was
documentation commit `e597a13da6c6b62b59effde5e3b8ba7d0a210f89`.
Its diff from the candidate contains only prior evidence and documentation;
there are no product-source changes. A fresh production build matched live
`index.html`, main JavaScript, stylesheet, and legal JavaScript byte-for-byte.

## Verdict

**FAIL — do not declare this release accepted.** There is one minor finding
and one untested public claim. All 27 registered claim commands pass, but the
additional public 20 MB boundary statement is not registered or sandbox-tested.
The claims contract requires every visitor-facing claim to have exactly one
tagged test. A PASS requires zero findings and zero untested claims.

| Finding | Severity | Evidence | Required disposition |
| --- | --- | --- | --- |
| F-4-1 — unregistered 20 MB input limit | Minor | `src/app.ts` rejects a selected file larger than `20 * 1024 * 1024` and displays “This bank CSV is over 20 MB. Split it into smaller periods and check each one.” No `claims.json` entry, `@claim:` tag, or test mentions `20 MB` / `20 * 1024 * 1024`. | Add a precise claim and fresh-demo browser test that proves the over-limit recovery and a subsequent normal import, or remove the public numeric promise. |

Counts: **finding_count: 1; untested_claim_count: 1.** This is a contract
coverage defect, not a demonstrated runtime failure of the limit itself.

## Job, audience, and first action

Fresh desktop and 390×844 phone contexts opened the live landing page before
scrolling. Both state the job as **“Check bank CSVs before importing”**, name
**households and freelancers** as the audience, and offer **“Try it with
sample data”** as the first action. The adjacent explanation says that it
loads a checked sample bank CSV in a separate demo. The live action target was
52 px high on desktop and phone (350 px wide on the phone).

The one-click live demo displayed the persistent **“Demo — sample data,
nothing is saved”** banner with Reset demo and Start for real. It immediately
showed the sample CSV, one exact repeat, one balance gap, and the -$30.00
difference. Reset produced “Sample reset.” No console or page errors occurred.

## Registered claims and clean-checkout quality gates

I cloned the repository separately at `e597a13`, ran `npm ci` (0 audit
vulnerabilities), and then executed every command declared in
`.factory/claims.json` individually. **All 27 passed**: demo isolation and
first viewport, first read, offline reload, local processing, no sign-in,
duplicate and balance checks, both exports, draft recovery/backup/erase,
receipt index, price and checkout, self-hosted assets/no analytics, license
network privacy, mapping, gap location, include, chronological ordering,
header recovery, free exports, and Start for real.

The durable command output is in
`.factory/evidence/verification-4/clean-claims.log`. The following clean
checkout gates also passed; their output is in
`.factory/evidence/verification-4/clean-quality.log`.

| Command | Result |
| --- | --- |
| `npm test` | 12 passed |
| `npx tsc --noEmit` | passed |
| `npm run build` | passed; `dist/` produced |
| `npm run test:e2e` | 75 passed, 5 expected skips |

The full suite exercises normal sample checks and downloads, invalid
header-row recovery, delimiter variants, ordering boundaries, balance-gap and
include changes, refresh recovery, reset/exit isolation, offline reload, and
mobile touch targets. F-4-1 remains because that particular numeric file-size
boundary is neither in the published claim inventory nor tested with a claim
tag.

## Live product checks

- Fresh live offline check: one service worker registered; after its first
  demo visit the page reloaded offline with the demo banner, sample filename,
  and offline notice present and no errors.
- Privacy/demo isolation: the passing clean claim test snapshots normal
  IndexedDB and license storage before demo/reset/exit, then proves they are
  unchanged. The demo namespace is separate and Start for real removes it.
- Browser accessibility: fresh live Playwright Axe scans at 390 px found zero
  serious or critical violations on `/`, `/demo?demo=1`, `/privacy/`,
  `/terms/`, and `/404/`. The live pages each have one h1 and one main;
  titles are route-specific. The worker verifier also found `lang=en`, no
  missing image alt text, no unlabeled buttons, and no console errors.
- Keyboard and motion: route load moves focus to the route h1; the skip link
  works when activated and focuses main. Under reduced motion, computed
  transition and animation durations are `0.01ms`; at 390 px page overflow is
  0 px.
- Routes/links: `/`, `/demo`, `/privacy/`, `/terms/`, and `/404/` returned
  200 with the expected title/h1/main. An unknown route returned the styled
  HTTP 404. All discovered first-party links and the declared external links
  resolved successfully. `robots.txt`, `sitemap.xml`, canonical and social
  metadata are present.
- Privacy/security: live normal/demo requests were covered by the passing
  same-origin/no-tracking claim tests. Live response headers include CSP,
  HSTS, `nosniff`, `DENY` framing, Referrer-Policy, and Permissions-Policy.
  This static PWA has no backend, tenant, health, persistence-restart, or
  rate-limit surface to test.
- Performance: clean build output is 26.66 KB JavaScript (10.23 KB gzip) and
  18.35 KB CSS (4.93 KB gzip), within the stated static budgets. The prior
  candidate-identical Lighthouse evidence remains desktop 100 performance /
  100 accessibility and mobile 98 performance / 100 accessibility. A fresh
  Lighthouse CLI attempt could not attach to the worker's Chromium despite an
  explicit browser path, so no new Lighthouse score is claimed here.

## Earlier findings disposition

All findings from earlier reviews were inspected against the current checkout,
the full clean browser suite, and the live app. Their individual repair map is
`.factory/polish-3.md`; every row there is current because the implementation
candidate is unchanged and the corresponding claims/regressions passed again.

| Earlier set | Current disposition | Current proof |
| --- | --- | --- |
| `review-1.md` F-1-1 through F-1-14 | Closed | Demo reset/exit isolation, first viewport, exports, billing copy/contract, erase, asset/tracking, routes/footer, touch targets, plain copy, and update naming are covered by the 27 claim reruns and full suite. |
| `review-2.md` F-2-1 through F-2-11 | Closed | Receipt persistence/export, full storage isolation, billing and license network controls, erase record, analytics allowlist, stable browser run, copy/legal and 404 checks all passed again. |
| `review-3.md` F-3-1 through F-3-11 | Closed | Namespace cleanup, mapping/gap/include/order/header behavior, free exports, Start for real, checkout/privacy wording, and receipt wording all passed again. |

There are no backend or CLI-specific checks to apply. The checkout destination
claim uses an intercepted non-spending path; no purchase was made.
