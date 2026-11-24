// The Home Screen icon: a crane's grab (safety yellow) holding one rust-red container with a syllable on its side, over sea-green water,
// the boom across the top. Keeps apart from Treasure Fleet (a pirate ship) and Carrier Deck (aircraft at sea): this one is the crane.
// Thick dark outlines, like the family's icons. One 512×512 SVG made in code; tools/icons.ts rasterises it, and the landing tile uses it.
const BG = '#7fd0e6';
const O = '#14161b';
const line = (w: number) => `stroke="${O}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

const scene = () => `
  <rect width="512" height="512" fill="${BG}"/>
  <rect x="0" y="392" width="512" height="120" fill="#1f9a8a"/>
  <path d="M0 392 H512" ${line(10)}/>
  ${[0, 1, 2].map(i => `<path d="M${30 + i * 170} ${440 + (i % 2) * 30} h80" stroke="#ffffff" stroke-opacity=".5" stroke-width="10" stroke-linecap="round"/>`).join('')}
  <path d="M-20 44 H532 V92 H-20 Z" fill="#ffcc00" ${line(12)}/>
  ${[0, 1, 2, 3, 4, 5, 6].map(i => `<path d="M${20 + i * 76} 46 L${58 + i * 76} 90" stroke="${O}" stroke-width="7"/>`).join('')}`;

const art = () => `
  <rect x="196" y="86" width="120" height="44" rx="8" fill="#3a3f44" ${line(10)}/>
  <path d="M222 130 L176 214 M290 130 L336 214" ${line(10)}/>
  <rect x="120" y="206" width="272" height="34" rx="8" fill="#ffcc00" ${line(12)}/>
  <rect x="96" y="238" width="320" height="168" rx="10" fill="#c8452f" ${line(12)}/>
  ${Array.from({ length: 9 }, (_, i) => `<path d="M${128 + i * 32} 256 V388" stroke="#8a2e1f" stroke-width="8"/>`).join('')}
  <rect x="156" y="276" width="200" height="92" rx="22" fill="#ffffff" ${line(9)}/>
  <text x="256" y="345" text-anchor="middle" font-family="Andika, Nunito, sans-serif" font-weight="700" font-size="72" fill="${O}">rab</text>`;

/** The icon as SVG. scale shrinks the art (not the background): 0.8 keeps it inside a maskable icon's safe zone. */
export function iconSvg(scale = 1): string {
  const off = 256 * (1 - scale);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${scene()}<g transform="translate(${off} ${off}) scale(${scale})">${art()}</g></svg>`;
}
export const ICON_BG = BG;
