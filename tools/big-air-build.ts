import { resolve } from 'node:path';
import { airBranding } from '../src/big-air/branding';
import { airEntry } from '../src/big-air/entrySelection';
import { ICON_BG, iconSvg } from '../src/big-air/icon';
import type { StaticSelection } from './static-build';

export const airBuild = {
  entry: airEntry,
  outDir: 'dist-site/big-air',
  branding: { ...airBranding, icon: { svg: iconSvg, background: ICON_BG } },
  voice: { collection: airEntry.voice, root: resolve(import.meta.dirname, '../public/big-air-voice') },
  assets: [],
} satisfies StaticSelection;
