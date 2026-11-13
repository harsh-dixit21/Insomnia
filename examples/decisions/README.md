# Evaluation decision examples

Run the decision suite with Node.js 24.11 or a newer Node 24 release.

```sh
npm run check:decisions
npm run check:decisions -- benchmark.target-equality
npm run check:decisions -- cost.combined-transition.json
```

The 53 examples check the results that support three evaluation decisions.

| Area | Cases | Checks |
| --- | ---: | --- |
| Benchmark review | 20 | Eligible samples, percentile rank, workload targets, correctness gates, and evaluation scope |
| Cost comparison | 16 | Monthly components, one-time costs, overlap, payback, fractional amounts, and stored pricing boundaries |
| Security review | 17 | Documentation matches, evidence source selection, compound questions, and requests for customer-specific assurance |

Benchmark cases declare timing `series` for known sample workloads. Each series supplies a workload ID, durations in seconds, concurrency, and an optional correctness flag. Expected report rows include status, p95, eligible sample count, and the recorded correctness flag. Readiness for a real pilot depends on actual measured data.

Cost cases override synthetic baseline `inputs` and assert selected model outputs. The annual minimums and rate thresholds exercise the pricing snapshot in the engine. A real decision requires a current quote and buyer-approved cost assumptions.

Security cases supply a `question` and check the review status, source topic, and reason. A documentation draft identifies a capability described in the project snapshot. Customer-specific configuration and assurance require separate evidence.

See the [tool examples](../README.md) for complete generated reports and the [CSV suite](../csv/README.md) for measurement import behavior.
