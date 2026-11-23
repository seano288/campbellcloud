// The City on the saved game: the land he owns, what stands on each plot, what he has bought, his Jobs and his bests.
//
// A finished Round earns Bolts and one Job. Bolts buy things from the catalogue (catalog.ts), more land, another floor on a tower,
// a building off the fresh street (gen.ts) or one he designs himself. Jobs open Districts: each District's first Block is his the
// moment it opens. Nothing bought is ever lost or used up: a building can be moved or swapped at any time and the old one stays
// his, to stand somewhere else.
//
// The fixed catalogue lasts hundreds of Rounds (economy.test.ts), and under it the City never runs out: there is always another
// Block of land to buy (the price rises gently, then stays flat), another floor (up to MAX_FLOORS on every tower), a fresh street of
// buildings made from parts, a new Job made from his own streets, and a new city rank as the population grows.
import { isAmount } from '../../currency/amount';
import type { PurchaseProposal } from '../../rewards/purchase';
import {
  BUILDINGS, buildingOf, DISTRICTS, FOR_SALE, isItemKey, itemOf, JOB_KINDS, NAMED_JOBS, STARTER_BUILDINGS, STARTER_PARTS, TROPHIES, VEHICLES, vehicleOf,
  type Building, type Item, type ItemKey, type JobKind, type NamedJob, type Trophy,
} from './catalog';
import { customDesign, CUSTOM_FLOORS, CUSTOM_PRICE, genDesign, type Custom, type Design } from './gen';
import { DISTRICT_BLOCKS, FIRST_EXTRA, plotById, plotsOf, type PlotSize } from './grid';

export type DesignKey = `b:${string}` | `g:${number}` | `c:${number}`;
export interface Placed { d: DesignKey; floors: number }

export interface CityState {
  /** Catalogue things he owns (starters included). */
  owned: ItemKey[];
  /** Blocks of land he owns, by id (grid.ts). */
  blocks: number[];
  /** Blocks bought with Bolts, for the price of the next one. */
  landBought: number;
  /** What stands on each plot, by plot id. An empty plot isn't listed. */
  plots: Record<string, Placed>;
  /** Buildings from the fresh street he has bought, by seed. */
  gens: number[];
  /** The fresh street starts at this seed. */
  street: number;
  customs: Custom[];
  /** The vehicle each kind of Job uses, and the paint on each vehicle. */
  ride: Partial<Record<JobKind, ItemKey>>;
  paint: Record<string, ItemKey>;
  /** Jobs earned and not done yet. */
  jobs: number;
  /** Jobs finished, ever: they open Districts. */
  done: number;
  named: string[];
  kinds: JobKind[];
  trophies: string[];
  /** His bests: most in one Job, biggest population, tallest tower. */
  best: { most: number; population: number; floors: number };
  /** Things bought, ever (land, floors and designs too). */
  bought: number;
  goal: ItemKey | null;
}

/** He starts with one free Job, so he sees the reward before his first purchase. */
export const FIRST_JOBS = 1;
/** A tower can grow to this many floors: still drawn well on every screen. */
export const MAX_FLOORS = 30;
export const PEOPLE_PER_FLOOR = 4;
/** A Job pays this, and the first time he does a named Job, BONUS more. */
export const JOB_BOLTS = 3, NAMED_BONUS = 2;
export const MOST_JOB_BOLTS = JOB_BOLTS + NAMED_BONUS;

export function freshCity(): CityState {
  const first = plotsOf(0);
  return {
    owned: [...STARTER_BUILDINGS, ...STARTER_PARTS, 'v:bus'], blocks: [0], landBought: 0,
    plots: { [first.find(p => p.size === 'w')!.id]: { d: 'b:depot', floors: 1 }, [first.find(p => p.size === 's')!.id]: { d: 'b:house', floors: 1 } },
    gens: [], street: 1, customs: [], ride: { bus: 'v:bus' }, paint: {}, jobs: FIRST_JOBS, done: 0, named: [], kinds: [], trophies: [],
    best: { most: 0, population: 0, floors: 0 }, bought: 0, goal: null,
  };
}

// ---------- reading a save ----------

type Raw = Record<string, unknown>;
const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);
const count = (x: unknown, max = Infinity) => (isAmount(x) ? Math.min(x as number, max) : 0);
const ints = (x: unknown) => (Array.isArray(x) ? x.filter((n): n is number => Number.isInteger(n) && n >= 0) : []);
const HEX = /^#[0-9a-f]{6}$/i;

export function isDesignKey(k: unknown): k is DesignKey {
  return typeof k === 'string' && (!!buildingOf(k) || /^[gc]:\d+$/.test(k));
}
function readCustom(x: unknown): Custom | null {
  if (!isRecord(x)) return null;
  const size = x.size === 'w' ? 'w' : 's';
  if (typeof x.wall !== 'string' || !HEX.test(x.wall) || typeof x.trim !== 'string' || !HEX.test(x.trim)) return null;
  const roof = itemOf(`r:${String(x.roof)}`), window = itemOf(`w:${String(x.window)}`), sign = itemOf(`s:${String(x.sign)}`);
  if (!roof || !window || !sign) return null;
  return { wall: x.wall, trim: x.trim, roof: x.roof as Custom['roof'], window: x.window as Custom['window'], sign: x.sign as string, floors: Math.max(1, Math.min(CUSTOM_FLOORS, count(x.floors))), size };
}

/** Whatever is missing or doesn't read comes back fresh, and the City is made whole: starters owned, open Districts' land his. */
export function readCity(raw: unknown): CityState {
  if (!isRecord(raw)) return freshCity();
  const fresh = freshCity();
  const owned = [...new Set([...fresh.owned, ...(Array.isArray(raw.owned) ? raw.owned.filter(isItemKey) : [])])];
  const customs = Array.isArray(raw.customs) ? raw.customs.map(readCustom).filter((c): c is Custom => !!c) : [];
  const gens = [...new Set(ints(raw.gens))];
  const done = count(raw.done);
  const blocks = [...new Set([0, ...ints(raw.blocks)])].sort((a, b) => a - b);
  const s: CityState = {
    ...fresh, owned, customs, gens, done, blocks,
    landBought: count(raw.landBought), street: Math.max(1, count(raw.street)), jobs: count(raw.jobs, 99), bought: count(raw.bought),
    named: Array.isArray(raw.named) ? NAMED_JOBS.map(j => j.key).filter(k => (raw.named as unknown[]).includes(k)) : [],
    kinds: Array.isArray(raw.kinds) ? JOB_KINDS.filter(k => (raw.kinds as unknown[]).includes(k)) : [],
    trophies: Array.isArray(raw.trophies) ? TROPHIES.map(t => t.key as string).filter(k => (raw.trophies as unknown[]).includes(k)) : [],
    best: isRecord(raw.best) ? { most: count(raw.best.most), population: count(raw.best.population), floors: count(raw.best.floors) } : fresh.best,
    goal: isItemKey(raw.goal) ? raw.goal : null,
    plots: {}, ride: {}, paint: {},
  };
  s.blocks = withDistrictLand(s);
  // a save with no plots at all keeps the starting ones (the Bus Depot and the house)
  const plots = isRecord(raw.plots) ? raw.plots : fresh.plots;
  for (const [id, p] of Object.entries(plots)) {
    const plot = plotById(id);
    if (!plot || !s.blocks.includes(plot.block) || !isRecord(p) || !isDesignKey(p.d) || !hasDesign(s, p.d)) continue;
    const d = designOf(s, p.d);
    if (!d || d.size !== plot.size) continue;
    s.plots[id] = { d: p.d, floors: d.tower ? Math.max(d.look.floors, Math.min(MAX_FLOORS, count(p.floors))) : d.look.floors };
  }
  const ride = isRecord(raw.ride) ? raw.ride : {};
  for (const k of JOB_KINDS) { const r = ride[k]; if (typeof r === 'string' && vehicleOf(r)?.job === k && ownsVehicle(s, r as ItemKey)) s.ride[k] = r as ItemKey; }
  const paint = isRecord(raw.paint) ? raw.paint : {};
  for (const [vk, pk] of Object.entries(paint)) if (vehicleOf(vk) && typeof pk === 'string' && pk.startsWith('p:') && owned.includes(pk as ItemKey)) s.paint[vk] = pk as ItemKey;
  return s;
}

// ---------- what he has ----------

export const owns = (s: Pick<CityState, 'owned'>, k: ItemKey) => s.owned.includes(k);
/** Districts open, by how many Jobs he has finished. */
export const districtsOpen = (done: number) => DISTRICTS.filter(d => done >= d.jobs).length;
export const isDistrictOpen = (s: Pick<CityState, 'done'>, d: number) => d < districtsOpen(s.done);
/** Each open District's first Block is his. */
function withDistrictLand(s: Pick<CityState, 'blocks' | 'done'>): number[] {
  const firsts = DISTRICTS.slice(0, districtsOpen(s.done)).map(d => d.id * DISTRICT_BLOCKS);
  return [...new Set([...s.blocks, ...firsts])].sort((a, b) => a - b);
}

/** The Job kinds his buildings add (the Bus Depot is his from the start). */
export const jobKinds = (s: Pick<CityState, 'owned'>): JobKind[] => JOB_KINDS.filter(k => BUILDINGS.some(b => b.job === k && s.owned.includes(b.key)));
/** A Job's own vehicle comes with the building that adds the Job. */
export const ownsVehicle = (s: Pick<CityState, 'owned'>, k: ItemKey) => {
  const v = vehicleOf(k);
  return !!v && (s.owned.includes(k) || (!!v.free && jobKinds(s).includes(v.job)));
};
export const rideFor = (s: Pick<CityState, 'owned' | 'ride'>, kind: JobKind) => {
  const r = s.ride[kind];
  return vehicleOf(r && ownsVehicle(s, r) ? r : VEHICLES.find(v => v.job === kind && v.free)!.key)!;
};

/** Can it be bought now: in an open District, and a vehicle only once its Job is his. */
export function available(s: Pick<CityState, 'done' | 'owned'>, i: Item): boolean {
  if (!isDistrictOpen(s, i.district)) return false;
  if (i.key.startsWith('v:')) return jobKinds(s).includes(vehicleOf(i.key)!.job);
  return true;
}
export const forSaleNow = (s: Pick<CityState, 'done' | 'owned'>) => FOR_SALE.filter(i => available(s, i) && !owns(s, i.key));

// ---------- designs and plots ----------

export function hasDesign(s: Pick<CityState, 'owned' | 'gens' | 'customs'>, k: DesignKey): boolean {
  if (k.startsWith('b:')) return s.owned.includes(k as ItemKey);
  const n = Number(k.slice(2));
  return k.startsWith('g:') ? s.gens.includes(n) : n < s.customs.length;
}
const buildingDesign = (b: Building): Design => ({ said: [b.name], size: b.size, look: b.look, people: b.kind === 'tower' ? b.look.floors * PEOPLE_PER_FLOOR : b.people, tower: b.kind === 'tower' });
export function designOf(s: Pick<CityState, 'customs'>, k: DesignKey): Design | null {
  if (k.startsWith('b:')) { const b = buildingOf(k); return b ? buildingDesign(b) : null; }
  const n = Number(k.slice(2));
  if (k.startsWith('g:')) return genDesign(n);
  const c = s.customs[n];
  return c ? customDesign(c) : null;
}
/** Every design he owns that fits a plot of this size. */
export function designsFor(s: CityState, size: PlotSize): DesignKey[] {
  const keys: DesignKey[] = [
    ...BUILDINGS.filter(b => b.size === size && s.owned.includes(b.key)).map(b => b.key),
    ...s.gens.filter(g => genDesign(g).size === size).map(g => `g:${g}` as const),
    ...s.customs.flatMap((c, i) => (c.size === size ? [`c:${i}` as const] : [])),
  ];
  return keys;
}
export const allPlots = (s: Pick<CityState, 'blocks'>) => s.blocks.flatMap(plotsOf);
export const freePlots = (s: CityState, size?: PlotSize) => allPlots(s).filter(p => !s.plots[p.id] && (!size || p.size === size));

/** Puts a design on a plot (or clears it, with null). Placing is free, and what was there stays his. */
export function place(s: CityState, plotId: string, d: DesignKey | null): CityState | null {
  const plot = plotById(plotId);
  if (!plot || !s.blocks.includes(plot.block)) return null;
  const plots = { ...s.plots };
  if (!d) { delete plots[plotId]; return { ...s, plots }; }
  const design = hasDesign(s, d) ? designOf(s, d) : null;
  if (!design || design.size !== plot.size) return null;
  // a tower he moves keeps its floors when it goes back to the same design
  const was = s.plots[plotId];
  plots[plotId] = { d, floors: design.tower && was?.d === d ? was.floors : design.look.floors };
  return { ...s, plots };
}
/** Swaps what stands on two plots of the same size (either can be empty). */
export function swap(s: CityState, a: string, b: string): CityState | null {
  const pa = plotById(a), pb = plotById(b);
  if (!pa || !pb || pa.size !== pb.size || a === b || !s.blocks.includes(pa.block) || !s.blocks.includes(pb.block)) return null;
  const plots = { ...s.plots }, x = plots[a], y = plots[b];
  if (y) plots[a] = y; else delete plots[a];
  if (x) plots[b] = x; else delete plots[b];
  return { ...s, plots };
}
function placeNew(s: CityState, d: DesignKey): CityState {
  const design = designOf(s, d);
  if (!design) return s;
  const spot = freePlots(s, design.size)[0];
  return spot ? place(s, spot.id, d) ?? s : s;
}

// ---------- population, ranks and towers ----------

export function population(s: CityState): number {
  let n = 0;
  for (const p of Object.values(s.plots)) {
    const d = designOf(s, p.d);
    if (d) n += d.tower ? p.floors * PEOPLE_PER_FLOOR : d.people;
  }
  return n;
}
export const tallest = (s: CityState) => Math.max(0, ...Object.values(s.plots).filter(p => designOf(s, p.d)?.tower).map(p => p.floors));

export const RANKS = ['Village', 'Town', 'City', 'Big City', 'Huge City', 'Mega City'] as const;
export const RANK_AT = [0, 60, 200, 500, 1000, 2000] as const;
/** After Mega City the ranks go on without end: Super City 1, 2, 3, each another RANK_STEP people. */
export const RANK_STEP = 1500;
export type RankName = (typeof RANKS)[number] | 'Super City';
export function rankOf(pop: number): { name: RankName; n: number; next: number; at: number } {
  let i = 0;
  while (i + 1 < RANK_AT.length && pop >= RANK_AT[i + 1]!) i++;
  if (i < RANKS.length - 1) return { name: RANKS[i]!, n: 0, at: RANK_AT[i]!, next: RANK_AT[i + 1]! };
  const k = Math.floor((pop - RANK_AT[RANKS.length - 1]!) / RANK_STEP);
  if (k === 0) return { name: 'Mega City', n: 0, at: RANK_AT[RANKS.length - 1]!, next: RANK_AT[RANKS.length - 1]! + RANK_STEP };
  const at = RANK_AT[RANKS.length - 1]! + k * RANK_STEP;
  return { name: 'Super City', n: k, at, next: at + RANK_STEP };
}

// ---------- prices ----------

/** The next Block of land: the first he hasn't got in an open District, then the city grows east, for ever. */
export function nextBlock(s: Pick<CityState, 'blocks' | 'done'>): number {
  const open = districtsOpen(s.done);
  for (let id = 0; id < open * DISTRICT_BLOCKS; id++) if (!s.blocks.includes(id)) return id;
  let id = FIRST_EXTRA;
  while (s.blocks.includes(id)) id++;
  return id;
}
/** Land gets a little dearer with each Block, then stays at 60. */
export const landPrice = (bought: number) => Math.min(60, 20 + 5 * bought);
/** The next floor on a tower that has `floors`: a little dearer as it climbs, then flat at 16. */
export const floorPrice = (floors: number) => Math.max(5, Math.min(16, floors + 2));
export const canGrow = (s: CityState, plotId: string) => { const p = s.plots[plotId]; return !!p && !!designOf(s, p.d)?.tower && p.floors < MAX_FLOORS; };
/** The fresh street: the next STREET_SIZE buildings made from parts that he hasn't bought. */
export const STREET_SIZE = 4;
export function freshStreet(s: Pick<CityState, 'street' | 'gens'>): number[] {
  const out: number[] = [];
  for (let seed = s.street; out.length < STREET_SIZE; seed++) if (!s.gens.includes(seed)) out.push(seed);
  return out;
}

export type Request =
  | { t: 'item'; key: ItemKey }
  | { t: 'land' }
  | { t: 'floor'; plot: string }
  | { t: 'gen'; seed: number }
  | { t: 'custom'; custom: Custom };
export type PurchaseFailure = 'invalid-balance' | 'invalid-item' | 'not-for-sale' | 'already-owned' | 'insufficient-funds' | 'too-tall';

export function priceOf(s: CityState, r: Request): number | null {
  switch (r.t) {
    case 'item': { const i = itemOf(r.key); return i && i.price > 0 && available(s, i) ? i.price : null; }
    case 'land': return landPrice(s.landBought);
    case 'floor': return canGrow(s, r.plot) ? floorPrice(s.plots[r.plot]!.floors) : null;
    case 'gen': return freshStreet(s).includes(r.seed) ? genDesign(r.seed).price : null;
    case 'custom': return CUSTOM_PRICE;
  }
}

export function proposePurchase(s: CityState, r: Request, balance: number): PurchaseProposal<CityState, PurchaseFailure> {
  if (!isAmount(balance)) return { kind: 'rejected', reason: 'invalid-balance' };
  if (r.t === 'item' && !isItemKey(r.key)) return { kind: 'rejected', reason: 'invalid-item' };
  if (r.t === 'item' && owns(s, r.key)) return { kind: 'rejected', reason: 'already-owned' };
  if (r.t === 'floor' && s.plots[r.plot] && !canGrow(s, r.plot)) return { kind: 'rejected', reason: 'too-tall' };
  if (r.t === 'custom' && !customOk(s, r.custom)) return { kind: 'rejected', reason: 'invalid-item' };
  const cost = priceOf(s, r);
  if (cost === null) return { kind: 'rejected', reason: 'not-for-sale' };
  if (balance < cost) return { kind: 'rejected', reason: 'insufficient-funds' };
  return { kind: 'ready', cost, state: apply(s, r) };
}
function customOk(s: CityState, c: Custom) {
  const has = (k: string) => s.owned.includes(k as ItemKey);
  return has(`r:${c.roof}`) && has(`w:${c.window}`) && has(`s:${c.sign}`) && has(`m:${c.wall}`) && c.floors >= 1 && c.floors <= CUSTOM_FLOORS;
}
function apply(s: CityState, r: Request): CityState {
  const t = { ...s, bought: s.bought + 1 };
  switch (r.t) {
    case 'item': {
      let next: CityState = { ...t, owned: [...t.owned, r.key], goal: t.goal === r.key ? null : t.goal };
      if (r.key.startsWith('b:')) next = placeNew(next, r.key as DesignKey);
      const v = vehicleOf(r.key);
      if (v) next = { ...next, ride: { ...next.ride, [v.job]: r.key } };
      return next;
    }
    case 'land': return { ...t, blocks: [...t.blocks, nextBlock(t)].sort((a, b) => a - b), landBought: t.landBought + 1 };
    case 'floor': { const p = t.plots[r.plot]!; return { ...t, plots: { ...t.plots, [r.plot]: { ...p, floors: p.floors + 1 } } }; }
    case 'gen': return placeNew({ ...t, gens: [...t.gens, r.seed] }, `g:${r.seed}`);
    case 'custom': return placeNew({ ...t, customs: [...t.customs, r.custom] }, `c:${t.customs.length}`);
  }
}

/** The thing he's saving for: the one he picked, or the cheapest thing for sale now that he hasn't got. */
export function goalOf(s: CityState): Item | null {
  if (s.goal && !owns(s, s.goal)) { const i = itemOf(s.goal); if (i && available(s, i)) return i; }
  return forSaleNow(s).sort((a, b) => a.price - b.price)[0] ?? null;
}
export const selectGoal = (s: CityState, k: ItemKey): CityState => ({ ...s, goal: k });

// ---------- vehicles and paint ----------

export function ride(s: CityState, k: ItemKey): CityState | null {
  const v = vehicleOf(k);
  return v && ownsVehicle(s, k) ? { ...s, ride: { ...s.ride, [v.job]: k } } : null;
}
export function paintVehicle(s: CityState, vehicle: ItemKey, paint: ItemKey): CityState | null {
  if (!vehicleOf(vehicle) || !ownsVehicle(s, vehicle) || !paint.startsWith('p:') || !owns(s, paint)) return null;
  return { ...s, paint: { ...s.paint, [vehicle]: paint } };
}

// ---------- Jobs ----------

/** The Job the Job button starts: the next named Job he can do, otherwise one made from his own city (job/plan.ts), numbered. */
export type JobRef = { named: NamedJob } | { n: number; kind: JobKind };
export function nextJob(s: CityState): JobRef {
  const kinds = jobKinds(s), open = districtsOpen(s.done);
  const named = NAMED_JOBS.find(j => j.district < open && kinds.includes(j.kind) && !s.named.includes(j.key));
  if (named) return { named };
  const n = s.done + 1;
  return { n, kind: kinds[(n * 7) % kinds.length]! };
}
export const jobKindOf = (j: JobRef) => ('named' in j ? j.named.kind : j.kind);
export const earnJob = (s: CityState): CityState => ({ ...s, jobs: s.jobs + 1 });

export interface JobPay {
  bolts: number;
  /** He did a named Job for the first time. */
  named: NamedJob | null;
  district: number | null;
  trophies: Trophy[];
  /** A new best for the most in one Job. */
  best: boolean;
}
export function payForJob(s: CityState, job: JobRef): Pick<JobPay, 'bolts' | 'named'> {
  const first = 'named' in job && !s.named.includes(job.named.key);
  return { bolts: JOB_BOLTS + (first ? NAMED_BONUS : 0), named: first ? (job as { named: NamedJob }).named : null };
}
/** The Job ended with `most` collected: it's used, counted, maybe opens a District, and his bests and trophies are kept. */
export function finishJob(s: CityState, job: JobRef, most: number): { state: CityState; pay: JobPay } {
  const { bolts, named } = payForJob(s, job), kind = jobKindOf(job);
  const before = districtsOpen(s.done);
  let next: CityState = {
    ...s, jobs: Math.max(0, s.jobs - 1), done: s.done + 1,
    named: named ? [...s.named, named.key] : s.named,
    kinds: s.kinds.includes(kind) ? s.kinds : [...s.kinds, kind],
    best: { ...s.best, most: Math.max(s.best.most, most) },
  };
  next = { ...next, blocks: withDistrictLand(next) };
  const after = districtsOpen(next.done);
  const won = newTrophies(next);
  next = keepBests({ ...next, trophies: [...next.trophies, ...won.map(t => t.key)] });
  return { state: next, pay: { bolts, named, district: after > before ? after - 1 : null, trophies: won, best: most > s.best.most && s.best.most > 0 } };
}

// ---------- trophies ----------

export function earned(s: CityState, t: Trophy): boolean {
  const r = t.rule;
  switch (r.t) {
    case 'pop': return Math.max(s.best.population, population(s)) >= r.at;
    case 'jobs': return s.done >= r.at;
    case 'floors': return Math.max(s.best.floors, tallest(s)) >= r.at;
    case 'blocks': return s.blocks.length >= r.at;
    case 'kind': return s.kinds.includes(r.kind);
    case 'best': return s.best.most >= r.at;
    case 'districts': return districtsOpen(s.done) >= r.at;
    case 'bought': return s.bought >= r.at;
  }
}
export const newTrophies = (s: CityState) => TROPHIES.filter(t => !s.trophies.includes(t.key) && earned(s, t));
export const awardTrophies = (s: CityState): { state: CityState; won: Trophy[] } => {
  const won = newTrophies(s);
  return { state: keepBests(won.length ? { ...s, trophies: [...s.trophies, ...won.map(t => t.key)] } : s), won };
};
/** Bests only go up, so a building moved away never takes a trophy back. */
export const keepBests = (s: CityState): CityState => ({ ...s, best: { ...s.best, population: Math.max(s.best.population, population(s)), floors: Math.max(s.best.floors, tallest(s)) } });

/** Everything in the fixed catalogue he has: bought, Districts, named Jobs and trophies. */
export const catalogueHad = (s: CityState) => s.owned.filter(k => itemOf(k)!.price > 0).length + districtsOpen(s.done) + s.named.length + s.trophies.length;
