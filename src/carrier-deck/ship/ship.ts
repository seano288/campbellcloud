// The Carrier on the saved game: what he has built and bought, his Air Wing and how each aircraft looks, how his ship looks, his Fleet
// (and the Yard's ships), the Missions he has earned and flown, his best on each, how far the Voyage has come, his logbook and his medals.
//
// A finished Round earns Bolts and one Mission. Bolts buy ship parts, aircraft and the rest. A Mission he hasn't flown opens the next one
// and puts its patch on his wall; after the thirty-six hand-made ones the Voyage goes on with generated Missions, without end. Every
// Mission pays a few Bolts and adds to his logbook, and nothing is ever lost. A Mission is only used at its end, so leaving halfway
// costs nothing.
import { isAmount } from '../../currency/amount';
import type { PurchaseProposal } from '../../rewards/purchase';
import {
  AIRCRAFT, FLEET, FOR_SALE, HULL_SECTIONS, isItemId, itemOf, MODELS, PARTS, PLANES, REPEAT_IDS, repeatOf, repeatPrice, STARTERS, type Item, type Job, type Model, type RepeatId,
} from './catalog';
import { yardShip } from './fleet';
import { chart, chartOf, FIXED_COUNT, mission, PER_PLACE, PLACES, prizeById, type Mission, type Prize } from './missions';
import { deckLength, targetWire } from '../mission/sim';

export interface Look { paint: string; tail: string; num: number }
export interface Record_ { flown: number; bestGrade: number; bestStars: number }

export interface ShipState {
  /** Catalogue items bought, and Mission prizes won. */
  owned: string[];
  /** How many of each thing he can buy again and again (the Yard's ships are in `yard`). */
  more: Record<RepeatId, number>;
  /** The Yard's ships he has, by number. */
  yard: number[];
  looks: Partial<Record<Model, Look>>;
  /** The aircraft he flies. */
  flying: Model;
  /** What the ship wears, and its name (an index into SHIP_NAMES). */
  hullPaint: string; flag: string; mark: string; name: number;
  /** What he's saving for, once he has tapped a thing he can't afford: an item id, or `more:<repeat>`. */
  goal: string | null;
  /** Missions earned and not flown yet. */
  missions: number;
  /** Missions finished, ever. */
  flown: number;
  /** The hand-made Missions he has flown, by number, with his best. */
  records: Record<number, Record_>;
  /** The last generated Mission flown (FIXED_COUNT when none). */
  gen: number;
  /** A hand-made Mission he picked to fly again, if any. */
  picked: number | null;
  /** His logbook, in minutes. */
  minutes: number;
  /** Landings on the wire he aimed for, and how many of each job. */
  perfect: number;
  jobs: Record<Job, number>;
  trophies: string[];
}

export const SHIP_NAMES = ['Sea Star', 'Blue Whale', 'Lucky Dolphin', 'Thunder', 'Comet', 'Harbor Queen', 'Big Blue', 'Sunrise', 'Polar Bear', 'Albatross', 'Brave Heart', 'Wave Rider'] as const;
export type ShipName = (typeof SHIP_NAMES)[number];

/** He starts with one free Mission, so he sees the reward before his first purchase. */
export const FIRST_MISSIONS = 1;
const freshLook = (i: number): Look => ({ paint: 'paint:white', tail: 'tail:none', num: (i * 7 + 1) % 99 + 1 });
const noJobs = (): Record<Job, number> => ({ drop: 0, winch: 0, rings: 0, follow: 0, search: 0, storm: 0 });
export const freshShip = (): ShipState => ({
  owned: [...STARTERS], more: { hull: 0, bay: 0, yard: 0 }, yard: [], looks: { trainer: freshLook(0) }, flying: 'trainer',
  hullPaint: 'hull:grey', flag: 'flag:none', mark: 'mark:none', name: 0, goal: null, missions: FIRST_MISSIONS, flown: 0, records: {},
  gen: FIXED_COUNT, picked: null, minutes: 0, perfect: 0, jobs: noJobs(), trophies: [],
});

type Raw = Record<string, unknown>;
const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);
const count = (x: unknown, max = Number.MAX_SAFE_INTEGER) => (isAmount(x) ? Math.min(x as number, max) : 0);
const isPrize = (x: unknown): x is string => typeof x === 'string' && prizeById(x) !== null;
const isModel = (x: unknown): x is Model => typeof x === 'string' && (MODELS as readonly string[]).includes(x);

/** Whatever is missing or doesn't read comes back fresh; nothing he doesn't own can be worn. */
export function readShip(raw: unknown): ShipState {
  const f = freshShip();
  if (!isRecord(raw)) return f;
  const owned = [...new Set([...STARTERS, ...(Array.isArray(raw.owned) ? raw.owned.filter(x => isItemId(x) || isPrize(x)) as string[] : [])])];
  const has = (id: string) => owned.includes(id);
  const more = isRecord(raw.more) ? raw.more : {}, lk = isRecord(raw.looks) ? raw.looks : {};
  const looks: ShipState['looks'] = {};
  for (const m of MODELS) {
    if (!has(`air:${m}`)) continue;
    const l = isRecord(lk[m]) ? lk[m] as Raw : {}, fresh = freshLook(MODELS.indexOf(m));
    const ok = (id: unknown, prefix: string) => typeof id === 'string' && id.startsWith(prefix) && has(id);
    looks[m] = { paint: ok(l.paint, 'paint:') ? l.paint as string : fresh.paint, tail: ok(l.tail, 'tail:') ? l.tail as string : fresh.tail, num: count(l.num, 99) || fresh.num };
  }
  const recs = isRecord(raw.records) ? raw.records : {}, jobs = isRecord(raw.jobs) ? raw.jobs : {};
  const records: ShipState['records'] = {};
  for (let n = 1; n <= FIXED_COUNT; n++) {
    const r = recs[n];
    if (isRecord(r) && count(r.flown) > 0) records[n] = { flown: count(r.flown), bestGrade: count(r.bestGrade, 3), bestStars: count(r.bestStars, 3) };
  }
  const goal = typeof raw.goal === 'string' && (raw.goal.startsWith('more:') ? REPEAT_IDS.includes(raw.goal.slice(5) as RepeatId) : isItemId(raw.goal) && !has(raw.goal)) ? raw.goal : null;
  const wear = (x: unknown, prefix: string, fallback: string) => (typeof x === 'string' && x.startsWith(prefix) && has(x) ? x : fallback);
  return {
    owned, more: Object.fromEntries(REPEAT_IDS.map(id => [id, count(more[id], id === 'yard' ? 1_000_000 : repeatOf(id).most)])) as ShipState['more'],
    yard: Array.isArray(raw.yard) ? [...new Set(raw.yard.filter(n => isAmount(n) && (n as number) >= 1) as number[])] : [],
    looks, flying: isModel(raw.flying) && has(`air:${raw.flying}`) ? raw.flying : 'trainer',
    hullPaint: wear(raw.hullPaint, 'hull:', f.hullPaint), flag: wear(raw.flag, 'flag:', f.flag),
    mark: typeof raw.mark === 'string' && (raw.mark.startsWith('mark:') || raw.mark.startsWith('gmark:')) && has(raw.mark) ? raw.mark : f.mark,
    name: count(raw.name, SHIP_NAMES.length - 1), goal, missions: count(raw.missions, 99), flown: count(raw.flown), records,
    gen: Math.max(FIXED_COUNT, count(raw.gen, 10_000_000)), picked: typeof raw.picked === 'number' && records[raw.picked] ? raw.picked : null,
    minutes: count(raw.minutes), perfect: count(raw.perfect), jobs: Object.fromEntries(Object.keys(noJobs()).map(j => [j, count(jobs[j])])) as ShipState['jobs'],
    trophies: Array.isArray(raw.trophies) ? TROPHIES.map(t => t.id).filter(id => (raw.trophies as unknown[]).includes(id)) : [],
  };
}

export const has = (a: Pick<ShipState, 'owned'>, id: string) => a.owned.includes(id);

// ---------- what his ship can do ----------

/** Hull sections beyond the three he starts with: the fixed ones, then the again-and-again ones. */
export const sections = (a: Pick<ShipState, 'owned' | 'more'>) => PARTS.filter(p => p.does === 'hull' && has(a, p.id)).length + a.more.hull;
export const deckLen = (a: Pick<ShipState, 'owned' | 'more'>) => deckLength(sections(a));
export const wires = (a: Pick<ShipState, 'owned'>) => 2 + (has(a, 'part:wire3') ? 1 : 0) + (has(a, 'part:wire4') ? 1 : 0);
export const catapults = (a: Pick<ShipState, 'owned'>) => 1 + ['cat2', 'cat3', 'cat4'].filter(c => has(a, `part:${c}`)).length;
export const lifts = (a: Pick<ShipState, 'owned'>) => ['lift1', 'lift2', 'lift3'].filter(c => has(a, `part:${c}`)).length;
/** How many aircraft he can own: three on deck; the hangar deck holds two more and each bay two more (all twelve fit once the four bays
 *  are built; another bay after that is room in "Watch the deck" for his aircraft to come and go). */
export const capacity = (a: Pick<ShipState, 'owned' | 'more'>) =>
  3 + (has(a, 'part:hangar') ? 2 : 0) + 2 * ['bay1', 'bay2', 'bay3', 'bay4'].filter(b => has(a, `part:${b}`)).length + a.more.bay;
export const airWing = (a: Pick<ShipState, 'owned'>) => MODELS.filter(m => has(a, `air:${m}`));
/** An aircraft flies from his deck when the deck is long enough for it. */
export const canFly = (a: Pick<ShipState, 'owned' | 'more'>, m: Model) => sections(a) >= AIRCRAFT[m].deck;
export const fleetCount = (a: Pick<ShipState, 'owned' | 'yard'>) => FLEET.filter(s => has(a, s.id)).length + a.yard.length;

// ---------- buying ----------

export type Want = { kind: 'item'; id: string } | { kind: 'more'; id: RepeatId };
export const wantKey = (w: Want) => (w.kind === 'item' ? w.id : `more:${w.id}`);
export const wantOf = (key: string): Want => (key.startsWith('more:') ? { kind: 'more', id: key.slice(5) as RepeatId } : { kind: 'item', id: key });
/** The next thing that makes room for another aircraft. */
function nextRoom(a: Pick<ShipState, 'owned' | 'more'>): string {
  for (const id of ['part:lift1', 'part:hangar', 'part:bay1', 'part:bay2', 'part:bay3', 'part:bay4']) if (!has(a, id)) return id;
  return 'more:bay';
}
/** What it needs first, if he hasn't got it: another part (Catapult 3 needs Catapult 2), or room in the hangar for an aircraft. */
export function missingNeed(a: Pick<ShipState, 'owned' | 'more'>, w: Want): string | null {
  const needs = w.kind === 'item' ? itemOf(w.id).needs : repeatOf(w.id).needs;
  if (needs && !has(a, needs)) return needs;
  if (w.kind === 'item' && itemOf(w.id).cat === 'aircraft' && airWing(a).length >= capacity(a)) {
    const room = nextRoom(a);
    return room.startsWith('more:') ? null : room;
  }
  return null;
}
export const priceOf = (a: Pick<ShipState, 'more'>, w: Want) => (w.kind === 'item' ? itemOf(w.id).price : repeatPrice(w.id, a.more[w.id]));
/** It can still be bought: not owned, or an again-and-again thing that hasn't reached its most (the Yard never does). */
export const isNew = (a: Pick<ShipState, 'owned' | 'more'>, w: Want) => (w.kind === 'more' ? a.more[w.id] < repeatOf(w.id).most : !has(a, w.id));
/** He could buy it now if he had the Bolts: for sale, new, what it needs is there, and (an aircraft) there is room for it. */
export function buyable(a: Pick<ShipState, 'owned' | 'more'>, w: Want): boolean {
  if (!isNew(a, w) || missingNeed(a, w)) return false;
  if (w.kind === 'item' && itemOf(w.id).cat === 'aircraft' && airWing(a).length >= capacity(a)) return false;
  return w.kind === 'more' || itemOf(w.id).price > 0;
}

/** Every fixed thing he could buy now, cheapest first. */
export const shopNow = (a: Pick<ShipState, 'owned' | 'more'>): Want[] =>
  FOR_SALE.filter(i => buyable(a, { kind: 'item', id: i.id })).sort((x, y) => x.price - y.price).map(i => ({ kind: 'item', id: i.id }));
export const repeatsNow = (a: Pick<ShipState, 'owned' | 'more'>): Want[] =>
  REPEAT_IDS.map(id => ({ kind: 'more', id }) as Want).filter(w => buyable(a, w)).sort((x, y) => priceOf(a, x) - priceOf(a, y));
/** The fixed catalogue is all bought (the again-and-again things are always on offer once they open). */
export const catalogueDone = (a: Pick<ShipState, 'owned'>) => FOR_SALE.every(i => has(a, i.id));

/** His Goal: what he tapped and couldn't afford, else the cheapest new thing, else the cheapest again-and-again thing. */
export function goalOf(a: ShipState): Want | null {
  if (a.goal) { const w = wantOf(a.goal); if (buyable(a, w)) return w; }
  return shopNow(a)[0] ?? repeatsNow(a)[0] ?? null;
}
export const selectGoal = (a: ShipState, w: Want): ShipState => ({ ...a, goal: wantKey(w) });

export type PurchaseFailure = 'invalid-item' | 'invalid-balance' | 'insufficient-funds' | 'already-owned' | 'not-yet';
export function proposePurchase(a: ShipState, w: Want, balance: number): PurchaseProposal<ShipState, PurchaseFailure> {
  if (!isAmount(balance)) return { kind: 'rejected', reason: 'invalid-balance' };
  if (w.kind === 'item' ? !isItemId(w.id) || itemOf(w.id).price <= 0 : !REPEAT_IDS.includes(w.id)) return { kind: 'rejected', reason: 'invalid-item' };
  if (!isNew(a, w)) return { kind: 'rejected', reason: 'already-owned' };
  if (!buyable(a, w)) return { kind: 'rejected', reason: 'not-yet' };
  const cost = priceOf(a, w);
  if (balance < cost) return { kind: 'rejected', reason: 'insufficient-funds' };
  return { kind: 'ready', cost, state: bought(a, w) };
}
/** Buying an aircraft puts it in the Air Wing and makes it the one he flies (if his deck can take it); a paint or tail goes on that
 *  aircraft; a hull colour, flag or deck marking goes on the ship. */
export function bought(a: ShipState, w: Want): ShipState {
  const goal = a.goal === wantKey(w) ? null : a.goal;
  if (w.kind === 'more') {
    const next = { ...a, more: { ...a.more, [w.id]: a.more[w.id] + 1 }, goal };
    if (w.id === 'yard') next.yard = [...a.yard, a.more.yard + 1];
    return withTrophies(next);
  }
  const item = itemOf(w.id);
  let next: ShipState = { ...a, owned: [...a.owned, w.id], goal };
  if (item.cat === 'aircraft') {
    next = { ...next, looks: { ...next.looks, [item.model]: freshLook(MODELS.indexOf(item.model)) } };
    if (canFly(next, item.model)) next = { ...next, flying: item.model };
  }
  if (item.cat === 'paint') next = wear(next, a.flying, { paint: w.id });
  if (item.cat === 'tail') next = wear(next, a.flying, { tail: w.id });
  if (item.cat === 'hull') next = { ...next, hullPaint: w.id };
  if (item.cat === 'flag') next = { ...next, flag: w.id };
  if (item.cat === 'mark') next = { ...next, mark: w.id };
  return withTrophies(next);
}
export function wear(a: ShipState, m: Model, change: Partial<Look>): ShipState {
  const l = a.looks[m];
  if (!l) return a;
  for (const v of Object.values(change)) if (typeof v === 'string' && !has(a, v)) return a;
  return { ...a, looks: { ...a.looks, [m]: { ...l, ...change } } };
}
export const lookOf = (a: Pick<ShipState, 'looks'>, m: Model): Look => a.looks[m] ?? freshLook(MODELS.indexOf(m));
export const flyingModel = (a: ShipState): Model => (has(a, `air:${a.flying}`) && canFly(a, a.flying) ? a.flying : 'trainer');

// ---------- the logbook ----------

/** Ranks by flight hours. After Admiral, a Fleet Admiral every 40 hours, numbered, without end. */
export const RANKS = [
  { name: 'Cadet', at: 0 }, { name: 'Deckhand', at: 2 }, { name: 'Flyer', at: 5 }, { name: 'Pilot', at: 10 }, { name: 'Ace', at: 18 },
  { name: 'Flight Leader', at: 30 }, { name: 'Wing Leader', at: 45 }, { name: 'Captain', at: 65 }, { name: 'Commodore', at: 90 }, { name: 'Admiral', at: 120 },
] as const;
export type RankName = (typeof RANKS)[number]['name'] | 'Fleet Admiral';
export const FLEET_ADMIRAL_EVERY = 40;
export function rankOf(minutes: number): { index: number; name: RankName; number: number; next: number } {
  const hours = minutes / 60, top = RANKS[RANKS.length - 1]!.at;
  if (hours < top + FLEET_ADMIRAL_EVERY) {
    const i = RANKS.findLastIndex(r => hours >= r.at);
    return { index: i, name: RANKS[i]!.name, number: 0, next: (i + 1 < RANKS.length ? RANKS[i + 1]!.at : top + FLEET_ADMIRAL_EVERY) * 60 };
  }
  const k = Math.floor((hours - top) / FLEET_ADMIRAL_EVERY);
  return { index: RANKS.length - 1 + k, name: 'Fleet Admiral', number: k, next: (top + (k + 1) * FLEET_ADMIRAL_EVERY) * 60 };
}
/** A Mission's time in the logbook: longer jobs are longer flights. */
export const minutesFor = (m: Mission) => 20 + 5 * m.count;

// ---------- where he flies ----------

/** The hand-made Missions are flown in order; one that needs something he hasn't got (night ones need the Deck Lights) waits, and
 *  the next is open meanwhile. */
export function fixedOpen(a: Pick<ShipState, 'owned' | 'records'>, n: number): boolean {
  const m = mission(n);
  if (m.needs && !has(a, m.needs)) return false;
  for (let k = 1; k < n; k++) if (!a.records[k] && !(mission(k).needs && !has(a, mission(k).needs!))) return false;
  return true;
}
export const fixedFlown = (a: Pick<ShipState, 'records'>) => Object.keys(a.records).length;
export const nextFixed = (a: Pick<ShipState, 'owned' | 'records'>): number | null => {
  for (let n = 1; n <= FIXED_COUNT; n++) if (!a.records[n] && fixedOpen(a, n)) return n;
  return null;
};
/** The chart he has reached: the furthest place with a Mission flown, or the first. */
export function voyageChart(a: Pick<ShipState, 'records' | 'gen'>): number {
  const fixedTop = Math.max(0, ...Object.keys(a.records).map(Number));
  return Math.max(1, chartOf(Math.max(fixedTop, a.gen > FIXED_COUNT ? a.gen : 0) || 1));
}

export type MissionMode = 'new' | 'again';
export interface MissionPlan { readonly m: Mission; readonly mode: MissionMode; readonly model: Model; readonly suited: boolean; readonly night: boolean }
/** Which aircraft flies it: the one he picked if it suits the job, else one he owns that suits it and can fly, else the one he picked. */
export function aircraftFor(a: ShipState, m: Mission): { model: Model; suited: boolean } {
  const mine = flyingModel(a);
  if (m.suits.includes(mine)) return { model: mine, suited: true };
  const other = m.suits.find(x => has(a, `air:${x}`) && canFly(a, x));
  return other ? { model: other, suited: true } : { model: mine, suited: false };
}
/** Where the Mission button goes: what he picked, else the next new hand-made Mission, else the next generated one. A generated night
 *  Mission is flown at dusk until he has the Deck Lights. */
export function planMission(a: ShipState): MissionPlan {
  const make = (m: Mission, mode: MissionMode): MissionPlan => ({ m, mode, ...aircraftFor(a, m), night: m.night && has(a, 'part:lights') });
  if (a.picked && a.records[a.picked]) return make(mission(a.picked), 'again');
  const n = nextFixed(a);
  if (n) return make(mission(n), 'new');
  return make(mission(a.gen + 1), 'new');
}
export const pickMission = (a: ShipState, n: number | null): ShipState | null => (n === null || a.records[n] ? { ...a, picked: n } : null);

// ---------- paying for a Mission ----------

/** A finished Mission pays this, plus one for two stars and two for three, plus the bonuses below. A Round pays at most 6, so a Round
 *  and its Mission pay at most 6 + 2 + 2 + 2 + 1 = 13, under Turbo Tally's ceiling of 15. */
export const MISSION_BOLTS = 2, NEW_BOLTS = 2, WIRE_BOLTS = 1, BEST_BOLTS = 1;
export const MOST_MISSION_BOLTS = MISSION_BOLTS + 2 + NEW_BOLTS + WIRE_BOLTS;

export interface MissionResult { stars: 1 | 2 | 3; wire: number; grade: 1 | 2 | 3 }
export interface MissionPay {
  bolts: number;
  minutes: number;
  /** The right aircraft for the job earns a star. */
  stars: 1 | 2 | 3;
  isNew: boolean;
  /** Beat his best landing or stars on a Mission flown before. */
  best: boolean;
  prize: Prize | null;
  /** A new port on the chart, the rank he went up to, medals won. */
  port: number | null;
  rank: ReturnType<typeof rankOf> | null;
  trophies: string[];
}
export function payFor(a: ShipState, plan: MissionPlan, res: MissionResult): MissionPay {
  const stars = Math.min(3, res.stars + (plan.suited ? 1 : 0)) as 1 | 2 | 3;
  const rec = plan.m.n <= FIXED_COUNT ? a.records[plan.m.n] : undefined;
  const isNew = plan.mode === 'new';
  const best = !isNew && !!rec && (res.grade > rec.bestGrade || stars > rec.bestStars);
  const bolts = MISSION_BOLTS + (stars - 1) + (isNew ? NEW_BOLTS : 0) + (res.grade === 3 ? WIRE_BOLTS : 0) + (best ? BEST_BOLTS : 0);
  const minutes = minutesFor(plan.m);
  const before = rankOf(a.minutes), after = rankOf(a.minutes + minutes);
  const prize = isNew && plan.m.prize && !has(a, plan.m.prize.id) ? plan.m.prize : null;
  const pay: MissionPay = { bolts, minutes, stars, isNew, best, prize, port: null, rank: after.index > before.index ? after : null, trophies: [] };
  const next = finishMission(a, plan, res, pay);
  if (voyageChart(next) > voyageChart(a)) pay.port = voyageChart(next);
  pay.trophies = next.trophies.filter(t => !a.trophies.includes(t));
  return pay;
}
/** The Mission ended: it's used, the record kept, the logbook filled and what he won is his. */
export function finishMission(a: ShipState, plan: MissionPlan, res: MissionResult, pay: Pick<MissionPay, 'minutes' | 'prize' | 'stars'>): ShipState {
  const n = plan.m.n;
  const records = n <= FIXED_COUNT ? (() => {
    const was = a.records[n] ?? { flown: 0, bestGrade: 0, bestStars: 0 };
    return { ...a.records, [n]: { flown: was.flown + 1, bestGrade: Math.max(was.bestGrade, res.grade), bestStars: Math.max(was.bestStars, pay.stars) } };
  })() : a.records;
  const owned = pay.prize && !has(a, pay.prize.id) ? [...a.owned, pay.prize.id] : a.owned;
  const next: ShipState = {
    ...a, owned, records, missions: Math.max(0, a.missions - 1), flown: a.flown + 1, minutes: a.minutes + pay.minutes,
    gen: n > FIXED_COUNT ? Math.max(a.gen, n) : a.gen, picked: null, perfect: a.perfect + (res.grade === 3 ? 1 : 0),
    jobs: { ...a.jobs, [plan.m.job]: a.jobs[plan.m.job] + 1 },
    mark: pay.prize?.kind === 'mark' ? pay.prize.id : a.mark,
  };
  return withTrophies(next, plan);
}
/** A Round finished: one more Mission. */
export const earnMission = (a: ShipState): ShipState => ({ ...a, missions: a.missions + 1 });

// ---------- medals ----------

type Check = (a: ShipState, plan?: MissionPlan) => boolean;
const flownAtLeast = (n: number): Check => a => a.flown >= n;
const placeDone = (i: number): Check => a => Array.from({ length: PER_PLACE }, (_, k) => i * PER_PLACE + k + 1).every(n => !!a.records[n]);
const chartAtLeast = (n: number): Check => a => voyageChart(a) >= n;
export const TROPHIES = [
  { id: 'first', name: 'First Mission', icon: '🎖️', check: flownAtLeast(1) },
  { id: 'm10', name: 'Ten Missions', icon: '🎖️', check: flownAtLeast(10) },
  { id: 'm25', name: 'Busy Flyer', icon: '🎖️', check: flownAtLeast(25) },
  { id: 'm50', name: 'Fifty Missions', icon: '🏅', check: flownAtLeast(50) },
  { id: 'm100', name: 'Hundred Missions', icon: '🏅', check: flownAtLeast(100) },
  { id: 'm200', name: 'Sky Hero', icon: '🏆', check: flownAtLeast(200) },
  { id: 'm300', name: 'Sea Legend', icon: '🏆', check: flownAtLeast(300) },
  ...PLACES.map((p, i) => ({ id: `place:${p.id}`, name: (['Home Port Badge', 'Island Hopper', 'Ice Flyer', 'Reef Flyer', 'Storm Flyer', 'Far Harbor Badge'] as const)[i]!, icon: p.icon, check: placeDone(i) })),
  { id: 'c10', name: 'Ten Ports', icon: '🗺️', check: chartAtLeast(10) },
  { id: 'c20', name: 'Twenty Ports', icon: '🗺️', check: chartAtLeast(20) },
  { id: 'c50', name: 'Fifty Ports', icon: '🌍', check: chartAtLeast(50) },
  { id: 'p1', name: 'Perfect Landing', icon: '🛬', check: (a: ShipState) => a.perfect >= 1 },
  { id: 'p10', name: 'Ten Perfect Landings', icon: '🛬', check: (a: ShipState) => a.perfect >= 10 },
  { id: 'p50', name: 'Landing Star', icon: '🌟', check: (a: ShipState) => a.perfect >= 50 },
  { id: 'p100', name: 'Landing Legend', icon: '🌟', check: (a: ShipState) => a.perfect >= 100 },
  { id: 'rescue', name: 'Rescue Hero', icon: '🛟', check: (a: ShipState) => a.jobs.winch >= 10 },
  { id: 'drops', name: 'Drop Master', icon: '📦', check: (a: ShipState) => a.jobs.drop >= 10 },
  { id: 'rings', name: 'Ring Ace', icon: '⭕', check: (a: ShipState) => a.jobs.rings >= 10 },
  { id: 'storms', name: 'Storm Chaser', icon: '⛈️', check: (a: ShipState) => a.jobs.storm >= 10 },
  { id: 'night', name: 'Night Flyer', icon: '🌙', check: (_a: ShipState, p?: MissionPlan) => !!p?.night },
  { id: 'fleet3', name: 'Little Fleet', icon: '⛴️', check: (a: ShipState) => fleetCount(a) >= 3 },
  { id: 'fleet8', name: 'Big Fleet', icon: '🚢', check: (a: ShipState) => fleetCount(a) >= 8 },
  { id: 'fleet16', name: 'Mighty Fleet', icon: '🛳️', check: (a: ShipState) => fleetCount(a) >= 16 },
  { id: 'air3', name: 'Air Wing', icon: '✈️', check: (a: ShipState) => airWing(a).length >= 3 },
  { id: 'air6', name: 'Big Air Wing', icon: '🛩️', check: (a: ShipState) => airWing(a).length >= 6 },
  { id: 'air12', name: 'Every Aircraft', icon: '🚀', check: (a: ShipState) => airWing(a).length >= PLANES.length },
  { id: 'long', name: 'Long Ship', icon: '🚢', check: (a: ShipState) => sections(a) >= HULL_SECTIONS },
  { id: 'super', name: 'Super Carrier', icon: '👑', check: (a: ShipState) => PARTS.every(p => has(a, p.id)) },
] as const;
export type TrophyName = (typeof TROPHIES)[number]['name'];
export function withTrophies(a: ShipState, plan?: MissionPlan): ShipState {
  const got = TROPHIES.filter(t => !a.trophies.includes(t.id) && t.check(a, plan)).map(t => t.id);
  return got.length ? { ...a, trophies: [...a.trophies, ...got] } : a;
}

// ---------- counting ----------

/** The fixed catalogue: things to buy, hand-made Missions to fly (each a patch), medals to win. The generated Missions and their prizes,
 *  the Yard's ships, the ports and the ranks are on top, without end. */
export const CATALOGUE = { forSale: FOR_SALE.length, missions: FIXED_COUNT, trophies: TROPHIES.length };
export const CATALOGUE_SIZE = CATALOGUE.forSale + CATALOGUE.missions + CATALOGUE.trophies;
export { chart, yardShip, targetWire };
export type { Item };
