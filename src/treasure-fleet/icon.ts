// The Home Screen icon: a little ship under a skull flag sailing toward a red X on a torn scrap of map, on a sea-blue sunburst like the
// sibling icons. One 512×512 SVG made in code; tools/icons.ts rasterises it at build time.
const BG = '#1f6fae';
const O = '#1d140c';

const rays = () => Array.from({ length: 12 }, (_, i) => {
  const a0 = ((i * 30 - 7) * Math.PI) / 180, a1 = ((i * 30 + 7) * Math.PI) / 180, r = 520, cx = 256, cy = 200;
  return `<path d="M${cx} ${cy} L${(cx + r * Math.cos(a0)).toFixed(1)} ${(cy + r * Math.sin(a0)).toFixed(1)} L${(cx + r * Math.cos(a1)).toFixed(1)} ${(cy + r * Math.sin(a1)).toFixed(1)} Z" fill="#2a83c6"/>`;
}).join('');
const line = (w: number) => `stroke="${O}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

/** A scrap of parchment map with a dotted route and the X. */
const scrap = () => `
  <path d="M40 300 L120 286 L150 300 L232 290 L250 330 L238 372 L252 420 L170 436 L132 424 L60 440 L44 396 L56 352 Z" fill="#f3e3b5" ${line(9)}/>
  <path d="M74 412 Q110 360 150 380 T204 334" fill="none" stroke="#c81d25" stroke-width="7" stroke-dasharray="4 14" stroke-linecap="round"/>
  <path d="M188 318 L224 354 M224 318 L188 354" stroke="#c81d25" stroke-width="15" stroke-linecap="round"/>`;

/** The ship from the side: a brown hull, a white square sail, and a black flag with a skull. */
const ship = () => `
  <path d="M0 0 V-190" ${line(14)}/><path d="M0 0 V-190" stroke="#8a5a2b" stroke-width="7"/>
  <path d="M-62 -164 Q0 -176 62 -164 Q72 -110 62 -50 Q0 -40 -62 -50 Q-72 -110 -62 -164 Z" fill="#f4f1e8" ${line(8)}/>
  <path d="M-58 -112 H58" stroke="#c81d25" stroke-width="10"/>
  <g transform="translate(0 -232)"><path d="M0 0 Q24 -8 48 0 Q72 8 84 0 V46 Q72 54 48 46 Q24 38 0 46 Z" fill="#1d1d1f" ${line(6)}/>
    <circle cx="42" cy="18" r="11" fill="#f4f1e8"/><rect x="36" y="27" width="12" height="7" fill="#f4f1e8"/><circle cx="38" cy="17" r="3" fill="#1d1d1f"/><circle cx="46" cy="17" r="3" fill="#1d1d1f"/></g>
  <path d="M-130 -18 L-112 44 Q0 62 104 44 L138 -26 L118 -14 L-100 -14 L-100 -30 Z" fill="#9b5f2e" ${line(10)}/>
  <path d="M-110 14 Q0 30 118 8" fill="none" stroke="#ffd23f" stroke-width="8"/>
  ${[-60, -10, 40].map(x => `<rect x="${x - 11}" y="-6" width="22" height="16" rx="4" fill="${O}"/>`).join('')}`;

const art = () => `
  <path d="M-20 400 Q60 380 140 400 T300 400 T460 400 T620 400 V560 H-20 Z" fill="#155a8f"/>
  ${scrap()}
  <g transform="translate(330 380) rotate(-4)">${ship()}</g>
  <path d="M190 470 Q250 452 310 470 T430 470 T540 470 V560 H180 Z" fill="#2f8fd8" opacity=".9"/>
  <path d="M220 452 Q250 440 280 452 M380 446 Q410 434 440 446" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/>`;

/** The icon as SVG. scale shrinks the art (not the background): 0.8 keeps it inside a maskable icon's safe zone. */
export function iconSvg(scale = 1): string {
  const off = 256 * (1 - scale);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${BG}"/>${rays()}<circle cx="430" cy="90" r="42" fill="#ffd23f" stroke="${O}" stroke-width="8"/><g transform="translate(${off} ${off}) scale(${scale})">${art()}</g></svg>`;
}
export const ICON_BG = BG;
