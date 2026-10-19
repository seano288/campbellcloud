// Purrdoku on its own: npx vite --config vite.purrdoku.config.ts (dev), or npm run build:site for the whole site.
import { defineConfig } from 'vite';
import { purrdokuBuild } from './tools/purrdoku-build';
import { staticBuild } from './tools/static-build';

export default defineConfig(staticBuild(purrdokuBuild));
