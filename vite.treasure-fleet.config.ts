// Treasure Fleet on its own: npm run dev:treasure-fleet (dev), or npm run build:site for the whole site.
import { defineConfig } from 'vite';
import { staticBuild } from './tools/static-build';
import { fleetBuild } from './tools/treasure-fleet-build';

export default defineConfig(staticBuild(fleetBuild));
