import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// npx vite --config tools/jet-preview/vite.config.ts
export default defineConfig({ root: resolve(import.meta.dirname), publicDir: resolve(import.meta.dirname, '../../public/time-flies-assets'), server: { port: 5199 } });
