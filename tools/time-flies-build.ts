import { resolve } from 'node:path';
import { fliesBranding } from '../src/time-flies/branding';
import { fliesEntry } from '../src/time-flies/entrySelection';
import { ICON_SKY, iconSvg } from '../src/time-flies/icon';
import type { StaticSelection } from './static-build';

const env = ['env/hangar-1k.hdr', 'env/hangar.jpg', 'env/sky-1k.hdr', 'env/sky.jpg'];

export const fliesBuild = {
  entry: fliesEntry,
  outDir: 'dist-site/time-flies',
  branding: { ...fliesBranding, icon: { svg: iconSvg, background: ICON_SKY } },
  voice: { collection: fliesEntry.voice, root: resolve(import.meta.dirname, '../public/time-flies-voice') },
  assets: [{ root: resolve(import.meta.dirname, '../public/time-flies-assets'), files: env }],
} satisfies StaticSelection;
