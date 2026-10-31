# Insomnia

HackCBS IOMETE track project research and planning.

Read the [IOMETE ProofPlan proposal](IOMETE_PROOFPLAN.md) for the recommended problem, product workflow, MVP scope, demo, and research sources.

## Meadow hero prototype

A React implementation of the supplied Driftbar meadow reference, adapted into two full-screen ProofPlan hero scenes.

```sh
npm install
npm run dev
```

Open the Local URL printed by Vite (normally `http://127.0.0.1:5173/`). In VS Code, use the integrated terminal to run this command. The source `index.html` loads JSX modules and must be served by Vite; opening it directly or through the Live Server extension does not compile React.

`npm run check` renders both heroes and the supplied components to catch runtime JSX errors. The production build runs this check first.

Production build and preview:

```sh
npm run build
npm run preview -- --port 4173
```

### Included

- Supplied meadow video and poster, pale paper haze, and oversized frosted wordmark.
- The supplied React Bits TechText component, including letter outlines, dragging, and click response.
- GSAP ScrollTrigger timeline coordinating the hero exit, rising cloud curtain, camera movement, and second hero reveal.
- Three.js WebGL rendering with displaced terrain, fireflies, camera parallax, and a procedural cloud shader.
- Ambient-motion pause control, reduced-motion layout, keyboard focus styles, and a responsive mobile composition.
- A small example-plan dialog with a working Markdown download. This is a presentation prototype, not the full evaluation engine described in the proposal.

### Implementation

- `src/App.jsx`: hero composition, GSAP choreography, and example-plan interaction.
- `src/MeadowScene.jsx`: WebGL landscape and cloud rendering, loaded separately from the main interface.
- `src/TechText.jsx` and `src/TechText.css`: component supplied in the design attachment.
- `src/style.css`: responsive layout and visual treatment.

Official guidance used: [GSAP skills](https://github.com/greensock/gsap-skills), specifically React lifecycle cleanup, timelines, ScrollTrigger, and performance. The downloaded reference checkout is ignored by Git.

The remote video, poster, and Google Font require network access. Confirm rights to the supplied media and component before public distribution.

### Verification

The production build passes. Automated visual/browser review was unavailable because the browser security gate denied access to the local preview. Desktop, mobile, reduced-motion rendering, and cloud timing still need visual review. The generic design linter flags the requested glass gradients, small section introductions, and the supplied component's internal monospace labels; these are intentional reference-specific choices rather than a clean generic-linter result.
