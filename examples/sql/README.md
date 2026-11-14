# SQL sandbox examples

Run the suite with Node.js 24.11 or a newer Node 24 release.

```sh
npm run check:sql
npm run check:sql -- exact-row-cap
npm run check:sql -- stacked-write-after-literal.json
```

The 53 cases call the SQL integration in local mode. Each executable query gets a fresh SQLite worker with synthetic `sales` and `customers` records.

| Area | Checks |
| --- | --- |
| Read-only queries | Filters, sorting, grouping, joins, subqueries, CTEs, and `UNION ALL` |
| Quoting and comments | Escaped apostrophes, semicolons in strings, comment markers in strings, and keywords in comments |
| Boundaries | 20,000 versus 20,001 characters, 100 versus 101 result rows, empty results, and null values |
| Rejected statements | Empty or mistyped input, writes, schema changes, multiple statements, recursive CTEs, invalid references, and file functions |

Each fixture provides `scenario` and `sql`. Successful fixtures specify `columns` and `rows`. Fixtures with `rowCount` check the total returned rows and the first and last row. The `truncated` flag defaults to `false`. Rejection fixtures specify `expectedError` so unrelated failures cannot satisfy the check.

Length fixtures specify the exact SQL `length` and a `{{padding}}` marker inside a comment. The runner expands the marker before calling the integration.

The suite verifies the local guard and SQLite worker. A live IOMETE validation requires a configured endpoint, a read-only database principal, and representative queries against the target cluster.
