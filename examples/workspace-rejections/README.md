# Workspace backup validation examples

Run the workspace validation checks using Node.js 24.11 or a newer Node 24 release.

```sh
npm run check:workspace-rejections
npm run check:workspace-rejections -- evaluation.impossible-deadline
npm run check:workspace-rejections -- measurement.duplicate-id.json
```

The 37 fixtures exercise the validator shared by workspace loading and backend save/restore flows. Each case starts with a synthetic sample workspace containing a valid tool report, measurement, and activity event. The runner validates that starting state before applying the declared change.

A case passes when the validator throws the expected error and leaves the supplied backup unchanged. The runner fails on unexpected success, a different exception, an invalid fixture, or a changed backup. These engine checks complement the existing authenticated save/restore tests.

| Area | Covered cases |
| --- | --- |
| Root and version | Null backup and unsupported version |
| Workspace settings | Blank name, fractional reminder, zero reminder, and reminder above ninety days |
| Evaluations | Duplicate IDs, missing company/name/platform/owner/requirements, invalid dates, impossible calendar dates, and unsupported status |
| Workloads | Missing parent evaluation, blank report name, negative baseline, zero target, and invalid critical flag |
| Acceptance tests | Missing parent evaluation, unsupported status, missing observations for passed or failed tests, and nontext results |
| Activity | Invalid date and nontext action |
| Saved tool reports | Unknown tool and unsupported source reference |
| Measurements | Missing evaluation or workload, negative duration, fractional concurrency, invalid correctness flag, invalid timestamp, and duplicate IDs |

Fixtures use three operations. `patch` merges `changes` into the workspace, its settings, or the first row of an allowed collection. `duplicate` copies the first row of a collection with its original ID. `replace` uses a null root. Every fixture includes a scenario and an expected validation error excerpt. Target collections are restricted to evaluations, workloads, tests, events, artifacts, and measurements.

The fixtures are descriptions for the local checker. To restore an actual workspace, use a full backup exported through the application and consult the [availability guide](../../docs/feature-availability.md).
