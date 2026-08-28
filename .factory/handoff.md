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

Production deployment and live verification are recorded after the final deploy commit. The static configuration is included in the deploy root and is required for the security, cache, manifest, and 404 behavior above.
