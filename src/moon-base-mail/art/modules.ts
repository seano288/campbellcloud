// The base's modules, drawn from the front as they stand on the Moon: a 64 by 64 picture with the ground at y 58. Every named module
// has its own shape (a dome, a glass dome, a block, a hall, a mast, a tower, a dish, panels, tanks, a pad ...), its own colours and,
// in the corner, its emoji on a small badge, so each one can be told apart at plot size. Modules made from parts are drawn the same way:
// their word gives the shape, their colour the body, and their windows and roof fitting go on top.
//
// The picture is an SVG string, so the map (an <img>) and the walk's canvas (drawImage) draw the very same thing. The emoji badge is
// left out of the string (an emoji inside an SVG image is not drawn the same everywhere); each caller draws it on top.
import type { GenModule } from '../base/gen';

export type Shape =
  | 'dome' | 'pod' | 'glass' | 'block' | 'hall' | 'garage' | 'tube' | 'cube' | 'hut' | 'mast' | 'flag' | 'tower' | 'beacon' | 'crane'
  | 'elevator' | 'dish' | 'scope' | 'observatory' | 'solar' | 'tanks' | 'pad' | 'rocket' | 'train' | 'mine';
export type Roof = GenModule['roof'] | 'none';
export interface Look { shape: Shape; body: string; accent: string; windows: number; roof: Roof; icon: string | null }

/** Each named module's shape, body colour (null: the dome paint he picked) and accent colour. */
const NAMED: Record<string, [Shape, string | null, string]> = {
  living1: ['dome', null, '#ff8c1a'], living2: ['dome', null, '#ff8c1a'], living3: ['dome', null, '#ff8c1a'], living4: ['dome', null, '#ff8c1a'],
  living5: ['dome', null, '#ff8c1a'], living6: ['dome', null, '#ff8c1a'],
  greenhouse: ['glass', '#a5ecb2', '#2f9e4c'], gardendome: ['glass', '#b8f0c2', '#2f9e4c'], airplant: ['glass', '#c4f1ff', '#16b3b3'],
  fishdome: ['glass', '#8fd8ff', '#ff8c1a'], seedbank: ['hut', '#c7e89a', '#8b5a2b'],
  mailroom: ['block', '#fff6e0', '#e63946'], robotdock: ['block', '#c0c7d0', '#3a86ff'], store: ['block', '#d9b27c', '#8b5a2b'],
  kitchen: ['block', '#f2f2f2', '#ff8c1a'], gym: ['block', '#ffd23f', '#e63946'], battery: ['block', '#7ad98f', '#ffd23f'],
  medbay: ['block', '#f2f2f2', '#e63946'], rocklab: ['block', '#a7adb8', '#8e44ec'], lab: ['block', '#f2f2f2', '#16b3b3'],
  workshop: ['hall', '#ff9d3a', '#3b424c'], hangar: ['hall', '#c0c7d0', '#ff8c1a'], garage: ['garage', '#e63946', '#ffd23f'],
  cathouse: ['pod', '#ffc48a', '#ff8c1a'], dustwash: ['pod', '#9fd3ff', '#16b3b3'], snacks: ['pod', '#ff9ccc', '#ffd23f'],
  art: ['dome', '#ff8fc4', '#8e44ec'], music: ['dome', '#a874f0', '#ffd23f'], books: ['dome', '#5b9dff', '#ffd23f'],
  games: ['dome', '#3cc8c8', '#ff6fb5'], movies: ['dome', '#4a4a58', '#e63946'], stardome: ['dome', '#24305e', '#ffd23f'],
  sleeppods: ['tube', '#c7b8ff', '#8e44ec'],
  flagtower: ['flag', '#c0c7d0', '#e63946'], radio: ['mast', '#c0c7d0', '#e63946'], beacon: ['beacon', '#c0c7d0', '#ffd23f'],
  lookout: ['tower', '#f2f2f2', '#ff8c1a'], cranetower: ['crane', '#ffd23f', '#3b424c'], elevator: ['elevator', '#c0c7d0', '#ffd23f'],
  dish: ['dish', '#f2f2f2', '#e63946'], observatory: ['observatory', '#f2f2f2', '#3a86ff'], bigscope: ['scope', '#f2f2f2', '#3a86ff'],
  solar: ['solar', '#2f6fe0', '#ffd23f'], fuel: ['tanks', '#f2f2f2', '#e63946'], water: ['tanks', '#5b9dff', '#c4f1ff'],
  pad2: ['pad', '#d9dde3', '#ffd23f'], rocketpad: ['rocket', '#d9dde3', '#e63946'], train: ['train', '#c0c7d0', '#e63946'],
  icemine: ['mine', '#c4f1ff', '#3a86ff'], moonmine: ['mine', '#a7adb8', '#ffd23f'],
};
/** A made module's word gives its shape. */
const GEN_SHAPE: Record<GenModule['word'], Shape> = { Pod: 'pod', Dome: 'dome', Tower: 'tower', Hut: 'hut', Tube: 'tube', Lab: 'block', Hall: 'hall', Cube: 'cube' };

export function namedLook(key: string, domeHex: string, icon: string): Look {
  const [shape, body, accent] = NAMED[key] ?? ['dome', null, '#ff8c1a'];
  return { shape, body: body ?? domeHex, accent, windows: 2, roof: 'none', icon };
}
export const homeLook = (domeHex: string): Look => ({ shape: 'dome', body: domeHex, accent: '#e63946', windows: 2, roof: 'antenna', icon: null });
export function genLook(m: GenModule): Look {
  const dark = m.colour === 'Black' || m.colour === 'Purple';
  return { shape: GEN_SHAPE[m.word], body: m.hex, accent: dark ? '#ffd23f' : '#3b424c', windows: m.windows, roof: m.roof, icon: null };
}

// ---------- drawing ----------

const O = '#14161b';
const st = (w = 3) => `stroke="${O}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const LIT = '#ffd23f';
const shine = (d: string) => `<path d="${d}" fill="none" stroke="#ffffff" stroke-opacity=".55" stroke-width="3" stroke-linecap="round"/>`;
const win = (x: number, y: number, r = 3.6) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${LIT}" ${st(2)}/>`;
const sqWin = (x: number, y: number, s = 7) => `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="1.5" fill="${LIT}" ${st(2)}/>`;
const door = (x: number, w = 10, top = 46) => `<path d="M${x} 58 V${top + 3} Q${x} ${top} ${x + w / 2} ${top} Q${x + w} ${top} ${x + w} ${top + 3} V58 Z" fill="#3b424c" ${st(2.5)}/>`;
/** n windows spread between x0 and x1 at height y. */
const row = (n: number, x0: number, x1: number, y: number, f: (x: number, y: number) => string) =>
  Array.from({ length: n }, (_, i) => f(n === 1 ? (x0 + x1) / 2 : x0 + ((x1 - x0) * i) / (n - 1), y)).join('');

function body(l: Look): { svg: string; top: number } {
  const { body: B, accent: A } = l, w = Math.max(1, Math.min(4, l.windows));
  switch (l.shape) {
    case 'dome': return { top: 14, svg: `<path d="M6 58 Q6 14 32 14 Q58 14 58 58 Z" fill="${B}" ${st()}/><path d="M6 48 H58" stroke="${A}" stroke-width="5"/><path d="M6 58 Q6 14 32 14 Q58 14 58 58 Z" fill="none" ${st()}/>${shine('M14 40 Q15 25 27 20')}${row(Math.min(w, 2), 16, 48, 36, (x, y) => win(x, y))}${door(27)}` };
    case 'pod': return { top: 26, svg: `<path d="M12 58 Q12 26 32 26 Q52 26 52 58 Z" fill="${B}" ${st()}/>${shine('M18 46 Q19 35 27 31')}<path d="M12 52 H52" stroke="${A}" stroke-width="4"/><path d="M12 58 Q12 26 32 26 Q52 26 52 58 Z" fill="none" ${st()}/>${win(40, 40)}${door(22, 10, 47)}` };
    case 'glass': return { top: 12, svg: `<path d="M5 58 Q5 12 32 12 Q59 12 59 58 Z" fill="${B}" ${st()}/>
      <path d="M32 58 V12 M18.5 58 Q14 30 24 15 M45.5 58 Q50 30 40 15 M6 40 H58" fill="none" stroke="#ffffff" stroke-opacity=".7" stroke-width="2"/>
      <circle cx="20" cy="50" r="7" fill="${A}" ${st(2)}/><circle cx="33" cy="46" r="9" fill="${A}" ${st(2)}/><circle cx="46" cy="51" r="6" fill="${A}" ${st(2)}/>
      <circle cx="30" cy="43" r="2.4" fill="#ff6fb5"/><circle cx="45" cy="48" r="2.2" fill="#ffd23f"/>
      ${shine('M12 38 Q13 24 24 17')}<path d="M5 58 Q5 12 32 12 Q59 12 59 58 Z" fill="none" ${st()}/>` };
    case 'block': return { top: 22, svg: `<rect x="6" y="26" width="52" height="32" rx="3" fill="${B}" ${st()}/><rect x="4" y="20" width="56" height="9" rx="3" fill="${A}" ${st()}/>${row(w, 13, 51, 34, (x, y) => sqWin(x - 3.5, y))}${door(27, 10, 47)}` };
    case 'hut': return { top: 18, svg: `<rect x="10" y="34" width="44" height="24" rx="2" fill="${B}" ${st()}/><path d="M6 36 L32 18 L58 36 Z" fill="${A}" ${st()}/>${row(Math.min(w, 2), 18, 46, 41, (x, y) => sqWin(x - 3.5, y))}${door(27, 10, 47)}` };
    case 'hall': return { top: 16, svg: `<path d="M3 58 V34 Q3 16 32 16 Q61 16 61 34 V58 Z" fill="${B}" ${st()}/><path d="M10 26 Q32 10 54 26" fill="none" stroke="${A}" stroke-width="4"/><path d="M3 58 V34 Q3 16 32 16 Q61 16 61 34 V58 Z" fill="none" ${st()}/><path d="M18 58 V40 H46 V58" fill="#3b424c" ${st(2.5)}/><path d="M18 46 H46 M18 52 H46" stroke="#5b6270" stroke-width="2"/>${row(Math.min(w, 2), 10, 54, 34, (x, y) => win(x, y, 3))}` };
    case 'garage': return { top: 20, svg: `<rect x="4" y="24" width="56" height="34" rx="3" fill="${B}" ${st()}/><rect x="2" y="20" width="60" height="8" rx="3" fill="#3b424c" ${st()}/><rect x="12" y="34" width="40" height="24" fill="#c0c7d0" ${st(2.5)}/><path d="M12 40 H52 M12 46 H52 M12 52 H52" stroke="#7d828c" stroke-width="2"/><circle cx="56" cy="31" r="2.6" fill="${A}" ${st(1.5)}/>` };
    case 'tube': return { top: 28, svg: `<rect x="3" y="30" width="58" height="26" rx="13" fill="${B}" ${st()}/>${shine('M10 37 H44')}<path d="M18 30 V56 M46 30 V56" stroke="${A}" stroke-width="3"/>${row(w, 11, 53, 44, (x, y) => win(x, y, 3.2))}<path d="M14 56 V59 M50 56 V59" ${st(3)}/>` };
    case 'cube': return { top: 18, svg: `<path d="M10 26 L20 18 H56 L46 26 Z" fill="${A}" ${st()}/><path d="M46 26 L56 18 V50 L46 58 Z" fill="${B}" ${st()}/><path d="M46 26 L56 18 V50 L46 58 Z" fill="#000" fill-opacity=".22"/><rect x="10" y="26" width="36" height="32" fill="${B}" ${st()}/>${row(Math.min(w, 2), 17, 39, 33, (x, y) => sqWin(x - 3.5, y))}${door(23, 10, 47)}` };
    case 'mast': return { top: 6, svg: `<path d="M20 58 L32 10 L44 58" fill="none" ${st(3)}/><path d="M24 44 H40 M27 30 H37 M22 52 L38 36 M42 52 L26 36" stroke="${O}" stroke-width="2"/><circle cx="32" cy="9" r="4" fill="${A}" ${st(2)}/><path d="M24 6 Q20 9 24 12 M40 6 Q44 9 40 12" fill="none" stroke="${A}" stroke-width="2.5" stroke-linecap="round"/><rect x="14" y="50" width="36" height="8" rx="2" fill="${B}" ${st(2.5)}/>` };
    case 'flag': return { top: 6, svg: `<rect x="18" y="46" width="28" height="12" rx="2" fill="${B}" ${st()}/><path d="M28 46 V8" ${st(4)}/><path d="M30 9 H54 L48 17 L54 25 H30 Z" fill="${A}" ${st(2.5)}/><circle cx="28" cy="7" r="3" fill="${LIT}" ${st(2)}/>` };
    case 'tower': return { top: 4, svg: `<path d="M24 58 L27 22 H37 L40 58 Z" fill="${B}" ${st()}/><path d="M26 40 H38" stroke="${A}" stroke-width="3"/><rect x="16" y="10" width="32" height="14" rx="4" fill="${B}" ${st()}/><path d="M14 10 L32 3 L50 10 Z" fill="${A}" ${st(2.5)}/>${row(Math.min(Math.max(w, 2), 3), 22, 42, 17, (x, y) => `<rect x="${x - 3}" y="${y - 3.5}" width="6" height="7" fill="#9fd3ff" ${st(1.5)}/>`)}` };
    case 'beacon': return { top: 2, svg: `<circle cx="32" cy="12" r="11" fill="${A}" fill-opacity=".35"/><path d="M25 58 L28 20 H36 L39 58 Z" fill="${B}" ${st()}/><path d="M26 32 H38 M26 46 H38" stroke="#e63946" stroke-width="4"/><rect x="24" y="8" width="16" height="12" rx="3" fill="${A}" ${st(2.5)}/><path d="M22 8 H42" ${st(3)}/>` };
    case 'crane': return { top: 4, svg: `<path d="M22 58 V8 H30 V58" fill="${B}" ${st()}/><path d="M22 18 L30 26 M30 18 L22 26 M22 34 L30 42 M30 34 L22 42" stroke="${O}" stroke-width="2"/><path d="M14 8 H58 V13 H14 Z" fill="${B}" ${st(2.5)}/><path d="M52 13 V30" ${st(2)}/><rect x="47" y="30" width="10" height="7" fill="#3a86ff" ${st(2)}/><rect x="8" y="7" width="8" height="10" fill="${A}" ${st(2)}/><rect x="14" y="50" width="24" height="8" rx="2" fill="${A}" ${st(2.5)}/>` };
    case 'elevator': return { top: 0, svg: `<rect x="24" y="2" width="16" height="56" rx="3" fill="${B}" ${st()}/><path d="M32 4 V56" stroke="#7d828c" stroke-width="2"/><rect x="26" y="22" width="12" height="11" rx="2" fill="${A}" ${st(2)}/><rect x="14" y="50" width="36" height="8" rx="2" fill="#7d828c" ${st(2.5)}/><circle cx="32" cy="3" r="3" fill="#e63946" ${st(1.5)}/>` };
    case 'dish': return { top: 6, svg: `<rect x="20" y="48" width="24" height="10" rx="2" fill="#c0c7d0" ${st()}/><path d="M32 48 V34" ${st(4)}/><path d="M8 18 Q22 46 54 30 Z" fill="${B}" ${st()}/><path d="M31 31 L42 10" ${st(2.5)}/><circle cx="43" cy="9" r="3.5" fill="${A}" ${st(2)}/>` };
    case 'scope': return { top: 4, svg: `<path d="M22 58 L32 38 L42 58" fill="none" ${st(3)}/><g transform="rotate(-35 32 34)"><rect x="8" y="26" width="52" height="16" rx="4" fill="${B}" ${st()}/><rect x="52" y="24" width="10" height="20" rx="3" fill="${A}" ${st(2.5)}/><rect x="4" y="29" width="6" height="10" rx="2" fill="#3b424c" ${st(2)}/></g>` };
    case 'observatory': return { top: 6, svg: `<rect x="8" y="40" width="48" height="18" rx="2" fill="#c0c7d0" ${st()}/><path d="M8 40 Q8 14 32 14 Q56 14 56 40 Z" fill="${B}" ${st()}/><path d="M30 15 L28 40 H36 L34 15 Z" fill="#24305e" ${st(2)}/><rect x="26" y="4" width="12" height="18" rx="3" transform="rotate(25 32 13)" fill="${A}" ${st(2.5)}/>${door(27, 10, 47)}` };
    case 'solar': return { top: 22, svg: `${[4, 23, 42].map(x => `<path d="M${x + 8} 58 V44" ${st(3)}/><path d="M${x} 44 L${x + 4} 24 H${x + 18} L${x + 14} 44 Z" fill="${B}" ${st(2.5)}/><path d="M${x + 2} 34 H${x + 16} M${x + 9} 24 L${x + 7} 44" stroke="#9fc3ff" stroke-width="1.6"/>`).join('')}<circle cx="56" cy="12" r="5" fill="${A}" ${st(2)}/>` };
    case 'tanks': return { top: 16, svg: `${[[6, 16, 26], [34, 24, 24]].map(([x, y, w2]) => `<rect x="${x}" y="${y}" width="${w2}" height="${58 - y!}" rx="${w2! / 2}" fill="${B}" ${st()}/><path d="M${x} ${y! + 14} H${x! + w2!} M${x} ${y! + 24} H${x! + w2!}" stroke="${A}" stroke-width="4"/>`).join('')}${shine('M12 24 V44')}` };
    case 'pad': return { top: 40, svg: `<ellipse cx="32" cy="52" rx="29" ry="8" fill="${B}" ${st()}/><path d="M27 48.5 V55.5 M37 48.5 V55.5 M27 52 H37" stroke="#3b424c" stroke-width="2.6" stroke-linecap="round"/>${[6, 58].map(x => `<circle cx="${x}" cy="46" r="3" fill="${A}" ${st(1.5)}/>`).join('')}<path d="M6 49 V52 M58 49 V52" ${st(2)}/>` };
    case 'rocket': return { top: 2, svg: `<ellipse cx="32" cy="54" rx="29" ry="6" fill="${B}" ${st()}/><path d="M32 3 Q44 16 42 46 H22 Q20 16 32 3 Z" fill="#f2f2f2" ${st()}/><path d="M24 12 Q32 4 40 12 Z" fill="${A}"/><circle cx="32" cy="24" r="5" fill="#9fd3ff" ${st(2)}/><path d="M22 34 L14 48 H22 M42 34 L50 48 H42" fill="${A}" ${st(2.5)}/><path d="M26 46 L28 52 H36 L38 46" fill="#ff8c1a" ${st(2)}/>` };
    case 'train': return { top: 18, svg: `<path d="M4 58 V36 Q4 18 32 18 Q60 18 60 36 V58 Z" fill="${B}" ${st()}/><path d="M14 58 V40 Q14 28 32 28 Q50 28 50 40 V58 Z" fill="#24283a" ${st(2.5)}/><rect x="20" y="40" width="24" height="16" rx="5" fill="${A}" ${st(2.5)}/><rect x="25" y="44" width="14" height="6" rx="2" fill="${LIT}" ${st(1.5)}/>` };
    case 'mine': return { top: 18, svg: `<path d="M2 58 Q6 26 24 22 Q34 14 46 24 Q62 30 62 58 Z" fill="${B}" ${st()}/><path d="M20 58 V46 Q20 36 32 36 Q44 36 44 46 V58 Z" fill="#24283a" ${st(2.5)}/><path d="M20 40 H44" stroke="${A}" stroke-width="4"/><path d="M14 30 L18 26 M48 30 L52 34" stroke="#ffffff" stroke-opacity=".7" stroke-width="2.5" stroke-linecap="round"/>` };
  }
}

/** The roof fitting a made module wears, at the top of its shape. */
function roof(r: Roof, top: number): string {
  const y = top;
  switch (r) {
    case 'antenna': return `<path d="M32 ${y + 1} L38 ${y - 11}" ${st(2.5)}/><circle cx="38.5" cy="${y - 12}" r="2.6" fill="#e63946" ${st(1.5)}/>`;
    case 'dish': return `<path d="M32 ${y + 1} V${y - 4}" ${st(2.5)}/><path d="M22 ${y - 12} Q30 ${y} 42 ${y - 8} Z" fill="#f2f2f2" ${st(2.5)}/>`;
    case 'flag': return `<path d="M32 ${y + 1} V${y - 12}" ${st(2.5)}/><path d="M33 ${y - 12} H44 L41 ${y - 8.5} L44 ${y - 5} H33 Z" fill="#e63946" ${st(2)}/>`;
    case 'light': return `<circle cx="32" cy="${y - 4}" r="8" fill="#ff4d4d" fill-opacity=".3"/><rect x="28" y="${y - 7}" width="8" height="8" rx="3" fill="#ff4d4d" ${st(2)}/>`;
    case 'wings': return `<path d="M14 ${y + 6} L2 ${y - 2} M50 ${y + 6} L62 ${y - 2}" ${st(2.5)}/><rect x="-4" y="${y - 9}" width="12" height="8" rx="1" transform="rotate(-20 2 ${y - 5})" fill="#2f6fe0" ${st(2)}/><rect x="56" y="${y - 9}" width="12" height="8" rx="1" transform="rotate(20 62 ${y - 5})" fill="#2f6fe0" ${st(2)}/>`;
    case 'bubble': return `<circle cx="32" cy="${y - 2}" r="7" fill="#c4f1ff" ${st(2.5)}/><circle cx="29.5" cy="${y - 4.5}" r="2" fill="#fff"/>`;
    case 'spire': return `<path d="M28 ${y + 2} L32 ${y - 14} L36 ${y + 2} Z" fill="#c0c7d0" ${st(2.5)}/>`;
    default: return '';
  }
}

/** The module drawn, without its badge: an SVG string, square, with the 64 by 64 picture in the middle and a little room round it
 *  for roof fittings that reach past the sides. */
export function moduleSvg(l: Look): string {
  const b = body(l);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -6 72 72"><ellipse cx="32" cy="58.5" rx="30" ry="4.5" fill="#000" fill-opacity=".28"/>${b.svg}${roof(l.roof, b.top)}</svg>`;
}

const cache = new Map<string, string>();
/** The module as an image URL (kept, since the map draws the same few again and again). */
export function moduleUrl(l: Look): string {
  const key = `${l.shape}|${l.body}|${l.accent}|${l.windows}|${l.roof}`;
  let url = cache.get(key);
  if (!url) { url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(moduleSvg(l))}`; cache.set(key, url); }
  return url;
}
