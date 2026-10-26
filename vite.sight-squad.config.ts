// Sight Squad on its own: npx vite --config vite.sight-squad.config.ts (dev), or npm run build:site for the whole site.
import { defineConfig } from 'vite';
import { staticBuild } from './tools/static-build';
import { squadBuild } from './tools/sight-squad-build';

export default defineConfig(staticBuild(squadBuild));
