# ProofPlan

IOMETE evaluation workspace using the exact landing-page composition, animated video, TechText lettering, authentication artwork, dashboard shell, primitives, and chart styling imported from the SIH-1 Tenet project.

## Run

Use Node.js 22.12+:

```sh
npm ci
npm run dev
```

Open Vite's printed URL. The landing page is `/`; the workspace is `/portal/#auth`. Click **Open workspace**, or open `/portal/#dashboard` directly. Use Vite rather than Live Server because the workspace uses TypeScript and React.

```sh
npm test
npm run check:screens
npm run build
npm run preview
```

## Imported design

The video landing page, continuous crossfade, interactive heading, responsive menus, monochrome styling, animated authentication canvas, sidebar, dashboard cards, charts, tables, buttons, inputs, badges, avatars, progress, floating dock, and motion primitives come from `C:\SIH\tenet-source`. Domain screens have been adapted to ProofPlan. Older optional visual components remain available in `src/components/ui`.

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

Every tool runs against a selected company evaluation. A successful run saves its inputs, generated report, source topics, and timestamp. Saved tool reports are included in company brief exports.

| Tool | Implemented logic |
| --- | --- |
| Product guide | Local topic retrieval from a curated official-documentation snapshot, with stakeholder-specific questions and explicit unsupported queries |
| Use-case finder | Equal-weight rules mapping stated needs to capabilities, with transactional-workload and fully managed SaaS conflicts surfaced |
| Deployment readiness | Checks buyer-supplied services, installation resource floors, owners, and offline-delivery readiness; missing values remain unknown |
| Business case | USD cash-cost model with license commitments, infrastructure, operations, services, migration, parallel operation, savings and simplified payback |
| Call preparation | Agenda timing, role-specific questions, supplied company facts, selected evaluation requirements and unresolved tests |
| Demo planner | Industry-specific synthetic data schema, scenario, roles, focus and timed acceptance checkpoints |
| Security questionnaire | Conservative public-topic matching, question CSV import, compound-question detection and computed unknown rate; no compliance certification inferred |
| Benchmark review | Measurement CSV import, report coverage, nearest-rank p95, minimum samples, concurrency gates and correctness failures |
| Migration review | Comment/literal-aware SQL heuristic flags, critical report targets and CDC/reconciliation gates |

Official knowledge and licensing snapshots were reviewed on November 1, 2026. Sources and commercial assumptions are visible in the generated output. Confirm current terms and customer-specific applicability with IOMETE. SQL flags are review items, not compatibility guarantees.

New workspaces start empty. Optional sample companies are loaded only through Settings; existing workspace data migrates forward. Dashboard figures derive from actual stored rows, and weekly activity derives from event and saved-report timestamps. No fixed chart series is used.

Changes persist in this browser under a separate ProofPlan key, with synchronization across tabs. Backup/restore validates IDs, relationships, dates, tests, measurements and saved-report shapes. Settings includes explicit reset and sample-data controls. Recorded measurements are user-provided, never independently verified. There are no placeholder OAuth buttons or account creation. Role selection changes the workspace perspective, not security permissions.

The business case assumes constant USD cash costs and does not infer taxes, inflation, discount rates, workload capacity, productivity gains, or vendor discounts. Custom and Business Critical licenses require an entered quote.

Automated checks cover calculation boundaries, unknown handling, CSV validation, source attribution, benchmark failure gates, migration flags, backup migration and an evaluation-to-report integration workflow. All 23 workspace routes are server-rendered against populated and empty states.

The app is a working browser-local evaluation and sales workspace. It does not connect to customer clusters, run SQL benchmarks, fetch live company intelligence, or provide shared server accounts. Product guidance uses deterministic local retrieval rather than a connected language model. Official source links require network access. The original external font links are retained from Tenet. Visual browser verification is pending; this session's prior browser origin approval was denied.
