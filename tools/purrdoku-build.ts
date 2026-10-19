import { resolve } from 'node:path';
import { ICON_BACKGROUND, iconSvg } from '../src/purrdoku/art';
import { purrdokuBranding } from '../src/purrdoku/branding';
import { purrdokuEntry } from '../src/purrdoku/entrySelection';
import type { StaticSelection } from './static-build';

export const purrdokuBuild = {
  entry: purrdokuEntry,
  outDir: 'dist-site/purrdoku',
  branding: { ...purrdokuBranding, icon: { svg: iconSvg, background: ICON_BACKGROUND } },
  voice: { collection: purrdokuEntry.voice, root: resolve(import.meta.dirname, '../public/purrdoku-voice') },
  assets: [],
} satisfies StaticSelection;
