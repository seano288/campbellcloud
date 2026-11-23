// The Home Screen icon: a jet bridge meeting a plane's door, with a plus sign on the tail (adding is the game). A chunky white jet, nose
// left, stands on the tarmac in front of the terminal's glass wall; the grey jet bridge reaches out of the glass to its yellow door, and
// its high-visibility orange tail carries a big white plus. The glass wall (teal, which no sibling uses) keeps it apart from Time Flies
// (a blue sunburst) and Sky Writer (open sky): this one is at the gate, not in the air. Thick dark outlines, like the family's icons, so
// it reads at Home Screen size. One 512×512 SVG made in code; tools/icons.ts rasterises it at build time, and the landing tile uses it.
const BG = '#5cc3d6';
const O = '#14161b';
const line = (w: number) => `stroke="${O}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

/** The terminal's glass wall behind: panes, mullions and a few sky reflections. Drawn edge to edge, outside the safe-zone scaling. */
const glass = () => `
  <rect width="512" height="512" fill="${BG}"/>
  ${[0, 1, 2, 3, 4].map(i => `<path d="M${i * 128 - 40} 0 L${i * 128 + 60} 0 L${i * 128 - 120} 400 L${i * 128 - 220} 400 Z" fill="#ffffff" fill-opacity=".18"/>`).join('')}
  ${[86, 172, 258, 344, 430].map(x => `<rect x="${x - 5}" y="0" width="10" height="400" fill="#2f8fa3"/>`).join('')}
  <rect x="0" y="128" width="512" height="10" fill="#2f8fa3"/><rect x="0" y="262" width="512" height="10" fill="#2f8fa3"/>
  <rect x="0" y="392" width="512" height="120" fill="#4a5262"/>
  <path d="M0 392 H512" ${line(10)}/>
  <path d="M-10 468 H530" stroke="#ffd23f" stroke-width="14" stroke-dasharray="46 26"/>`;

const art = () => `
  <path d="M232 332 L338 332 L454 422 L404 432 Z" fill="#b8c2cc" ${line(12)}/>
  <ellipse cx="322" cy="388" rx="54" ry="28" fill="#dfe5ec" ${line(12)}/>
  <ellipse cx="274" cy="388" rx="12" ry="20" fill="#2a4a6a"/>
  <path d="M128 362 V408 M380 362 V408" ${line(14)}/>
  <circle cx="128" cy="416" r="20" fill="${O}"/><circle cx="380" cy="416" r="20" fill="${O}"/>
  <path d="M376 236 L414 62 H490 L488 236 Z" fill="#ff7a00" ${line(12)}/>
  <path d="M448 104 V188 M406 146 H490" stroke="${O}" stroke-width="44" stroke-linecap="round"/>
  <path d="M448 104 V188 M406 146 H490" stroke="#ffffff" stroke-width="24" stroke-linecap="round"/>
  <path d="M104 226 H396 L488 216 L488 262 L424 364 H96 Q24 364 22 296 Q22 226 104 226 Z" fill="#f4f6fa" ${line(12)}/>
  <path d="M30 330 Q60 364 96 364 H424 L450 326 Z" fill="#c9d1da"/>
  <path d="M104 226 H396 L488 216 L488 262 L424 364 H96 Q24 364 22 296 Q22 226 104 226 Z" fill="none" ${line(12)}/>
  <path d="M34 272 Q42 250 70 248 H96 L90 276 Z" fill="#2a4a6a" ${line(7)}/>
  <path d="M64 306 H458" stroke="#ff7a00" stroke-width="16"/>
  ${[0, 1, 2, 3, 4].map(i => `<rect x="${222 + i * 40}" y="256" width="22" height="26" rx="8" fill="#2a4a6a"/>`).join('')}
  <rect x="124" y="244" width="62" height="108" rx="12" fill="#ffd23f" ${line(10)}/>
  <path d="M-20 104 L150 142 L150 236 L-20 236 Z" fill="#c9d1da" ${line(12)}/>
  ${[0, 1, 2, 3].map(i => `<path d="M${10 + i * 34} ${111 + i * 7.6} V232" stroke="#8a96a3" stroke-width="10"/>`).join('')}
  <path d="M136 132 H208 V246 H136 Z" fill="#8a96a3" ${line(12)}/>
  <path d="M146 210 H198" stroke="#2a3038" stroke-width="10"/>
  <path d="M60 236 V392" ${line(16)}/>
  <rect x="34" y="384" width="54" height="24" rx="10" fill="${O}"/>`;

/** The icon as SVG. scale shrinks the art (not the glass wall): 0.8 keeps it inside a maskable icon's safe zone. */
export function iconSvg(scale = 1): string {
  const off = 256 * (1 - scale);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${glass()}<g transform="translate(${off} ${off}) scale(${scale})">${art()}</g></svg>`;
}
export const ICON_BG = BG;
