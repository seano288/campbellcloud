import { resolve } from 'node:path';
import { cargoBranding } from '../src/cargo-words/branding';
import { cargoEntry } from '../src/cargo-words/entrySelection';
import { ICON_BG, iconSvg } from '../src/cargo-words/icon';
import type { StaticSelection } from './static-build';

export const cargoBuild = {
  entry: cargoEntry,
  outDir: 'dist-site/cargo-words',
  branding: { ...cargoBranding, icon: { svg: iconSvg, background: ICON_BG } },
  voice: { collection: cargoEntry.voice, root: resolve(import.meta.dirname, '../public/cargo-words-voice') },
  assets: [],
} satisfies StaticSelection;
