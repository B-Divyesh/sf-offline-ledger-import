import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';

async function openDemoAndCheck(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/demo');
  await expect(page.getByLabel('Demo controls')).toBeVisible();
  await page.getByRole('button', { name: /Run balance check/ }).click();
  await expect(page.getByText('The balances do not agree yet.')).toBeVisible();
}

test('demo uses only its demo: IndexedDB namespace and never restores a real draft @claim:demo-isolation', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    const request = indexedDB.open('ledger-import-check', 1);
    await new Promise<void>((resolve, reject) => {
      request.onupgradeneeded = () => request.result.createObjectStore('local-data');
      request.onsuccess = () => { request.result.transaction('local-data', 'readwrite').objectStore('local-data').put({ version: 1, filename: 'real.csv', csvText: 'Date,Description,Amount\\n01/01/2026,Real,1', statementName: 'Real data', currency: 'USD', opening: '0', closing: '1', mapping: { date: 0, description: 1, amountMode: 'signed', amount: 2, debit: -1, credit: -1, balance: -1, dateFormat: 'mdy' }, includedOverrides: {}, savedAt: new Date().toISOString() }, 'current'); request.result.close(); resolve(); };
      request.onerror = () => reject(request.error);
    });
  });
  await page.goto('/demo');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.getByText('example-march-2026.csv')).toBeVisible();
  await expect(page.getByText('real.csv')).toHaveCount(0);
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.getByText('Sample reset.')).toBeVisible();
  const names = await page.evaluate(async () => (await indexedDB.databases()).map((database) => database.name));
  expect(names).toContain('ledger-import-check');
  expect(names).toContain('demo:ledger-import-check');
  await page.getByRole('link', { name: 'Start for real' }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto('/demo');
  await expect(page.getByText('restored from this browser')).toHaveCount(0);
});

test('sample detects the exact repeated transaction @claim:duplicate-detection', async ({ page }) => {
  await openDemoAndCheck(page);
  await expect(page.getByText('Exact repeat')).toBeVisible();
});

test('sample reports the supplied closing-balance difference and running-balance jump @claim:balance-check', async ({ page }) => {
  await openDemoAndCheck(page);
  await expect(page.getByText('1 balance jump located.')).toBeVisible();
  await expect(page.getByText('-$30.00', { exact: true }).first()).toBeVisible();
});

test('sample exports a cleaned CSV @claim:csv-export', async ({ page }) => {
  await openDemoAndCheck(page);
  const csvDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export cleaned CSV' }).click();
  const download = await csvDownload;
  expect(download.suggestedFilename()).toMatch(/clean\.csv$/);
  expect(await download.createReadStream()).toBeTruthy();
});

test('sample exports a reconciliation receipt @claim:receipt-export', async ({ page }) => {
  await openDemoAndCheck(page);
  const receiptDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download receipt' }).click();
  const download = await receiptDownload;
  expect(download.suggestedFilename()).toMatch(/receipt\.txt$/);
  expect(await download.createReadStream()).toBeTruthy();
});

test('demo draft recovers after a refresh from its isolated store @claim:draft-recovery', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.getByText('example-march-2026.csv')).toBeVisible();
  await page.reload();
  await expect(page.getByText('example-march-2026.csv')).toBeVisible();
  await expect(page.getByText('restored from this browser')).toBeVisible();
});

test('imports comma, tab, and semicolon statements through the demo @claim:delimited-import', async ({ page }) => {
  await page.goto('/demo');
  const fixtures = [
    { name: 'comma.csv', delimiter: ',', text: 'Date,Description,Amount\n2026-03-01,Invoice,10.00' },
    { name: 'tab.tsv', delimiter: 'tab', text: 'Date\tDescription\tAmount\n2026-03-01\tInvoice\t10.00' },
    { name: 'semicolon.csv', delimiter: ';', text: 'Date;Description;Amount\n2026-03-01;Invoice;10.00' }
  ];

  for (const fixture of fixtures) {
    await page.locator('#csv-file').setInputFiles({
      name: fixture.name,
      mimeType: 'text/csv',
      buffer: Buffer.from(fixture.text)
    });
    await expect(page.locator('#file-status')).toContainText(fixture.name);
    await expect(page.locator('#file-status')).toContainText(`1 rows · 3 columns · delimiter ${fixture.delimiter}`);
    await page.getByLabel('Opening balance').fill('0');
    await page.getByLabel('Closing balance').fill('10');
    await page.getByRole('button', { name: /Run balance check/ }).click();
    await expect(page.getByText('Balances agree. This track plays clean.')).toBeVisible();
  }
});

test('exports and restores the active draft as JSON @claim:json-draft-backup', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.getByText('example-march-2026.csv')).toBeVisible();

  const backupDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download draft backup' }).click();
  const download = await backupDownload;
  expect(download.suggestedFilename()).toBe('example-march-2026-draft.json');
  const backupPath = await download.path();
  expect(backupPath).not.toBeNull();
  const backup = JSON.parse(await readFile(backupPath as string, 'utf8')) as { version: number; filename: string; csvText: string };
  expect(backup).toMatchObject({ version: 1, filename: 'example-march-2026.csv' });
  expect(backup.csvText).toContain('Client invoice');

  await page.locator('#csv-file').setInputFiles({
    name: 'replacement.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('Date,Description,Amount\n2026-04-01,Replacement,2.00')
  });
  await expect(page.locator('#file-status')).toContainText('replacement.csv');
  await page.locator('#backup-file').setInputFiles(backupPath as string);
  await expect(page.locator('#file-status')).toContainText('example-march-2026.csv');
  await expect(page.getByLabel('Opening balance')).toHaveValue('1200.00');
  await expect(page.getByText('The balances do not agree yet.')).toBeVisible();
});

test('demo processing makes no request outside the product origin @claim:local-processing', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await openDemoAndCheck(page);
  const csvDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export cleaned CSV' }).click();
  await csvDownload;
  for (const url of requests) expect(new URL(url).origin).toBe('http://127.0.0.1:4173');
});

test('demo has no sign-in field or account request @claim:no-sign-in', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/demo');
  await expect(page.locator('input[type="password"], input[type="email"]')).toHaveCount(0);
  expect(requests.every((url) => new URL(url).origin === 'http://127.0.0.1:4173')).toBe(true);
});

test('a cached Proof Kit license can save a local receipt index entry @claim:receipt-index', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('sb_license:offline-ledger-import', 'demo-license');
    localStorage.setItem('sb_license:offline-ledger-import:verdict', JSON.stringify({ valid: true, checkedAt: Date.now(), reason: 'ok' }));
  });
  await openDemoAndCheck(page);
  await expect(page.getByRole('button', { name: 'Save to Proof Kit' })).toBeVisible();
  await page.getByRole('button', { name: 'Save to Proof Kit' }).click();
  await expect(page.getByText('Receipt snapshot saved locally.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Local receipt index' })).toBeVisible();
});

test('Proof Kit states its one-time price and Sociobot checkout address @claim:proof-kit-price', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.getByText('$12 once')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Buy Proof Kit' })).toHaveAttribute('href', 'https://api.sociobot.in/api/v1/products/offline-ledger-import/checkout');
});

test('example completes the workflow and exports both evidence files', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await page.goto('/demo');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Tell us which column is which' })).toBeVisible();
  await page.getByRole('button', { name: /Run balance check/ }).click();
  await expect(page.getByText('The balances do not agree yet.')).toBeVisible();
  await expect(page.getByText('1 balance jump located.')).toBeVisible();
  await expect(page.getByText('Exact repeat')).toBeVisible();

  const csvDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export cleaned CSV' }).click();
  expect((await csvDownload).suggestedFilename()).toMatch(/clean\.csv$/);
  const receiptDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download receipt' }).click();
  expect((await receiptDownload).suggestedFilename()).toMatch(/receipt\.txt$/);
  expect(consoleErrors).toEqual([]);
});

test('has no serious accessibility violations on the landing screen', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page: page as never }).analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
});

test('has no serious accessibility violations in the checked result @regression:result-contrast', async ({ page }) => {
  await openDemoAndCheck(page);
  const results = await new AxeBuilder({ page: page as never }).analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
});

test('fits a 390px viewport without page-level horizontal scrolling', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');
  await page.goto('/demo');
  await page.getByRole('button', { name: /Run balance check/ }).click();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('reopens the app shell while offline', async ({ page, context }) => {
  test.skip(test.info().project.name !== 'chromium');
  await page.goto('/demo');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: /Check bank CSVs/ })).toBeVisible();
  await expect(page.getByText(/Offline mode/)).toBeVisible();
});

test('service worker installs when deployment metadata is unavailable @regression:sw-deployed-host', async ({ page, request }) => {
  test.skip(test.info().project.name !== 'chromium');
  expect((await request.get('/staticwebapp.config.json')).status()).toBe(404);
  await page.goto('/demo');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  expect(await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length)).toBe(1);
});

test('shows a recovery message when offline setup fails @regression:sw-registration-error', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator.serviceWorker, 'register', {
      configurable: true,
      value: () => Promise.reject(new Error('simulated registration failure'))
    });
  });
  await page.goto('/demo');
  await expect(page.getByText('Offline setup did not finish. Reload this page while online to try again.')).toBeVisible();
});

test('the demo remains usable after its first visit while offline @claim:offline-reload', async ({ page, context }) => {
  await page.goto('/demo');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByLabel('Demo controls')).toBeVisible();
  await expect(page.getByText('example-march-2026.csv')).toBeVisible();
});

test('the landing first read has a one-click sample action and plain job statement @claim:first-read-demo', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Ledger Import Check — check bank CSVs privately');
  await expect(page.getByRole('heading', { level: 1, name: 'Check bank CSVs before importing' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Try it with sample data/ })).toHaveAttribute('href', '/demo');
  await expect(page.getByText('For households and freelancers: find repeats and balance gaps before importing.')).toBeVisible();
});

test('skip link moves keyboard focus to the main landmark @regression:skip-link', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Skip to ledger check' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
});
