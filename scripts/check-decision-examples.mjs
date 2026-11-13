import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import {seed} from '../src/lib/insomnia.ts';
import {answerSecurity, benchmarkSummary, costModel} from '../src/lib/workbench.ts';

const directory = new URL('../examples/decisions/', import.meta.url);
const available = (await readdir(directory)).filter(file => file.endsWith('.json')).sort();
const selection = process.argv[2];
const filename = selection?.endsWith('.json') ? selection : `${selection}.json`;
if (selection && !available.includes(filename)) throw new Error('Unknown decision example.');
const files = selection ? [filename] : available;
assert.ok(files.length, 'Provide decision examples');

const defaultCosts = {
  plan:'Custom quote', vcpu:'100', quote:'12000', current:'5000',
  infrastructure:'1000', operations:'1000', support:'0', migration:'0', overlap:'0', years:'1',
};
let failures = 0;
for (const name of files) {
  try {
    const example = JSON.parse(await readFile(new URL(name, directory), 'utf8'));
    assert.ok(typeof example.scenario === 'string' && example.scenario.trim(), 'Describe the scenario');

    switch (example.operation) {
      case 'benchmark': {
        const state = seed();
        state.measurements = (example.series ?? []).flatMap((series, group) => {
          const workload = state.workloads.find(row => row.id === series.workloadId);
          assert.ok(workload && Array.isArray(series.seconds), 'Provide a known workload and timing series');
          return series.seconds.map((seconds, index) => ({
            id:`m-${group}-${index}`, evaluationId:workload.evaluationId, workloadId:workload.id,
            seconds, concurrency:series.concurrency, correct:series.correct ?? true, date:'2026-11-01',
          }));
        });
        const before = structuredClone(state);
        assert.ok(Array.isArray(example.expected), 'Declare expected benchmark rows');
        const evaluationId = example.evaluationId ?? state.evaluations[0].id;
        const result = benchmarkSummary(state, evaluationId, example.concurrency, example.samples);
        const actual = result.map(({report, status, p95, samples, failedCorrectness}) => ({report, status, p95, samples, failedCorrectness}));
        assert.deepEqual(actual, example.expected);
        assert.deepEqual(state, before, 'Benchmark review must preserve measurements and workloads');
        break;
      }
      case 'cost': {
        const inputs = {...defaultCosts, ...example.inputs};
        const before = {...inputs};
        const result = costModel(inputs);
        assert.ok(example.expected && Object.keys(example.expected).length, 'Declare expected cost values');
        for (const [key, expected] of Object.entries(example.expected)) {
          assert.ok(Object.hasOwn(result, key), `Unknown cost field: ${key}`);
          if (typeof expected === 'number') {
            assert.ok(Number.isFinite(result[key]) && Math.abs(result[key] - expected) < 0.00001, `${key}: expected ${expected}, received ${result[key]}`);
          } else {
            assert.equal(result[key], expected, key);
          }
        }
        assert.deepEqual(inputs, before, 'Cost calculation must preserve the supplied inputs');
        break;
      }
      case 'security': {
        assert.equal(typeof example.question, 'string', 'Provide a question');
        const answer = answerSecurity(example.question);
        assert.equal(answer.status, example.expected.status);
        assert.equal(answer.sourceId ?? null, example.expected.sourceId);
        assert.equal(answer.question, example.expected.question ?? example.question);
        assert.ok(answer.reason.includes(example.expected.reason), 'Expected the reason for the security classification');
        break;
      }
      default:
        throw new Error('Unknown decision operation');
    }
    console.log(`PASS ${name}`);
  } catch (error) {
    failures++;
    console.error(`FAIL ${name}: ${error.message}`);
  }
}
console.log(`${files.length - failures}/${files.length} decision examples passed.`);
if (failures) process.exitCode = 1;
