import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile, readdir } from 'node:fs/promises';

async function readStore(page: import('@playwright/test').Page, name: string, key: string): Promise<unknown> {
  return page.evaluate(async ({ name, key }) => {
    const request = indexedDB.open(name, 1);
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const value = await new Promise<unknown>((resolve, reject) => {
      const read = database.transaction('local-data').objectStore('local-data').get(key);
      read.onsuccess = () => resolve(read.result);
      read.onerror = () => reject(read.error);
    });
    database.close();
    return value;
  }, { name, key });
}

async function databaseNames(page: import('@playwright/test').Page): Promise<string[]> {
  return page.evaluate(async () => (await indexedDB.databases()).flatMap((database) => database.name ? [database.name] : []));
}

async function seedDraft(page: import('@playwright/test').Page, name: string, filename = 'real.csv'): Promise<void> {
  await page.evaluate(async ({ name, filename }) => {
    const request = indexedDB.open(name, 1);
    await new Promise<void>((resolve, reject) => {
      request.onupgradeneeded = () => request.result.createObjectStore('local-data');
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction('local-data', 'readwrite');
        transaction.objectStore('local-data').put({ version: 1, filename, csvText: 'Date,Description,Amount\n01/01/2026,Real,1', statementName: 'Real data', currency: 'USD', opening: '0', closing: '1', mapping: { date: 0, description: 1, amountMode: 'signed', amount: 2, debit: -1, credit: -1, balance: -1, dateFormat: 'mdy' }, includedOverrides: {}, savedAt: '2026-08-28T00:00:00.000Z' }, 'current');
        transaction.oncomplete = () => { database.close(); resolve(); };
        transaction.onerror = () => reject(transaction.error);
      };
      request.onerror = () => reject(request.error);
    });
  }, { name, filename });
}

async function openDemoAndCheck(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/demo');
  await expect(page.getByLabel('Demo controls')).toBeVisible();
  await page.getByRole('button', { name: /Run balance check/ }).click();
  await expect(page.getByText('The balances do not agree yet.')).toBeVisible();
}

test('demo keeps production IndexedDB and license keys byte-for-byte unchanged @claim:demo-isolation', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('sb_license:offline-ledger-import', 'REAL-LICENSE');
    localStorage.setItem('sb_license:offline-ledger-import:verdict', JSON.stringify({ valid: true, checkedAt: Date.now() }));
  });
  const before = await page.evaluate(() => ({ ...localStorage }));
  await seedDraft(page, 'ledger-import-check');
  const realDraft = await readStore(page, 'ledger-import-check', 'current');
  await page.goto('/demo?demo=1');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.getByText('example-march-2026.csv').first()).toBeVisible();
  await expect(page.getByText('real.csv')).toHaveCount(0);
  await page.evaluate(() => {
    localStorage.setItem('demo:sb_license:offline-ledger-import', 'DEMO-LICENSE');
    localStorage.setItem('demo:sb_license:offline-ledger-import:verdict', JSON.stringify({ valid: true, checkedAt: Date.now() }));
  });
  await page.reload();
  await expect(page.getByRole('button', { name: 'Save to Proof Kit' })).toBeVisible();
  await page.getByRole('button', { name: 'Save to Proof Kit' }).click();
  await expect(page.getByText('Receipt snapshot saved locally.')).toBeVisible();
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.getByText('Sample reset.')).toBeVisible();
  const names = await databaseNames(page);
  expect(names).toContain('ledger-import-check');
  expect(names).toContain('demo:ledger-import-check');
  expect(await page.evaluate(() => ({ ...localStorage }))).toEqual(before);
  expect(await readStore(page, 'ledger-import-check', 'current')).toEqual(realDraft);
  expect(await readStore(page, 'demo:ledger-import-check', 'receipts')).toBeUndefined();
  await page.evaluate(async () => {
    localStorage.setItem('demo:sb_license:offline-ledger-import', 'DEMO-EXIT-LICENSE');
    localStorage.setItem('demo:sb_license:offline-ledger-import:verdict', JSON.stringify({ valid: true, checkedAt: Date.now() }));
    const request = indexedDB.open('demo:ledger-import-check', 1);
    const database = await new Promise<IDBDatabase>((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    const transaction = database.transaction('local-data', 'readwrite');
    transaction.objectStore('local-data').put([{ id: 'demo-receipt', statement: 'Demo receipt', checkedAt: '2026-08-28T00:00:00.000Z', summary: 'Demo', filename: 'demo.txt', receiptText: 'Demo receipt' }], 'receipts');
    await new Promise<void>((resolve, reject) => { transaction.oncomplete = () => { database.close(); resolve(); }; transaction.onerror = () => reject(transaction.error); });
  });
  await page.getByRole('link', { name: 'Start for real' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('#file-status')).toContainText('real.csv');
  expect(await page.evaluate(() => ({ ...localStorage }))).toEqual(before);
  expect(await readStore(page, 'ledger-import-check', 'current')).toEqual(realDraft);
  expect(await databaseNames(page)).not.toContain('demo:ledger-import-check');
});

test('sample detects the exact repeated transaction @claim:duplicate-detection', async ({ page }) => {
  await openDemoAndCheck(page);
  await expect(page.getByText('Exact repeat', { exact: true })).toBeVisible();
});

test('sample reports the supplied closing-balance difference and balance gap @claim:balance-check', async ({ page }) => {
  await openDemoAndCheck(page);
  await expect(page.getByText('1 balance gap located.')).toBeVisible();
  await expect(page.getByText('-$30.00', { exact: true }).first()).toBeVisible();
});

test('suggests each mapping from nontrivial bank CSV column names @claim:column-suggestions', async ({ page }) => {
  await page.goto('/demo');
  await page.locator('#csv-file').setInputFiles({
    name: 'suggestions.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('Posted Date,Narration,Money Out,Money In,Running Balance\n2026-03-01,Groceries,12.50,,987.50')
  });
  await expect(page.getByLabel('Date column')).toHaveValue('0');
  await expect(page.getByLabel('Description column')).toHaveValue('1');
  await expect(page.getByRole('radio', { name: 'Debit + credit' })).toBeChecked();
  await expect(page.getByLabel('Debit / money out')).toHaveValue('2');
  await expect(page.getByLabel('Credit / money in')).toHaveValue('3');
  await expect(page.getByLabel(/Running balance/)).toHaveValue('4');
});

test('marks the source row where the sample balance gap starts @claim:balance-gap-location', async ({ page }) => {
  await openDemoAndCheck(page);
  const utilityRow = page.locator('#result-rows tr').filter({ hasText: 'Utilities' });
  await expect(utilityRow).toContainText('source row 7');
  await expect(utilityRow).toContainText('Balance gap starts -$30.00');
});

test('excluding a normal row updates the balance and cleaned export @claim:include-toggle', async ({ page }) => {
  await openDemoAndCheck(page);
  await page.getByRole('checkbox', { name: 'Include Groceries' }).uncheck();
  await expect(page.locator('#result-meters div').nth(1)).toContainText('Included');
  await expect(page.locator('#result-meters div').nth(1)).toContainText('4');
  await expect(page.locator('#result-meters div').nth(4)).toContainText('-$95.50');
  const csvDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export cleaned CSV' }).click();
  const download = await csvDownload;
  const payload = await readFile((await download.path()) as string, 'utf8');
  expect(payload).not.toContain('Groceries');
  expect(payload).toContain('Utilities');
});

test('sorts transactions by date while retaining source order for same-day rows @claim:chronological-order', async ({ page }) => {
  await page.goto('/demo');
  await page.locator('#csv-file').setInputFiles({
    name: 'shuffled.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('Date,Description,Amount\n2026-03-03,Third,1\n2026-03-01,First,2\n2026-03-02,Second first,3\n2026-03-02,Second second,4')
  });
  await page.getByLabel('Opening balance').fill('0');
  await page.getByLabel('Closing balance').fill('10');
  await page.getByRole('button', { name: 'Run balance check' }).click();
  const rows = await page.locator('#result-rows tr').allTextContents();
  expect(rows).toHaveLength(4);
  expect(rows[0]).toContain('First');
  expect(rows[1]).toContain('Second first');
  expect(rows[1]).toContain('source row 4');
  expect(rows[2]).toContain('Second second');
  expect(rows[2]).toContain('source row 5');
  expect(rows[3]).toContain('Third');
});

test('rejects a bank CSV with no header row and explains the recovery @claim:header-row-required', async ({ page }) => {
  await page.goto('/demo');
  await page.locator('#csv-file').setInputFiles({
    name: 'no-header.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('2026-03-01,Coffee,-5.00\n2026-03-02,Bus,-3.00')
  });
  await expect(page.locator('#import-error')).toHaveText('The first row must contain column names. Export the bank CSV with its header row included.');
});

test('sample exports a cleaned CSV @claim:csv-export', async ({ page }) => {
  await openDemoAndCheck(page);
  const csvDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export cleaned CSV' }).click();
  const download = await csvDownload;
  expect(download.suggestedFilename()).toMatch(/clean\.csv$/);
  const path = await download.path();
  const payload = await readFile(path as string, 'utf8');
  expect(payload).toContain('Date,Description,Amount,Reported balance,Source fingerprint');
  expect(payload.trim().split(/\r?\n/)).toHaveLength(6);
  expect(payload).toContain('Client invoice');
  expect(payload.match(/Corner coffee,-4\.50,1095\.50/g)).toHaveLength(1);
});

test('sample exports a reconciliation receipt @claim:receipt-export', async ({ page }) => {
  await openDemoAndCheck(page);
  const receiptDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export receipt' }).click();
  const download = await receiptDownload;
  expect(download.suggestedFilename()).toMatch(/receipt\.txt$/);
  const payload = await readFile((await download.path()) as string, 'utf8');
  expect(payload).toContain('Statement: Example current account · March 2026');
  expect(payload).toMatch(/Source SHA-256: [a-f0-9]{64}/);
  expect(payload).toContain('Source rows: 6');
  expect(payload).toContain('Included rows: 5');
  expect(payload).toContain('Exact repeats: 1');
  expect(payload).toContain('Running-balance gap changes: 1');
  expect(payload).toContain('Unexplained difference: -$30.00');
  expect(payload).toContain('METHOD NOTE');
});

test('demo draft recovers after a refresh from its isolated store @claim:draft-recovery', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.getByText('example-march-2026.csv').first()).toBeVisible();
  await page.reload();
  await expect(page.getByText('example-march-2026.csv').first()).toBeVisible();
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
    await expect(page.getByText('Balances agree.', { exact: true })).toBeVisible();
  }
});

test('exports and restores the active draft as JSON @claim:json-draft-backup', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.getByText('example-march-2026.csv').first()).toBeVisible();

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
    localStorage.setItem('demo:sb_license:offline-ledger-import', 'demo-license');
    localStorage.setItem('demo:sb_license:offline-ledger-import:verdict', JSON.stringify({ valid: true, checkedAt: Date.now(), reason: 'ok' }));
  });
  await openDemoAndCheck(page);
  await expect(page.locator('#archive-list li')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Save to Proof Kit' })).toBeVisible();
  await page.getByRole('button', { name: 'Save to Proof Kit' }).click();
  await expect(page.getByText('Receipt snapshot saved locally.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Local receipt index' })).toBeVisible();
  await expect(page.locator('#archive-list li')).toHaveCount(1);
  await expect(page.locator('#archive-list')).toContainText('Example current account · March 2026');
  await expect(page.locator('#archive-list')).toContainText('Review -$30.00 difference');
  const saved = await readStore(page, 'demo:ledger-import-check', 'receipts') as Array<{ receiptText: string }>;
  expect(saved).toHaveLength(1);
  expect(saved.at(0)?.receiptText).toContain('Unexplained difference: -$30.00');
  await page.reload();
  await expect(page.locator('#archive-list')).toContainText('Example current account · March 2026');
  const savedDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export saved receipt' }).click();
  const savedReceipt = await savedDownload;
  expect(await readFile((await savedReceipt.path()) as string, 'utf8')).toContain('Unexplained difference: -$30.00');
});

test('Proof Kit states the recorded one-time Sociobot/Dodo checkout contract @claim:proof-kit-price', async ({ page }) => {
  const contract = JSON.parse(await readFile('tests/fixtures/checkout-contract.json', 'utf8')) as Record<string, unknown>;
  expect(contract).toMatchObject({ product: 'offline-ledger-import', currency: 'USD', amount_cents: 1200, billing_type: 'one_time', merchant_of_record: 'Sociobot/Dodo' });
  expect(contract.refunds).toMatch(/refund/i);
  expect(contract.checkout_path).toBe('/api/v1/products/offline-ledger-import/checkout');
  await page.goto('/');
  await expect(page.getByText('$12 one-time')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Buy on Sociobot' })).toHaveAttribute('href', 'https://api.sociobot.in/api/v1/products/offline-ledger-import/checkout');
  await page.goto('/terms/');
  await expect(page.getByText(/Sociobot\/Dodo is the merchant of record/)).toBeVisible();
  await expect(page.getByText(/Refunds are handled there and revoke the license/)).toBeVisible();
});

test('buying uses the recorded Sociobot route and Dodo checkout destination @claim:checkout-destination', async ({ page }) => {
  const contract = JSON.parse(await readFile('tests/fixtures/checkout-contract.json', 'utf8')) as { checkout_host: string };
  const requests: { url: string; method: string }[] = [];
  await page.route('https://api.sociobot.in/api/v1/products/offline-ledger-import/checkout', async (route) => {
    requests.push({ url: route.request().url(), method: route.request().method() });
    await route.fulfill({ status: 204, headers: { 'access-control-allow-origin': 'http://127.0.0.1:4173' } });
  });
  await page.goto('/');
  await expect(page.getByText('Opens secure Sociobot/Dodo checkout.')).toBeVisible();
  const href = await page.getByRole('link', { name: 'Buy on Sociobot' }).getAttribute('href');
  expect(href).toBe('https://api.sociobot.in/api/v1/products/offline-ledger-import/checkout');
  expect(contract.checkout_host).toBe('checkout.dodopayments.com');
  await page.evaluate(async (checkoutUrl) => { await fetch(checkoutUrl); }, href as string);
  expect(requests).toEqual([{ url: href, method: 'GET' }]);
});

test('unlicensed normal workspaces keep every export free and local @claim:free-exports', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/');
  await page.locator('#csv-file').setInputFiles({
    name: 'free-export.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('Date,Description,Amount\n2026-03-01,Invoice,10.00')
  });
  await page.getByLabel('Opening balance').fill('0');
  await page.getByLabel('Closing balance').fill('10');
  await page.getByRole('button', { name: 'Run balance check' }).click();
  await expect(page.getByText('Balances agree.', { exact: true })).toBeVisible();
  for (const button of ['Export cleaned CSV', 'Export receipt', 'Download draft backup']) {
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: button }).click();
    expect((await download).suggestedFilename()).toBeTruthy();
  }
  expect(requests.some((url) => url.includes('api.sociobot.in') || url.includes('/checkout'))).toBe(false);
});

test('starting for real restores the saved workspace and discards the demo @claim:start-real-workspace', async ({ page }) => {
  await page.goto('/');
  await seedDraft(page, 'ledger-import-check', 'saved-real.csv');
  await page.goto('/demo?demo=1');
  await page.locator('#csv-file').setInputFiles({
    name: 'changed-demo.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('Date,Description,Amount\n2026-03-01,Demo change,2.00')
  });
  await expect(page.locator('#file-status')).toContainText('changed-demo.csv');
  await page.getByRole('link', { name: 'Start for real' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('#file-status')).toContainText('saved-real.csv');
  expect(await databaseNames(page)).not.toContain('demo:ledger-import-check');
});

test('Erase local draft removes the active bank CSV @claim:erase-draft', async ({ page }) => {
  await page.goto('/demo');
  await page.locator('#csv-file').setInputFiles({ name: 'erase-me.csv', mimeType: 'text/csv', buffer: Buffer.from('Date,Description,Amount\n2026-03-01,Erase me,10.00') });
  await expect(page.locator('#file-status')).toContainText('erase-me.csv');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Erase local draft' }).click();
  await expect(page.locator('#file-status')).toBeHidden();
  expect(await readStore(page, 'demo:ledger-import-check', 'current')).toBeUndefined();
  await page.reload();
  await expect(page.getByText('example-march-2026.csv').first()).toBeVisible();
});

test('the published app loads scripts, styles, and fonts only from this site @claim:self-hosted-assets', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/');
  await expect(page.locator('script[src], link[rel="stylesheet"]')).toHaveCount(2);
  expect(requests.every((url) => new URL(url).origin === 'http://127.0.0.1:4173')).toBe(true);
});

test('the normal workflow makes no analytics or tracking requests @claim:no-analytics', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(new URL(request.url()).pathname));
  await openDemoAndCheck(page);
  const csvDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export cleaned CSV' }).click();
  await csvDownload;
  const receiptDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export receipt' }).click();
  await receiptDownload;
  expect(requests.some((path) => /analytics|track|collect|telemetry|pixel/i.test(path))).toBe(false);
  expect(requests.every((path) => path === '/' || path === '/demo' || path === '/sw.js' || path === '/manifest.webmanifest' || path === '/offline.html' || path.startsWith('/assets/') || path.startsWith('/src/') || path.startsWith('/node_modules/'))).toBe(true);
  const assetFiles = await readdir('dist/assets');
  const builtText = (await Promise.all(['dist/index.html', ...assetFiles.filter((file) => file.endsWith('.js')).map((file) => `dist/assets/${file}`)].map((file) => readFile(file, 'utf8')))).join('\n');
  expect(builtText).not.toMatch(/google-analytics|googletagmanager|segment\.com|sentry\.io|\/analytics|\/collect|\/telemetry/i);
});

test('license verification sends only its dummy token to Sociobot billing @claim:license-verification-network', async ({ page }) => {
  const seen: { url: string; postData: string | null }[] = [];
  await page.route('https://api.sociobot.in/**', async (route) => {
    seen.push({ url: route.request().url(), postData: route.request().postData() });
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: false, reason: 'invalid' }) });
  });
  await page.goto('/');
  await page.locator('#license-locked summary').click();
  await page.getByLabel('Paste license token').fill('dummy-license-for-network-test');
  await page.getByRole('button', { name: 'Verify license' }).click();
  await expect(page.getByText('That license is not active for this product.')).toBeVisible();
  expect(seen).toHaveLength(1);
  const request = seen.at(0);
  expect(request?.url).toBe('https://api.sociobot.in/api/v1/products/offline-ledger-import/verify?license=dummy-license-for-network-test');
  expect(request?.postData).toBeNull();
});

test('example completes the workflow and exports both evidence files', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await page.goto('/demo');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Tell us which column is which' })).toBeVisible();
  await page.getByRole('button', { name: /Run balance check/ }).click();
  await expect(page.getByText('The balances do not agree yet.')).toBeVisible();
  await expect(page.getByText('1 balance gap located.')).toBeVisible();
  await expect(page.getByText('Exact repeat', { exact: true })).toBeVisible();

  const csvDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export cleaned CSV' }).click();
  expect((await csvDownload).suggestedFilename()).toMatch(/clean\.csv$/);
  const receiptDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export receipt' }).click();
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

test('has no serious accessibility violations on the legal and error routes', async ({ page }) => {
  for (const route of ['/privacy/', '/terms/', '/404/']) {
    await page.goto(route);
    const results = await new AxeBuilder({ page: page as never }).analyze();
    expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
  }
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
  await expect(page.getByRole('heading', { name: 'Review a sample bank CSV' })).toBeVisible();
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
  await expect(page.getByText('example-march-2026.csv').first()).toBeVisible();
});

test('the landing first read has a one-click sample action and plain job statement @claim:first-read-demo', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Ledger Import Check — check bank CSVs');
  await expect(page.getByRole('heading', { level: 1, name: 'Check bank CSVs before importing' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Try it with sample data/ })).toHaveAttribute('href', '/demo?demo=1');
  await expect(page.getByText('For households and freelancers: find repeats and balance gaps before importing.')).toBeVisible();
});

test('demo banner and sample evidence stay in the first mobile and desktop viewport @claim:demo-first-viewport', async ({ page }) => {
  await page.goto('/demo?demo=1');
  const viewport = page.viewportSize()!;
  for (const name of ['Demo controls', 'example-march-2026.csv', '1 exact repeat', '1 balance gap', '-$30.00 difference']) {
    const box = await (name === 'Demo controls' ? page.getByLabel(name) : page.getByText(name, { exact: true }).first()).boundingBox();
    expect(box, `${name} has a box`).not.toBeNull();
    expect(box!.y).toBeLessThan(viewport.height);
    expect(box!.y + box!.height).toBeGreaterThan(0);
  }
});

test('all product controls meet 44px touch targets at 390px @regression:touch-targets', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');
  await page.goto('/demo');
  const undersized = await page.locator('a, button, summary, label[for]').evaluateAll((items) => items.filter((item) => {
    const box = item.getBoundingClientRect(); return box.width > 0 && box.height > 0 && (box.width < 44 || box.height < 44);
  }).map((item) => `${item.tagName}:${item.textContent?.trim()}`));
  expect(undersized).toEqual([]);
});

test('legal and error routes keep every visible target at 44px on mobile @regression:route-touch-targets', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');
  for (const route of ['/privacy/', '/terms/', '/404/']) {
    await page.goto(route);
    const undersized = await page.locator('a, button, summary, label[for]').evaluateAll((items) => items.filter((item) => {
      const box = item.getBoundingClientRect(); return box.width > 0 && box.height > 0 && (box.width < 44 || box.height < 44);
    }).map((item) => `${item.tagName}:${item.textContent?.trim()}`));
    expect(undersized, route).toEqual([]);
  }
});

test('skip link moves keyboard focus to the main landmark @regression:skip-link', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await page.getByRole('link', { name: 'Skip to ledger check' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
});

test('real routes have their own title, metadata, shared shell, and focused heading', async ({ page }) => {
  const routes = [
    ['/', 'Ledger Import Check — check bank CSVs'],
    ['/demo?demo=1', 'Demo — Ledger Import Check'],
    ['/privacy/', 'Privacy — Ledger Import Check'],
    ['/terms/', 'Terms — Ledger Import Check'],
    ['/404/', 'Page not found — Ledger Import Check']
  ] as const;
  let sharedFooter = '';
  for (const [route, title] of routes) {
    await page.goto(route);
    await expect(page).toHaveTitle(title);
    await expect(page.locator('meta[name="description"]')).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /ledger-social\.jpg$/);
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
    await expect(page.locator('header nav a')).toHaveCount(4);
    await expect(page.locator('footer')).toContainText('Built by Param Factory');
    const footer = (await page.locator('footer').innerText()).replace(/\s+/g, ' ').trim();
    if (sharedFooter) expect(footer).toBe(sharedFooter);
    else sharedFooter = footer;
    expect(footer).toMatch(/build [a-f0-9]{7,12}/);
    await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  }
});

test('header navigation and Back return focus to the destination heading', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Privacy' }).first().click();
  await expect(page).toHaveURL(/\/privacy\/$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Your bank CSV stays in this browser' })).toBeFocused();
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Check bank CSVs before importing' })).toBeFocused();
});
