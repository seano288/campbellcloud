// Hook and Ladder on its own: npm run dev:hook-and-ladder (dev), or npm run build:site for the whole site.
import { defineConfig } from 'vite';
import { staticBuild } from './tools/static-build';
import { ladderBuild } from './tools/hook-and-ladder-build';

const config = staticBuild(ladderBuild);
export default defineConfig({
  ...config,
  // Dev only: bundle Preact up front so the first page load doesn't reload with two copies of it (as Sentence Express).
  optimizeDeps: { ...config.optimizeDeps, include: ['preact', 'preact/hooks', 'preact/jsx-runtime', 'preact/jsx-dev-runtime', '@preact/signals'] },
});
