// The Home Screen icon: the orange rescue truck, big and tipped up as it climbs a grassy hill on its way to a rescue, its light bar
// flashing red and blue, with a fennec fox riding up in the crate. The sunburst spins out from the light bar, so the siren is the
// middle of the picture. One 512×512 SVG made in code from the same truck and animal drawings the game uses (no emoji, so it
// rasterises the same everywhere); tools/icons.ts rasterises it at build time.
import { DRAWN } from './art/drawn';
import { truckInner } from './art/truck';
import { starterTruck } from './park/shop';

const BG = '#2f6a26', O = '#1d1d1f';
/** Where the light bar ends up once the truck is placed and tipped: the rays and beams start here. */
const SIREN = { x: 281, y: 190 };

const rays = () => Array.from({ length: 14 }, (_, i) => {
  const step = 360 / 14, a0 = ((i * step - 6) * Math.PI) / 180, a1 = ((i * step + 6) * Math.PI) / 180, r = 700, { x, y } = SIREN;
  return `<path d="M${x} ${y} L${(x + r * Math.cos(a0)).toFixed(1)} ${(y + r * Math.sin(a0)).toFixed(1)} L${(x + r * Math.cos(a1)).toFixed(1)} ${(y + r * Math.sin(a1)).toFixed(1)} Z" fill="#3f8a32"/>`;
}).join('');

/** The light bar flashing: short sparks out of each half, red at the back and blue at the front, like the sibling icons' sparks. */
const flashes = () => {
  const spark = (deg: number, c: string) => {
    const a = (deg * Math.PI) / 180, { x, y } = SIREN, p = (r: number) => `${(x + r * Math.cos(a)).toFixed(1)} ${(y + r * Math.sin(a)).toFixed(1)}`;
    return `<path d="M${p(66)} L${p(118)}" stroke="${O}" stroke-width="22" stroke-linecap="round"/><path d="M${p(66)} L${p(118)}" stroke="${c}" stroke-width="10" stroke-linecap="round"/>`;
  };
  return [-148, -122, -98].map(d => spark(d, '#ff4b4b')).join('') + [-82, -58, -32].map(d => spark(d, '#4fb3ff')).join('');
};

const fox = `<g transform="translate(-44 -78) scale(.95)">${DRAWN.fennec}</g>`;

const art = () => `
  ${flashes()}
  <path d="M-100 436 C20 418 160 394 300 372 S500 330 620 300 V620 H-100 Z" fill="#8cc152" stroke="${O}" stroke-width="10" stroke-linejoin="round"/>
  <path d="M-100 492 C80 470 240 452 380 444 S520 432 620 420 V620 H-100 Z" fill="#c9b27a" stroke="${O}" stroke-width="8" stroke-linejoin="round"/>
  <g transform="translate(256 290) rotate(-9) scale(1.8) translate(-138 -95)">${truckInner({ ...starterTruck(), lights: 'bar', carrier: 'big', tires: 'mud' }, fox)}</g>
  <g fill="#f1e4bd" stroke="${O}" stroke-width="7" stroke-linejoin="round"><circle cx="62" cy="392" r="22"/><circle cx="94" cy="408" r="15"/><circle cx="34" cy="410" r="13"/></g>`;

/** The icon as SVG. scale shrinks the art (not the background): 0.8 keeps it inside a maskable icon's safe zone. */
export function iconSvg(scale = 1): string {
  const off = 256 * (1 - scale);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${BG}"/>${rays()}<g transform="translate(${off} ${off}) scale(${scale})">${art()}</g></svg>`;
}
export const ICON_BG = BG;
