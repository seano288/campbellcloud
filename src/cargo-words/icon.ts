// The Home Screen icon: a crane's grab (the safety-yellow spreader) holding one rust-red shipping container over sea-green water, the
// crane's lattice boom and its trolley across the top. The container is the game's own: corrugated sides, dark rails along the top and
// bottom, a corner casting at each corner and the doors' locking bars at its right end, with a syllable, "rab", on a white plate. The
// letters are drawn as strokes in the shape of the reading font (a single-storey a), so they look the same wherever the icon is drawn,
// whatever fonts that place has. Keeps apart from Treasure Fleet (a pirate ship) and Carrier Deck (aircraft at sea): this one is the
// crane at the dock. Thick dark outlines, like the family's icons. One 512×512 SVG made in code; tools/icons.ts rasterises it, and the
// landing tile uses it.
const BG = '#7fd0e6';
const O = '#14161b';
const line = (w: number) => `stroke="${O}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

/** Sky, far hills, the sea and the boom: drawn edge to edge, outside the safe-zone scaling. */
const scene = () => `
  <rect width="512" height="512" fill="${BG}"/>
  <path d="M0 392 L0 352 Q70 318 140 346 T290 336 T430 330 T512 340 V392 Z" fill="#93b8ad"/>
  <rect x="0" y="392" width="512" height="120" fill="#1f9a8a"/>
  <path d="M0 392 H512" ${line(10)}/>
  ${[0, 1, 2].map(i => `<path d="M${36 + i * 170} ${440 + (i % 2) * 34} h76" stroke="#ffffff" stroke-opacity=".5" stroke-width="10" stroke-linecap="round"/>`).join('')}
  <rect x="-20" y="40" width="552" height="54" fill="#ffcc00" ${line(12)}/>
  <path d="M-20 88 ${Array.from({ length: 8 }, (_, i) => `L${18 + i * 76} 46 L${56 + i * 76} 88`).join(' ')}" fill="none" stroke="#b38600" stroke-width="9" stroke-linejoin="round"/>
  <path d="M-20 40 H532 M-20 94 H532" ${line(12)}/>`;

/** "rab" in strokes, shaped like Andika: a short-armed r, a round single-storey a, and a b with its tall stem. */
const word = () => `
  <g fill="none" stroke="${O}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round">
    <path d="M194 308 V352 M194 330 Q198 310 222 311"/>
    <circle cx="256" cy="331" r="19"/><path d="M275 308 V352"/>
    <path d="M300 282 V352"/><circle cx="320" cy="331" r="19"/>
  </g>`;

const art = () => `
  <rect x="190" y="88" width="132" height="44" rx="8" fill="#3a3f44" ${line(10)}/>
  <circle cx="216" cy="94" r="9" fill="${O}"/><circle cx="296" cy="94" r="9" fill="${O}"/>
  <path d="M222 132 L170 210 M290 132 L342 210" ${line(10)}/>
  <rect x="116" y="204" width="280" height="34" rx="6" fill="#ffcc00" ${line(12)}/>
  <rect x="96" y="236" width="320" height="170" rx="8" fill="#c8452f" ${line(12)}/>
  ${Array.from({ length: 9 }, (_, i) => `<path d="M${128 + i * 30} 258 V384" stroke="#8a2e1f" stroke-width="8"/><path d="M${120 + i * 30} 258 V384" stroke="#e2704f" stroke-width="4"/>`).join('')}
  <rect x="102" y="242" width="308" height="14" fill="#8a2e1f"/><rect x="102" y="386" width="308" height="14" fill="#8a2e1f"/>
  <path d="M378 262 V380 M394 262 V380" stroke="${O}" stroke-width="7" stroke-linecap="round"/>
  ${[[102, 242], [386, 242], [102, 376], [386, 376]].map(([x, y]) => `<rect x="${x}" y="${y}" width="24" height="24" fill="#2a2a2a"/>`).join('')}
  <rect x="96" y="236" width="320" height="170" rx="8" fill="none" ${line(12)}/>
  <rect x="167" y="272" width="190" height="100" rx="22" fill="#ffffff" ${line(9)}/>
  ${word()}`;

/** The icon as SVG. scale shrinks the art (not the background): 0.8 keeps it inside a maskable icon's safe zone. */
export function iconSvg(scale = 1): string {
  const off = 256 * (1 - scale);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${scene()}<g transform="translate(${off} ${off}) scale(${scale})">${art()}</g></svg>`;
}
export const ICON_BG = BG;
