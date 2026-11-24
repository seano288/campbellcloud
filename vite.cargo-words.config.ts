// Cargo Words on its own: npm run dev:cargo-words (dev), or npm run build:site for the whole site.
import { defineConfig } from 'vite';
import { staticBuild } from './tools/static-build';
import { cargoBuild } from './tools/cargo-words-build';

const config = staticBuild(cargoBuild);
export default defineConfig({
  ...config,
  // Dev only: bundle Preact up front so the first page load doesn't reload with two copies of it (as Jetway).
  optimizeDeps: { ...config.optimizeDeps, include: ['preact', 'preact/hooks', 'preact/jsx-runtime', 'preact/jsx-dev-runtime', '@preact/signals'] },
});
