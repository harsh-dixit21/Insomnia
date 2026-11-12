# Evaluation reporting examples

Run the reporting suite with Node.js 24.11 or a newer Node 24 release.

```sh
npm run check:reporting
npm run check:reporting -- activity.week-boundary
npm run check:reporting -- brief.evaluation-scope.json
```

The 53 cases exercise the reporting helpers with synthetic workspace data and a fixed reference date. The runner sets UTC for calendar boundaries, validates each workspace, and checks that generating the result preserves the supplied data.

| Area | Cases | Checks |
| --- | ---: | --- |
| Readiness | 12 | Recorded passes, percentage rounding, failed or proposed tests, and evaluation scope |
| Blockers | 16 | Recorded failure details, unassigned owners, reminder settings, due dates, overdue dates, and completed tests |
| Weekly activity | 12 | Inclusive window start, exclusive window end, week boundaries, and separate event and report counts |
| Markdown briefs | 13 | Evaluation details, requirements, workload targets, recorded observations, sources, Unicode, and evaluation scope |

Each fixture declares an `operation` and an `expected` result. Optional `evaluation` fields override the selected synthetic evaluation, while `workspace` supplies collections and settings. `evaluationId` selects the evaluation for readiness or export. Activity and blocker cases use `now` when supplied. Activity cases can also select the number of `weeks`.

Readiness expectations are percentages. Blocker expectations list ordered `ids` and optional text excerpts. Activity expectations are `[event count, report count]` pairs ordered from oldest to newest. Brief cases check `contains` and optional `excludes` excerpts, or declare an `expectedError` for a missing evaluation.

The reporting suite runs in GitHub Actions alongside the [workspace validation examples](../workspace-rejections/README.md) and [tool examples](../README.md).
