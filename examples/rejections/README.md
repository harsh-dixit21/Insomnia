# Invalid-input examples

Run the local validation scenarios with Node.js 24.11 or a newer Node 24 release.

```sh
npm run check:rejections
```

To run one case, pass its filename or its name without the `.json` suffix.

```sh
npm run check:rejections -- measurements.blank-duration
npm run check:rejections -- business.zero-vcpu.json
```

The suite contains 54 rejection cases. Every case also compares the workspace before and after the rejected operation to verify that the data is preserved. An unknown selector fails before any case runs.

Each JSON file declares an operation, an invalid input, and the validation message expected from the existing engine. A check passes when the operation rejects that input with the declared message. Unexpected success and unrelated exceptions both fail the check.

Tool scenarios reuse the corresponding base example from `../tools` and apply the declared input overrides. Measurement scenarios call the workbench CSV importer with their own CSV text. Each check starts with a fresh synthetic sample workspace.

| Area | Covered failures |
| --- | --- |
| Product guide | Blank questions and invalid audiences |
| Deployment readiness | Invalid environments, negative CPU, and nonfinite memory |
| Business case | Fractional capacity or years, overlap beyond the horizon, absent quotes, negative costs, nonfinite costs, and invalid plans |
| Discovery calls | Unsafe source URL schemes, invalid stakeholders, short calls, and blank goals |
| Demo planning | Invalid industries or focus choices and excessive duration |
| Security review | Blank questionnaires |
| Benchmark review | Fractional concurrency and zero or negative sample requirements |
| Measurement import | Incorrect headers, unknown reports, negative durations, and invalid correctness values |

The checks execute the existing local engines and importer. Authentication, browser behavior, and external integration coverage are tracked separately in the project's test suite and availability guide.

To add a case, choose `tool` or `measurements` as its operation. Tool cases require a known `tool` ID and string-valued `inputs`. Measurement cases require `csv`. Every case needs a `scenario` and a nonempty `expectedError` excerpt. Run both the runnable examples and rejection checks after changing shared base inputs.

The additional cases below exercise CSV shape, blank values, numeric limits, and tool boundaries. Cost constraints reflect the bundled engine snapshot. Verify current commercial terms independently when evaluating a real quote.

| Case | Expected error excerpt |
| --- | --- |
| [measurements.empty-data](./measurements.empty-data.json) | Import between 1 and 10,000 measurements. |
| [measurements.extra-column](./measurements.extra-column.json) | use a unique existing report name |
| [measurements.missing-column](./measurements.missing-column.json) | use a unique existing report name |
| [measurements.blank-duration](./measurements.blank-duration.json) | nonnegative seconds |
| [measurements.infinite-duration](./measurements.infinite-duration.json) | nonnegative seconds |
| [measurements.nonnumeric-duration](./measurements.nonnumeric-duration.json) | nonnegative seconds |
| [measurements.zero-concurrency](./measurements.zero-concurrency.json) | positive whole concurrency |
| [measurements.negative-concurrency](./measurements.negative-concurrency.json) | positive whole concurrency |
| [measurements.fractional-concurrency](./measurements.fractional-concurrency.json) | positive whole concurrency |
| [measurements.blank-concurrency](./measurements.blank-concurrency.json) | positive whole concurrency |
| [measurements.blank-correctness](./measurements.blank-correctness.json) | true/false correctness |
| [measurements.report-case-mismatch](./measurements.report-case-mismatch.json) | use a unique existing report name |
| [measurements.reordered-header](./measurements.reordered-header.json) | Use headers: report,seconds,concurrency,correct |
| [measurements.blank-report](./measurements.blank-report.json) | use a unique existing report name |
| [business.zero-vcpu](./business.zero-vcpu.json) | vcpu: enter a number |
| [business.horizon-too-long](./business.horizon-too-long.json) | years: enter a number |
| [business.overlap-too-long](./business.overlap-too-long.json) | overlap: enter a number |
| [business.negative-quote](./business.negative-quote.json) | quote: enter a number |
| [business.blank-current-cost](./business.blank-current-cost.json) | current: enter a number |
| [business.zero-horizon](./business.zero-horizon.json) | years: enter a number |
| [business.critical-quote-floor](./business.critical-quote-floor.json) | Business Critical public minimum |
| [deployment.negative-service-memory](./deployment.negative-service-memory.json) | servicesRam: enter a number |
| [deployment.negative-spark-cpu](./deployment.negative-spark-cpu.json) | sparkCpu: enter a number |
| [deployment.invalid-spark-memory](./deployment.invalid-spark-memory.json) | sparkRam: enter a number |
| [deployment.invalid-kubernetes-answer](./deployment.invalid-kubernetes-answer.json) | Choose a valid option. |
| [call.too-long](./call.too-long.json) | minutes: enter a number between 10 and 120. |
| [demo.too-short](./demo.too-short.json) | minutes: enter a number between 10 and 90. |
