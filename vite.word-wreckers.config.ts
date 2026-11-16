// Word Wreckers on its own: npm run dev:word-wreckers (dev), or npm run build:site for the whole site.
import { defineConfig } from 'vite';
import { staticBuild } from './tools/static-build';
import { wreckersBuild } from './tools/word-wreckers-build';

export default defineConfig(staticBuild(wreckersBuild));
