// Dino Dig on its own: npm run dev:dino-dig (dev), or npm run build:site for the whole site.
import { defineConfig } from 'vite';
import { staticBuild } from './tools/static-build';
import { dinoBuild } from './tools/dino-dig-build';

export default defineConfig(staticBuild(dinoBuild));
