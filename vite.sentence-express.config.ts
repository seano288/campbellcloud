// Sentence Express on its own: npm run dev:sentence-express (dev), or npm run build:site for the whole site.
import { defineConfig } from 'vite';
import { staticBuild } from './tools/static-build';
import { expressBuild } from './tools/sentence-express-build';

export default defineConfig(staticBuild(expressBuild));
