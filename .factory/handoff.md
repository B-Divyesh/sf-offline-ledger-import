# Ledger Import Check — repair handoff

Work order: `offline-ledger-import-repair-2`

Verifier report base: `60f27df19a292dd5902b912958a97774885d220b`

Failed candidate: `3594075df9435a8c0a3c3f751e1dca7140357fa7`

Repair code: `44bbb00903d4268dee3ba3c614559bf30d115d28`

Deploy class: static PWA; publish `dist/`

## Release-blocking repairs

- The service-worker manifest now excludes `staticwebapp.config.json`. Azure consumes that deployment file and returns 404 for its public URL, so precaching it previously rejected the whole install. Vite preview now mirrors the production 404. A fresh production browser installs one worker and reloads `/demo` offline.
- Service-worker registration failures are no longer swallowed. The app shows: “Offline setup did not finish. Reload this page while online to try again.”
- Excluded result rows no longer lower all child text through parent opacity. The warning and excluded-row text now retain compliant contrast in the actual checked-result state.
- `.factory/claims.json` now registers the advertised comma, tab, and semicolon imports and JSON draft export/restore. Both claims have observable `/demo` browser tests. A contract test enforces one unique browser test tag for every registered claim.

Exact regressions:

- `@regression:sw-deploy-precache` checks the deployment file exclusion.
- `@regression:sw-deployed-host` serves that file as 404 and proves the worker still installs.
- `@regression:sw-registration-error` forces registration rejection and checks the recovery message.
- `@regression:result-contrast` runs axe after the sample result renders on desktop and 390px mobile.
- `@claim:delimited-import` imports and reconciles comma, tab, and semicolon fixtures.
- `@claim:json-draft-backup` downloads the sample draft, replaces it, and restores the downloaded JSON.

## Local verification

Run from a clean clone:

```sh
npm ci
npm test
npx tsc --noEmit
npm run build
npm run test:e2e
```

Observed on 2026-08-28:

- `npm ci`: 63 packages installed; 0 vulnerabilities.
- `npm test`: 12/12 passed across five files.
- Type check: passed with strict TypeScript. There is no separate lint target.
- Production build: passed with `dist/index.html`; initial JS 25.25 KB (9.86 KB gzip), CSS 17.59 KB (4.78 KB gzip).
- Browser suite: 41 passed and 3 intentional project skips across desktop Chromium and 390×844 mobile.
- All 14 exact commands in `.factory/claims.json` passed independently on both browser projects.
- Local host emulation returned 404 for `staticwebapp.config.json`; the worker installed and offline tests passed.
- `/opt/fleet/lib/verify-url.sh`: title and `lang=en` present, one h1, main landmark, no missing alt text, no unlabeled buttons, and no console/page errors.
- Lighthouse 13.4.1: Performance 99, Accessibility 100, Best Practices 100, SEO 100; FCP 1.4s, LCP 1.5s, CLS 0.076, TBT 0ms.
- Package/consumer verification is not applicable to this static PWA.

## Deployment and live evidence

The final build was deployed with:

```sh
/opt/fleet/lib/deploy-static.sh offline-ledger-import dist
```

Final Azure deployment ID: `d4640a85-4ad9-487b-90cd-0df2eaa9fbdf` in Central US.

Live URL: `https://offline-ledger-import.sociobot.in`

- Fresh live Chromium: one service-worker registration; `/staticwebapp.config.json` returned `404 text/html`; `/demo` reloaded offline and restored the sample.
- Live update test: an open client on cache `ledger-check-v47bf8e56e379` detected the final build, showed “A fresh version is ready,” activated it through **Update now**, reloaded under service-worker control, and retained only `ledger-check-v10d2384c2fd8`.
- Checked-result axe scans: zero serious/critical violations on desktop and 390px mobile.
- Mobile: 0px horizontal overflow; reduced-motion scroll behavior `auto`; transition duration `0.01ms`.
- Keyboard: Enter ran the balance check; the skip link moved focus to `main`.
- Privacy: the complete sample/check flow produced no cross-origin requests and no console/page errors.
- Routes: `/`, `/demo`, `/privacy/`, `/terms/`, manifest, and worker returned 200; `/missing-route` returned the designed HTTP 404. Manifest MIME is `application/manifest+json`.
- Response policy: HSTS, CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy` are live. Hashed assets are immutable for one year; the app shell and worker are no-cache. The invalid-license endpoint returned `200`, `cache-control: no-store`, and `{ "valid": false, "reason": "invalid" }`; checkout returned its expected 303 redirect.
- `/opt/fleet/lib/verify-url.sh`: 200, correct title/lang/h1/main/alt/button labels, and no console/page errors.
- Live Lighthouse 13.4.1: Performance 98, Accessibility 100, Best Practices 100, SEO 100; FCP 1.2s, LCP 1.3s, CLS 0.075, TBT 100ms.
- Final local/live SHA-256 identities match exactly:
  - `index.html`: `14532ea18b8fdb0c84dd7a09bfe88644d9dca297721b1fca2bfde6e5e8a60940`
  - `sw.js`: `31b22c4409674694029b9c8e1a5aec5cb5c4dfd72b03032281753ecdea3f7164`
  - `assets/main-BYuIw0__.js`: `4483f37bb83ef289dbae3bc04d8948726acff1e357d6ed9bbe736ace5928f23f`
  - `assets/styles-DBu6jKdB.css`: `d482c98a960c6ce70f9c973d0136bc1f5d987a3160f1f501050dc99b8fefb108`

## Known product limits

- Without a running-balance column, the tool can show the end difference but cannot locate the first omitted row.
- Ambiguous numeric dates require the user to choose the intended order.
- Browser storage is not a durable backup or extra app-level encryption; export the draft or receipt and use device protection.
- A real paid purchase was not made. The live checkout redirect and invalid-license response were verified; core checks and exports remain free.

No release-blocking gaps remain from the independent verifier report.
