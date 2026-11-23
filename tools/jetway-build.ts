import { resolve } from 'node:path';
import { jetBranding } from '../src/jetway/branding';
import { jetEntry } from '../src/jetway/entrySelection';
import { ICON_BG, iconSvg } from '../src/jetway/icon';
import type { StaticSelection } from './static-build';

export const jetBuild = {
  entry: jetEntry,
  outDir: 'dist-site/jetway',
  branding: { ...jetBranding, icon: { svg: iconSvg, background: ICON_BG } },
  voice: { collection: jetEntry.voice, root: resolve(import.meta.dirname, '../public/jetway-voice') },
  assets: [],
} satisfies StaticSelection;
