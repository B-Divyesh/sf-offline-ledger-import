const { chromium, devices } = require('playwright');
const fs = require('node:fs');

const base = 'https://offline-ledger-import.sociobot.in';
const evidence = '.factory/evidence/verification-5';

function intersects(box, viewport) {
  return Boolean(box && box.y < viewport.height && box.y + box.height > 0);
}

async function inspectViewport(browser, name, options) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(`page: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  await page.goto(base, { waitUntil: 'networkidle' });
  const before = await page.evaluate(() => ({
    scrollY,
    title: document.title,
    h1: document.querySelector('h1')?.textContent?.trim(),
    audience: document.querySelector('.lead')?.textContent?.trim(),
    action: document.querySelector('.hero-actions a')?.textContent?.replace(/\s+/g, ' ').trim(),
    actionResult: document.querySelector('.hero-actions > span')?.textContent?.trim(),
    facts: [...document.querySelectorAll('.trust-strip li')].map((item) => item.textContent?.trim()),
    h1Count: document.querySelectorAll('h1').length,
    mainCount: document.querySelectorAll('main').length,
    active: document.activeElement?.textContent?.trim()
  }));
  await page.screenshot({ path: `${evidence}/fresh-${name}-home.png` });
  await page.getByRole('link', { name: /Try it with sample data/ }).click();
  await page.waitForLoadState('networkidle');
  const viewport = page.viewportSize();
  const labels = ['Demo controls', 'example-march-2026.csv', '1 exact repeat', '1 balance gap', '-$30.00 difference'];
  const visible = {};
  for (const label of labels) {
    const locator = label === 'Demo controls' ? page.getByLabel(label) : page.getByText(label, { exact: true }).first();
    visible[label] = intersects(await locator.boundingBox(), viewport);
  }
  const after = await page.evaluate(() => ({
    title: document.title,
    h1: document.querySelector('h1')?.textContent?.trim(),
    sampleLabel: document.querySelector('#demo-summary .eyebrow')?.textContent?.trim(),
    banner: document.querySelector('#demo-banner strong')?.textContent?.trim(),
    reset: document.querySelector('#reset-demo')?.textContent?.trim(),
    startReal: document.querySelector('#start-real')?.textContent?.trim(),
    h1Count: document.querySelectorAll('h1').length,
    mainCount: document.querySelectorAll('main').length
  }));
  await page.screenshot({ path: `${evidence}/fresh-${name}-demo.png` });
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await page.getByText('Sample reset.').waitFor();
  const resetResult = await page.locator('#demo-status').textContent();
  await context.close();
  return { before, after, visible, resetResult: resetResult?.trim(), errors };
}

async function boundaryAndRecovery(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(`page: ${error.message}`));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
  await page.goto(`${base}/demo?demo=1`);
  await page.locator('#csv-file').setInputFiles({
    name: 'over-20-mb.csv', mimeType: 'text/csv', buffer: Buffer.alloc(20_000_001, 0x20)
  });
  const rejected = (await page.locator('#import-error').textContent())?.trim();
  await page.locator('#csv-file').setInputFiles({
    name: 'smaller-period.csv', mimeType: 'text/csv',
    buffer: Buffer.from('Date,Description,Amount\n2026-03-01,Smaller period,10.00')
  });
  await page.getByLabel('Opening balance').fill('0');
  await page.getByLabel('Closing balance').fill('10');
  await page.getByRole('button', { name: 'Run balance check' }).click();
  const recovered = await page.getByText('✓ Balances agree.', { exact: true }).isVisible();
  const filename = (await page.locator('#file-status').textContent())?.replace(/\s+/g, ' ').trim();
  await context.close();
  return { rejected, recovered, filename, errors };
}

async function offlineReload(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(`page: ${error.message}`));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
  await page.goto(`${base}/demo?demo=1`);
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload({ waitUntil: 'networkidle' });
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  const result = await page.evaluate(async () => ({
    banner: document.querySelector('#demo-banner strong')?.textContent?.trim(),
    sample: document.body.innerText.includes('example-march-2026.csv'),
    offline: document.body.innerText.includes('Offline mode'),
    registrations: (await navigator.serviceWorker.getRegistrations()).length
  }));
  await context.close();
  return { ...result, errors };
}

async function routesAndA11y(browser) {
  const routes = ['/', '/demo?demo=1', '/privacy/', '/terms/', '/404/', '/missing-verification-5'];
  const output = [];
  for (const route of routes) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      reducedMotion: 'reduce'
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(`page: ${error.message}`));
    page.on('console', (message) => {
      const text = message.text();
      if (message.type() === 'error' && !(route.startsWith('/missing-') && text.includes('404'))) errors.push(`console: ${text}`);
    });
    const response = await page.goto(`${base}${route}`, { waitUntil: 'networkidle' });
    const result = await page.evaluate(async () => {
      const links = [...document.querySelectorAll('a,button,summary')].filter((item) => {
        const box = item.getBoundingClientRect(); return box.width > 0 && box.height > 0;
      });
      const undersized = links.filter((item) => {
        const box = item.getBoundingClientRect(); return box.width < 44 || box.height < 44;
      }).map((item) => item.textContent?.trim());
      const animated = [...document.querySelectorAll('*')].filter((item) => {
        const style = getComputedStyle(item);
        return parseFloat(style.animationDuration) > 0.01 || parseFloat(style.transitionDuration) > 0.01;
      }).length;
      return {
        title: document.title,
        lang: document.documentElement.lang,
        h1: [...document.querySelectorAll('h1')].map((item) => item.textContent?.trim()),
        main: document.querySelectorAll('main').length,
        horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        undersized,
        animated,
        active: document.activeElement?.textContent?.trim()
      };
    });
    output.push({ route, status: response?.status(), ...result, errors });
    await context.close();
  }
  return output;
}

(async () => {
  const browser = await chromium.launch();
  const report = {
    checkedAt: new Date().toISOString(),
    desktop: await inspectViewport(browser, 'desktop', { viewport: { width: 1440, height: 900 } }),
    phone: await inspectViewport(browser, 'phone', { ...devices['Pixel 5'], viewport: { width: 390, height: 844 } }),
    boundary: await boundaryAndRecovery(browser),
    offline: await offlineReload(browser),
    routes: await routesAndA11y(browser)
  };
  await browser.close();
  fs.writeFileSync(`${evidence}/live-qa.json`, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
