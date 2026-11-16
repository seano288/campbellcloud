import { resolve } from 'node:path';
import { expressBranding } from '../src/sentence-express/branding';
import { expressEntry } from '../src/sentence-express/entrySelection';
import { ICON_BG, iconSvg } from '../src/sentence-express/icon';
import type { StaticSelection } from './static-build';

export const expressBuild = {
  entry: expressEntry,
  outDir: 'dist-site/sentence-express',
  branding: { ...expressBranding, icon: { svg: iconSvg, background: ICON_BG } },
  voice: { collection: expressEntry.voice, root: resolve(import.meta.dirname, '../public/sentence-express-voice') },
  assets: [],
} satisfies StaticSelection;
