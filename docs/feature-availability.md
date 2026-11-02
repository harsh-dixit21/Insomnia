# Feature availability

This guide distinguishes implemented local functionality from routes migrated to the Vercel-native PostgreSQL backend. A visible interface does not establish that its cloud API route is available.

| Feature | Vercel-native backend | Local full-stack backend |
| --- | --- | --- |
| Landing page and documentation PDF | Available | Available after build |
| Signup, login, logout, and session recovery | PostgreSQL persistence | SQLite persistence |
| Personal workspace loading and editing | Available with revision checks | Available with revision checks |
| Dashboard insights | Computed from saved workspace | Computed from saved workspace |
| Nine evaluation tools and saved tool reports | Execution route not migrated | Server-side engines implemented |
| CSV imports | Import route not migrated | Workloads, measurements, and questionnaires |
| Backup restore, workspace reset, and exports | Routes not migrated | Implemented |
| Team invitations and membership roles | Routes not migrated | Implemented; real email requires SMTP |
| Password-reset delivery | Route not migrated | Requires SMTP for real delivery; local mode can write a private test mailbox |
| Enterprise SSO | Route not migrated | Requires an OIDC provider; local test provider available in development |
| Ollama-assisted answers | Route not migrated | Requires a reachable Ollama instance with a configured model |
| Live IOMETE SQL execution | Route not migrated | Requires a real IOMETE endpoint and credentials |
| External company research | Route not migrated | Requires a configured search provider |

## What the checks establish

`npm run check:cloud` checks public reachability, HTML entry points, PDF signature, API health, anonymous-session isolation, and rejection of unauthenticated workspace access. It does not supply credentials, run models, send email, query IOMETE, or verify collaboration.

For a manual cloud acceptance check, create a dedicated test account, edit a workspace, sign out, sign back in, and confirm the edit remains. Verify a wrong password is rejected and a logged-out browser cannot retrieve the private workspace. Avoid recording credentials or session cookies in screenshots and issue reports.

## Data boundaries

Cloud and local installations use separate databases. Local SQLite accounts, sessions, and workspaces are not automatically uploaded. Configuring an integration in a local `.env` file does not configure that service in Vercel.

Ollama explanations are generated from supplied context and evidence, not from a model trained specifically for this project. Review generated answers against their sources. Local SQL sandbox measurements are not evidence of live IOMETE performance.

See [deployment details](deployment.md) for configuration and [quick start](quick-start.md) for normal use.
