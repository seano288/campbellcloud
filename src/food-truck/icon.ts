// The Home Screen icon: a ketchup-red food truck from the side, its hatch open under a red-and-white striped awning, warm bulbs along it,
// and a big $ on the sign on its roof. On warm bulb yellow with rays, the street-fair yellow no sibling icon uses. One 512×512 SVG made
// in code (no emoji, so it rasterises the same everywhere); tools/icons.ts rasterises it at build time, and the landing tile uses it.
const BG = '#ffc93c';
const O = '#1d1d1f';
const RED = '#e63946';
const MINT = '#3ccf9a';

const rays = () => Array.from({ length: 12 }, (_, i) => {
  const a0 = ((i * 30 - 7) * Math.PI) / 180, a1 = ((i * 30 + 7) * Math.PI) / 180, r = 520, cx = 256, cy = 256;
  return `<path d="M${cx} ${cy} L${(cx + r * Math.cos(a0)).toFixed(1)} ${(cy + r * Math.sin(a0)).toFixed(1)} L${(cx + r * Math.cos(a1)).toFixed(1)} ${(cy + r * Math.sin(a1)).toFixed(1)} Z" fill="#ffdb73"/>`;
}).join('');
const line = (w: number) => `stroke="${O}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

/** The truck, nose to the right, its wheels on y = 0, centred on x = 0. */
const truck = () => {
  const scallops = Array.from({ length: 6 }, (_, i) => {
    const x = -190 + i * 46;
    return `<path d="M${x} -232 H${x + 46} V-206 A23 18 0 0 1 ${x} -206 Z" fill="${i % 2 ? '#fff' : RED}" ${line(6)}/>`;
  }).join('');
  const bulbs = Array.from({ length: 6 }, (_, i) => `<circle cx="${-167 + i * 46}" cy="-176" r="9" fill="#fff6a8" ${line(4)}/>`).join('');
  return `
  <rect x="-150" y="-338" width="168" height="80" rx="20" fill="#fffbe9" ${line(9)}/>
  <circle cx="-66" cy="-298" r="30" fill="${MINT}" ${line(6)}/>
  <path d="M-54 -314 Q-66 -324 -78 -316 Q-90 -306 -74 -298 L-58 -294 Q-42 -288 -56 -278 Q-68 -272 -80 -282 M-66 -330 V-266" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round"/>
  <path d="M-120 -258 V-232 M-12 -258 V-232" ${line(10)}/>
  <path d="M-200 -238 H118 Q140 -238 146 -214 L156 -186 H196 Q222 -186 226 -152 L228 -52 Q228 -40 216 -40 H-206 Q-218 -40 -218 -52 V-218 Q-218 -238 -200 -238 Z" fill="${RED}" ${line(10)}/>
  <path d="M160 -174 H192 Q212 -174 214 -150 V-128 H160 Z" fill="#bfe3ff" ${line(7)}/>
  <rect x="-196" y="-212" width="300" height="118" rx="8" fill="#2b2f36" ${line(8)}/>
  <rect x="-186" y="-128" width="280" height="14" fill="#c9d1dc"/>
  <circle cx="-130" cy="-148" r="22" fill="#f6dfa0" ${line(5)}/><path d="M-150 -150 Q-130 -176 -110 -150" fill="#7fc95a" ${line(4)}/>
  <rect x="-60" y="-152" width="56" height="20" rx="5" fill="#555c66" stroke="#ff8a1f" stroke-width="5"/>
  <rect x="-206" y="-100" width="320" height="20" rx="6" fill="#dfe6ee" ${line(7)}/>
  ${scallops}${bulbs}
  <rect x="-218" y="-70" width="446" height="12" fill="#fff" opacity=".85"/>
  ${[-130, 150].map(x => `<circle cx="${x}" cy="-30" r="44" fill="#1a1a1a" ${line(7)}/><circle cx="${x}" cy="-30" r="20" fill="#ffc93c" ${line(5)}/>`).join('')}`;
};

const art = () => `<g transform="translate(256 412)">${truck()}</g>`;

/** The icon as SVG. scale shrinks the art (not the background): 0.8 keeps it inside a maskable icon's safe zone. */
export function iconSvg(scale = 1): string {
  const off = 256 * (1 - scale);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${BG}"/>${rays()}<g transform="translate(${off} ${off}) scale(${scale})">${art()}</g></svg>`;
}
export const ICON_BG = BG;
