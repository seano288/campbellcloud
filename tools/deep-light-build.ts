import { resolve } from 'node:path';
import { deepBranding } from '../src/deep-light/branding';
import { deepEntry } from '../src/deep-light/entrySelection';
import { ICON_BG, iconSvg } from '../src/deep-light/icon';
import type { StaticSelection } from './static-build';

export const deepBuild = {
  entry: deepEntry,
  outDir: 'dist-site/deep-light',
  branding: { ...deepBranding, icon: { svg: iconSvg, background: ICON_BG } },
  voice: { collection: deepEntry.voice, root: resolve(import.meta.dirname, '../public/deep-light-voice') },
  assets: [],
} satisfies StaticSelection;
