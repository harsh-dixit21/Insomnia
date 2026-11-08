import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import {seed} from '../src/lib/insomnia.ts';
import {importMeasurements, runTool, toolDefinitions} from '../src/lib/workbench.ts';

const directory = new URL('../examples/rejections/', import.meta.url);
const available = (await readdir(directory)).filter(file => file.endsWith('.json')).sort();
const selected = process.argv[2];
const selectedFile = selected?.endsWith('.json') ? selected : `${selected}.json`;
if (selected && !available.includes(selectedFile)) {
  throw new Error('Unknown rejection example. Use an existing JSON filename or its name without .json.');
}
const files = selected ? [selectedFile] : available;
assert.ok(files.length, 'Provide rejection examples before running this check');
let failures = 0;
for (const filename of files) {
  try {
    const example = JSON.parse(await readFile(new URL(filename, directory), 'utf8'));
    assert.ok(typeof example.scenario === 'string' && example.scenario.trim(), 'Describe the invalid-input scenario');
    assert.ok(typeof example.expectedError === 'string' && example.expectedError.trim(), 'Declare the expected validation error');
    assert.ok(['tool', 'measurements'].includes(example.operation), 'Unknown rejection operation');
    const state = seed();
    const initialState = structuredClone(state);
    const evaluationId = state.evaluations[0].id;
    let execute;
    if (example.operation === 'measurements') {
      assert.equal(typeof example.csv, 'string', 'Provide measurement CSV text');
      execute = () => importMeasurements(example.csv, state, evaluationId);
    } else {
      assert.ok(toolDefinitions.some(tool => tool.id === example.tool), 'Choose a known tool');
      assert.ok(example.inputs && typeof example.inputs === 'object' && !Array.isArray(example.inputs), 'Provide input overrides');
      assert.ok(Object.values(example.inputs).every(value => typeof value === 'string'), 'Input overrides must contain strings');
      const base = JSON.parse(await readFile(new URL(`../examples/tools/${example.tool}.json`, import.meta.url), 'utf8'));
      const inputs = {...base.inputs, ...example.inputs};
      execute = () => runTool(example.tool, inputs, state, evaluationId);
    }
    // Match the engine's validation error so unrelated exceptions cannot pass.
    assert.throws(execute, error => error instanceof Error && error.message.includes(example.expectedError), 'Expected the declared validation error');
    assert.deepEqual(state, initialState, 'Rejected input must preserve the workspace');
    console.log(`PASS ${filename}`);
  } catch (error) {
    failures++;
    console.error(`FAIL ${filename}: ${error.message}`);
  }
}
console.log(`${files.length - failures}/${files.length} rejection checks passed.`);
if (failures) process.exitCode = 1;
