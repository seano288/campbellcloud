// The Home Screen icon: one big treasure map (an island, a dotted trail and a red X) with his ship sailing past its corner, on a
// sea-blue sunburst like the sibling icons, where one learning object is the hero and the reward rides beside it (the clock and its
// plane, the pizza and its helicopter). One 512×512 SVG made in code; tools/icons.ts rasterises it at build time.
const BG = '#1f6fae';
const O = '#1d140c';

const rays = () => Array.from({ length: 12 }, (_, i) => {
  const a0 = ((i * 30 - 7) * Math.PI) / 180, a1 = ((i * 30 + 7) * Math.PI) / 180, r = 560, cx = 230, cy = 220;
  return `<path d="M${cx} ${cy} L${(cx + r * Math.cos(a0)).toFixed(1)} ${(cy + r * Math.sin(a0)).toFixed(1)} L${(cx + r * Math.cos(a1)).toFixed(1)} ${(cy + r * Math.sin(a1)).toFixed(1)} Z" fill="#2a83c6"/>`;
}).join('');
const line = (w: number) => `stroke="${O}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

/** The map: a parchment sheet rolled at both ends, with sea in its corners, one island, the trail and the X. Drawn round (0, 0). */
const map = () => `
  <path d="M-150 -118 Q-150 -128 -140 -128 H140 Q150 -128 150 -118 V118 Q150 128 140 128 H-140 Q-150 128 -150 118 Z" fill="#f3e3b5" ${line(10)}/>
  <path d="M-138 -116 H138 V116 H-138 Z" fill="#a8d4ea"/>
  <path d="M-104 -70 Q-70 -110 -6 -96 Q60 -112 104 -66 Q132 -20 104 34 Q86 92 18 96 Q-48 108 -92 70 Q-130 26 -104 -70 Z" fill="#f1dda4" stroke="#a88a4a" stroke-width="7" stroke-linejoin="round"/>
  <path d="M-70 -46 Q-40 -66 -20 -40 Q-34 -18 -64 -24 Z" fill="#3fa34d" ${line(5)}/>
  <path d="M28 44 Q52 26 74 44 Q60 64 34 60 Z" fill="#3fa34d" ${line(5)}/>
  <path d="M-84 74 Q-60 20 -10 30 T48 -30" fill="none" stroke="#c81d25" stroke-width="10" stroke-dasharray="2 20" stroke-linecap="round"/>
  <path d="M36 -60 L84 -12 M84 -60 L36 -12" stroke="${O}" stroke-width="30" stroke-linecap="round"/>
  <path d="M36 -60 L84 -12 M84 -60 L36 -12" stroke="#d62828" stroke-width="18" stroke-linecap="round"/>
  <rect x="-166" y="-132" width="32" height="264" rx="16" fill="#e2c98c" ${line(9)}/>
  <rect x="134" y="-132" width="32" height="264" rx="16" fill="#e2c98c" ${line(9)}/>`;

/** The ship from the side: a brown hull, a white square sail, and a black flag with a skull. Stands on its waterline at (0, 0). */
const ship = () => `
  <path d="M0 0 V-170" ${line(14)}/><path d="M0 0 V-170" stroke="#8a5a2b" stroke-width="7"/>
  <path d="M-56 -150 Q0 -160 56 -150 Q66 -100 56 -46 Q0 -36 -56 -46 Q-66 -100 -56 -150 Z" fill="#f4f1e8" ${line(8)}/>
  <path d="M-52 -100 H52" stroke="#c81d25" stroke-width="10"/>
  <g transform="translate(0 -212)"><path d="M0 0 Q22 -8 44 0 Q66 8 76 0 V42 Q66 50 44 42 Q22 34 0 42 Z" fill="#1d1d1f" ${line(6)}/>
    <circle cx="38" cy="17" r="10" fill="#f4f1e8"/><rect x="33" y="25" width="10" height="6" fill="#f4f1e8"/><circle cx="34.5" cy="16" r="2.8" fill="#1d1d1f"/><circle cx="41.5" cy="16" r="2.8" fill="#1d1d1f"/></g>
  <path d="M-118 -18 L-102 40 Q0 56 94 40 L126 -24 L108 -12 L-90 -12 L-90 -28 Z" fill="#9b5f2e" ${line(10)}/>
  <path d="M-100 12 Q0 26 108 6" fill="none" stroke="#ffd23f" stroke-width="8"/>
  ${[-54, -8, 38].map(x => `<rect x="${x - 10}" y="-5" width="20" height="14" rx="4" fill="${O}"/>`).join('')}`;

const art = () => `
  <g transform="translate(214 200) rotate(-7)">${map()}</g>
  <path d="M-80 426 Q-25 406 30 426 T140 426 T250 426 T360 426 T470 426 T580 426 V620 H-80 Z" fill="#155a8f"/>
  <g transform="translate(392 420) rotate(-5) scale(.8)">${ship()}</g>
  <path d="M-80 452 Q-25 434 30 452 T140 452 T250 452 T360 452 T470 452 T580 452 V620 H-80 Z" fill="#2f8fd8"/>
  <path d="M60 446 Q86 434 112 446 M180 450 Q206 438 232 450" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/>`;

/** The icon as SVG. scale shrinks the art (not the background): 0.8 keeps it inside a maskable icon's safe zone. */
export function iconSvg(scale = 1): string {
  const off = 256 * (1 - scale);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${BG}"/>${rays()}<g transform="translate(${off} ${off}) scale(${scale})">${art()}</g></svg>`;
}
export const ICON_BG = BG;
