// The Space Base on the saved game. A Round earns Bolts and one launch. Bolts buy rocket parts; Power takes the rocket to planets
// further out; the first landing on each planet gives the rover a gadget, and every trip pays the Bolts he catches in space and the
// crystals he finds on the ground. So the two pull the same way: Rounds buy the parts that reach the planet with the next gadget.
// A launch is only used up when the trip ends, so leaving halfway costs nothing (and pays nothing), as Math Bots' fights do.
import { isAmount } from '../../currency/amount';
import type { PurchaseProposal } from '../../rewards/purchase';
import { ALL_KEYS, fit, fittedKeys, infoOf, isPartKey, powerOf, starterRocket, STARTERS, tabOf, PAINTS, type PaintId, type PartKey, type Rocket, SLOTS, keyOf } from './parts';
import { GADGET_IDS, isPlanetId, PLANETS, planet, type GadgetId, type Planet, type PlanetDef, type PlanetId } from './planets';

export interface BaseState {
  owned: PartKey[];
  rocket: Rocket;
  /** The part he's saving for, once he has tapped one he can't afford yet. */
  goal: PartKey | null;
  /** Launches earned and not used yet. */
  launches: number;
  trips: number;
  visits: Partial<Record<PlanetId, number>>;
  gadgets: GadgetId[];
  /** The planet he picked on the map, if any. */
  destination: PlanetId | null;
}

export const freshBase = (): BaseState => ({ owned: [...STARTERS], rocket: starterRocket(), goal: null, launches: 1, trips: 0, visits: {}, gadgets: [], destination: null });
export const isOwned = (b: Pick<BaseState, 'owned'>, k: PartKey) => b.owned.includes(k);

type Raw = Record<string, unknown>;
const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);

function readRocket(raw: unknown, owned: readonly PartKey[]): Rocket {
  const r = isRecord(raw) ? raw : {}, fresh = starterRocket();
  const slot = (s: (typeof SLOTS)[number]) => (typeof r[s] === 'string' && owned.includes(keyOf(s, r[s] as string)) ? r[s] as string : fresh[s]);
  const paint = typeof r.paint === 'string' && owned.includes(keyOf('paint', r.paint)) ? r.paint as PaintId : fresh.paint;
  return { nose: slot('nose'), body: slot('body'), fins: slot('fins'), engine: slot('engine'), paint };
}

/** Whatever is missing or doesn't read comes back as the fresh value. */
export function readBase(raw: unknown): BaseState {
  if (!isRecord(raw)) return freshBase();
  const owned = [...new Set([...STARTERS, ...(Array.isArray(raw.owned) ? raw.owned.filter(isPartKey) : [])])];
  const visits = isRecord(raw.visits) ? raw.visits : {};
  return {
    owned, rocket: readRocket(raw.rocket, owned),
    goal: isPartKey(raw.goal) && !owned.includes(raw.goal) ? raw.goal : null,
    launches: isAmount(raw.launches) ? raw.launches : 0, trips: isAmount(raw.trips) ? raw.trips : 0,
    visits: Object.fromEntries(PLANETS.flatMap(p => (isAmount(visits[p.id]) && (visits[p.id] as number) > 0 ? [[p.id, visits[p.id] as number]] : []))),
    gadgets: Array.isArray(raw.gadgets) ? GADGET_IDS.filter(g => (raw.gadgets as unknown[]).includes(g)) : [],
    destination: isPlanetId(raw.destination) ? raw.destination : null,
  };
}

// ---------- parts ----------

export const priceOf = (k: PartKey) => infoOf(k).price;
/** The one he chose while it's locked, otherwise the cheapest part he hasn't got that adds Power, then the cheapest paint. */
export function goalOf(b: Pick<BaseState, 'owned' | 'goal'>): PartKey | null {
  if (b.goal && !isOwned(b, b.goal)) return b.goal;
  const left = ALL_KEYS.filter(k => !isOwned(b, k)).sort((x, y) => priceOf(x) - priceOf(y));
  return left.find(k => tabOf(k) !== 'paint') ?? left[0] ?? null;
}
export function selectGoal(b: BaseState, k: PartKey): BaseState {
  if (isOwned(b, k)) throw new Error('A Goal is something he has not got');
  return { ...b, goal: k };
}
/** Fitted parts he owns: a rocket from a save that was cut down can't sneak one in. */
export const allowed = (b: Pick<BaseState, 'owned'>, r: Rocket) => fittedKeys(r).every(k => b.owned.includes(k));

export type PurchaseFailure = 'invalid-item' | 'invalid-balance' | 'insufficient-funds' | 'already-owned';
/** Buying a part fits it straight away. */
export function proposePurchase(b: BaseState, k: PartKey, balance: number): PurchaseProposal<BaseState, PurchaseFailure> {
  if (!isAmount(balance)) return { kind: 'rejected', reason: 'invalid-balance' };
  if (!isPartKey(k)) return { kind: 'rejected', reason: 'invalid-item' };
  if (isOwned(b, k)) return { kind: 'rejected', reason: 'already-owned' };
  const cost = priceOf(k);
  if (balance < cost) return { kind: 'rejected', reason: 'insufficient-funds' };
  return { kind: 'ready', cost, state: { ...b, owned: [...b.owned, k], rocket: fit(b.rocket, k), goal: b.goal === k ? null : b.goal } };
}
export const allOwned = (b: Pick<BaseState, 'owned'>) => ALL_KEYS.every(k => isOwned(b, k));
export const paintCount = (b: Pick<BaseState, 'owned'>) => PAINTS.filter(p => isOwned(b, keyOf('paint', p.id))).length;

// ---------- planets ----------

export const visited = (b: Pick<BaseState, 'visits'>, id: PlanetId) => (b.visits[id] ?? 0) > 0;
export const canReach = (b: Pick<BaseState, 'rocket'>, p: Planet) => powerOf(b.rocket) >= p.power;
/** The nearest planet he hasn't explored yet; null once he's been everywhere. */
export const nextPlanet = (b: Pick<BaseState, 'visits'>): PlanetDef | null => PLANETS.find(p => !visited(b, p.id)) ?? null;
/** Where Launch goes: the planet he picked, or else somewhere new if the rocket can get there, or else the furthest he's been. */
export function destinationOf(b: Pick<BaseState, 'visits' | 'rocket' | 'destination'>): PlanetDef {
  const picked = b.destination ? planet(b.destination) : null;
  if (picked && canReach(b, picked)) return picked;
  const next = nextPlanet(b);
  if (next && canReach(b, next)) return next;
  return [...PLANETS].reverse().find(p => visited(b, p.id) && canReach(b, p)) ?? PLANETS[0];
}
export const pickDestination = (b: BaseState, id: PlanetId): BaseState | null => (canReach(b, planet(id)) ? { ...b, destination: id } : null);

/** Bolts he can catch in space, and crystals he can find on a planet: at most this many each trip. */
export const SPACE_BOLTS = 3, CRYSTALS = 5;

export interface TripPay { bolts: number; firstVisit: boolean; gadget: GadgetId | null }
export function payFor(b: BaseState, id: PlanetId, caught: number, crystals: number): TripPay {
  const firstVisit = !visited(b, id), gadget = firstVisit && !b.gadgets.includes(planet(id).gadget) ? planet(id).gadget : null;
  return { bolts: Math.min(SPACE_BOLTS, Math.max(0, caught)) + Math.min(CRYSTALS, Math.max(0, crystals)), firstVisit, gadget };
}
/** The trip ended on the planet: the launch is used, the visit counted and the gadget his. */
export function finishTrip(b: BaseState, id: PlanetId, pay: TripPay): BaseState {
  return {
    ...b, launches: Math.max(0, b.launches - 1), trips: b.trips + 1, visits: { ...b.visits, [id]: (b.visits[id] ?? 0) + 1 },
    gadgets: pay.gadget && !b.gadgets.includes(pay.gadget) ? [...b.gadgets, pay.gadget] : b.gadgets,
    // the next Launch goes somewhere new again, unless he picks
    destination: null,
  };
}
/** A Round finished: one more launch. */
export const earnLaunch = (b: BaseState): BaseState => ({ ...b, launches: b.launches + 1 });
