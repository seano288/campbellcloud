// The Station on the saved game. A Round earns Bolts and one Call. Bolts buy vehicles, parts, gadgets and things for the Station and
// the Town. A Call he hasn't answered before opens the next one, adds its badge to the Station wall and puts its building in the Town
// with a thank-you sign. The first Call is free, so he sees the reward before his first purchase. A Call is used up only when it's
// finished: leaving halfway costs nothing (and pays nothing), as in Rover Code's trips.
//
// Going back: tapping a building in the Town makes it a Star Call, hotter than last time (call/scenes.ts heated()), and finishing it
// earns its next star, up to three. Once he has answered the first sixteen, the Mystery Call opens: an endless ladder of Calls made
// up from its Level, with a prize every fifth Level. When there are no new Calls left, Call goes to the Mystery Call.
import { isAmount } from '../../currency/amount';
import type { PurchaseProposal } from '../../rewards/purchase';
import type { Gear } from '../call/sim';
import { heated, isSceneId, MAX_HEAT, MYSTERY_ID, mysteryCall, SCENES, type SceneDef } from '../call/scenes';
import type { TruckLook } from '../art/truck';
import {
  FITTED, FOR_SALE, GADGETS, idOf, infoOf, isItemKey, isPrize, keyOf, PRIZE_EVERY, PRIZES, STARTERS, tabOf,
  type BuddyId, type GadgetId, type ItemKey, type LightsId, type NozzleId, type PaintId, type SirenId, type Tab, type TruckId,
} from './parts';

/** The places on his vehicle that hold one thing each (Trucks and Aircraft share the vehicle's place). */
export type FitTab = 'truck' | 'engine' | 'pump' | 'hose' | 'ladder' | 'tank' | 'nozzle' | 'siren' | 'lights' | 'paint' | 'buddy';
export type Fitted = Record<FitTab, string>;

export interface NextCall { id: string; heat: number }
export interface StationState {
  owned: ItemKey[];
  /** What's on his vehicle: one item from each fitted place. */
  fitted: Fitted;
  /** The Gadgets switched on. */
  gadgets: GadgetId[];
  /** What he's saving for, once he has tapped something he can't afford yet. */
  goal: ItemKey | null;
  /** Calls earned and not answered yet. */
  calls: number;
  /** Every Call he has finished, in the order he first answered them: his badges and his Town. */
  answered: string[];
  /** Stars won on each Call by going back to it (0 to 3). */
  stars: Record<string, number>;
  /** Mystery Call Levels finished. */
  mystery: number;
  /** Calls finished in all, counting repeats. */
  trips: number;
  /** A Call he picked in the Town to go to: a Star Call, or the Mystery Call. */
  next: NextCall | null;
}

/** Bolts the Town pays for a finished Call, a new star on top, and a Mystery Call (a default for the parent to confirm). */
export const CALL_BOLTS = 3;
export const STAR_BOLTS = 2;
export const MYSTERY_BOLTS = 4;
/** Calls answered before the Mystery Call opens: the first two streets. */
export const MYSTERY_OPENS = 16;

const STARTER_FIT: Fitted = { truck: 'pumper', engine: 'r0', pump: 'r0', hose: 'r0', ladder: 'r0', tank: 'r0', nozzle: 'straight', siren: 'wail', lights: 'red', paint: 'red', buddy: 'dalmatian' };
export const freshStation = (): StationState => ({ owned: [...STARTERS], fitted: { ...STARTER_FIT }, gadgets: [], goal: null, calls: 1, answered: [], stars: {}, mystery: 0, trips: 0, next: null });
export const isOwned = (s: Pick<StationState, 'owned'>, k: ItemKey) => s.owned.includes(k);
/** The place a tab's items go on the vehicle. */
export const slotOf = (t: Tab): FitTab | null => (t === 'air' ? 'truck' : FITTED.includes(t) ? (t as FitTab) : null);
const vehicleKey = (id: string): ItemKey => (isItemKey(keyOf('truck', id)) ? keyOf('truck', id) : keyOf('air', id));

type Raw = Record<string, unknown>;
const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);
/** Things that moved tab: the Fire Helicopter went to Aircraft. */
const MOVED: Record<string, ItemKey> = { 'truck:heli': 'air:heli' };
const GADGET_IDS = new Set<string>(GADGETS.map(g => g.id));

/** Whatever is missing or doesn't read comes back fresh; nothing fitted or switched on that he doesn't own. */
export function readStation(raw: unknown): StationState {
  if (!isRecord(raw)) return freshStation();
  const saved = Array.isArray(raw.owned) ? raw.owned.map(k => (typeof k === 'string' && k in MOVED ? MOVED[k] : k)).filter(isItemKey) : [];
  const owned = [...new Set([...STARTERS, ...saved])];
  const f = isRecord(raw.fitted) ? raw.fitted : {};
  const fitted = Object.fromEntries((Object.keys(STARTER_FIT) as FitTab[]).map(t => {
    const id = f[t];
    const ok = typeof id === 'string' && owned.includes(t === 'truck' ? vehicleKey(id) : keyOf(t, id));
    return [t, ok ? id : STARTER_FIT[t]];
  })) as Fitted;
  const gadgets = Array.isArray(raw.gadgets) ? [...new Set(raw.gadgets.filter((g): g is GadgetId => typeof g === 'string' && GADGET_IDS.has(g) && owned.includes(keyOf('gadget', g))))] : [];
  const answered = Array.isArray(raw.answered) ? [...new Set(raw.answered.filter(isSceneId))] : [];
  const st = isRecord(raw.stars) ? raw.stars : {};
  const stars = Object.fromEntries(answered.flatMap(id => { const n = st[id]; return typeof n === 'number' && Number.isInteger(n) && n > 0 ? [[id, Math.min(MAX_HEAT, n)]] : []; }));
  const mystery = isAmount(raw.mystery) ? raw.mystery : 0;
  // an old save's next Call was a scene's id: going back there as it first was
  const n = raw.next, nextId = typeof n === 'string' ? n : isRecord(n) && typeof n.id === 'string' ? n.id : null;
  const nextHeat = isRecord(n) && typeof n.heat === 'number' && Number.isInteger(n.heat) ? Math.max(0, Math.min(MAX_HEAT, n.heat)) : 0;
  const next = nextId === MYSTERY_ID && answered.length >= MYSTERY_OPENS ? { id: MYSTERY_ID, heat: 0 }
    : nextId && isSceneId(nextId) && answered.includes(nextId) ? { id: nextId, heat: nextHeat } : null;
  const goal = typeof raw.goal === 'string' && raw.goal in MOVED ? MOVED[raw.goal] : raw.goal;
  return {
    owned, fitted, gadgets, goal: isItemKey(goal) && !owned.includes(goal) && !isPrize(goal) ? goal : null,
    calls: isAmount(raw.calls) ? raw.calls : 0, answered, stars, mystery, trips: isAmount(raw.trips) ? raw.trips : 0, next,
  };
}

// ---------- buying ----------

export const priceOf = (k: ItemKey) => infoOf(k).price;
/** Puts an owned item on his vehicle, or switches a Gadget on or off (things for the Station and the Town just stay owned). */
export function fit(s: StationState, k: ItemKey): StationState {
  const t = tabOf(k), slot = slotOf(t);
  if (!isOwned(s, k)) return s;
  if (t === 'gadget') { const g = idOf(k) as GadgetId; return { ...s, gadgets: s.gadgets.includes(g) ? s.gadgets.filter(x => x !== g) : [...s.gadgets, g] }; }
  if (!slot) return s;
  return { ...s, fitted: { ...s.fitted, [slot]: idOf(k) } };
}
export const isFitted = (s: Pick<StationState, 'fitted' | 'gadgets'>, k: ItemKey) => {
  const t = tabOf(k), slot = slotOf(t);
  if (t === 'gadget') return s.gadgets.includes(idOf(k) as GadgetId);
  return !!slot && s.fitted[slot] === idOf(k);
};

/** A part that makes the Call easier: a Rung or a vehicle. */
const helps = (k: ItemKey) => ['pump', 'ladder', 'tank', 'hose', 'truck', 'air'].includes(tabOf(k));
/** The one he chose while it's locked, else the cheapest part that helps at the Call, else the cheapest thing left. */
export function goalOf(s: Pick<StationState, 'owned' | 'goal'>): ItemKey | null {
  if (s.goal && !isOwned(s, s.goal)) return s.goal;
  const left = FOR_SALE.filter(k => !isOwned(s, k)).sort((a, b) => priceOf(a) - priceOf(b));
  return left.find(helps) ?? left[0] ?? null;
}
export function selectGoal(s: StationState, k: ItemKey): StationState {
  if (isOwned(s, k)) throw new Error('A Goal is something he has not got');
  if (isPrize(k)) return s;
  return { ...s, goal: k };
}

export type PurchaseFailure = 'invalid-item' | 'invalid-balance' | 'insufficient-funds' | 'already-owned' | 'prize';
/** Buying something fits it (or switches it on) straight away. */
export function proposePurchase(s: StationState, k: ItemKey, balance: number): PurchaseProposal<StationState, PurchaseFailure> {
  if (!isAmount(balance)) return { kind: 'rejected', reason: 'invalid-balance' };
  if (!isItemKey(k)) return { kind: 'rejected', reason: 'invalid-item' };
  if (isOwned(s, k)) return { kind: 'rejected', reason: 'already-owned' };
  if (isPrize(k)) return { kind: 'rejected', reason: 'prize' };
  const cost = priceOf(k);
  if (balance < cost) return { kind: 'rejected', reason: 'insufficient-funds' };
  const bought = { ...s, owned: [...s.owned, k], goal: s.goal === k ? null : s.goal };
  return { kind: 'ready', cost, state: fit(bought, k) };
}
/** Everything there is to buy is his (prizes are won, not bought). */
export const allOwned = (s: Pick<StationState, 'owned'>) => FOR_SALE.every(k => isOwned(s, k));

// ---------- the vehicle ----------

const rung = (id: string) => Number(id.slice(1)) || 0;
type Fits = Pick<StationState, 'fitted' | 'gadgets'>;
/** His vehicle as it is, or with `trial` on it (a Gadget he's trying is switched on). */
function trying(s: Fits, trial?: ItemKey | null): Fits {
  if (!trial) return s;
  const t = tabOf(trial), slot = slotOf(t);
  if (t === 'gadget') { const g = idOf(trial) as GadgetId; return s.gadgets.includes(g) ? s : { ...s, gadgets: [...s.gadgets, g] }; }
  return slot ? { ...s, fitted: { ...s.fitted, [slot]: idOf(trial) } } : s;
}
export function gearOf(s: Fits, trial?: ItemKey | null): Gear {
  const { fitted: f, gadgets } = trying(s, trial);
  return { truck: f.truck as TruckId, engine: rung(f.engine), pump: rung(f.pump), hose: rung(f.hose), ladder: rung(f.ladder), tank: rung(f.tank), nozzle: f.nozzle as NozzleId, gadgets: [...gadgets] };
}
export function lookOf(s: Fits, trial?: ItemKey | null): TruckLook {
  const t = trying(s, trial), f = t.fitted, g = gearOf(t);
  return { truck: g.truck, paint: f.paint as PaintId, lights: f.lights as LightsId, buddy: f.buddy as BuddyId, nozzle: g.nozzle, ladder: g.ladder, tank: g.tank, hose: g.hose, pump: g.pump, engine: g.engine, gadgets: g.gadgets };
}
export const sirenOf = (s: Pick<StationState, 'fitted'>) => s.fitted.siren as SirenId;

// ---------- Calls ----------

/** A Round finished: one more Call. */
export const earnCall = (s: StationState): StationState => ({ ...s, calls: s.calls + 1 });
export const isAnswered = (s: Pick<StationState, 'answered'>, id: string) => s.answered.includes(id);
export const mysteryOpen = (s: Pick<StationState, 'answered'>) => s.answered.length >= MYSTERY_OPENS;
export const starsOf = (s: Pick<StationState, 'stars'>, id: string) => s.stars[id] ?? 0;
/** The next Call he hasn't answered; null once he's answered them all. */
export const newCall = (s: Pick<StationState, 'answered'>): SceneDef | null => SCENES.find(x => !isAnswered(s, x.id)) ?? null;
/** Where the next Call is: the one he picked in the Town, else a new one, else the Mystery Call. */
export function callOf(s: Pick<StationState, 'answered' | 'next' | 'trips' | 'mystery'>): SceneDef {
  if (s.next?.id === MYSTERY_ID) return mysteryCall(s.mystery + 1);
  if (s.next) return heated(SCENES.find(x => x.id === s.next!.id) ?? SCENES[0], s.next.heat);
  return newCall(s) ?? mysteryCall(s.mystery + 1);
}
/** He taps a building in the Town: it's his next Call, one star hotter than he has won there (or as hot as it gets). */
export function pickCall(s: StationState, id: string): StationState | null {
  if (id === MYSTERY_ID) return mysteryOpen(s) ? { ...s, next: { id, heat: 0 } } : null;
  return isAnswered(s, id) ? { ...s, next: { id, heat: Math.min(MAX_HEAT, starsOf(s, id) + 1) } } : null;
}

export interface CallPay {
  bolts: number;
  firstTime: boolean;
  /** A Star Call that won a new star: how many he has there now. */
  star?: number;
  /** A Mystery Call: the Level he just finished, and the prize it won. */
  level?: number;
  prize?: ItemKey;
}
/** The Call is finished: it's used, the Town pays, a new one adds its badge and building, a Star Call its star, a Mystery Call its
 *  Level (and every fifth Level a prize, fitted on at once). */
export function finishCall(s: StationState, scene: Pick<SceneDef, 'id' | 'heat'>): { state: StationState; pay: CallPay } {
  const used = { ...s, calls: Math.max(0, s.calls - 1), trips: s.trips + 1, next: null };
  if (scene.id === MYSTERY_ID) {
    const level = s.mystery + 1, won = level % PRIZE_EVERY === 0 ? PRIZES[level / PRIZE_EVERY - 1] : undefined;
    const prize = won && !isOwned(s, won) ? won : undefined;
    const state = { ...used, mystery: level, ...(prize ? { owned: [...s.owned, prize] } : {}) };
    return { state: prize ? fit(state, prize) : state, pay: { bolts: MYSTERY_BOLTS, firstTime: false, level, ...(prize ? { prize } : {}) } };
  }
  const firstTime = !isAnswered(s, scene.id), heat = scene.heat ?? 0, had = starsOf(s, scene.id), star = !firstTime && heat > had ? heat : undefined;
  return {
    state: { ...used, answered: firstTime ? [...s.answered, scene.id] : s.answered, stars: star ? { ...s.stars, [scene.id]: star } : s.stars },
    pay: { bolts: CALL_BOLTS + (star ? STAR_BOLTS : 0), firstTime, ...(star ? { star } : {}) },
  };
}
