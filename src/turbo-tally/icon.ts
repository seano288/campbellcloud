// The Home Screen icon: a pit-lane yellow race car from above, on a strip of tarmac running up the icon, crossing a chequered finish
// line, with a tally (four skid streaks and the fifth across them) left behind it on the road. On a signal-red sunburst, the race-day
// red no sibling icon uses. One 512×512 SVG made in code; tools/icons.ts rasterises it at build time, and the landing tile uses it.
const BG = '#e63946';
const O = '#14161b';
const ROAD = '#5b6170';

const rays = () => Array.from({ length: 12 }, (_, i) => {
  const a0 = ((i * 30 - 7) * Math.PI) / 180, a1 = ((i * 30 + 7) * Math.PI) / 180, r = 520, cx = 256, cy = 256;
  return `<path d="M${cx} ${cy} L${(cx + r * Math.cos(a0)).toFixed(1)} ${(cy + r * Math.sin(a0)).toFixed(1)} L${(cx + r * Math.cos(a1)).toFixed(1)} ${(cy + r * Math.sin(a1)).toFixed(1)} Z" fill="#f2606a"/>`;
}).join('');
const line = (w: number) => `stroke="${O}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

// Everything below is drawn along the road: x runs the way the car races, y across the road, centred on 0,0.
const HALF = 112; // half the road's width

/** The road, long enough to run off the icon at both ends even when scaled into a maskable icon's safe zone. */
const road = () => `<rect x="-470" y="${-HALF}" width="940" height="${HALF * 2}" fill="${ROAD}"/>
  <path d="M-470 ${-HALF} H470 M-470 ${HALF} H470" ${line(9)}/>
  <path d="M-470 ${-HALF + 16} H470 M-470 ${HALF - 16} H470" stroke="#fff" stroke-width="7"/>`;

/** The chequered finish line, right across the road. */
const finish = (x: number) => {
  const rows = 8, s = (HALF * 2) / rows;
  return `${Array.from({ length: rows }, (_, i) => [0, 1].map(j => `<rect x="${x + j * s}" y="${-HALF + i * s}" width="${s}" height="${s}" fill="${(i + j) % 2 ? '#ffffff' : O}"/>`).join('')).join('')}
  <path d="M${x} ${-HALF} V${HALF} M${x + 2 * s} ${-HALF} V${HALF}" ${line(5)}/>`;
};

/** The skid: four rubber streaks laid down the road behind the car, and the fifth across them, a tally bundle of five. */
const skid = () => `<g stroke="${O}" stroke-linecap="round" opacity=".9">
  ${[-54, -18, 18, 54].map(y => `<path d="M-256 ${y} L-100 ${y}" stroke-width="20"/>`).join('')}
  <path d="M-244 80 L-112 -80" stroke-width="22"/></g>`;

/** The car from above, nose along +x, centred on 0,0. */
const car = () => `
  <rect x="-92" y="-84" width="56" height="32" rx="9" fill="#1d1f24" ${line(7)}/><rect x="-92" y="52" width="56" height="32" rx="9" fill="#1d1f24" ${line(7)}/>
  <rect x="44" y="-84" width="52" height="32" rx="9" fill="#1d1f24" ${line(7)}/><rect x="44" y="52" width="52" height="32" rx="9" fill="#1d1f24" ${line(7)}/>
  <path d="M-120 -58 L60 -58 Q136 -58 136 0 Q136 58 60 58 L-120 58 Q-130 58 -130 48 L-130 -48 Q-130 -58 -120 -58 Z" fill="#ffd23f" ${line(9)}/>
  <path d="M-128 -14 H122 M-128 14 H122" stroke="${BG}" stroke-width="13"/>
  <rect x="-140" y="-74" width="24" height="148" rx="7" fill="${BG}" ${line(7)}/>
  <ellipse cx="18" cy="0" rx="32" ry="40" fill="#9fd8ff" ${line(8)}/><ellipse cx="26" cy="-15" rx="10" ry="12" fill="#fff" opacity=".75"/>
  <circle cx="-62" cy="0" r="26" fill="#fff" ${line(6)}/>
  <path d="M-72 -12 H-52 L-64 14" fill="none" ${line(7)}/>`;

/** The scene along the road, then turned so the road climbs from lower left to upper right. */
const art = () => `<g transform="translate(256 256) rotate(-32) translate(36 0)">${road()}${skid()}${finish(34)}<g transform="translate(66 0) scale(.8)">${car()}</g></g>`;

/** The icon as SVG. scale shrinks the art (not the background): 0.8 keeps it inside a maskable icon's safe zone. */
export function iconSvg(scale = 1): string {
  const off = 256 * (1 - scale);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${BG}"/>${rays()}<g transform="translate(${off} ${off}) scale(${scale})">${art()}</g></svg>`;
}
export const ICON_BG = BG;
