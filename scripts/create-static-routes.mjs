import { copyFile, mkdir } from 'node:fs/promises';

// The demo uses the same audited app shell as home; app.ts switches to its
// isolated `demo:` IndexedDB namespace when this real static route is loaded.
await mkdir('dist/demo', { recursive: true });
await copyFile('dist/index.html', 'dist/demo/index.html');
await copyFile('staticwebapp.config.json', 'dist/staticwebapp.config.json');
