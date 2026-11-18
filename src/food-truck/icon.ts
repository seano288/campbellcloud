// The Home Screen icon: his food truck from the side at a night market, big and low across the front. Its hatch is open under a
// ketchup-and-white scalloped awning, the kitchen inside glows bulb yellow, and a mustard sign on the roof carries a big $. A string
// of warm bulbs swoops across the dusk-purple sky, and the rays spin out from the sign, as the sibling icons' rays spin out from their
// hero. The truck is mint (no sibling has a mint hero; Hook and Ladder's truck is the red one), on the game's own dusk purple (no
// sibling's sky). The $ is drawn as strokes, so the icon needs no font file and rasterises the same everywhere (tools/icons.ts).
const BG = '#2a1b3d';
const O = '#1d1d1f';
const RED = '#e63946';
const MINT = '#3ccf9a';
const MUSTARD = '#ffc93c';
const BULB = '#ffe08a';
const SIGN = { x: 236, y: 150 }; // the sign's centre: the rays and the glow start here

const rays = () => Array.from({ length: 14 }, (_, i) => {
  const step = 360 / 14, a0 = ((i * step - 6) * Math.PI) / 180, a1 = ((i * step + 6) * Math.PI) / 180, r = 760, { x, y } = SIGN;
  return `<path d="M${x} ${y} L${(x + r * Math.cos(a0)).toFixed(1)} ${(y + r * Math.sin(a0)).toFixed(1)} L${(x + r * Math.cos(a1)).toFixed(1)} ${(y + r * Math.sin(a1)).toFixed(1)} Z" fill="#45305f"/>`;
}).join('');
const line = (w: number) => `stroke="${O}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

/** The string of bulbs swooping across the sky. */
const bulbs = () => {
  const at = (t: number) => ({ x: -20 + t * 552, y: 40 + 46 * Math.sin(Math.PI * t) });
  const dots = Array.from({ length: 9 }, (_, i) => at((i + 0.5) / 9)).map(({ x, y }) =>
    `<circle cx="${x.toFixed(1)}" cy="${(y + 14).toFixed(1)}" r="26" fill="${BULB}" opacity=".28"/><circle cx="${x.toFixed(1)}" cy="${(y + 14).toFixed(1)}" r="12" fill="${BULB}" ${line(5)}/>`).join('');
  return `<path d="M-20 40 Q256 132 532 40" fill="none" ${line(5)}/>${dots}`;
};

/** A bold $ drawn as strokes, centred on (x, y). */
const dollar = (x: number, y: number) => {
  const s = `M${x + 21} ${y - 19} Q${x + 12} ${y - 31} ${x - 1} ${y - 31} Q${x - 23} ${y - 31} ${x - 23} ${y - 15} Q${x - 23} ${y - 2} ${x - 1} ${y + 1} Q${x + 23} ${y + 4} ${x + 23} ${y + 17} Q${x + 23} ${y + 32} ${x} ${y + 32} Q${x - 15} ${y + 32} ${x - 24} ${y + 20} M${x} ${y - 42} V${y + 43}`;
  return `<path d="${s}" fill="none" stroke="${O}" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/><path d="${s}" fill="none" stroke="${RED}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>`;
};

const truck = () => {
  // the awning over the hatch: six stripes, scalloped
  const scallops = Array.from({ length: 6 }, (_, i) => {
    const x = 62 + i * 48;
    return `<path d="M${x} 214 H${x + 48} V246 A24 20 0 0 1 ${x} 246 Z" fill="${i % 2 ? '#fff' : RED}" ${line(7)}/>`;
  }).join('');
  return `
  <!-- the sign on the roof -->
  <path d="M186 198 V186 M286 198 V186" ${line(12)}/>
  <rect x="160" y="96" width="152" height="96" rx="22" fill="${MUSTARD}" ${line(10)}/>
  ${dollar(236, 144)}
  <!-- the body and the cab -->
  <path d="M58 200 H360 Q376 200 382 216 L398 262 H444 Q470 262 474 294 L478 392 Q478 408 462 408 H54 Q38 408 38 392 V216 Q38 200 58 200 Z" fill="${MINT}" ${line(10)}/>
  <path d="M392 276 H438 Q456 276 458 298 V320 H392 Z" fill="#bfe3ff" ${line(8)}/>
  <rect x="38" y="364" width="440" height="14" fill="#fff" opacity=".9"/>
  <!-- the hatch, open: the kitchen lit inside, a burger and a taco on the counter -->
  <rect x="66" y="228" width="284" height="116" rx="10" fill="${BULB}" ${line(9)}/>
  <path d="M102 318 Q102 290 128 290 Q154 290 154 318 Z" fill="#f2b84b" ${line(6)}/><rect x="98" y="316" width="60" height="12" rx="5" fill="#7a3b1d" ${line(5)}/>
  <path d="M206 326 Q206 288 238 288 Q270 288 270 326 Z" fill="#f6dfa0" ${line(6)}/><path d="M214 308 Q238 296 262 308" fill="none" stroke="#3ccf3c" stroke-width="8" stroke-linecap="round"/>
  <rect x="56" y="336" width="304" height="20" rx="7" fill="#dfe6ee" ${line(8)}/>
  ${scallops}
  <path d="M60 214 H354" ${line(8)}/>
  <!-- wheels -->
  ${[132, 388].map(x => `<circle cx="${x}" cy="414" r="46" fill="#1a1a1a" ${line(8)}/><circle cx="${x}" cy="414" r="20" fill="${MUSTARD}" ${line(6)}/>`).join('')}`;
};

const art = () => `
  <defs><radialGradient id="ftglow"><stop offset="0" stop-color="${BULB}" stop-opacity=".55"/><stop offset="1" stop-color="${BULB}" stop-opacity="0"/></radialGradient></defs>
  <circle cx="${SIGN.x}" cy="${SIGN.y}" r="220" fill="url(#ftglow)"/>
  <!-- the market square: paving slabs under a lit kerb (not a road: Hook and Ladder's truck has the road) -->
  <path d="M-20 446 H540 V540 H-20 Z" fill="#5a3f7d" stroke="${O}" stroke-width="10"/>
  <path d="M-20 466 H540" stroke="#2a1b3d" stroke-width="6"/>
  ${[30, 110, 190, 270, 350, 430, 510].map((x, i) => `<path d="M${x + (i % 2) * 20} 469 V540" stroke="#2a1b3d" stroke-width="6"/>`).join('')}
  ${bulbs()}
  ${truck()}`;

/** The icon as SVG. scale shrinks the art (not the background): 0.8 keeps it inside a maskable icon's safe zone. */
export function iconSvg(scale = 1): string {
  const off = 256 * (1 - scale);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${BG}"/>${rays()}<g transform="translate(${off} ${off}) scale(${scale})">${art()}</g></svg>`;
}
export const ICON_BG = BG;
