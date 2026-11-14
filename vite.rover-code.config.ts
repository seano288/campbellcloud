// Rover Code on its own: npm run dev:rover-code (dev), or npm run build:site for the whole site.
import { defineConfig } from 'vite';
import { staticBuild } from './tools/static-build';
import { roverBuild } from './tools/rover-code-build';

export default defineConfig(staticBuild(roverBuild));
