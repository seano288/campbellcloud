// The Home Screen icon: the Earth, big, with its real continents in their game colours (drawn from the same outline table the game draws,
// seen from above the Atlantic so Africa, Europe and the Americas show), and a white rocket with a red stripe flying round it on a yellow
// orbit ring, on a violet sunburst: the high sky going to space. The sunburst and the thick dark outlines make it a sibling of the other
// games' icons; the violet keeps it apart from Rover Code and Deep Light (deep navy) and Time Flies (light blue). No other planet: the
// subject is the Earth. One 512×512 SVG made in code; tools/icons.ts rasterises it, and the landing tile uses it.
import { CONTINENTS, APART_COLOURS } from './world/continents';
import { REGIONS } from './map/geo';

const BG = '#3a1c8f';
const O = '#14102b';
const line = (w: number) => `stroke="${O}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const LON0 = 6, LAT0 = 14, CX = 236, CY = 284, R = 152;
const colour = (id: string) => CONTINENTS.find(c => c.id === id)?.colour ?? APART_COLOURS[id as keyof typeof APART_COLOURS] ?? '#ccc';

/** The continents seen from above (LON0, LAT0), points on the far side pulled to the rim; only the big shapes, simplified, so the
 *  coasts stay bold at Home Screen size. */
function earthPaths(): string {
  const p0 = (LAT0 * Math.PI) / 180;
  const pt = (lon: number, lat: number) => {
    const l = ((lon - LON0) * Math.PI) / 180, p = (lat * Math.PI) / 180, c = Math.cos(p);
    let x = c * Math.sin(l), y = Math.cos(p0) * Math.sin(p) - Math.sin(p0) * c * Math.cos(l);
    const z = Math.sin(p0) * Math.sin(p) + Math.cos(p0) * c * Math.cos(l);
    if (z < 0) { const k = 1 / Math.hypot(x, y); x *= k; y *= k; }
    return { x: CX + x * R, y: CY - y * R, z };
  };
  let strokes = '', fills = '';
  for (const g of REGIONS) {
    let d = '';
    for (const r of g.rings) {
      if (r.length < 16) continue; // the smallest islands vanish at this size
      const step = r.length < 60 ? 2 : 6, pts = Array.from({ length: Math.ceil(r.length / step) }, (_, i) => pt(r[i * step]!, r[i * step + 1]!));
      if (!pts.some(q => q.z >= 0)) continue;
      d += `M${pts.map(q => `${q.x.toFixed(0)} ${q.y.toFixed(0)}`).join('L')}Z`;
    }
    if (!d) continue;
    strokes += `<path d="${d}" fill="none" ${line(9)}/>`;
    // the fill is stroked in its own colour too, so no seam shows where two countries' simplified edges don't quite meet
    fills += `<path d="${d}" fill="${colour(g.id)}" stroke="${colour(g.id)}" stroke-width="3" stroke-linejoin="round"/>`;
  }
  return strokes + fills; // stroked first, then filled, so the borders inside a continent vanish
}

const rays = () => Array.from({ length: 14 }, (_, i) => {
  const a0 = ((i * (360 / 14) - 6) * Math.PI) / 180, a1 = ((i * (360 / 14) + 6) * Math.PI) / 180, r = 560;
  return `<path d="M${CX} ${CY} L${(CX + r * Math.cos(a0)).toFixed(1)} ${(CY + r * Math.sin(a0)).toFixed(1)} L${(CX + r * Math.cos(a1)).toFixed(1)} ${(CY + r * Math.sin(a1)).toFixed(1)} Z" fill="#4c28b3"/>`;
}).join('');
const scene = () => `<rect width="512" height="512" fill="${BG}"/>${rays()}
  ${[[52, 64, 5], [452, 48, 6], [476, 352, 4], [36, 400, 4], [440, 470, 5], [96, 486, 3], [300, 30, 3]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff"/>`).join('')}`;

/** The orbit ring, tilted; `front` draws the half in front of the Earth. */
const ring = (front: boolean) => {
  const rx = 236, ry = 66, tilt = -16;
  const d = front ? `M${-rx} 0 A${rx} ${ry} 0 0 0 ${rx} 0` : `M${-rx} 0 A${rx} ${ry} 0 0 1 ${rx} 0`;
  return `<g transform="translate(${CX} ${CY + 8}) rotate(${tilt})"><path d="${d}" fill="none" ${line(20)}/><path d="${d}" fill="none" stroke="#ffd23f" stroke-width="10" stroke-linecap="round"/></g>`;
};

/** The rocket, nose up, centred on 0,0 (about 170 tall): white with a red stripe and red fins, a porthole, an orange flame. */
const rocket = () => `
  <path d="M-20 52 Q0 150 20 52 Z" fill="#ff5a10"/><path d="M-12 52 Q0 118 12 52 Z" fill="#ffb02e"/><path d="M-6 52 Q0 88 6 52 Z" fill="#fff6c2"/>
  <path d="M-26 14 L-48 58 L-24 50 Z M26 14 L48 58 L24 50 Z" fill="#e63946" ${line(7)}/>
  <path d="M-11 40 L11 40 L16 56 L-16 56 Z" fill="#5b6170" ${line(6)}/>
  <path d="M0 -86 Q34 -52 28 44 L-28 44 Q-34 -52 0 -86 Z" fill="#f6f8fb" ${line(8)}/>
  <path d="M-30 6 H30 V22 H-30 Z" fill="#e63946"/>
  <path d="M0 -86 Q34 -52 28 44 L-28 44 Q-34 -52 0 -86 Z" fill="none" ${line(8)}/>
  <circle cx="0" cy="-26" r="13" fill="#5fd3f3" ${line(6)}/><circle cx="-4" cy="-30" r="4" fill="#fff"/>`;

const art = () => `
  <defs><clipPath id="gh-earth"><circle cx="${CX}" cy="${CY}" r="${R}"/></clipPath>
  <radialGradient id="gh-sea" cx="36%" cy="30%" r="78%"><stop offset="0" stop-color="#5aa6ee"/><stop offset="1" stop-color="#1d5fb0"/></radialGradient>
  <radialGradient id="gh-shade" cx="34%" cy="28%" r="80%"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#00002a" stop-opacity=".3"/></radialGradient></defs>
  ${ring(false)}
  <circle cx="${CX}" cy="${CY}" r="${R + 14}" fill="#7fc4ff" opacity=".35"/>
  <circle cx="${CX}" cy="${CY}" r="${R}" fill="url(#gh-sea)"/>
  <g clip-path="url(#gh-earth)">${earthPaths()}</g>
  <circle cx="${CX}" cy="${CY}" r="${R}" fill="url(#gh-shade)"/>
  <circle cx="${CX}" cy="${CY}" r="${R}" fill="none" ${line(13)}/>
  ${ring(true)}
  <g transform="translate(418 132) rotate(32) scale(1.02)">${rocket()}</g>`;

/** The icon as SVG. scale shrinks the art (not the background): 0.8 keeps it inside a maskable icon's safe zone. */
export function iconSvg(scale = 1): string {
  const off = 256 * (1 - scale);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${scene()}<g transform="translate(${off} ${off}) scale(${scale})">${art()}</g></svg>`;
}
export const ICON_BG = BG;
