import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// npx vite --config tools/truck-preview/vite.config.ts, then npx tsx tools/truck-preview/shot.ts out.png "body=jeep&tires=2" [more queries...]
export default defineConfig({ root: resolve(import.meta.dirname), publicDir: resolve(import.meta.dirname, '../../public/time-flies-assets'), server: { port: 5198 } });
