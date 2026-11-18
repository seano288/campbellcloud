// The Truck on the saved game: the trucks and parts he owns, which truck he drives and what's fitted on it, the Services he has earned,
// the stars from everyone he has fed, and the Regulars in his sticker book. A finished Round earns Bolts and one Service (he starts with
// one free, so he sees the reward before his first purchase). Bolts buy trucks and parts. A Service pays no Bolts: it pays stars, one
// for each customer fed, and stars (with Lights for the night ones) open Spots. Nothing is ever lost.
import { isAmount } from '../../currency/amount';
import type { PurchaseProposal } from '../../rewards/purchase';
import { ALL_PARTS, HELPERS, isPartKey, isTruckId, keyOf, partOf, SLOTS, starterFit, STARTERS, TRUCKS, truckOf, type Fitted, type HelperId, type PartKey, type Slot, type TruckId } from './parts';
import { isSpotId, REGULARS, regularOf, SPOTS, spotOf, type Regular, type RegularId, type Spot, type SpotId } from './world';

export interface TruckState {
  /** Parts he owns (the free ones always). */
  owned: PartKey[];
  trucks: TruckId[];
  truck: TruckId;
  fit: Fitted;
  /** Helpers he has switched off. */
  off: PartKey[];
  /** What he's saving for, once he has tapped one he can't afford yet. */
  goal: string | null;
  /** Services earned and not used yet. */
  services: number;
  /** Services finished, ever. */
  served: number;
  /** Everyone he has fed, ever: one star each. */
  stars: number;
  /** The most fed in one Service. */
  best: number;
  regulars: RegularId[];
  spot: SpotId;
}

export const FIRST_SERVICES = 1;
export const freshTruck = (): TruckState => ({
  owned: [...STARTERS], trucks: ['taco'], truck: 'taco', fit: starterFit(), off: [], goal: null,
  services: FIRST_SERVICES, served: 0, stars: 0, best: 0, regulars: [], spot: 'park',
});

type Raw = Record<string, unknown>;
const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);
const count = (x: unknown, max = Infinity) => (isAmount(x) ? Math.min(x as number, max) : 0);

/** Whatever is missing or doesn't read comes back fresh; nothing he doesn't own is fitted or driven. */
export function readTruck(raw: unknown): TruckState {
  const f = freshTruck();
  if (!isRecord(raw)) return f;
  const owned = [...new Set([...STARTERS, ...(Array.isArray(raw.owned) ? raw.owned.filter(isPartKey) : [])])];
  const trucks = TRUCKS.map(k => k.id).filter(id => id === 'taco' || (Array.isArray(raw.trucks) && raw.trucks.includes(id)));
  const rawFit = isRecord(raw.fit) ? raw.fit : {};
  const fit = Object.fromEntries(SLOTS.map(s => { const k = rawFit[s]; return [s, isPartKey(k) && partOf(k).slot === s && owned.includes(k) ? k : f.fit[s]]; })) as Fitted;
  const stars = count(raw.stars);
  const regulars = REGULARS.map(r => r.id).filter(id => Array.isArray(raw.regulars) && raw.regulars.includes(id));
  const s: TruckState = {
    owned, trucks, truck: isTruckId(raw.truck) && trucks.includes(raw.truck) ? raw.truck : 'taco', fit,
    off: Array.isArray(raw.off) ? raw.off.filter((k): k is PartKey => isPartKey(k) && partOf(k).slot === 'helper' && owned.includes(k)) : [],
    goal: typeof raw.goal === 'string' && isGoal(raw.goal) ? raw.goal : null,
    services: count(raw.services, 99), served: count(raw.served), stars, best: count(raw.best, 99), regulars, spot: 'park',
  };
  s.spot = isSpotId(raw.spot) && isOpen(s, spotOf(raw.spot)) ? raw.spot : 'park';
  if (s.goal && owns(s, s.goal)) s.goal = null;
  return s;
}

// ---------- what he owns ----------

/** A shop thing: a truck ("truck:pizza") or a part ("paint:mint"). */
export type ShopKey = PartKey | `truck:${TruckId}`;
const isGoal = (x: string): x is ShopKey => isPartKey(x) || (x.startsWith('truck:') && isTruckId(x.slice(6)));
export const truckKey = (id: TruckId) => `truck:${id}` as const;
export const priceOf = (k: ShopKey) => (k.startsWith('truck:') ? truckOf(k.slice(6) as TruckId).price : partOf(k as PartKey).price);
export const nameOf = (k: ShopKey) => (k.startsWith('truck:') ? truckOf(k.slice(6) as TruckId).name : partOf(k as PartKey).name);
export const owns = (s: Pick<TruckState, 'owned' | 'trucks'>, k: string) => (k.startsWith('truck:') ? s.trucks.includes(k.slice(6) as TruckId) : s.owned.includes(k as PartKey));
export const helperOn = (s: Pick<TruckState, 'owned' | 'off'>, id: HelperId) => { const k = `helper:${id}` as PartKey; return s.owned.includes(k) && !s.off.includes(k); };
export const FOR_SALE: readonly ShopKey[] = [...TRUCKS.filter(k => k.price > 0).map(k => truckKey(k.id)), ...ALL_PARTS.filter(p => p.price > 0).map(keyOf)];

export type PurchaseFailure = 'invalid-item' | 'invalid-balance' | 'insufficient-funds' | 'already-owned';
/** Buying a truck drives it; buying a part fits it (a Helper switches on). */
export function proposePurchase(s: TruckState, k: ShopKey, balance: number): PurchaseProposal<TruckState, PurchaseFailure> {
  if (!isAmount(balance)) return { kind: 'rejected', reason: 'invalid-balance' };
  if (!FOR_SALE.includes(k)) return { kind: 'rejected', reason: 'invalid-item' };
  if (owns(s, k)) return { kind: 'rejected', reason: 'already-owned' };
  const cost = priceOf(k);
  if (balance < cost) return { kind: 'rejected', reason: 'insufficient-funds' };
  const goal = s.goal === k ? null : s.goal;
  if (k.startsWith('truck:')) { const id = k.slice(6) as TruckId; return { kind: 'ready', cost, state: { ...s, trucks: [...s.trucks, id], truck: id, goal } }; }
  const p = partOf(k as PartKey), owned = [...s.owned, k as PartKey];
  return { kind: 'ready', cost, state: p.slot === 'helper' ? { ...s, owned, goal } : { ...s, owned, fit: { ...s.fit, [p.slot]: k }, goal } };
}
export const fitOwned = (s: TruckState, k: PartKey): TruckState | null => {
  if (!s.owned.includes(k)) return null;
  const p = partOf(k);
  if (p.slot === 'helper') return { ...s, off: s.off.includes(k) ? s.off.filter(x => x !== k) : [...s.off, k] };
  return { ...s, fit: { ...s.fit, [p.slot]: k } };
};
export const drive = (s: TruckState, id: TruckId): TruckState | null => (s.trucks.includes(id) ? { ...s, truck: id } : null);
export const setGoal = (s: TruckState, k: ShopKey): TruckState | null => (owns(s, k) || !FOR_SALE.includes(k) ? null : { ...s, goal: k });
/** The one he chose, or else the cheapest thing he hasn't got. */
export function goalOf(s: TruckState): ShopKey | null {
  if (s.goal && isGoal(s.goal) && !owns(s, s.goal)) return s.goal;
  return [...FOR_SALE].filter(k => !owns(s, k)).sort((a, b) => priceOf(a) - priceOf(b))[0] ?? null;
}
export const allBought = (s: TruckState) => FOR_SALE.every(k => owns(s, k));

// ---------- Spots and Regulars ----------

export const hasLights = (s: Pick<TruckState, 'fit'>) => partOf(s.fit.lights).id !== 'none';
export const ownsLights = (s: Pick<TruckState, 'owned'>) => s.owned.some(k => k.startsWith('lights:') && partOf(k).id !== 'none');
/** A Spot is open with enough stars, and, for a night one, Lights he owns (they go on for the night). */
export const isOpen = (s: Pick<TruckState, 'stars' | 'owned'>, spot: Spot) => s.stars >= spot.stars && (!spot.night || ownsLights(s));
export const openSpots = (s: TruckState) => SPOTS.filter(p => isOpen(s, p));
export const pickSpot = (s: TruckState, id: SpotId): TruckState | null => (isOpen(s, spotOf(id)) ? { ...s, spot: id } : null);
/** The next Spot his stars will open, if any. */
export const nextSpot = (s: Pick<TruckState, 'stars'>): Spot | null => SPOTS.find(p => p.stars > s.stars) ?? null;

/** The Regular a Service with this truck brings: the first of its four he hasn't met. */
export const newRegular = (s: Pick<TruckState, 'regulars'>, truck: TruckId): Regular | null =>
  REGULARS.find(r => r.truck === truck && !s.regulars.includes(r.id)) ?? null;

/** How a Service with his truck plays, from what's fitted. */
export interface Setup {
  truck: TruckId;
  spot: SpotId;
  grills: number;
  /** Customers at the hatch at once: the ones being cooked for and the ones waiting. */
  line: number;
  /** Seconds between customers. */
  gap: number;
  helpers: Record<HelperId, boolean>;
  regular: Regular | null;
  /** Toppings in an order: fewer at first. */
  toppings: readonly [number, number];
}
export function setupOf(s: TruckState): Setup {
  const helpers = Object.fromEntries(HELPERS.map(h => [h.id, helperOn(s, h.id as HelperId)])) as Record<HelperId, boolean>;
  const grills = partOf(s.fit.grill).power ?? 1;
  return {
    truck: s.truck, spot: s.spot, grills,
    line: Math.max(grills, 2 + (partOf(s.fit.awning).power ?? 0)),
    gap: partOf(s.fit.speaker).power ?? 7,
    helpers, regular: newRegular(s, s.truck),
    toppings: s.served < 2 ? [1, 1] : s.served < 6 ? [1, 2] : [1, 3],
  };
}

export interface ServicePay {
  fed: number;
  regular: RegularId | null;
  /** Spots this Service's stars opened. */
  opened: SpotId[];
}
/** The Service ended: it's used, every customer fed is a star, and a Regular he served goes in the book. Null without a Service. */
export function finishService(s: TruckState, fed: number, regular: RegularId | null): { state: TruckState; pay: ServicePay } | null {
  if (s.services <= 0) return null;
  const was = new Set(openSpots(s).map(p => p.id));
  const met = regular && regularOf(regular) && !s.regulars.includes(regular) ? regular : null;
  const next: TruckState = {
    ...s, services: s.services - 1, served: s.served + 1, stars: s.stars + fed, best: Math.max(s.best, Math.min(99, fed)),
    regulars: met ? [...s.regulars, met] : s.regulars,
  };
  return { state: next, pay: { fed, regular: met, opened: openSpots(next).map(p => p.id).filter(id => !was.has(id)) } };
}
export const earnService = (s: TruckState): TruckState => ({ ...s, services: Math.min(99, s.services + 1) });

/** Everything there is to earn, for the book's count and the tests. */
export const EARNABLE = { bought: FOR_SALE.length, regulars: REGULARS.length, spots: SPOTS.length - 1 };
export const slotOf = (k: PartKey): Slot | 'helper' => partOf(k).slot;
