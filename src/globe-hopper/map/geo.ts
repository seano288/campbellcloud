// The Earth as numbers: the outlines (world/outlines.gen.ts) decoded once, the two ways of drawing them (the flat map, north at the top and
// the Pacific split at its left and right edges; and the globe, seen from straight above one point), and what is under a point: land or
// water, which continent and which ocean. Every question and the orbit ask the same questions of a longitude and latitude, so a tap on the
// map and a tap on the globe are judged the same way.
//
// A tap is only judged where nobody could argue. Near the line between Europe and Asia, round the Red Sea and Suez, across Panama, round
// New Guinea, on Greenland and on New Zealand and the Pacific islands, a tap on land counts as no continent at all (ARGUED). Oceans are
// judged only well inside each one (oceanAt); a tap on a coast, in a strait or a narrow sea counts as no ocean.
import { LAKES, LAND } from '../world/outlines.gen';
import type { ContinentId } from '../world/continents';
import type { OceanId } from '../world/oceans';

export interface LonLat { readonly lon: number; readonly lat: number }
/** A group of outlines: a continent, or land drawn but never asked (Greenland, Oceania's islands, the French Southern Lands). */
export type LandGroup = ContinentId | 'greenland' | 'oceania' | 'islands';
export interface Region { readonly id: LandGroup; readonly rings: readonly Float32Array[]; readonly box: readonly [number, number, number, number][] }

const decode = (r: readonly number[]) => Float32Array.from(r, v => v / 10);
const boxOf = (r: Float32Array): [number, number, number, number] => {
  let x0 = 999, y0 = 999, x1 = -999, y1 = -999;
  for (let i = 0; i < r.length; i += 2) { x0 = Math.min(x0, r[i]!); x1 = Math.max(x1, r[i]!); y0 = Math.min(y0, r[i + 1]!); y1 = Math.max(y1, r[i + 1]!); }
  return [x0, y0, x1, y1];
};
export const REGIONS: readonly Region[] = Object.entries(LAND).map(([id, rs]) => {
  const rings = rs.map(decode);
  return { id: id as LandGroup, rings, box: rings.map(boxOf) };
});
export const LAKE_RINGS: readonly Float32Array[] = LAKES.map(l => decode(l.ring));
const LAKE_BOX = LAKE_RINGS.map(boxOf);

function inRing(r: Float32Array, x: number, y: number): boolean {
  let inside = false;
  for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
    const xi = r[i]!, yi = r[i + 1]!, xj = r[j]!, yj = r[j + 1]!;
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
const inBox = (b: readonly number[], x: number, y: number) => x >= b[0]! && x <= b[2]! && y >= b[1]! && y <= b[3]!;

/** Wraps a longitude into -180..180. */
export const wrapLon = (lon: number) => ((((lon + 180) % 360) + 360) % 360) - 180;

/** The land group under a point, or 'lake', or null for the sea. The countries' outlines were simplified one by one, so thin gaps can open
 *  along their borders: a point in the sea with land all round it, close by, is that land. */
export function landAt(lon: number, lat: number): LandGroup | 'lake' | null {
  const here = rawLandAt(lon, lat);
  if (here !== null) return here;
  const seen = new Map<LandGroup | 'lake', number>(), k = Math.max(0.15, Math.cos((lat * Math.PI) / 180));
  let wet = 0;
  for (const f of [1, 2]) for (let a = 0; a < 8; a++) {
    const t = ((a + f / 2) / 8) * Math.PI * 2, g = rawLandAt(lon + (Math.cos(t) * GAP * f) / k, lat + Math.sin(t) * GAP * f);
    if (g === null) { if (++wet > 2) return null; continue; }
    seen.set(g, (seen.get(g) ?? 0) + 1);
  }
  return [...seen].sort((p, q) => q[1] - p[1])[0]![0];
}
/** How wide a gap between two countries' outlines can be, in degrees. */
const GAP = 0.7;
function rawLandAt(lon: number, lat: number): LandGroup | 'lake' | null {
  const x = wrapLon(lon);
  for (let k = 0; k < LAKE_RINGS.length; k++) if (inBox(LAKE_BOX[k]!, x, lat) && inRing(LAKE_RINGS[k]!, x, lat)) return 'lake';
  for (const g of REGIONS) for (let k = 0; k < g.rings.length; k++) if (inBox(g.box[k]!, x, lat) && inRing(g.rings[k]!, x, lat)) return g.id;
  // the outlines stop short of the pole: the bottom of the world is Antarctica
  return lat < -85 ? 'antarctica' : null;
}

/** Whether the coast is within `margin` degrees of a point: the land or water under it changes somewhere on a ring round it. (The outlines
 *  are countries, so their edges are not all coasts; looking round the point is simpler and true to what is drawn.) */
export function nearCoast(lon: number, lat: number, margin: number): boolean {
  const wet = (x: number, y: number) => { const g = landAt(x, y); return g === null || g === 'lake'; };
  const here = wet(lon, lat), k = Math.max(0.15, Math.cos((lat * Math.PI) / 180));
  for (const f of [0.5, 1]) for (let a = 0; a < 16; a++) {
    const t = (a / 16) * Math.PI * 2, y = lat + Math.sin(t) * margin * f;
    if (Math.abs(y) > 90) continue;
    if (wet(lon + (Math.cos(t) * margin * f) / k, y) !== here) return true;
  }
  return false;
}

/** Land where taps never count as a continent: arguable borders, and islands that are not part of a continent's question. */
export const ARGUED: readonly { readonly why: string; readonly box: readonly [number, number, number, number] }[] = [
  { why: 'Europe and Asia meet along the Ural mountains', box: [48, 40, 72, 82] },
  { why: 'Europe and Asia meet round the Caucasus, the Black Sea and Turkey', box: [26, 35, 50, 45] },
  { why: 'Africa and Asia meet at Suez and the Sinai, and face each other across the Red Sea', box: [30, 11, 46, 33] },
  { why: 'Africa and Europe are close at Gibraltar', box: [-8, 34, -3, 38] },
  { why: 'North and South America meet at Panama', box: [-84, 5, -74, 11] },
  { why: 'New Guinea and the islands between Asia and Australia', box: [118, -12, 156, 3] },
];
const argued = (lon: number, lat: number) => ARGUED.some(a => inBox(a.box, lon, lat));

/** The continent under a point, judged only where it can't be argued; null for water, a lake, an island apart, or an arguable place. */
export function continentAt(lon: number, lat: number): ContinentId | null {
  const g = landAt(lon, lat);
  if (!g || g === 'lake' || g === 'greenland' || g === 'oceania' || g === 'islands') return null;
  return argued(wrapLon(lon), lat) ? null : g;
}

/** The ocean under a point, judged only well inside each ocean; null on land, in a lake, near an ocean's edge, or in a narrow sea. */
export function oceanAt(lon: number, lat: number): OceanId | null {
  if (landAt(lon, lat) !== null) return null;
  const x = wrapLon(lon);
  if (lat <= -63) return 'southern';
  if (lat >= 72) return 'arctic';
  if (lat > -57 && lat < 60) {
    // the Mediterranean and the seas round Europe are left out
    if (x >= -55 && x <= 5 && lat <= 55 && !(lat >= 30 && x >= -6)) return 'atlantic';
    if (x >= 42 && x <= 100 && lat <= 20 && lat >= -50) return 'indian';
    if (lat <= 55 && (x >= 150 || x <= -100 || (lat <= 12 && x <= -86))) return 'pacific';
  }
  return null;
}

/** Land or water, judged only away from the coast (a finger is wide): null within `margin` degrees of one. */
export function surfaceAt(lon: number, lat: number, margin = 2.2): 'land' | 'water' | null {
  if (nearCoast(lon, lat, margin)) return null;
  const g = landAt(lon, lat);
  return g === null || g === 'lake' ? 'water' : 'land';
}

// ---------- drawing the Earth ----------

const RAD = Math.PI / 180;
/** The flat map's frame: the whole width is -180..180 and the height runs from MAP_TOP down to MAP_BOTTOM. */
export const MAP_TOP = 86, MAP_BOTTOM = -86;

/** What part of the flat map shows: its centre and how far it is zoomed in (1 the whole world). */
export interface MapView { readonly lon: number; readonly lat: number; readonly zoom: number }
export const WORLD: MapView = { lon: 0, lat: (MAP_TOP + MAP_BOTTOM) / 2, zoom: 1 };

/** Degrees to pixels on a w×h flat map. Whole world: 360° across w; the world is centred and keeps its 2:1 shape. */
export function mapScale(w: number, h: number, v: MapView) {
  const s = Math.min(w / 360, h / (MAP_TOP - MAP_BOTTOM)) * v.zoom;
  return { s, x: (lon: number) => w / 2 + (lon - v.lon) * s, y: (lat: number) => h / 2 - (lat - v.lat) * s };
}
export function mapToLonLat(px: number, py: number, w: number, h: number, v: MapView): LonLat {
  const { s } = mapScale(w, h, v);
  return { lon: v.lon + (px - w / 2) / s, lat: v.lat - (py - h / 2) / s };
}

/** The globe, seen from straight above (lon0, lat0), of radius r. `z` < 0 is the far side. */
export function ortho(lon: number, lat: number, lon0: number, lat0: number): { x: number; y: number; z: number } {
  const l = (lon - lon0) * RAD, p = lat * RAD, p0 = lat0 * RAD;
  const cp = Math.cos(p);
  return { x: cp * Math.sin(l), y: -(Math.cos(p0) * Math.sin(p) - Math.sin(p0) * cp * Math.cos(l)), z: Math.sin(p0) * Math.sin(p) + Math.cos(p0) * cp * Math.cos(l) };
}
/** The point of the globe under (x, y), each from -1 to 1 across the globe's face; null off the globe. */
export function unOrtho(x: number, y: number, lon0: number, lat0: number): LonLat | null {
  const rho = Math.hypot(x, y);
  if (rho > 1) return null;
  if (rho === 0) return { lon: lon0, lat: lat0 };
  const c = Math.asin(rho), p0 = lat0 * RAD, yy = -y;
  const lat = Math.asin(Math.cos(c) * Math.sin(p0) + (yy * Math.sin(c) * Math.cos(p0)) / rho) / RAD;
  const lon = lon0 + Math.atan2(x * Math.sin(c), rho * Math.cos(p0) * Math.cos(c) - yy * Math.sin(p0) * Math.sin(c)) / RAD;
  return { lon: wrapLon(lon), lat };
}

/** Distance between two points on the globe, in degrees of arc. */
export function arc(a: LonLat, b: LonLat): number {
  const p1 = a.lat * RAD, p2 = b.lat * RAD, dl = (b.lon - a.lon) * RAD;
  const c = Math.sin(p1) * Math.sin(p2) + Math.cos(p1) * Math.cos(p2) * Math.cos(dl);
  return Math.acos(Math.max(-1, Math.min(1, c))) / RAD;
}
