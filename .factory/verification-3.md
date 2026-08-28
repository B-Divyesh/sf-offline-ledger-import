# Independent verification 3 — PASS

Verified 2026-08-28 against candidate commit
`e9b9241f56c443e587ee24b62c6706ffd114bd70` and the live deployment
`https://offline-ledger-import.sociobot.in`.

## Release decision

**PASS — release candidate accepted.** This is a static PWA; no product code
was changed during this verification. The live HTML and the two executable
assets are byte-identical to a fresh production build of the candidate:

| artifact | SHA-256 |
| --- | --- |
| `index.html` | `14532ea18b8fdb0c84dd7a09bfe88644d9dca297721b1fca2bfde6e5e8a60940` |
| `assets/main-BYuIw0__.js` | `4483f37bb83ef289dbae3bc04d8948726acff1e357d6ed9bbe736ace5928f23f` |
| `assets/styles-DBu6jKdB.css` | `d482c98a960c6ce70f9c973d0136bc1f5d987a3160f1f501050dc99b8fefb108` |

The previous deployment-only service-worker failure is not present: a fresh
live context registered one worker, then an untouched `/demo` reloaded while
offline with the demo banner, example statement, and offline notice visible.

## Mandatory claims gate

After `npm ci` from this clean candidate, every command declared in
`.factory/claims.json` was run independently through the `/demo` production
browser entry point. All passed on desktop Chromium and 390×844 mobile:

`demo-isolation`, `first-read-demo`, `offline-reload`, `local-processing`,
`no-sign-in`, `duplicate-detection`, `balance-check`, `csv-export`,
`receipt-export`, `draft-recovery`, `delimited-import`, `json-draft-backup`,
`receipt-index`, and `proof-kit-price`.

The complete browser suite subsequently completed with 44 passing checks
(desktop and mobile projects; its three intended project-specific skips). The
contract covers observable demo isolation, exact repeats, the -$30.00 balance
gap, clean CSV and receipt downloads, offline reload, local-only normal flow,
no sign-in, comma/tab/semicolon imports, JSON backup restore, and the paid
receipt index/price.

## First read and demo

**PASS.** A cold live page answers all three required questions in plain words:

- It does: “Check bank CSVs before importing.”
- It is for: “households and freelancers” who need repeats and balance gaps.
- First action: visible one-click **Try it with sample data**, explicitly
  described as loading a sample statement in a separate demo.

The live demo immediately presents the persistent “Demo — sample data, nothing
is saved” banner with Reset demo and Start for real. The demo-isolation claim
also proved that it uses `demo:ledger-import-check`, separate from real browser
storage.

## Local and functional verification

- `npm ci`: completed; audit reported 0 vulnerabilities.
- `npm test`: 12/12 tests passed.
- `npx tsc --noEmit`: passed. No separate lint script exists.
- `npm run build`: passed and produced `dist/`.
- `npm run test:e2e`: passed as above.
- Built initial JavaScript is 25.25 KB / 9.86 KB gzip; CSS is 17.59 KB / 4.78
  KB gzip. Both are well below the static-PWA budgets. The largest responsive
  hero image is 86.9 KB; self-hosted WOFF2 fonts total about 73 KB.
- Live normal case: the sample marks the exact repeat, identifies one running
  balance jump, reports `-$30.00`, and exports both evidence files.
- Boundary/recovery: a one-row $0.00 statement reconciled cleanly. Empty CSV,
  unclosed quoted field, invalid currency code, and absent date mapping each
  produced a specific recovery message; a subsequent valid input completed
  without console or page errors.

## Accessibility, PWA, privacy, and deployment checks

- `/opt/fleet/lib/verify-url.sh` passed: HTTPS 200, title, `lang=en`, one h1,
  main landmark, no missing image alt text or unlabeled buttons, and no
  console/page errors.
- Fresh live Playwright axe scans found **zero serious/critical violations**
  on both the landing page and the fully rendered problem-result state.
- Keyboard: first Tab exposes the skip link with a visible 3px focus outline;
  Enter moves focus to `MAIN#main`. Buttons are operable by keyboard.
- At 390px the rendered demo has 0px page-level horizontal overflow; primary
  action height is 52px. With reduced motion, transition and animation
  durations compute to `0.01ms`.
- PWA: manifest has standalone display, versioned start URL, 192/512/maskable
  icons, and matching theme colors. The versioned worker precaches the shell;
  source plus the `@regression:sw-update` test verify waiting-worker update
  notification and the user-triggered `SKIP_WAITING` path. No newer deployment
  was available during this fresh test to create a second live worker.
- A fresh live demo was service-worker controlled, then reloaded offline with
  the seeded sample intact and no errors.
- Normal landing/demo/check/export traffic was same-origin only. The optional
  paid path is limited by CSP to the documented Sociobot billing API; there is
  no sign-in UI, analytics, external CDN, server upload, or other account
  provider.
- The 80-request burst to
  `GET /api/v1/products/offline-ledger-import/verify?license=qa-invalid-verification-token`
  at `api.sociobot.in` returned 29×200 and 51×429. Every 429 included
  `Retry-After: 1`; throttling began at approximately 30 requests in this
  burst.
- Live routes `/`, `/demo`, `/privacy/`, `/terms/`, manifest, worker, and
  offline fallback return 200; an unknown route returns the styled HTTP 404.
  Page-specific titles, h1s, and main landmarks are present.
- Live headers include HSTS, CSP, `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: DENY`, Referrer-Policy, and Permissions-Policy. The app
  shell is no-cache and hashed JS is immutable for one year.
- Live Lighthouse: Performance 99, Accessibility 100, Best Practices 100,
  SEO 100; FCP/LCP 1.4s, CLS 0.075, TBT 0ms.

## Defects by severity

None found.

## Scope notes

This is not a library, CLI, or backend, so package-consumer, persistence
concurrency, health endpoint, and sign-in-tenant checks do not apply. No real
purchase was made; the free core workflow remains fully usable, and the
Sociobot verification endpoint plus rate limit were exercised only with an
invalid QA token.
