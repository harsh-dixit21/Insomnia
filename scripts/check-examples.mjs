import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import {seed} from '../src/lib/insomnia.ts';
import {validateWorkspace} from '../src/lib/workspace-data.ts';
import {runTool, toolDefinitions} from '../src/lib/workbench.ts';

const directory = new URL('../examples/tools/', import.meta.url);
const selected = process.argv[2];
if (selected && !toolDefinitions.some(tool => tool.id === selected)) {
  throw new Error(`Unknown tool. Choose: ${toolDefinitions.map(tool => tool.id).join(', ')}`);
}
const files = (await readdir(directory)).filter(file => file.endsWith('.json')).sort();
assert.deepEqual(files, toolDefinitions.map(tool => `${tool.id}.json`).sort(), 'Provide exactly one example for every tool');
let failures = 0;
for (const filename of files) {
  if (selected && filename !== `${selected}.json`) continue;
  try {
    const example = JSON.parse(await readFile(new URL(filename, directory), 'utf8'));
    const definition = toolDefinitions.find(tool => `${tool.id}.json` === filename);
    assert.equal(example.tool, definition.id, 'Tool ID must match its example filename');
    assert.ok(typeof example.scenario === 'string' && example.scenario.trim(), 'Describe the example scenario');
    assert.ok(typeof example.limits === 'string' && example.limits.trim(), 'Explain the example limitations');
    assert.ok(example.inputs && typeof example.inputs === 'object' && !Array.isArray(example.inputs), 'Inputs must be an object');
    for (const [key, value] of Object.entries(example.inputs)) {
      assert.ok(definition.fields.some(field => field.key === key), `Unknown input: ${key}`);
      assert.equal(typeof value, 'string', `Input ${key} must be a string, as sent by the tool forms`);
    }
    for (const field of definition.fields) {
      const value = example.inputs[field.key];
      if (field.required) assert.ok(value?.trim(), `Missing required input: ${field.key}`);
      if (field.kind === 'select') assert.ok(field.options.includes(value), `Invalid choice: ${field.key}`);
      if (field.kind === 'checkbox' && value !== undefined) assert.ok(['true', 'false'].includes(value), `Invalid checkbox: ${field.key}`);
      if (field.kind === 'number' && value?.trim()) {
        const number = Number(value);
        assert.ok(Number.isFinite(number), `Invalid number: ${field.key}`);
        if (field.min !== undefined) assert.ok(number >= field.min, `${field.key} is below its minimum`);
        if (field.max !== undefined) assert.ok(number <= field.max, `${field.key} exceeds its maximum`);
      }
    }
    // A fresh synthetic workspace prevents one example from affecting another.
    const state = validateWorkspace(seed());
    const result = runTool(definition.id, example.inputs, state, state.evaluations[0].id);
    assert.ok(result.title && result.summary && result.sections.length, 'Expected a complete tool result');
    assert.ok(Array.isArray(example.expectedText) && example.expectedText.length, 'Declare observable output expectations');
    const output = JSON.stringify(result);
    for (const text of example.expectedText) {
      assert.ok(typeof text === 'string' && text.length, 'Expected text must be nonempty');
      assert.ok(output.includes(text), `Missing expected output: ${text}`);
    }
    console.log(`PASS ${definition.id}: ${result.summary}`);
    if (selected) console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    failures++;
    console.error(`FAIL ${filename}: ${error.message}`);
  }
}
console.log('Examples use synthetic local fixtures; no accounts, providers, clusters, or cloud workspaces are modified.');
if (failures) process.exitCode = 1;
