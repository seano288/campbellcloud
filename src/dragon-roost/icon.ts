// The Home Screen icon: a round green dragon's head peeking out of a cracked speckled egg, its little hands on the broken rim, with a small
// friendly flame above it. The egg sits in a twig nest on a green valley, with warm rock mountains behind and a pink dawn sunburst over
// them: the mountain at sunrise. One big hero filling the square, a burst of rays behind it and a ground band at the bottom, like the
// sibling icons, so it reads at Home Screen size; the dawn pink keeps it apart from Globe Hopper's violet and Dino Dig's sand. One 512×512
// SVG made in code; tools/icons.ts rasterises it, and the landing tile uses it.

const BG = '#e85d80', RAY = '#f47d98', O = '#2a1a12';
const GREEN = '#3fbf5f', GREEN_PALE = '#6fd68a', ROCK = '#c97a5a', ROCK_LIT = '#dd9673', VALLEY = '#3f9b4f', TWIG = '#a8763e', TWIG_DARK = '#7a4f24';
const SHELL = '#fff4dc', SHELL_IN = '#e8cf9e', SPECK = '#f2a03a';
const line = (w: number) => `stroke="${O}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const C = { x: 256, y: 300 };

const pt = (r: number, deg: number) => { const a = (deg * Math.PI) / 180; return `${(C.x + r * Math.cos(a)).toFixed(1)} ${(C.y + r * Math.sin(a)).toFixed(1)}`; };
const rays = () => Array.from({ length: 16 }, (_, i) => `<path d="M${C.x} ${C.y} L${pt(760, i * 22.5 - 5.6)} L${pt(760, i * 22.5 + 5.6)} Z" fill="${RAY}"/>`).join('');
const scene = () => `<rect width="512" height="512" fill="${BG}"/>${rays()}<circle cx="${C.x}" cy="${C.y}" r="200" fill="#ffc27a" opacity=".45"/>`;

/** Mountains and the valley, running `a` past every edge so they still fill the square when the art is shrunk for a maskable icon. */
const land = (a: number) => {
  const L = -a, R = 512 + a, B = 512 + a;
  return `
  <path d="M${L} 392 L${L} 300 L0 250 L64 172 L140 262 L240 236 L330 140 L420 236 L470 214 L${R} 268 L${R} 392 Z" fill="${ROCK}" ${line(12)}/>
  <path d="M64 172 L92 206 L80 206 L72 226 L54 196 Z M330 140 L370 184 L350 186 L338 210 L314 172 Z" fill="#fff6ea" ${line(8)}/>
  <path d="M64 172 L140 262 L100 262 Z M330 140 L420 236 L362 236 Z" fill="${ROCK_LIT}" opacity=".9"/>
  <path d="M${L} 420 C80 398 170 410 256 404 C350 398 440 410 ${R} 398 L${R} ${B} L${L} ${B} Z" fill="${VALLEY}" ${line(12)}/>`;
};

const art = () => `
  <!-- the nest -->
  <ellipse cx="256" cy="466" rx="196" ry="44" fill="${TWIG}" ${line(12)}/>
  <path d="M86 456 Q170 486 256 470 Q350 486 426 452 M110 478 Q200 500 300 488 M150 446 Q240 462 330 446" fill="none" stroke="${TWIG_DARK}" stroke-width="8" stroke-linecap="round"/>
  <!-- the inside of the egg, behind the dragon -->
  <path d="M112 300 Q112 290 130 286 L382 286 Q400 290 400 300 Z" fill="${SHELL_IN}" ${line(12)}/>
  <!-- the dragon: neck, horns, head, snout -->
  <path d="M176 330 Q170 262 206 236 L292 236 Q330 268 322 330 Z" fill="${GREEN}" ${line(12)}/>
  <path d="M184 150 Q160 96 192 76 Q198 116 214 140 Z" fill="#ffd23f" ${line(11)}/>
  <path d="M262 128 Q272 76 312 70 Q292 104 288 136 Z" fill="#ffd23f" ${line(11)}/>
  <circle cx="234" cy="214" r="96" fill="${GREEN}" ${line(12)}/>
  <ellipse cx="326" cy="250" rx="70" ry="48" fill="${GREEN_PALE}" ${line(12)}/>
  <circle cx="358" cy="232" r="8" fill="${O}"/>
  <path d="M300 272 Q330 294 368 274" fill="none" ${line(10)}/>
  <ellipse cx="214" cy="262" rx="20" ry="13" fill="#ff8fb0" opacity=".85"/>
  <circle cx="242" cy="190" r="38" fill="#fff" ${line(10)}/>
  <circle cx="254" cy="192" r="21" fill="${O}"/>
  <circle cx="262" cy="182" r="8" fill="#fff"/>
  <!-- the front of the egg, cracked open at the top, with the dragon's hands on the rim -->
  <path d="M100 300 L136 330 L170 298 L208 336 L246 300 L284 336 L322 300 L360 332 L412 300 Q420 474 256 476 Q92 474 100 300 Z" fill="${SHELL}" ${line(12)}/>
  <circle cx="170" cy="398" r="17" fill="${SPECK}"/><circle cx="300" cy="426" r="13" fill="${SPECK}"/><circle cx="352" cy="372" r="11" fill="${SPECK}"/><circle cx="224" cy="446" r="10" fill="${SPECK}"/><circle cx="254" cy="380" r="8" fill="${SPECK}"/>
  <path d="M120 360 Q118 410 150 444" fill="none" stroke="#ffffff" stroke-width="10" stroke-linecap="round" opacity=".8"/>
  <ellipse cx="150" cy="312" rx="28" ry="20" fill="${GREEN}" ${line(10)}/>
  <ellipse cx="350" cy="312" rx="28" ry="20" fill="${GREEN}" ${line(10)}/>
  <!-- the small flame above -->
  <g transform="translate(366 18) scale(1.15)">
    <path d="M40 0 C48 22 72 30 72 62 C72 88 58 104 40 104 C22 104 8 88 8 62 C8 46 16 38 22 28 C24 40 28 46 32 48 C32 30 34 18 40 0 Z" fill="#ff7a1a" stroke="#7a1406" stroke-width="9" stroke-linejoin="round"/>
    <path d="M40 44 C46 56 58 64 58 78 C58 90 50 96 40 96 C30 96 22 90 22 78 C22 70 28 64 30 58 C32 64 36 66 38 66 C38 60 36 54 40 44 Z" fill="#ffd23f"/>
  </g>`;

/** The icon as SVG. scale shrinks the art (not the background): 0.8 keeps it inside a maskable icon's safe zone. */
export function iconSvg(scale = 1): string {
  const off = 256 * (1 - scale);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${scene()}<g transform="translate(${off} ${off}) scale(${scale})">${land(10 + off / scale)}${art()}</g></svg>`;
}
export const ICON_BG = BG;
