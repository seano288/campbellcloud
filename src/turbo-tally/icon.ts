// The Home Screen icon: a red race car from above, crossing a chequered finish line, with tally marks (a bundle of five, the fifth
// across) left behind it as its skid, on a tarmac sunburst like the sibling icons. One 512×512 SVG made in code; tools/icons.ts
// rasterises it at build time.
const BG = '#3a3f4b';
const O = '#14161b';

const rays = () => Array.from({ length: 12 }, (_, i) => {
  const a0 = ((i * 30 - 7) * Math.PI) / 180, a1 = ((i * 30 + 7) * Math.PI) / 180, r = 520, cx = 300, cy = 256;
  return `<path d="M${cx} ${cy} L${(cx + r * Math.cos(a0)).toFixed(1)} ${(cy + r * Math.sin(a0)).toFixed(1)} L${(cx + r * Math.cos(a1)).toFixed(1)} ${(cy + r * Math.sin(a1)).toFixed(1)} Z" fill="#454b58"/>`;
}).join('');
const line = (w: number) => `stroke="${O}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

/** The chequered line, upright, across the middle right. */
const flagLine = () => Array.from({ length: 16 }, (_, i) => [0, 1].map(j => `<rect x="${330 + j * 30}" y="${i * 32}" width="30" height="32" fill="${(i + j) % 2 ? '#ffffff' : O}"/>`).join('')).join('');

/** Tally marks as a skid: four strokes and the fifth across, in black rubber. */
const skid = () => `<g opacity=".85">${[0, 1, 2, 3].map(i => `<path d="M${70 + i * 34} 196 L${62 + i * 34} 318" stroke="${O}" stroke-width="16" stroke-linecap="round"/>`).join('')}<path d="M44 290 L196 214" stroke="${O}" stroke-width="16" stroke-linecap="round"/></g>`;

/** The car from above, nose to the right, centred on 0,0. */
const car = () => `
  <rect x="-92" y="-82" width="54" height="30" rx="8" fill="#1d1f24" ${line(6)}/><rect x="-92" y="52" width="54" height="30" rx="8" fill="#1d1f24" ${line(6)}/>
  <rect x="44" y="-82" width="50" height="30" rx="8" fill="#1d1f24" ${line(6)}/><rect x="44" y="52" width="50" height="30" rx="8" fill="#1d1f24" ${line(6)}/>
  <path d="M-120 -56 L60 -56 Q132 -56 132 0 Q132 56 60 56 L-120 56 Q-128 56 -128 48 L-128 -48 Q-128 -56 -120 -56 Z" fill="#e63946" ${line(8)}/>
  <rect x="-132" y="-70" width="20" height="140" rx="6" fill="#ffd23f" ${line(6)}/>
  <rect x="-110" y="-16" width="200" height="12" fill="#ffffff"/><rect x="-110" y="4" width="200" height="12" fill="#ffffff"/>
  <ellipse cx="20" cy="0" rx="30" ry="40" fill="#9fd8ff" ${line(7)}/><ellipse cx="28" cy="-14" rx="10" ry="12" fill="#fff" opacity=".7"/>
  <circle cx="86" cy="0" r="22" fill="#fff" ${line(5)}/>`;

const art = () => `${skid()}<g transform="translate(300 256) rotate(-8)">${car()}</g>`;

/** The icon as SVG. scale shrinks the art (not the background): 0.8 keeps it inside a maskable icon's safe zone. */
export function iconSvg(scale = 1): string {
  const off = 256 * (1 - scale);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${BG}"/>${rays()}${flagLine()}<g transform="translate(${off} ${off}) scale(${scale})">${art()}</g></svg>`;
}
export const ICON_BG = BG;
