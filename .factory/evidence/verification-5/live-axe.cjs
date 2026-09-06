const { chromium, devices } = require('playwright');
const fs = require('node:fs');

const base = 'https://offline-ledger-import.sociobot.in';
const routes = ['/', '/demo?demo=1', '/privacy/', '/terms/', '/404/', '/missing-verification-5'];
const axePath = require.resolve('axe-core/axe.min.js');

(async () => {
  const browser = await chromium.launch();
  const results = [];
  for (const [profile, options] of [
    ['desktop', { viewport: { width: 1440, height: 900 } }],
    ['phone', { ...devices['Pixel 5'], viewport: { width: 390, height: 844 } }]
  ]) {
    for (const route of routes) {
      const context = await browser.newContext({ ...options, bypassCSP: true });
      const page = await context.newPage();
      const response = await page.goto(`${base}${route}`, { waitUntil: 'networkidle' });
      await page.addScriptTag({ path: axePath });
      const axe = await page.evaluate(async () => window.axe.run(document));
      results.push({
        profile,
        route,
        status: response?.status(),
        violations: axe.violations.map((item) => ({
          id: item.id,
          impact: item.impact,
          nodes: item.nodes.length
        })),
        seriousOrCritical: axe.violations.filter((item) => ['serious', 'critical'].includes(item.impact)).length
      });
      await context.close();
    }
  }
  await browser.close();
  fs.writeFileSync('.factory/evidence/verification-5/live-axe.json', `${JSON.stringify(results, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
