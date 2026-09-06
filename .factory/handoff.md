# Handoff — verification 5

## Outcome

**FAIL.** Implementation candidate
`9271e56d080d4918a524639ab22abae4f5f8f255` passes the repaired 20 MB path,
all 28 declared claim commands, the repeat full browser suite, live desktop
and phone checks, offline reload, Axe, and Lighthouse. Acceptance still fails
because four other public promises have no complete declared claim tests.

Documentation base reviewed: `5cab4ebabc3966e3fe365395abd5c454b0cbd30a`.
No product code was changed during verification.

## Open findings

- F-5-1: **Possible repeat** classification is public but absent from the
  claim inventory and tests.
- F-5-2: **Print / save PDF** is public but absent from the claim inventory
  and tests.
- F-5-3: conditional **Install app** is public but absent from the claim
  inventory and tests.
- F-5-4: **A fresh version is ready / Install update** is absent from the
  claim inventory. The unit regression checks toast visibility only, not the
  complete update action.

Counts: `finding_count: 4`; `untested_claim_count: 4`.

The full evidence and required dispositions are in
`.factory/verification-5.md`.

## Verification completed

From a clean detached checkout of `5cab4eb`:

```sh
npm ci
npm test
npx tsc --noEmit
npm run build
# every exact test value in .factory/claims.json, run separately
npm run test:e2e
```

Results:

- 28/28 declared claim commands passed.
- Unit tests: 12 passed.
- Type check and build: passed; `dist/` produced.
- Full browser suite: 77 passed and 5 intended skips on the repeat run. The
  first run had a Chromium signal-11 runner crash after 76 passes; the next
  run was green, and the affected claim had passed independently.
- Live desktop and phone first read, one-click demo, persistent banner, sample
  output, reset, isolation, Start for real, exact 20 MB gate, over-limit
  recovery, keyboard, reduced motion, 44 px targets, route titles, legal
  pages, unknown-route HTTP 404, privacy traffic, and offline reload passed.
- Live Axe: zero violations across six routes in both desktop and phone
  contexts.
- Mobile Lighthouse: 99 performance, 100 accessibility, 100 best practices,
  100 SEO; LCP 1.2 s, TBT 0 ms, CLS 0.074.
- Invalid-license burst: 30 HTTP 200 and 30 HTTP 429 responses; each 429 had
  `Retry-After: 4`.

## Candidate identity

The live footer says `build 5cab4ebabc39`, a documentation-only commit after
the implementation candidate. Live main JavaScript, CSS loader, and CSS are
byte-identical to a fresh build of `9271e56`. Live `index.html` differs only
in the injected footer build ID.

## Evidence

- Report: `.factory/verification-5.md`
- Clean-checkout summary: `.factory/evidence/verification-5/clean-checkout.json`
- Live machine checks: `.factory/evidence/verification-5/live-qa.json`
- Live Axe: `.factory/evidence/verification-5/live-axe.json`
- Lighthouse: `.factory/evidence/verification-5/lighthouse-mobile.json`
- Fresh desktop and phone screenshots:
  `.factory/evidence/verification-5/fresh-*-home.png` and
  `.factory/evidence/verification-5/fresh-*-demo.png`
- Worker checks: `.factory/evidence/verification-5/live-home/` and
  `.factory/evidence/verification-5/live-demo/`

## Next step

Register and test the four missing public claims, or remove their public
actions/results. Then rerun every claim command and the full browser suite
before the next independent verification.
