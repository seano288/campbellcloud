import { resolve } from 'node:path';
import { wreckersBranding } from '../src/word-wreckers/branding';
import { wreckersEntry } from '../src/word-wreckers/entrySelection';
import { ICON_BG, iconSvg } from '../src/word-wreckers/icon';
import type { StaticSelection } from './static-build';

export const wreckersBuild = {
  entry: wreckersEntry,
  outDir: 'dist-site/word-wreckers',
  branding: { ...wreckersBranding, icon: { svg: iconSvg, background: ICON_BG } },
  voice: { collection: wreckersEntry.voice, root: resolve(import.meta.dirname, '../public/word-wreckers-voice') },
  assets: [],
} satisfies StaticSelection;
