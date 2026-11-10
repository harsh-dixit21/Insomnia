# Valid workspace compatibility examples

Run the compatibility suite with Node.js 24.11 or a newer Node 24 release.

```sh
npm run check:workspace-compatibility
npm run check:workspace-compatibility -- legacy.all-optional-fields
npm run check:workspace-compatibility -- evaluation.leap-day.json
```

These 37 cases complement the workspace rejection suite by checking that valid backups remain usable. Each case starts with a valid synthetic workspace, applies one declared change, and checks the returned values. The runner also verifies that the supplied backup is preserved and that the validated result survives JSON serialization and another validation pass.

| Area | Covered compatibility |
| --- | --- |
| Legacy backups | Missing report collection, measurement collection, sample marker, and all three together |
| Workspace state | Empty workspace and explicit real/sample markers |
| Settings | Reminder boundaries, multilingual names, and punctuation |
| Evaluations | Supported statuses, valid leap-day deadline, offset timestamp, multilingual company, and multiline requirements |
| Workloads | Zero baseline, fractional baseline, positive subsecond target, and both critical flags |
| Acceptance tests | Passed/failed tests with observations, proposed tests awaiting observations, and multilingual owners |
| Activity and reports | Multilingual activity and offset timestamps |
| Measurements | Zero/fractional duration, minimum/high concurrency, both correctness flags, and offset timestamps |

Each fixture declares `base`, `operation`, and `expectedValues`. The `seed` base includes synthetic evaluations plus a generated migration report, measurement, and activity event. The `empty` base uses the application's empty-workspace factory.

The `patch` operation merges `changes` into the declared workspace target. The `omit` operation removes optional legacy fields. Each expected value has a field/index `path` and a JSON `value`. Targets and paths are validated before use.

For legacy fixtures, the expected recovered collections are empty arrays and the historical sample-marker default is `true`. Explicit sample markers retain their value. Timestamp fixtures preserve their supplied offsets as text. Recorded measurements and test observations remain supplied evidence that needs review in an actual evaluation.

See the [workspace rejection suite](../workspace-rejections/README.md) for corrupted-data cases and [feature availability](../../docs/feature-availability.md) for the current local/cloud workflow boundaries.
