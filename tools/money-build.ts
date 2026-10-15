import { resolve } from 'node:path';
import { moneyBranding } from '../src/app/branding';
import { moneyEntry } from '../src/app/entrySelection';
import { iconSvg } from '../src/icon/icon';
import type { StaticSelection } from './static-build';

export const moneyBuild = {
  entry: moneyEntry,
  outDir: 'dist',
  branding: { ...moneyBranding, icon: { svg: iconSvg, background: '#ffd23f' } },
  voice: { collection: moneyEntry.voice, root: resolve(import.meta.dirname, '../public/voice') },
  assets: [],
} satisfies StaticSelection;
