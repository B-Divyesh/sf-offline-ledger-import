# Ledger Import Check

Ledger Import Check is a local-first checkpoint for bank CSV imports. It helps privacy-sensitive households and freelancers map unfamiliar exports, flag exact and nearby repeat transactions, reconcile opening and closing balances, locate running-balance jumps, and export a clean neutral CSV plus a plain-text evidence receipt.

It is not a budgeting app, bank connection, audit, tax calculator, or financial adviser. Statement contents never leave the browser.

Live: <https://offline-ledger-import.sociobot.in>

## Supported statement shapes

- Comma, semicolon, or tab-separated text with a header row
- ISO, month/day/year, or day/month/year dates (ambiguous dates are explicit in mapping)
- One signed amount column, or separate debit and credit columns
- Optional running balance; without it the end balance is checked, but a missing row cannot be located
- Currency symbols, thousands separators, decimal commas, and accounting parentheses

Exact-repeat fingerprints combine the normalized date, description, and amount. A possible repeat is the same normalized description and amount within three days. Exact repeats start excluded but remain visible and can be restored. Every decision immediately recalculates the balance.

## Local data and paid unlock

The active draft is stored in IndexedDB and can be exported/restored as JSON. Cleaned CSV and reconciliation receipt exports are always free. The optional $12 one-time Proof Kit license adds a local index of up to 50 receipt snapshots; it uses only the Sociobot hosted checkout and license-verification API. Clearing site data removes the draft, receipt index, and saved license token, so downloaded backups are the durable copy.

See [privacy](https://offline-ledger-import.sociobot.in/privacy/) and [terms](https://offline-ledger-import.sociobot.in/terms/).

## Develop and verify

Requires a current Node.js release.

```sh
npm ci
npm run dev
npm test
npm run build       # exact deployment build; outputs dist/index.html
npm run test:e2e    # production browser, mobile, axe, and offline checks
```

Playwright is pinned to 1.58.2. In a fresh environment, install Chromium with `npx playwright install chromium` if it is not already available.

The Vite build is a static site. Deploy the contents of `dist/` at the domain root. No runtime server, environment variable, product ID, analytics script, or external font/CDN is required. The factory registers and activates the paid product separately.

## Structure

- `src/csv.ts` — format detection, parsing, normalization, mapping suggestions
- `src/reconcile.ts` — repeat fingerprints and running/end-balance checks
- `src/storage.ts` — IndexedDB draft and receipt index
- `src/license.ts` — one-time Sociobot license capture and daily verification
- `public/sw-template.js` — versioned local app shell and offline routing
- `.factory/design.md` — cassette-zine visual system and artwork provenance

MIT licensed. See `LICENSE`.
