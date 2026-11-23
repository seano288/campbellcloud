// Making a Job from his own city. Every Job is laid out on the streets and buildings he has: a bus route between his own stops, a
// parcel round to his own shops, a helicopter tour over his own rooftops. A named Job stays in its District; a numbered Job (one
// made after the named ones run out) roams the whole city. A bigger city makes longer, more varied Jobs. The same Job gives the same
// route every time (it's seeded), so a reload doesn't change it.
import { seeded, type Rng } from '../../game/rng';
import { buildingOf, JOB_NAMES, JOB_THINGS, type JobKind } from '../city/catalog';
import { allPlots, designOf, jobKindOf, rideFor, type CityState, type JobRef } from '../city/city';
import { boundsOf, DISTRICT_BLOCKS, districtOf, type Plot } from '../city/grid';
import type { JobPlan, VehicleStats } from './sim';

/** Totals stay at 50 or less in Jobs too, and no group is bigger than 10 (the brief's rule for the whole game). */
export const MOST_COLLECTED = 50, MOST_GROUP = 10;
export const MIN_STOPS = 4, MAX_STOPS = 7;
/** How far apart stops are at least (world units), when the city is big enough: about a Block. */
const SPREAD = 240;
/** Vehicles drive a little slower in a Job than their top speed, so a Job takes about a minute and the city can be seen. */
const SPEED = .85;

export interface Job {
  ref: JobRef;
  kind: JobKind;
  plan: JobPlan;
  vehicle: string;
  stats: VehicleStats;
  thing: (typeof JOB_THINGS)[JobKind];
}

const hash = (s: string) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
export const seedOf = (ref: JobRef) => ('named' in ref ? hash(ref.named.key) : ref.n * 2654435761) >>> 0;

/** Which of his plots suit a stop for this kind of Job. */
function suits(s: CityState, kind: JobKind, p: Plot): boolean {
  const placed = s.plots[p.id];
  if (!placed) return kind === 'sweeper' || kind === 'bus' || kind === 'tram';
  const b = buildingOf(placed.d), d = designOf(s, placed.d);
  switch (kind) {
    case 'parcel': case 'taxi': return true;
    case 'bins': return !!d && (d.people > 0 || b?.kind === 'shop');
    case 'icecream': return !!b?.visit || b?.kind === 'park';
    case 'heli': return !!d && (d.tower || d.look.floors >= 3 || b?.kind === 'landmark');
    case 'fire': case 'ambulance': return !!d && d.look.floors >= 1;
    default: return true;
  }
}

export function planJob(s: CityState, ref: JobRef): Job {
  const kind = jobKindOf(ref), rng: Rng = seeded(seedOf(ref)), v = rideFor(s, kind);
  const district = 'named' in ref ? ref.named.district : null;
  const plots = allPlots(s);
  const home = district === null ? plots : plots.filter(p => districtOf(p.block) === district);
  const area = home.length >= 4 ? home : plots;
  const blocks = new Set(area.map(p => p.block)).size;
  const want = Math.min(MAX_STOPS, MIN_STOPS + Math.floor(Math.max(blocks, s.blocks.length / 2) / 2));
  // where he sets off from: the building that adds this Job, if it's standing
  const depot = plots.find(p => { const b = buildingOf(s.plots[p.id]?.d ?? ''); return b?.job === kind; }) ?? area[0]!;
  const fly = !!v.fly;
  const spot = (p: Plot) => (fly ? { x: p.rect.x + p.rect.w / 2, y: p.rect.y + p.rect.h / 2 } : p.kerb);
  let pool = area.filter(p => p.id !== depot.id && suits(s, kind, p));
  if (pool.length < want) pool = [...pool, ...area.filter(p => p.id !== depot.id && !pool.includes(p))];
  // shuffle, then a route that visits them nearest-first, so he isn't sent back and forth
  pool = pool.map(p => ({ p, k: rng() })).sort((a, b) => a.k - b.k).map(x => x.p).slice(0, Math.max(want * 2, want));
  const stops: Plot[] = [];
  let at = spot(depot);
  while (stops.length < want && pool.length) {
    pool.sort((a, b) => dist(spot(a), at) - dist(spot(b), at));
    // a little way on from the last one (a street or two), one of the nearest such, so the route goes round rather than back and forth
    const far = pool.map((p, i) => ({ p, i })).filter(x => dist(spot(x.p), at) > SPREAD);
    const choice = far.length ? far[Math.floor(rng() * Math.min(3, far.length))]!.i : pool.length - 1;
    const next = pool.splice(choice, 1)[0]!;
    stops.push(next);
    at = spot(next);
  }
  const base = 2 + Math.floor(rng() * 4); // 2 to 5 at each stop
  const group = Math.max(1, Math.min(MOST_GROUP, base + (v.extra ?? 0), Math.floor(MOST_COLLECTED / Math.max(1, stops.length))));
  const plan: JobPlan = {
    stops: stops.map(p => ({ at: spot(p), plot: p.id })), group, start: spot(depot), bounds: boundsOf(s.blocks), traffic: !fly,
  };
  return { ref, kind, plan, vehicle: v.key, stats: { speed: v.speed * SPEED, grip: v.grip, radius: v.radius, fly }, thing: JOB_THINGS[kind] };
}
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

/** "Old Town Loop", or "Bus Route" for a numbered Job (said with its number). */
export const jobTitle = (ref: JobRef) => ('named' in ref ? ref.named.name : JOB_NAMES[ref.kind]);
export { DISTRICT_BLOCKS };
