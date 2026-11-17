import { resolve } from 'node:path';
import { tallyBranding } from '../src/turbo-tally/branding';
import { tallyEntry } from '../src/turbo-tally/entrySelection';
import { ICON_BG, iconSvg } from '../src/turbo-tally/icon';
import type { StaticSelection } from './static-build';

export const tallyBuild = {
  entry: tallyEntry,
  outDir: 'dist-site/turbo-tally',
  branding: { ...tallyBranding, icon: { svg: iconSvg, background: ICON_BG } },
  voice: { collection: tallyEntry.voice, root: resolve(import.meta.dirname, '../public/turbo-tally-voice') },
  assets: [],
} satisfies StaticSelection;
