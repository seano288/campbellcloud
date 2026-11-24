import { resolve } from 'node:path';
import { moonBranding } from '../src/moon-base-mail/branding';
import { moonEntry } from '../src/moon-base-mail/entrySelection';
import { ICON_BG, iconSvg } from '../src/moon-base-mail/icon';
import type { StaticSelection } from './static-build';

export const moonBuild = {
  entry: moonEntry,
  outDir: 'dist-site/moon-base-mail',
  branding: { ...moonBranding, icon: { svg: iconSvg, background: ICON_BG } },
  voice: { collection: moonEntry.voice, root: resolve(import.meta.dirname, '../public/moon-base-mail-voice') },
  assets: [],
} satisfies StaticSelection;
