// The Airfield, the Shows and the Wall on the saved game. A finished Round earns Bolts and one Show (he starts with one free). A Show is
// flown at a place he has opened; flying one he hasn't flown before puts its patch on his Wall and opens the next place. Bolts buy planes
// and parts, which are fitted to his plane (one in each slot), Gear he switches on and off, and things for his Wall. After a Show's rings
// the sky is his to draw on in smoke, and he can keep what he drew as a postcard on the Wall.
//
// A Show is used, and paid, only when its rings are done; leaving halfway costs nothing and pays nothing. Nothing he owns can be lost.
// A postcard comes down only when he takes it down himself.
import { isAmount } from '../../currency/amount';
import type { PurchaseProposal } from '../../rewards/purchase';
import { isShowId, SHOW_IDS, SHOWS, type ShowId } from '../show/places';
import {
  ENGINES, FITTED_TABS, GEAR, isItemKey, item, keyOf, PLANES, PROPS, SHAPES, SMOKES, STARTERS, TABLES, TANKS, TRICKS, WINGS, FOR_SALE,
  type FittedTab, type GearId, type IdOf, type Item, type ItemKey, type ShapeId, type SmokeId, type Tab,
} from './parts';

/** A drawing he kept from Free Sky: which Show it was over, its smoke, and its strokes as points 0 to 255 across the sky (x, y pairs;
 *  -1 starts a new stroke). */
export interface Postcard { readonly show: ShowId; readonly smoke: SmokeId; readonly shape: ShapeId; readonly pts: readonly number[] }
export const MAX_POSTCARDS = 24;
/** The most points a postcard keeps (pairs). */
export const POSTCARD_POINTS = 700;

export type Fitted = { [T in FittedTab]: IdOf<T> };

export interface AirfieldState {
  owned: ItemKey[];
  fitted: Fitted;
  /** Gear he has switched off. */
  off: GearId[];
  /** Shows earned and not flown yet. */
  shows: number;
  /** How many places are open, in order (1 to 16). */
  opened: number;
  /** The places he has flown a Show at (their patches are on his Wall). */
  flown: ShowId[];
  /** Shows flown in all. */
  done: number;
  /** The place he picked to fly next. */
  pick: ShowId | null;
  postcards: Postcard[];
  goal: ItemKey | null;
}

const FIRST: Fitted = { plane: 'biplane', engine: 'e0', wings: 'w0', tank: 't0', prop: 'p0', smoke: 'white', shape: 'plain', paint: 'red', pilot: 'kid', trick: 'loop' };
export const freshAirfield = (): AirfieldState => ({
  owned: [...STARTERS], fitted: { ...FIRST }, off: [], shows: 1, opened: 1, flown: [], done: 0, pick: null, postcards: [], goal: null,
});
export const isOwned = (s: Pick<AirfieldState, 'owned'>, k: ItemKey) => s.owned.includes(k);

type Raw = Record<string, unknown>;
const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);

function readPostcard(raw: unknown): Postcard | null {
  if (!isRecord(raw) || !isShowId(raw.show) || !Array.isArray(raw.pts)) return null;
  const pts = raw.pts.filter((n): n is number => Number.isInteger(n) && n >= -1 && n <= 255).slice(0, POSTCARD_POINTS * 2 + 200);
  if (pts.length < 4) return null;
  const smoke = SMOKES.some(x => x.id === raw.smoke) ? raw.smoke as SmokeId : 'white', shape = SHAPES.some(x => x.id === raw.shape) ? raw.shape as ShapeId : 'plain';
  return { show: raw.show, smoke, shape, pts };
}

/** Whatever is missing or doesn't read comes back fresh. Nothing he doesn't own is fitted, and no more places are open than he has
 *  flown his way to. */
export function readAirfield(raw: unknown): AirfieldState {
  const fresh = freshAirfield();
  if (!isRecord(raw)) return fresh;
  const owned = [...new Set([...STARTERS, ...(Array.isArray(raw.owned) ? raw.owned.filter(isItemKey) : [])])];
  const rawFitted = isRecord(raw.fitted) ? raw.fitted : {};
  const fitted = Object.fromEntries(FITTED_TABS.map(t => {
    const id = rawFitted[t];
    return [t, typeof id === 'string' && owned.includes(`${t}:${id}` as ItemKey) ? id : fresh.fitted[t]];
  })) as Fitted;
  const flown = [...new Set(Array.isArray(raw.flown) ? raw.flown.filter(isShowId) : [])];
  const reached = Math.min(SHOWS.length, Math.max(1, ...flown.map(f => SHOW_IDS.indexOf(f) + 2)));
  const opened = Math.max(1, Math.min(SHOWS.length, reached, isAmount(raw.opened) ? raw.opened : reached));
  return {
    owned, fitted,
    off: [...new Set(Array.isArray(raw.off) ? raw.off.filter((x): x is GearId => GEAR.some(g => g.id === x)) : [])],
    shows: isAmount(raw.shows) ? raw.shows : 0, opened, flown,
    done: isAmount(raw.done) ? raw.done : 0,
    pick: isShowId(raw.pick) && SHOW_IDS.indexOf(raw.pick) < opened ? raw.pick : null,
    postcards: (Array.isArray(raw.postcards) ? raw.postcards.map(readPostcard).filter((p): p is Postcard => !!p) : []).slice(0, MAX_POSTCARDS),
    goal: isItemKey(raw.goal) && !owned.includes(raw.goal) ? raw.goal : null,
  };
}

// ---------- the plane he flies ----------

const kOf = (table: readonly (Item & { k: number })[], id: string) => table.find(x => x.id === id)?.k ?? 1;
export const hasGear = (s: Pick<AirfieldState, 'owned' | 'off'>, g: GearId) => isOwned(s, keyOf('gear', g)) && !s.off.includes(g);

/** How his plane flies, from what's fitted: speed (world units a second), how fast it turns (radians a second), how long its smoke trail
 *  is, and how quickly it gets up to speed. */
export function flight(s: Pick<AirfieldState, 'fitted'>) {
  const plane = PLANES.find(p => p.id === s.fitted.plane) ?? PLANES[0];
  return {
    speed: 330 * kOf(ENGINES, s.fitted.engine) * plane.speed,
    turn: 2.6 * kOf(WINGS, s.fitted.wings) * plane.turn,
    trail: kOf(TANKS, s.fitted.tank),
    accel: kOf(PROPS, s.fitted.prop),
  };
}

// ---------- Shows ----------

/** Bolts a finished Show pays (for the parent to confirm). */
export const SHOW_BOLTS = 2;

export const openShows = (s: Pick<AirfieldState, 'opened'>): ShowId[] => SHOW_IDS.slice(0, s.opened);
/** Where the next Show is: the place he picked, else the newest place he hasn't flown, else the newest open one. */
export function nextShow(s: Pick<AirfieldState, 'opened' | 'flown' | 'pick'>): ShowId {
  const open = openShows(s);
  if (s.pick && open.includes(s.pick)) return s.pick;
  return open.find(id => !s.flown.includes(id)) ?? open.at(-1)!;
}
export const earnShow = (s: AirfieldState): AirfieldState => ({ ...s, shows: s.shows + 1 });

/** A Show's rings are done: the Show is used; a place he hadn't flown gets its patch and opens the next place. Null if he had no Show. */
export function finishShow(s: AirfieldState, at: ShowId): { state: AirfieldState; patch: boolean; opens: ShowId | null } | null {
  if (s.shows < 1 || SHOW_IDS.indexOf(at) >= s.opened) return null;
  const patch = !s.flown.includes(at), flown = patch ? [...s.flown, at] : s.flown;
  const opens = patch && s.opened < SHOWS.length ? SHOW_IDS[s.opened]! : null;
  return { state: { ...s, shows: s.shows - 1, done: s.done + 1, flown, opened: opens ? s.opened + 1 : s.opened, pick: null }, patch, opens };
}

// ---------- postcards ----------

export function keepPostcard(s: AirfieldState, card: Postcard): AirfieldState | null {
  if (s.postcards.length >= MAX_POSTCARDS || card.pts.length < 4) return null;
  return { ...s, postcards: [...s.postcards, { ...card, pts: card.pts.slice(0, POSTCARD_POINTS * 2 + 200) }] };
}
export const takeDown = (s: AirfieldState, i: number): AirfieldState | null =>
  (i >= 0 && i < s.postcards.length ? { ...s, postcards: s.postcards.filter((_, j) => j !== i) } : null);

// ---------- buying, fitting and switching ----------

export type Failure = 'owned' | 'unknown' | 'short';
const isFittedTab = (t: Tab): t is FittedTab => (FITTED_TABS as readonly Tab[]).includes(t);

/** Buying something: it's his, and a part goes straight on the plane. */
export const proposePurchase = (s: AirfieldState, k: ItemKey, balance: number): PurchaseProposal<AirfieldState, Failure> => {
  if (!isItemKey(k)) return { kind: 'rejected', reason: 'unknown' };
  if (isOwned(s, k)) return { kind: 'rejected', reason: 'owned' };
  const price = item(k).price;
  if (balance < price) return { kind: 'rejected', reason: 'short' };
  const next = { ...s, owned: [...s.owned, k], goal: s.goal === k ? null : s.goal };
  return { kind: 'ready', cost: price, state: fit(next, k) ?? next };
};

/** Fits something he owns. Null if he doesn't own it or it isn't a part that's fitted. */
export function fit(s: AirfieldState, k: ItemKey): AirfieldState | null {
  if (!isOwned(s, k)) return null;
  const [tab, id] = k.split(':') as [Tab, string];
  if (!isFittedTab(tab)) return null;
  // Loop and Roll have their own buttons: picking one of them leaves the third button as it was
  if (tab === 'trick' && (id === 'loop' || id === 'roll')) return null;
  return { ...s, fitted: { ...s.fitted, [tab]: id } as Fitted };
}

/** Switches Gear he owns on or off. */
export function toggle(s: AirfieldState, g: GearId): AirfieldState | null {
  if (!isOwned(s, keyOf('gear', g))) return null;
  return { ...s, off: s.off.includes(g) ? s.off.filter(x => x !== g) : [...s.off, g] };
}

/** The Goal: what he picked, else the next Engine, Wings, Tank or Propeller Rung (they change how it flies), else the cheapest thing left. */
export function goalOf(s: Pick<AirfieldState, 'owned' | 'goal'>): ItemKey | null {
  if (s.goal && !isOwned(s, s.goal)) return s.goal;
  const rungs = (['engine', 'wings', 'tank', 'prop'] as const).flatMap(t => (TABLES[t] as readonly Item[]).filter(i => !isOwned(s, `${t}:${i.id}` as ItemKey)).slice(0, 1).map(i => ({ k: `${t}:${i.id}` as ItemKey, price: i.price })));
  if (rungs.length) return rungs.sort((a, b) => a.price - b.price)[0]!.k;
  return FOR_SALE.filter(k => !isOwned(s, k)).sort((a, b) => item(a).price - item(b).price)[0] ?? null;
}

/** The trick on the third button (he starts with none: the button shows once he has one). */
export const specialTrick = (s: Pick<AirfieldState, 'fitted'>) => (s.fitted.trick === 'loop' || s.fitted.trick === 'roll' ? null : s.fitted.trick);
export { TRICKS };
