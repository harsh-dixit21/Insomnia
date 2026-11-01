# ProofPlan — Clarity before commitment

ProofPlan uses the supplied meadow template with copy tailored to the IOMETE evaluation workflow. The animated headline, cloud layers, editorial interlude, scroll assembly, and closing scene lead into a matching meadow footer. The Driftbar logo and product copy are removed.

The example workflow introduces workload inputs, editable success criteria, and proposed tests. Download an illustrative Markdown evaluation plan from the test panel or footer; the file includes the criteria entered on the page. This is a presentation prototype, not a full assessment engine, and no benchmark results are claimed.

## Open the page

Open index.html directly in a modern browser, or use VS Code Live Server. All fonts, artwork, video, and scripts are local in driftbar-assets/; no React compilation or CDN access is needed.

For development with Vite, run npm ci, then npm run dev. Open the Local URL printed in the terminal. The port may change if another server is running.

## Check and build

Run npm run check for asset and script syntax checks. Run npm run build to create dist/, then npm run preview to serve it. Static checks do not verify browser effects or visual layout.

## Files

- index.html: supplied template page, styling, and interaction setup.
- driftbar-assets/: bundled media, fonts, GSAP, ScrollTrigger, TechText, and license notices.
- scripts/check-template.mjs: asset and syntax checks.
- IOMETE_PROOFPLAN.md: retained product research, separate from the new UI.

Entered criteria are temporary and remain in the browser. Footer links point to the project proposal and official IOMETE resources. This is an independent hackCBS concept for the IOMETE track. Included license notices are preserved; confirm rights to the supplied media before public distribution.
