import { resolve } from 'node:path';
import { squadBranding } from '../src/sight-squad/branding';
import { squadEntry } from '../src/sight-squad/entrySelection';
import { ICON_BG, iconSvg } from '../src/sight-squad/icon';
import type { StaticSelection } from './static-build';

export const squadBuild = {
  entry: squadEntry,
  outDir: 'dist-site/sight-squad',
  branding: { ...squadBranding, icon: { svg: iconSvg, background: ICON_BG } },
  voice: { collection: squadEntry.voice, root: resolve(import.meta.dirname, '../public/sight-squad-voice') },
  assets: [], // the Camp is lit by a studio light made in code (RoomEnvironment): nothing to download
} satisfies StaticSelection;
