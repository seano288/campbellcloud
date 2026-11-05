import { resolve } from 'node:path';
import { mathBranding } from '../src/math-bots/branding';
import { mathEntry } from '../src/math-bots/entrySelection';
import { ICON_BG, iconSvg } from '../src/math-bots/icon';
import type { StaticSelection } from './static-build';

const FIGHT_FILES = [
  ...['floor_a', 'floor_n', 'steel_a', 'steel_n', 'paint_p', 'paint_n', 'scratch', 'tyre_n'].map(n => `tex/${n}.ktx2`),
  'env/warehouse_log.jpg', 'env/warehouse.json',
].map(f => `math-bots-fight/${f}`);

export const mathBuild = {
  entry: mathEntry,
  outDir: 'dist-site/math-bots',
  branding: { ...mathBranding, icon: { svg: iconSvg, background: ICON_BG } },
  voice: { collection: mathEntry.voice, root: resolve(import.meta.dirname, '../public/math-bots-voice') },
  assets: [{ root: resolve(import.meta.dirname, '../public'), files: FIGHT_FILES }], // fetched only when a fight opens (src/math-bots/fight/)
  // The fight works offline: its textures, the KTX2 transcoder (three.js's own, which the bundler emits), and its chunk of three.js and
  // Rapier, which is bigger than the default limit.
  // The worker fetches them in the background, so the first Round doesn't wait on them.
  offline: { patterns: ['math-bots-fight/**/*.{ktx2,json}', 'assets/*.wasm'], maxFileBytes: 8 * 1024 * 1024 },
} satisfies StaticSelection;
