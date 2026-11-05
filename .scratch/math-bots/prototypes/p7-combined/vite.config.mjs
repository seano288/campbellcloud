import { defineConfig } from 'vite';
export default defineConfig({
  base: './',
  build: { outDir: 'dist', emptyOutDir: true, target: 'es2022', chunkSizeWarningLimit: 8000, assetsInlineLimit: 0 },
  server: { port: 5197, strictPort: true },
  preview: { port: 5197, strictPort: true },
});
