import { execFileSync } from 'node:child_process';
import { glob, readFile, writeFile } from 'node:fs/promises';

const fallback = 'source';
const buildId = (process.env.GITHUB_SHA || process.env.BUILD_SOURCEVERSION || (() => {
  try { return execFileSync('git', ['rev-parse', '--short=12', 'HEAD'], { encoding: 'utf8' }).trim(); }
  catch { return fallback; }
})()).slice(0, 12);

for await (const file of glob('dist/**/index.html')) {
  const html = await readFile(file, 'utf8');
  await writeFile(file, html.replaceAll('__BUILD_ID__', buildId));
}
