// Hunch, the word game, as its own static build. It's a plain clone, not a learning game, so it skips the shared engine,
// the voice clips and staticBuild(): just its page, the word lists bundled in, Home Screen icons and its own worker.
import { resolve } from 'node:path';
import type { InlineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { ICON_BACKGROUND, iconSvg } from '../src/hunch/icon';
import { favicon, homeScreenIcons } from './icons';

export function hunchBuild(outDir = resolve(import.meta.dirname, '../dist-site/hunch')): InlineConfig {
  return {
    configFile: false, root: resolve(import.meta.dirname, '../src/hunch'), base: './', publicDir: false,
    plugins: [
      favicon(), homeScreenIcons({ svg: iconSvg, background: ICON_BACKGROUND }),
      VitePWA({
        registerType: 'autoUpdate', injectRegister: false, // src/pwa.ts registers it
        manifest: {
          name: 'Hunch', short_name: 'Hunch', start_url: './', scope: './', display: 'standalone', orientation: 'any',
          theme_color: ICON_BACKGROUND, background_color: ICON_BACKGROUND,
          icons: [
            { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: { globPatterns: ['**/*.{js,css,html,png,svg}'], cleanupOutdatedCaches: true, skipWaiting: true, clientsClaim: true },
      }),
    ],
    build: { outDir, emptyOutDir: true },
  };
}
