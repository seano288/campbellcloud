// The Ship, the Voyage and the Hoard on the saved game. A finished Round earns Bolts and one Voyage. Bolts buy ship parts; Range takes
// the ship to islands further out; the first dig on each island puts its treasure in his Hoard, and every Voyage pays the barrels he
// picks up at sea and the gold in the chest. So the two pull the same way: Rounds buy the parts that reach the island with the next
// treasure. A Voyage is only used up when the chest opens, so leaving halfway costs nothing (and pays nothing), as Rover Code's trips do.
import { isAmount } from '../../currency/amount';
import type { PurchaseProposal } from '../../rewards/purchase';
import { ALL_KEYS, fit, fittedKeys, infoOf, isColourId, isPartKey, keyOf, rangeOf, SLOTS, starterShip, STARTERS, tabOf, type ColourId, type EmblemId, type PartKey, type Ship } from './parts';
import { isIslandId, ISLANDS, island, type IslandDef, type IslandId } from './islands';

export interface FleetState {
  owned: PartKey[];
  ship: Ship;
  /** The part he's saving for, once he has tapped one he can't afford yet. */
  goal: PartKey | null;
  /** Voyages earned and not used yet. */
  voyages: number;
  trips: number;
  visits: Partial<Record<IslandId, number>>;
  /** The islands whose treasure is in his Hoard, in the order he found them. */
  hoard: IslandId[];
  /** The island he picked on the sea chart, if any. */
  destination: IslandId | null;
}

/** He starts with one free Voyage, so he sees the reward before his first purchase. */
export const freshFleet = (): FleetState => ({ owned: [...STARTERS], ship: starterShip(), goal: null, voyages: 1, trips: 0, visits: {}, hoard: [], destination: null });
export const isOwned = (f: Pick<FleetState, 'owned'>, k: PartKey) => f.owned.includes(k);

type Raw = Record<string, unknown>;
const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);

function readShip(raw: unknown, owned: readonly PartKey[]): Ship {
  const r = isRecord(raw) ? raw : {}, fresh = starterShip();
  const slot = (s: (typeof SLOTS)[number]) => (typeof r[s] === 'string' && owned.includes(keyOf(s, r[s] as string)) ? r[s] as string : fresh[s]);
  const flag = typeof r.flag === 'string' && owned.includes(keyOf('flag', r.flag)) ? r.flag as EmblemId : fresh.flag;
  return { hull: slot('hull'), sails: slot('sails'), cannons: slot('cannons'), figurehead: slot('figurehead'), flag, colour: isColourId(r.colour) ? r.colour : fresh.colour };
}

/** Whatever is missing or doesn't read comes back as the fresh value. */
export function readFleet(raw: unknown): FleetState {
  if (!isRecord(raw)) return freshFleet();
  const owned = [...new Set([...STARTERS, ...(Array.isArray(raw.owned) ? raw.owned.filter(isPartKey) : [])])];
  const visits = isRecord(raw.visits) ? raw.visits : {};
  return {
    owned, ship: readShip(raw.ship, owned),
    goal: isPartKey(raw.goal) && !owned.includes(raw.goal) ? raw.goal : null,
    voyages: isAmount(raw.voyages) ? raw.voyages : 0, trips: isAmount(raw.trips) ? raw.trips : 0,
    visits: Object.fromEntries(ISLANDS.flatMap(i => (isAmount(visits[i.id]) && (visits[i.id] as number) > 0 ? [[i.id, visits[i.id] as number]] : []))),
    hoard: Array.isArray(raw.hoard) ? [...new Set((raw.hoard as unknown[]).filter(isIslandId))] : [],
    destination: isIslandId(raw.destination) ? raw.destination : null,
  };
}

// ---------- parts ----------

export const priceOf = (k: PartKey) => infoOf(k).price;
/** The one he chose while it's locked, otherwise the cheapest part he hasn't got that adds Range, then the cheapest flag. */
export function goalOf(f: Pick<FleetState, 'owned' | 'goal'>): PartKey | null {
  if (f.goal && !isOwned(f, f.goal)) return f.goal;
  const left = ALL_KEYS.filter(k => !isOwned(f, k)).sort((x, y) => priceOf(x) - priceOf(y));
  return left.find(k => tabOf(k) !== 'flag') ?? left[0] ?? null;
}
export function selectGoal(f: FleetState, k: PartKey): FleetState {
  if (isOwned(f, k)) throw new Error('A Goal is something he has not got');
  return { ...f, goal: k };
}
/** Fitted parts he owns: a ship from a save that was cut down can't sneak one in. */
export const allowed = (f: Pick<FleetState, 'owned'>, s: Ship) => fittedKeys(s).every(k => f.owned.includes(k));

export type PurchaseFailure = 'invalid-item' | 'invalid-balance' | 'insufficient-funds' | 'already-owned';
/** Buying a part fits it straight away. */
export function proposePurchase(f: FleetState, k: PartKey, balance: number): PurchaseProposal<FleetState, PurchaseFailure> {
  if (!isAmount(balance)) return { kind: 'rejected', reason: 'invalid-balance' };
  if (!isPartKey(k)) return { kind: 'rejected', reason: 'invalid-item' };
  if (isOwned(f, k)) return { kind: 'rejected', reason: 'already-owned' };
  const cost = priceOf(k);
  if (balance < cost) return { kind: 'rejected', reason: 'insufficient-funds' };
  return { kind: 'ready', cost, state: { ...f, owned: [...f.owned, k], ship: fit(f.ship, k), goal: f.goal === k ? null : f.goal } };
}
export const allOwned = (f: Pick<FleetState, 'owned'>) => ALL_KEYS.every(k => isOwned(f, k));
/** The flag's colours are free: he picks, it's on. */
export const pickColour = (f: FleetState, colour: ColourId): FleetState => ({ ...f, ship: { ...f.ship, colour } });

// ---------- islands ----------

export const visited = (f: Pick<FleetState, 'visits'>, id: IslandId) => (f.visits[id] ?? 0) > 0;
export const canReach = (f: Pick<FleetState, 'ship'>, i: Pick<IslandDef, 'range'>) => rangeOf(f.ship) >= i.range;
/** The nearest island he hasn't dug on yet; null once he's been everywhere. */
export const nextIsland = (f: Pick<FleetState, 'visits'>): IslandDef | null => ISLANDS.find(i => !visited(f, i.id)) ?? null;
/** Where Set Sail goes: the island he picked, or else somewhere new if the ship can get there, or else the furthest he's been. */
export function destinationOf(f: Pick<FleetState, 'visits' | 'ship' | 'destination'>): IslandDef {
  const picked = f.destination ? island(f.destination) : null;
  if (picked && canReach(f, picked)) return picked;
  const next = nextIsland(f);
  if (next && canReach(f, next)) return next;
  return [...ISLANDS].reverse().find(i => visited(f, i.id) && canReach(f, i)) ?? ISLANDS[0];
}
export const pickDestination = (f: FleetState, id: IslandId): FleetState | null => (canReach(f, island(id)) ? { ...f, destination: id } : null);

/** Barrels he can pick up at sea (a Bolt each), and the gold in every chest: at most 6 a Voyage. */
export const BARRELS = 3, CHEST_GOLD = 3;

export interface VoyagePay { bolts: number; firstVisit: boolean; treasure: IslandId | null }
export function payFor(f: FleetState, id: IslandId, barrels: number): VoyagePay {
  const firstVisit = !visited(f, id), treasure = !f.hoard.includes(id) ? id : null;
  return { bolts: Math.min(BARRELS, Math.max(0, Math.floor(barrels))) + CHEST_GOLD, firstVisit, treasure };
}
/** The chest opened: the Voyage is used, the visit counted and the treasure his. */
export function finishVoyage(f: FleetState, id: IslandId, pay: VoyagePay): FleetState {
  return {
    ...f, voyages: Math.max(0, f.voyages - 1), trips: f.trips + 1, visits: { ...f.visits, [id]: (f.visits[id] ?? 0) + 1 },
    hoard: pay.treasure && !f.hoard.includes(pay.treasure) ? [...f.hoard, pay.treasure] : f.hoard,
    // the next Set Sail goes somewhere new again, unless he picks
    destination: null,
  };
}
/** A Round finished: one more Voyage. */
export const earnVoyage = (f: FleetState): FleetState => ({ ...f, voyages: f.voyages + 1 });
