// Food Truck on its own: npm run dev:food-truck (dev), or npm run build:site for the whole site.
import { defineConfig } from 'vite';
import { staticBuild } from './tools/static-build';
import { truckBuild } from './tools/food-truck-build';

export default defineConfig(staticBuild(truckBuild));
