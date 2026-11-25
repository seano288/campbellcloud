// The Home Screen icon: a red monster truck in the air, nose up, over a yellow ruler with black ticks and numbers, on a night arena: dark
// sky, two floodlight beams, a dirt-brown floor. The sunburst and the thick dark outlines make it a sibling of the other games' icons;
// the night brown keeps it apart from Turbo Tally's track and Monster Truck Money's garage. One 512×512 SVG made in code; tools/icons.ts
// rasterises it, and the landing tile uses it.

const BG = '#1a1206';
const O = '#120d05';
const line = (w: number) => `stroke="${O}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

const scene = () => `<rect width="512" height="512" fill="${BG}"/>
  <path d="M60 0 L180 512 L-60 512 Z" fill="#fff6c4" opacity=".12"/><path d="M452 0 L572 512 L330 512 Z" fill="#fff6c4" opacity=".12"/>
  ${[[70, 70, 5], [440, 60, 6], [470, 220, 4], [40, 230, 4], [260, 40, 3], [350, 120, 3], [150, 140, 3]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff"/>`).join('')}
  <rect x="0" y="420" width="512" height="92" fill="#6b4226"/>`;

/** The ruler: yellow, ticks every inch-ish step, numbers 0 to 4, zero a little in from the end. */
const ruler = () => {
  let ticks = '';
  for (let i = 0; i <= 16; i++) {
    const x = 56 + i * 25, big = i % 4 === 0;
    ticks += `<path d="M${x} 372 V${big ? 404 : 390}" ${line(big ? 7 : 5)}/>`;
    if (big) ticks += `<text x="${x}" y="440" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="34" text-anchor="middle" fill="${O}">${i / 4}</text>`;
  }
  return `<rect x="30" y="368" width="452" height="84" rx="12" fill="#ffd23f" ${line(10)}/>${ticks}`;
};

const truck = () => `
  <circle cx="-62" cy="40" r="42" fill="#1b1e24" ${line(8)}/><circle cx="-62" cy="40" r="16" fill="#9aa3ad"/>
  <circle cx="72" cy="40" r="42" fill="#1b1e24" ${line(8)}/><circle cx="72" cy="40" r="16" fill="#9aa3ad"/>
  <path d="M-52 10 V-6 M62 10 V-6" stroke="#c9d1da" stroke-width="8"/>
  <path d="M-112 -10 L-112 -58 L110 -50 L124 -30 L124 -10 Z" fill="#e63946" ${line(9)}/>
  <path d="M-30 -56 L-24 -110 L46 -110 L62 -54 Z" fill="#e63946" ${line(9)}/>
  <path d="M-14 -62 L-10 -98 L36 -98 L46 -62 Z" fill="#bfe6ff" ${line(6)}/>
  <path d="M-112 -40 L124 -32" stroke="#ffd23f" stroke-width="9"/>
  <path d="M-58 -52 L-82 -24 L-62 -24 L-74 -2 L-44 -32 L-62 -32 Z" fill="#ffd23f" ${line(4)}/>`;

const art = () => `${ruler()}
  <path d="M120 300 Q200 220 300 250" fill="none" stroke="#fff" stroke-width="7" stroke-dasharray="4 16" stroke-linecap="round" opacity=".7"/>
  <g transform="translate(276 196) rotate(-16) scale(1.08)">${truck()}</g>`;

/** The icon as SVG. scale shrinks the art (not the background): 0.8 keeps it inside a maskable icon's safe zone. */
export function iconSvg(scale = 1): string {
  const off = 256 * (1 - scale);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${scene()}<g transform="translate(${off} ${off}) scale(${scale})">${art()}</g></svg>`;
}
export const ICON_BG = BG;
