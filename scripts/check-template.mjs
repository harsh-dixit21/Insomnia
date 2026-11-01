import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import vm from 'node:vm';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
assert.ok(html.includes('Clarity before commitment.'), 'ProofPlan headline is missing');
assert.ok(html.includes('class="proof-footer"'), 'The themed footer must be present');
assert.ok(!html.includes('>Driftbar<'), 'Template branding must be removed');
assert.ok(!html.includes('function clock()'), 'Unrelated demo clock must be removed');
assert.ok(!html.includes('let remaining=1500'), 'Unrelated focus timer must be removed');
assert.ok(html.includes('function downloadPlan()'), 'Example plan export must be available');
assert.ok(html.includes('data-text="Clarity before commitment."'), 'Canvas and accessible headline must agree');
assert.ok((await readFile(new URL('../driftbar-assets/techtext.js', import.meta.url), 'utf8')).includes('text:ch.dataset.text'), 'Canvas must read the customized headline');
await access(new URL('../proofplan.css', import.meta.url));
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
// Exercise the export with a buyer-supplied criterion without browser effects.
const exportSource = html.match(/function downloadPlan\(\)\{([\s\S]*?)\}document\.querySelector/);
assert.ok(exportSource, 'Plan export implementation must be present');
let exportedBlob;
let clicked = false;
const context = {
  Blob,
  URL: { createObjectURL(blob) { exportedBlob = blob; return 'blob:example'; }, revokeObjectURL() {} },
  setTimeout(fn) { fn(); },
  document: {
    querySelector() { return { value: 'Critical reports must finish within 2 seconds.' }; },
    createElement() { return { click() { clicked = true; } }; },
  },
};
vm.runInNewContext(`function downloadPlan(){${exportSource[1]}};downloadPlan();`, context);
assert.ok(clicked, 'Plan export must trigger a download');
const markdown = await exportedBlob.text();
assert.ok(markdown.includes('Critical reports must finish within 2 seconds.'), 'Export must retain the entered criteria');
assert.ok(markdown.includes('no benchmarks have been measured'), 'Export must label its illustrative status');
console.log(`Template checks passed: ${assets.size} local assets found; inline and bundled scripts parse.`);
