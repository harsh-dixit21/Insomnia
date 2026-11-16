import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import {searchKnowledge} from '../src/lib/knowledge.ts';

const directory = new URL('../examples/knowledge/', import.meta.url);
const available = (await readdir(directory)).filter(file => file.endsWith('.json')).sort();
const selection = process.argv[2];
const filename = selection?.endsWith('.json') ? selection : `${selection}.json`;
const files = selection ? available.filter(file => file === filename) : available;
assert.ok(files.length, selection ? 'Unknown knowledge example' : 'Provide knowledge examples');

let failures = 0;
for (const file of files) {
  try {
    const example = JSON.parse(await readFile(new URL(file, directory), 'utf8'));
    assert.ok(typeof example.scenario === 'string' && example.scenario.trim(), 'Describe the scenario');
    assert.equal(typeof example.query, 'string', 'Provide a search query');
    assert.ok(Array.isArray(example.expectedTopics), 'Provide the ordered topic IDs');
    const hits = searchKnowledge(example.query);
    assert.deepEqual(hits.map(hit => hit.fact.id), example.expectedTopics);
    if (example.expectedScores !== undefined) {
      assert.deepEqual(hits.map(hit => hit.score), example.expectedScores);
    }
    console.log(`PASS ${file}`);
  } catch (error) {
    failures++;
    console.error(`FAIL ${file}: ${error.message}`);
  }
}
console.log(`${files.length - failures}/${files.length} knowledge examples passed.`);
if (failures) process.exitCode = 1;
