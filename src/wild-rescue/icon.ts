// The Home Screen icon: the orange rescue truck (a paw print on its door, its light bar on) driving over a grassy hill, with a little
// fennec fox looking out of the crate, on a ranger-green sunburst like the sibling icons. One 512×512 SVG made in code from the same
// truck and animal drawings the game uses (no emoji, so it rasterises the same everywhere); tools/icons.ts rasterises it at build time.
import { DRAWN } from './art/drawn';
import { truckInner } from './art/truck';
import { starterTruck } from './park/shop';

const BG = '#3f7a32';

const rays = () => Array.from({ length: 12 }, (_, i) => {
  const a0 = ((i * 30 - 7) * Math.PI) / 180, a1 = ((i * 30 + 7) * Math.PI) / 180, r = 560, cx = 256, cy = 230;
  return `<path d="M${cx} ${cy} L${(cx + r * Math.cos(a0)).toFixed(1)} ${(cy + r * Math.sin(a0)).toFixed(1)} L${(cx + r * Math.cos(a1)).toFixed(1)} ${(cy + r * Math.sin(a1)).toFixed(1)} Z" fill="#4f8a3a"/>`;
}).join('');

const fox = `<g transform="translate(-34 -62) scale(.78)">${DRAWN.fennec}</g>`;

const art = () => `
  <circle cx="404" cy="104" r="44" fill="#ffd23f" stroke="#1d1d1f" stroke-width="8"/>
  <path d="M-40 420 Q120 360 260 392 T560 380 V560 H-40 Z" fill="#8cc152" stroke="#1d1d1f" stroke-width="10"/>
  <path d="M-40 470 Q160 430 300 456 T560 446 V560 H-40 Z" fill="#c9b27a"/>
  <g transform="translate(18 196) scale(1.86)">${truckInner({ ...starterTruck(), lights: 'bar', carrier: 'big', tires: 'mud' }, fox)}</g>`;

/** The icon as SVG. scale shrinks the art (not the background): 0.8 keeps it inside a maskable icon's safe zone. */
export function iconSvg(scale = 1): string {
  const off = 256 * (1 - scale);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${BG}"/>${rays()}<g transform="translate(${off} ${off}) scale(${scale})">${art()}</g></svg>`;
}
export const ICON_BG = BG;
