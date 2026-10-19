import { resolve } from 'node:path';
import { ICON_BACKGROUND, iconSvg } from '../src/cat-nap/art';
import { napBranding } from '../src/cat-nap/branding';
import { napEntry } from '../src/cat-nap/entrySelection';
import type { StaticSelection } from './static-build';

export const napBuild = {
  entry: napEntry,
  outDir: 'dist-site/cat-nap',
  branding: { ...napBranding, icon: { svg: iconSvg, background: ICON_BACKGROUND } },
  voice: { collection: napEntry.voice, root: resolve(import.meta.dirname, '../public/voice') },
  assets: [],
} satisfies StaticSelection;
