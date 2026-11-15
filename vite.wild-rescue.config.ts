// Wild Rescue on its own: npm run dev:wild-rescue (dev), or npm run build:site for the whole site.
import { defineConfig } from 'vite';
import { staticBuild } from './tools/static-build';
import { rescueBuild } from './tools/wild-rescue-build';

export default defineConfig(staticBuild(rescueBuild));
