import { resolve } from 'node:path';
import { skyBranding } from '../src/sky-writer/branding';
import { skyEntry } from '../src/sky-writer/entrySelection';
import { ICON_BG, iconSvg } from '../src/sky-writer/icon';
import type { StaticSelection } from './static-build';

export const skyBuild = {
  entry: skyEntry,
  outDir: 'dist-site/sky-writer',
  branding: { ...skyBranding, icon: { svg: iconSvg, background: ICON_BG } },
  voice: { collection: skyEntry.voice, root: resolve(import.meta.dirname, '../public/sky-writer-voice') },
  assets: [],
} satisfies StaticSelection;
