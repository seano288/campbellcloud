// Time Flies on its own: npx vite --config vite.time-flies.config.ts (dev), or npm run build:site for the whole site.
import { defineConfig } from 'vite';
import { staticBuild } from './tools/static-build';
import { fliesBuild } from './tools/time-flies-build';

export default defineConfig(staticBuild(fliesBuild));
