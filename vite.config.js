import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  publicDir: false,
  // Keep the template's classic scripts and local assets unchanged. This also
  // makes the built page work when opened directly from the filesystem.
  plugins: [{
    name: 'copy-template-assets',
    async closeBundle() {
      const { cp } = await import('node:fs/promises');
      await cp(new URL('./driftbar-assets/', import.meta.url), new URL('./dist/driftbar-assets/', import.meta.url), { recursive: true });
    },
  }],
});
