import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';

async function filesIn(directory) {
  const output = [];
  for (const name of await readdir(directory)) {
    if (name === 'sw-template.js' || name === 'sw.js' || name.endsWith('.map')) continue;
    const full = join(directory, name);
    const info = await stat(full);
    if (info.isDirectory()) output.push(...await filesIn(full));
    else output.push(`/${relative('dist', full).replaceAll('\\', '/')}`);
  }
  return output;
}

const assets = (await filesIn('dist')).sort();
const template = await readFile('dist/sw-template.js', 'utf8');
const hash = createHash('sha256');
for (const asset of assets) hash.update(asset).update(await readFile(join('dist', asset.slice(1))));
const buildId = hash.digest('hex').slice(0, 12);
await writeFile('dist/sw.js', template.replace('__BUILD_ID__', buildId).replace('__ASSET_MANIFEST__', JSON.stringify(assets)));
