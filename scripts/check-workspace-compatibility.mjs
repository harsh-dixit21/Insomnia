import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import {seed} from '../src/lib/insomnia.ts';
import {emptyWorkspace, validateWorkspace} from '../src/lib/workspace-data.ts';
import {runTool} from '../src/lib/workbench.ts';

const directory = new URL('../examples/workspace-compatibility/', import.meta.url);
const available = (await readdir(directory)).filter(file => file.endsWith('.json')).sort();
const selected = process.argv[2];
const selectedFile = selected?.endsWith('.json') ? selected : `${selected}.json`;
if (selected && !available.includes(selectedFile)) throw new Error('Unknown workspace compatibility example.');
const files = selected ? [selectedFile] : available;
assert.ok(files.length, 'Provide workspace compatibility examples');
const collections = ['evaluations', 'workloads', 'tests', 'events', 'artifacts', 'measurements'];
let failures = 0;

for (const filename of files) {
  try {
    const example = JSON.parse(await readFile(new URL(filename, directory), 'utf8'));
    assert.ok(typeof example.scenario === 'string' && example.scenario.trim(), 'Describe the scenario');
    assert.ok(['seed', 'empty'].includes(example.base), 'Choose a supported base workspace');
    let state = example.base === 'empty' ? emptyWorkspace() : seed();
    if (example.base === 'seed') {
      const evaluationId = state.evaluations[0].id;
      const timestamp = '2026-11-01T12:00:00.000Z';
      const inputs = {sql:'SELECT 1', cdc:'Unknown', reconcile:'Unknown'};
      state.artifacts = [{id:'compatibility-report', evaluationId, tool:'migration', inputs, result:runTool('migration', inputs, state, evaluationId), created:timestamp}];
      state.measurements = [{id:'compatibility-measurement', evaluationId, workloadId:state.workloads[0].id, seconds:1, concurrency:10, correct:true, date:timestamp}];
      state.events = [{id:'compatibility-event', action:'Recorded a synthetic observation', date:timestamp}];
    }
    validateWorkspace(state);
    assert.ok(['patch', 'omit'].includes(example.operation), 'Unknown fixture operation');
    if (example.operation === 'omit') {
      assert.ok(Array.isArray(example.fields) && example.fields.length, 'Declare omitted legacy fields');
      for (const field of example.fields) {
        assert.ok(['artifacts', 'measurements', 'sample'].includes(field), 'Only optional legacy fields may be omitted');
        delete state[field];
      }
    } else {
      assert.ok(['workspace', 'settings', ...collections].includes(example.target), 'Unknown fixture target');
      assert.ok(example.changes && typeof example.changes === 'object' && !Array.isArray(example.changes), 'Provide field changes');
      if (example.target === 'workspace') state = {...state, ...example.changes};
      else if (example.target === 'settings') state.settings = {...state.settings, ...example.changes};
      else state[example.target][0] = {...state[example.target][0], ...example.changes};
    }
    const snapshot = structuredClone(state);
    const result = validateWorkspace(state);
    assert.deepEqual(state, snapshot, 'Validation must preserve the supplied backup');
    assert.ok(Array.isArray(example.expectedValues) && example.expectedValues.length, 'Declare values to preserve or recover');
    for (const expected of example.expectedValues) {
      assert.ok(Array.isArray(expected.path) && expected.path.length && Object.hasOwn(expected, 'value'), 'Provide an expected path and value');
      let value = result;
      for (const segment of expected.path) {
        assert.ok((typeof segment === 'string' || Number.isInteger(segment)) && !['__proto__', 'prototype', 'constructor'].includes(segment), 'Use a plain field or array index');
        assert.ok(value !== null && typeof value === 'object' && Object.hasOwn(value, segment), 'Expected field is missing');
        value = value[segment];
      }
      assert.deepEqual(value, expected.value, `Incorrect value at ${expected.path.join('.')}`);
    }
    assert.deepEqual(validateWorkspace(JSON.parse(JSON.stringify(result))), result, 'Validated workspace must survive JSON round-trip');
    console.log(`PASS ${filename}`);
  } catch (error) {
    failures++;
    console.error(`FAIL ${filename}: ${error.message}`);
  }
}
console.log(`${files.length - failures}/${files.length} workspace compatibility checks passed.`);
if (failures) process.exitCode = 1;
