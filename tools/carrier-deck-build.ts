import { resolve } from 'node:path';
import { deckBranding } from '../src/carrier-deck/branding';
import { deckEntry } from '../src/carrier-deck/entrySelection';
import { ICON_BG, iconSvg } from '../src/carrier-deck/icon';
import type { StaticSelection } from './static-build';

export const deckBuild = {
  entry: deckEntry,
  outDir: 'dist-site/carrier-deck',
  branding: { ...deckBranding, icon: { svg: iconSvg, background: ICON_BG } },
  voice: { collection: deckEntry.voice, root: resolve(import.meta.dirname, '../public/carrier-deck-voice') },
  assets: [],
} satisfies StaticSelection;
