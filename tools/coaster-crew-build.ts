import { resolve } from 'node:path';
import { coasterBranding } from '../src/coaster-crew/branding';
import { coasterEntry } from '../src/coaster-crew/entrySelection';
import { ICON_BG, iconSvg } from '../src/coaster-crew/icon';
import type { StaticSelection } from './static-build';

export const coasterBuild = {
  entry: coasterEntry,
  outDir: 'dist-site/coaster-crew',
  branding: { ...coasterBranding, icon: { svg: iconSvg, background: ICON_BG } },
  voice: { collection: coasterEntry.voice, root: resolve(import.meta.dirname, '../public/coaster-crew-voice') },
  assets: [],
} satisfies StaticSelection;
