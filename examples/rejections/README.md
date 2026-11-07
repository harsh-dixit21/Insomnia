# Invalid-input examples

Run the local validation scenarios with Node.js 24.11 or a newer Node 24 release.

```sh
npm run check:rejections
```

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
