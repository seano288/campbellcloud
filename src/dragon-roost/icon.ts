// The Home Screen icon: a round green dragon's head peeking out of a cracked speckled egg, with a small friendly flame above it, on a
// dawn sunburst (pink going to gold): the mountain sky at sunrise. Thick dark outlines and the sunburst make it a sibling of the other
// games' icons; the warm pink keeps it apart from Globe Hopper's violet and Dino Dig's green. One 512×512 SVG made in code; tools/icons.ts
// rasterises it, and the landing tile uses it.

const BG = '#c2456b';
const O = '#2a1a12';
const line = (w: number) => `stroke="${O}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

const rays = () => Array.from({ length: 16 }, (_, i) => {
  const a0 = ((i * (360 / 16) - 5) * Math.PI) / 180, a1 = ((i * (360 / 16) + 5) * Math.PI) / 180, r = 600, cx = 256, cy = 300;
  return `<path d="M${cx} ${cy} L${(cx + r * Math.cos(a0)).toFixed(1)} ${(cy + r * Math.sin(a0)).toFixed(1)} L${(cx + r * Math.cos(a1)).toFixed(1)} ${(cy + r * Math.sin(a1)).toFixed(1)} Z" fill="#e0607a"/>`;
}).join('');
const scene = () => `<rect width="512" height="512" fill="${BG}"/>${rays()}<circle cx="256" cy="300" r="190" fill="#f39a5f" opacity=".55"/>`;

const art = () => `
  <ellipse cx="256" cy="470" rx="150" ry="22" fill="#00000033"/>
  <!-- the back of the egg -->
  <path d="M120 300 Q120 470 256 470 Q392 470 392 300 Z" fill="#f6e7c8" ${line(14)}/>
  <!-- the dragon's head and neck -->
  <path d="M206 330 Q196 250 236 214 L300 214 Q330 250 318 330 Z" fill="#3fbf5f" ${line(14)}/>
  <path d="M220 196 Q200 140 232 128 Q236 166 246 190 Z" fill="#ffd23f" ${line(12)}/>
  <path d="M292 192 Q306 138 340 140 Q318 170 306 198 Z" fill="#ffd23f" ${line(12)}/>
  <circle cx="262" cy="232" r="78" fill="#3fbf5f" ${line(14)}/>
  <ellipse cx="322" cy="262" rx="56" ry="40" fill="#3fbf5f" ${line(14)}/>
  <circle cx="352" cy="248" r="6" fill="${O}"/>
  <path d="M300 280 Q326 300 356 282" fill="none" ${line(10)}/>
  <circle cx="242" cy="270" r="15" fill="#ff8aa6" opacity=".7"/>
  <circle cx="258" cy="216" r="30" fill="#fff" ${line(10)}/>
  <circle cx="268" cy="218" r="17" fill="${O}"/>
  <circle cx="275" cy="209" r="7" fill="#fff"/>
  <!-- the front of the egg, cracked open at the top -->
  <path d="M110 300 L150 330 L182 300 L220 336 L256 300 L292 336 L330 300 L362 330 L402 300 Q404 470 256 470 Q108 470 110 300 Z" fill="#fff4dc" ${line(14)}/>
  <circle cx="186" cy="392" r="16" fill="#f2a03a"/><circle cx="300" cy="420" r="12" fill="#f2a03a"/><circle cx="338" cy="370" r="10" fill="#f2a03a"/><circle cx="232" cy="440" r="9" fill="#f2a03a"/>
  <!-- the flame above -->
  <g transform="translate(372 52)">
    <path d="M40 0 C48 22 72 30 72 62 C72 88 58 104 40 104 C22 104 8 88 8 62 C8 46 16 38 22 28 C24 40 28 46 32 48 C32 30 34 18 40 0 Z" fill="#ff7a1a" ${line(10)}/>
    <path d="M40 44 C46 56 58 64 58 78 C58 90 50 96 40 96 C30 96 22 90 22 78 C22 70 28 64 30 58 C32 64 36 66 38 66 C38 60 36 54 40 44 Z" fill="#ffd23f"/>
  </g>`;

/** The icon as SVG. scale shrinks the art (not the background): 0.8 keeps it inside a maskable icon's safe zone. */
export function iconSvg(scale = 1): string {
  const off = 256 * (1 - scale);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${scene()}<g transform="translate(${off} ${off}) scale(${scale})">${art()}</g></svg>`;
}
export const ICON_BG = BG;
