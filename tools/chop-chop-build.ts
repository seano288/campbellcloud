import { resolve } from 'node:path';
import { chopBranding } from '../src/chop-chop/branding';
import { chopEntry } from '../src/chop-chop/entrySelection';
import { ICON_SKY, iconSvg } from '../src/chop-chop/icon';
import type { StaticSelection } from './static-build';

// the hangar and sky photos are Time Flies' (CC0, see public/time-flies-assets/env/SOURCES.md)
const env = ['env/hangar-1k.hdr', 'env/hangar.jpg', 'env/sky-1k.hdr', 'env/sky.jpg'];

export const chopBuild = {
  entry: chopEntry,
  outDir: 'dist-site/chop-chop',
  branding: { ...chopBranding, icon: { svg: iconSvg, background: ICON_SKY } },
  voice: { collection: chopEntry.voice, root: resolve(import.meta.dirname, '../public/chop-chop-voice') },
  assets: [{ root: resolve(import.meta.dirname, '../public/time-flies-assets'), files: env }],
} satisfies StaticSelection;
