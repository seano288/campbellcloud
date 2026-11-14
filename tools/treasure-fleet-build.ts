import { resolve } from 'node:path';
import { fleetBranding } from '../src/treasure-fleet/branding';
import { fleetEntry } from '../src/treasure-fleet/entrySelection';
import { ICON_BG, iconSvg } from '../src/treasure-fleet/icon';
import type { StaticSelection } from './static-build';

export const fleetBuild = {
  entry: fleetEntry,
  outDir: 'dist-site/treasure-fleet',
  branding: { ...fleetBranding, icon: { svg: iconSvg, background: ICON_BG } },
  voice: { collection: fleetEntry.voice, root: resolve(import.meta.dirname, '../public/treasure-fleet-voice') },
  assets: [],
} satisfies StaticSelection;
