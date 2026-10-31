import { defineConfig } from 'vite';

export default defineConfig({
  // All components use React's automatic JSX runtime, including the supplied
  // TechText component, which imports hooks without a default React binding.
  esbuild: { jsx: 'automatic' },
});
