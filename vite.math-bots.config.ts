// Math Bots on its own: npm run dev:math-bots (dev), or npm run build:site for the whole site.
import { defineConfig } from 'vite';
import { staticBuild } from './tools/static-build';
import { mathBuild } from './tools/math-bots-build';

export default defineConfig(staticBuild(mathBuild));
