import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('example completes the workflow and exports both evidence files', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await page.getByRole('button', { name: 'Try the example statement' }).click();
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

test('has no serious accessibility violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page: page as never }).analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
});

test('fits a 390px viewport without page-level horizontal scrolling', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');
  await page.goto('/');
  await page.getByRole('button', { name: 'Try the example statement' }).click();
  await page.getByRole('button', { name: /Run balance check/ }).click();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('reopens the app shell while offline', async ({ page, context }) => {
  test.skip(test.info().project.name !== 'chromium');
  await page.goto('/');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: /Catch the skip/ })).toBeVisible();
  await expect(page.getByText(/Offline mode/)).toBeVisible();
});
