# Insomnia

IOMETE evaluation workspace using the exact landing-page composition, animated video, TechText lettering, authentication artwork, dashboard shell, primitives, and chart styling imported from the SIH-1 Tenet project.

The hero's **Documentation** button opens the [product and technical PDF](public/docs/insomnia-documentation.pdf). It covers every current tool, workflow, backend behavior, setup, strengths and unfinished integrations. The guide describes implementation evidence rather than claiming an independently proven market ranking. Regenerate with `python scripts/generate-documentation.py` using a Python environment with ReportLab installed; the PDF is already bundled for normal app use.

## Run

Use Node.js 24.11+ (the backend uses Node's built-in SQLite support):

```sh
npm ci
npm run dev
```

Open the printed full-stack URL, normally `http://127.0.0.1:5181/`. The landing page is `/`; sign in or create an account at `/portal/#auth`. The UI and API run on the same origin. Use `npm run dev` rather than Live Server or a standalone Vite server.

```sh
npm test
npm run check:screens
npm run build
npm run preview
```

`npm run dev` starts the API with Vite middleware. `npm run build` creates the production frontend; `npm start` (also `npm run preview`) serves that frontend and the API. Data persists in `.data/insomnia.sqlite`, excluded from Git. Restarting the server preserves accounts, sessions and workspaces.

For previous browser-only workspaces: sign in, open Settings, and choose **Import previous browser data**. Browser storage is origin-specific; if the old app ran on another port, export its JSON backup there and restore it in the new account instead. Import is explicit and replaces the destination workspace after confirmation.

## Imported design

The video landing page, continuous crossfade, interactive heading, responsive menus, monochrome styling, animated authentication canvas, sidebar, dashboard cards, charts, tables, buttons, inputs, badges, avatars, progress, floating dock, and motion primitives come from `C:\SIH\tenet-source`. Domain screens have been adapted to Insomnia. Older optional visual components remain available in `src/components/ui`.

No Tenet credentials, Firebase configuration, backend functions, financial data, hosting identity, Git metadata, or environment files were copied. The source project is unchanged.

## Workflow

- Create and search company evaluations.
- Define buyer success criteria.
- Import report inventories using the downloadable CSV template.
- Assign test owners, criteria, and recorded observations.
- Browse official IOMETE evidence links and unresolved blockers.
- Export evaluation briefs in Markdown.
- Inspect activity, companies, reports, and workspace settings.
- Add custom tests, edit evaluation metadata, and enter workloads manually.
- Back up and restore the whole workspace as validated JSON.

## IOMETE workbench

Every tool executes on the backend against a selected company evaluation. A successful run saves its inputs, generated report, source topics, and server timestamp. Saved tool reports are included in server-generated company brief exports. Generic client edits cannot create or alter authoritative tool outputs.

| Tool | Implemented logic |
| --- | --- |
| Product guide | Server-side topic retrieval from a curated official-documentation snapshot, with stakeholder-specific questions and explicit unsupported queries |
| Use-case finder | Equal-weight rules mapping stated needs to capabilities, with transactional-workload and fully managed SaaS conflicts surfaced |
| Deployment readiness | Checks buyer-supplied services, installation resource floors, owners, and offline-delivery readiness; missing values remain unknown |
| Business case | USD cash-cost model with license commitments, infrastructure, operations, services, migration, parallel operation, savings and simplified payback |
| Call preparation | Agenda timing, role-specific questions, supplied company facts, selected evaluation requirements and unresolved tests |
| Demo planner | Industry-specific synthetic data schema, scenario, roles, focus and timed acceptance checkpoints |
| Security questionnaire | Conservative public-topic matching, question CSV import, compound-question detection and computed unknown rate; no compliance certification inferred |
| Benchmark review | Measurement CSV import, report coverage, nearest-rank p95, minimum samples, concurrency gates and correctness failures |
| Migration review | Comment/literal-aware SQL heuristic flags, critical report targets and CDC/reconciliation gates |

Official knowledge and licensing snapshots were reviewed on November 1, 2026. Sources and commercial assumptions are visible in the generated output. Confirm current terms and customer-specific applicability with IOMETE. SQL flags are review items, not compatibility guarantees.

New account workspaces start empty. Optional sample companies are loaded only through Settings. Dashboard figures derive from persisted rows, and weekly activity derives from server-recorded changes and saved-report timestamps. No fixed chart series is used.

Changes persist in SQLite under the signed-in account. The browser waits for server acknowledgment before showing saved state or clearing forms. Revision checks reject concurrent overwrites; conflicts reload the latest state and ask the user to review and retry. Focus and periodic refresh keep sessions current. Session expiry returns the user to sign-in.

Backup/restore validates IDs, relationships, dates, tests, measurements and saved-report shapes. Restored report snapshots are labeled imported rather than treated as server-generated evidence. An append-only database audit remains intact across resets and imports. Recorded measurements remain user-provided, never independently verified. Perspective selection changes the view, not security permissions; each account owns its workspace and cannot access another account's data.

Accounts use salted scrypt password hashes, opaque HTTP-only session cookies, CSRF checks, origin checks, and authentication rate limiting. Logout revokes the session. No real accounts or passwords are included in the repository. Email verification, password reset delivery, shared-team membership, and OAuth are not implemented.

The business case assumes constant USD cash costs and does not infer taxes, inflation, discount rates, workload capacity, productivity gains, or vendor discounts. Custom and Business Critical licenses require an entered quote.

Automated checks cover calculation boundaries, unknown handling, CSV validation, source attribution, benchmark gates, migration flags, backup migration, and an evaluation-to-report workflow. HTTP integration tests exercise all nine tool endpoints, persistence after restart, account isolation, CSRF, concurrent revisions, exports, imports, resets, audit records and logout. All 23 workspace routes are server-rendered against populated and empty states.

The app is a working account-based evaluation and sales workspace. It does not connect to customer clusters, execute SQL benchmarks, fetch live company intelligence, or call a language model. Those need specific integrations and credentials. Product guidance and planning use deterministic server logic with an official-documentation snapshot. Official links require network access. The original external font links are retained from Tenet. Visual browser verification is pending; this session's prior browser origin approval was denied.

## Server configuration

Copy `.env.example` to `.env` to override the port, host, database path, or expected origin. By default the server listens only on the local computer. For remote hosting, configure HTTPS and secure cookies, preserve the database on a durable volume, and keep backups. This is a single-server SQLite application; production operations and multi-server database coordination need separate deployment work.

The API caps requests at 5 MB and saved workspace data at 4 MB; archive or delete older reports and samples when needed. CSV imports are bounded, and the most recent 2,000 workspace events are included in snapshots. The database audit is stored separately.
