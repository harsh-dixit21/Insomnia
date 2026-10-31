# Running and contributing to ProofPlan

## Local setup

Use Node.js 22.12 or newer and npm. Open the repository folder in VS Code, then run:

```sh
npm ci
npm run dev
```

Open Vite's printed Local URL. If the default port is occupied, Vite selects another port, so use the terminal's current URL.

VS Code also provides **Terminal → Run Task → Start ProofPlan**. Use **Terminal → Run Build Task** to check and build the application.

## Checking a change

```sh
npm run check
npm run build
npm run preview
```

The render check verifies the hero content, supplied text component, scene wrapper, and error recovery. It does not execute browser effects or validate WebGL output.

Before submitting visual changes, review the first hero, cloud transition, and second hero at desktop and phone widths. Check keyboard focus, the plan dialog, Markdown export, pause control, and the operating system's reduced-motion preference.

## Troubleshooting

- **Startup instructions stay visible:** Use Vite's URL. Opening the source HTML directly or using Live Server does not compile the JSX modules.
- **Recovery screen appears:** Reload once, then inspect the browser console for the specific error.
- **Meadow media does not load:** The supplied video, poster, and Google Font need network access. Verify their requests in browser developer tools.
- **Port already in use:** Open the alternative URL printed by Vite, or stop your previous development server.

Keep proposed evaluation tests labeled as proposals. Never present simulated benchmark results as measured customer evidence.
