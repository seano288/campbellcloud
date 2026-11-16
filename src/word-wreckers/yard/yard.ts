// The Yard and the Town on the saved game. A finished Round earns Bolts and one Job (he starts with one free). A Job is a demolition
// and then a build: he knocks down an old building with one of his machines, then puts up a new one with the crane, and it joins his
// Town. Bolts buy machines and upgrades (which open stronger buildings to knock down, and so bigger buildings to put up), paints, a
// driver, more streets for the Town, decorations, traffic that drives round the Town and a horn.
//
// A Job can instead be a Road Job, when he picks a Steamroller or Cement Mixer: he paves the road and picks a feature for the Town's
// road (a Car Wash, a Jump Ramp...), which works when he drives through it. Every other Job hides a treasure in the old building.
//
// A Job is always one he can do: the old building is never stronger than his strongest machine. The new building goes on the first
// empty lot; with no empty lot (until he buys the next street) he makes one of his buildings gold instead, so a Job always adds
// something. A Job is used, and its Bolts paid, only when the new building is up; leaving halfway costs nothing and pays nothing.
import { isAmount } from '../../currency/amount';
import type { PurchaseProposal } from '../../rewards/purchase';
import {
  ALL_KEYS, BUILDINGS, building, DRIVERS, FEATURES, idOf, isBuildingId, isFeatureId, isHornId, isItemKey, isMachineId, isTreasureId, item, keyOf,
  LOTS_PER_STREET, machine, MACHINES, PAINTS, PAVERS, ROAD_SLOTS, STARTERS, STREETS, tabOf, TOP_TIER, TREASURES, upKey, UPGRADES, WRECKERS,
  type BuildingId, type DriverId, type FeatureId, type HornId, type ItemKey, type MachineId, type PaintId, type Tier, type TreasureId,
} from './shop';

export interface Lot { b: BuildingId; gold: boolean }

export interface YardState {
  owned: ItemKey[];
  /** The machine he drives: shown in the Yard, first in a Job's picker, and the one on the Town's street. */
  machine: MachineId;
  /** Each machine's paint (Hi-Vis Yellow if it has none). */
  paints: Partial<Record<MachineId, PaintId>>;
  driver: DriverId;
  /** What he's saving for, once he has tapped something he can't afford yet. */
  goal: ItemKey | null;
  /** Jobs earned and not done yet. */
  jobs: number;
  /** Jobs finished. */
  done: number;
  /** His Town, lot by lot along the streets he owns. */
  town: Lot[];
  /** The horn every machine honks with. */
  horn: HornId;
  /** The features on his Town's road, in the order he built them (each takes the next place on the road). */
  roads: FeatureId[];
  /** Treasures he has found in the rubble, in the order he found them. */
  treasures: TreasureId[];
}

export const freshYard = (): YardState => ({ owned: [...STARTERS], machine: 'crane', paints: {}, driver: 'worker', goal: null, jobs: 1, done: 0, town: [], horn: 'honk', roads: [], treasures: [] });
export const isOwned = (s: Pick<YardState, 'owned'>, k: ItemKey) => s.owned.includes(k);
export const ownsMachine = (s: Pick<YardState, 'owned'>, m: MachineId) => isOwned(s, keyOf('machine', m));

type Raw = Record<string, unknown>;
const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);

/** Whatever is missing or doesn't read comes back fresh. Nothing he doesn't own is fitted, and his Town never has more buildings
 *  than his streets have lots, nor more road features than his roads have places. A save from before the horn, the road features and
 *  the treasures (still version 1) reads with the free horn, an empty road and no treasures, and keeps everything else. */
export function readYard(raw: unknown): YardState {
  if (!isRecord(raw)) return freshYard();
  const fresh = freshYard();
  const owned = [...new Set([...STARTERS, ...(Array.isArray(raw.owned) ? raw.owned.filter(isItemKey) : [])])];
  const s = { owned };
  const mach = isMachineId(raw.machine) && ownsMachine(s, raw.machine) ? raw.machine : fresh.machine;
  const paints: Partial<Record<MachineId, PaintId>> = {};
  if (isRecord(raw.paints)) for (const [m, p] of Object.entries(raw.paints)) if (isMachineId(m) && typeof p === 'string' && PAINTS.some(x => x.id === p) && isOwned(s, keyOf('paint', p))) paints[m] = p as PaintId;
  const driver = typeof raw.driver === 'string' && DRIVERS.some(d => d.id === raw.driver) && isOwned(s, keyOf('driver', raw.driver)) ? raw.driver as DriverId : fresh.driver;
  const lots = lotsOf(s), seen = new Set<BuildingId>(), town: Lot[] = [];
  if (Array.isArray(raw.town)) for (const l of raw.town) {
    if (!isRecord(l) || !isBuildingId(l.b) || seen.has(l.b) || town.length >= lots) continue;
    seen.add(l.b);
    town.push({ b: l.b, gold: l.gold === true });
  }
  const horn = isHornId(raw.horn) && isOwned(s, keyOf('horn', raw.horn)) ? raw.horn : fresh.horn;
  const roads = [...new Set(Array.isArray(raw.roads) ? raw.roads.filter(isFeatureId) : [])].slice(0, roadSlotsOf(s));
  const treasures = [...new Set(Array.isArray(raw.treasures) ? raw.treasures.filter(isTreasureId) : [])];
  return {
    owned, machine: mach, paints, driver, goal: isItemKey(raw.goal) && !owned.includes(raw.goal) ? raw.goal : null,
    jobs: isAmount(raw.jobs) ? raw.jobs : 0, done: isAmount(raw.done) ? raw.done : 0, town, horn, roads, treasures,
  };
}

// ---------- what his machines can do ----------

/** A machine's power with the upgrades he owns for it: the strongest material it can knock down. */
export function powerOf(s: Pick<YardState, 'owned'>, m: MachineId): number {
  const base = machine(m).power;
  if (!base) return 0;
  const ups = UPGRADES.filter(u => u.machine === m && u.boost === 'power' && isOwned(s, upKey(m, u.id))).length;
  return Math.min(TOP_TIER, base + ups);
}
/** How many of a machine's other upgrades he owns (bigger hits, more speed). */
export const extrasOf = (s: Pick<YardState, 'owned'>, m: MachineId, boost: 'size' | 'speed') =>
  UPGRADES.filter(u => u.machine === m && u.boost === boost && isOwned(s, upKey(m, u.id))).length;
export const ownsUpgrade = (s: Pick<YardState, 'owned'>, m: MachineId, id: string) => isOwned(s, upKey(m, id));

/** His wreckers, strongest first. */
export const wreckers = (s: Pick<YardState, 'owned'>) => WRECKERS.filter(m => ownsMachine(s, m)).sort((a, b) => powerOf(s, b) - powerOf(s, a));
export const maxPower = (s: Pick<YardState, 'owned'>) => Math.max(1, ...wreckers(s).map(m => powerOf(s, m))) as Tier;
/** The tallest buildings need the Tower Crane to put up. */
export const buildTier = (s: Pick<YardState, 'owned'>): Tier => Math.min(maxPower(s), ownsMachine(s, 'tower') ? 4 : 3) as Tier;

// ---------- the Town ----------

export const streetsOwned = (s: Pick<YardState, 'owned'>) => STREETS.filter(st => isOwned(s, keyOf('street', st.id)));
export const lotsOf = (s: Pick<YardState, 'owned'>) => streetsOwned(s).length * LOTS_PER_STREET;
export const freeLots = (s: Pick<YardState, 'owned' | 'town'>) => lotsOf(s) - s.town.length;
export const TOWN_TOTAL = STREETS.length * LOTS_PER_STREET;
/** Places on his roads for Road Job features: ROAD_SLOTS a street. */
export const roadSlotsOf = (s: Pick<YardState, 'owned'>) => streetsOwned(s).length * ROAD_SLOTS;
export const freeRoadSlots = (s: Pick<YardState, 'owned' | 'roads'>) => roadSlotsOf(s) - s.roads.length;
/** The machines he can pave a road with. */
export const pavers = (s: Pick<YardState, 'owned'>) => PAVERS.filter(m => ownsMachine(s, m));

// ---------- a Job ----------

/** What a Job puts up: a new building on an empty lot, his building made gold (no empty lot), or (everything gold) a build just for fun. */
export type BuildChoice = { kind: 'new' | 'gold' | 'fun'; b: BuildingId };
/** What a Road Job puts on the road: a feature, or (no feature or no place left) nothing, just for fun. */
export type RoadChoice = { kind: 'road'; f: FeatureId | null };
export type JobChoice = BuildChoice | RoadChoice;
export interface Job {
  /** The old building's material (1 wood to 4 steel): his strongest machine's power. */
  tier: Tier;
  /** Which old building it is, from the shapes for that material (job/wreck.ts), and its name (OLD_LINES). */
  shape: number;
  /** Two or three buildings to choose from. */
  choices: BuildChoice[];
  /** Up to three road features, if he paves the road instead (empty: the road is just for fun). */
  features: FeatureId[];
  /** The treasure hidden in the old building, on every other Job until he has found them all. */
  treasure: TreasureId | null;
}

/** The next Job: the strongest old building his machines can knock down, and up to three things to build. */
export function nextJob(s: Pick<YardState, 'owned' | 'town' | 'done'> & Partial<Pick<YardState, 'roads' | 'treasures'>>): Job {
  const tier = maxPower(s), top = buildTier(s), built = new Set(s.town.map(l => l.b)), n = 3;
  let choices: BuildChoice[];
  if (freeLots(s) > 0 && BUILDINGS.some(b => !built.has(b.id) && b.tier <= top)) {
    // the newest he can build first: the top tier's unbuilt ones, then lower
    const open = BUILDINGS.filter(b => !built.has(b.id) && b.tier <= top).sort((a, b) => b.tier - a.tier);
    const best = open.filter(b => b.tier === open[0]!.tier), rest = open.filter(b => b.tier !== open[0]!.tier);
    const turn = s.done % Math.max(1, best.length);
    choices = [...best.slice(turn), ...best.slice(0, turn), ...rest].slice(0, n).map(b => ({ kind: 'new', b: b.id }));
  } else if (s.town.some(l => !l.gold)) {
    const plain = s.town.filter(l => !l.gold), turn = s.done % plain.length;
    choices = [...plain.slice(turn), ...plain.slice(0, turn)].slice(0, n).map(l => ({ kind: 'gold', b: l.b }));
  } else {
    const all = BUILDINGS.filter(b => b.tier <= top), turn = s.done % all.length;
    choices = [...all.slice(turn), ...all.slice(0, turn)].slice(0, n).map(b => ({ kind: 'fun', b: b.id }));
  }
  const roads = s.roads ?? [], found = new Set(s.treasures ?? []);
  const features = freeRoadSlots({ owned: s.owned, roads }) > 0 ? FEATURES.filter(f => !roads.includes(f.id)).map(f => f.id) : [];
  const turnF = s.done % Math.max(1, features.length);
  const treasure = s.done % 2 === 1 ? TREASURES.find(t => !found.has(t.id))?.id ?? null : null;
  return { tier, shape: s.done, choices, features: [...features.slice(turnF), ...features.slice(0, turnF)].slice(0, n), treasure };
}

/** Bolts found in the rubble of every Job. */
export const JOB_BOLTS = 3;

/**
 * The building is up (or the road paved): the Job is used, the Bolts paid, and the Town gets it (or it turns gold, or the road gets
 * its feature), and a treasure he found goes on his shelf. Null if there's no Job to finish.
 */
export function finishJob(s: YardState, choice: JobChoice, found: TreasureId | null = null): YardState | null {
  if (s.jobs <= 0) return null;
  let town = s.town, roads = s.roads;
  if (choice.kind === 'road') {
    if (choice.f && freeRoadSlots(s) > 0 && !roads.includes(choice.f)) roads = [...roads, choice.f];
  } else if (choice.kind === 'new' && freeLots(s) > 0 && !town.some(l => l.b === choice.b)) town = [...town, { b: choice.b, gold: false }];
  else if (choice.kind === 'gold' && town.some(l => l.b === choice.b)) town = town.map(l => (l.b === choice.b ? { ...l, gold: true } : l));
  else if (choice.kind === 'new' && freeLots(s) > 0) return null;
  const treasures = found && !s.treasures.includes(found) ? [...s.treasures, found] : s.treasures;
  return { ...s, jobs: s.jobs - 1, done: s.done + 1, town, roads, treasures };
}
/** A Round finished: one more Job. */
export const earnJob = (s: YardState): YardState => ({ ...s, jobs: s.jobs + 1 });

// ---------- buying ----------

export const priceOf = (k: ItemKey) => item(k).price;
/** An upgrade needs its machine first. */
export const needsFirst = (s: Pick<YardState, 'owned'>, k: ItemKey): MachineId | null => {
  const it = item(k);
  return it.tab === 'up' && it.machine && !ownsMachine(s, it.machine) ? it.machine : null;
};

/**
 * What he's saving for: the one he picked; else, with his Town full, the next street; else the cheapest thing that lets him knock down
 * (and so build) something stronger; else the cheapest thing left that isn't a paint.
 */
export function goalOf(s: Pick<YardState, 'owned' | 'goal' | 'town'>): ItemKey | null {
  if (s.goal && !isOwned(s, s.goal)) return s.goal;
  const left = ALL_KEYS.filter(k => !isOwned(s, k) && !needsFirst(s, k)).sort((a, b) => priceOf(a) - priceOf(b));
  if (freeLots(s) <= 0) { const street = left.find(k => tabOf(k) === 'street'); if (street) return street; }
  const built = new Set(s.town.map(l => l.b)), top = buildTier(s);
  if (BUILDINGS.some(b => !built.has(b.id) && b.tier > top)) {
    const now = maxPower(s);
    const stronger = left.find(k => {
      if (k === 'machine:tower') return now >= TOP_TIER;
      const it = item(k);
      if (it.tab === 'machine') return machine(it.id as MachineId).power > now;
      if (it.tab === 'up' && it.machine) return UPGRADES.some(u => u.machine === it.machine && u.id === it.id && u.boost === 'power') && powerOf(s, it.machine) >= now && powerOf(s, it.machine) < TOP_TIER;
      return false;
    });
    if (stronger) return stronger;
  }
  return left.find(k => tabOf(k) !== 'paint') ?? left[0] ?? null;
}
export function selectGoal(s: YardState, k: ItemKey): YardState {
  if (isOwned(s, k)) throw new Error('A Goal is something he has not got');
  return { ...s, goal: k };
}

export type PurchaseFailure = 'invalid-item' | 'invalid-balance' | 'insufficient-funds' | 'already-owned' | 'needs-machine';
/** Buying a machine makes it the one he drives; a paint goes on the machine he drives; a driver gets in. */
export function proposePurchase(s: YardState, k: ItemKey, balance: number): PurchaseProposal<YardState, PurchaseFailure> {
  if (!isAmount(balance)) return { kind: 'rejected', reason: 'invalid-balance' };
  if (!isItemKey(k)) return { kind: 'rejected', reason: 'invalid-item' };
  if (isOwned(s, k)) return { kind: 'rejected', reason: 'already-owned' };
  if (needsFirst(s, k)) return { kind: 'rejected', reason: 'needs-machine' };
  const cost = priceOf(k);
  if (balance < cost) return { kind: 'rejected', reason: 'insufficient-funds' };
  const owned = [...s.owned, k], tab = tabOf(k), id = idOf(k);
  return {
    kind: 'ready', cost,
    state: {
      ...s, owned, goal: s.goal === k ? null : s.goal,
      machine: tab === 'machine' ? id as MachineId : s.machine,
      paints: tab === 'paint' ? { ...s.paints, [s.machine]: id as PaintId } : s.paints,
      driver: tab === 'driver' ? id as DriverId : s.driver,
      horn: tab === 'horn' ? id as HornId : s.horn,
    },
  };
}
export const allOwned = (s: Pick<YardState, 'owned'>) => ALL_KEYS.every(k => isOwned(s, k));
export const paintFor = (s: Pick<YardState, 'paints'>, m: MachineId): PaintId => s.paints[m] ?? 'yellow';
export const FEATURE_TOTAL = FEATURES.length;
export { building, MACHINES };
