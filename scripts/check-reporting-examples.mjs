import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import {blockers, planMarkdown, readiness} from '../src/lib/insomnia.ts';
import {emptyWorkspace, planningActivity, validateWorkspace} from '../src/lib/workspace-data.ts';

// Use one timezone for calendar-boundary fixtures on every host.
process.env.TZ = 'UTC';

const directory = new URL('../examples/reporting/', import.meta.url);
const available = (await readdir(directory)).filter(file => file.endsWith('.json')).sort();
const selected = process.argv[2];
const selectedFile = selected?.endsWith('.json') ? selected : `${selected}.json`;
if (selected && !available.includes(selectedFile)) throw new Error('Unknown reporting example.');
const files = selected ? [selectedFile] : available;
assert.ok(files.length, 'Provide reporting examples');

const evaluation = {
  id:'pilot', company:'Example Manufacturing', name:'Inventory pilot', platform:'Oracle',
  owner:'Pilot owner', deadline:'2026-12-01', status:'Planning',
  requirements:'Measure and reconcile the reporting workload.', created:'2026-10-01',
};
const otherEvaluation = {...evaluation, id:'other', company:'Separate evaluation', deadline:'2027-01-01'};
let failures = 0;

for (const filename of files) {
  try {
    const example = JSON.parse(await readFile(new URL(filename, directory), 'utf8'));
    assert.ok(typeof example.scenario === 'string' && example.scenario.trim(), 'Describe the scenario');
    assert.ok(['readiness', 'blockers', 'activity', 'brief'].includes(example.operation), 'Unknown reporting operation');
    const state = validateWorkspace({
      ...emptyWorkspace(),
      evaluations:[{...evaluation, ...example.evaluation}, otherEvaluation],
      ...example.workspace,
    });
    const evaluationId = example.evaluationId ?? 'pilot';
    const now = new Date(example.now ?? '2026-11-10T12:00:00');
    assert.ok(Number.isFinite(+now), 'Provide a valid reference date');
    const snapshot = structuredClone(state);

    switch (example.operation) {
      case 'readiness':
        assert.equal(readiness(state, evaluationId), example.expected);
        break;
      case 'blockers': {
        const items = blockers(state, now);
        assert.deepEqual(items.map(item => item.id), example.expected.ids);
        const details = items.map(item => `${item.title}\n${item.detail}`).join('\n');
        for (const excerpt of example.expected.contains ?? []) assert.ok(details.includes(excerpt), `Missing blocker text: ${excerpt}`);
        break;
      }
      case 'activity': {
        const weeks = example.weeks ?? 2;
        assert.ok(Number.isInteger(weeks) && weeks >= 1 && weeks <= 52, 'Choose 1 to 52 activity weeks');
        const counts = planningActivity(state, weeks, now).map(row => [row.opened, row.completed]);
        assert.deepEqual(counts, example.expected);
        break;
      }
      case 'brief': {
        if (example.expectedError) {
          assert.throws(() => planMarkdown(state, evaluationId), error => error instanceof Error && error.message.includes(example.expectedError));
        } else {
          assert.ok(Array.isArray(example.expected.contains) && example.expected.contains.length, 'Declare expected brief text');
          const brief = planMarkdown(state, evaluationId);
          for (const excerpt of example.expected.contains) assert.ok(brief.includes(excerpt), `Missing brief text: ${excerpt}`);
          for (const excerpt of example.expected.excludes ?? []) assert.ok(!brief.includes(excerpt), `Unexpected brief text: ${excerpt}`);
        }
        break;
      }
    }
    assert.deepEqual(state, snapshot, 'Reporting must preserve the supplied workspace');
    console.log(`PASS ${filename}`);
  } catch (error) {
    failures++;
    console.error(`FAIL ${filename}: ${error.message}`);
  }
}
console.log(`${files.length - failures}/${files.length} reporting examples passed.`);
if (failures) process.exitCode = 1;
