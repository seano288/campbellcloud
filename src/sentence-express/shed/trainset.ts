// The Train Set on the saved game: what he owns, his train (an engine, the cars coupled behind it, a paint), his Layout, the
// stations open on the line and his Deliveries. A finished Round earns Bolts and one Delivery; he starts with one free Delivery so
// he sees the reward before his first purchase. A Delivery is paid, and used, only when the cargo reaches Toy Town; finishing it
// opens the next station, and the first Delivery from a station brings its gift piece of scenery. Nothing here can be lost.
import { isAmount } from '../../currency/amount';
import type { PurchaseProposal } from '../../rewards/purchase';
import { cellAt, deliverable, grow, isStraight, joined, placeStation, starterLayout, tidy, trackSquares, TRACK_SCENERY, xyOf, bits, step, opposite, type Layout, type Placed } from '../layout/track';
import { payFor } from '../delivery/run';
import { CARS, ENGINES, GIFTS, LINE, MAX_CARS, PAINTS, SCENERY, START_SQUARES, START_TABLE, STATIONS, TRACK, type StationId, type Tab } from './catalogue';

export type ItemKey = `${Tab | 'gift'}:${string}`;
export interface Item { readonly key: ItemKey; readonly tab: Tab | 'gift'; readonly id: string; readonly name: string; readonly price: number }

export const ITEMS: readonly Item[] = [
  ...ENGINES.map(e => ({ key: `engine:${e.id}` as ItemKey, tab: 'engine' as const, id: e.id as string, name: e.name as string, price: e.price as number })),
  ...CARS.map(c => ({ key: `car:${c.id}` as ItemKey, tab: 'car' as const, id: c.id as string, name: c.name as string, price: c.price as number })),
  ...PAINTS.map(p => ({ key: `paint:${p.id}` as ItemKey, tab: 'paint' as const, id: p.id as string, name: p.name as string, price: p.price as number })),
  ...TRACK.map(t => ({ key: `track:${t.id}` as ItemKey, tab: 'track' as const, id: t.id as string, name: t.name as string, price: t.price as number })),
  ...SCENERY.map(s => ({ key: `scenery:${s.id}` as ItemKey, tab: 'scenery' as const, id: s.id as string, name: s.name as string, price: s.price as number })),
  ...GIFTS.map(g => ({ key: `gift:${g.id}` as ItemKey, tab: 'gift' as const, id: g.id as string, name: g.name as string, price: 0 })),
];
export const SHOP = ITEMS.filter(i => i.tab !== 'gift');
export const item = (k: ItemKey) => ITEMS.find(i => i.key === k)!;
export const isItemKey = (x: unknown): x is ItemKey => typeof x === 'string' && ITEMS.some(i => i.key === x);
export const keyOf = (tab: Tab | 'gift', id: string) => `${tab}:${id}` as ItemKey;
export const tabOf = (k: ItemKey) => k.split(':')[0] as Tab | 'gift';
export const idOf = (k: ItemKey) => k.split(':')[1]!;
export const STARTERS: readonly ItemKey[] = SHOP.filter(i => i.price === 0).map(i => i.key);
export const keysIn = (tab: Tab) => SHOP.filter(i => i.tab === tab).map(i => i.key);
export const priceOf = (k: ItemKey) => item(k).price;
/** Everything he can buy, added up. */
export const SHOP_TOTAL = SHOP.reduce((n, i) => n + i.price, 0);

export interface TrainSet {
  owned: ItemKey[];
  engine: string;
  /** The cars coupled behind the engine, in order. */
  cars: string[];
  paint: string;
  layout: Layout;
  /** How many stations on the line are open: the Farm is open from the start. */
  open: number;
  /** Stations that have had their first Delivery (and given their gift). */
  delivered: StationId[];
  /** Deliveries earned and not run yet. */
  deliveries: number;
  trips: number;
  goal: ItemKey | null;
}

export const freshTrainSet = (): TrainSet => ({
  owned: [...STARTERS], engine: 'tank', cars: ['wagon'], paint: 'red', layout: starterLayout(START_TABLE.w, START_TABLE.h),
  open: 1, delivered: [], deliveries: 1, trips: 0, goal: null,
});
export const isOwned = (t: Pick<TrainSet, 'owned'>, k: ItemKey) => t.owned.includes(k);

// ---------- the table and the track he has ----------

/** The biggest table he owns. */
export function tableOf(t: Pick<TrainSet, 'owned'>): { w: number; h: number } {
  let best: { w: number; h: number } = START_TABLE;
  for (const r of TRACK) if ('table' in r && isOwned(t, keyOf('track', r.id)) && r.table.w * r.table.h > best.w * best.h) best = r.table;
  return best;
}
/** Track squares he has in all, laid or not. */
export const capacityOf = (t: Pick<TrainSet, 'owned'>) => START_SQUARES + TRACK.reduce((n, r) => n + ('squares' in r && isOwned(t, keyOf('track', r.id)) ? r.squares : 0), 0);
export const supplyOf = (t: Pick<TrainSet, 'owned' | 'layout'>) => Math.max(0, capacityOf(t) - trackSquares(t.layout));
/** Scenery he owns (bought, and the stations' gifts), and the pieces not on the table yet. */
export const sceneryOwned = (t: Pick<TrainSet, 'owned'>) => t.owned.filter(k => tabOf(k) === 'scenery' || tabOf(k) === 'gift').map(idOf);
export const sceneryLeft = (t: Pick<TrainSet, 'owned' | 'layout'>) => sceneryOwned(t).filter(id => !t.layout.scenery.some(s => s.id === id));
export const openStations = (t: Pick<TrainSet, 'open'>): StationId[] => ['town', ...LINE.slice(0, Math.max(1, Math.min(LINE.length, t.open))).map(s => s.id)];

// ---------- reading a save ----------

type Raw = Record<string, unknown>;
const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);
const STATION_IDS = STATIONS.map(s => s.id as string);

/** A Layout from a save: its squares must join up both ways, or it starts again from the starter loop on his table. */
function readLayout(raw: unknown, table: { w: number; h: number }, owned: readonly string[]): Layout {
  const fresh = grow(starterLayout(START_TABLE.w, START_TABLE.h), table.w, table.h);
  if (!isRecord(raw)) return fresh;
  const w = raw.w, h = raw.h, cells = raw.cells;
  if (typeof w !== 'number' || typeof h !== 'number' || !Array.isArray(cells) || cells.length !== w * h || w > 30 || h > 30) return fresh;
  if (!cells.every(m => Number.isInteger(m) && m >= 0 && m < 16)) return fresh;
  const l0 = { w, h };
  for (let c = 0; c < cells.length; c++) for (const d of bits(cells[c] as number)) {
    const n = step(l0, c, d);
    if (n < 0 || !((cells[n] as number) & opposite(d))) return fresh;
  }
  if (!cells.some(m => m)) return fresh;
  const placed = (x: unknown, ok: (id: string) => boolean): Placed[] => (Array.isArray(x) ? x : []).filter((p): p is Placed => isRecord(p) && typeof p.id === 'string' && ok(p.id) && Number.isInteger(p.cell) && (p.cell as number) >= 0 && (p.cell as number) < w * h)
    .filter((p, i, all) => all.findIndex(q => q.id === p.id) === i).map(p => ({ id: p.id, cell: p.cell }));
  const points = Array.isArray(raw.points) && raw.points.length === w * h ? raw.points.map(p => (p === 1 ? 1 : 0)) : cells.map(() => 0);
  const l = tidy({ w, h, cells: cells as number[], points, stations: placed(raw.stations, id => STATION_IDS.includes(id)), scenery: placed(raw.scenery, id => owned.includes(id)) });
  return grow(l, table.w, table.h);
}

export function readTrainSet(raw: unknown): TrainSet {
  if (!isRecord(raw)) return freshTrainSet();
  const owned = [...new Set([...STARTERS, ...(Array.isArray(raw.owned) ? raw.owned.filter(isItemKey) : [])])];
  const t0 = { owned };
  const ownsId = (tab: Tab, id: unknown) => typeof id === 'string' && owned.includes(keyOf(tab, id));
  const cars = (Array.isArray(raw.cars) ? raw.cars : ['wagon']).filter((c): c is string => ownsId('car', c)).filter((c, i, a) => a.indexOf(c) === i).slice(0, MAX_CARS);
  const open = isAmount(raw.open) && raw.open >= 1 ? Math.min(LINE.length, raw.open) : 1;
  const t: TrainSet = {
    owned, engine: ownsId('engine', raw.engine) ? raw.engine as string : 'tank', cars, paint: ownsId('paint', raw.paint) ? raw.paint as string : 'red',
    layout: readLayout(raw.layout, tableOf(t0), sceneryOwned(t0)), open,
    delivered: (Array.isArray(raw.delivered) ? raw.delivered : []).filter((s): s is StationId => typeof s === 'string' && STATION_IDS.includes(s) && s !== 'town'),
    deliveries: isAmount(raw.deliveries) ? raw.deliveries : 0, trips: isAmount(raw.trips) ? raw.trips : 0,
    goal: isItemKey(raw.goal) && !owned.includes(raw.goal) ? raw.goal : null,
  };
  return placeOpen(t);
}

/** His Layout after a change he made on the table. Track drawn through a station (or rubbed out under it) takes it off its
 *  straight; it goes back on the table rather than vanishing until the next Delivery. */
export const withLayout = (t: TrainSet, layout: Layout): TrainSet => placeOpen({ ...t, layout });

/** Every open station is on the table. */
export function placeOpen(t: TrainSet): TrainSet {
  let layout = t.layout;
  for (const id of openStations(t)) layout = placeStation(layout, id);
  return layout === t.layout ? t : { ...t, layout };
}

// ---------- buying ----------

/** What he's saving for: what he picked, or the cheapest thing he hasn't got (a new engine, car or piece of scenery before a paint). */
export function goalOf(t: Pick<TrainSet, 'owned' | 'goal'>): ItemKey | null {
  if (t.goal && !isOwned(t, t.goal)) return t.goal;
  const left = SHOP.filter(i => !isOwned(t, i.key)).sort((a, b) => a.price - b.price);
  return (left.find(i => i.tab !== 'paint' && i.tab !== 'track') ?? left[0])?.key ?? null;
}
export function selectGoal(t: TrainSet, k: ItemKey): TrainSet {
  if (isOwned(t, k)) throw new Error('A Goal is something he has not got');
  return { ...t, goal: k };
}
export const allOwned = (t: Pick<TrainSet, 'owned'>) => SHOP.every(i => isOwned(t, i.key));

/** Puts what he just got to use: an engine goes on, a car is coupled if there's room, a paint goes on, a bigger table grows. */
export function use(t: TrainSet, k: ItemKey): TrainSet {
  const tab = tabOf(k), id = idOf(k);
  if (!isOwned(t, k)) return t;
  if (tab === 'engine') return { ...t, engine: id };
  if (tab === 'paint') return { ...t, paint: id };
  if (tab === 'car') return t.cars.includes(id) ? { ...t, cars: t.cars.filter(c => c !== id) } : t.cars.length < MAX_CARS ? { ...t, cars: [...t.cars, id] } : t;
  if (tab === 'track') { const table = tableOf(t); return { ...t, layout: grow(t.layout, table.w, table.h) }; }
  return t;
}

export type PurchaseFailure = 'invalid-item' | 'invalid-balance' | 'insufficient-funds' | 'already-owned';
export function proposePurchase(t: TrainSet, k: ItemKey, balance: number): PurchaseProposal<TrainSet, PurchaseFailure> {
  if (!isAmount(balance)) return { kind: 'rejected', reason: 'invalid-balance' };
  if (!isItemKey(k) || tabOf(k) === 'gift') return { kind: 'rejected', reason: 'invalid-item' };
  if (isOwned(t, k)) return { kind: 'rejected', reason: 'already-owned' };
  const cost = priceOf(k);
  if (balance < cost) return { kind: 'rejected', reason: 'insufficient-funds' };
  const bought = { ...t, owned: [...t.owned, k], goal: t.goal === k ? null : t.goal };
  // a car he buys is coupled (if there's room); an engine or paint goes on; a table grows
  return { kind: 'ready', cost, state: tabOf(k) === 'car' && t.cars.includes(idOf(k)) ? bought : use(bought, k) };
}

// ---------- scenery on the table ----------

/** Can this piece go on this square: track pieces on a straight without a station, the rest on an empty square. */
export function canPlace(l: Layout, id: string, cell: number): boolean {
  if (cell < 0 || cell >= l.cells.length || l.scenery.some(s => s.cell === cell)) return false;
  if (TRACK_SCENERY.has(id)) return isStraight(l.cells[cell]!) && !l.stations.some(s => s.cell === cell);
  return !l.cells[cell];
}
export const placeScenery = (l: Layout, id: string, cell: number): Layout => (canPlace(l, id, cell) ? { ...l, scenery: [...l.scenery.filter(s => s.id !== id), { id, cell }] } : l);
export const liftScenery = (l: Layout, cell: number): Layout => ({ ...l, scenery: l.scenery.filter(s => s.cell !== cell) });

/** An empty square near this one, for a gift to appear on. */
export function freeNear(l: Layout, cell: number, id: string): number {
  const at = xyOf(l, cell);
  let best = -1, bestD = 1e9;
  for (let c = 0; c < l.cells.length; c++) {
    if (!canPlace(l, id, c)) continue;
    const p = xyOf(l, c), d = Math.abs(p.x - at.x) + Math.abs(p.y - at.y);
    if (d < bestD) { best = c; bestD = d; }
  }
  return best;
}

// ---------- a Delivery ----------

/** Which station's cargo the next Delivery picks up: the newest open one not yet delivered from, or each in turn. */
export function pickupFor(t: Pick<TrainSet, 'open' | 'delivered' | 'trips'>): StationId {
  const open = openStations(t).filter(s => s !== 'town');
  return open.find(s => !t.delivered.includes(s)) ?? open[t.trips % open.length]!;
}

export interface Plan { layout: Layout; pickup: StationId; pickupCell: number; townCell: number; fixed: boolean }

/**
 * Gets his Layout ready for a Delivery: every open station on it, and the pickup somewhere the train can reach from Toy Town and get
 * back from. If it isn't, the pickup station moves to a square that works; if none does (he has taken his track apart), the starter
 * loop goes back on the table (`fixed`).
 */
export function planDelivery(t: TrainSet): Plan {
  const pickup = pickupFor(t);
  const tryLayout = (l0: Layout): Plan | null => {
    let l = l0;
    for (const id of openStations(t)) l = placeStation(l, id);
    const town = l.stations.find(s => s.id === 'town')?.cell, at = l.stations.find(s => s.id === pickup)?.cell;
    if (town === undefined) return null;
    if (at !== undefined && deliverable(l, town, at) !== null) return { layout: l, pickup, pickupCell: at, townCell: town, fixed: false };
    // move the pickup to a square that works, the farthest from Toy Town first
    const taken = new Set([...l.stations.map(s => s.cell), ...l.scenery.map(s => s.cell)]);
    const tp = xyOf(l, town), far = (c: number) => { const p = xyOf(l, c); return Math.abs(p.x - tp.x) + Math.abs(p.y - tp.y); };
    const spots = [...joined(l, town)].filter(c => isStraight(l.cells[c]!) && !taken.has(c)).sort((a, b) => far(b) - far(a));
    for (const c of spots) if (deliverable(l, town, c) !== null) {
      return { layout: { ...l, stations: [...l.stations.filter(s => s.id !== pickup), { id: pickup, cell: c }] }, pickup, pickupCell: c, townCell: town, fixed: false };
    }
    return null;
  };
  const plan = tryLayout(t.layout);
  if (plan) return plan;
  // the starter loop back on his table (the first table's loop, in the middle, so it never takes more track than he has), his
  // scenery kept where it doesn't sit on the loop
  const start = grow(starterLayout(START_TABLE.w, START_TABLE.h), t.layout.w, t.layout.h);
  const merged = tidy({ ...start, scenery: t.layout.scenery.filter(s => !start.cells[s.cell] || TRACK_SCENERY.has(s.id)) });
  return { ...tryLayout(merged)!, fixed: true };
}

export interface DeliveryPay { bolts: number; pickup: StationId; gift: string | null; opened: StationId | null }

/** The cargo is in Toy Town: pay, use the Delivery, give the gift on a station's first Delivery, open the next station. */
export function finishDelivery(t: TrainSet, plan: Pick<Plan, 'layout' | 'pickup'>): { state: TrainSet; pay: DeliveryPay } {
  const first = !t.delivered.includes(plan.pickup);
  const gift = first ? STATIONS.find(s => s.id === plan.pickup)?.gift ?? null : null;
  let layout = plan.layout;
  const owned = gift && !t.owned.includes(keyOf('gift', gift.id)) ? [...t.owned, keyOf('gift', gift.id)] : t.owned;
  if (gift) {
    const near = freeNear(layout, layout.stations.find(s => s.id === plan.pickup)?.cell ?? 0, gift.id);
    if (near >= 0) layout = placeScenery(layout, gift.id, near);
  }
  const opened = t.open < LINE.length ? LINE[t.open]!.id : null;
  const open = opened ? t.open + 1 : t.open;
  if (opened) layout = placeStation(layout, opened);
  const pay: DeliveryPay = { bolts: payFor(t.cars.length), pickup: plan.pickup, gift: gift?.id ?? null, opened };
  return {
    state: { ...t, owned, layout, open, delivered: first ? [...t.delivered, plan.pickup] : t.delivered, deliveries: Math.max(0, t.deliveries - 1), trips: t.trips + 1 },
    pay,
  };
}

/** A Round finished: one more Delivery. */
export const earnDelivery = (t: TrainSet): TrainSet => ({ ...t, deliveries: t.deliveries + 1 });
export { cellAt };
