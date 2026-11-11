# CSV import examples

Run the CSV suite using Node.js 24.11 or a newer Node 24 release.

```sh
npm run check:csv
npm run check:csv -- workloads.at-row-limit
npm run check:csv -- measurements.foreign-evaluation.json
```

The 53 cases exercise three operations.

| Operation | Cases | Coverage |
| --- | ---: | --- |
| CSV parser | 15 | Line endings, quoted commas, escaped quotes, multiline fields, Unicode, empty fields, blank records, and unclosed quotes |
| Workload import | 23 | Header normalization, typed values, report names, row order, malformed fields, row-specific errors, and the 1,000-report limit |
| Measurement import | 15 | Typed timings and correctness, report resolution within one evaluation, ambiguous names, quoted names, and the 10,000-measurement limit |

Each JSON case supplies `operation`, `scenario`, and `csv`. A successful case declares `expectedRows`. A rejection case declares an `expectedError` excerpt. Import cases check generated IDs, evaluation scope, and measurement timestamps separately from the expected values. Every case checks that processing preserves the supplied workspace.

Boundary cases use `repeat` to expand the row after the header. The `{{row}}` placeholder expands to the one-based row number for cases that need distinct report names. A repeated success fixture lists the expected first and last row and checks the full row count. Measurement cases can supply an `inventory` with report IDs, names, and evaluation indexes to test how matching works.

For examples that also exercise stored workspace validation, see the [workspace compatibility suite](../workspace-compatibility/README.md) and [workspace rejection suite](../workspace-rejections/README.md).
