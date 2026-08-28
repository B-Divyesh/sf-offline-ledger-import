# Polish 3 — acceptance evidence

The deployed application artifact is `2b1cd6674f49`. The live check used a
fresh 390px browser context at <https://offline-ledger-import.sociobot.in>.
Screenshots and machine-readable checks are in `.factory/evidence/polish-3/`.
Each row below was rechecked on that live origin; the listed route, test tag,
or screenshot is its specific evidence.

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Reset and exit now delete the complete demo database and every `demo:` license key, without touching normal storage. | `@claim:demo-isolation`; live reset/exit probe; `live-demo/manual-mobile.png` |
| F-1-2 | The sticky demo banner remains visible with Reset demo and Start for real actions. | `@claim:demo-first-viewport`; live `/demo?demo=1` screenshot |
| F-1-3 | The first 390px demo view shows the sample filename, repeat, balance gap, and difference. | `@claim:demo-first-viewport`; `live-demo/screenshot-mobile.png` |
| F-1-4 | CSV and receipt tests read downloaded payloads, including rows, totals, discrepancy, and method. | `@claim:csv-export`; `@claim:receipt-export` |
| F-1-5 | The recorded $12 one-time Sociobot/Dodo contract is asserted without spending. | `@claim:proof-kit-price`; `@claim:checkout-destination` |
| F-1-6 | Erase local draft deletes the stored active record before any demo reseed. | `@claim:erase-draft` |
| F-1-7 | Asset hosting and no-tracking promises have separate, explicit tests. | `@claim:self-hosted-assets`; `@claim:no-analytics` |
| F-1-8 | Every published route has its own title, canonical, description, social metadata, and legal/error page. | route metadata regression; live `/privacy/`, `/terms/`, `/404/` |
| F-1-9 | Home, demo, legal, and 404 footers are identical and receive the injected artifact SHA. | route shell regression; live routes all show `build 2b1cd6674f49` |
| F-1-10 | Text actions use a 48px minimum target; tests wait for settled fonts/layout. | `@regression:touch-targets`; `@regression:route-touch-targets` |
| F-1-11 | Import and mapping language consistently says bank CSV and columns. | `@claim:column-suggestions`; `.factory/copy-audit.md` |
| F-1-12 | Product and error headings describe the job or state plainly. | `@claim:first-read-demo`; live `/404/` |
| F-1-13 | README/demo/storage prose is short and uses visitor-facing language. | `.factory/copy-audit.md`; README review |
| F-1-14 | The service-worker action is named “Install update.” | service-worker regression coverage in the full suite |
| F-2-1 | Saved receipts retain their complete payload and have an Export saved receipt action after reload. | `@claim:receipt-index` |
| F-2-2 | Isolation test serializes and compares normal IndexedDB plus license storage before and after demo operations. | `@claim:demo-isolation` |
| F-2-3 | Receipt-index test asserts the new row, saved payload, reload persistence, and export. | `@claim:receipt-index` |
| F-2-4 | Contract fixture asserts product, price, one-time billing, merchant, refund terms, and checkout path. | `@claim:proof-kit-price` |
| F-2-5 | Erase verification reads the absent `current` IndexedDB record directly. | `@claim:erase-draft` |
| F-2-6 | The no-analytics test allows only enumerated static app files and hashed assets, then scans the build for telemetry markers. | `@claim:no-analytics` |
| F-2-7 | Dummy-token verification is intercepted and checked for its sole Sociobot endpoint and no bank payload. | `@claim:license-verification-network` |
| F-2-8 | Playwright runs serially with the installed full Chromium binary; target checks wait for fonts and two frames. | clean-clone `npm run test:e2e`: 75 passed, 5 expected skips |
| F-2-9 | Purchase and mapping copy uses “one-time purchase,” “Proof Kit active,” and “Match CSV columns.” | `.factory/copy-audit.md`; `@claim:first-read-demo` |
| F-2-10 | README distinguishes demo workflow claims from landing and legal route checks. | README review; clean-clone claim matrix |
| F-2-11 | The 404 h1 says “We could not find that page.” | route regression; live `/404/` |
| F-3-1 | One cleanup routine clears the whole demo namespace for both reset and exit, then reset reseeds only the sample. | `@claim:demo-isolation`; live reset/exit probe |
| F-3-2 | Column suggestions are stated plainly and asserted for nontrivial source headers. | `@claim:column-suggestions` |
| F-3-3 | The running-balance claim is limited to locating a gap start and asserts the marked source row. | `@claim:balance-gap-location` |
| F-3-4 | Include controls use “exclude” wording and prove changed total, difference, and cleaned export. | `@claim:include-toggle` |
| F-3-5 | Chronological display and stable same-date source ordering are asserted from shuffled input. | `@claim:chronological-order` |
| F-3-6 | Headerless bank CSVs are rejected with a recovery message. | `@claim:header-row-required` |
| F-3-7 | An unlicensed normal workspace exports cleaned CSV, receipt, and draft backup without checkout traffic. | `@claim:free-exports` |
| F-3-8 | Start for real restores the seeded normal filename and values while deleting demo state. | `@claim:start-real-workspace` |
| F-3-9 | Privacy separates checkout from verification, with one test for each destination. | `@claim:checkout-destination`; `@claim:license-verification-network`; live `/privacy/` |
| F-3-10 | Purchase action says “Buy on Sociobot” and names the Sociobot/Dodo checkout beside it. | `@claim:checkout-destination`; live `/` |
| F-3-11 | All receipt actions use Export rather than alternating with Download. | `@claim:receipt-export`; `@claim:receipt-index`; `.factory/copy-audit.md` |

## Live evidence

- Home: <https://offline-ledger-import.sociobot.in/> — `live-home/verify.json`, `live-home/manual-mobile.png`.
- Isolated demo: <https://offline-ledger-import.sociobot.in/demo?demo=1> — `live-demo/verify.json`, `live-demo/manual-mobile.png`.
- Published legal/error routes: <https://offline-ledger-import.sociobot.in/privacy/>, <https://offline-ledger-import.sociobot.in/terms/>, and <https://offline-ledger-import.sociobot.in/404/>.
- Live Playwright Axe scan: zero serious/critical violations on home, demo, privacy, terms, and 404.
- Final clean-clone command output: `clean-claims.log` (all 27 declared claim commands) and `clean-e2e.log` (75 passed, 5 expected skips).
