// The Roost on the saved game: what he has bought, the eggs warming in his nests, his dragons (each with the name he gave it and the
// Flights it has flown), the dragon he rides, the tricks on its buttons and the gear it wears, the Flights he has earned and flown, his
// best on each, and what he's saving for.
//
// A finished Round earns Flames, one Flight, and warms every egg in a nest by one step: an egg hatches after a set number of Rounds, so it
// can't be bought out early. He taps a warm egg to hatch it and names the dragon. Every Flight he flies grows the dragon he rides:
// hatchling, young, great, and then a new mark every few Flights without end. Nothing bought is ever used up or lost.
import { isAmount } from '../../currency/amount';
import type { PurchaseProposal } from '../../rewards/purchase';
import type { DragonLook } from '../art/dragon';
import { course, FIXED_FLIGHTS, type Course } from '../flight/course';
import { resultOf, type FlightResult, type FlyWith, type Sim } from '../flight/sim';
import {
  COLOURS, EGGS, FOR_SALE, GEAR, GEAR_SLOTS, isItemId, itemOf, REPEAT_IDS, repeatOf, repeatPrice, ROOST, STARTERS, TRICKS,
  type ColourItem, type GearItem, type GearSlot, type Item, type RepeatId, type TrickItem,
} from './catalog';
import { isWild, lookOfEgg, marksOf, NAME_ADJECTIVES, NAME_NOUNS, roundsOf, stageOf, STARTER_EGG, wildNumber } from './dragons';

export interface Dragon {
  readonly id: number;
  /** The egg it came from: a catalogue egg's id, `wild:<n>`, or the starter. */
  readonly egg: string;
  /** The two words he named it with, or null until he does. */
  readonly name: readonly [string, string] | null;
  readonly flights: number;
}
export interface Warming { readonly egg: string; readonly warmth: number }
export interface Totals { lit: number; popped: number; birds: number; flames: number; hatched: number }

export interface RoostState {
  owned: string[];
  more: Record<RepeatId, number>;
  /** Eggs in his nests, in the order bought. */
  eggs: Warming[];
  dragons: Dragon[];
  /** The dragon he flies. */
  riding: number;
  /** The tricks on the Flight's buttons, in order. */
  tricksOn: string[];
  /** What the dragon wears in each gear slot, and its breath colour and trail. */
  worn: Partial<Record<GearSlot | 'breath-colour' | 'trail', string>>;
  /** Flights earned and not flown yet; Flights flown, ever; the furthest Flight flown (the next new one is reached + 1). */
  flights: number;
  flown: number;
  reached: number;
  /** His best on each Flight he has flown: beacons, clouds and birds. */
  bests: Record<number, number>;
  totals: Totals;
  /** What he's saving for: an item id, or `more:<repeat>`. */
  goal: string | null;
}

/** He starts with one free Flight on his starter dragon, so he sees the reward before his first purchase. */
export const FIRST_FLIGHTS = 1;
const noMore = (): Record<RepeatId, number> => ({ ledge: 0, wild: 0 });
const noTotals = (): Totals => ({ lit: 0, popped: 0, birds: 0, flames: 0, hatched: 0 });
export const freshRoost = (): RoostState => ({
  owned: [...STARTERS], more: noMore(), eggs: [], dragons: [{ id: 1, egg: STARTER_EGG, name: null, flights: 0 }], riding: 1,
  tricksOn: ['trick:flap'], worn: {}, flights: FIRST_FLIGHTS, flown: 0, reached: 0, bests: {}, totals: noTotals(), goal: null,
});

type Raw = Record<string, unknown>;
const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);
const count = (x: unknown, max = Number.MAX_SAFE_INTEGER) => (isAmount(x) ? Math.min(x as number, max) : 0);
const isEggId = (x: unknown): x is string => typeof x === 'string' && (x === STARTER_EGG || EGGS.some(e => e.id === x) || isWild(x));
const NAME_WORDS: readonly string[] = [...NAME_ADJECTIVES, ...NAME_NOUNS];

/** Whatever is missing or doesn't read comes back fresh; nothing he doesn't own can be worn or flown. */
export function readRoost(raw: unknown): RoostState {
  const f = freshRoost();
  if (!isRecord(raw)) return f;
  const owned = [...new Set([...STARTERS, ...(Array.isArray(raw.owned) ? raw.owned.filter(isItemId) : [])])];
  const more = isRecord(raw.more) ? raw.more : {};
  const dragons: Dragon[] = [];
  if (Array.isArray(raw.dragons)) for (const d of raw.dragons) {
    if (!isRecord(d) || !Number.isInteger(d.id) || (d.id as number) < 1 || !isEggId(d.egg) || dragons.some(x => x.id === d.id)) continue;
    const name = Array.isArray(d.name) && d.name.length === 2 && NAME_WORDS.includes(d.name[0]) && NAME_WORDS.includes(d.name[1]) ? [d.name[0], d.name[1]] as const : null;
    dragons.push({ id: d.id as number, egg: d.egg, name, flights: count(d.flights) });
  }
  if (!dragons.length) dragons.push(...f.dragons);
  const nests = nestCount({ owned, more: { ledge: count(more.ledge), wild: 0 } });
  const eggs = Array.isArray(raw.eggs) ? raw.eggs.filter((e): e is Raw => isRecord(e) && isEggId(e.egg)).slice(0, nests).map(e => ({ egg: e.egg as string, warmth: count(e.warmth, 99) })) : [];
  const worn: RoostState['worn'] = {};
  if (isRecord(raw.worn)) for (const [slot, id] of Object.entries(raw.worn)) {
    if (typeof id !== 'string' || !owned.includes(id)) continue;
    const item = itemOf(id);
    if ((item.cat === 'gear' && item.slot === slot) || (item.cat === 'colour' && `${item.part === 'breath' ? 'breath-colour' : 'trail'}` === slot)) worn[slot as GearSlot] = id;
  }
  const bests: Record<number, number> = {};
  if (isRecord(raw.bests)) for (const [n, b] of Object.entries(raw.bests)) if (/^\d+$/.test(n) && isAmount(b)) bests[Number(n)] = b as number;
  const t = isRecord(raw.totals) ? raw.totals : {};
  const reached = count(raw.reached);
  const goal = typeof raw.goal === 'string' && (raw.goal.startsWith('more:') ? REPEAT_IDS.includes(raw.goal.slice(5) as RepeatId) : isItemId(raw.goal) && !owned.includes(raw.goal)) ? raw.goal : null;
  const state: RoostState = {
    owned, more: Object.fromEntries(REPEAT_IDS.map(id => [id, count(more[id], 1_000_000)])) as RoostState['more'], eggs, dragons,
    riding: dragons.some(d => d.id === raw.riding) ? raw.riding as number : dragons[0]!.id,
    tricksOn: [], worn, flights: count(raw.flights, 99), flown: count(raw.flown), reached, bests,
    totals: { lit: count(t.lit), popped: count(t.popped), birds: count(t.birds), flames: count(t.flames), hatched: count(t.hatched) }, goal,
  };
  const on = Array.isArray(raw.tricksOn) ? [...new Set(raw.tricksOn.filter((id): id is string => typeof id === 'string' && owned.includes(id) && itemOf(id).cat === 'trick'))] : ['trick:flap'];
  return { ...state, tricksOn: on.slice(0, trickSlots(state)) };
}

export const has = (a: Pick<RoostState, 'owned'>, id: string) => a.owned.includes(id);

// ---------- what his roost can do ----------

/** Nests: each nest he owns and each ledge he has built holds one egg. */
export const nestCount = (a: Pick<RoostState, 'owned' | 'more'>) => ROOST.filter(r => r.does === 'nest' && has(a, r.id)).length + a.more.ledge;
/** How many Rounds sooner eggs hatch (the Hot Spring and the Big Hearth). An egg always takes at least two. */
export const warmBonus = (a: Pick<RoostState, 'owned'>) => ROOST.filter(r => r.does === 'warm' && has(a, r.id)).length;
export const MIN_HATCH = 2;
export const hatchNeed = (a: Pick<RoostState, 'owned'>, egg: string) => Math.max(MIN_HATCH, roundsOf(egg) - warmBonus(a));
export const isReady = (a: Pick<RoostState, 'owned'>, w: Warming) => w.warmth >= hatchNeed(a, w.egg);
/** How many dragons the roost shows at once: 4, and one more for each perch (the iPad 9 draws at most 10). Every dragon he owns is in
 *  Visit the roost; this is only how many the mountain draws. */
export const MOST_DRAWN = 10;
export const drawnDragons = (a: Pick<RoostState, 'owned' | 'more'>) => Math.min(MOST_DRAWN, 4 + ROOST.filter(r => r.does === 'perch' && has(a, r.id)).length + a.more.ledge);
/** Trick buttons in the Flight: 2, or what his trick belt gives. */
export const trickSlots = (a: Pick<RoostState, 'owned'>) => Math.max(2, ...GEAR.filter(g => g.slot === 'belt' && has(a, g.id)).map(g => g.slots ?? 2));
export const dragonOf = (a: Pick<RoostState, 'dragons'>, id: number) => a.dragons.find(d => d.id === id);
export const riding = (a: Pick<RoostState, 'dragons' | 'riding'>) => dragonOf(a, a.riding) ?? a.dragons[0]!;
export const lookOf = (d: Dragon): DragonLook => lookOfEgg(d.egg);
export const unnamed = (a: Pick<RoostState, 'dragons'>) => a.dragons.find(d => !d.name) ?? null;
export const wornItem = (a: Pick<RoostState, 'worn'>, slot: GearSlot | 'breath-colour' | 'trail') => (a.worn[slot] ? itemOf(a.worn[slot]!) : null);

// ---------- buying ----------

export type Want = { kind: 'item'; id: string } | { kind: 'more'; id: RepeatId };
export const wantKey = (w: Want) => (w.kind === 'item' ? w.id : `more:${w.id}`);
export const wantOf = (key: string): Want => (key.startsWith('more:') ? { kind: 'more', id: key.slice(5) as RepeatId } : { kind: 'item', id: key });
export const allNamedEggs = (a: Pick<RoostState, 'owned'>) => EGGS.every(e => has(a, e.id));
const isEgg = (w: Want) => (w.kind === 'item' && itemOf(w.id).cat === 'egg') || (w.kind === 'more' && w.id === 'wild');
/** Why he can't buy it yet, if he can't: a nest it needs first, a full set of nests, or the named eggs before the wild ones. */
export function missingNeed(a: RoostState, w: Want): 'nest-full' | 'named-first' | string | null {
  if (w.kind === 'item') { const it = itemOf(w.id); if ('needs' in it && it.needs && !has(a, it.needs)) return it.needs; }
  if (w.kind === 'more' && w.id === 'wild' && !allNamedEggs(a)) return 'named-first';
  if (isEgg(w) && a.eggs.length >= nestCount(a)) return 'nest-full';
  return null;
}
export const priceOf = (a: Pick<RoostState, 'more'>, w: Want) => (w.kind === 'item' ? itemOf(w.id).price : repeatPrice(w.id, a.more[w.id]));
export const isNew = (a: Pick<RoostState, 'owned'>, w: Want) => w.kind === 'more' || !has(a, w.id);
export function buyable(a: RoostState, w: Want): boolean {
  if (!isNew(a, w) || missingNeed(a, w)) return false;
  return w.kind === 'more' || itemOf(w.id).price > 0;
}
export const shopNow = (a: RoostState): Want[] =>
  FOR_SALE.filter(i => buyable(a, { kind: 'item', id: i.id })).sort((x, y) => x.price - y.price).map(i => ({ kind: 'item', id: i.id }));
export const repeatsNow = (a: RoostState): Want[] =>
  REPEAT_IDS.map(id => ({ kind: 'more', id }) as Want).filter(w => buyable(a, w)).sort((x, y) => priceOf(a, x) - priceOf(a, y));
export const catalogueDone = (a: Pick<RoostState, 'owned'>) => FOR_SALE.every(i => has(a, i.id));

/** His Goal: what he tapped and couldn't afford, else the cheapest new thing, else the cheapest again-and-again thing. */
export function goalOf(a: RoostState): Want | null {
  if (a.goal) { const w = wantOf(a.goal); if (isNew(a, w) && !(w.kind === 'item' && missingNeed(a, w) && missingNeed(a, w) !== 'nest-full')) return w; }
  return shopNow(a)[0] ?? repeatsNow(a)[0] ?? null;
}
export const selectGoal = (a: RoostState, w: Want): RoostState => ({ ...a, goal: wantKey(w) });

export type PurchaseFailure = 'invalid-item' | 'invalid-balance' | 'insufficient-funds' | 'already-owned' | 'not-yet';
export function proposePurchase(a: RoostState, w: Want, balance: number): PurchaseProposal<RoostState, PurchaseFailure> {
  if (!isAmount(balance)) return { kind: 'rejected', reason: 'invalid-balance' };
  if (w.kind === 'item' ? !isItemId(w.id) || itemOf(w.id).price <= 0 : !REPEAT_IDS.includes(w.id)) return { kind: 'rejected', reason: 'invalid-item' };
  if (!isNew(a, w)) return { kind: 'rejected', reason: 'already-owned' };
  if (!buyable(a, w)) return { kind: 'rejected', reason: 'not-yet' };
  const cost = priceOf(a, w);
  if (balance < cost) return { kind: 'rejected', reason: 'insufficient-funds' };
  return { kind: 'ready', cost, state: bought(a, w) };
}
/** An egg goes into a nest to warm; a trick goes on a free button; gear and colours go on his dragon. */
export function bought(a: RoostState, w: Want): RoostState {
  const goal = a.goal === wantKey(w) ? null : a.goal;
  if (w.kind === 'more') {
    const k = a.more[w.id] + 1, next: RoostState = { ...a, more: { ...a.more, [w.id]: k }, goal };
    return w.id === 'wild' ? { ...next, eggs: [...a.eggs, { egg: `wild:${k}`, warmth: 0 }] } : next;
  }
  const item = itemOf(w.id);
  let next: RoostState = { ...a, owned: [...a.owned, w.id], goal };
  if (item.cat === 'egg') next = { ...next, eggs: [...next.eggs, { egg: item.id, warmth: 0 }] };
  if (item.cat === 'trick' && next.tricksOn.length < trickSlots(next)) next = { ...next, tricksOn: [...next.tricksOn, item.id] };
  if (item.cat === 'gear' || item.cat === 'colour') next = wear(next, item.id) ?? next;
  return next;
}
/** Put gear or a colour he owns on his dragon (the one it replaces goes back to the shelf). Tapping what it already wears takes it off. */
export function wear(a: RoostState, id: string): RoostState | null {
  if (!has(a, id)) return null;
  const item = itemOf(id);
  const slot = item.cat === 'gear' ? item.slot : item.cat === 'colour' ? (item.part === 'breath' ? 'breath-colour' : 'trail') : null;
  if (!slot) return null;
  const worn = { ...a.worn };
  if (worn[slot] === id && item.cat === 'gear' && slot !== 'belt') delete worn[slot]; else worn[slot] = id;
  return { ...a, worn };
}
/** Put a trick on a button, or take it off (Flap stays if it is the only one). */
export function toggleTrick(a: RoostState, id: string): RoostState | null {
  if (!has(a, id) || itemOf(id).cat !== 'trick') return null;
  if (a.tricksOn.includes(id)) return a.tricksOn.length > 1 ? { ...a, tricksOn: a.tricksOn.filter(t => t !== id) } : null;
  const on = [...a.tricksOn, id];
  return { ...a, tricksOn: on.length > trickSlots(a) ? on.slice(1) : on };
}
export const ride = (a: RoostState, id: number): RoostState | null => (dragonOf(a, id) && dragonOf(a, id)!.name ? { ...a, riding: id } : null);

// ---------- eggs and hatching ----------

/** A Round finished: one more Flight, and every egg in a nest is one Round warmer. */
export const earnFlight = (a: RoostState): RoostState => ({ ...a, flights: a.flights + 1, eggs: a.eggs.map(e => ({ ...e, warmth: e.warmth + 1 })) });
/** He tapped a warm egg: it hatches into a dragon waiting for its name. */
export function hatch(a: RoostState, index: number): { state: RoostState; dragon: Dragon } | null {
  const w = a.eggs[index];
  if (!w || !isReady(a, w)) return null;
  const id = Math.max(0, ...a.dragons.map(d => d.id)) + 1, dragon: Dragon = { id, egg: w.egg, name: null, flights: 0 };
  return { state: { ...a, eggs: a.eggs.filter((_, i) => i !== index), dragons: [...a.dragons, dragon], totals: { ...a.totals, hatched: a.totals.hatched + 1 } }, dragon };
}
/** He named a dragon. A dragon he has just named is the one he rides next. */
export function name(a: RoostState, id: number, words: readonly [string, string]): RoostState | null {
  const d = dragonOf(a, id);
  if (!d || !NAME_ADJECTIVES.includes(words[0] as never) || !NAME_NOUNS.includes(words[1] as never)) return null;
  return { ...a, dragons: a.dragons.map(x => (x.id === id ? { ...x, name: [words[0], words[1]] } : x)), riding: id };
}

// ---------- ranks ----------

/** Ranks by Flights flown. After Dragon Master, a Dragon Legend every 40 Flights, numbered, without end. */
export const RANKS = [
  { name: 'Egg Sitter', at: 0 }, { name: 'Hatchling Helper', at: 3 }, { name: 'Wing Rider', at: 8 }, { name: 'Sky Rider', at: 15 }, { name: 'Cloud Rider', at: 25 },
  { name: 'Beacon Keeper', at: 40 }, { name: 'Flame Rider', at: 60 }, { name: 'Storm Rider', at: 85 }, { name: 'Roost Keeper', at: 120 }, { name: 'Dragon Master', at: 160 },
  { name: 'Dragon Legend', at: 200 },
] as const;
export type RankName = (typeof RANKS)[number]['name'];
export const LEGEND_EVERY = 40;
export function rankOf(flown: number): { index: number; name: RankName; number: number; next: number } {
  const top = RANKS[RANKS.length - 1]!.at;
  if (flown < top) {
    const i = RANKS.findLastIndex(r => flown >= r.at);
    return { index: i, name: RANKS[i]!.name, number: 0, next: RANKS[i + 1]!.at };
  }
  const k = Math.floor((flown - top) / LEGEND_EVERY);
  return { index: RANKS.length - 1 + k, name: 'Dragon Legend', number: k + 1, next: top + (k + 1) * LEGEND_EVERY };
}

// ---------- trophies ----------

export interface Trophy { readonly id: string; readonly name: string; readonly icon: string; readonly done: (a: RoostState) => boolean }
const t = (id: string, name: string, icon: string, done: (a: RoostState) => boolean): Trophy => ({ id, name, icon, done });
export const TROPHIES: readonly Trophy[] = [
  t('first-flight', 'First Flight', '🛫', a => a.flown >= 1), t('first-egg', 'First Egg', '🥚', a => a.totals.hatched >= 1),
  t('beacons-10', 'Ten Beacons', '🔥', a => a.totals.lit >= 10), t('beacons-100', 'Hundred Beacons', '🔥', a => a.totals.lit >= 100),
  t('beacons-500', 'Beacon Star', '🌟', a => a.totals.lit >= 500), t('beacons-1000', 'Beacon King', '👑', a => a.totals.lit >= 1000),
  t('clouds-25', 'Cloud Popper', '☁️', a => a.totals.popped >= 25), t('clouds-250', 'Cloud Buster', '🌥️', a => a.totals.popped >= 250),
  t('clouds-1000', 'Sky Sweeper', '🌤️', a => a.totals.popped >= 1000), t('bird-1', 'Bird Racer', '🐦', a => a.totals.birds >= 1),
  t('bird-10', 'Fast Wings', '🦅', a => a.totals.birds >= 10), t('bird-50', 'Fastest Dragon', '🏆', a => a.totals.birds >= 50),
  t('dragons-3', 'Three Dragons', '🐉', a => a.dragons.length >= 3), t('dragons-10', 'Ten Dragons', '🐲', a => a.dragons.length >= 10),
  t('dragons-25', 'Dragon Family', '🏔️', a => a.dragons.length >= 25), t('dragons-41', 'Every Egg', '🥇', a => a.dragons.length >= 41),
  t('great', 'Great Dragon', '💪', a => a.dragons.some(d => stageOf(d.flights) === 2)), t('mark', 'First Mark', '⭐', a => a.dragons.some(d => marksOf(d.flights) >= 1)),
  t('places', 'Every Place', '🗺️', a => a.reached >= FIXED_FLIGHTS), t('flights-100', 'Hundred Flights', '💯', a => a.flown >= 100),
];
export const trophiesWon = (a: RoostState) => TROPHIES.filter(x => x.done(a));

// ---------- a Flight ----------

export interface FlightPlan {
  readonly c: Course;
  readonly dragon: Dragon;
  readonly look: DragonLook;
  readonly fly: FlyWith;
  /** It's the next new Flight (not one he's flying again). */
  readonly fresh: boolean;
  readonly best: number | null;
  readonly breathColour: ColourItem | null;
  readonly trail: ColourItem | null;
  readonly saddle: string | null;
  readonly hat: string | null;
  readonly lookout: boolean;
  readonly lanterns: boolean;
  readonly tricks: readonly TrickItem[];
}
/** The next Flight is the next new one; `n` flies one he has flown before again. */
export function planFlight(a: RoostState, n?: number): FlightPlan {
  const target = n && n >= 1 && n <= a.reached ? n : a.reached + 1;
  const d = riding(a), look = lookOf(d);
  const gear = (slot: GearSlot) => wornItem(a, slot) as GearItem | null;
  const saddle = gear('saddle'), magnet = gear('magnet'), breath = gear('breath');
  const tricks = a.tricksOn.map(id => itemOf(id) as TrickItem).slice(0, trickSlots(a));
  const c0 = course(target), calm = has(a, 'roost:vane');
  return {
    c: calm && c0.weather === 'wind' ? { ...c0, weather: 'clear' } : c0, dragon: d, look,
    fly: {
      breath: look.breath, climb: saddle?.climb ?? 1, speed: saddle?.speed ?? 1, grab: magnet?.grab ?? 0, reach: breath?.reach ?? 0,
      tricks: tricks.map(x => ({ effect: x.effect, power: x.power })),
    },
    fresh: target > a.reached, best: a.bests[target] ?? null,
    breathColour: wornItem(a, 'breath-colour') as ColourItem | null, trail: wornItem(a, 'trail') as ColourItem | null,
    saddle: saddle?.colour ?? null, hat: (gear('hat')?.icon) ?? null, lookout: has(a, 'roost:lookout'), lanterns: has(a, 'roost:lanterns'), tricks,
  };
}

/** A Flight pays the Flames he caught on the way (three at most), one more for lighting every beacon of a new Flight, and one for a new
 *  best on one he flies again: at most 4. A Round pays at most 6, so a Round and its Flight pay at most 10. */
export const ALL_LIT_FLAMES = 1, BEST_FLAMES = 1;
export const MOST_FLIGHT_FLAMES = 3 + Math.max(ALL_LIT_FLAMES, BEST_FLAMES);

export interface FlightPay {
  readonly flames: number;
  readonly result: FlightResult;
  readonly allLit: boolean;
  readonly newBest: boolean;
  readonly newPlace: boolean;
  readonly stage: 0 | 1 | 2 | null;
  readonly mark: number | null;
  readonly rank: ReturnType<typeof rankOf> | null;
  readonly trophies: readonly Trophy[];
}
export function payFor(a: RoostState, plan: FlightPlan, res: FlightResult): FlightPay {
  const allLit = res.lit === res.beacons, prior = a.bests[plan.c.n];
  const newBest = prior !== undefined && res.lights > prior;
  const flames = res.flames + (plan.fresh && allLit ? ALL_LIT_FLAMES : 0) + (newBest ? BEST_FLAMES : 0);
  const d = riding(a), before = d.flights, after = before + 1;
  const after_ = finishFlight(a, plan, res);
  const won = TROPHIES.filter(x => !x.done(a) && x.done(after_));
  return {
    flames, result: res, allLit, newBest, newPlace: plan.fresh,
    stage: stageOf(after) > stageOf(before) ? stageOf(after) : null, mark: marksOf(after) > marksOf(before) ? marksOf(after) : null,
    rank: rankOf(a.flown + 1).index > rankOf(a.flown).index ? rankOf(a.flown + 1) : null, trophies: won,
  };
}
/** The Flight ended: it's used, the dragon has flown one more, the best and the totals are kept. */
export function finishFlight(a: RoostState, plan: FlightPlan, res: FlightResult): RoostState {
  return {
    ...a, flights: Math.max(0, a.flights - 1), flown: a.flown + 1, reached: Math.max(a.reached, plan.c.n),
    dragons: a.dragons.map(d => (d.id === plan.dragon.id ? { ...d, flights: d.flights + 1 } : d)),
    bests: { ...a.bests, [plan.c.n]: Math.max(a.bests[plan.c.n] ?? 0, res.lights) },
    totals: { ...a.totals, lit: a.totals.lit + res.lit, popped: a.totals.popped + res.popped, birds: a.totals.birds + res.birds, flames: a.totals.flames + res.flames },
  };
}
export const resultFrom = (s: Sim) => resultOf(s);

// ---------- counting ----------

/** The fixed catalogue: things to buy, the 24 places, the trophies and the ranks. Wild eggs, new ledges, generated Flights, a dragon's
 *  marks and the numbered Dragon Legends are on top of it, without end. */
export const CATALOGUE = { forSale: FOR_SALE.length, places: FIXED_FLIGHTS, trophies: TROPHIES.length, ranks: RANKS.length };
export const CATALOGUE_SIZE = CATALOGUE.forSale + CATALOGUE.places + CATALOGUE.trophies + CATALOGUE.ranks;
export type { Item, GearSlot };
export { GEAR_SLOTS, TRICKS, COLOURS, wildNumber, repeatOf };
