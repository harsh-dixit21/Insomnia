# SQL migration review examples

```sh
npm run check:migration
npm run check:migration -- line-marker-in-string
```

The 52 fixtures exercise the migration review tool with synthetic SQL and workspace data. They cover each recognized flag, quoted strings and identifiers, Oracle alternative quoting, line endings, comment markers within quotes, and the review gates for change data capture and reconciliation.

Each fixture contains a `scenario`, `sql`, and ordered `expectedFlags`. Flag strings identify the beginning of the corresponding review line. An empty list expects the tool to report that it found no recognized flags. Optional `gates` supply answers for `cdc` and `reconcile`. `expectedGates` checks the resulting guidance.

Treat the results as prompts for manual review. Confirm SQL behavior against the target engine and record correctness, concurrency, and latency evidence for each critical report.
