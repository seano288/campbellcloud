import { resolve } from 'node:path';
import { truckBranding } from '../src/food-truck/branding';
import { truckEntry } from '../src/food-truck/entrySelection';
import { ICON_BG, iconSvg } from '../src/food-truck/icon';
import type { StaticSelection } from './static-build';

export const truckBuild = {
  entry: truckEntry,
  outDir: 'dist-site/food-truck',
  branding: { ...truckBranding, icon: { svg: iconSvg, background: ICON_BG } },
  voice: { collection: truckEntry.voice, root: resolve(import.meta.dirname, '../public/food-truck-voice') },
  assets: [],
} satisfies StaticSelection;
