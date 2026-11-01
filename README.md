# ProofPlan

IOMETE evaluation workspace using the exact landing-page composition, animated video, TechText lettering, authentication artwork, dashboard shell, primitives, and chart styling imported from the SIH-1 Tenet project.

## Run

Use Node.js 22.12+:

```sh
npm ci
npm run dev
```

Open Vite's printed URL. The landing page is `/`; the workspace is `/portal/#auth`. Click **Continue to demo**, or open `/portal/#dashboard` directly. Use Vite rather than Live Server because the workspace uses TypeScript and React.

```sh
npm test
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

Changes persist in this browser under a separate ProofPlan key. Companies and chart activity are illustrative. Recorded measurements are user-provided, never independently verified by this prototype. OAuth buttons explain their unavailable state; no accounts are created. Role selection changes the demo perspective, not security permissions.

The interface prepares an evaluation and does not execute IOMETE benchmarks. Official source links require network access. The original external font links are retained from Tenet. Visual browser verification is pending; this session's prior browser origin approval was denied.
