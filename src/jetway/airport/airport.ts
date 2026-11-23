// The Airport on the saved game: what he has built and bought, his Fleet and their liveries, his airline, the Flights he has earned,
// the Routes he has flown and his best on each, the Charter he flies next, the passengers who have flown with him and his Trophies.
//
// A finished Round earns Bolts and one Flight. Bolts buy pieces, planes, paints and the rest. A Flight to a Route he hasn't flown opens
// the next one; once three are flown a Charter is always on offer, without end. Every Flight pays a few Bolts and adds its passengers
// to the big board, and nothing is ever lost. A Flight is only used at its end, so leaving halfway costs nothing.
import { isAmount } from '../../currency/amount';
import type { PurchaseProposal } from '../../rewards/purchase';
import {
  AIRLINE_FIRST, AIRLINE_SECOND, FOR_SALE, isItemId, itemOf, PAINTS, PIECES, PLANE_MODELS, PLANE_NAMES, PLANE_SPECS, PLANES, REPEAT_IDS, repeatOf, repeatPrice,
  STARTERS, type Item, type PlaneModel, type RepeatId,
} from './catalog';
import { charter, CHARTER_OPENS, prizeById, prizeFor, type CharterPrize } from './charter';
import { isRouteId, ROUTES, routeBy, type Destination } from './routes';

export interface Livery {
  /** Index into PLANE_NAMES. */
  name: number;
  base: string; trim: string; stripe: string;
  /** A tail he bought, or a Charter tail he won. */
  tail: string;
}
export interface RouteRecord { flown: number; bestStars: number; bestLanding: number }

export interface AirportState {
  /** Catalogue items bought, and Charter prizes won. */
  owned: string[];
  /** How many of each thing he can buy again and again. */
  more: Record<RepeatId, number>;
  liveries: Partial<Record<PlaneModel, Livery>>;
  /** The plane he flies. */
  flying: PlaneModel;
  airline: { first: number; second: number; mark: string };
  /** The runway light colour: white, or a colour he has won or bought. */
  lights: string;
  /** What he's saving for, once he has tapped a thing he can't afford: an item id, or `more:<repeat>`. */
  goal: string | null;
  /** Flights earned and not flown yet. */
  flights: number;
  /** Flights finished, ever. */
  flown: number;
  routes: Record<string, RouteRecord>;
  /** The Charter he flies next. */
  charter: number;
  /** The Route (or 'charter') he picked on the Routes board, if any. */
  picked: string | null;
  passengers: number;
  trophies: string[];
  smooth: number;
  /** For "Watch it run" and the board: the last place he flew to. */
  last: string | null;
}

/** He starts with one free Flight, so he sees the reward before his first purchase. */
export const FIRST_FLIGHTS = 1;
const freshLivery = (i: number): Livery => ({ name: i % PLANE_NAMES.length, base: 'paint:white', trim: 'paint:white', stripe: 'stripe:none', tail: 'tail:none' });
export const freshAirport = (): AirportState => ({
  owned: [...STARTERS], more: { concourse: 0, gate: 0, hangar: 0, stretch: 0 }, liveries: { twoseater: { ...freshLivery(0), base: 'paint:white', trim: 'paint:white' } },
  flying: 'twoseater', airline: { first: 0, second: 0, mark: 'mark:none' }, lights: 'white', goal: null, flights: FIRST_FLIGHTS, flown: 0,
  routes: {}, charter: 1, picked: null, passengers: 0, trophies: [], smooth: 0, last: null,
});

type Raw = Record<string, unknown>;
const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);
const count = (x: unknown, max = Number.MAX_SAFE_INTEGER) => (isAmount(x) ? Math.min(x as number, max) : 0);
const isPrize = (x: unknown): x is string => typeof x === 'string' && prizeById(x) !== null;
const isPlane = (x: unknown): x is PlaneModel => typeof x === 'string' && (PLANE_MODELS as readonly string[]).includes(x);

/** Whatever is missing or doesn't read comes back fresh; nothing he doesn't own can be worn. */
export function readAirport(raw: unknown): AirportState {
  const f = freshAirport();
  if (!isRecord(raw)) return f;
  const owned = [...new Set([...STARTERS, ...(Array.isArray(raw.owned) ? raw.owned.filter(x => isItemId(x) || isPrize(x)) as string[] : [])])];
  const has = (id: string) => owned.includes(id);
  const more = isRecord(raw.more) ? raw.more : {};
  const liv = isRecord(raw.liveries) ? raw.liveries : {};
  const liveries: AirportState['liveries'] = {};
  for (const m of PLANE_MODELS) {
    if (!has(`plane:${m}`)) continue;
    const l = isRecord(liv[m]) ? liv[m] as Raw : {}, fresh = freshLivery(PLANE_MODELS.indexOf(m));
    const ok = (id: unknown, prefix: string) => typeof id === 'string' && id.startsWith(prefix) && has(id);
    liveries[m] = {
      name: typeof l.name === 'number' && Number.isInteger(l.name) && l.name >= 0 && l.name < PLANE_NAMES.length ? l.name : fresh.name,
      base: ok(l.base, 'paint:') ? l.base as string : fresh.base, trim: ok(l.trim, 'paint:') ? l.trim as string : fresh.trim,
      stripe: ok(l.stripe, 'stripe:') ? l.stripe as string : fresh.stripe,
      tail: ok(l.tail, 'tail:') || (typeof l.tail === 'string' && isPrize(l.tail) && has(l.tail) && prizeById(l.tail)!.kind === 'tail') ? l.tail as string : fresh.tail,
    };
  }
  const air = isRecord(raw.airline) ? raw.airline : {};
  const routes = isRecord(raw.routes) ? raw.routes : {};
  const goal = typeof raw.goal === 'string' && (raw.goal.startsWith('more:') ? REPEAT_IDS.includes(raw.goal.slice(5) as RepeatId) : isItemId(raw.goal) && !has(raw.goal)) ? raw.goal : null;
  return {
    owned, more: Object.fromEntries(REPEAT_IDS.map(id => [id, count(more[id], 999)])) as AirportState['more'], liveries,
    flying: isPlane(raw.flying) && has(`plane:${raw.flying}`) ? raw.flying : 'twoseater',
    airline: {
      first: count(air.first, AIRLINE_FIRST.length - 1), second: count(air.second, AIRLINE_SECOND.length - 1),
      mark: typeof air.mark === 'string' && air.mark.startsWith('mark:') && has(air.mark) ? air.mark : 'mark:none',
    },
    lights: typeof raw.lights === 'string' && lightChoices({ owned }).includes(raw.lights) ? raw.lights : 'white',
    goal, flights: count(raw.flights, 99), flown: count(raw.flown),
    routes: Object.fromEntries(ROUTES.flatMap(r => {
      const x = routes[r.id];
      return isRecord(x) ? [[r.id, { flown: count(x.flown), bestStars: count(x.bestStars, r.stars.length), bestLanding: count(x.bestLanding, 3) }]] : [];
    })),
    charter: Math.max(1, count(raw.charter, 1_000_000)),
    picked: raw.picked === 'charter' || isRouteId(raw.picked) ? raw.picked as string : null,
    passengers: count(raw.passengers), trophies: Array.isArray(raw.trophies) ? TROPHIES.map(t => t.id).filter(id => (raw.trophies as unknown[]).includes(id)) : [],
    smooth: count(raw.smooth), last: typeof raw.last === 'string' ? raw.last : null,
  };
}

export const has = (a: Pick<AirportState, 'owned'>, id: string) => a.owned.includes(id);

// ---------- buying ----------

export type Want = { kind: 'item'; id: string } | { kind: 'more'; id: RepeatId };
export const wantKey = (w: Want) => (w.kind === 'item' ? w.id : `more:${w.id}`);
export const wantOf = (key: string): Want => (key.startsWith('more:') ? { kind: 'more', id: key.slice(5) as RepeatId } : { kind: 'item', id: key });
/** What it needs first, if he hasn't got it: another piece (the Long Taxiway needs the Taxiway). */
export const missingNeed = (a: Pick<AirportState, 'owned'>, w: Want): string | null => {
  const needs = w.kind === 'item' ? itemOf(w.id).needs : repeatOf(w.id).needs;
  return needs && !has(a, needs) ? needs : null;
};
export const priceOf = (a: Pick<AirportState, 'more'>, w: Want) => (w.kind === 'item' ? itemOf(w.id).price : repeatPrice(w.id, a.more[w.id]));
export const isNew = (a: Pick<AirportState, 'owned'>, w: Want) => w.kind === 'more' || !has(a, w.id);
/** He could buy it now if he had the Bolts: for sale, not owned (or one of the again-and-again things), and what it needs is built. */
export const buyable = (a: Pick<AirportState, 'owned' | 'more'>, w: Want) => isNew(a, w) && !missingNeed(a, w) && (w.kind === 'more' || itemOf(w.id).price > 0);

/** Every fixed thing he could buy now, cheapest first. */
export const shopNow = (a: Pick<AirportState, 'owned' | 'more'>): Want[] =>
  FOR_SALE.filter(i => buyable(a, { kind: 'item', id: i.id })).sort((x, y) => x.price - y.price).map(i => ({ kind: 'item', id: i.id }));
export const repeatsNow = (a: Pick<AirportState, 'owned' | 'more'>): Want[] =>
  REPEAT_IDS.map(id => ({ kind: 'more', id }) as Want).filter(w => buyable(a, w)).sort((x, y) => priceOf(a, x) - priceOf(a, y));
/** The fixed catalogue is all bought (the again-and-again things are always on offer once they open). */
export const catalogueDone = (a: Pick<AirportState, 'owned'>) => FOR_SALE.every(i => has(a, i.id));

/** His Goal: what he tapped and couldn't afford, else the cheapest new thing, else the cheapest again-and-again thing. */
export function goalOf(a: AirportState): Want | null {
  if (a.goal) { const w = wantOf(a.goal); if (buyable(a, w)) return w; }
  return shopNow(a)[0] ?? repeatsNow(a)[0] ?? null;
}
export const selectGoal = (a: AirportState, w: Want): AirportState => ({ ...a, goal: wantKey(w) });

export type PurchaseFailure = 'invalid-item' | 'invalid-balance' | 'insufficient-funds' | 'already-owned' | 'not-yet';
/** Buying a plane puts it in the Fleet and makes it the one he flies (if it can fly from his runway); a paint goes on that plane. */
export function proposePurchase(a: AirportState, w: Want, balance: number): PurchaseProposal<AirportState, PurchaseFailure> {
  if (!isAmount(balance)) return { kind: 'rejected', reason: 'invalid-balance' };
  if (w.kind === 'item' ? !isItemId(w.id) || itemOf(w.id).price <= 0 : !REPEAT_IDS.includes(w.id)) return { kind: 'rejected', reason: 'invalid-item' };
  if (!isNew(a, w)) return { kind: 'rejected', reason: 'already-owned' };
  if (missingNeed(a, w)) return { kind: 'rejected', reason: 'not-yet' };
  const cost = priceOf(a, w);
  if (balance < cost) return { kind: 'rejected', reason: 'insufficient-funds' };
  return { kind: 'ready', cost, state: bought(a, w) };
}
export function bought(a: AirportState, w: Want): AirportState {
  const goal = a.goal === wantKey(w) ? null : a.goal;
  if (w.kind === 'more') return { ...a, more: { ...a.more, [w.id]: a.more[w.id] + 1 }, goal };
  const item = itemOf(w.id), owned = [...a.owned, w.id];
  let next: AirportState = { ...a, owned, goal };
  if (item.cat === 'plane') {
    const m = item.model;
    next = { ...next, liveries: { ...next.liveries, [m]: freshLivery(PLANE_MODELS.indexOf(m)) } };
    if (canFly(next, m)) next = { ...next, flying: m };
  }
  if (item.cat === 'paint') next = wear(next, a.flying, { base: w.id });
  if (item.cat === 'stripe') next = wear(next, a.flying, { stripe: w.id });
  if (item.cat === 'tail') next = wear(next, a.flying, { tail: w.id });
  if (item.cat === 'mark') next = { ...next, airline: { ...next.airline, mark: w.id } };
  if (w.id === 'sign:goldlights') next = { ...next, lights: 'sign:goldlights' };
  return withTrophies(next);
}
/** Dresses a plane in things he owns. */
export function wear(a: AirportState, m: PlaneModel, change: Partial<Livery>): AirportState {
  const l = a.liveries[m];
  if (!l) return a;
  for (const v of Object.values(change)) if (typeof v === 'string' && !has(a, v)) return a;
  return { ...a, liveries: { ...a.liveries, [m]: { ...l, ...change } } };
}
export const liveryOf = (a: Pick<AirportState, 'liveries'>, m: PlaneModel): Livery => a.liveries[m] ?? freshLivery(PLANE_MODELS.indexOf(m));

// ---------- the Fleet ----------

/** How long a runway he has: 0 grass, 1 tarmac, 2 long. */
export const runwayLevel = (a: Pick<AirportState, 'owned'>) => (has(a, 'piece:long') ? 2 : has(a, 'piece:tarmac') ? 1 : 0);
export const fleet = (a: Pick<AirportState, 'owned'>) => PLANE_MODELS.filter(m => has(a, `plane:${m}`));
/** A plane flies when his runway is long enough for it; the helicopter needs the helipad. */
export function canFly(a: Pick<AirportState, 'owned'>, m: PlaneModel): boolean {
  const spec = PLANE_SPECS[m];
  if (spec.ability === 'heli') return has(a, 'piece:helipad');
  return runwayLevel(a) >= spec.runway;
}
/** What a plane needs before it can fly. */
export const flyNeeds = (m: PlaneModel): string => (PLANE_SPECS[m].ability === 'heli' ? 'piece:helipad' : PLANE_SPECS[m].runway === 2 ? 'piece:long' : 'piece:tarmac');
export const flyingPlane = (a: AirportState): PlaneModel => (has(a, `plane:${a.flying}`) && canFly(a, a.flying) ? a.flying : 'twoseater');
/** How many planes his gates park (the first stand needs no gate). */
export const gateCount = (a: Pick<AirportState, 'owned' | 'more'>) => [1, 2, 3, 4, 5, 6].filter(i => has(a, `piece:gate${i}`)).length + a.more.gate;

/** Runway light colours he can choose: white, gold if he bought it, and the colours Charters gave him. */
export function lightChoices(a: Pick<AirportState, 'owned'>): string[] {
  return ['white', ...(has(a, 'sign:goldlights') ? ['sign:goldlights'] : []), ...a.owned.filter(id => prizeById(id)?.kind === 'lights')];
}
export const lightHex = (id: string) => (id === 'sign:goldlights' ? '#ffc53d' : id === 'white' ? '#fff8d8' : (prizeById(id) as { hex?: string } | null)?.hex ?? '#fff8d8');

// ---------- passengers and ranks ----------

/** How many people the terminal and the ways to get there bring to one Flight. */
export function capacity(a: Pick<AirportState, 'owned' | 'more'>): number {
  const terminal = has(a, 'piece:glass') ? 600 : has(a, 'piece:bigterminal') ? 300 : has(a, 'piece:terminal') ? 100 : has(a, 'piece:hut') ? 30 : 10;
  const extra: Record<string, number> = { 'piece:carpark': 10, 'piece:bigcarpark': 25, 'piece:busstop': 5, 'piece:taxi': 8, 'piece:hotel': 40, 'piece:train': 60, 'piece:monorail': 40, 'piece:monostation': 20 };
  return terminal + Object.entries(extra).reduce((n, [id, k]) => n + (has(a, id) ? k : 0), 0) + a.more.concourse * 60;
}
/** Passengers on a Flight in this plane: its seats, as many as the airport brings. The cargo plane carries crates, and a few riders. */
export const passengersFor = (a: Pick<AirportState, 'owned' | 'more'>, m: PlaneModel) => Math.max(1, Math.min(PLANE_SPECS[m].seats || 4, capacity(a)));

/** Airport ranks on the big board. After Mega Hub, a Super Hub every 10,000 passengers, numbered, without end. */
export const RANKS = [
  { name: 'Airstrip', at: 0 }, { name: 'Airfield', at: 50 }, { name: 'Airport', at: 250 }, { name: 'Big Airport', at: 1000 },
  { name: 'Hub', at: 3000 }, { name: 'Big Hub', at: 7000 }, { name: 'Mega Hub', at: 15000 },
] as const;
export type RankName = (typeof RANKS)[number]['name'] | 'Super Hub';
export const SUPER_EVERY = 10000;
export function rankOf(passengers: number): { index: number; name: RankName; number: number; next: number } {
  const fixed = RANKS.findLastIndex(r => passengers >= r.at);
  const top = RANKS[RANKS.length - 1]!.at;
  if (passengers < top + SUPER_EVERY) return { index: fixed, name: RANKS[fixed]!.name, number: 0, next: fixed + 1 < RANKS.length ? RANKS[fixed + 1]!.at : top + SUPER_EVERY };
  const k = Math.floor((passengers - top) / SUPER_EVERY);
  return { index: RANKS.length - 1 + k, name: 'Super Hub', number: k, next: top + (k + 1) * SUPER_EVERY };
}

// ---------- where he flies ----------

/** The Routes are flown in order; one that needs a piece he hasn't built is skipped for now and waits, so the next is open. */
export function routeOpen(a: Pick<AirportState, 'owned' | 'routes'>, i: number): boolean {
  const r = ROUTES[i]!;
  if (r.needs && !has(a, r.needs)) return false;
  return ROUTES.slice(0, i).every(p => (a.routes[p.id]?.flown ?? 0) > 0 || (p.needs !== null && !has(a, p.needs)));
}
export const routeFlown = (a: Pick<AirportState, 'routes'>, id: string) => (a.routes[id]?.flown ?? 0) > 0;
export const routesFlown = (a: Pick<AirportState, 'routes'>) => ROUTES.filter(r => routeFlown(a, r.id)).length;
export const chartersOpen = (a: Pick<AirportState, 'routes'>) => routesFlown(a) >= CHARTER_OPENS;
/** The next new Route he can fly, if any. */
export const nextNewRoute = (a: Pick<AirportState, 'owned' | 'routes'>) => ROUTES.find((r, i) => !routeFlown(a, r.id) && routeOpen(a, i)) ?? null;

export type FlightMode = 'route' | 'charter' | 'again';
export interface FlightPlan { dest: Destination; mode: FlightMode; plane: PlaneModel; charter: number }
/** Where the Flight button goes: what he picked, else the next new Route, else the next Charter, else the first Route again. */
export function planFlight(a: AirportState): FlightPlan {
  const plane = flyingPlane(a);
  if (a.picked === 'charter' && chartersOpen(a)) return { dest: charter(a.charter), mode: 'charter', plane, charter: a.charter };
  if (a.picked && a.picked !== 'charter') {
    const i = ROUTES.findIndex(r => r.id === a.picked);
    if (i >= 0 && (routeFlown(a, a.picked) || routeOpen(a, i))) return { dest: ROUTES[i]!, mode: routeFlown(a, a.picked) ? 'again' : 'route', plane, charter: 0 };
  }
  const fresh = nextNewRoute(a);
  if (fresh) return { dest: fresh, mode: 'route', plane, charter: 0 };
  if (chartersOpen(a)) return { dest: charter(a.charter), mode: 'charter', plane, charter: a.charter };
  return { dest: routeBy('r1'), mode: 'again', plane, charter: 0 };
}
export const pick = (a: AirportState, id: string): AirportState | null => {
  if (id === 'charter') return chartersOpen(a) ? { ...a, picked: id } : null;
  const i = ROUTES.findIndex(r => r.id === id);
  return i >= 0 && (routeFlown(a, id) || routeOpen(a, i)) ? { ...a, picked: id } : null;
};

// ---------- paying for a Flight ----------

/** A finished Flight pays this, plus one for every five stars, plus the bonuses below. A Round pays at most 6, so a Round and its
 *  Flight pay at most 6 + 2 + 3 + 3 + 1 = 15, the same ceiling as Turbo Tally's Race. */
export const FLIGHT_BOLTS = 2, STAR_BOLTS_EVERY = 5, STAR_BOLTS_MOST = 3, NEW_ROUTE_BOLTS = 3, CHARTER_BOLTS = 2, BEST_BOLTS = 1;
export const MOST_FLIGHT_BOLTS = FLIGHT_BOLTS + STAR_BOLTS_MOST + NEW_ROUTE_BOLTS + BEST_BOLTS;

export interface FlightResult { stars: number; grade: 1 | 2 | 3; fires: number }
export interface FlightPay {
  bolts: number;
  passengers: number;
  /** A Route flown for the first time, and the one that opened after it. */
  newRoute: boolean;
  opened: Destination | null;
  /** Beat his best stars, or his best landing, on this Route. */
  bestStars: boolean; bestLanding: boolean;
  prize: CharterPrize | null;
  /** The rank he went up to. */
  rank: ReturnType<typeof rankOf> | null;
  trophies: string[];
}
export function payFor(a: AirportState, plan: FlightPlan, res: FlightResult): FlightPay {
  const rec = plan.mode === 'charter' ? null : a.routes[plan.dest.id] ?? { flown: 0, bestStars: 0, bestLanding: 0 };
  const newRoute = plan.mode !== 'charter' && rec!.flown === 0;
  const stars = Math.min(res.stars + res.fires, plan.dest.stars.length + plan.dest.fires.length);
  const bestStars = !!rec && rec.flown > 0 && stars > rec.bestStars, bestLanding = !!rec && rec.flown > 0 && res.grade > rec.bestLanding;
  const bolts = FLIGHT_BOLTS + Math.min(STAR_BOLTS_MOST, Math.floor(stars / STAR_BOLTS_EVERY)) + (newRoute ? NEW_ROUTE_BOLTS : 0)
    + (plan.mode === 'charter' ? CHARTER_BOLTS : 0) + (bestStars || bestLanding ? BEST_BOLTS : 0);
  const passengers = passengersFor(a, plan.plane);
  const before = rankOf(a.passengers), after = rankOf(a.passengers + passengers);
  const prize = plan.mode === 'charter' ? prizeFor(plan.charter) : null;
  const pay: FlightPay = { bolts, passengers, newRoute, opened: null, bestStars, bestLanding, prize: prize && !has(a, prize.id) ? prize : null, rank: after.index > before.index ? after : null, trophies: [] };
  const next = finishFlight(a, plan, res, pay);
  if (newRoute) { const o = nextNewRoute(next); pay.opened = o; }
  pay.trophies = next.trophies.filter(t => !a.trophies.includes(t));
  return pay;
}
/** The Flight ended: it's used, the record kept, the passengers counted and what he won is his. */
export function finishFlight(a: AirportState, plan: FlightPlan, res: FlightResult, pay: Pick<FlightPay, 'passengers' | 'prize'>): AirportState {
  const stars = Math.min(res.stars + res.fires, plan.dest.stars.length + plan.dest.fires.length);
  const routes = plan.mode === 'charter' ? a.routes : (() => {
    const was = a.routes[plan.dest.id] ?? { flown: 0, bestStars: 0, bestLanding: 0 };
    return { ...a.routes, [plan.dest.id]: { flown: was.flown + 1, bestStars: Math.max(was.bestStars, stars), bestLanding: Math.max(was.bestLanding, res.grade) } };
  })();
  const owned = pay.prize && !has(a, pay.prize.id) ? [...a.owned, pay.prize.id] : a.owned;
  let next: AirportState = {
    ...a, owned, routes, flights: Math.max(0, a.flights - 1), flown: a.flown + 1, passengers: a.passengers + pay.passengers,
    charter: plan.mode === 'charter' ? Math.max(a.charter, plan.charter + 1) : a.charter, smooth: a.smooth + (res.grade === 3 ? 1 : 0),
    picked: a.picked === 'charter' ? a.picked : null, last: plan.dest.id,
  };
  if (pay.prize?.kind === 'tail') next = wear(next, plan.plane, { tail: pay.prize.id });
  if (pay.prize?.kind === 'lights') next = { ...next, lights: pay.prize.id };
  return withTrophies(next, plan);
}
/** A Round finished: one more Flight. */
export const earnFlight = (a: AirportState): AirportState => ({ ...a, flights: a.flights + 1 });

// ---------- Trophies ----------

type Check = (a: AirportState, plan?: FlightPlan) => boolean;
const routesAtLeast = (n: number): Check => a => routesFlown(a) >= n;
const chartersAtLeast = (n: number): Check => a => a.charter - 1 >= n;
const paxAtLeast = (n: number): Check => a => a.passengers >= n;
const piecesAtLeast = (n: number): Check => a => PIECES.filter(p => has(a, p.id)).length >= n;
export const TROPHIES = [
  { id: 'first', name: 'First Flight', icon: '🛫', check: (a => a.flown >= 1) as Check },
  { id: 'routes3', name: 'Three Routes', icon: '🗺️', check: routesAtLeast(3) },
  { id: 'routes6', name: 'Six Routes', icon: '🗺️', check: routesAtLeast(6) },
  { id: 'routes12', name: 'Twelve Routes', icon: '🗺️', check: routesAtLeast(12) },
  { id: 'routes18', name: 'Eighteen Routes', icon: '🗺️', check: routesAtLeast(18) },
  { id: 'routes24', name: 'Every Route', icon: '🌍', check: routesAtLeast(24) },
  { id: 'charter1', name: 'First Charter', icon: '🧭', check: chartersAtLeast(1) },
  { id: 'charter10', name: 'Ten Charters', icon: '🧭', check: chartersAtLeast(10) },
  { id: 'charter25', name: 'Charter Captain', icon: '🧭', check: chartersAtLeast(25) },
  { id: 'charter50', name: 'Charter Ace', icon: '🧭', check: chartersAtLeast(50) },
  { id: 'charter100', name: 'Charter Legend', icon: '🧭', check: chartersAtLeast(100) },
  { id: 'pax100', name: 'Hundred Passengers', icon: '🧍', check: paxAtLeast(100) },
  { id: 'pax1000', name: 'Thousand Passengers', icon: '👥', check: paxAtLeast(1000) },
  { id: 'pax10000', name: 'Ten Thousand Passengers', icon: '👥', check: paxAtLeast(10000) },
  { id: 'pax50000', name: 'Fifty Thousand Passengers', icon: '🏟️', check: paxAtLeast(50000) },
  { id: 'pax100000', name: 'Hundred Thousand Passengers', icon: '🏟️', check: paxAtLeast(100000) },
  { id: 'smooth1', name: 'Smooth Landing', icon: '🛬', check: (a: AirportState) => a.smooth >= 1 },
  { id: 'smooth10', name: 'Ten Smooth Landings', icon: '🛬', check: (a: AirportState) => a.smooth >= 10 },
  { id: 'smooth50', name: 'Landing Star', icon: '🌟', check: (a: AirportState) => a.smooth >= 50 },
  { id: 'allstars', name: 'Every Star', icon: '⭐', check: (a: AirportState) => ROUTES.some(r => (a.routes[r.id]?.bestStars ?? 0) >= r.stars.length) },
  { id: 'fleet3', name: 'Little Fleet', icon: '🛩️', check: (a: AirportState) => fleet(a).length >= 3 },
  { id: 'fleet6', name: 'Big Fleet', icon: '✈️', check: (a: AirportState) => fleet(a).length >= 6 },
  { id: 'fleet12', name: 'Every Plane', icon: '🚀', check: (a: AirportState) => fleet(a).length >= 12 },
  { id: 'build10', name: 'Builder', icon: '🏗️', check: piecesAtLeast(10) },
  { id: 'build30', name: 'Master Builder', icon: '🏗️', check: piecesAtLeast(30) },
  { id: 'buildall', name: 'Dream Airport', icon: '🏰', check: piecesAtLeast(PIECES.length) },
  { id: 'night', name: 'Night Flyer', icon: '🌙', check: (_a: AirportState, p?: FlightPlan) => !!p?.dest.night },
  { id: 'snow', name: 'Snow Flyer', icon: '❄️', check: (_a: AirportState, p?: FlightPlan) => p?.dest.weather === 'snow' },
  { id: 'island', name: 'Island Hopper', icon: '🏝️', check: (_a: AirportState, p?: FlightPlan) => !!p?.dest.sea },
] as const;
export type TrophyName = (typeof TROPHIES)[number]['name'];
export function withTrophies(a: AirportState, plan?: FlightPlan): AirportState {
  const got = TROPHIES.filter(t => !a.trophies.includes(t.id) && t.check(a, plan)).map(t => t.id);
  return got.length ? { ...a, trophies: [...a.trophies, ...got] } : a;
}

// ---------- counting ----------

/** The fixed catalogue: things to buy, Routes to fly, Trophies to win. Charters, their prizes and the again-and-again things are on
 *  top, without end. */
export const CATALOGUE = { forSale: FOR_SALE.length, routes: ROUTES.length, trophies: TROPHIES.length, planes: PLANES.length, paints: PAINTS.length };
export const CATALOGUE_SIZE = CATALOGUE.forSale + CATALOGUE.routes + CATALOGUE.trophies;
export type { Item };
