import { resolve } from 'node:path';
import { ladderBranding } from '../src/hook-and-ladder/branding';
import { ladderEntry } from '../src/hook-and-ladder/entrySelection';
import { ICON_BG, iconSvg } from '../src/hook-and-ladder/icon';
import type { StaticSelection } from './static-build';

export const ladderBuild = {
  entry: ladderEntry,
  outDir: 'dist-site/hook-and-ladder',
  branding: { ...ladderBranding, icon: { svg: iconSvg, background: ICON_BG } },
  voice: { collection: ladderEntry.voice, root: resolve(import.meta.dirname, '../public/hook-and-ladder-voice') },
  assets: [],
} satisfies StaticSelection;
