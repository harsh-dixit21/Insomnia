import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import {createIntegrations} from '../server/integrations.mjs';

const directory = new URL('../examples/sql/', import.meta.url);
const files = (await readdir(directory)).filter(file => file.endsWith('.json')).sort();
const selection = process.argv[2];
const selectedFile = selection?.endsWith('.json') ? selection : `${selection}.json`;
const selected = selection ? files.filter(file => file === selectedFile) : files;
assert.ok(selected.length, selection ? 'Unknown SQL example' : 'Provide SQL examples');

// Use explicit local configuration and a fresh worker for each successful query.
const integration = createIntegrations({local:true, iomete:{}});
let failures = 0;
for (const filename of selected) {
  try {
    const example = JSON.parse(await readFile(new URL(filename, directory), 'utf8'));
    assert.ok(typeof example.scenario === 'string' && example.scenario.trim(), 'Describe the scenario');
    assert.ok(Object.hasOwn(example, 'sql'), 'Provide a SQL input');
    let sql = example.sql;
    if (example.length !== undefined) {
      assert.equal(typeof sql, 'string');
      const parts = sql.split('{{padding}}');
      assert.equal(parts.length, 2, 'Length fixtures require one padding marker');
      const padding = example.length - parts[0].length - parts[1].length;
      assert.ok(Number.isInteger(example.length) && example.length <= 20001 && padding >= 0, 'Invalid fixture length');
      sql = parts.join('x'.repeat(padding));
      assert.equal(sql.length, example.length);
    }
    if (example.expectedError !== undefined) {
      assert.ok(typeof example.expectedError === 'string' && example.expectedError.trim(), 'Provide an expected error excerpt');
      await assert.rejects(() => integration.query(sql), error => error instanceof Error && error.message.includes(example.expectedError));
    } else {
      assert.ok(Array.isArray(example.columns) && Array.isArray(example.rows), 'Provide expected columns and rows');
      const result = await integration.query(sql);
      assert.equal(result.mode, 'local-sandbox');
      assert.deepEqual(result.columns, example.columns);
      assert.equal(result.truncated, example.truncated ?? false);
      assert.ok(Number.isFinite(result.seconds) && result.seconds >= 0, 'Expected an elapsed time');
      if (example.rowCount === undefined) {
        assert.deepEqual(result.rows, example.rows);
      } else {
        assert.equal(result.rows.length, example.rowCount);
        assert.deepEqual([result.rows[0], result.rows.at(-1)], example.rows, 'Check first and last returned rows');
      }
    }
    console.log(`PASS ${filename}`);
  } catch (error) {
    failures++;
    console.error(`FAIL ${filename}: ${error.message}`);
  }
}
console.log(`${selected.length - failures}/${selected.length} SQL examples passed.`);
if (failures) process.exitCode = 1;
