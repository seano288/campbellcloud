import { resolve } from 'node:path';
import { roverBranding } from '../src/rover-code/branding';
import { roverEntry } from '../src/rover-code/entrySelection';
import { ICON_BG, iconSvg } from '../src/rover-code/icon';
import type { StaticSelection } from './static-build';

export const roverBuild = {
  entry: roverEntry,
  outDir: 'dist-site/rover-code',
  branding: { ...roverBranding, icon: { svg: iconSvg, background: ICON_BG } },
  voice: { collection: roverEntry.voice, root: resolve(import.meta.dirname, '../public/rover-code-voice') },
  assets: [],
} satisfies StaticSelection;
