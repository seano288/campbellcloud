// Cat Nap on its own: npx vite --config vite.cat-nap.config.ts (dev), or npm run build:site for the whole site.
import { defineConfig } from 'vite';
import { napBuild } from './tools/cat-nap-build';
import { staticBuild } from './tools/static-build';

export default defineConfig(staticBuild(napBuild));
