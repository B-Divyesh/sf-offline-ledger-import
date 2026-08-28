# Ledger Import Check — build handoff

Work order: `offline-ledger-import-build-1`

Completed: 2026-08-28

Deploy class: static PWA; publish `dist/`

## What shipped

- A complete local CSV workflow: drag/choose/sample, delimiter parsing, heading suggestions, signed or split amount mapping, explicit date order, statement metadata, opening/closing balances, and a three-row source preview.
- Chronological reconciliation with stable source IDs, exact fingerprints, nearby-repeat candidates, automatic exact-repeat exclusion, user-controlled inclusion, running-balance gap-start localization, and end-balance difference reporting.
- Reviewable responsive transaction evidence with issue filters, cleaned canonical CSV export, SHA-256-linked text receipt, print/PDF path, and JSON draft backup/restore.
- IndexedDB draft recovery across refresh/tab close, explicit erase confirmation, browser-storage disclosure, and offline operation.
- Installable PWA with 192/512/maskable icons, deterministic versioned precache, document fallback, cache-first assets, `clientsClaim`, message-driven `skipWaiting`, and an update-available toast.
- Optional $12 one-time Proof Kit license via the Sociobot checkout/verify contract. Core checking and all exports stay free; the unlock adds a local index of up to 50 receipt snapshots. Returned and pasted licenses are stored under `sb_license:offline-ledger-import`, verified at most daily, and reconciled quietly after offline first paint.
- Cassette-era zine identity, self-hosted Atkinson Hyperlegible/Courier Prime, original generated hero in AVIF/WebP/JPEG, responsive/mobile and print treatments, reduced-motion fallback, privacy/terms pages, and complete project documentation.

## Verification

Run from a clean clone:

```sh
npm ci
npm test
npx tsc --noEmit
npm run build
npm run test:e2e
```

Observed locally:

- `npm test`: 8/8 unit tests passed, including a seeded 12-month corpus with 100% detection of its injected exact duplicate and missing transaction.
- `npx tsc --noEmit`: passed with strict TypeScript.
- `npm run build`: passed; `dist/index.html` present. Main JS 24.49 KB / 9.59 KB gzip; CSS 17.03 KB / 4.69 KB gzip; runtime WOFF2 fonts 72.97 KB; largest hero 66 KB WebP and 37 KB AVIF.
- `npm run test:e2e`: 6 passed, 2 intentionally device-inapplicable cases skipped. Covered desktop/mobile example completion, CSV and receipt downloads, no console errors, axe serious/critical scan, 390 px page overflow, and a real offline reload through the service worker.
- `npm audit`: 0 vulnerabilities, including development dependencies.
- Lighthouse 12.8.2, local production build, mobile defaults: Performance 99, Accessibility 100, Best Practices 100, SEO 100; FCP 1.4 s, LCP 1.5 s, CLS 0.069, TBT 0 ms.
- Visual inspection completed at 1440×1000 and 390×844. Focus rings, target sizes, single `<h1>`, landmarks, alt text, contrast, empty/error/offline states, and reduced-motion rules are present.

## Known limits

- Without a bank-provided running-balance column, the tool can prove an end difference but cannot identify the row where an omission began; the UI and receipt say this directly.
- Ambiguous numeric dates default to month/day/year. Users must select day/month/year when applicable.
- Browser storage is not a durable backup and is not additionally encrypted by the app; exported backups and device-level encryption are the recovery/security path.
- Live purchase completion was not exercised because product registration happens later in the factory. The production Sociobot checkout and verification routes are wired without a hard-coded product ID beyond the required slug.
- This is consistency evidence, not an audit and not financial, accounting, or tax advice.

## Factory next steps

1. Register the one-time product/price and return URL in the Sociobot billing system.
2. Deploy `dist/` at `https://offline-ledger-import.sociobot.in` with immutable caching for hashed assets and no-cache/revalidation for HTML, `sw.js`, and the manifest.
3. Smoke-test hosted checkout return, CORS verification, install prompt, and offline reload on an Android device.
