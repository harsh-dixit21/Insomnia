# Walk through a reporting evaluation

This exercise uses fictional values to show how requirements, workload evidence, tool reports, and a final recommendation fit together. Use the local full-stack application: the current Vercel-native API does not implement all of these routes. Nothing in this exercise proves live IOMETE performance.

## Define the decision

Create an evaluation for a fictional company, Example Manufacturing, with a named owner and a future deadline. Record this requirement: "Review two reporting workloads at concurrency 10. Both must meet their latency targets and reconcile with the source results."

Use the product guide to explain open tables, then the use-case finder to assess analytics and customer-controlled infrastructure. If the primary requirement is transactional point lookups, keep that conflict visible instead of treating an analytics result as proof of transactional suitability.

## Add the workload inventory

Add these workloads using the form, with exactly these report names. All times are illustrative seconds.

| Report | Baseline | Target | Critical |
| --- | --- | --- | --- |
| Daily inventory summary | 12 | 5 | No |
| Critical stock lookup | 4 | 2 | Yes |

Assign test owners separately. A generated tool report does not automatically mark their acceptance tests passed.

## Import illustrative measurements

Save this text as a CSV file or paste it into the measurement import form for that evaluation:

```csv
report,seconds,concurrency,correct
Daily inventory summary,3.2,10,true
Daily inventory summary,4.4,10,true
Critical stock lookup,1.2,10,true
Critical stock lookup,1.8,10,false
```

Run Benchmark review with minimum concurrency `10` and minimum samples `2`. The summary report's nearest-rank p95 is 4.4 seconds, within its 5-second target. The critical lookup's p95 is 1.8 seconds, but its recorded correctness failure prevents a pass. Faster execution cannot compensate for an incorrect result.

Do not change a failing observation merely to obtain a positive result. In a real pilot, diagnose the discrepancy, document the cause, and record a clearly identified new measurement set under your agreed evidence policy.

## Review the other gates

- Run deployment readiness with the buyer's actual infrastructure inputs. Installation minimums are not production sizing or an inspected environment.
- Use the business-case example as a template, replacing its fictional quote and costs with verified assumptions. Include migration effort and parallel operation.
- Prepare a discovery call to resolve unknowns; generated agendas do not count as completed research.
- Review SQL compatibility flags and plan target-engine execution with correctness reconciliation.
- Keep unknown security answers for a qualified reviewer. Do not convert an unanswered guarantee into an assurance.
- Use a synthetic-data demo plan to agree what will be shown and how success will be measured. A runbook is not an executed demonstration.

## Preserve and explain the outcome

Export the evaluation plan, relevant tool reports, and a workspace backup. Reopen the reports to check their supplied inputs, timestamps, source references, and limitations. A restored report is historical evidence, not proof that the current server reran its analysis.

The defensible conclusion for this fixture is: "The reporting pilot has an unresolved critical correctness failure; adoption is not approved on these measurements." Record an owner and next step for that blocker rather than hiding it behind aggregate latency.

See [runnable tool examples](../examples/README.md) for engine-only checks and [feature availability](feature-availability.md) before demonstrating the public website.
