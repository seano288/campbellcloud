// The Port on the saved game: what he has built and bought, his Fleet and how each ship is dressed, his crane and its parts, the Ships he
// has earned to load, the harbours his ships have sailed to and the flags they brought back, the crates, the tonnage, his bests and his
// Trophies.
//
// A finished Round earns Bolts and one Ship to load. Bolts buy pieces, cranes, parts, ships, paints and container looks. Each loaded Ship
// sails to the next harbour on the sea chart (named ones first, then the chart without end) and brings something back: a crate from a
// named harbour, a flag from every harbour, and a special crate every fifth go. Every container loaded adds to the tonnage counter, with a
// new port rank at each milestone, without end. A Ship is only used when it sails, so leaving halfway costs nothing; nothing is ever lost.
import { isAmount } from '../../currency/amount';
import type { PurchaseProposal } from '../../rewards/purchase';
import { type BoxLook } from '../art/container';
import { SHIP_KINDS, type ShipKind, type ShipLook } from '../art/ship';
import type { CraneLook } from '../crane/render';
import { capacity, type CraneSpec, type ShipShape } from '../crane/sim';
import { pick, seeded } from '../../game/rng';
import {
  BOX_COLOURS, CRANE_PAINTS, CRANES, craneSpec, FOR_SALE, isItemId, itemOf, LOGOS, MARKS, PAINTS, PARTS, PIECES, REPEAT_IDS, repeatOf, repeatPrice,
  SHIP_NAMES, SHIP_SHAPES, SHIPS, STARTERS, STRIPE_ITEMS, type Item, type RepeatId,
} from './catalog';
import { chartHarbour, CRATES, HARBOURS, harbourById, isSpecialId, specialById, specialFor, visitor, type Crate, type Harbour, type Special, type Visitor } from './sea';

export interface Dress { name: number; hull: string; mark: string }
export interface Bests {
  /** The tallest stack he has built on a ship. */
  stack: number;
  /** His quickest loading of each size of ship, in seconds. */
  quick: Partial<Record<SizeClass, number>>;
}
export const SIZE_CLASSES = ['small', 'middle', 'big', 'giant'] as const;
export type SizeClass = (typeof SIZE_CLASSES)[number];
export const sizeOf = (s: ShipShape): SizeClass => { const n = capacity(s); return n <= 3 ? 'small' : n <= 6 ? 'middle' : n <= 9 ? 'big' : 'giant'; };

export interface PortState {
  /** Catalogue items bought, crates and special prizes won. */
  owned: string[];
  more: Record<RepeatId, number>;
  fleet: Partial<Record<ShipKind, Dress>>;
  /** The crane he works with, and how it's dressed. */
  crane: string;
  cranePaint: string;
  lights: string;
  horn: string;
  /** His own ship to sail on the next go, or null for a visiting ship. */
  next: ShipKind | null;
  goal: string | null;
  /** Ships earned and not loaded yet. */
  ships: number;
  /** Goes finished, ever (the next go's number is this + 1). */
  goes: number;
  /** Named harbours sailed to, and the next chart harbour. */
  visited: string[];
  chart: number;
  tonnes: number;
  bests: Bests;
  trophies: string[];
  /** For "Watch it run" and Home: where the last ship went. */
  last: string | null;
}

/** He starts with one free Ship, so he sees the reward before his first purchase. */
export const FIRST_SHIPS = 1;
const freshDress = (i: number): Dress => ({ name: i % SHIP_NAMES.length, hull: 'paint:none', mark: 'mark:none' });
export const freshPort = (): PortState => ({
  owned: [...STARTERS], more: { berth: 0, block: 0, shed: 0, rail: 0, crane: 0 }, fleet: { tug: freshDress(0) }, crane: 'crane:dock',
  cranePaint: 'cranepaint:yellow', lights: 'part:nolights', horn: 'part:toot', next: 'tug', goal: null, ships: FIRST_SHIPS, goes: 0,
  visited: [], chart: HARBOURS.length + 1, tonnes: 0, bests: { stack: 0, quick: {} }, trophies: [], last: null,
});

type Raw = Record<string, unknown>;
const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);
const count = (x: unknown, max = Number.MAX_SAFE_INTEGER) => (isAmount(x) ? Math.min(x as number, max) : 0);
const isPrize = (x: unknown) => typeof x === 'string' && (CRATES.some(c => c.id === x) || isSpecialId(x));

/** Whatever is missing or doesn't read comes back fresh; nothing he doesn't own can be used. */
export function readPort(raw: unknown): PortState {
  const f = freshPort();
  if (!isRecord(raw)) return f;
  const owned = [...new Set([...STARTERS, ...(Array.isArray(raw.owned) ? raw.owned.filter(x => isItemId(x) || isPrize(x)) as string[] : [])])];
  const has = (id: unknown): id is string => typeof id === 'string' && owned.includes(id);
  const more = isRecord(raw.more) ? raw.more : {}, fl = isRecord(raw.fleet) ? raw.fleet : {};
  const fleet: PortState['fleet'] = {};
  for (const k of SHIP_KINDS) {
    if (!has(`ship:${k}`)) continue;
    const d = isRecord(fl[k]) ? fl[k] as Raw : {}, fresh = freshDress(SHIP_KINDS.indexOf(k));
    fleet[k] = {
      name: typeof d.name === 'number' && Number.isInteger(d.name) && d.name >= 0 && d.name < SHIP_NAMES.length ? d.name : fresh.name,
      hull: has(d.hull) && String(d.hull).startsWith('paint:') ? d.hull as string : fresh.hull,
      mark: has(d.mark) && String(d.mark).startsWith('mark:') ? d.mark as string : fresh.mark,
    };
  }
  const goal = typeof raw.goal === 'string' && (raw.goal.startsWith('more:') ? REPEAT_IDS.includes(raw.goal.slice(5) as RepeatId) : isItemId(raw.goal) && !has(raw.goal)) ? raw.goal : null;
  const bests = isRecord(raw.bests) ? raw.bests : {}, quick = isRecord(bests.quick) ? bests.quick : {};
  return {
    owned, more: Object.fromEntries(REPEAT_IDS.map(id => [id, count(more[id], 999)])) as PortState['more'], fleet,
    crane: has(raw.crane) && String(raw.crane).startsWith('crane:') ? raw.crane as string : f.crane,
    cranePaint: has(raw.cranePaint) && String(raw.cranePaint).startsWith('cranepaint:') ? raw.cranePaint as string : f.cranePaint,
    lights: has(raw.lights) && PARTS.some(p => p.id === raw.lights && p.slot === 'lights') ? raw.lights as string : f.lights,
    horn: has(raw.horn) && PARTS.some(p => p.id === raw.horn && p.slot === 'horn') ? raw.horn as string : f.horn,
    next: typeof raw.next === 'string' && has(`ship:${raw.next}`) ? raw.next as ShipKind : null,
    goal, ships: count(raw.ships, 99), goes: count(raw.goes),
    visited: Array.isArray(raw.visited) ? HARBOURS.map(x => x.id).filter(id => (raw.visited as unknown[]).includes(id)) : [],
    chart: Math.max(HARBOURS.length + 1, count(raw.chart, 10_000_000)), tonnes: count(raw.tonnes),
    bests: { stack: count(bests.stack, 99), quick: Object.fromEntries(SIZE_CLASSES.flatMap(k => (isAmount(quick[k]) && (quick[k] as number) > 0 ? [[k, Math.min(9999, quick[k] as number)]] : []))) },
    trophies: Array.isArray(raw.trophies) ? TROPHIES.map(t => t.id).filter(id => (raw.trophies as unknown[]).includes(id)) : [],
    last: typeof raw.last === 'string' ? raw.last : null,
  };
}

export const has = (p: Pick<PortState, 'owned'>, id: string) => p.owned.includes(id);

// ---------- buying ----------

export type Want = { kind: 'item'; id: string } | { kind: 'more'; id: RepeatId };
export const wantKey = (w: Want) => (w.kind === 'item' ? w.id : `more:${w.id}`);
export const wantOf = (key: string): Want => (key.startsWith('more:') ? { kind: 'more', id: key.slice(5) as RepeatId } : { kind: 'item', id: key });
/** Berths he has: the wooden pier, and each berth bought. A ship needs a free one. */
export const berths = (p: Pick<PortState, 'owned' | 'more'>) => 1 + PIECES.filter(x => x.does === 'berth' && has(p, x.id)).length + p.more.berth;
export const fleetKinds = (p: Pick<PortState, 'owned'>) => SHIP_KINDS.filter(k => has(p, `ship:${k}`));
/** What it needs first, if he hasn't got it: another piece, or (for a ship) a free berth. */
export function missingNeed(p: Pick<PortState, 'owned' | 'more'>, w: Want): string | null {
  const needs = w.kind === 'item' ? itemOf(w.id).needs : repeatOf(w.id).needs;
  if (needs && !has(p, needs)) return needs;
  if (w.kind === 'item' && itemOf(w.id).cat === 'ship' && fleetKinds(p).length >= berths(p)) return 'berth';
  return null;
}
export const priceOf = (p: Pick<PortState, 'more'>, w: Want) => (w.kind === 'item' ? itemOf(w.id).price : repeatPrice(w.id, p.more[w.id]));
export const isNew = (p: Pick<PortState, 'owned'>, w: Want) => w.kind === 'more' || !has(p, w.id);
export const buyable = (p: Pick<PortState, 'owned' | 'more'>, w: Want) => isNew(p, w) && !missingNeed(p, w) && (w.kind === 'more' || itemOf(w.id).price > 0);
export const shopNow = (p: Pick<PortState, 'owned' | 'more'>): Want[] =>
  FOR_SALE.filter(i => buyable(p, { kind: 'item', id: i.id })).sort((x, y) => x.price - y.price).map(i => ({ kind: 'item', id: i.id }));
export const repeatsNow = (p: Pick<PortState, 'owned' | 'more'>): Want[] =>
  REPEAT_IDS.map(id => ({ kind: 'more', id }) as Want).filter(w => buyable(p, w)).sort((x, y) => priceOf(p, x) - priceOf(p, y));
export const catalogueDone = (p: Pick<PortState, 'owned'>) => FOR_SALE.every(i => has(p, i.id));

/** His Goal: what he tapped and couldn't afford, else the cheapest new thing, else the cheapest again-and-again thing. */
export function goalOf(p: PortState): Want | null {
  if (p.goal) { const w = wantOf(p.goal); if (buyable(p, w)) return w; }
  return shopNow(p)[0] ?? repeatsNow(p)[0] ?? null;
}
export const selectGoal = (p: PortState, w: Want): PortState => ({ ...p, goal: wantKey(w) });

export type PurchaseFailure = 'invalid-item' | 'invalid-balance' | 'insufficient-funds' | 'already-owned' | 'not-yet';
export function proposePurchase(p: PortState, w: Want, balance: number): PurchaseProposal<PortState, PurchaseFailure> {
  if (!isAmount(balance)) return { kind: 'rejected', reason: 'invalid-balance' };
  if (w.kind === 'item' ? !isItemId(w.id) || itemOf(w.id).price <= 0 : !REPEAT_IDS.includes(w.id)) return { kind: 'rejected', reason: 'invalid-item' };
  if (!isNew(p, w)) return { kind: 'rejected', reason: 'already-owned' };
  if (missingNeed(p, w)) return { kind: 'rejected', reason: 'not-yet' };
  const cost = priceOf(p, w);
  if (balance < cost) return { kind: 'rejected', reason: 'insufficient-funds' };
  return { kind: 'ready', cost, state: bought(p, w) };
}
/** Buying puts it to use: a ship joins the Fleet and sails next, a crane or a part goes on, a paint goes on the ship he sails next. */
export function bought(p: PortState, w: Want): PortState {
  const goal = p.goal === wantKey(w) ? null : p.goal;
  if (w.kind === 'more') return withTrophies({ ...p, more: { ...p.more, [w.id]: p.more[w.id] + 1 }, goal });
  const item = itemOf(w.id);
  let next: PortState = { ...p, owned: [...p.owned, w.id], goal };
  if (item.cat === 'ship') next = { ...next, fleet: { ...next.fleet, [item.kind]: freshDress(SHIP_KINDS.indexOf(item.kind)) }, next: canLoad(next, item.kind) ? item.kind : next.next };
  if (item.cat === 'crane') next = { ...next, crane: item.id };
  if (item.cat === 'cranepaint') next = { ...next, cranePaint: item.id };
  if (item.cat === 'part' && item.slot === 'lights') next = { ...next, lights: item.id };
  if (item.cat === 'part' && item.slot === 'horn') next = { ...next, horn: item.id };
  const dressed = p.next ?? fleetKinds(p).at(-1) ?? 'tug';
  if (item.cat === 'paint') next = dress(next, dressed, { hull: item.id });
  if (item.cat === 'mark') next = dress(next, dressed, { mark: item.id });
  return withTrophies(next);
}
export function dress(p: PortState, k: ShipKind, change: Partial<Dress>): PortState {
  const d = p.fleet[k];
  if (!d) return p;
  for (const v of [change.hull, change.mark]) if (typeof v === 'string' && !v.endsWith(':none') && !has(p, v)) return p;
  return { ...p, fleet: { ...p.fleet, [k]: { ...d, ...change } } };
}
/** Picks one of his own ships to sail on the next go (or null: a visitor). */
export const sailNext = (p: PortState, k: ShipKind | null): PortState => (k === null || (has(p, `ship:${k}`) && canLoad(p, k)) ? { ...p, next: k } : p);

// ---------- the crane ----------

export const craneItem = (p: Pick<PortState, 'crane'>) => CRANES.find(c => c.id === p.crane) ?? CRANES[0];
/** The biggest ship his crane reaches. */
export const reachOf = (p: Pick<PortState, 'crane'>): ShipShape => craneItem(p).reach;
/** A ship he owns can be loaded when his crane reaches it. */
export const canLoad = (p: Pick<PortState, 'crane'>, k: ShipKind) => { const s = SHIP_SHAPES[k], r = reachOf(p); return s.cols <= r.cols && s.tiers <= r.tiers; };
export const specOf = (p: Pick<PortState, 'owned'>): CraneSpec => craneSpec(id => has(p, id));
export function craneLook(p: PortState): CraneLook {
  const paint = CRANE_PAINTS.find(c => c.id === p.cranePaint)?.hex ?? '#ffcc00';
  const lights = PARTS.find(x => x.id === p.lights);
  return { paint, kind: craneItem(p).kind, lights: lights && 'hex' in lights && lights.hex ? (lights.hex === 'rainbow' ? '#ff4fd8' : lights.hex) : null };
}

// ---------- the ship, and where it sails ----------

export function shipLook(p: PortState, k: ShipKind): ShipLook {
  const d = p.fleet[k] ?? freshDress(0);
  const hull = PAINTS.find(x => x.id === d.hull)?.hex ?? DEFAULT_HULL[k];
  return { kind: k, hull, trim: '#ffffff', funnel: '#ffd23f', mark: MARKS.find(x => x.id === d.mark)?.glyph ?? '', name: SHIP_NAMES[d.name] ?? '' };
}
const DEFAULT_HULL: Record<ShipKind, string> = {
  tug: '#e63946', fishing: '#2f6fb5', research: '#f4f4f0', ferry: '#f4f4f0', feeder: '#2f6fb5', icebreaker: '#c8302a', tanker: '#262626',
  carcarrier: '#1f8a6a', boxship: '#1d3a6e', liner: '#f8f8f8',
};

/** The next named harbour he can sail to (in order, a harbour waiting for a piece is skipped), or the next chart harbour. */
export function nextHarbour(p: Pick<PortState, 'owned' | 'visited' | 'chart'>): Harbour {
  return HARBOURS.find(x => !p.visited.includes(x.id) && (!x.needs || has(p, x.needs))) ?? chartHarbour(p.chart);
}
/** Named harbours still waiting for a piece. */
export const waiting = (p: Pick<PortState, 'owned' | 'visited'>) => HARBOURS.filter(x => !p.visited.includes(x.id) && x.needs && !has(p, x.needs));

export interface GoPlan { n: number; harbour: Harbour; own: ShipKind | null; look: ShipLook; shape: ShipShape; visitor: Visitor | null; special: Special | null }
/** The next go: its number, where it sails, and the ship at the quay. */
export function planGo(p: PortState): GoPlan {
  const n = p.goes + 1, harbour = nextHarbour(p), sp = specialFor(n);
  const special = sp && !has(p, sp.id) ? sp : null;
  if (p.next && has(p, `ship:${p.next}`) && canLoad(p, p.next)) return { n, harbour, own: p.next, look: shipLook(p, p.next), shape: SHIP_SHAPES[p.next], visitor: null, special };
  const v = visitor(n, reachOf(p));
  return { n, harbour, own: null, look: v.look, shape: v.shape, visitor: v, special };
}

/** The container looks he can make from what he owns: a colour, a stripe and a company mark, chosen separately. */
export function boxLooks(p: Pick<PortState, 'owned'>): { colours: string[]; stripes: BoxLook['stripe'][]; marks: string[] } {
  const crates = CRATES.filter(x => has(p, x.id)), specials = p.owned.map(id => specialById(id)).filter((x): x is Special => !!x);
  return {
    colours: [...BOX_COLOURS.filter(x => has(p, x.id)).map(x => x.hex), ...crates.filter(x => x.kind === 'box').map(x => x.hex!), ...specials.filter(x => x.kind === 'box').map(x => x.hex!)],
    stripes: [...STRIPE_ITEMS.filter(x => has(p, x.id)).map(x => x.stripe), ...crates.filter(x => x.kind === 'stripe').map(x => x.glyph as BoxLook['stripe'])],
    marks: [...LOGOS.filter(x => has(p, x.id)).map(x => x.glyph), ...crates.filter(x => x.kind === 'logo').map(x => x.glyph!), ...specials.filter(x => x.kind === 'logo').map(x => x.icon)],
  };
}
/** The look of each container in go `n`: seeded, so the same go looks the same after a reload; a Lucky Container he owns now and then. */
export function boxLookFor(p: Pick<PortState, 'owned'>, n: number, i: number): BoxLook {
  const parts = boxLooks(p), rng = seeded(n * 31337 + i * 101 + 7);
  const lucky = p.owned.filter(id => id.startsWith('lucky:'));
  if (lucky.length && rng() < 0.15) { const l = specialById(pick(rng, lucky)); if (l?.look) return l.look; }
  return { hex: pick(rng, parts.colours), stripe: rng() < 0.5 ? 'none' : pick(rng, parts.stripes), stripeHex: pick(rng, ['#ffffff', '#141414', '#ffd23f']), mark: rng() < 0.4 ? '' : pick(rng, parts.marks) };
}

// ---------- tonnage and ranks ----------

/** Each container loaded is this many tonnes, and each yard block, warehouse and crane bought again adds a little (up to 40). */
export const tonnesEach = (p: Pick<PortState, 'more'>) => Math.min(40, 20 + p.more.block + p.more.shed + p.more.crane + p.more.berth + p.more.rail);
export const RANKS = [
  { name: 'Wooden Pier', at: 0 }, { name: 'Jetty', at: 200 }, { name: 'Little Port', at: 1000 }, { name: 'Port', at: 3000 },
  { name: 'Busy Port', at: 7000 }, { name: 'Big Port', at: 15000 }, { name: 'Mega Port', at: 30000 },
] as const;
export type RankName = (typeof RANKS)[number]['name'] | 'Super Port';
export const SUPER_EVERY = 20000;
export function rankOf(tonnes: number): { index: number; name: RankName; number: number; next: number } {
  const fixed = RANKS.findLastIndex(r => tonnes >= r.at), top = RANKS[RANKS.length - 1]!.at;
  if (tonnes < top + SUPER_EVERY) return { index: fixed, name: RANKS[fixed]!.name, number: 0, next: fixed + 1 < RANKS.length ? RANKS[fixed + 1]!.at : top + SUPER_EVERY };
  const k = Math.floor((tonnes - top) / SUPER_EVERY);
  return { index: RANKS.length - 1 + k, name: 'Super Port', number: k, next: top + (k + 1) * SUPER_EVERY };
}

// ---------- paying for a go ----------

/** A loaded Ship pays this, plus 3 for a named harbour he hasn't been to or 2 for a chart harbour, plus 1 for a new best. A Round pays
 *  at most 6, so a Round and its Ship pay at most 12, under Turbo Tally's 15. */
export const SHIP_BOLTS = 2, NEW_HARBOUR_BOLTS = 3, CHART_BOLTS = 2, BEST_BOLTS = 1;
export const MOST_SHIP_BOLTS = SHIP_BOLTS + NEW_HARBOUR_BOLTS + BEST_BOLTS;

export interface GoResult { loaded: number; tallest: number; seconds: number | null }
export interface GoPay {
  bolts: number;
  tonnes: number;
  harbour: Harbour;
  crate: Crate | null;
  special: Special | null;
  bestStack: boolean;
  bestQuick: boolean;
  rank: ReturnType<typeof rankOf> | null;
  trophies: string[];
}
export function payFor(p: PortState, plan: GoPlan, res: GoResult): GoPay {
  const named = plan.harbour.n <= HARBOURS.length, size = sizeOf(plan.shape);
  const bestStack = res.tallest > p.bests.stack && p.goes > 0;
  const was = p.bests.quick[size], bestQuick = res.seconds !== null && was !== undefined && res.seconds < was;
  const tonnes = res.loaded * tonnesEach(p);
  const before = rankOf(p.tonnes), after = rankOf(p.tonnes + tonnes);
  const crate = named && plan.harbour.crate && !has(p, plan.harbour.crate.id) ? plan.harbour.crate : null;
  const pay: GoPay = {
    bolts: SHIP_BOLTS + (named ? NEW_HARBOUR_BOLTS : CHART_BOLTS) + (bestStack || bestQuick ? BEST_BOLTS : 0), tonnes, harbour: plan.harbour, crate,
    special: plan.special && !has(p, plan.special.id) ? plan.special : null, bestStack, bestQuick, rank: after.index > before.index ? after : null, trophies: [],
  };
  pay.trophies = finishGo(p, plan, res, pay).trophies.filter(t => !p.trophies.includes(t));
  return pay;
}
/** The go is done: the Ship is used, the harbour visited, the tonnes counted, bests kept, and what came back is his. */
export function finishGo(p: PortState, plan: GoPlan, res: GoResult, pay: Pick<GoPay, 'tonnes' | 'crate' | 'special'>): PortState {
  const named = plan.harbour.n <= HARBOURS.length, size = sizeOf(plan.shape), was = p.bests.quick[size];
  const owned = [...p.owned, ...[pay.crate?.id, pay.special?.id].filter((id): id is string => !!id && !p.owned.includes(id))];
  const quick = res.seconds !== null && (was === undefined || res.seconds < was) ? { ...p.bests.quick, [size]: Math.round(res.seconds) } : p.bests.quick;
  return withTrophies({
    ...p, owned, ships: Math.max(0, p.ships - 1), goes: p.goes + 1, tonnes: p.tonnes + pay.tonnes,
    visited: named && !p.visited.includes(plan.harbour.id) ? [...p.visited, plan.harbour.id] : p.visited,
    chart: named ? p.chart : Math.max(p.chart, plan.harbour.n + 1),
    bests: { stack: Math.max(p.bests.stack, res.tallest), quick }, next: null, last: plan.harbour.id,
  }, plan);
}
/** A Round finished: one more Ship to load. */
export const earnShip = (p: PortState): PortState => ({ ...p, ships: p.ships + 1 });
/** Every harbour he has sailed to, named and charted, for the flag wall (newest first). */
export function flagsOf(p: Pick<PortState, 'visited' | 'chart'>): Harbour[] {
  const charted = Array.from({ length: p.chart - HARBOURS.length - 1 }, (_, i) => chartHarbour(p.chart - 1 - i));
  return [...charted, ...[...p.visited].reverse().map(id => harbourById(id)!).filter(Boolean)];
}

// ---------- Trophies ----------

type Check = (p: PortState, plan?: GoPlan) => boolean;
const goesAtLeast = (n: number): Check => p => p.goes >= n;
const harboursAtLeast = (n: number): Check => p => p.visited.length >= n;
const tonnesAtLeast = (n: number): Check => p => p.tonnes >= n;
const piecesAtLeast = (n: number): Check => p => PIECES.filter(x => has(p, x.id)).length >= n;
const fleetAtLeast = (n: number): Check => p => fleetKinds(p).length >= n;
export const TROPHIES = [
  { id: 'first', name: 'First Ship', icon: '🚢', check: goesAtLeast(1) },
  { id: 'goes10', name: 'Ten Ships', icon: '🚢', check: goesAtLeast(10) },
  { id: 'goes50', name: 'Fifty Ships', icon: '⛴️', check: goesAtLeast(50) },
  { id: 'goes100', name: 'Hundred Ships', icon: '🛳️', check: goesAtLeast(100) },
  { id: 'goes250', name: 'Ship Master', icon: '🏅', check: goesAtLeast(250) },
  { id: 'goes500', name: 'Harbour Hero', icon: '🦸', check: goesAtLeast(500) },
  { id: 'h5', name: 'Five Harbours', icon: '🗺️', check: harboursAtLeast(5) },
  { id: 'h12', name: 'Twelve Harbours', icon: '🗺️', check: harboursAtLeast(12) },
  { id: 'h24', name: 'Every Harbour', icon: '🌍', check: harboursAtLeast(24) },
  { id: 't1000', name: 'Thousand Tonnes', icon: '⚖️', check: tonnesAtLeast(1000) },
  { id: 't10000', name: 'Ten Thousand Tonnes', icon: '⚖️', check: tonnesAtLeast(10000) },
  { id: 't100000', name: 'Hundred Thousand Tonnes', icon: '🏋️', check: tonnesAtLeast(100000) },
  { id: 'fleet3', name: 'Little Fleet', icon: '⛵', check: fleetAtLeast(3) },
  { id: 'fleet6', name: 'Big Fleet', icon: '🚢', check: fleetAtLeast(6) },
  { id: 'fleet10', name: 'Every Ship', icon: '🛳️', check: fleetAtLeast(10) },
  { id: 'build10', name: 'Builder', icon: '🏗️', check: piecesAtLeast(10) },
  { id: 'build30', name: 'Master Builder', icon: '🏗️', check: piecesAtLeast(30) },
  { id: 'buildall', name: 'Dream Port', icon: '🏰', check: piecesAtLeast(PIECES.length) },
  { id: 'stack3', name: 'Tall Stack', icon: '🧱', check: (p: PortState) => p.bests.stack >= 3 },
  { id: 'twin', name: 'Twin Lift', icon: '🪝', check: (p: PortState) => has(p, 'part:twin') },
  { id: 'giant', name: 'Giant Gantry', icon: '🏗️', check: (p: PortState) => has(p, 'crane:giant') },
  { id: 'night', name: 'Night Sailor', icon: '🌙', check: (_p: PortState, plan?: GoPlan) => plan?.harbour.weather === 'night' },
  { id: 'fog', name: 'Fog Sailor', icon: '🌫️', check: (_p: PortState, plan?: GoPlan) => plan?.harbour.weather === 'fog' },
  { id: 'storm', name: 'Storm Sailor', icon: '⛈️', check: (_p: PortState, plan?: GoPlan) => plan?.harbour.weather === 'storm' },
  { id: 'flags50', name: 'Flag Collector', icon: '🚩', check: (p: PortState) => p.visited.length + (p.chart - HARBOURS.length - 1) >= 50 },
] as const;
export type TrophyName = (typeof TROPHIES)[number]['name'];
export function withTrophies(p: PortState, plan?: GoPlan): PortState {
  const got = TROPHIES.filter(t => !p.trophies.includes(t.id) && t.check(p, plan)).map(t => t.id);
  return got.length ? { ...p, trophies: [...p.trophies, ...got] } : p;
}

// ---------- counting ----------

/** The fixed catalogue: things to buy, harbours to sail to (each with its crate), Trophies to win. The chart, the special crates, the
 *  visiting ships and the again-and-again things are on top, without end. */
export const CATALOGUE = { forSale: FOR_SALE.length, harbours: HARBOURS.length, crates: CRATES.length, trophies: TROPHIES.length };
export const CATALOGUE_SIZE = CATALOGUE.forSale + CATALOGUE.harbours + CATALOGUE.crates + CATALOGUE.trophies;
export type { Item };
export const SHIP_LIST = SHIPS;
