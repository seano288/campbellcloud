// The Rocket Base on the saved game: what he has built and bought, his rockets and how each one is put together, the payloads waiting to
// fly, his Station, the Launches he has earned and flown, the photos he has taken, his bests and his logbook.
//
// A finished Round earns Bolts and one Launch. Bolts buy buildings, rockets, parts and payloads. Each Launch flies the next photo
// mission and carries the next payload his rocket can lift (or supplies, which never run out); a payload that has not flown before joins
// his Station or his satellites. Every Launch pays a few Bolts and adds to his logbook, and nothing is ever lost. A Launch is only used
// at its end, so leaving halfway costs nothing.
import { isAmount } from '../../currency/amount';
import type { PurchaseProposal } from '../../rewards/purchase';
import {
  BUILDINGS, DECALS, FLAMES, FOR_SALE, isItemId, itemOf, KINDS, PAINTS, PAYLOADS, REPEAT_IDS, repeatOf, repeatPrice, ROCKET_KINDS, SLOTS, STARTERS, starterPart, SUPPLIES, TEST_PAYLOAD,
  type Item, type PartItem, type PayloadItem, type RepeatId, type RocketKind, type Slot,
} from './catalog';
import { FIXED_COUNT, isTargetId, mission, type Mission, type TargetId } from './missions';
import { freeSpots, isLook, suggestModule, type ModuleLook, type Placed } from './station';
import type { RocketLook } from '../art/rocket';
import { freeFor } from '../orbit/sim';

export interface Bests { smooth: number; caught: number }
export interface BaseState {
  /** Catalogue items bought. */
  owned: string[];
  /** How many of each again-and-again thing he has bought. */
  more: Record<RepeatId, number>;
  /** How each rocket he owns is put together. */
  rockets: Partial<Record<RocketKind, RocketLook>>;
  /** The rocket that flies next. */
  flying: RocketKind;
  /** Payloads bought and not flown yet, in the order bought: catalogue ids, or `m:<n>` for a module he designed. */
  waiting: string[];
  /** Payloads that have flown (catalogue ids). */
  flownPayloads: string[];
  /** The modules he designed, by number, and the Station's modules where he put them, and those flown but not put on yet. */
  designs: Record<number, ModuleLook>;
  station: Placed[];
  unplaced: string[];
  /** What he's saving for: an item id, or `more:<repeat>`. */
  goal: string | null;
  /** Launches earned and not flown yet; Launches flown, ever (the next photo mission is flown + 1). */
  launches: number;
  flown: number;
  /** Every place he has photographed, ever. */
  photos: TargetId[];
  bests: Bests;
  /** Fly at night (once he has the floodlights). */
  night: boolean;
}

/** He starts with one free Launch, so he sees the reward before his first purchase. */
export const FIRST_LAUNCHES = 1;
export const freshLook = (kind: RocketKind): RocketLook => ({
  kind, nose: starterPart('nose').id, capsule: starterPart('capsule').id, upper: starterPart('upper').id, main: starterPart('main').id,
  boosters: starterPart('boosters').id, engines: starterPart('engines').id, fins: starterPart('fins').id, paint: PAINTS[0].id, decal: DECALS[0].id, flame: FLAMES[0].id,
});
const noMore = (): Record<RepeatId, number> => ({ pad: 0, hangar: 0, dish: 0, module: 0 });
export const freshBase = (): BaseState => ({
  owned: [...STARTERS], more: noMore(), rockets: { sounding: freshLook('sounding') }, flying: 'sounding', waiting: [], flownPayloads: [], designs: {}, station: [], unplaced: [],
  goal: null, launches: FIRST_LAUNCHES, flown: 0, photos: [], bests: { smooth: 0, caught: 0 }, night: false,
});

type Raw = Record<string, unknown>;
const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);
const count = (x: unknown, max = Number.MAX_SAFE_INTEGER) => (isAmount(x) ? Math.min(x as number, max) : 0);
const isModuleId = (x: unknown): x is string => typeof x === 'string' && /^m:\d+$/.test(x);
const LOOK_KEYS = ['nose', 'capsule', 'upper', 'main', 'boosters', 'engines', 'fins', 'paint', 'decal', 'flame'] as const;

/** Whatever is missing or doesn't read comes back fresh; nothing he doesn't own can be fitted. */
export function readBase(raw: unknown): BaseState {
  const f = freshBase();
  if (!isRecord(raw)) return f;
  const owned = [...new Set([...STARTERS, ...(Array.isArray(raw.owned) ? raw.owned.filter(isItemId) : [])])];
  const has = (id: string) => owned.includes(id);
  const more = isRecord(raw.more) ? raw.more : {}, rk = isRecord(raw.rockets) ? raw.rockets : {};
  const rockets: BaseState['rockets'] = {};
  for (const k of KINDS) {
    if (!has(`r:${k}`)) continue;
    const r = isRecord(rk[k]) ? rk[k] as Raw : {}, fresh = freshLook(k);
    const ok = (key: (typeof LOOK_KEYS)[number]) => {
      const v = r[key];
      if (typeof v !== 'string' || !has(v)) return fresh[key];
      const item = itemOf(v);
      return (item.cat === 'part' ? item.slot === key : item.cat === key) ? v : fresh[key];
    };
    rockets[k] = Object.fromEntries([['kind', k], ...LOOK_KEYS.map(key => [key, ok(key)])]) as unknown as RocketLook;
  }
  const designsRaw = isRecord(raw.designs) ? raw.designs : {}, designs: BaseState['designs'] = {};
  for (const [n, l] of Object.entries(designsRaw)) if (/^\d+$/.test(n) && isLook(l)) designs[Number(n)] = l;
  const known = (id: unknown): id is string => (typeof id === 'string' && PAYLOADS.some(p => p.id === id)) || (isModuleId(id) && Number(id.slice(2)) in designs);
  const station: Placed[] = [];
  if (Array.isArray(raw.station)) for (const p of raw.station) {
    if (!isRecord(p) || !known(p.id) || !Number.isInteger(p.x) || !Number.isInteger(p.y)) continue;
    if (station.some(q => q.id === p.id || (q.x === p.x && q.y === p.y))) continue;
    if (!freeSpots(station).some(s => s.x === p.x && s.y === p.y)) continue; // must join what is there
    station.push({ id: p.id as string, x: p.x as number, y: p.y as number });
  }
  const list = (x: unknown) => (Array.isArray(x) ? [...new Set(x.filter(known))] : []);
  const goal = typeof raw.goal === 'string' && (raw.goal.startsWith('more:') ? REPEAT_IDS.includes(raw.goal.slice(5) as RepeatId) : isItemId(raw.goal) && !has(raw.goal)) ? raw.goal : null;
  const bests = isRecord(raw.bests) ? raw.bests : {};
  const flying = typeof raw.flying === 'string' && (KINDS as readonly string[]).includes(raw.flying) && rockets[raw.flying as RocketKind] ? raw.flying as RocketKind : 'sounding';
  return {
    owned, more: Object.fromEntries(REPEAT_IDS.map(id => [id, count(more[id], Math.min(repeatOf(id).most, 1_000_000))])) as BaseState['more'],
    rockets, flying, waiting: list(raw.waiting), flownPayloads: list(raw.flownPayloads).filter(id => !isModuleId(id)), designs, station,
    unplaced: list(raw.unplaced).filter(id => !station.some(p => p.id === id)), goal, launches: count(raw.launches, 99), flown: count(raw.flown),
    photos: Array.isArray(raw.photos) ? [...new Set(raw.photos.filter(isTargetId))] : [],
    bests: { smooth: count(bests.smooth, 100), caught: count(bests.caught, 999) }, night: raw.night === true && has('b:lights'),
  };
}

export const has = (a: Pick<BaseState, 'owned'>, id: string) => a.owned.includes(id);

// ---------- what his base can do ----------

/** Tower level: 1 to start, one more for each tower built. */
export const towerLevel = (a: Pick<BaseState, 'owned'>) => 1 + ['b:tower1', 'b:tower2', 'b:tower3'].filter(id => has(a, id)).length;
/** Dishes, fixed and bought again. */
export const dishes = (a: Pick<BaseState, 'owned' | 'more'>) => ['b:dish1', 'b:dish2', 'b:dish3'].filter(id => has(a, id)).length + a.more.dish;
export const pads = (a: Pick<BaseState, 'owned' | 'more'>) => 1 + ['b:pad2', 'b:pad3'].filter(id => has(a, id)).length + a.more.pad;
export const myRockets = (a: Pick<BaseState, 'owned'>) => KINDS.filter(k => has(a, `r:${k}`));
/** A rocket stands on his pad if the tower is tall enough for it. */
export const canStand = (a: Pick<BaseState, 'owned'>, k: RocketKind) => towerLevel(a) >= ROCKET_KINDS[k].tower;
/** How much a rocket can lift: its kind, its engines and its boosters. */
export function liftOf(l: RocketLook): number {
  return ROCKET_KINDS[l.kind].lift + (itemOf(l.engines) as PartItem).lift + (itemOf(l.boosters) as PartItem).lift;
}
export const lookOf = (a: Pick<BaseState, 'rockets'>, k: RocketKind): RocketLook => a.rockets[k] ?? freshLook(k);
/** The rocket that flies: the one he picked if the tower stands it, else the sounding rocket. */
export const flyingKind = (a: BaseState): RocketKind => (a.rockets[a.flying] && canStand(a, a.flying) ? a.flying : 'sounding');
/** The strongest lift of any rocket he can fly. */
export const bestLift = (a: BaseState) => Math.max(...myRockets(a).filter(k => canStand(a, k)).map(k => liftOf(lookOf(a, k))));
/** A designed module weighs this much. */
export const MODULE_MASS = 3;
export const massOf = (id: string) => (id.startsWith('m:') ? MODULE_MASS : (PAYLOADS.find(p => p.id === id)?.mass ?? 1));
export const nameOfPayload = (id: string) => (id.startsWith('m:') ? 'New Station Module' : PAYLOADS.find(p => p.id === id)?.name ?? SUPPLIES.name);

/** Fit a part he owns to one of his rockets (an upper stage needs a rocket that has one). */
export function fit(a: BaseState, k: RocketKind, id: string): BaseState | null {
  const r = a.rockets[k];
  if (!r || !has(a, id)) return null;
  const item = itemOf(id);
  const slot: keyof RocketLook | null = item.cat === 'part' ? item.slot : item.cat === 'paint' ? 'paint' : item.cat === 'decal' ? 'decal' : item.cat === 'flame' ? 'flame' : null;
  if (!slot) return null;
  return { ...a, rockets: { ...a.rockets, [k]: { ...r, [slot]: id } } };
}
export const pick = (a: BaseState, k: RocketKind): BaseState | null => (a.rockets[k] && canStand(a, k) ? { ...a, flying: k } : null);

// ---------- buying ----------

/** Something to buy. A new Station module carries the design he made for it. */
export type Want = { kind: 'item'; id: string } | { kind: 'more'; id: RepeatId; design?: ModuleLook };
export const wantKey = (w: Want) => (w.kind === 'item' ? w.id : `more:${w.id}`);
export const wantOf = (key: string): Want => (key.startsWith('more:') ? { kind: 'more', id: key.slice(5) as RepeatId } : { kind: 'item', id: key });
/** What it needs first, if he hasn't got it: another building or payload, the tower for a rocket, or the Station core flown for a module. */
export function missingNeed(a: BaseState, w: Want): string | null {
  const needs = w.kind === 'item' ? itemOf(w.id).needs : repeatOf(w.id).needs;
  if (needs && !has(a, needs)) return needs;
  if (w.kind === 'item') {
    const item = itemOf(w.id);
    if (item.cat === 'rocket' && towerLevel(a) < ROCKET_KINDS[item.kind].tower) return ['b:tower1', 'b:tower2', 'b:tower3'][ROCKET_KINDS[item.kind].tower - 2]!;
  }
  if (w.kind === 'more' && w.id === 'module' && !a.flownPayloads.includes('pl:core')) return 'pl:core';
  return null;
}
/** A payload too heavy for every rocket he can fly is never offered: it needs a bigger rocket first. */
export const tooHeavy = (a: BaseState, w: Want) => w.kind === 'item' && itemOf(w.id).cat === 'payload' && (itemOf(w.id) as PayloadItem).mass > bestLift(a);
export const priceOf = (a: Pick<BaseState, 'more'>, w: Want) => (w.kind === 'item' ? itemOf(w.id).price : repeatPrice(w.id, a.more[w.id]));
export const isNew = (a: Pick<BaseState, 'owned' | 'more'>, w: Want) => (w.kind === 'more' ? a.more[w.id] < repeatOf(w.id).most : !has(a, w.id));
/** He could buy it now if he had the Bolts. */
export function buyable(a: BaseState, w: Want): boolean {
  if (!isNew(a, w) || missingNeed(a, w) || tooHeavy(a, w)) return false;
  return w.kind === 'more' || itemOf(w.id).price > 0;
}
export const shopNow = (a: BaseState): Want[] =>
  FOR_SALE.filter(i => buyable(a, { kind: 'item', id: i.id })).sort((x, y) => x.price - y.price).map(i => ({ kind: 'item', id: i.id }));
export const repeatsNow = (a: BaseState): Want[] =>
  REPEAT_IDS.map(id => ({ kind: 'more', id }) as Want).filter(w => buyable(a, w)).sort((x, y) => priceOf(a, x) - priceOf(a, y));
export const catalogueDone = (a: Pick<BaseState, 'owned'>) => FOR_SALE.every(i => has(a, i.id));

/** His Goal: what he tapped and couldn't afford, else the cheapest new thing, else the cheapest again-and-again thing. */
export function goalOf(a: BaseState): Want | null {
  if (a.goal) { const w = wantOf(a.goal); if (buyable(a, w)) return w; }
  return shopNow(a)[0] ?? repeatsNow(a)[0] ?? null;
}
export const selectGoal = (a: BaseState, w: Want): BaseState => ({ ...a, goal: wantKey(w) });

export type PurchaseFailure = 'invalid-item' | 'invalid-balance' | 'insufficient-funds' | 'already-owned' | 'not-yet';
export function proposePurchase(a: BaseState, w: Want, balance: number): PurchaseProposal<BaseState, PurchaseFailure> {
  if (!isAmount(balance)) return { kind: 'rejected', reason: 'invalid-balance' };
  if (w.kind === 'item' ? !isItemId(w.id) || itemOf(w.id).price <= 0 : !REPEAT_IDS.includes(w.id)) return { kind: 'rejected', reason: 'invalid-item' };
  if (!isNew(a, w)) return { kind: 'rejected', reason: 'already-owned' };
  if (!buyable(a, w)) return { kind: 'rejected', reason: 'not-yet' };
  const cost = priceOf(a, w);
  if (balance < cost) return { kind: 'rejected', reason: 'insufficient-funds' };
  return { kind: 'ready', cost, state: bought(a, w) };
}
/** Buying a rocket puts it on the pad (if the tower stands it); a part, paint, decal or flame goes on the rocket that flies; a payload
 *  waits to fly; a new Station module is his design (or the one made from its number). */
export function bought(a: BaseState, w: Want): BaseState {
  const goal = a.goal === wantKey(w) ? null : a.goal;
  if (w.kind === 'more') {
    const k = a.more[w.id] + 1, next: BaseState = { ...a, more: { ...a.more, [w.id]: k }, goal };
    if (w.id === 'module') return { ...next, designs: { ...a.designs, [k]: w.design && isLook(w.design) ? w.design : suggestModule(k) }, waiting: [...a.waiting, `m:${k}`] };
    return next;
  }
  const item = itemOf(w.id);
  let next: BaseState = { ...a, owned: [...a.owned, w.id], goal };
  if (item.cat === 'rocket') { next = { ...next, rockets: { ...next.rockets, [item.kind]: freshLook(item.kind) } }; if (canStand(next, item.kind)) next = { ...next, flying: item.kind }; }
  if (item.cat === 'part' || item.cat === 'paint' || item.cat === 'decal' || item.cat === 'flame') next = fit(next, flyingKind(next), w.id) ?? next;
  if (item.cat === 'payload') next = { ...next, waiting: [...next.waiting, w.id] };
  return next;
}

// ---------- the logbook ----------

/** Ranks by Launches flown. After Orbit Legend, an Orbit Legend every 40 Launches, numbered, without end. */
export const RANKS = [
  { name: 'Cadet', at: 0 }, { name: 'Rocket Rookie', at: 3 }, { name: 'Launch Crew', at: 8 }, { name: 'Pilot', at: 15 }, { name: 'Commander', at: 25 },
  { name: 'Captain', at: 40 }, { name: 'Flight Director', at: 60 }, { name: 'Space Ace', at: 85 }, { name: 'Star Captain', at: 120 }, { name: 'Orbit Legend', at: 160 },
] as const;
export type RankName = (typeof RANKS)[number]['name'];
export const LEGEND_EVERY = 40;
export function rankOf(flown: number): { index: number; name: RankName; number: number; next: number } {
  const top = RANKS[RANKS.length - 1]!.at;
  if (flown < top + LEGEND_EVERY) {
    const i = RANKS.findLastIndex(r => flown >= r.at);
    return { index: i, name: RANKS[i]!.name, number: 0, next: i + 1 < RANKS.length ? RANKS[i + 1]!.at : top + LEGEND_EVERY };
  }
  const k = Math.floor((flown - top) / LEGEND_EVERY);
  return { index: RANKS.length - 1 + k, name: 'Orbit Legend', number: k + 1, next: top + (k + 1) * LEGEND_EVERY };
}

// ---------- planning a Launch ----------

export interface LaunchPlan {
  readonly m: Mission;
  readonly kind: RocketKind;
  readonly look: RocketLook;
  /** What it carries: a waiting payload it can lift, else supplies (or a test payload before there is a Station). */
  readonly payload: string;
  readonly payloadName: string;
  /** How heavy the load is for the rocket, 0 to 1 (a heavy load climbs a little slower). */
  readonly load: number;
  readonly night: boolean;
  /** Seconds of free time in orbit. */
  readonly free: number;
  readonly calm: boolean; readonly guide: boolean; readonly wide: boolean; readonly gps: boolean;
}
export function planLaunch(a: BaseState): LaunchPlan {
  const kind = flyingKind(a), look = lookOf(a, kind), lift = liftOf(look);
  const payload = a.waiting.find(id => massOf(id) <= lift) ?? (a.flownPayloads.includes('pl:core') ? SUPPLIES.id : TEST_PAYLOAD.id);
  const mass = payload === SUPPLIES.id || payload === TEST_PAYLOAD.id ? 1 : massOf(payload);
  return {
    m: mission(a.flown + 1), kind, look, payload, payloadName: payload === TEST_PAYLOAD.id ? TEST_PAYLOAD.name : nameOfPayload(payload), load: Math.min(1, mass / Math.max(1, lift)),
    night: a.night && has(a, 'b:lights'), free: freeFor(dishes(a), a.flownPayloads.includes('pl:relay')),
    calm: has(a, 'b:weather'), guide: has(a, 'b:control'), wide: has(a, 'b:mission'), gps: a.flownPayloads.includes('pl:gps'),
  };
}

// ---------- paying for a Launch ----------

/** A Launch pays this, one more for a smooth one (three stars), one for a payload that flies for the first time and one for a new best.
 *  A Round pays at most 6, so a Round and its Launch pay at most 6 + 5 = 11, under Turbo Tally's ceiling of 15. */
export const LAUNCH_BOLTS = 2, SMOOTH_BOLTS = 1, PAYLOAD_BOLTS = 1, BEST_BOLTS = 1;
export const MOST_LAUNCH_BOLTS = LAUNCH_BOLTS + SMOOTH_BOLTS + PAYLOAD_BOLTS + BEST_BOLTS;

export interface LaunchResult { stars: 1 | 2 | 3; smooth: number; caught: readonly TargetId[] }
export interface LaunchPay {
  bolts: number;
  /** A payload that flew for the first time (a new module or satellite). */
  newPayload: string | null;
  /** New bests: smoothest Launch, most caught in one orbit. */
  bestSmooth: boolean; bestCaught: boolean;
  /** Places photographed for the first time ever. */
  newPhotos: TargetId[];
  patch: Mission['patch'];
  rank: ReturnType<typeof rankOf> | null;
}
export function payFor(a: BaseState, plan: LaunchPlan, res: LaunchResult): LaunchPay {
  const smooth = Math.round(res.smooth * 100);
  const newPayload = plan.payload !== SUPPLIES.id && plan.payload !== TEST_PAYLOAD.id ? plan.payload : null;
  const bestSmooth = a.flown > 0 && smooth > a.bests.smooth, bestCaught = a.flown > 0 && res.caught.length > a.bests.caught;
  const bolts = LAUNCH_BOLTS + (res.stars === 3 ? SMOOTH_BOLTS : 0) + (newPayload ? PAYLOAD_BOLTS : 0) + (bestSmooth || bestCaught ? BEST_BOLTS : 0);
  const before = rankOf(a.flown), after = rankOf(a.flown + 1);
  return {
    bolts, newPayload, bestSmooth, bestCaught, newPhotos: res.caught.filter(id => !a.photos.includes(id)), patch: plan.m.patch,
    rank: after.index > before.index ? after : null,
  };
}
/** The Launch ended: it's used, the payload has flown, the photos are on the wall and the logbook is filled. */
export function finishLaunch(a: BaseState, plan: LaunchPlan, res: LaunchResult): BaseState {
  const p = plan.payload, real = p !== SUPPLIES.id && p !== TEST_PAYLOAD.id;
  const module = real && (p.startsWith('m:') || (PAYLOADS.find(x => x.id === p)?.kind === 'module'));
  return {
    ...a, launches: Math.max(0, a.launches - 1), flown: a.flown + 1,
    waiting: real ? a.waiting.filter(x => x !== p) : a.waiting,
    flownPayloads: real && !p.startsWith('m:') && !a.flownPayloads.includes(p) ? [...a.flownPayloads, p] : a.flownPayloads,
    unplaced: module ? [...a.unplaced, p] : a.unplaced,
    photos: [...a.photos, ...res.caught.filter(id => !a.photos.includes(id))],
    bests: { smooth: Math.max(a.bests.smooth, Math.round(res.smooth * 100)), caught: Math.max(a.bests.caught, res.caught.length) },
  };
}
/** A Round finished: one more Launch. */
export const earnLaunch = (a: BaseState): BaseState => ({ ...a, launches: a.launches + 1 });
/** He put a module on the Station. */
export function putModule(a: BaseState, id: string, x: number, y: number): BaseState | null {
  if (!a.unplaced.includes(id) || !freeSpots(a.station).some(s => s.x === x && s.y === y)) return null;
  // the core always goes first, in the middle
  if (!a.station.length && id !== 'pl:core' && a.unplaced.includes('pl:core')) return null;
  return { ...a, station: [...a.station, { id, x, y }], unplaced: a.unplaced.filter(u => u !== id) };
}

// ---------- counting ----------

/** The fixed catalogue: things to buy, hand-made photo missions, ranks. Generated missions and their patches, new modules, more hangars
 *  and dishes and the numbered Orbit Legends are on top, without end. */
export const CATALOGUE = { forSale: FOR_SALE.length, missions: FIXED_COUNT, ranks: RANKS.length };
export const CATALOGUE_SIZE = CATALOGUE.forSale + CATALOGUE.missions + CATALOGUE.ranks;
export type { Item, Slot };
export { BUILDINGS, SLOTS };
