// The Home Screen icon: a little red steam engine with a capital letter on its side, pulling two word cars and a caboose with a
// full stop, coming round a bend on a pale wood table under a blue sky. The cars get smaller as they go back round the bend, so the
// engine is the middle of the picture. Drawn with the same train drawings the game uses (art/train.ts); the letter is a path-free
// text in a plain font, so it rasterises the same everywhere (tools/icons.ts).
import { carSvg, engineSvg, markCabooseSvg, O } from './art/train';
import { PAINTS } from './shed/catalogue';

const BG = '#3d8fd6';
const red = PAINTS[0];

/** A word plate with lines for words: the icon is too small to read, so the cars just look like they carry words. */
const lines = (cx: number, w: number) => `<rect x="${cx - w / 2}" y="34" width="${w}" height="34" rx="7" fill="#fff" stroke="${O}" stroke-width="3"/><path d="M${cx - w / 2 + 10} 51 H${cx + w / 2 - 10}" stroke="${O}" stroke-width="7" stroke-linecap="round"/>`;

/** The rails run up the picture at this angle; each piece sits on them, `d` along, `k` its size (smaller further back). */
const ANGLE = -21, COS = Math.cos((ANGLE * Math.PI) / 180), SIN = Math.sin((ANGLE * Math.PI) / 180), Y0 = 446, X0 = 40;
const on = (d: number, k: number, inner: string) => {
  const px = X0 + d * COS, py = Y0 + d * SIN, x = px - k * (-98 * SIN), y = py - k * (98 * COS);
  return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${ANGLE}) scale(${k})">${inner}</g>`;
};
const rails = () => {
  const a = { x: X0 - 90 * COS, y: Y0 - 90 * SIN }, b = { x: X0 + 600 * COS, y: Y0 + 600 * SIN };
  const ties = Array.from({ length: 30 }, (_, i) => { const d = -80 + i * 22, x = X0 + d * COS, y = Y0 + d * SIN + 4; return `<path d="M${(x + 9 * SIN).toFixed(1)} ${(y - 9 * COS).toFixed(1)} L${(x - 9 * SIN).toFixed(1)} ${(y + 9 * COS).toFixed(1)}" stroke="#7a5230" stroke-width="7"/>`; }).join('');
  return `${ties}<path d="M${a.x} ${a.y + 4} L${b.x} ${b.y + 4}" stroke="${O}" stroke-width="7"/>`;
};

const art = () => `
  <circle cx="404" cy="96" r="46" fill="#ffd23f" stroke="${O}" stroke-width="8"/>
  <path d="M-20 286 C120 270 300 236 420 214 S560 190 600 184 V620 H-20 Z" fill="#e9cf9c" stroke="${O}" stroke-width="10" stroke-linejoin="round"/>
  ${rails()}
  ${on(424, .72, markCabooseSvg(red, 108, '.'))}
  ${on(316, .82, `${carSvg({ shape: 'flat' }, red, 120)}${lines(60, 84)}`)}
  ${on(198, .94, `${carSvg({ shape: 'flat' }, red, 120)}${lines(60, 84)}`)}
  ${on(0, 1.14, `${engineSvg({ kind: 'tank' }, red, 180)}<rect x="40" y="38" width="66" height="40" rx="9" fill="#fff" stroke="${O}" stroke-width="3"/><text x="73" y="72" text-anchor="middle" font-family="Andika, Nunito, Arial, Helvetica, sans-serif" font-weight="700" font-size="40" fill="${O}">S</text>
    <g fill="#fff" stroke="${O}" stroke-width="5"><circle cx="34" cy="-22" r="14"/><circle cx="60" cy="-52" r="19"/><circle cx="100" cy="-74" r="14"/></g>`)}`;

/** The icon as SVG. scale shrinks the art (not the background): 0.8 keeps it inside a maskable icon's safe zone. */
export function iconSvg(scale = 1): string {
  const off = 256 * (1 - scale);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${BG}"/><g transform="translate(${off} ${off}) scale(${scale})">${art()}</g></svg>`;
}
export const ICON_BG = BG;
