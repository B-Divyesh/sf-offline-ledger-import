import { readFile } from 'node:fs/promises';
import { expect, test } from 'vitest';

test('static host policy supplies security headers, immutable assets, manifest MIME, and a real 404 override @regression:static-policy', async () => {
  const config = JSON.parse(await readFile('staticwebapp.config.json', 'utf8')) as {
    globalHeaders: Record<string, string>;
    routes: Array<{ route: string; headers: Record<string, string> }>;
    responseOverrides: Record<string, { rewrite: string; statusCode: number }>;
    mimeTypes: Record<string, string>;
  };
  expect(config.globalHeaders['Content-Security-Policy']).toContain("default-src 'self'");
  expect(config.globalHeaders['X-Frame-Options']).toBe('DENY');
  expect(config.globalHeaders['Permissions-Policy']).toContain('camera=()');
  expect(config.routes.find((route) => route.route === '/assets/*')?.headers['Cache-Control']).toContain('immutable');
  expect(config.routes.find((route) => route.route === '/manifest.webmanifest')?.headers['Content-Type']).toBe('application/manifest+json');
  expect(config.mimeTypes['.webmanifest']).toBe('application/manifest+json');
  expect(config.responseOverrides['404']).toEqual({ rewrite: '/404/index.html', statusCode: 404 });
});
