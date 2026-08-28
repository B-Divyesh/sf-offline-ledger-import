# Polish 1 — review finding closure

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Namespaced demo license keys with `demo:` and blocked demo checkout/verification. Reset clears demo-only storage. | `@claim:demo-isolation`; `tests/e2e/app.spec.ts`; live `/demo` check after deploy. |
| F-1-2 | Made the demo controls sticky and raised every control to a 44px target. | `@claim:demo-first-viewport`; mobile screenshot captured after deploy. |
| F-1-3 | Added a compact, pre-checked demo summary with filename, sample rows, repeat, balance gap, and difference. | `@claim:demo-first-viewport`; live `/demo` at 390px. |
| F-1-4 | Download tests now read and assert CSV and receipt payloads, including rows, hash, counts, discrepancy, and method. | `@claim:csv-export`; `@claim:receipt-export`. |
| F-1-5 | Kept the one-time $12 offer and checkout contract; added merchant/refund terms and a claim test. Demo cannot purchase or verify. | `@claim:proof-kit-price`; live `/terms/`. |
| F-1-6 | Rewrote lifecycle copy around preserved work and added an erase-draft claim test. | `@claim:erase-draft`; `@claim:draft-recovery`. |
| F-1-7 | Replaced the compound deployment statement with a tested self-hosted/no-analytics request claim. | `@claim:self-hosted-assets`. |
| F-1-8 | Added route metadata, canonicals, OG/Twitter data, apple-touch icon, and a 1200×630 product-art social image. | route metadata browser test; live `/`, `/demo`, `/privacy/`, `/terms/`, and 404 checks. |
| F-1-9 | Standardized four-link headers, footer attribution/build id, external Source cue, and focused/announced legal/404 headings. | route shell/focus browser test; live route checks. |
| F-1-10 | Added 44px header, footer, and demo target sizing with a 390px regression test. | `@regression:touch-targets`. |
| F-1-11 | Standardized product wording on bank CSV, repeat, and balance gap. | `.factory/copy-audit.md`; landing copy review. |
| F-1-12 | Replaced metaphor headings and footer language with explicit jobs and outcomes. | `.factory/copy-audit.md`; live landing review. |
| F-1-13 | Rewrote README demo and storage copy into short plain-language sentences. | `.factory/copy-audit.md`; README review. |
| F-1-14 | Renamed the service-worker action to “Install update.” | source and full browser suite. |
