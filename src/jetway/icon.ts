// The Home Screen icon: a jet bridge meeting a plane's door, with a plus sign on the tail (adding is the game). A white jet on a sky-blue
// field over a strip of tarmac with the taxiway's yellow line, the high-visibility orange tail no sibling icon uses. One 512×512 SVG made
// in code; tools/icons.ts rasterises it at build time, and the landing tile uses it.
const BG = '#3d93dc';
const O = '#14161b';
const line = (w: number) => `stroke="${O}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

const art = () => `
  <rect x="-40" y="410" width="600" height="160" fill="#5b616d"/>
  <path d="M-40 410 H560" ${line(8)}/>
  <path d="M-40 470 H560" stroke="#ffd23f" stroke-width="10" stroke-dasharray="40 26"/>
  <path d="M120 400 L96 440 M300 400 L324 440" ${line(10)}/>
  <circle cx="96" cy="446" r="18" fill="${O}"/><circle cx="324" cy="446" r="18" fill="${O}"/>
  <path d="M392 262 L430 98 L500 98 L520 262 Z" fill="#ff7a00" ${line(10)}/>
  <circle cx="468" cy="168" r="40" fill="${O}"/>
  <path d="M468 140 V196 M440 168 H496" stroke="#ffd23f" stroke-width="16" stroke-linecap="round"/>
  <path d="M40 252 H470 Q530 252 530 300 Q530 396 470 396 H96 Q24 396 22 330 Q20 252 40 252 Z" fill="#f4f6fa" ${line(10)}/>
  <path d="M30 330 Q34 300 66 296 H104 L96 332 Z" fill="#2a4a6a" ${line(6)}/>
  ${[0, 1, 2, 3, 4, 5].map(i => `<circle cx="${262 + i * 40}" cy="300" r="11" fill="#9fd8ff" ${line(4)}/>`).join('')}
  <path d="M150 330 L430 330" stroke="#ff7a00" stroke-width="12"/>
  <rect x="166" y="276" width="56" height="102" rx="10" fill="#ffd23f" ${line(8)}/>
  <rect x="-30" y="150" width="190" height="86" fill="#b8c2cc" ${line(10)}/>
  ${[0, 1, 2, 3].map(i => `<path d="M${-6 + i * 40} 152 V234" stroke="#8a96a3" stroke-width="8"/>`).join('')}
  <path d="M150 136 H240 V286 Q240 296 230 296 H158 Q150 296 150 286 Z" fill="#d9dee4" ${line(10)}/>
  <rect x="166" y="160" width="58" height="36" rx="6" fill="#2a4a6a"/>
  <path d="M60 236 V400" ${line(14)}/>`;

/** The icon as SVG. scale shrinks the art (not the background): 0.8 keeps it inside a maskable icon's safe zone. */
export function iconSvg(scale = 1): string {
  const off = 256 * (1 - scale);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${BG}"/><rect y="0" width="512" height="200" fill="#5aa8e8"/><g transform="translate(${off} ${off}) scale(${scale})">${art()}</g></svg>`;
}
export const ICON_BG = BG;
