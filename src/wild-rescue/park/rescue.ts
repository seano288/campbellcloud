// The truck, the Rescues and the Park on the saved game. A finished Round earns Bolts and one Rescue call. A call is for an animal
// whose habitat he owns and whose terrain and size his truck can manage, so no animal is ever left without a home. He drives out,
// does the job, and the animal rides home in the crate; he then carries it to its habitat in the Park. Bolts build habitats and
// upgrade the truck, which opens more rescues. Once every animal he can reach is home, a call is a release: he takes one of his
// animals back to the wild for a run out, and it pays the same.
//
// A call is used, and the drive paid, only when the animal is in the crate. Leaving halfway costs nothing and pays nothing.
import { isAmount } from '../../currency/amount';
import type { PurchaseProposal } from '../../rewards/purchase';
import { animal, isRescueId, RESCUABLE, type RescueId } from '../facts/animals';
import { HABITAT_IDS, type HabitatId } from '../facts/habitats';
import {
  ALL_KEYS, fit, fittedKeys, idOf, isItemKey, isTruckKey, item, keyOf, PARK_HABITATS, PARTS, SLOTS, starterTruck, STARTERS, tabOf,
  type ItemKey, type PaintId, type Truck,
} from './shop';

export interface RescueState {
  owned: ItemKey[];
  truck: Truck;
  /** What he's saving for, once he has tapped something he can't afford yet. */
  goal: ItemKey | null;
  /** Rescue calls earned and not used yet. */
  calls: number;
  trips: number;
  /** The animals living in the Park, in the order they came home. */
  park: RescueId[];
  /** Brought home and not placed yet: in his hands in the Park, even after a reload. */
  holding: RescueId | null;
  /** Release runs done, once every reachable animal was home. */
  released: number;
}

/** He starts with one free Rescue, for an animal for the free Barn, so he sees the reward before his first purchase. */
export const freshRescue = (): RescueState => ({ owned: [...STARTERS], truck: starterTruck(), goal: null, calls: 1, trips: 0, park: [], holding: null, released: 0 });
export const isOwned = (s: Pick<RescueState, 'owned'>, k: ItemKey) => s.owned.includes(k);

type Raw = Record<string, unknown>;
const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);

function readTruck(raw: unknown, owned: readonly ItemKey[]): Truck {
  const r = isRecord(raw) ? raw : {}, fresh = starterTruck(), ok = (k: ItemKey) => owned.includes(k);
  const slot = (s: (typeof SLOTS)[number]) => (typeof r[s] === 'string' && ok(keyOf(s, r[s] as string)) ? r[s] as string : fresh[s]);
  const paint = typeof r.paint === 'string' && ok(keyOf('paint', r.paint)) ? r.paint as PaintId : fresh.paint;
  return { tires: slot('tires'), winch: slot('winch'), lights: slot('lights'), carrier: slot('carrier'), paint };
}

/** Whatever is missing or doesn't read comes back fresh. An animal is never both in the Park and in his hands. */
export function readRescue(raw: unknown): RescueState {
  if (!isRecord(raw)) return freshRescue();
  const owned = [...new Set([...STARTERS, ...(Array.isArray(raw.owned) ? raw.owned.filter(isItemKey) : [])])];
  const park = Array.isArray(raw.park) ? [...new Set((raw.park as unknown[]).filter(isRescueId))] : [];
  const holding = isRescueId(raw.holding) && !park.includes(raw.holding) ? raw.holding : null;
  return {
    owned, truck: readTruck(raw.truck, owned), goal: isItemKey(raw.goal) && !owned.includes(raw.goal) ? raw.goal : null,
    calls: isAmount(raw.calls) ? raw.calls : 0, trips: isAmount(raw.trips) ? raw.trips : 0, park, holding,
    released: isAmount(raw.released) ? raw.released : 0,
  };
}

// ---------- what the truck can reach ----------

const ownsPart = (s: Pick<RescueState, 'owned'>, slot: string, ids: readonly string[]) => ids.some(id => isOwned(s, keyOf(slot as never, id)));
const bestTires = (s: Pick<RescueState, 'owned'>) => Math.max(...PARTS.filter(p => p.slot === 'tires' && isOwned(s, keyOf('tires', p.id))).map(p => p.rung));
/** The tire Rung each terrain needs. */
export const TIRES_FOR: Partial<Record<HabitatId, number>> = { forest: 1, desert: 2, polar: 3 };
const CARRIES_LARGE = ['big', 'giant', 'ambulance', 'hauler'], CARRIES_GIANT = ['giant', 'ambulance', 'hauler'];

/** What stops him rescuing this animal, each as the cheapest thing that would fix it (empty: he can go). */
export function blockers(s: Pick<RescueState, 'owned'>, id: RescueId): ItemKey[] {
  const a = animal(id), h = a.home!, out: ItemKey[] = [];
  if (!isOwned(s, keyOf('habitat', h))) out.push(keyOf('habitat', h));
  const tires = TIRES_FOR[h];
  if (tires !== undefined && bestTires(s) < tires) out.push(keyOf('tires', PARTS.find(p => p.slot === 'tires' && p.rung === tires)!.id));
  if (h === 'pond' && !isOwned(s, 'carrier:boat')) out.push('carrier:boat');
  if (h === 'ocean') { if (!isOwned(s, 'carrier:tank')) out.push('carrier:tank'); return out; }
  if (a.size === 'large' && !ownsPart(s, 'carrier', CARRIES_LARGE)) out.push('carrier:big');
  if (a.size === 'giant' && !ownsPart(s, 'carrier', CARRIES_GIANT)) out.push('carrier:giant');
  return out;
}
export const canRescue = (s: Pick<RescueState, 'owned'>, id: RescueId) => blockers(s, id).length === 0;

/** The truck as it goes out on this call: if the gear it needs is his but not fitted, it goes on for the trip. */
export function truckFor(s: Pick<RescueState, 'owned' | 'truck'>, id: RescueId): Truck {
  const a = animal(id), h = a.home!;
  let t = s.truck;
  const need = TIRES_FOR[h];
  const rung = (slot: string, pid: string) => PARTS.find(p => p.slot === slot && p.id === pid)?.rung ?? 0;
  if (need !== undefined && rung('tires', t.tires) < need) t = fit(t, keyOf('tires', PARTS.filter(p => p.slot === 'tires' && p.rung >= need && isOwned(s, keyOf('tires', p.id)))[0]!.id));
  // the pond's rescues go out with the boat trailer and the ocean's with the water tank, whatever their size
  const want = h === 'ocean' ? ['tank'] : h === 'pond' ? ['boat'] : a.size === 'giant' ? CARRIES_GIANT : a.size === 'large' ? CARRIES_LARGE : null;
  if (want && !want.includes(t.carrier)) {
    const got = want.find(c => isOwned(s, keyOf('carrier', c)));
    if (got) t = fit(t, keyOf('carrier', got));
  }
  return t;
}

/** The order habitats are laid out and preferred in. */
const ORDER = PARK_HABITATS.map(h => h.id as HabitatId);

export type Call = { kind: 'rescue'; animal: RescueId } | { kind: 'release'; animal: RescueId };

/**
 * Who needs help next: an animal not yet home that he can reach, from the habitat with the fewest animals so far (so a new habitat
 * fills first), then in the table's order. When every reachable animal is home, a release of one of his.
 */
export function nextCall(s: Pick<RescueState, 'owned' | 'park' | 'holding' | 'trips'>): Call {
  const waiting = RESCUABLE.filter(a => !s.park.includes(a.id) && s.holding !== a.id && canRescue(s, a.id));
  if (waiting.length) {
    const count = (h: HabitatId) => s.park.filter(id => animal(id).home === h).length;
    const best = [...waiting].sort((x, y) => count(x.home) - count(y.home) || ORDER.indexOf(x.home) - ORDER.indexOf(y.home))[0]!;
    return { kind: 'rescue', animal: best.id };
  }
  const home = s.park.length ? s.park : (['sheep'] as RescueId[]);
  return { kind: 'release', animal: home[s.trips % home.length]! };
}

// ---------- buying ----------

export const priceOf = (k: ItemKey) => item(k).price;
export const allowed = (s: Pick<RescueState, 'owned'>, t: Truck) => fittedKeys(t).every(k => s.owned.includes(k));

/** The cheapest thing that brings the nearest new rescue closer; once every animal is reachable, the cheapest thing left. */
export function goalOf(s: Pick<RescueState, 'owned' | 'goal' | 'park' | 'holding'>): ItemKey | null {
  if (s.goal && !isOwned(s, s.goal)) return s.goal;
  let best: { cost: number; key: ItemKey } | null = null;
  for (const a of RESCUABLE) {
    if (s.park.includes(a.id) || s.holding === a.id) continue;
    const keys = blockers(s, a.id);
    if (!keys.length) continue;
    const cost = keys.reduce((sum, k) => sum + priceOf(k), 0), cheapest = [...keys].sort((x, y) => priceOf(x) - priceOf(y))[0]!;
    if (!best || cost < best.cost) best = { cost, key: cheapest };
  }
  if (best) return best.key;
  const left = ALL_KEYS.filter(k => !isOwned(s, k)).sort((x, y) => priceOf(x) - priceOf(y));
  return left.find(k => tabOf(k) !== 'paint') ?? left[0] ?? null;
}
export function selectGoal(s: RescueState, k: ItemKey): RescueState {
  if (isOwned(s, k)) throw new Error('A Goal is something he has not got');
  return { ...s, goal: k };
}

export type PurchaseFailure = 'invalid-item' | 'invalid-balance' | 'insufficient-funds' | 'already-owned';
/** Buying a truck part or paint fits it straight away. */
export function proposePurchase(s: RescueState, k: ItemKey, balance: number): PurchaseProposal<RescueState, PurchaseFailure> {
  if (!isAmount(balance)) return { kind: 'rejected', reason: 'invalid-balance' };
  if (!isItemKey(k)) return { kind: 'rejected', reason: 'invalid-item' };
  if (isOwned(s, k)) return { kind: 'rejected', reason: 'already-owned' };
  const cost = priceOf(k);
  if (balance < cost) return { kind: 'rejected', reason: 'insufficient-funds' };
  return { kind: 'ready', cost, state: { ...s, owned: [...s.owned, k], truck: isTruckKey(k) ? fit(s.truck, k) : s.truck, goal: s.goal === k ? null : s.goal } };
}
export const allOwned = (s: Pick<RescueState, 'owned'>) => ALL_KEYS.every(k => isOwned(s, k));
export const ownsHabitat = (s: Pick<RescueState, 'owned'>, h: HabitatId) => isOwned(s, keyOf('habitat', h));
export const habitatsOwned = (s: Pick<RescueState, 'owned'>) => HABITAT_IDS.filter(h => ownsHabitat(s, h));
export const extraOwned = (s: Pick<RescueState, 'owned'>, id: string) => isOwned(s, keyOf('extra', id));
export { idOf };

// ---------- a Rescue ----------

/** Bolts he can pick up on the drive: at most 4 a Rescue. */
export const DRIVE_BOLTS = 4;

export interface RescuePay { bolts: number; animal: RescueId; release: boolean }
export const payFor = (call: Call, bolts: number): RescuePay => ({ bolts: Math.min(DRIVE_BOLTS, Math.max(0, Math.floor(bolts))), animal: call.animal, release: call.kind === 'release' });

/** It's in the crate: the call is used and the animal rides home in his hands (or, for a release, goes back to the wild). */
export function finishRescue(s: RescueState, pay: RescuePay): RescueState {
  const fresh = !pay.release && !s.park.includes(pay.animal) && s.holding !== pay.animal;
  // one in his hands already is never dropped: it goes home to its habitat
  const park = fresh && s.holding && !s.park.includes(s.holding) ? [...s.park, s.holding] : s.park;
  return { ...s, park, calls: Math.max(0, s.calls - 1), trips: s.trips + 1, holding: fresh ? pay.animal : s.holding, released: s.released + (pay.release ? 1 : 0) };
}
/** He set the animal down in a habitat: only its own habitat takes it. */
export function placeAnimal(s: RescueState, h: HabitatId): RescueState | null {
  if (!s.holding || animal(s.holding).home !== h || !ownsHabitat(s, h)) return null;
  return { ...s, park: [...s.park, s.holding], holding: null };
}
/** A Round finished: one more call. */
export const earnCall = (s: RescueState): RescueState => ({ ...s, calls: s.calls + 1 });
export const RESCUE_TOTAL = RESCUABLE.length;
export { idOf as itemId, tabOf as itemTab };
