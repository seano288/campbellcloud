// The Dock on the saved game. A Round earns Bolts and one Dive. A Dive photographs animals for his Logbook and picks up treasure,
// which pays Bolts. Bolts buy parts, and better parts open deeper zones. The first Dive is free, so he sees the sea before his first
// purchase; a Dive is used up only when it's finished (leaving halfway costs nothing and pays nothing), as in Hook and Ladder's Calls.
import { isAmount } from '../../currency/amount';
import { shuffle, type Rng } from '../../game/rng';
import type { PurchaseProposal } from '../../rewards/purchase';
import { animalsIn, isAnimalId, type Animal, type AnimalId } from '../sea/animals';
import { isZoneId, ZONES, zone as zoneOf, type ZoneId } from '../sea/zones';
import {
  ALL_KEYS, BEAMS, BUDDIES, CLAW_REACH, FITTED, FLASH_COUNT, HORNS, idOf, infoOf, isItemKey, keyOf, LIGHT_HALF, LIGHT_REACH, MOTOR_SPEED,
  PAINTS, RUNGED, SONAR_EVERY, SONAR_RANGE, STARTERS, STRIPES, tabOf, TRAILS, type FitTab, type ItemKey, type RungTab, type Tab,
} from './parts';

export type Fitted = Record<FitTab, string>;

export interface DockState {
  owned: ItemKey[];
  /** What's on his submarine: one item from each fitted tab. */
  fitted: Fitted;
  /** What he's saving for, once he has tapped something he can't afford yet. */
  goal: ItemKey | null;
  /** Dives earned and not taken yet. */
  dives: number;
  /** Every animal he has photographed, in the order he first did: his Logbook. */
  photos: AnimalId[];
  /** Where the next Dive goes (he picks on the Dock's map); null: the deepest zone open to him. */
  zone: ZoneId | null;
  /** Dives finished in all. */
  done: number;
}

/** Bolts a treasure he picks up on a Dive pays (a default for the parent to confirm). */
export const TREASURE_BOLTS = 1;
/** Treasures on each Dive. */
export const TREASURES = 3;
/** How long a Dive lasts before the submarine rises by itself, in seconds. */
export const DIVE_S = 60;

const STARTER_FIT: Fitted = { hull: 'r0', lights: 'r0', sonar: 'r0', motor: 'r0', claw: 'r0', flash: 'r0', paint: 'yellow', stripes: 'none', beam: 'warm', horn: 'toot', buddy: 'fish', trail: 'bubbles' };
export const freshDock = (): DockState => ({ owned: [...STARTERS], fitted: { ...STARTER_FIT }, goal: null, dives: 1, photos: [], zone: null, done: 0 });
export const isOwned = (s: Pick<DockState, 'owned'>, k: ItemKey) => s.owned.includes(k);

type Raw = Record<string, unknown>;
const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);

/** Whatever is missing or doesn't read comes back fresh; nothing fitted that he doesn't own. */
export function readDock(raw: unknown): DockState {
  if (!isRecord(raw)) return freshDock();
  const owned = [...new Set([...STARTERS, ...(Array.isArray(raw.owned) ? raw.owned.filter(isItemKey) : [])])];
  const f = isRecord(raw.fitted) ? raw.fitted : {};
  const fitted = Object.fromEntries(FITTED.map(t => {
    const id = f[t];
    return [t, typeof id === 'string' && owned.includes(keyOf(t, id)) ? id : STARTER_FIT[t]];
  })) as Fitted;
  const photos = Array.isArray(raw.photos) ? [...new Set(raw.photos.filter(isAnimalId))] : [];
  const read: DockState = {
    owned, fitted, goal: isItemKey(raw.goal) && !owned.includes(raw.goal) ? raw.goal : null,
    dives: isAmount(raw.dives) ? raw.dives : 0, photos, zone: isZoneId(raw.zone) ? raw.zone : null, done: isAmount(raw.done) ? raw.done : 0,
  };
  return { ...read, zone: read.zone && zoneOpen(read, read.zone) ? read.zone : null };
}

// ---------- buying ----------

export const priceOf = (k: ItemKey) => infoOf(k).price;
const isFitTab = (t: Tab): t is FitTab => (FITTED as readonly Tab[]).includes(t);
/** Puts an owned item on his submarine (things for the Dock just stay owned). */
export function fit(s: DockState, k: ItemKey): DockState {
  const t = tabOf(k);
  if (!isOwned(s, k) || !isFitTab(t)) return s;
  return { ...s, fitted: { ...s.fitted, [t]: idOf(k) } };
}
export const isFitted = (s: Pick<DockState, 'fitted'>, k: ItemKey) => { const t = tabOf(k); return isFitTab(t) && s.fitted[t] === idOf(k); };

/** A part that changes the Dive. */
const helps = (k: ItemKey) => (RUNGED as readonly Tab[]).includes(tabOf(k));
/** The one he chose while it's locked, else the cheapest part that helps on a Dive, else the cheapest thing left. */
export function goalOf(s: Pick<DockState, 'owned' | 'goal'>): ItemKey | null {
  if (s.goal && !isOwned(s, s.goal)) return s.goal;
  const left = ALL_KEYS.filter(k => !isOwned(s, k)).sort((a, b) => priceOf(a) - priceOf(b));
  return left.find(helps) ?? left[0] ?? null;
}
export function selectGoal(s: DockState, k: ItemKey): DockState {
  if (isOwned(s, k)) throw new Error('A Goal is something he has not got');
  return { ...s, goal: k };
}

export type PurchaseFailure = 'invalid-item' | 'invalid-balance' | 'insufficient-funds' | 'already-owned';
/** Buying something fits it straight away. */
export function proposePurchase(s: DockState, k: ItemKey, balance: number): PurchaseProposal<DockState, PurchaseFailure> {
  if (!isAmount(balance)) return { kind: 'rejected', reason: 'invalid-balance' };
  if (!isItemKey(k)) return { kind: 'rejected', reason: 'invalid-item' };
  if (isOwned(s, k)) return { kind: 'rejected', reason: 'already-owned' };
  const cost = priceOf(k);
  if (balance < cost) return { kind: 'rejected', reason: 'insufficient-funds' };
  const bought = { ...s, owned: [...s.owned, k], goal: s.goal === k ? null : s.goal };
  return { kind: 'ready', cost, state: fit(bought, k) };
}
export const allOwned = (s: Pick<DockState, 'owned'>) => ALL_KEYS.every(k => isOwned(s, k));

// ---------- the submarine ----------

/** The best Rung he owns of a part is what he dives with (a part he owns is always better than the one before it). */
export const rungOf = (s: Pick<DockState, 'fitted'>, t: RungTab) => Number(s.fitted[t].slice(1)) || 0;

/** What the parts on his submarine do on a Dive. */
export interface Gear {
  readonly reach: number; readonly half: number; readonly sonarRange: number; readonly sonarEvery: number;
  readonly speed: number; readonly claw: number; readonly flashes: number;
}
export function gearOf(s: Pick<DockState, 'fitted'>, trial?: ItemKey | null): Gear {
  const f = trial && isFitTab(tabOf(trial)) ? { fitted: { ...s.fitted, [tabOf(trial)]: idOf(trial) } } : s;
  const r = (t: RungTab) => rungOf(f, t);
  return {
    reach: LIGHT_REACH[r('lights')]!, half: LIGHT_HALF[r('lights')]!, sonarRange: SONAR_RANGE[r('sonar')]!, sonarEvery: SONAR_EVERY[r('sonar')]!,
    speed: MOTOR_SPEED[r('motor')]!, claw: CLAW_REACH[r('claw')]!, flashes: FLASH_COUNT[r('flash')]!,
  };
}

/** How his submarine looks (art/sub.ts draws it). */
export interface SubLook {
  readonly paint: string; readonly paint2?: string; readonly pattern?: string;
  readonly stripes?: { color: string; pattern: string };
  readonly beam: string; readonly buddy: string; readonly trail: string; readonly trailPattern?: string;
  readonly hull: number; readonly lights: number; readonly sonar: number; readonly motor: number; readonly claw: number; readonly flash: number;
}
export function lookOf(s: Pick<DockState, 'fitted'>, trial?: ItemKey | null): SubLook {
  const fitted = trial && isFitTab(tabOf(trial)) ? { ...s.fitted, [tabOf(trial)]: idOf(trial) } : s.fitted;
  const paint = PAINTS.find(p => p.id === fitted.paint)! as { color: string; color2?: string; pattern?: string };
  const stripe = STRIPES.find(p => p.id === fitted.stripes)! as { color?: string; pattern?: string };
  const trail = TRAILS.find(p => p.id === fitted.trail)! as { color: string; pattern?: string };
  const r = (t: RungTab) => rungOf({ fitted }, t);
  return {
    paint: paint.color, paint2: paint.color2, pattern: paint.pattern,
    stripes: stripe.color && stripe.pattern ? { color: stripe.color, pattern: stripe.pattern } : undefined,
    beam: BEAMS.find(b => b.id === fitted.beam)!.color, buddy: BUDDIES.find(b => b.id === fitted.buddy)!.emoji,
    trail: trail.color, trailPattern: trail.pattern,
    hull: r('hull'), lights: r('lights'), sonar: r('sonar'), motor: r('motor'), claw: r('claw'), flash: r('flash'),
  };
}
export const hornOf = (s: Pick<DockState, 'fitted'>) => s.fitted.horn as (typeof HORNS)[number]['id'];

// ---------- zones ----------

/** Does his submarine have what this zone needs? */
export function zoneOpen(s: Pick<DockState, 'fitted' | 'owned'>, z: ZoneId): boolean {
  const def = zoneOf(z), best = (t: RungTab) => Math.max(0, ...s.owned.filter(k => tabOf(k) === t).map(k => Number(idOf(k).slice(1)) || 0));
  return best('hull') >= def.hull && (!def.needs || best(def.needs.slot as RungTab) >= def.needs.rung);
}
export const openZones = (s: Pick<DockState, 'fitted' | 'owned'>) => ZONES.filter(z => zoneOpen(s, z.id)).map(z => z.id);
/** Where the next Dive goes: the zone he picked, else the newest zone with animals he hasn't met, else the deepest open. */
export function diveZone(s: DockState): ZoneId {
  if (s.zone && zoneOpen(s, s.zone)) return s.zone;
  const open = openZones(s);
  const unmet = [...open].reverse().find(z => animalsIn(z).some(a => !s.photos.includes(a.id as AnimalId)));
  return unmet ?? open[open.length - 1]!;
}
export const pickZone = (s: DockState, z: ZoneId): DockState | null => (zoneOpen(s, z) ? { ...s, zone: z } : null);

/** The animals on a Dive: some he hasn't photographed yet first (so an early Dive almost always meets someone new), then others. */
export function diveAnimals(z: ZoneId, photos: readonly string[], rng: Rng, n = 6): Animal[] {
  const all = animalsIn(z), fresh = shuffle(rng, all.filter(a => !photos.includes(a.id))), met = shuffle(rng, all.filter(a => photos.includes(a.id)));
  const take = Math.min(n, all.length), newOnes = fresh.slice(0, Math.max(Math.min(fresh.length, 3), take - met.length));
  return [...newOnes, ...met].slice(0, take);
}

// ---------- Dives ----------

/** A Round finished: one more Dive. */
export const earnDive = (s: DockState): DockState => ({ ...s, dives: s.dives + 1 });

export interface DivePay { bolts: number; fresh: AnimalId[] }
/** The Dive is over: it's used, its treasure pays, and every animal he photographed for the first time goes in his Logbook. */
export function finishDive(s: DockState, photographed: readonly AnimalId[], treasure: number): { state: DockState; pay: DivePay } {
  const fresh = [...new Set(photographed.filter(a => !s.photos.includes(a)))];
  return {
    state: { ...s, dives: Math.max(0, s.dives - 1), done: s.done + 1, photos: [...s.photos, ...fresh] },
    pay: { bolts: Math.min(TREASURES, Math.max(0, treasure)) * TREASURE_BOLTS, fresh },
  };
}
