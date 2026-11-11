import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import {importWorkloads, parseCsv, seed} from '../src/lib/insomnia.ts';
import {importMeasurements} from '../src/lib/workbench.ts';

const directory = new URL('../examples/csv/', import.meta.url);
const available = (await readdir(directory)).filter(file => file.endsWith('.json')).sort();
const selected = process.argv[2];
const selectedFile = selected?.endsWith('.json') ? selected : `${selected}.json`;
if (selected && !available.includes(selectedFile)) throw new Error('Unknown CSV example.');
const files = selected ? [selectedFile] : available;
assert.ok(files.length, 'Provide CSV examples');

let failures = 0;
for (const filename of files) {
  try {
    const example = JSON.parse(await readFile(new URL(filename, directory), 'utf8'));
    assert.ok(typeof example.scenario === 'string' && example.scenario.trim(), 'Describe the scenario');
    assert.ok(['parser', 'workloads', 'measurements'].includes(example.operation), 'Unknown CSV operation');
    assert.equal(typeof example.csv, 'string', 'Provide CSV text');
    let csv = example.csv;
    if (example.repeat !== undefined) {
      assert.ok(Number.isInteger(example.repeat) && example.repeat > 0 && example.repeat <= 10001, 'Invalid repeat count');
      const newline = csv.indexOf('\n');
      assert.ok(newline > 0 && csv.slice(newline + 1).trim(), 'Repeated examples need a header and row');
      const template = csv.slice(newline + 1);
      const rows = Array.from({length:example.repeat}, (_, index) => template.replaceAll('{{row}}', String(index + 1)));
      csv = csv.slice(0, newline + 1) + rows.join('\n');
    }

    const state = seed();
    const evaluationId = state.evaluations[0].id;
    if (example.inventory !== undefined) {
      assert.ok(example.operation === 'measurements' && Array.isArray(example.inventory), 'Inventory applies to measurement examples');
      state.workloads = example.inventory.map(({id, report, evaluation}) => {
        const parent = state.evaluations[evaluation];
        assert.ok(parent && typeof id === 'string' && typeof report === 'string', 'Invalid inventory entry');
        return {id, report, evaluationId:parent.id, baseline:1, target:2, critical:false};
      });
    }
    const snapshot = structuredClone(state);
    const execute = () => {
      if (example.operation === 'parser') return parseCsv(csv);
      if (example.operation === 'workloads') return importWorkloads(csv, evaluationId);
      return importMeasurements(csv, state, evaluationId);
    };

    if (example.expectedError !== undefined) {
      assert.ok(typeof example.expectedError === 'string' && example.expectedError.trim(), 'Declare a validation error excerpt');
      assert.throws(execute, error => error instanceof Error && error.message.includes(example.expectedError), 'Expected the declared CSV error');
    } else {
      assert.ok(Array.isArray(example.expectedRows), 'Declare expected rows');
      let rows = execute();
      if (example.operation !== 'parser') {
        assert.equal(new Set(rows.map(row => row.id)).size, rows.length, 'Imported IDs must be unique');
        rows = rows.map(({id, evaluationId:owner, date, ...fields}) => {
          assert.ok(typeof id === 'string' && id.length, 'Imported row requires an ID');
          assert.equal(owner, evaluationId, 'Imported row must use the selected evaluation');
          if (example.operation === 'measurements') assert.ok(Number.isFinite(Date.parse(date)), 'Measurement requires a timestamp');
          return fields;
        });
      }
      if (example.repeat !== undefined) {
        assert.equal(rows.length, example.repeat);
        assert.deepEqual([rows[0], rows.at(-1)], example.expectedRows, 'Check first and last repeated rows');
      } else {
        assert.deepEqual(rows, example.expectedRows);
      }
    }
    assert.deepEqual(state, snapshot, 'CSV processing must preserve the supplied workspace');
    console.log(`PASS ${filename}`);
  } catch (error) {
    failures++;
    console.error(`FAIL ${filename}: ${error.message}`);
  }
}
console.log(`${files.length - failures}/${files.length} CSV examples passed.`);
if (failures) process.exitCode = 1;
