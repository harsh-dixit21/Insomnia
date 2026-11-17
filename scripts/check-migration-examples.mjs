import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import {seed} from '../src/lib/insomnia.ts';
import {runTool} from '../src/lib/workbench.ts';

const directory = new URL('../examples/migration/', import.meta.url);
const available = (await readdir(directory)).filter(file => file.endsWith('.json')).sort();
const selection = process.argv[2];
const filename = selection?.endsWith('.json') ? selection : `${selection}.json`;
const files = selection ? available.filter(file => file === filename) : available;
assert.ok(files.length, selection ? 'Unknown migration example' : 'Provide migration examples');

let failures = 0;
for (const file of files) {
  try {
    const example = JSON.parse(await readFile(new URL(file, directory), 'utf8'));
    assert.ok(typeof example.scenario === 'string' && example.scenario.trim(), 'Describe the scenario');
    assert.equal(typeof example.sql, 'string', 'Provide SQL text');
    assert.ok(Array.isArray(example.expectedFlags), 'Declare the expected flags');
    const state = seed();
    const before = structuredClone(state);
    const inputs = {sql:example.sql, cdc:'Unknown', reconcile:'Unknown', ...example.gates};
    const result = runTool('migration', inputs, state, example.evaluationId ?? state.evaluations[0].id);
    const review = result.sections.find(section => section.heading === 'SQL review');
    assert.ok(review, 'Missing SQL review section');
    assert.match(result.summary, new RegExp(`^${example.expectedFlags.length} SQL review flags;`));
    if (example.expectedFlags.length) {
      assert.equal(review.lines.length, example.expectedFlags.length);
      example.expectedFlags.forEach((flag, index) => assert.ok(review.lines[index].startsWith(flag), `Expected flag: ${flag}`));
    } else {
      assert.match(review.lines.join('\n'), /No recognized syntax flag/);
    }
    const gates = result.sections.find(section => section.heading === 'Migration gates');
    assert.ok(gates, 'Missing migration gates');
    for (const expected of example.expectedGates ?? []) assert.ok(gates.lines.some(line => line.startsWith(expected)), `Missing gate: ${expected}`);
    assert.deepEqual(state, before, 'Migration review must preserve the workspace');
    console.log(`PASS ${file}`);
  } catch (error) {
    failures++;
    console.error(`FAIL ${file}: ${error.message}`);
  }
}
console.log(`${files.length - failures}/${files.length} migration examples passed.`);
if (failures) process.exitCode = 1;
