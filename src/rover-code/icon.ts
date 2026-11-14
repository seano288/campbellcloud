// The Home Screen icon: his starter rocket blasting off over a little planet, with the yellow rover parked on it and a ➡ step from its
// program, on a deep-space sunburst like the sibling icons. One 512×512 SVG made in code; tools/icons.ts rasterises it at build time.
const BG = '#1b2a6b';
const O = '#11131c';

const rays = () => Array.from({ length: 12 }, (_, i) => {
  const a0 = ((i * 30 - 7) * Math.PI) / 180, a1 = ((i * 30 + 7) * Math.PI) / 180, r = 520, cx = 300, cy = 220;
  return `<path d="M${cx} ${cy} L${(cx + r * Math.cos(a0)).toFixed(1)} ${(cy + r * Math.sin(a0)).toFixed(1)} L${(cx + r * Math.cos(a1)).toFixed(1)} ${(cy + r * Math.sin(a1)).toFixed(1)} Z" fill="#26398a"/>`;
}).join('');
const stars = () => [[70, 80, 5], [120, 190, 3], [430, 70, 4], [470, 300, 3], [60, 300, 4], [210, 60, 3]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff"/>`).join('');
const line = (w: number) => `stroke="${O}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

/** The rocket, nose up, centred on 0,0 (about 300 tall), as draw.ts draws the starter: white with red trim, one engine. */
const rocket = () => `
  <path d="M-22 98 Q0 210 22 98 Z" fill="#ff5a10"/><path d="M-13 98 Q0 175 13 98 Z" fill="#ffb02e"/><path d="M-7 98 Q0 140 7 98 Z" fill="#fff6c2"/>
  <path d="M-12 70 L12 70 L20 100 L-20 100 Z" fill="#5b6170" ${line(6)}/>
  <path d="M-46 16 L-76 76 L-46 64 Z M46 16 L76 76 L46 64 Z" fill="#e63946" ${line(7)}/>
  <rect x="-46" y="-80" width="92" height="152" rx="18" fill="#f4f6fa" ${line(8)}/>
  <ellipse cx="-24" cy="0" rx="8" ry="44" fill="#ffffff" opacity=".6"/>
  <circle cx="0" cy="-36" r="19" fill="#9fd8ff" ${line(7)}/><circle cx="-6" cy="-42" r="6" fill="#fff"/>
  <path d="M-46 -78 Q-23 -128 0 -146 Q23 -128 46 -78 Z" fill="#e63946" ${line(8)}/>`;

/** The rover from the side, standing on 0, facing right. */
const rover = () => `
  <path d="M26 -46 V-78" ${line(10)}/><path d="M26 -46 V-78" stroke="#d7dce4" stroke-width="4"/>
  <rect x="10" y="-100" width="44" height="26" rx="9" fill="#f4f6fa" ${line(6)}/><circle cx="42" cy="-87" r="7" fill="${O}"/>
  <rect x="-60" y="-70" width="120" height="44" rx="13" fill="#ffd23f" ${line(7)}/>
  <rect x="-48" y="-61" width="50" height="22" rx="5" fill="#2f6fd6" ${line(4)}/>
  ${[-42, 0, 42].map(x => `<circle cx="${x}" cy="-17" r="17" fill="#2a2d36" ${line(6)}/><circle cx="${x}" cy="-17" r="7" fill="#c9ccd6"/>`).join('')}`;

const art = () => `
  <g transform="translate(300 214) rotate(18) scale(1.02)">${rocket()}</g>
  <path d="M-40 512 Q-30 368 256 352 Q542 368 552 512 Z" fill="#cfd3dc" ${line(10)}/>
  <ellipse cx="150" cy="430" rx="34" ry="12" fill="#00000022"/><ellipse cx="380" cy="456" rx="26" ry="9" fill="#00000022"/>
  <g transform="translate(150 380) scale(1.05)">${rover()}</g>
  <g transform="translate(350 410)"><rect x="-38" y="-30" width="76" height="60" rx="14" fill="#3ddc84" ${line(7)}/><path d="M-22 -9 H6 V-20 L24 0 L6 20 V9 H-22 Z" fill="#fff" ${line(5)}/></g>`;

/** The icon as SVG. scale shrinks the art (not the background): 0.8 keeps it inside a maskable icon's safe zone. */
export function iconSvg(scale = 1): string {
  const off = 256 * (1 - scale);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${BG}"/>${rays()}${stars()}<g transform="translate(${off} ${off}) scale(${scale})">${art()}</g></svg>`;
}
export const ICON_BG = BG;
