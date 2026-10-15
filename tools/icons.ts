// Vite plugin: rasterises the Home Screen icon (src/icon/icon.ts) to PNGs at build time. No image files are committed.
// Every PNG is a full square with no alpha channel, because iOS masks the icon itself.
import sharp from 'sharp';
import type { Plugin } from 'vite';

export interface IconArtwork {
  svg(scale: number): string;
  background: string;
}

export const ICONS = [
  { file: 'apple-touch-icon.png', size: 180, scale: 1 },
  { file: 'icon-192.png', size: 192, scale: 1 },
  { file: 'icon-512.png', size: 512, scale: 1 },
  { file: 'icon-maskable-512.png', size: 512, scale: 0.8 },
] as const;

export const renderIcon = (artwork: IconArtwork, size: number, scale: number) =>
  sharp(Buffer.from(artwork.svg(scale)), { density: (72 * size) / 512 }).resize(size, size).flatten({ background: artwork.background }).removeAlpha().png().toBuffer();

export function homeScreenIcons(artwork: IconArtwork): Plugin {
  return {
    name: 'home-screen-icons',
    apply: 'build',
    async generateBundle() {
      for (const { file, size, scale } of ICONS) this.emitFile({ type: 'asset', fileName: file, source: await renderIcon(artwork, size, scale) });
    },
  };
}
