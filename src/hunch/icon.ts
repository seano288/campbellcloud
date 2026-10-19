// The Home Screen icon and landing tile: a five-tile row spelling HUNCH in green, yellow and grey. tools/icons.ts
// rasterises it at build time.
export const ICON_BACKGROUND = '#121213';
const TILES = [['H', '#538d4e'], ['U', '#3a3a3c'], ['N', '#b59f3b'], ['C', '#538d4e'], ['H', '#3a3a3c']] as const;

const art = () => [
  // two staggered rows of tiles, with a question mark tile above
  `<rect x="196" y="72" width="120" height="120" rx="10" fill="#b59f3b" stroke="#111" stroke-width="6"/>`,
  `<text x="256" y="168" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="800" font-size="96" fill="#fff">?</text>`,
  ...TILES.map(([letter, fill], i) => {
    const x = 26 + i * 94;
    return `<rect x="${x}" y="226" width="84" height="84" rx="8" fill="${fill}"/>` +
      `<text x="${x + 42}" y="290" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="800" font-size="60" fill="#fff">${letter}</text>`;
  }),
  ...Array.from({ length: 5 }, (_, i) => `<rect x="${29 + i * 94}" y="333" width="78" height="78" rx="6" fill="none" stroke="#565758" stroke-width="6"/>`),
].join('');

export function iconSvg(scale = 1): string {
  const off = 256 * (1 - scale);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${ICON_BACKGROUND}"/><g transform="translate(${off} ${off}) scale(${scale})">${art()}</g></svg>`;
}
