import { resolve } from 'node:path';
import { rescueBranding } from '../src/wild-rescue/branding';
import { rescueEntry } from '../src/wild-rescue/entrySelection';
import { ICON_BG, iconSvg } from '../src/wild-rescue/icon';
import type { StaticSelection } from './static-build';

export const rescueBuild = {
  entry: rescueEntry,
  outDir: 'dist-site/wild-rescue',
  branding: { ...rescueBranding, icon: { svg: iconSvg, background: ICON_BG } },
  voice: { collection: rescueEntry.voice, root: resolve(import.meta.dirname, '../public/wild-rescue-voice') },
  assets: [],
} satisfies StaticSelection;
