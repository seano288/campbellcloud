// Skyline on its own: npm run dev:skyline (dev), or npm run build:site for the whole site.
import { defineConfig } from 'vite';
import { staticBuild } from './tools/static-build';
import { skylineBuild } from './tools/skyline-build';

export default defineConfig(staticBuild(skylineBuild));
