# Driftbar meadow template

The previous ProofPlan interface has been replaced with the supplied driftbar-template.zip design. The template's branding, layout, TechText headline, meadow, cloud layers, editorial interlude, product assembly, focus timer, and closing scene are preserved.

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

The template is a Driftbar design study. Its note is temporary and its focus timer runs in the browser. It does not provide a downloadable macOS app. Included license notices are preserved; confirm rights to the supplied media before public distribution.
