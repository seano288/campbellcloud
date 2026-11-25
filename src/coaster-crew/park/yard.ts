// The Coaster Yard on the saved game: what he owns, his coasters and their pieces, his train, his park and where everything stands, the
// Rides he has earned, the Guest Coasters he has ridden, the riders he has carried, his Thrill bests and his Trophies.
//
// A finished Round earns Tokens and one Ride. Tokens buy pieces, train parts, park things and more land. A Ride goes round his own coaster
// (if it gets all the way round) or the next Guest Coaster. It pays a few Tokens, adds its riders to the counter, and is used only at its
// end, so leaving halfway costs nothing. Nothing bought is ever lost.
import { isAmount } from '../../currency/amount';
import type { PurchaseProposal } from '../../rewards/purchase';
import { fitsAfter, heights, isPieceId, pieceOf, PRIZE_PIECES } from '../coaster/pieces';
import { check, type Check } from '../coaster/track';
import { guest, prizeFor, PRIZE_EVERY, type Prize } from '../coaster/guest';
import {
  BODIES, FOR_SALE, isItemId, isParkThing, itemOf, MAX_CARS, PRIZE_BODIES, REPEAT_IDS, repeatOf, repeatPrice, SPOTS_PER_PLOT, START_CARS, START_PLOTS, START_SLOTS, STARTERS,
  type BodyItem, type Does, type Item, type ParkItem, type RepeatId,
} from './catalog';

export interface Train { body: string; front: string; paint: string; stripe: string; riders: string }
export interface Coaster { pieces: string[]; best: number }
export interface Bests { thrill: number; speed: number; drop: number; inversions: number }
export interface YardState {
  owned: string[];
  more: Record<RepeatId, number>;
  coasters: Coaster[];
  /** The coaster he is building and riding. */
  current: number;
  train: Train;
  style: string;
  theme: string;
  /** What stands on each spot of his park ('' for empty): SPOTS_PER_PLOT a plot. */
  spots: string[];
  /** What he's saving for: an item id, or `more:<repeat>`. */
  goal: string | null;
  /** Rides earned and not taken; Rides taken, ever. */
  rides: number;
  ridden: number;
  /** Riders carried, ever. */
  riders: number;
  /** The next Guest Coaster (from 1). */
  guest: number;
  /** Prizes won: prize pieces and cars (ids), and how many numbered Guest Paints. */
  prizes: string[];
  guestPaints: number;
  bests: Bests;
  trophies: string[];
  /** Ride at night (once he has Night Lights). */
  night: boolean;
}

/** He starts with one free Ride, so he sees the reward before his first purchase, on a starter coaster that gets all the way round. */
export const FIRST_RIDES = 1;
export const STARTER_COASTER = ['pc:lift3', 'pc:drop2', 'pc:straight'] as const;
const noMore = (): Record<RepeatId, number> => ({ track: 0, car: 0, plot: 0, coaster: 0 });
export const freshTrain = (): Train => ({ body: 'bd:classic', front: 'fr:plain', paint: 'pt:red', stripe: 'sp:none', riders: 'rd:kids' });
export const freshYard = (): YardState => ({
  owned: [...STARTERS], more: noMore(), coasters: [{ pieces: [...STARTER_COASTER], best: 0 }], current: 0, train: freshTrain(), style: 'st:steel', theme: 'th:plain',
  spots: Array.from({ length: START_PLOTS * SPOTS_PER_PLOT }, () => ''), goal: null, rides: FIRST_RIDES, ridden: 0, riders: 0, guest: 1, prizes: [], guestPaints: 0,
  bests: { thrill: 0, speed: 0, drop: 0, inversions: 0 }, trophies: [], night: false,
});

// ---------- reading a save ----------

type Raw = Record<string, unknown>;
const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);
const count = (x: unknown, max = Number.MAX_SAFE_INTEGER) => (isAmount(x) ? Math.min(x as number, max) : 0);
export const isGuestPaint = (id: string, y: Pick<YardState, 'guestPaints'>) => /^gp:\d+$/.test(id) && Number(id.slice(3)) >= 1 && Number(id.slice(3)) <= y.guestPaints;

/** Whatever is missing or doesn't read comes back fresh; nothing he doesn't own can be used. */
export function readYard(raw: unknown): YardState {
  const f = freshYard();
  if (!isRecord(raw)) return f;
  const prizes = Array.isArray(raw.prizes) ? [...new Set(raw.prizes.filter((x): x is string => typeof x === 'string' && (PRIZE_PIECES.some(p => p.id === x) || PRIZE_BODIES.some(b => b.id === x))))] : [];
  const owned = [...new Set([...STARTERS, ...(Array.isArray(raw.owned) ? raw.owned.filter(isItemId).filter(id => itemOf(id).price > 0) : [])])];
  const more = isRecord(raw.more) ? raw.more : {};
  const y0: YardState = { ...f, owned, prizes, guestPaints: count(raw.guestPaints, 100_000) };
  y0.more = Object.fromEntries(REPEAT_IDS.map(id => [id, count(more[id], Math.min(repeatOf(id).most, 100_000))])) as YardState['more'];
  const slots = slotsOf(y0);
  const coasters: Coaster[] = [];
  const rawC = Array.isArray(raw.coasters) ? raw.coasters : [];
  for (let i = 0; i < 1 + y0.more.coaster; i++) {
    const c = isRecord(rawC[i]) ? rawC[i] as Raw : null;
    const pieces: string[] = [];
    if (c && Array.isArray(c.pieces)) for (const id of c.pieces) { if (pieces.length >= slots || !isPieceId(id) || !canUse(y0, id) || !fitsAfter(pieces, id)) break; pieces.push(id); }
    coasters.push({ pieces: c ? pieces : i === 0 ? [...STARTER_COASTER] : [], best: c ? count(c.best, 999) : 0 });
  }
  const tr = isRecord(raw.train) ? raw.train : {}, ft = freshTrain();
  const slot = (key: keyof Train, prefix: string) => { const v = tr[key]; return typeof v === 'string' && (v.startsWith(prefix) || (key === 'paint' && v.startsWith('gp:'))) && canUse(y0, v) ? v : ft[key]; };
  const nSpots = (START_PLOTS + y0.more.plot) * SPOTS_PER_PLOT;
  const spots = Array.from({ length: nSpots }, (_, i) => { const v = Array.isArray(raw.spots) ? raw.spots[i] : ''; return typeof v === 'string' && isParkThing(v) && has(y0, v) ? v : ''; });
  const b = isRecord(raw.bests) ? raw.bests : {};
  const goal = typeof raw.goal === 'string' && (raw.goal.startsWith('more:') ? REPEAT_IDS.includes(raw.goal.slice(5) as RepeatId) : isItemId(raw.goal) && !has(y0, raw.goal)) ? raw.goal : null;
  const y: YardState = {
    ...y0, coasters, current: Math.min(count(raw.current), coasters.length - 1),
    train: { body: slot('body', 'bd:'), front: slot('front', 'fr:'), paint: slot('paint', 'pt:'), stripe: slot('stripe', 'sp:'), riders: slot('riders', 'rd:') },
    style: typeof raw.style === 'string' && raw.style.startsWith('st:') && has(y0, raw.style) ? raw.style : f.style,
    theme: typeof raw.theme === 'string' && raw.theme.startsWith('th:') && has(y0, raw.theme) ? raw.theme : f.theme,
    spots, goal, rides: count(raw.rides, 99), ridden: count(raw.ridden), riders: count(raw.riders), guest: Math.max(1, count(raw.guest)),
    bests: { thrill: count(b.thrill, 9999), speed: count(b.speed, 9999), drop: count(b.drop, 9999), inversions: count(b.inversions, 999) },
    trophies: Array.isArray(raw.trophies) ? TROPHIES.filter(t => (raw.trophies as unknown[]).includes(t.id)).map(t => t.id) : [],
    night: raw.night === true && does(y0, 'night'),
  };
  return y;
}

// ---------- what he has ----------

export const has = (y: Pick<YardState, 'owned'>, id: string) => y.owned.includes(id);
/** Can use: owns it, won it, or (a Guest Paint) has won that many. */
export const canUse = (y: Pick<YardState, 'owned' | 'prizes' | 'guestPaints'>, id: string) => has(y, id) || y.prizes.includes(id) || isGuestPaint(id, y);
export const slotsOf = (y: Pick<YardState, 'more'>) => START_SLOTS + y.more.track;
export const carsOf = (y: Pick<YardState, 'more'>) => Math.min(MAX_CARS, START_CARS + y.more.car);
export const plotsOf = (y: Pick<YardState, 'more'>) => START_PLOTS + y.more.plot;
export const seatsOf = (bodyId: string) => (itemOf(bodyId) as BodyItem).seats;
/** Riders a Ride carries round: cars × seats. */
export const ridersPerRide = (y: Pick<YardState, 'more' | 'train'>) => carsOf(y) * seatsOf(y.train.body);
/** He has a park thing that does this (and it stands in his park). */
export const does = (y: Pick<YardState, 'owned'>, what: Does) => y.owned.some(id => isParkThing(id) && (itemOf(id) as ParkItem).does === what);
export const coasterOf = (y: YardState) => y.coasters[Math.min(y.current, y.coasters.length - 1)]!;
/** Pieces he can put on a track: owned and won. */
export const myPieces = (y: YardState) => [...y.owned.filter(id => id.startsWith('pc:')), ...y.prizes.filter(id => id.startsWith('pc:'))];

// ---------- the builder ----------

/** The pieces that fit at the end of the current track (the only ones the tray shows), cheapest look first. */
export function trayFor(y: YardState): string[] {
  const c = coasterOf(y);
  if (c.pieces.length >= slotsOf(y)) return [];
  return myPieces(y).filter(id => fitsAfter(c.pieces, id));
}
const setPieces = (y: YardState, pieces: string[]): YardState => ({ ...y, coasters: y.coasters.map((c, i) => (i === y.current ? { ...c, pieces } : c)) });
export function addPiece(y: YardState, id: string): YardState | null {
  if (!trayFor(y).includes(id)) return null;
  return setPieces(y, [...coasterOf(y).pieces, id]);
}
/** One tap takes the last piece off. */
export function takeLast(y: YardState): YardState | null {
  const c = coasterOf(y);
  return c.pieces.length ? setPieces(y, c.pieces.slice(0, -1)) : null;
}
export const pickCoaster = (y: YardState, i: number): YardState | null => (i >= 0 && i < y.coasters.length ? { ...y, current: i } : null);

/** The two honest fixes for a coaster that rolls back: a taller first lift, or a booster just before the piece it can't get over.
 *  Each is one he has if it works, else the cheapest he could buy (the builder offers to buy it). Neither is offered if it wouldn't help
 *  (or if it needs more track slots than he has). */
const LIFTS = ['pc:lift3', 'pc:lift5', 'pc:lift7', 'pc:lift9', 'pc:lift11', 'pc:lift13', 'pc:comet-lift'];
/** Two steps down: free from the start, so the taller-lift fix never needs anything but the lift. */
const LITTLE_DROP = 'pc:drop2';
export interface Fix { readonly kind: 'lift' | 'booster'; readonly piece: string; readonly pieces: string[]; readonly owned: boolean }
export function fixesFor(y: YardState, pieces: readonly string[] = coasterOf(y).pieces): Fix[] {
  const c = check(pieces);
  if (!c.backAt || c.backAt.index < 0) return [];
  const out: Fix[] = [];
  const usable = (id: string) => canUse(y, id) || FOR_SALE.some(i => i.id === id);
  const works = (next: string[]) => next.length <= slotsOf(y) && heights(next).every(h => h !== null) && check(next).backAt === null;
  // a taller first lift: the lift goes higher and a Little Drop (or two) just after it brings the track back to where it was, so every
  // later hill stays where he built it and only the start is higher. One he has if one works, else the lowest he could buy.
  const at = pieces.findIndex(id => pieceOf(id).geo.g === 'lift');
  const owned1st = (ids: string[]) => [...ids.filter(id => canUse(y, id)), ...ids.filter(id => !canUse(y, id) && FOR_SALE.some(i => i.id === id))];
  if (at >= 0) {
    const now = (pieceOf(pieces[at]!).geo as { to: number }).to;
    const lifts = owned1st(LIFTS.filter(usable).filter(id => [2, 4, 6].includes((pieceOf(id).geo as { to: number }).to - now)));
    for (const id of lifts) {
      const extra = ((pieceOf(id).geo as { to: number }).to - now) / 2, drops = Array.from({ length: extra }, () => LITTLE_DROP);
      const next = [...pieces.slice(0, at), id, ...drops, ...pieces.slice(at + 1)];
      if (works(next)) { out.push({ kind: 'lift', piece: id, pieces: next, owned: canUse(y, id) }); break; }
    }
  }
  // a booster in front of the piece it can't get over
  for (const id of owned1st(['pc:boost', 'pc:bigboost', 'pc:thunder', 'pc:launch'].filter(usable))) {
    const next = [...pieces.slice(0, c.backAt.index), id, ...pieces.slice(c.backAt.index)];
    if (works(next)) { out.push({ kind: 'booster', piece: id, pieces: next, owned: canUse(y, id) }); break; }
  }
  // an owned fix first: one tap, nothing to buy
  return out.sort((a, b) => Number(b.owned) - Number(a.owned));
}
export function applyFix(y: YardState, fix: Fix): YardState | null {
  if (!canUse(y, fix.piece) || fix.pieces.length > slotsOf(y)) return null;
  return setPieces(y, fix.pieces);
}

// ---------- the park ----------

/** Put a park thing he owns on a spot (or '' to clear it). */
export function putOnSpot(y: YardState, spot: number, id: string): YardState | null {
  if (spot < 0 || spot >= y.spots.length || (id !== '' && (!isParkThing(id) || !has(y, id)))) return null;
  return { ...y, spots: y.spots.map((s, i) => (i === spot ? id : s)) };
}
export const unplaced = (y: YardState) => y.owned.filter(id => isParkThing(id) && !y.spots.includes(id));

// ---------- wearing ----------

/** Fit a train part, a track style or a station theme he owns. */
export function wear(y: YardState, id: string): YardState | null {
  if (!canUse(y, id)) return null;
  if (id.startsWith('gp:')) return { ...y, train: { ...y.train, paint: id } };
  const item = itemOf(id);
  switch (item.cat) {
    case 'body': return { ...y, train: { ...y.train, body: id } };
    case 'front': return { ...y, train: { ...y.train, front: id } };
    case 'paint': return { ...y, train: { ...y.train, paint: id } };
    case 'stripe': return { ...y, train: { ...y.train, stripe: id } };
    case 'riders': return { ...y, train: { ...y.train, riders: id } };
    case 'style': return { ...y, style: id };
    case 'theme': return { ...y, theme: id };
    default: return null;
  }
}

// ---------- buying ----------

export type Want = { kind: 'item'; id: string } | { kind: 'more'; id: RepeatId };
export const wantKey = (w: Want) => (w.kind === 'item' ? w.id : `more:${w.id}`);
export const wantOf = (key: string): Want => (key.startsWith('more:') ? { kind: 'more', id: key.slice(5) as RepeatId } : { kind: 'item', id: key });
export const priceOf = (y: Pick<YardState, 'more'>, w: Want) => (w.kind === 'item' ? itemOf(w.id).price : repeatPrice(w.id, y.more[w.id]));
export const isNew = (y: Pick<YardState, 'owned' | 'more'>, w: Want) => (w.kind === 'more' ? y.more[w.id] < repeatOf(w.id).most : !has(y, w.id));
export const buyable = (y: YardState, w: Want) => isNew(y, w) && (w.kind === 'more' || itemOf(w.id).price > 0);
export const shopNow = (y: YardState): Want[] =>
  FOR_SALE.filter(i => buyable(y, { kind: 'item', id: i.id })).sort((a, b) => a.price - b.price).map(i => ({ kind: 'item', id: i.id }));
export const repeatsNow = (y: YardState): Want[] =>
  REPEAT_IDS.map(id => ({ kind: 'more', id }) as Want).filter(w => buyable(y, w)).sort((a, b) => priceOf(y, a) - priceOf(y, b));
export const catalogueDone = (y: Pick<YardState, 'owned'>) => FOR_SALE.every(i => has(y, i.id));

/** His Goal: what he tapped and couldn't afford, else the cheapest new thing, else the cheapest again-and-again thing. */
export function goalOf(y: YardState): Want | null {
  if (y.goal) { const w = wantOf(y.goal); if (buyable(y, w)) return w; }
  return shopNow(y)[0] ?? repeatsNow(y)[0] ?? null;
}
export const selectGoal = (y: YardState, w: Want): YardState => ({ ...y, goal: wantKey(w) });

export type PurchaseFailure = 'invalid-item' | 'invalid-balance' | 'insufficient-funds' | 'already-owned';
export function proposePurchase(y: YardState, w: Want, balance: number): PurchaseProposal<YardState, PurchaseFailure> {
  if (!isAmount(balance)) return { kind: 'rejected', reason: 'invalid-balance' };
  if (w.kind === 'item' ? !isItemId(w.id) || itemOf(w.id).price <= 0 || !FOR_SALE.some(i => i.id === w.id) : !REPEAT_IDS.includes(w.id)) return { kind: 'rejected', reason: 'invalid-item' };
  if (!isNew(y, w)) return { kind: 'rejected', reason: 'already-owned' };
  const cost = priceOf(y, w);
  if (balance < cost) return { kind: 'rejected', reason: 'insufficient-funds' };
  return { kind: 'ready', cost, state: bought(y, w) };
}
/** Buying a train part, style or theme puts it on; a park thing goes on the first empty spot (or waits for room); more land adds spots;
 *  another coaster starts empty and is the one he builds next. */
export function bought(y: YardState, w: Want): YardState {
  const goal = y.goal === wantKey(w) ? null : y.goal;
  if (w.kind === 'more') {
    const more = { ...y.more, [w.id]: y.more[w.id] + 1 };
    let next: YardState = { ...y, more, goal };
    if (w.id === 'plot') next = { ...next, spots: [...y.spots, ...Array.from({ length: SPOTS_PER_PLOT }, () => '')] };
    if (w.id === 'coaster') next = { ...next, coasters: [...y.coasters, { pieces: [], best: 0 }], current: y.coasters.length };
    if (w.id === 'plot') { for (const id of unplaced(next)) { const i = next.spots.indexOf(''); if (i < 0) break; next = { ...next, spots: next.spots.map((s, j) => (j === i ? id : s)) }; } }
    return next;
  }
  let next: YardState = { ...y, owned: [...y.owned, w.id], goal };
  if (isParkThing(w.id)) { const i = next.spots.indexOf(''); if (i >= 0) next = { ...next, spots: next.spots.map((s, j) => (j === i ? w.id : s)) }; }
  else next = wear(next, w.id) ?? next;
  return next;
}

// ---------- ranks and trophies ----------

/** Park ranks by riders carried. After Coaster Legend, another Coaster Legend every 600 riders, numbered, without end. */
export const RANKS = [
  { name: 'Helper', at: 0 }, { name: 'Ticket Taker', at: 20 }, { name: 'Ride Operator', at: 60 }, { name: 'Track Fixer', at: 120 }, { name: 'Coaster Crew', at: 200 },
  { name: 'Crew Chief', at: 320 }, { name: 'Park Manager', at: 480 }, { name: 'Thrill Master', at: 700 }, { name: 'Coaster Captain', at: 1000 }, { name: 'Coaster Legend', at: 1400 },
] as const;
export type RankName = (typeof RANKS)[number]['name'];
export const LEGEND_EVERY = 600;
export function rankOf(riders: number): { index: number; name: RankName; number: number; next: number } {
  const top = RANKS[RANKS.length - 1]!.at;
  if (riders < top + LEGEND_EVERY) {
    const i = RANKS.findLastIndex(r => riders >= r.at);
    return { index: i, name: RANKS[i]!.name, number: 0, next: i + 1 < RANKS.length ? RANKS[i + 1]!.at : top + LEGEND_EVERY };
  }
  const k = Math.floor((riders - top) / LEGEND_EVERY);
  return { index: RANKS.length - 1 + k, name: 'Coaster Legend', number: k + 1, next: top + (k + 1) * LEGEND_EVERY };
}

/** Trophies he earns by what he builds and rides (never bought). */
export const TROPHIES = [
  { id: 'first', name: 'First Ride Trophy' }, { id: 'loop', name: 'Loop the Loop Trophy' }, { id: 'splash', name: 'Splash Down Trophy' },
  { id: 'upside', name: 'Upside Down Trophy' }, { id: 'sky', name: 'Sky High Trophy' }, { id: 'speed', name: 'Speed Demon Trophy' },
  { id: 't100', name: 'Thrill 100 Trophy' }, { id: 't150', name: 'Thrill 150 Trophy' }, { id: 't200', name: 'Thrill 200 Trophy' }, { id: 'guests', name: 'Guest Star Trophy' },
] as const;
export type TrophyName = (typeof TROPHIES)[number]['name'];
function trophiesAfter(y: YardState, pieces: readonly string[], c: Check, guestRide: boolean): string[] {
  const geo = pieces.map(id => pieceOf(id).geo);
  const got = new Set(y.trophies);
  got.add('first');
  // the rest are for coasters he built himself
  if (!guestRide) {
    if (geo.some(g => g.g === 'loop')) got.add('loop');
    if (geo.some(g => g.g === 'splash')) got.add('splash');
    if (c.inversions > 0) got.add('upside');
    if (geo.some(g => g.g === 'lift' && g.to >= 11)) got.add('sky');
    if (c.topSpeed * 3.6 >= 100) got.add('speed');
    if (c.thrill >= 100) got.add('t100');
    if (c.thrill >= 150) got.add('t150');
    if (c.thrill >= 200) got.add('t200');
  }
  if (y.guest - 1 + (guestRide ? 1 : 0) >= 10) got.add('guests');
  return TROPHIES.filter(t => got.has(t.id)).map(t => t.id);
}

// ---------- a Ride ----------

/** A Ride is on his own coaster (only if it gets all the way round) or on the next Guest Coaster. */
export type Which = 'mine' | 'guest';
export interface RidePlan {
  readonly which: Which;
  readonly pieces: readonly string[];
  readonly check: Check;
  readonly guestN: number | null;
  readonly riders: number;
}
export const canRideMine = (y: YardState) => coasterOf(y).pieces.length > 0 && check(coasterOf(y).pieces).backAt === null;
export function planRide(y: YardState, which: Which): RidePlan | null {
  if (which === 'mine') {
    if (!canRideMine(y)) return null;
    const pieces = coasterOf(y).pieces;
    return { which, pieces, check: check(pieces), guestN: null, riders: ridersPerRide(y) };
  }
  const g = guest(y.guest);
  return { which, pieces: g.pieces, check: check(g.pieces), guestN: g.n, riders: g.cars * seatsOf(g.body) };
}

/** A Ride pays this, one more for the photo at the big drop, and one more for something new: a Guest Coaster ridden for the first time,
 *  or a new Thrill best on his own coaster. At most 4, so a Round and its Ride pay at most 10. */
export const RIDE_TOKENS = 2, PHOTO_TOKENS = 1, NEW_TOKENS = 1;
export const MOST_RIDE_TOKENS = RIDE_TOKENS + PHOTO_TOKENS + NEW_TOKENS;
export interface RideResult { readonly photo: boolean; readonly stars: number; readonly starsOf: number }
export interface RidePay {
  tokens: number;
  newBest: boolean;
  bestThrill: boolean;
  prize: Prize | null;
  rank: ReturnType<typeof rankOf> | null;
  trophies: string[];
  riders: number;
}
export function payFor(y: YardState, plan: RidePlan, res: RideResult): RidePay {
  const c = coasterOf(y), mineBest = plan.which === 'mine' && plan.check.thrill > c.best;
  const bestThrill = plan.check.thrill > y.bests.thrill && plan.which === 'mine';
  const tokens = RIDE_TOKENS + (res.photo ? PHOTO_TOKENS : 0) + (plan.which === 'guest' || mineBest ? NEW_TOKENS : 0);
  const before = rankOf(y.riders), after = rankOf(y.riders + plan.riders);
  const trophies = trophiesAfter(y, plan.pieces, plan.check, plan.which === 'guest').filter(t => !y.trophies.includes(t));
  return { tokens, newBest: mineBest, bestThrill, prize: plan.which === 'guest' ? prizeFor(plan.guestN!) : null, rank: after.index > before.index ? after : null, trophies, riders: plan.riders };
}
/** The Ride ended: it's used, the riders are counted, the bests kept, the Guest Coaster ridden and its prize given. */
export function finishRide(y: YardState, plan: RidePlan, res: RideResult): YardState {
  const pay = payFor(y, plan, res);
  let next: YardState = { ...y, rides: Math.max(0, y.rides - 1), ridden: y.ridden + 1, riders: y.riders + plan.riders, trophies: [...y.trophies, ...pay.trophies] };
  if (plan.which === 'mine') {
    const c = plan.check;
    next = {
      ...next, coasters: y.coasters.map((x, i) => (i === y.current ? { ...x, best: Math.max(x.best, c.thrill) } : x)),
      bests: { thrill: Math.max(y.bests.thrill, c.thrill), speed: Math.max(y.bests.speed, Math.round(c.topSpeed * 3.6)), drop: Math.max(y.bests.drop, Math.round(c.tallestDrop)), inversions: Math.max(y.bests.inversions, c.inversions) },
    };
  } else {
    next = { ...next, guest: y.guest + 1 };
    if (pay.prize?.kind === 'paint') next = { ...next, guestPaints: Math.max(next.guestPaints, pay.prize.k) };
    else if (pay.prize && !next.prizes.includes(pay.prize.id)) next = { ...next, prizes: [...next.prizes, pay.prize.id] };
  }
  void res;
  return next;
}
/** A Round finished: one more Ride. */
export const earnRide = (y: YardState): YardState => ({ ...y, rides: y.rides + 1 });
export const toggleNight = (y: YardState): YardState | null => (does(y, 'night') ? { ...y, night: !y.night } : null);

// ---------- counting ----------

/** The fixed catalogue: things to buy, prizes to win, ranks and trophies. Guest Coasters, Guest Paints, land, coasters and the numbered
 *  Coaster Legends are on top, without end. */
export const CATALOGUE = { forSale: FOR_SALE.length, prizes: PRIZE_PIECES.length + PRIZE_BODIES.length, ranks: RANKS.length, trophies: TROPHIES.length };
export const CATALOGUE_SIZE = CATALOGUE.forSale + CATALOGUE.prizes + CATALOGUE.ranks + CATALOGUE.trophies;
export { PRIZE_EVERY, BODIES };
export type { Item };
