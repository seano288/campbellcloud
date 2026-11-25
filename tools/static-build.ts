import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';
import type { InlineConfig, Plugin, ViteDevServer } from 'vite';
import type { VoiceCollection } from '../src/voice/collection';
import type { AppEntry } from '../src/entry';
import { favicon, homeScreenIcons, type IconArtwork } from './icons';
import { voiceCheck } from './voice-check';
import { PACK_LIMIT, packClips } from './voice-packs';

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
  /** More for the service worker than every game's usual files, for a game that has them. */
  offline?: { patterns: readonly string[]; maxFileBytes: number };
}

const htmlValue = (value: string) => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

function within(root: string, file: string) {
  const path = resolve(root, file), inside = relative(resolve(root), path);
  if (inside.startsWith('..') || isAbsolute(inside)) throw new Error(`Selected asset escapes its root: ${file}`);
  return path;
}

function serve(server: ViteDevServer, files: ReadonlyMap<string, Buffer>, types: Readonly<Record<string, string>>) {
  server.middlewares.use((req, res, next) => {
    const name = req.url?.split('?')[0]?.replace(/^\//, '');
    const file = name && files.get(name);
    if (!file) return next();
    const type = Object.entries(types).find(([ending]) => name.endsWith(ending))?.[1];
    if (type) res.setHeader('Content-Type', type);
    res.end(file);
  });
}

function selectedAssets(selection: Pick<StaticSelection, 'assets'>): Plugin {
  function files() {
    const files = new Map<string, Buffer>();
    for (const source of selection.assets) for (const file of source.files) {
      const bytes = readFileSync(within(source.root, file));
      const previous = files.get(file);
      if (previous && !previous.equals(bytes)) throw new Error(`Conflicting selected asset: ${file}`);
      files.set(file, bytes);
    }
    return files;
  }
  return {
    name: 'selected-static-assets',
    generateBundle() {
      for (const [fileName, source] of files()) this.emitFile({ type: 'asset', fileName, source });
    },
    configureServer: server => serve(server, files(), { '.mp3': 'audio/mpeg', '.svg': 'image/svg+xml', '.wasm': 'application/wasm' }),
  };
}

type SelectedVoice = { root: string; collection: Pick<VoiceCollection<string>, 'id' | 'phrases' | 'clips'> };

/** The voice a build selects: just the recordings of the phrases its entry says. */
export function selectedVoice(selection: Pick<StaticSelection, 'entry' | 'voice'>): SelectedVoice {
  return { root: selection.voice.root, collection: { ...selection.voice.collection, phrases: selection.entry.voice.phrases } };
}

/** The selected clips in their packs, as a build has them. */
export function packVoice(voice: SelectedVoice) {
  return packClips(new Map(
    voice.collection.phrases.flatMap(phrase => voice.collection.clips[phrase] ?? []).map(file => [file, readFileSync(within(voice.root, file))]),
  ));
}

/** For the offline checks: which of a build's voice packs aren't among the precached paths (none, when all is well). */
export function precachedVoice(selection: Pick<StaticSelection, 'entry' | 'voice'>, cached: readonly string[]) {
  const names = new Set(cached.map(path => path.split('/').pop()));
  const { index } = packVoice(selectedVoice(selection));
  return {
    packs: index.packs.length,
    clips: new Set(Object.keys(index.clips)),
    missing: index.packs.map(pack => pack.file).filter(file => !names.has(file)),
  };
}

/** Builds the selected clips into packs (tools/voice-packs.ts) in voice/, and hands the game where each clip is as
 * `virtual:voice-packs` (src/audio/recorded.ts). The dev server serves the same packs. No clip is a file of its own. */
export function voicePacks(voice: SelectedVoice): Plugin {
  const id = 'virtual:voice-packs';
  let packed: ReturnType<typeof packClips> | undefined;
  const packs = () => packed ??= packVoice(voice);
  return {
    name: 'voice-packs',
    resolveId: source => source === id ? `\0${id}` : undefined,
    load: loaded => loaded === `\0${id}` ? `export default ${JSON.stringify(packs().index)};` : undefined,
    generateBundle() {
      for (const pack of packs().packs) this.emitFile({ type: 'asset', fileName: `voice/${pack.file}`, source: pack.bytes });
    },
    configureServer: server => serve(server, new Map(packs().packs.map(pack => [`voice/${pack.file}`, pack.bytes])), { '.bin': 'application/octet-stream' }),
  };
}

// Shown small on the title screen, so it's easy to tell which version the iPad is running.
function buildLabel() {
  let commit = 'dev';
  try { commit = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { /* not a checkout */ }
  return commit;
}

export function staticBuild<const P extends string>(selection: StaticSelection<P>): InlineConfig {
  const { branding } = selection;
  const voice = selectedVoice(selection);
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
      selectedAssets(selection),
      voicePacks(voice),
      favicon(),
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
          // bin is the voice packs, which can be bigger than the 2 MiB workbox takes by default (but never over PACK_LIMIT)
          globPatterns: ['**/*.{js,css,html,png,jpg,svg,webp,mp3,bin,woff,woff2,hdr}', ...(selection.offline?.patterns ?? [])],
          maximumFileSizeToCacheInBytes: Math.max(PACK_LIMIT, selection.offline?.maxFileBytes ?? 0),
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
