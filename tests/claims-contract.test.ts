import { readFile } from 'node:fs/promises';
import { expect, test } from 'vitest';

test('every registered product claim has exactly one tagged browser test', async () => {
  const claims = JSON.parse(await readFile('.factory/claims.json', 'utf8')) as Array<{ id: string; test: string }>;
  const browserTests = await readFile('tests/e2e/app.spec.ts', 'utf8');
  const ids = claims.map((claim) => claim.id);

  expect(new Set(ids).size).toBe(ids.length);
  for (const claim of claims) {
    expect(claim.test).toBe(`npm run test:e2e -- --grep @claim:${claim.id}`);
    expect(browserTests.match(new RegExp(`@claim:${claim.id}(?![a-z0-9-])`, 'g')) ?? []).toHaveLength(1);
  }
});
