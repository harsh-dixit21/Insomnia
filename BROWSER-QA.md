# Browser interaction verification

Verified November 1, 2026 against the local full-stack app at `http://127.0.0.1:5181` using synthetic accounts and development services.

| Workflow | Observed result |
| --- | --- |
| Account creation | Created a synthetic QA account and loaded an empty persisted dashboard |
| Wrong password | Displayed “Invalid email or password.” and preserved entered form values |
| Logout | Returned to sign-in and revoked the session |
| Password recovery request | Displayed the local-delivery notice; confirmed a reset message exists in the private outbox |
| SQL execution | Aggregated synthetic sales into North 1,800, South 800 and West 1,400; retained the sandbox label |
| Company research | Returned the explicitly fictional Northstar Bank profile |
| Model inference | Generated and saved a real Ollama `qwen2.5:1.5b` answer with retrieved documentation visible alongside it |
| Invitation | Saved a viewer invitation for a synthetic teammate to the local outbox; showed pending invitation and actor history |
| Mobile navigation | Opened the navigation sheet, selected Team, and closed the sheet on navigation |
| Local OIDC SSO | Completed provider sign-in, returned through the signed callback, and loaded the `demo@insomnia.local` session |
| Session recovery | A fresh visit to the auth URL resumed the SSO session and opened the dashboard without another login |
| Layout | Inspected screenshots at 1440, 768 and 390 pixels; controls and content remained usable |

Browser testing caught two local-provider issues that HTTP tests alone did not expose: `no-referrer` caused a null Origin on the HTML form POST, and the form CSP needed the exact application callback origin for the redirect chain. The provider now uses a same-origin referrer policy, retains a strict origin check, and permits the configured callback origin. Regression assertions cover both headers.

Screenshots are saved locally under `output/browser/` and excluded from source control. Synthetic accounts, outbox messages, credentials, model files and SQLite databases are also excluded from Git.

Password-reset completion, token expiry/replay, invitation acceptance and email binding, member downgrades/removal, viewer write denial, stale revisions, provider failures, signed-token checks, SMTP submission and account isolation are covered by HTTP integration tests. Browser password changes were not performed. This is a focused local interaction review, not exhaustive device coverage, an independent accessibility audit, load testing, or verification of externally hosted providers.
