// Makes Globe Hopper's map table, once, from Natural Earth's public-domain 1:110m country and lake outlines
// (https://www.naturalearthdata.com/about/terms-of-use/: "All versions of Natural Earth raster + vector map data found on this website are
// in the public domain"). It groups the countries into the seven continents as American schools teach them, splits Russia at 60°E (the
// Urals, roughly) so its west is Europe and its east Asia, keeps Greenland apart (it is an island, not a continent) and New Zealand and
// the Pacific islands apart from Australia, puts French Guiana in South America (not with France), simplifies every outline (Douglas-Peucker) and drops the tiniest islands, and writes the
// result as whole tenths of a degree to src/globe-hopper/world/outlines.gen.ts. The game never reads the downloaded files.
//
//   curl -L -o <dir>/countries.geojson https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson
//   curl -L -o <dir>/lakes.geojson https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_lakes.geojson
//   npx tsx tools/globe-hopper/outlines.ts <dir>
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

type Pt = [number, number];
type Ring = Pt[];
interface Feature { properties: Record<string, unknown>; geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: unknown } }

const dir = process.argv[2];
if (!dir) throw new Error('usage: tsx tools/globe-hopper/outlines.ts <dir with countries.geojson and lakes.geojson>');
const read = (f: string) => (JSON.parse(readFileSync(resolve(dir, f), 'utf8')) as { features: Feature[] }).features;

/** Outer rings only (the 1:110m countries have no holes worth keeping at this size). */
function rings(g: Feature['geometry']): Ring[] {
  const polys = (g.type === 'Polygon' ? [g.coordinates] : g.coordinates) as Pt[][][];
  return polys.map(p => p[0]!.map(([x, y]) => [x, y] as Pt));
}

const area = (r: Ring) => Math.abs(r.reduce((s, [x, y], i) => { const [x2, y2] = r[(i + 1) % r.length]!; return s + x * y2 - x2 * y; }, 0)) / 2;

function simplify(r: Ring, tol: number): Ring {
  if (r.length < 4) return r;
  const keep = new Uint8Array(r.length);
  keep[0] = 1; keep[r.length - 1] = 1;
  const stack: [number, number][] = [[0, r.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    const [ax, ay] = r[a]!, [bx, by] = r[b]!;
    let far = -1, at = -1;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = r[i]!, dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy);
      const d = len === 0 ? Math.hypot(px - ax, py - ay) : Math.abs(dy * px - dx * py + bx * ay - by * ax) / len;
      if (d > far) { far = d; at = i; }
    }
    if (far > tol) { keep[at] = 1; stack.push([a, at], [at, b]); }
  }
  return r.filter((_, i) => keep[i]);
}

/** The part of a ring on one side of a meridian (Sutherland-Hodgman against one edge). */
function clip(r: Ring, lon: number, west: boolean): Ring {
  const inside = (p: Pt) => (west ? p[0] <= lon : p[0] >= lon);
  const out: Ring = [];
  for (let i = 0; i < r.length; i++) {
    const p = r[i]!, q = r[(i + 1) % r.length]!;
    const cross = (): Pt => { const t = (lon - p[0]) / (q[0] - p[0]); return [lon, p[1] + t * (q[1] - p[1])]; };
    if (inside(p)) { out.push(p); if (!inside(q)) out.push(cross()); } else if (inside(q)) out.push(cross());
  }
  return out;
}

const CONTINENT: Record<string, string> = {
  Africa: 'africa', Asia: 'asia', Europe: 'europe', 'North America': 'namerica', 'South America': 'samerica', Antarctica: 'antarctica',
};
const groups = new Map<string, Ring[]>();
const add = (g: string, r: Ring) => { if (r.length >= 3) groups.set(g, [...(groups.get(g) ?? []), r]); };

for (const f of read('countries.geojson')) {
  const name = String(f.properties.NAME), cont = String(f.properties.CONTINENT);
  for (const r of rings(f.geometry)) {
    // Russia's far east crosses the date line: those pieces (at negative longitudes) are Asia too
    if (name === 'Russia') { if (r.every(([x]) => x < 0)) add('asia', r); else { add('europe', clip(r, 60, true)); add('asia', clip(r, 60, false)); } continue; }
    if (name === 'Greenland') { add('greenland', r); continue; }
    if (name === 'France' && r[0]![0] < -20) { add('samerica', r); continue; } // French Guiana is in South America
    if (name === 'Australia') { add('australia', r); continue; }
    if (cont === 'Oceania') { add('oceania', r); continue; } // New Zealand, New Guinea's east and the Pacific islands
    const id = CONTINENT[cont];
    add(id ?? 'islands', r); // the French Southern Lands
  }
}

const TOL = 0.15, SMALLEST = 1.2;
const LAND: Record<string, number[][]> = {};
let points = 0;
for (const [g, rs] of groups) {
  const kept = rs.map(r => simplify(r, TOL)).filter(r => r.length >= 4 && area(r) >= SMALLEST);
  LAND[g] = kept.map(r => r.flatMap(([x, y]) => [Math.round(x * 10), Math.round(y * 10)]));
  points += kept.reduce((s, r) => s + r.length, 0);
}
const LAKES = read('lakes.geojson')
  .flatMap(f => rings(f.geometry).map(r => ({ name: String(f.properties.name), r: simplify(r, 0.3) })))
  .filter(l => area(l.r) >= 1.5)
  .map(l => ({ name: l.name, ring: l.r.flatMap(([x, y]) => [Math.round(x * 10), Math.round(y * 10)]) }));

const out = `// Made by tools/globe-hopper/outlines.ts from Natural Earth's 1:110m countries and lakes (public domain), simplified. Do not edit.
// Each ring is longitude, latitude, longitude, latitude ..., in tenths of a degree.
export const LAND: Record<string, readonly (readonly number[])[]> = ${JSON.stringify(LAND)};
export const LAKES: readonly { readonly name: string; readonly ring: readonly number[] }[] = ${JSON.stringify(LAKES)};
`;
writeFileSync(resolve(import.meta.dirname, '../../src/globe-hopper/world/outlines.gen.ts'), out);
console.log(`groups ${[...groups.keys()].join(', ')}; ${points} points; lakes ${LAKES.map(l => l.name).join(', ')}; ${out.length} bytes`);
