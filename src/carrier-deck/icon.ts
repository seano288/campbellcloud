// The Home Screen icon: the carrier's bow from the side with one jet lifting off it, at dawn. A grey bow juts in from the lower left
// over a navy sea, its dark flight deck edged in white and dashed in yellow along the catapult, a red waterline under it and a puff of
// catapult steam at the deck's edge. A chunky jet in deck-crew blue, with a yellow wing and a green fin, climbs away up and to the
// right. The sunburst every sibling icon has spins out from the jet, in sunrise golds: warm where Time Flies and Treasure Fleet are
// blue, open sea where Jetway is an airport gate. Thick dark outlines so it reads at Home Screen size. One 512×512 SVG made in code;
// tools/icons.ts rasterises it at build time, and the landing tile uses it.
const BG = '#ff9a3d', RAY = '#ffb65e', SEA = '#12305e', SEA2 = '#1f4f8a', O = '#14161b';
const HULL = '#8e9aa6', HULL2 = '#6b7783', DECK = '#3a4150', WHITE = '#f4f6fa', YELLOW = '#ffd23f', RED = '#c8202f';
const JET = '#2f8fe8', JET2 = '#1d6cc0', FIN = '#2fa84f';
/** The jet's middle: the rays spin out from here. */
const JET_AT = { x: 322, y: 178 };
const line = (w: number) => `stroke="${O}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const rad = (d: number) => (d * Math.PI) / 180;
const f1 = (n: number) => n.toFixed(1);

const rays = () => Array.from({ length: 14 }, (_, i) => {
  const step = 360 / 14, a0 = rad(i * step - 6.5), a1 = rad(i * step + 6.5), r = 800, { x, y } = JET_AT;
  return `<path d="M${x} ${y} L${f1(x + r * Math.cos(a0))} ${f1(y + r * Math.sin(a0))} L${f1(x + r * Math.cos(a1))} ${f1(y + r * Math.sin(a1))} Z" fill="${RAY}"/>`;
}).join('');

/** The sky, its rays and the sea, edge to edge, outside the safe-zone scaling. */
const backdrop = () => `
  <rect width="512" height="512" fill="${BG}"/>${rays()}
  <rect x="0" y="388" width="512" height="124" fill="${SEA}"/>
  <path d="M0 388 H512" stroke="${O}" stroke-width="6"/>
  <path d="M250 420 Q282 408 314 420 T378 420 T442 420 T506 420" fill="none" stroke="${SEA2}" stroke-width="10" stroke-linecap="round"/>
  <path d="M120 466 Q152 454 184 466 T248 466 T312 466 T376 466 T440 466 T504 466" fill="none" stroke="${SEA2}" stroke-width="10" stroke-linecap="round"/>`;

/** The bow, from the left edge out to its raked stem. */
const bow = () => `
  <path d="M-40 300 H262 L306 292 L252 440 H-40 Z" fill="${HULL}" ${line(14)}/>
  <path d="M-40 400 H266" stroke="${RED}" stroke-width="22"/>
  <path d="M-40 388 H270" stroke="${O}" stroke-width="5"/>
  <path d="M-40 340 H286" stroke="${HULL2}" stroke-width="10"/>
  <path d="M-40 272 H300 L310 300 H-40 Z" fill="${DECK}" ${line(12)}/>
  <path d="M-30 280 H292" stroke="${WHITE}" stroke-width="6"/>
  <path d="M0 290 H280" stroke="${YELLOW}" stroke-width="9" stroke-dasharray="34 20"/>
  <circle cx="60" cy="366" r="9" fill="${O}"/><circle cx="110" cy="366" r="9" fill="${O}"/><circle cx="160" cy="366" r="9" fill="${O}"/>
  <path d="M222 318 L240 346" stroke="${O}" stroke-width="9" stroke-linecap="round"/>
  <circle cx="300" cy="256" r="24" fill="${WHITE}" ${line(8)}/>
  <circle cx="262" cy="250" r="18" fill="${WHITE}" ${line(7)}/>
  <circle cx="232" cy="260" r="12" fill="${WHITE}" ${line(6)}/>`;

/** The jet, climbing away to the upper right. */
const jet = () => `
  <g transform="translate(${JET_AT.x} ${JET_AT.y}) rotate(-24) scale(1.3)">
    <path d="M-118 -10 L-170 -18 M-118 10 L-176 14" stroke="${WHITE}" stroke-width="12" stroke-linecap="round" opacity=".9"/>
    <path d="M-62 -10 L-92 -64 H-60 L-22 -12 Z" fill="${FIN}" ${line(10)}/>
    <path d="M-104 0 Q-104 -24 -64 -24 H46 Q96 -24 118 0 Q96 22 46 22 H-64 Q-104 22 -104 0 Z" fill="${JET}" ${line(12)}/>
    <path d="M-96 8 H90" stroke="${JET2}" stroke-width="8" stroke-linecap="round"/>
    <path d="M42 -20 Q70 -26 92 -10 L64 -2 Z" fill="#bfe6ff" ${line(8)}/>
    <path d="M-30 6 L-70 66 H-34 L18 10 Z" fill="${YELLOW}" ${line(10)}/>
  </g>`;

const art = () => `${bow()}${jet()}`;

/** The icon as SVG. scale shrinks the art (not the sky and sea): 0.8 keeps it inside a maskable icon's safe zone. */
export function iconSvg(scale = 1): string {
  const off = 256 * (1 - scale);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${backdrop()}<g transform="translate(${off} ${off}) scale(${scale})">${art()}</g></svg>`;
}
export const ICON_BG = BG;
