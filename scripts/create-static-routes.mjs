import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';

// The demo uses the same audited app shell as home; app.ts switches to its
// isolated `demo:` IndexedDB namespace when this real static route is loaded.
await mkdir('dist/demo', { recursive: true });
const home = await readFile('dist/index.html', 'utf8');
const demo = home
  .replace('<title>Ledger Import Check — check bank CSVs</title>', '<title>Demo — Ledger Import Check</title>')
  .replace('content="https://offline-ledger-import.sociobot.in/"', 'content="https://offline-ledger-import.sociobot.in/demo"')
  .replace('href="https://offline-ledger-import.sociobot.in/"', 'href="https://offline-ledger-import.sociobot.in/demo"')
  .replace('content="Ledger Import Check — check bank CSVs"', 'content="Demo — Ledger Import Check"')
  .replace('content="Ledger Import Check — check bank CSVs"', 'content="Demo — Ledger Import Check"')
  .replaceAll('content="Check a bank CSV for repeats and balance gaps before you import it."', 'content="Review a sample bank CSV with a repeat, a balance gap, and a reconciliation receipt."');
await writeFile('dist/demo/index.html', demo);
await copyFile('staticwebapp.config.json', 'dist/staticwebapp.config.json');
