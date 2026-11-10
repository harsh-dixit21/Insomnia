import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import {seed} from '../src/lib/insomnia.ts';
import {validateWorkspace} from '../src/lib/workspace-data.ts';
import {runTool} from '../src/lib/workbench.ts';

const directory = new URL('../examples/workspace-rejections/', import.meta.url);
const available = (await readdir(directory)).filter(file => file.endsWith('.json')).sort();
const selected = process.argv[2];
const selectedFile = selected?.endsWith('.json') ? selected : `${selected}.json`;
if (selected && !available.includes(selectedFile)) throw new Error('Unknown workspace rejection example.');
const files = selected ? [selectedFile] : available;
assert.ok(files.length, 'Provide workspace rejection examples');
const collections = ['evaluations', 'workloads', 'tests', 'events', 'artifacts', 'measurements'];
let failures = 0;

for (const filename of files) {
  try {
    const example = JSON.parse(await readFile(new URL(filename, directory), 'utf8'));
    assert.ok(typeof example.scenario === 'string' && example.scenario.trim(), 'Describe the scenario');
    assert.ok(typeof example.expectedError === 'string' && example.expectedError.trim(), 'Declare the expected error');
    assert.ok(['patch', 'duplicate', 'replace'].includes(example.operation), 'Unknown fixture operation');
    let state = seed();
    const evaluationId = state.evaluations[0].id;
    const timestamp = '2026-11-01T12:00:00.000Z';
    const inputs = {sql:'SELECT 1', cdc:'Unknown', reconcile:'Unknown'};
    state.artifacts = [{id:'fixture-report', evaluationId, tool:'migration', inputs, result:runTool('migration', inputs, state, evaluationId), created:timestamp}];
    state.measurements = [{id:'fixture-measurement', evaluationId, workloadId:state.workloads[0].id, seconds:1, concurrency:10, correct:true, date:timestamp}];
    state.events = [{id:'fixture-event', action:'Recorded a synthetic observation', date:timestamp}];
    validateWorkspace(state);

    if (example.operation === 'replace') {
      assert.equal(example.value, null, 'Root replacement fixtures must declare null');
      state = null;
    } else {
      assert.ok(['workspace', 'settings', ...collections].includes(example.target), 'Unknown fixture target');
      if (example.operation === 'duplicate') {
        assert.ok(collections.includes(example.target), 'Only row collections can be duplicated');
        state[example.target].push(structuredClone(state[example.target][0]));
      } else {
        assert.ok(example.changes && typeof example.changes === 'object' && !Array.isArray(example.changes), 'Provide field changes');
        if (example.target === 'workspace') state = {...state, ...example.changes};
        else if (example.target === 'settings') state.settings = {...state.settings, ...example.changes};
        else state[example.target][0] = {...state[example.target][0], ...example.changes};
      }
    }
    const snapshot = structuredClone(state);
    assert.throws(() => validateWorkspace(state), error => error instanceof Error && error.message.includes(example.expectedError), 'Expected the declared workspace validation error');
    assert.deepEqual(state, snapshot, 'Validation must preserve the supplied backup');
    console.log(`PASS ${filename}`);
  } catch (error) {
    failures++;
    console.error(`FAIL ${filename}: ${error.message}`);
  }
}
console.log(`${files.length - failures}/${files.length} workspace rejection checks passed.`);
if (failures) process.exitCode = 1;
