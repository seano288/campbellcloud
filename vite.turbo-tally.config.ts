// Turbo Tally on its own: npm run dev:turbo-tally (dev), or npm run build:site for the whole site.
import { defineConfig } from 'vite';
import { staticBuild } from './tools/static-build';
import { tallyBuild } from './tools/turbo-tally-build';

export default defineConfig(staticBuild(tallyBuild));
