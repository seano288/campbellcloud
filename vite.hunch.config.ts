// Hunch on its own: npm run dev:hunch (dev), or npm run build:site for the whole site.
import { defineConfig } from 'vite';
import { hunchBuild } from './tools/hunch-build';

export default defineConfig(hunchBuild());
