import { resolve } from 'node:path';
import { skylineBranding } from '../src/skyline/branding';
import { skylineEntry } from '../src/skyline/entrySelection';
import { ICON_BG, iconSvg } from '../src/skyline/icon';
import type { StaticSelection } from './static-build';

export const skylineBuild = {
  entry: skylineEntry,
  outDir: 'dist-site/skyline',
  branding: { ...skylineBranding, icon: { svg: iconSvg, background: ICON_BG } },
  voice: { collection: skylineEntry.voice, root: resolve(import.meta.dirname, '../public/skyline-voice') },
  assets: [],
} satisfies StaticSelection;
