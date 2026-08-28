# Polish 2 — complete review closure

Candidate repaired from `655b5277006000b92bf514714a91d0049e96bfe7` using reviews 1 and 2. Repair commit: `0750fb2173f8d203b41a2164f35ebd04f70c37d2`.

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 / F-2-2 | Demo uses only `demo:` storage. The test serializes the real `current` record and production license keys before demo, reset, exit, then compares them byte-for-byte. | `@claim:demo-isolation`; local verify report |
| F-1-2 / F-1-3 | Kept the sticky demo controls and pre-checked sample summary. The hero opens `/demo?demo=1` in one click. | `@claim:demo-first-viewport`; mobile screenshot |
| F-1-4 | CSV and receipt downloads are read and checked for header, rows, hash, repeat, balance gap, difference, and method. | `@claim:csv-export`, `@claim:receipt-export` |
| F-1-5 / F-2-4 | Added a recorded checkout-contract fixture for product, one-time USD 1200 price, merchant, refund terms, and checkout path. | `@claim:proof-kit-price`; Sociobot checkout 303 → Dodo |
| F-1-6 / F-2-5 | Erase test writes a non-sample CSV and reads IndexedDB to prove `current` is absent before demo reseeding. | `@claim:erase-draft` |
| F-1-7 / F-2-6 | Split self-hosted assets from no-tracking. No-tracking uses a request allowlist and scans built HTML/JS for telemetry markers. | `@claim:self-hosted-assets`, `@claim:no-analytics` |
| F-1-8 / F-1-9 / F-1-10 | Retained route metadata, real legal/404 pages, common shell, focus handling, 44px targets, and original social art. | route/touch regressions; local verify report |
| F-1-11 / F-1-12 / F-1-13 / F-2-9 / F-2-10 | Kept bank CSV/repeat/balance-gap terms; changed Match labels, purchase wording, Proof Kit status, demo wording, and README route explanation. | `.factory/copy-audit.md`; `@claim:first-read-demo` |
| F-1-14 | Update control remains “Install update.” | `@regression:sw-update` |
| F-2-1 | Proof Kit stores a full receipt payload and filename. Every archive row can download its saved receipt after reload. | `@claim:receipt-index` |
| F-2-3 | Receipt-index test asserts a new named row, `-$30.00` summary, IndexedDB payload, reload persistence, and download. | `@claim:receipt-index` |
| F-2-7 | Dummy-token verification asserts only the documented Sociobot URL and no body/data payload. | `@claim:license-verification-network` |
| F-2-8 | Forced Playwright to one worker, eliminating cross-project Chromium contention. | clean-clone full suite: 58 checks passed |
| F-2-11 | Replaced the 404 h1 with “We could not find that page.” | route regression; `/404/` check |

## Screens and URL checks

- Local cold demo: `http://127.0.0.1:4173/demo?demo=1` passed title, language, one h1, main, alt, controls, and console/page-error checks in `.factory/evidence/polish-2-verify/verify.json`.
- Desktop screenshot: `.factory/evidence/polish-2-demo-desktop.png`.
- Mobile 390px screenshot: `.factory/evidence/polish-2-demo-mobile.png`.
- Live URL recheck is recorded in the handoff after the pushed static deployment is available.
