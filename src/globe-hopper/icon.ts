// The Home Screen icon: the Earth (the real continents, from the same outline table the game draws, in their game colours, seen from
// above the Atlantic so Africa, Europe and the Americas show) with a small white rocket on an orbit ring round it, on a deep space blue
// with a few stars. Keeps apart from Rover Code (a rover on another planet) and Carrier Deck: this one is the Earth itself. Thick dark
// outlines, like the family's icons. One 512×512 SVG made in code; tools/icons.ts rasterises it, and the landing tile uses it.
import { CONTINENTS, APART_COLOURS } from './world/continents';
import { REGIONS } from './map/geo';

const BG = '#0b1f4d';
const O = '#14161b';
const line = (w: number) => `stroke="${O}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const LON0 = -20, LAT0 = 18, CX = 256, CY = 262, R = 168;
const colour = (id: string) => CONTINENTS.find(c => c.id === id)?.colour ?? APART_COLOURS[id as keyof typeof APART_COLOURS] ?? '#ccc';

/** The continents seen from above (LON0, LAT0), points on the far side pulled to the rim. */
function earthPaths(): string {
  const p0 = (LAT0 * Math.PI) / 180;
  const pt = (lon: number, lat: number) => {
    const l = ((lon - LON0) * Math.PI) / 180, p = (lat * Math.PI) / 180, c = Math.cos(p);
    let x = c * Math.sin(l), y = Math.cos(p0) * Math.sin(p) - Math.sin(p0) * c * Math.cos(l);
    const z = Math.sin(p0) * Math.sin(p) + Math.cos(p0) * c * Math.cos(l);
    if (z < 0) { const k = 1 / Math.hypot(x, y); x *= k; y *= k; }
    return { x: CX + x * R, y: CY - y * R, z };
  };
  let out = '';
  for (const g of REGIONS) {
    let d = '';
    for (const r of g.rings) {
      if (r.length < 24) continue; // small islands don't show at this size
      const pts = Array.from({ length: Math.ceil(r.length / 8) }, (_, i) => pt(r[i * 8]!, r[i * 8 + 1]!)); // every fourth point is plenty
      if (!pts.some(q => q.z >= 0)) continue;
      d += `M${pts.map(q => `${q.x.toFixed(0)} ${q.y.toFixed(0)}`).join('L')}Z`;
    }
    if (d) out += `<path d="${d}" fill="${colour(g.id)}" stroke="${O}" stroke-width="6" stroke-linejoin="round" paint-order="stroke"/>`;
  }
  return out;
}

const scene = () => `
  <rect width="512" height="512" fill="${BG}"/>
  ${[[60, 70, 4], [440, 60, 5], [470, 300, 3], [40, 330, 3], [420, 470, 4], [90, 470, 3], [300, 40, 3]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff"/>`).join('')}`;

const art = () => `
  <defs><clipPath id="gh-earth"><circle cx="${CX}" cy="${CY}" r="${R}"/></clipPath>
  <radialGradient id="gh-sea" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#5aa6ee"/><stop offset="1" stop-color="#1d5fb0"/></radialGradient></defs>
  <path d="M${CX - 236} ${CY + 40} A236 74 -16 0 1 ${CX + 236} ${CY - 40}" fill="none" stroke="#ffd23f" stroke-width="10" stroke-dasharray="4 18" stroke-linecap="round"/>
  <circle cx="${CX}" cy="${CY}" r="${R}" fill="url(#gh-sea)"/>
  <g clip-path="url(#gh-earth)">${earthPaths()}</g>
  <circle cx="${CX}" cy="${CY}" r="${R}" fill="none" ${line(12)}/>
  <path d="M${CX + 236} ${CY - 40} A236 74 -16 0 1 ${CX - 236} ${CY + 40}" fill="none" stroke="#ffd23f" stroke-width="10" stroke-dasharray="4 18" stroke-linecap="round"/>
  <g transform="translate(408 150) rotate(32)">
    <path d="M-16 34 L-30 52 L-14 48 Z M16 34 L30 52 L14 48 Z" fill="#e63946" ${line(7)}/>
    <path d="M0 -50 Q20 -26 18 34 L-18 34 Q-20 -26 0 -50 Z" fill="#f6f8fb" ${line(8)}/>
    <path d="M-18 8 H18 V18 H-18 Z" fill="#e63946" stroke="none"/>
    <circle cx="0" cy="-12" r="8" fill="#5fd3f3" ${line(5)}/>
    <path d="M-10 36 Q0 72 10 36 Z" fill="#ff7a00" ${line(5)}/>
  </g>`;

/** The icon as SVG. scale shrinks the art (not the background): 0.8 keeps it inside a maskable icon's safe zone. */
export function iconSvg(scale = 1): string {
  const off = 256 * (1 - scale);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${scene()}<g transform="translate(${off} ${off}) scale(${scale})">${art()}</g></svg>`;
}
export const ICON_BG = BG;
