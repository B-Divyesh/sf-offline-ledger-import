# Ledger Import Check — repair handoff

Work order: `offline-ledger-import-repair-1`

Repair base: verifier report commit `572c3e14f6350f946e305dc9d03bd628d78e36da`
Deploy class: static PWA; publish `dist/`

## Release-blocking repairs

- Added the required claims contract in `.factory/claims.json`. Every visitor-facing operational claim has one tagged Playwright test against `/demo`; `.factory/demo.md` documents the sample, reset path, and storage boundary.
- Added a real static `/demo` entry point. It automatically loads the six-row March 2026 sample and keeps all draft and receipt work in the independent IndexedDB database `demo:ledger-import-check`. Normal work remains in `ledger-import-check`; the demo never reads or writes that database. The persistent demo banner has **Reset demo** and **Start for real**.
- Rewrote the first screen in plain language: **Check bank CSVs before importing**, names households and freelancers, and puts **Try it with sample data** beside an explanation of what happens next.
- Fixed the update notification by retaining the installing worker reference across its transition to `waiting`; the unit regression reproduces the browser transition that previously hid the update toast.
- Added static-host policy in `staticwebapp.config.json`: CSP, frame/permission/referrer/content-type protections, immutable hashed assets, no-cache app shell/service worker/manifest, manifest MIME type, and a status-404 rewrite to the designed `/404/index.html`. The build copies the configuration into `dist/`.
- Added canonical, Open Graph, and Twitter metadata; `/demo` to the sitemap; a designed 404 page; keyboard-focus transfer for the skip link; and explicit labels for controls that are initially hidden.

## Verification

Run from a clean clone:

```sh
npm ci
npm test
npx tsc --noEmit
npm run build
npm run test:e2e
```

Observed for this repair:

- `npm ci`: completed; `npm audit` reported 0 vulnerabilities.
- `npm test`: 10/10 passed, including the service-worker waiting-state regression and static-host policy regression.
- `npx tsc --noEmit`: passed with strict TypeScript.
- `npm run build`: passed; `dist/index.html`, `dist/demo/index.html`, `dist/404/index.html`, and `dist/staticwebapp.config.json` exist. Initial JS is 25.25 KB (9.85 KB gzip); CSS is 17.57 KB (4.78 KB gzip).
- `npm run test:e2e`: 34/34 passed across desktop Chromium and 390×844 mobile. It covers the complete sample workflow, exact repeat, balance jump/difference, downloads, draft recovery, IndexedDB isolation, privacy request interception, no sign-in, cached Proof Kit receipt index, keyboard skip link, axe serious/critical scan, no horizontal overflow, and offline reload after service-worker control.
- Every entry in `.factory/claims.json` is exercised by its stated `@claim:` test. The privacy claim intercepts the complete demo and export flow and permits only the product origin.
- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173/ …`: 200; title present; `lang=en`; one h1; main landmark; 0 images missing alt; 0 unlabeled buttons; 0 console/page errors.
- Lighthouse 12.8.2 on the local production build: Performance 100, Accessibility 100, Best Practices 100, SEO 100.

## Known product limits

- Without a bank running-balance column, the tool can show the end difference but cannot locate the first omitted row.
- Ambiguous numeric dates require the user to choose the intended order.
- Browser storage is not a durable backup or extra app-level encryption; export the draft/receipt and use device protection.
- The paid checkout is wired to Sociobot/Dodo. A factory-registered live purchase is outside this local repair; core checks and exports remain free.

## Deployment

Deployed `dist/` from code commit `289e100` on 2026-08-28 with
`/opt/fleet/lib/deploy-static.sh offline-ledger-import dist` to the existing
Azure Static Web App in Central US. The production URL is
`https://offline-ledger-import.sociobot.in`.

Live evidence:

- `/opt/fleet/lib/verify-url.sh` returned 200 with the expected title, `lang=en`, one h1, main landmark, zero missing image alts, zero unlabeled buttons, and zero console/page errors.
- The deployed index SHA-256 is `c5bdd812b72a099b42ec39103e21d2a6bf1d640451667af5f218dbd872ee354d`, exactly matching `dist/index.html`. The deployed main asset is `assets/main-D1schYy7.js`.
- Live headers: hashed JS is `public, max-age=31536000, immutable`; `sw.js` is `no-cache, no-store, must-revalidate`; `/demo` and the manifest are `no-cache`; the manifest MIME is `application/manifest+json`; CSP, `X-Frame-Options: DENY`, `Permissions-Policy`, and `X-Content-Type-Options` are present.
- `/missing-route` returns HTTP 404 with the designed 404 document.
- Live 390×844 browser smoke: demo banner visible, sample finds the exact repeat, horizontal overflow is 0 px, and no console errors occurred.

---

## Independent verifier addendum — FAIL (2026-08-28)

**Final release decision: FAIL — do not release candidate
`3594075df9435a8c0a3c3f751e1dca7140357fa7`.** This addendum supersedes the
earlier builder handoff decision.

The live HTML, JS, and CSS exactly match this candidate, but a fresh deployed
browser cannot install the service worker: `/sw.js` precaches
`/staticwebapp.config.json`, while the live host returns 404 for that file.
The failed `cache.addAll` is swallowed by the app, leaving zero registrations;
offline reload then fails with `net::ERR_INTERNET_DISCONNECTED`. This makes the
visible “Works offline after the first visit” claim false in production and
also blocks live service-worker update verification.

The live demo result screen also has axe **serious** color-contrast failures:
excluded-row text is 3.83:1 and warning text 4.31:1, below the required 4.5:1.
Additionally, functional visitor claims for supported delimiters and JSON
draft export/restore are not yet represented in `.factory/claims.json`.

Everything else verified locally and in the normal live flow is recorded in
`.factory/verification-2.md`: clean install; 10 unit tests; type check;
production build; all 12 exact listed claim commands; complete Playwright
suite; normal/boundary imports and exports; mobile/keyboard/reduced-motion;
headers, caching, rate limiting, and Lighthouse. Re-run the remediation steps
and the live PWA and result-state accessibility checks before requesting a new
verification.
