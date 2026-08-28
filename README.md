# Ledger Import Check

Check bank CSVs before importing. It is for households and freelancers who want to find repeats and balance gaps locally.

The demo includes a checked March 2026 bank CSV. It shows one repeat, one balance gap, and a $30.00 difference. It is not budgeting software, financial advice, or a bank connection.

Live: <https://offline-ledger-import.sociobot.in>

## Try the sample

Open [the demo](https://offline-ledger-import.sociobot.in/demo). The demo opens with its sample already checked. Sample work stays separate from your saved workspace. Reset demo restores the sample. Start for real opens your saved workspace.

## Your data and Proof Kit

Your bank CSV stays in this browser during normal checks. The draft survives refresh and can be exported or restored as JSON. Download a backup before clearing browser data.

Cleaned CSV and receipt exports are free. Proof Kit is a one-time $12 license for a local receipt index. See [privacy](https://offline-ledger-import.sociobot.in/privacy/) and [terms](https://offline-ledger-import.sociobot.in/terms/).

The built app adds no analytics or external font/CDN requests. It serves its own app files.

## Develop and verify

Requires a current Node.js release.

```sh
npm ci
npm run dev
npm test
npm run build
npm run test:e2e
```

The full claim contract is in [`.factory/claims.json`](.factory/claims.json). Workflow claim tests use `/demo`; landing and legal-copy tests use their published routes. Playwright is pinned to 1.58.2.

Deploy `dist/` at the domain root. The factory registers the paid product separately.

## Structure

- `src/csv.ts` — parsing, normalization, and column suggestions
- `src/reconcile.ts` — repeat and balance-gap checks
- `src/storage.ts` — local draft and receipt storage
- `src/license.ts` — one-time Sociobot license storage and verification
- `public/sw-template.js` — versioned offline app shell

MIT licensed. See `LICENSE`.
