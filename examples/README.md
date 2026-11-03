# Runnable evaluation examples

These examples exercise all nine local evaluation engines with fictional inputs and a fresh sample workspace. They do not connect to IOMETE, call Ollama, send email, or modify the public deployment.

Use Node.js 24.11 or a newer Node 24 release, then run:

```sh
npm ci
npm run check:examples
```

To print complete results for all cases of a single tool:

```sh
npm run check:examples -- business
npm run check:examples -- benchmark
```

Each JSON file contains the tool ID, a scenario, form-compatible string inputs, expected output excerpts, and a statement of its limits. The checker verifies tool coverage, recognized fields, required values, option choices, numeric bounds, and the expected output of the actual engine. Expectations check behavior rather than guarantee the accuracy of external documentation.

| Example | What to examine |
| --- | --- |
| [Product explanation](tools/explainer.json) | Source-grounded guidance for a data engineer |
| [Use-case assessment](tools/fit.json) | A transactional requirement blocks an uncomplicated recommendation |
| [Deployment readiness](tools/deployment.json) | Missing PostgreSQL and unknown air-gap/ingress arrangements |
| [Business case](tools/business.json) | A synthetic custom quote with migration and parallel-run costs |
| [Call preparation](tools/call.json) | A finance agenda without invented company research |
| [Demo planning](tools/demo.json) | A manufacturing governance runbook with permission checks |
| [Security review](tools/security.json) | An unsupported regulatory guarantee remains unknown |
| [Benchmark review](tools/benchmark.json) | A critical report cannot pass without measured evidence |
| [Migration review](tools/migration.json) | Oracle-specific syntax triggers review rather than an automatic compatibility claim |

You can copy the inputs into the corresponding local workbench forms. The JSON files are developer examples, not workspace backups; do not upload them through Restore. In the current Vercel-native backend, tool execution routes have not been migrated. See [feature availability](../docs/feature-availability.md).

For a complete manual exercise, follow the [sample evaluation walkthrough](../docs/sample-evaluation.md).

Each tool also has two named variations using the `tool.case.json` naming convention. The benchmark variations import fictional measurements through the same CSV parser used by the workbench. Run `npm run check:examples -- benchmark` to compare missing evidence, a passing run, and a correctness failure below the latency target.

| Tool | Additional cases |
| --- | --- |
| Product explanation | [Unsupported question](tools/explainer.unsupported.json), [finance audience](tools/explainer.finance.json) |
| Use-case assessment | [Analytics shortlist](tools/fit.analytics.json), [managed-service requirement](tools/fit.managed.json) |
| Deployment readiness | [Unconfirmed inputs](tools/deployment.unknown.json), [capacity below installation floors](tools/deployment.floor.json) |
| Business case | [Higher costs](tools/business.loss.json), [first-year break-even](tools/business.break-even.json) |
| Call preparation | [Engineering acceptance criteria](tools/call.engineering.json), [security evidence ownership](tools/call.security.json) |
| Demo planning | [Retail portability](tools/demo.portability.json), [banking latency](tools/demo.latency.json) |
| Security review | [Compound question](tools/security.compound.json), [documented capability](tools/security.capability.json) |
| Benchmark review | [Passing measurements](tools/benchmark.pass.json), [correctness failure](tools/benchmark.correctness.json) |
| Migration review | [Keywords in comments and strings](tools/migration.comments.json), [hierarchy and writes](tools/migration.hierarchy.json) |
