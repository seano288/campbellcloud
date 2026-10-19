import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';
import type { InlineConfig, Plugin } from 'vite';
import type { VoiceCollection } from '../src/voice/collection';
import type { AppEntry } from '../src/entry';
import { homeScreenIcons, type IconArtwork } from './icons';
import { voiceCheck } from './voice-check';

export interface StaticSelection<P extends string = string> {
  entry: AppEntry<P>;
  outDir: string;
  branding: {
    title: string;
    shortName: string;
    background: string;
    theme: string;
    icon: IconArtwork;
  };
  voice: { root: string; collection: VoiceCollection<NoInfer<P>> };
  assets: readonly { root: string; files: readonly string[] }[];
}

const htmlValue = (value: string) => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

function selectedAssets(selection: Pick<StaticSelection, 'assets' | 'voice'>): Plugin {
  function files() {
    const files = new Map<string, Buffer>();
    const sources = [
      ...selection.assets.map(asset => ({ ...asset, directory: '' })),
      { root: selection.voice.root, directory: 'voice/', files: selection.voice.collection.phrases.map(phrase => selection.voice.collection.clips[phrase]!) },
    ];
    for (const source of sources) for (const file of source.files) {
      const path = resolve(source.root, file), within = relative(resolve(source.root), path);
      if (within.startsWith('..') || isAbsolute(within)) throw new Error(`Selected asset escapes its root: ${file}`);
      const name = source.directory + file, bytes = readFileSync(path);
      const previous = files.get(name);
      if (previous && !previous.equals(bytes)) throw new Error(`Conflicting selected asset: ${name}`);
      files.set(name, bytes);
    }
    return files;
  }
  return {
    name: 'selected-static-assets',
    generateBundle() {
      for (const [fileName, source] of files()) this.emitFile({ type: 'asset', fileName, source });
    },
    configureServer(server) {
      const selected = files();
      server.middlewares.use((req, res, next) => {
        const name = req.url?.split('?')[0]?.replace(/^\//, '');
        const file = name && selected.get(name);
        if (!file) return next();
        if (name.endsWith('.mp3')) res.setHeader('Content-Type', 'audio/mpeg');
        if (name.endsWith('.svg')) res.setHeader('Content-Type', 'image/svg+xml');
        res.end(file);
      });
    },
  };
}

// Shown small on the title screen, so it's easy to tell which version the iPad is running.
function buildLabel() {
  let commit = 'dev';
  try { commit = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { /* not a checkout */ }
  return `${new Date().toISOString().slice(0, 16).replace('T', ' ')} · ${commit}`;
}

export function staticBuild<const P extends string>(selection: StaticSelection<P>): InlineConfig {
  const { branding } = selection;
  const voice = { root: selection.voice.root, collection: { ...selection.voice.collection, phrases: selection.entry.voice.phrases } };
  const values: Record<string, string> = {
    APP_TITLE: branding.title, APP_SHORT_NAME: branding.shortName, APP_BACKGROUND: branding.background,
    APP_THEME: branding.theme, APP_ENTRY: selection.entry.file,
  };
  return {
    configFile: false,
    root: resolve(import.meta.dirname, '..'),
    base: './',
    publicDir: false,
    define: { __BUILD__: JSON.stringify(buildLabel()) },
    plugins: [
      preact(),
      {
        name: 'selected-entry',
        configResolved() {
          for (const phrase of selection.entry.voice.phrases) {
            const expected = selection.entry.voice.clips[phrase], supplied = selection.voice.collection.clips[phrase];
            if (supplied && supplied !== expected) throw new Error(`Conflicting selected recording for "${phrase}": entry requires ${expected}, supplied ${supplied}`);
          }
        },
        transformIndexHtml: {
          order: 'pre',
          handler: html => html.replace(/%(APP_[A-Z_]+)%/g, (_match, key: string) => {
            if (!(key in values)) throw new Error(`Unknown selected HTML value: ${key}`);
            return htmlValue(values[key]!);
          }),
        },
      },
      voiceCheck([voice]),
      selectedAssets({ assets: selection.assets, voice }),
      homeScreenIcons(branding.icon),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: false, // src/pwa.ts registers it, only on the web, and picks when to reload
        manifest: {
          name: branding.title,
          short_name: branding.shortName,
          start_url: './',
          scope: './',
          display: 'standalone',
          orientation: 'any',
          theme_color: branding.theme,
          background_color: branding.background,
          icons: [
            { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,png,jpg,svg,webp,mp3,woff,woff2,hdr}'],
          cleanupOutdatedCaches: true,
          // the new version takes over in the background; src/pwa.ts reloads into it only when that can't interrupt him
          skipWaiting: true,
          clientsClaim: true,
        },
      }),
    ],
    build: { outDir: selection.outDir, assetsInlineLimit: 0, chunkSizeWarningLimit: 800 }, // three.js is in the main bundle on purpose
  };
}
