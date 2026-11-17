// The Station on the saved game. A Round earns Bolts and one Call. Bolts buy trucks, parts and things for the Station and the Town.
// A Call he hasn't answered before opens the next one, adds its badge to the Station wall and puts its building in the Town with a
// thank-you sign. The first Call is free, so he sees the reward before his first purchase. A Call is used up only when it's
// finished: leaving halfway costs nothing (and pays nothing), as in Rover Code's trips.
import { isAmount } from '../../currency/amount';
import type { PurchaseProposal } from '../../rewards/purchase';
import type { Gear } from '../call/sim';
import { isSceneId, SCENES, type SceneDef } from '../call/scenes';
import type { TruckLook } from '../art/truck';
import { ALL_KEYS, FITTED, idOf, infoOf, isItemKey, keyOf, STARTERS, tabOf, type BuddyId, type ItemKey, type LightsId, type NozzleId, type PaintId, type SirenId, type Tab, type TruckId } from './parts';

export type FitTab = 'truck' | 'pump' | 'hose' | 'ladder' | 'tank' | 'nozzle' | 'siren' | 'lights' | 'paint' | 'buddy';
export type Fitted = Record<FitTab, string>;

export interface StationState {
  owned: ItemKey[];
  /** What's on his truck: one item from each fitted tab. */
  fitted: Fitted;
  /** What he's saving for, once he has tapped something he can't afford yet. */
  goal: ItemKey | null;
  /** Calls earned and not answered yet. */
  calls: number;
  /** Every Call he has finished, in the order he first answered them: his badges and his Town. */
  answered: string[];
  /** Calls finished in all, counting repeats. */
  trips: number;
  /** A Call he picked in the Town to go to again. */
  next: string | null;
}

/** Bolts the Town pays for a finished Call (a default for the parent to confirm). */
export const CALL_BOLTS = 3;

const STARTER_FIT: Fitted = { truck: 'pumper', pump: 'r0', hose: 'r0', ladder: 'r0', tank: 'r0', nozzle: 'straight', siren: 'wail', lights: 'red', paint: 'red', buddy: 'dalmatian' };
export const freshStation = (): StationState => ({ owned: [...STARTERS], fitted: { ...STARTER_FIT }, goal: null, calls: 1, answered: [], trips: 0, next: null });
export const isOwned = (s: Pick<StationState, 'owned'>, k: ItemKey) => s.owned.includes(k);

type Raw = Record<string, unknown>;
const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);

/** Whatever is missing or doesn't read comes back fresh; nothing fitted that he doesn't own. */
export function readStation(raw: unknown): StationState {
  if (!isRecord(raw)) return freshStation();
  const owned = [...new Set([...STARTERS, ...(Array.isArray(raw.owned) ? raw.owned.filter(isItemKey) : [])])];
  const f = isRecord(raw.fitted) ? raw.fitted : {};
  const fitted = Object.fromEntries((Object.keys(STARTER_FIT) as FitTab[]).map(t => {
    const id = f[t];
    return [t, typeof id === 'string' && owned.includes(keyOf(t, id)) ? id : STARTER_FIT[t]];
  })) as Fitted;
  const answered = Array.isArray(raw.answered) ? [...new Set(raw.answered.filter(isSceneId))] : [];
  return {
    owned, fitted, goal: isItemKey(raw.goal) && !owned.includes(raw.goal) ? raw.goal : null,
    calls: isAmount(raw.calls) ? raw.calls : 0, answered, trips: isAmount(raw.trips) ? raw.trips : 0,
    next: isSceneId(raw.next) && answered.includes(raw.next) ? raw.next : null,
  };
}

// ---------- buying ----------

export const priceOf = (k: ItemKey) => infoOf(k).price;
const isFitTab = (t: Tab): t is FitTab => FITTED.includes(t);
/** Puts an owned item on his truck (things for the Station and the Town just stay owned). */
export function fit(s: StationState, k: ItemKey): StationState {
  const t = tabOf(k);
  if (!isOwned(s, k) || !isFitTab(t)) return s;
  return { ...s, fitted: { ...s.fitted, [t]: idOf(k) } };
}
export const isFitted = (s: Pick<StationState, 'fitted'>, k: ItemKey) => { const t = tabOf(k); return isFitTab(t) && s.fitted[t] === idOf(k); };

/** A part that makes the Call easier: a Rung, a truck or a nozzle that does something. */
const helps = (k: ItemKey) => ['pump', 'ladder', 'tank', 'hose', 'truck'].includes(tabOf(k));
/** The one he chose while it's locked, else the cheapest part that helps at the Call, else the cheapest thing left. */
export function goalOf(s: Pick<StationState, 'owned' | 'goal'>): ItemKey | null {
  if (s.goal && !isOwned(s, s.goal)) return s.goal;
  const left = ALL_KEYS.filter(k => !isOwned(s, k)).sort((a, b) => priceOf(a) - priceOf(b));
  return left.find(helps) ?? left[0] ?? null;
}
export function selectGoal(s: StationState, k: ItemKey): StationState {
  if (isOwned(s, k)) throw new Error('A Goal is something he has not got');
  return { ...s, goal: k };
}

export type PurchaseFailure = 'invalid-item' | 'invalid-balance' | 'insufficient-funds' | 'already-owned';
/** Buying something fits it straight away. */
export function proposePurchase(s: StationState, k: ItemKey, balance: number): PurchaseProposal<StationState, PurchaseFailure> {
  if (!isAmount(balance)) return { kind: 'rejected', reason: 'invalid-balance' };
  if (!isItemKey(k)) return { kind: 'rejected', reason: 'invalid-item' };
  if (isOwned(s, k)) return { kind: 'rejected', reason: 'already-owned' };
  const cost = priceOf(k);
  if (balance < cost) return { kind: 'rejected', reason: 'insufficient-funds' };
  const bought = { ...s, owned: [...s.owned, k], goal: s.goal === k ? null : s.goal };
  return { kind: 'ready', cost, state: fit(bought, k) };
}
export const allOwned = (s: Pick<StationState, 'owned'>) => ALL_KEYS.every(k => isOwned(s, k));

// ---------- the truck ----------

const rung = (id: string) => Number(id.slice(1)) || 0;
export function gearOf(s: Pick<StationState, 'fitted'>, trial?: ItemKey | null): Gear {
  const f = trial && isFitTab(tabOf(trial)) ? { ...s.fitted, [tabOf(trial)]: idOf(trial) } : s.fitted;
  return { truck: f.truck as TruckId, pump: rung(f.pump), hose: rung(f.hose), ladder: rung(f.ladder), tank: rung(f.tank), nozzle: f.nozzle as NozzleId };
}
export function lookOf(s: Pick<StationState, 'fitted'>, trial?: ItemKey | null): TruckLook {
  const f = trial && isFitTab(tabOf(trial)) ? { ...s.fitted, [tabOf(trial)]: idOf(trial) } : s.fitted, g = gearOf({ fitted: f });
  return { truck: g.truck, paint: f.paint as PaintId, lights: f.lights as LightsId, buddy: f.buddy as BuddyId, nozzle: g.nozzle, ladder: g.ladder, tank: g.tank, hose: g.hose, pump: g.pump };
}
export const sirenOf = (s: Pick<StationState, 'fitted'>) => s.fitted.siren as SirenId;

// ---------- Calls ----------

/** A Round finished: one more Call. */
export const earnCall = (s: StationState): StationState => ({ ...s, calls: s.calls + 1 });
export const isAnswered = (s: Pick<StationState, 'answered'>, id: string) => s.answered.includes(id);
/** The next Call he hasn't answered; null once he's answered them all. */
export const newCall = (s: Pick<StationState, 'answered'>): SceneDef | null => SCENES.find(x => !isAnswered(s, x.id)) ?? null;
/** Where the next Call is: the one he picked in the Town, else a new one, else the one he's answered least lately. */
export function callOf(s: Pick<StationState, 'answered' | 'next' | 'trips'>): SceneDef {
  if (s.next) return SCENES.find(x => x.id === s.next)!;
  return newCall(s) ?? SCENES[s.trips % SCENES.length]!;
}
export const pickCall = (s: StationState, id: string): StationState | null => (isAnswered(s, id) ? { ...s, next: id } : null);

export interface CallPay { bolts: number; firstTime: boolean }
/** The Call is finished: it's used, the Town pays, and a new one adds its badge and building. */
export function finishCall(s: StationState, id: string): { state: StationState; pay: CallPay } {
  const firstTime = !isAnswered(s, id);
  return {
    state: { ...s, calls: Math.max(0, s.calls - 1), trips: s.trips + 1, answered: firstTime ? [...s.answered, id] : s.answered, next: null },
    pay: { bolts: CALL_BOLTS, firstTime },
  };
}
