// The photo missions, one for each Launch. First the seven continents and five oceans, then every place in the world tables, one at a
// time, taking turns round the continents so he travels. After those, missions are generated from their number without end: two or three
// places to pass over in one orbit, in order, far enough apart that each comes round on its own. The same number always gives the same
// mission. Every fifth mission earns a mission patch for his wall: the hand-made ones and then generated ones, never sold.
import { int, seeded } from '../../game/rng';
import { arc, type LonLat } from '../map/geo';
import { CONTINENTS, type ContinentId } from '../world/continents';
import { OCEANS, type OceanId } from '../world/oceans';
import { FAMOUS, PHOTO_PLACES, PLACES, type Place } from '../world/places';

/** Something to photograph: a continent, an ocean or a place. */
export type TargetId = `c:${ContinentId}` | `o:${OceanId}` | `p:${string}`;
export interface Target extends LonLat { readonly id: TargetId }

export function targetOf(id: TargetId): Target {
  const [k, v] = [id.slice(0, 1), id.slice(2)];
  if (k === 'c') { const c = CONTINENTS.find(x => x.id === v)!; return { id, lon: c.safe.lon, lat: c.safe.lat }; }
  if (k === 'o') { const o = OCEANS.find(x => x.id === v)!; return { id, lon: o.safe.lon, lat: o.safe.lat }; }
  const p = PLACES.find(x => x.id === v)!;
  return { id, lon: p.lon, lat: p.lat };
}
export const isTargetId = (x: unknown): x is TargetId => {
  if (typeof x !== 'string') return false;
  const [k, v] = [x.slice(0, 2), x.slice(2)];
  return (k === 'c:' && CONTINENTS.some(c => c.id === v)) || (k === 'o:' && OCEANS.some(o => o.id === v)) || (k === 'p:' && PLACES.some(p => p.id === v));
};
export const placeOfTarget = (id: TargetId): Place | null => (id.startsWith('p:') ? PLACES.find(p => p.id === id.slice(2)) ?? null : null);

/** The continent or ocean a target belongs to, for taking turns round the world. */
const regionOf = (p: Place): string => ('c' in p.where ? p.where.c : 'o' in p.where ? p.where.o : 'between' in p.where ? p.where.between[0] : 'namerica');

/** The world first, then the places, taking turns: one from each continent and ocean in turn, famous ones first within each. */
export const FIXED_TARGETS: readonly TargetId[] = (() => {
  const first: TargetId[] = ['c:africa', 'o:pacific', 'c:europe', 'o:atlantic', 'c:asia', 'o:indian', 'c:namerica', 'o:arctic', 'c:samerica', 'o:southern', 'c:australia', 'c:antarctica'];
  const queues = new Map<string, Place[]>();
  for (const p of [...FAMOUS, ...PHOTO_PLACES]) queues.set(regionOf(p), [...(queues.get(regionOf(p)) ?? []), p]);
  const order = ['africa', 'europe', 'asia', 'namerica', 'samerica', 'australia', 'pacific', 'atlantic', 'indian', 'antarctica', 'arctic', 'southern'];
  const rest: TargetId[] = [];
  while ([...queues.values()].some(q => q.length)) for (const r of order) { const q = queues.get(r); if (q?.length) rest.push(`p:${q.shift()!.id}`); }
  return [...first, ...rest];
})();
export const FIXED_COUNT = FIXED_TARGETS.length;

// ---------- patches ----------

export const PATCH_EVERY = 5;
export interface Patch { readonly n: number; readonly glyph: string; readonly bg: string; readonly rim: string }
const GLYPHS = ['🚀', '🌍', '🛰️', '⭐', '☄️', '🌎', '🔭', '📡', '🌏', '🧑‍🚀', '🌟', '⚡', '🌈', '🦅', '🐉', '🦁', '🐬', '🌋', '🏔️', '🏝️', '🌊', '❄️', '☀️', '🧭', '🗺️', '📷'];
const COLOURS = ['#e63946', '#ff7a00', '#ffd23f', '#2fa84f', '#2f8fe8', '#7b4bd1', '#ff7aa8', '#14a3a3', '#1f3a68', '#c46a2f', '#e0b13a', '#101a3a'];
/** The patch mission `n` earns, or null: every fifth mission, without end. */
export function patchFor(n: number): Patch | null {
  if (n < 1 || n % PATCH_EVERY) return null;
  const k = n / PATCH_EVERY;
  return { n, glyph: GLYPHS[(k * 7) % GLYPHS.length]!, bg: COLOURS[(k * 5 + Math.floor(k / GLYPHS.length)) % COLOURS.length]!, rim: COLOURS[(k * 3 + 4) % COLOURS.length]! };
}

// ---------- every mission ----------

export interface Mission { readonly n: number; readonly targets: readonly Target[]; readonly patch: Patch | null }

/** Places far enough apart (in degrees round the globe) that each comes round under the camera on its own. */
export const APART = 25;
const POOL: readonly TargetId[] = [...CONTINENTS.map(c => `c:${c.id}` as const), ...OCEANS.map(o => `o:${o.id}` as const), ...PLACES.map(p => `p:${p.id}` as const)];

export function mission(n: number): Mission {
  if (n <= FIXED_COUNT) return { n, targets: [targetOf(FIXED_TARGETS[n - 1]!)], patch: patchFor(n) };
  const rng = seeded(0x61ab ^ (n * 2654435761));
  // a little more to do as he goes: mostly two places, then three more often, to a ceiling of three
  const k = n - FIXED_COUNT, three = rng() < Math.min(.6, .15 + k / 400);
  const count = three ? 3 : 2, picked: Target[] = [];
  for (let tries = 0; picked.length < count && tries < 200; tries++) {
    const t = targetOf(POOL[int(rng, 0, POOL.length - 1)]!);
    if (picked.some(q => q.id === t.id || arc(q, t) < APART)) continue;
    picked.push(t);
  }
  return { n, targets: picked, patch: patchFor(n) };
}
