// Chop Chop on its own: npx vite --config vite.chop-chop.config.ts (dev), or npm run build:site for the whole site.
import { defineConfig } from 'vite';
import { staticBuild } from './tools/static-build';
import { chopBuild } from './tools/chop-chop-build';

export default defineConfig(staticBuild(chopBuild));
