// The Home Screen icon: the carrier's bow from the side with one jet lifting off it. A grey bow juts in from the left over navy water,
// its dark flight deck striped yellow and white, a puff of catapult steam at the deck's edge, and a chunky yellow jet climbing away up
// and to the right with a deck-crew green tail. Navy sea and a bright sky keep it apart from Treasure Fleet (a sailing ship) and Jetway
// (at the gate). Thick dark outlines, like the family's icons, so it reads at Home Screen size. One 512×512 SVG made in code;
// tools/icons.ts rasterises it at build time, and the landing tile uses it.
const BG = '#3d93dc';
const O = '#14161b';
const line = (w: number) => `stroke="${O}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

/** The sky and the sea, edge to edge, outside the safe-zone scaling. */
const backdrop = () => `
  <rect width="512" height="512" fill="${BG}"/>
  <circle cx="420" cy="96" r="54" fill="#ffe27a" fill-opacity=".9"/>
  <rect x="0" y="372" width="512" height="140" fill="#1f3a68"/>
  <path d="M0 400 Q32 388 64 400 T128 400 T192 400 T256 400 T320 400 T384 400 T448 400 T512 400" fill="none" stroke="#6fb3ff" stroke-width="8" stroke-linecap="round"/>
  <path d="M0 446 Q32 434 64 446 T128 446 T192 446 T256 446 T320 446 T384 446 T448 446 T512 446" fill="none" stroke="#4f8ad8" stroke-width="8" stroke-linecap="round"/>`;

const art = () => `
  <path d="M-30 268 H322 L372 252 L330 404 H-30 Z" fill="#8e9aa6" ${line(14)}/>
  <path d="M-30 330 H352" stroke="#6b7783" stroke-width="16"/>
  <path d="M-30 236 H368 L372 268 H-30 Z" fill="#3a4150" ${line(12)}/>
  <path d="M10 252 H350" stroke="#ffd23f" stroke-width="10" stroke-dasharray="40 22"/>
  <path d="M40 244 H220" stroke="#f4f6fa" stroke-width="6"/>
  <circle cx="356" cy="222" r="26" fill="#f4f6fa" ${line(8)}/>
  <circle cx="318" cy="216" r="18" fill="#f4f6fa" ${line(8)}/>
  <circle cx="290" cy="228" r="12" fill="#f4f6fa" ${line(7)}/>
  <g transform="translate(372 150) rotate(-24)">
    <path d="M-70 -8 L-96 -54 H-70 L-34 -10 Z" fill="#2fa84f" ${line(10)}/>
    <path d="M-90 0 Q-90 -22 -54 -22 H42 Q86 -22 104 0 Q86 20 42 20 H-54 Q-90 20 -90 0 Z" fill="#ffd23f" ${line(12)}/>
    <path d="M40 -18 Q62 -22 80 -10 L58 -2 Z" fill="#2a4a6a" ${line(7)}/>
    <path d="M-20 8 L-52 58 H-22 L18 10 Z" fill="#ffc400" ${line(10)}/>
    <path d="M-92 -6 L-130 -12 M-92 6 L-138 10" stroke="#ff7a00" stroke-width="12" stroke-linecap="round"/>
  </g>`;

/** The icon as SVG. scale shrinks the art (not the sky and sea): 0.8 keeps it inside a maskable icon's safe zone. */
export function iconSvg(scale = 1): string {
  const off = 256 * (1 - scale);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${backdrop()}<g transform="translate(${off} ${off}) scale(${scale})">${art()}</g></svg>`;
}
export const ICON_BG = BG;
