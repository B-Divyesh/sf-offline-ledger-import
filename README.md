# Ledger Import Check

Check bank CSVs before importing. Ledger Import Check is for privacy-sensitive households and freelancers. The sample demo shows an exact repeated transaction, a running-balance jump, a closing-balance difference, and the cleaned CSV and receipt exports.

It is not a budgeting app, bank connection, audit, tax calculator, or financial adviser. Statement data stays in the browser during the normal checking flow.

Live: <https://offline-ledger-import.sociobot.in>

## Try the isolated sample

Open [the demo](https://offline-ledger-import.sociobot.in/demo). It starts with a realistic six-row March 2026 statement, has a persistent demo banner, and keeps its draft in `demo:ledger-import-check`, separate from your own `ledger-import-check` browser data. **Reset demo** reloads the sample. **Start for real** returns to a clean normal workspace.

## Local data and paid unlock

The active draft is stored in IndexedDB and can be exported/restored as JSON. Cleaned CSV and reconciliation receipt exports are always free. The optional $12 one-time Proof Kit license adds a local receipt index; it uses only the Sociobot hosted checkout and license-verification API. Clearing site data removes the draft, receipt index, and saved license token, so downloaded backups are the durable copy.

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

The full claim contract is in [`.factory/claims.json`](.factory/claims.json). Each claim command runs from the `/demo` sandbox.

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
