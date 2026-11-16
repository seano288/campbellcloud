// Sentence Express on its own: npm run dev:sentence-express (dev), or npm run build:site for the whole site.
import { defineConfig } from 'vite';
import { staticBuild } from './tools/static-build';
import { expressBuild } from './tools/sentence-express-build';

const config = staticBuild(expressBuild);
export default defineConfig({
  ...config,
  // Dev only: the entry is picked when index.html is served, so Vite's first scan misses Preact's hooks and signals, finds them on the
  // first page load and reloads. For that moment the page has two copies of Preact, and the Start screen throws "Cannot read
  // properties of undefined (reading 'context')". Bundling them up front keeps one copy from the start.
  optimizeDeps: { ...config.optimizeDeps, include: ['preact', 'preact/hooks', 'preact/jsx-runtime', 'preact/jsx-dev-runtime', '@preact/signals'] },
});
