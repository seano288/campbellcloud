import { resolve } from 'node:path';
import { dinoBranding } from '../src/dino-dig/branding';
import { dinoEntry } from '../src/dino-dig/entrySelection';
import { ICON_BG, iconSvg } from '../src/dino-dig/icon';
import type { StaticSelection } from './static-build';

export const dinoBuild = {
  entry: dinoEntry,
  outDir: 'dist-site/dino-dig',
  branding: { ...dinoBranding, icon: { svg: iconSvg, background: ICON_BG } },
  voice: { collection: dinoEntry.voice, root: resolve(import.meta.dirname, '../public/dino-dig-voice') },
  assets: [],
} satisfies StaticSelection;
