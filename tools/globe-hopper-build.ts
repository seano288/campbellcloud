import { resolve } from 'node:path';
import { globeBranding } from '../src/globe-hopper/branding';
import { globeEntry } from '../src/globe-hopper/entrySelection';
import { ICON_BG, iconSvg } from '../src/globe-hopper/icon';
import type { StaticSelection } from './static-build';

export const globeBuild = {
  entry: globeEntry,
  outDir: 'dist-site/globe-hopper',
  branding: { ...globeBranding, icon: { svg: iconSvg, background: ICON_BG } },
  voice: { collection: globeEntry.voice, root: resolve(import.meta.dirname, '../public/globe-hopper-voice') },
  assets: [],
} satisfies StaticSelection;
