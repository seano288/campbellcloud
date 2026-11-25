import { resolve } from 'node:path';
import { roostBranding } from '../src/dragon-roost/branding';
import { roostEntry } from '../src/dragon-roost/entrySelection';
import { ICON_BG, iconSvg } from '../src/dragon-roost/icon';
import type { StaticSelection } from './static-build';

export const roostBuild = {
  entry: roostEntry,
  outDir: 'dist-site/dragon-roost',
  branding: { ...roostBranding, icon: { svg: iconSvg, background: ICON_BG } },
  voice: { collection: roostEntry.voice, root: resolve(import.meta.dirname, '../public/dragon-roost-voice') },
  assets: [],
} satisfies StaticSelection;
