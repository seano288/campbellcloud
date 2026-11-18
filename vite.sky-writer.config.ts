// Sky Writer on its own: npm run dev:sky-writer (dev), or npm run build:site for the whole site.
import { defineConfig } from 'vite';
import { staticBuild } from './tools/static-build';
import { skyBuild } from './tools/sky-writer-build';

export default defineConfig(staticBuild(skyBuild));
