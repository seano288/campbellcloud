import { resolve } from 'node:path';
import { mathBranding } from '../src/math-bots/branding';
import { mathEntry } from '../src/math-bots/entrySelection';
import { ICON_BG, iconSvg } from '../src/math-bots/icon';
import type { StaticSelection } from './static-build';

export const mathBuild = {
  entry: mathEntry,
  outDir: 'dist-site/math-bots',
  branding: { ...mathBranding, icon: { svg: iconSvg, background: ICON_BG } },
  voice: { collection: mathEntry.voice, root: resolve(import.meta.dirname, '../public/math-bots-voice') },
  assets: [],
} satisfies StaticSelection;
