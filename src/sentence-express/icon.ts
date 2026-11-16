// The Home Screen icon: a sentence as a train, close up. His little red engine, big and in front, carries a capital S; behind it come
// one word car and the caboose with a full stop, getting smaller as they climb away up a wooden toy track, so the engine is the hero
// and the whole sentence (capital, word, end mark) still fits. Steam puffs out of the chimney into a sky-blue sunburst, like the
// sibling icons. Drawn with the same train drawings the game uses (art/train.ts); the letter is text in a plain font and the full stop
// a circle, so it rasterises the same everywhere (tools/icons.ts).
import { carSvg, engineSvg, O } from './art/train';
import { PAINTS } from './shed/catalogue';

const BG = '#3d8fd6';
const red = PAINTS[0];

/** The track climbs to the right at this angle; each piece sits on it, `d` along it, `k` its size (smaller further back). */
const ANGLE = -22, RAD = (ANGLE * Math.PI) / 180, COS = Math.cos(RAD), SIN = Math.sin(RAD), X0 = 62, Y0 = 452;
const at = (d: number, below = 0) => ({ x: X0 + d * COS - below * SIN, y: Y0 + d * SIN + below * COS });
const on = (d: number, k: number, inner: string) => {
  const { x, y } = at(d, -k * 98);
  return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${ANGLE}) scale(${k})">${inner}</g>`;
};

/** Where the chimney puffs from: the rays spin out of here. */
const STEAM = { x: 46, y: 246 };
const rays = () => Array.from({ length: 14 }, (_, i) => {
  const step = 360 / 14, a0 = ((i * step - 6) * Math.PI) / 180, a1 = ((i * step + 6) * Math.PI) / 180, r = 760, { x, y } = STEAM;
  return `<path d="M${x} ${y} L${(x + r * Math.cos(a0)).toFixed(1)} ${(y + r * Math.sin(a0)).toFixed(1)} L${(x + r * Math.cos(a1)).toFixed(1)} ${(y + r * Math.sin(a1)).toFixed(1)} Z" fill="#529fe0"/>`;
}).join('');

/** The wooden toy track: a pale plank with its two grooves, seen from the side, under the wheels. */
const track = () => {
  const p = (d: number, b: number) => { const q = at(d, b); return `${q.x.toFixed(1)} ${q.y.toFixed(1)}`; };
  return `<path d="M${p(-80, 0)} L${p(640, 0)} L${p(640, 34)} L${p(-80, 34)} Z" fill="#d9b47a" stroke="${O}" stroke-width="9" stroke-linejoin="round"/>
    <path d="M${p(-80, 11)} L${p(640, 11)}" stroke="#a5773f" stroke-width="6"/>`;
};

/** A word car's plate: the word is too small to read in an icon, so a thick line stands for it. */
const wordPlate = (cx: number, w: number) => `<rect x="${cx - w / 2}" y="32" width="${w}" height="38" rx="8" fill="#fff" stroke="${O}" stroke-width="4"/><path d="M${cx - w / 2 + 13} 51 H${cx + w / 2 - 13}" stroke="${O}" stroke-width="9" stroke-linecap="round"/>`;

/** The caboose with its end mark: a round white sign with a big full stop. */
const caboose = (w: number) => `${carSvg({ shape: 'caboose' }, red, w)}<circle cx="${w / 2}" cy="50" r="27" fill="#fff" stroke="${O}" stroke-width="4"/><circle cx="${w / 2}" cy="55" r="10" fill="${O}"/>`;

/** The engine with the capital S on its boiler, and steam rolling out of the chimney. */
const engine = () => `${engineSvg({ kind: 'tank' }, red, 180)}
  <rect x="30" y="30" width="76" height="54" rx="11" fill="#fff" stroke="${O}" stroke-width="4"/>
  <text x="68" y="76" text-anchor="middle" font-family="Andika, Nunito, Arial, Helvetica, sans-serif" font-weight="700" font-size="56" fill="${O}">S</text>`;

const steam = () => `<g fill="#fff" stroke="${O}" stroke-width="9">
  <circle cx="${STEAM.x + 6}" cy="${STEAM.y + 22}" r="20"/><circle cx="${STEAM.x + 34}" cy="${STEAM.y - 22}" r="30"/>
  <circle cx="${STEAM.x + 8}" cy="${STEAM.y - 76}" r="34"/><circle cx="${STEAM.x + 58}" cy="${STEAM.y - 118}" r="25"/></g>`;

const art = () => `
  <path d="M${at(-200, 4).x.toFixed(0)} ${at(-200, 4).y.toFixed(0)} L${at(700, 4).x.toFixed(0)} ${at(700, 4).y.toFixed(0)} L620 620 L-40 620 Z" fill="#e9cf9c"/>
  ${track()}
  ${on(394, .72, caboose(108))}
  ${on(300, .8, `${carSvg({ shape: 'flat' }, red, 120)}${wordPlate(60, 86)}`)}
  ${steam()}
  ${on(0, 1.6, engine())}`;

/** The icon as SVG. scale shrinks the art (not the background): 0.8 keeps it inside a maskable icon's safe zone. */
export function iconSvg(scale = 1): string {
  const off = 256 * (1 - scale);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${BG}"/>${rays()}<g transform="translate(${off} ${off}) scale(${scale})">${art()}</g></svg>`;
}
export const ICON_BG = BG;
