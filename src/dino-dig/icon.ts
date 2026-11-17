// The Home Screen icon: a T. rex skull half out of the dirt, teeth and all, with a big letter tile standing beside it, on warm sandstone
// rays like the sibling icons (one big hero, a burst behind it, so it reads at Home Screen size). One 512×512 SVG made in code;
// tools/icons.ts rasterises it at build time. The letter is lowercase and drawn as text in a plain bold font, so it looks the same
// wherever it's rasterised.
const BG = '#e9c46a', O = '#1b1410', BONE = '#f6efdc', DIRT = '#9c6b3e', DIRT2 = '#7a5230', FERN = '#4f8a3c';
const C = { x: 236, y: 300 };

const pt = (x: number, y: number, r: number, deg: number) => { const a = (deg * Math.PI) / 180; return `${(x + r * Math.cos(a)).toFixed(1)} ${(y + r * Math.sin(a)).toFixed(1)}`; };
const rays = () => Array.from({ length: 16 }, (_, i) => `<path d="M${C.x} ${C.y} L${pt(C.x, C.y, 760, i * 22.5 - 5.6)} L${pt(C.x, C.y, 760, i * 22.5 + 5.6)} Z" fill="#f4d98f"/>`).join('');

/** The skull: a big boxy head pointing left, the eye socket and nose hole, a row of teeth, the jaw going into the dirt. */
const skull = () => `
  <path d="M374 214 C362 150 300 122 236 128 C170 134 104 160 76 214 L70 268 L380 300 Z" fill="${BONE}" stroke="${O}" stroke-width="10" stroke-linejoin="round"/>
  <path d="M310 168 C330 176 344 196 346 222" fill="none" stroke="#d9cba6" stroke-width="12" stroke-linecap="round"/>
  <ellipse cx="270" cy="196" rx="34" ry="28" fill="${O}"/>
  <circle cx="278" cy="190" r="8" fill="#fff"/>
  <ellipse cx="124" cy="196" rx="16" ry="10" fill="${O}" transform="rotate(-12 124 196)"/>
  <path d="M190 172 C206 160 230 160 246 168" fill="none" stroke="${O}" stroke-width="8" stroke-linecap="round"/>
  ${Array.from({ length: 7 }, (_, i) => { const x = 92 + i * 34; return `<path d="M${x} 254 L${x + 12} 290 L${x + 24} 256 Z" fill="#fffaf0" stroke="${O}" stroke-width="7" stroke-linejoin="round"/>`; }).join('')}`;

/** The dirt the skull is half out of, in layers, with pebbles and a fern. */
const dirt = () => `
  <path d="M-10 300 C60 268 140 296 214 284 C300 272 380 262 522 292 L522 522 L-10 522 Z" fill="${DIRT}" stroke="${O}" stroke-width="10" stroke-linejoin="round"/>
  <path d="M-10 384 C90 360 200 392 300 374 C390 360 450 372 522 362 L522 522 L-10 522 Z" fill="${DIRT2}"/>
  ${[[60, 330, 12], [150, 352, 9], [330, 320, 14], [420, 340, 10], [250, 420, 12], [90, 450, 9], [380, 440, 13]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#c9a77e" stroke="${O}" stroke-width="5"/>`).join('')}
  <path d="M470 292 C460 240 440 214 420 200 M462 262 L438 250 M466 276 L486 254 M456 240 L434 230 M460 226 L476 208" fill="none" stroke="${FERN}" stroke-width="10" stroke-linecap="round"/>`;

/** The letter tile beside the skull, standing in the dirt and tilted a little (the letter on it isn't turned). */
const tile = () => `
  <g transform="translate(364 186) rotate(8)">
    <rect width="112" height="112" rx="20" fill="#fff6dc" stroke="${O}" stroke-width="10"/>
    <rect x="10" y="88" width="92" height="10" rx="5" fill="#00000014"/>
    <text x="56" y="84" font-size="84" font-weight="700" text-anchor="middle" font-family="Andika, Arial, Helvetica, sans-serif" fill="${O}">a</text>
  </g>`;

const art = () => `${skull()}${tile()}${dirt()}`;

/** The icon as SVG. scale shrinks the art (not the background): 0.8 keeps it inside a maskable icon's safe zone. */
export function iconSvg(scale = 1): string {
  const off = 256 * (1 - scale);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${BG}"/>${rays()}<g transform="translate(${off} ${off}) scale(${scale})">${art()}</g></svg>`;
}
export const ICON_BG = BG;
