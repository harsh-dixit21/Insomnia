import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import vm from 'node:vm';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
assert.ok(html.includes('Make space for calm.'), 'Template headline is missing');
assert.ok(html.includes('id="headline-effect"'), 'TechText mount is missing');
assert.ok(!html.includes('/src/main.jsx'), 'Old React entry must be removed');
const assets = new Set([...html.matchAll(/(?:src|href)=["'](driftbar-assets\/[^"']+)["']/g)].map(match => match[1]));
for (const match of html.matchAll(/url\(['"]?(driftbar-assets\/[^)'"\s]+)/g)) assets.add(match[1]);
for (const asset of assets) await access(new URL(`../${asset}`, import.meta.url));
for (const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) {
  if (match[1].trim()) new vm.Script(match[1]);
}
for (const asset of assets) {
  if (asset.endsWith('.js')) new vm.Script(await readFile(new URL(`../${asset}`, import.meta.url), 'utf8'));
}
console.log(`Template checks passed: ${assets.size} local assets found; inline and bundled scripts parse.`);
