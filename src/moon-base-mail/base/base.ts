// The Moon Base on the saved game: what he has bought and won, where each module stands, the modules on their way, the lander he flies
// and how it is dressed, his crew, his garden, his moon rocks, his Landings and bests, and his badges.
//
// A finished Round earns Bolts and one Landing. Bolts buy modules, landers, parts and things to dress the base. A module he buys goes
// on the supply ship: each Landing delivers the newest one waiting (or a supply crate when none is), and he puts it on a free plot. Each
// Landing also brings back a moon rock, every fifth a special crate, and the garden grows a stage every Round. Nothing is ever lost.
import { isAmount } from '../../currency/amount';
import type { PurchaseProposal } from '../../rewards/purchase';
import {
  DOME_PAINTS, FLAGS, FOR_SALE, HELMETS, isItemId, itemOf, LANDER_SPECS, LANDERS, MODULES, PAINTS, PARTS, PLANTS, REPEAT_IDS, repeatOf, repeatPrice, STARTERS, SUITS,
  type Item, type LanderKind, type LanderSpec, type RepeatId,
} from './catalog';
import { isSpecialId, landingFor, moduleFor, rockFor, specialFor, type LandingPlan, type Special } from './gen';

export interface Bests {
  /** His softest touchdown on the pad (the speed it touched down at), and his closest to the middle of the pad. Lower is better. */
  soft: number | null;
  close: number | null;
}

export interface BaseState {
  /** Catalogue items bought, and special prizes won. */
  owned: string[];
  more: Record<RepeatId, number>;
  /** What stands on each plot ("x,y"): a module's id, a made module ("gen:3"), or the home dome. */
  placed: Record<string, string>;
  /** Modules bought and on their way, oldest first: each Landing brings the newest. */
  pending: string[];
  /** The module that has come and is waiting for him to put it on a plot. */
  toPlace: string | null;
  lander: LanderKind;
  paint: string;
  domePaint: string;
  suit: string;
  helmet: string;
  flag: string;
  lights: string | null;
  goal: string | null;
  /** Landings earned and not flown yet. */
  landings: number;
  /** Landings flown, ever (the next one's number is this + 1). */
  goes: number;
  /** Rounds finished, ever: the garden grows a stage each. */
  rounds: number;
  /** When each plant was planted (its Round), the named ones by id and the made ones by number. */
  planted: Record<string, number>;
  /** Supply crates brought (when no module was waiting). */
  supplies: number;
  bests: Bests;
  badges: string[];
}

/** He starts with one free Landing, so he sees the reward before his first purchase. */
export const FIRST_LANDINGS = 1;
export const HOME = 'home';
/** The plot grid starts 3 by 3, with the home dome in the middle. */
export const START_SIZE = 3;
export const freshBase = (): BaseState => ({
  owned: [...STARTERS], more: { land: 0, module: 0, bed: 0 }, placed: { '1,1': HOME }, pending: [], toPlace: null,
  lander: 'little', paint: 'paint:white', domePaint: 'dome:cream', suit: 'suit:orange', helmet: 'helmet:round', flag: 'flag:base', lights: null,
  goal: null, landings: FIRST_LANDINGS, goes: 0, rounds: 0, planted: {}, supplies: 0, bests: { soft: null, close: null }, badges: [],
});

type Raw = Record<string, unknown>;
const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);
const count = (x: unknown, max = Number.MAX_SAFE_INTEGER) => (isAmount(x) ? Math.min(x as number, max) : 0);
const isGen = (x: unknown) => typeof x === 'string' && /^gen:\d+$/.test(x);
const isModuleId = (x: unknown) => typeof x === 'string' && (isGen(x) || (isItemId(x) && itemOf(x).cat === 'module'));
const best = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) && x >= 0 && x < 1000 ? x : null);

/** Whatever is missing or doesn't read comes back fresh; nothing he doesn't own can be used. */
export function readBase(raw: unknown): BaseState {
  const f = freshBase();
  if (!isRecord(raw)) return f;
  const owned = [...new Set([...STARTERS, ...(Array.isArray(raw.owned) ? raw.owned.filter(x => isItemId(x) || isSpecialId(x)) as string[] : [])])];
  const has = (id: unknown): id is string => typeof id === 'string' && owned.includes(id);
  const more = isRecord(raw.more) ? raw.more : {};
  const m = Object.fromEntries(REPEAT_IDS.map(id => [id, count(more[id], 9999)])) as BaseState['more'];
  const size = gridSize(m.land);
  const placed: Record<string, string> = { '1,1': HOME };
  const genOk = (id: string) => isGen(id) && Number(id.slice(4)) < m.module;
  const usable = (id: unknown): id is string => isModuleId(id) && (isGen(id) ? genOk(id as string) : has(id));
  const seen = new Set<string>();
  if (isRecord(raw.placed)) for (const [k, v] of Object.entries(raw.placed)) {
    const [x, y] = k.split(',').map(Number);
    if (!Number.isInteger(x) || !Number.isInteger(y) || x! < 0 || y! < 0 || x! >= size.cols || y! >= size.rows || k === '1,1') continue;
    if (usable(v) && !seen.has(v)) { placed[k] = v; seen.add(v); }
  }
  const pending: string[] = [];
  if (Array.isArray(raw.pending)) for (const x of raw.pending) if (usable(x) && !seen.has(x)) { pending.push(x); seen.add(x); }
  const toPlace = usable(raw.toPlace) && !seen.has(raw.toPlace) ? raw.toPlace : null;
  // anything bought that is nowhere goes back on the ship (nothing is ever lost)
  const everywhere = new Set([...Object.values(placed), ...pending, ...(toPlace ? [toPlace] : [])]);
  for (const id of [...owned.filter(id => isItemId(id) && itemOf(id).cat === 'module'), ...Array.from({ length: m.module }, (_, i) => `gen:${i}`)]) if (!everywhere.has(id)) pending.unshift(id);
  const pick = (id: unknown, prefix: string, fallback: string) => (has(id) && String(id).startsWith(prefix) ? id : fallback);
  const bests = isRecord(raw.bests) ? raw.bests : {};
  const planted = isRecord(raw.planted) ? Object.fromEntries(Object.entries(raw.planted).filter(([k, v]) => (has(k) || /^bed:\d+$/.test(k)) && isAmount(v))) as Record<string, number> : {};
  const lander = (LANDERS.map(l => l.id.slice(7)) as LanderKind[]).find(k => k === raw.lander && has(`lander:${k}`)) ?? f.lander;
  return {
    owned, more: m, placed, pending, toPlace, lander,
    paint: pick(raw.paint, 'paint:', f.paint), domePaint: pick(raw.domePaint, 'dome:', f.domePaint), suit: pick(raw.suit, 'suit:', f.suit),
    helmet: pick(raw.helmet, 'helmet:', f.helmet), flag: pick(raw.flag, 'flag:', f.flag),
    lights: has(raw.lights) && PARTS.some(p => p.id === raw.lights && p.slot === 'lights') ? raw.lights as string : null,
    goal: typeof raw.goal === 'string' && (raw.goal.startsWith('more:') ? REPEAT_IDS.includes(raw.goal.slice(5) as RepeatId) : isItemId(raw.goal) && !has(raw.goal)) ? raw.goal : null,
    landings: count(raw.landings, 99), goes: count(raw.goes), rounds: count(raw.rounds), planted, supplies: count(raw.supplies),
    bests: { soft: best(bests.soft), close: best(bests.close) },
    badges: Array.isArray(raw.badges) ? BADGES.map(t => t.id).filter(id => (raw.badges as unknown[]).includes(id)) : [],
  };
}

export const has = (b: Pick<BaseState, 'owned'>, id: string) => b.owned.includes(id);

// ---------- plots ----------

/** Each Land Patch adds a column, then a row, in turn: the base has no edge. */
export function gridSize(land: number): { cols: number; rows: number } {
  return { cols: START_SIZE + Math.ceil(land / 2), rows: START_SIZE + Math.floor(land / 2) };
}
export const plotKeys = (b: Pick<BaseState, 'more'>): string[] => {
  const { cols, rows } = gridSize(b.more.land), out: string[] = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) out.push(`${x},${y}`);
  return out;
};
export const freePlots = (b: Pick<BaseState, 'more' | 'placed'>) => plotKeys(b).filter(k => !b.placed[k]);
/** Plots not yet spoken for: free, less the modules on their way or waiting to go down. */
export const roomFor = (b: Pick<BaseState, 'more' | 'placed' | 'pending' | 'toPlace'>) => freePlots(b).length - b.pending.length - (b.toPlace ? 1 : 0);
/** Puts the module that came on a plot. */
export function place(b: BaseState, plot: string): BaseState {
  if (!b.toPlace || b.placed[plot] || !plotKeys(b).includes(plot)) return b;
  return withBadges({ ...b, placed: { ...b.placed, [plot]: b.toPlace }, toPlace: null });
}
/** Moves a module from one plot to another (or swaps two). The home dome stays where it is. */
export function move(b: BaseState, from: string, to: string): BaseState {
  const a = b.placed[from], c = b.placed[to];
  if (!a || a === HOME || c === HOME || from === to || !plotKeys(b).includes(to)) return b;
  const placed = { ...b.placed, [to]: a };
  if (c) placed[from] = c; else delete placed[from];
  return { ...b, placed };
}
/** The modules on the base, by plot. */
export const modulesOn = (b: Pick<BaseState, 'placed'>) => Object.entries(b.placed).filter(([, id]) => id !== HOME);
export const hasModule = (b: Pick<BaseState, 'placed' | 'toPlace' | 'owned'>, id: string) => has(b, id);

// ---------- buying ----------

export type Want = { kind: 'item'; id: string } | { kind: 'more'; id: RepeatId };
export const wantKey = (w: Want) => (w.kind === 'item' ? w.id : `more:${w.id}`);
export const wantOf = (key: string): Want => (key.startsWith('more:') ? { kind: 'more', id: key.slice(5) as RepeatId } : { kind: 'item', id: key });
const namedModules = (b: Pick<BaseState, 'owned'>) => MODULES.filter(m => has(b, m.id)).length;
const isModuleWant = (w: Want) => (w.kind === 'item' ? itemOf(w.id).cat === 'module' : w.id === 'module');

/** What it needs first, if he hasn't got it: another thing, or a free plot (for a module). */
export function missingNeed(b: BaseState, w: Want): string | null {
  if (w.kind === 'item') { const needs = itemOf(w.id).needs; if (needs && !has(b, needs)) return needs; }
  if (w.kind === 'more') {
    const r = repeatOf(w.id);
    if ('needs' in r && r.needs && !has(b, r.needs)) return r.needs;
    if ('needsCount' in r && r.needsCount && namedModules(b) < r.needsCount) return 'modules';
  }
  if (isModuleWant(w) && roomFor(b) < 1) return 'land';
  return null;
}
export const priceOf = (b: Pick<BaseState, 'more'>, w: Want) => (w.kind === 'item' ? itemOf(w.id).price : repeatPrice(w.id, b.more[w.id]));
export const isNew = (b: Pick<BaseState, 'owned'>, w: Want) => w.kind === 'more' || !has(b, w.id);
export const buyable = (b: BaseState, w: Want) => isNew(b, w) && !missingNeed(b, w) && (w.kind === 'more' || itemOf(w.id).price > 0);
export const shopNow = (b: BaseState): Want[] => FOR_SALE.filter(i => buyable(b, { kind: 'item', id: i.id })).sort((x, y) => x.price - y.price).map(i => ({ kind: 'item', id: i.id }));
export const repeatsNow = (b: BaseState): Want[] =>
  REPEAT_IDS.map(id => ({ kind: 'more', id }) as Want).filter(w => buyable(b, w)).sort((x, y) => priceOf(b, x) - priceOf(b, y));
export const catalogueDone = (b: Pick<BaseState, 'owned'>) => FOR_SALE.every(i => has(b, i.id));
/** New things that wait only for a free plot: the shop shows them with a Land Patch as the way to them. */
export const waitingForLand = (b: BaseState): Want[] => FOR_SALE.filter(i => !has(b, i.id) && missingNeed(b, { kind: 'item', id: i.id }) === 'land').map(i => ({ kind: 'item', id: i.id }));
/** What the shop points him at next: the cheapest new thing, or a Land Patch when new modules wait for a plot, or the cheapest
 *  again-and-again thing. */
export function nextWant(b: BaseState): Want | null {
  const land: Want = { kind: 'more', id: 'land' };
  return shopNow(b)[0] ?? (waitingForLand(b).length && buyable(b, land) ? land : null) ?? repeatsNow(b)[0] ?? null;
}

/** His Goal: what he tapped and couldn't afford, else the cheapest new thing, else the cheapest again-and-again thing. A module that
 *  needs a plot shows Land Patch as the Goal instead, so he is never stuck. */
export function goalOf(b: BaseState): Want | null {
  if (b.goal) { const w = wantOf(b.goal); if (buyable(b, w)) return w; if (missingNeed(b, w) === 'land' && buyable(b, { kind: 'more', id: 'land' })) return { kind: 'more', id: 'land' }; }
  return nextWant(b);
}
export const selectGoal = (b: BaseState, w: Want): BaseState => ({ ...b, goal: wantKey(w) });

export type PurchaseFailure = 'invalid-item' | 'invalid-balance' | 'insufficient-funds' | 'already-owned' | 'not-yet';
export function proposePurchase(b: BaseState, w: Want, balance: number): PurchaseProposal<BaseState, PurchaseFailure> {
  if (!isAmount(balance)) return { kind: 'rejected', reason: 'invalid-balance' };
  if (w.kind === 'item' ? !isItemId(w.id) || itemOf(w.id).price <= 0 : !REPEAT_IDS.includes(w.id)) return { kind: 'rejected', reason: 'invalid-item' };
  if (!isNew(b, w)) return { kind: 'rejected', reason: 'already-owned' };
  if (missingNeed(b, w)) return { kind: 'rejected', reason: 'not-yet' };
  const cost = priceOf(b, w);
  if (balance < cost) return { kind: 'rejected', reason: 'insufficient-funds' };
  return { kind: 'ready', cost, state: bought(b, w) };
}
/** Buying puts it to use: a module goes on the supply ship, a lander becomes the one he flies, a part, paint, suit or flag goes on. */
export function bought(b: BaseState, w: Want): BaseState {
  const goal = b.goal === wantKey(w) ? null : b.goal;
  if (w.kind === 'more') {
    const k = b.more[w.id], next = { ...b, more: { ...b.more, [w.id]: k + 1 }, goal };
    if (w.id === 'module') return withBadges({ ...next, pending: [...b.pending, `gen:${k}`] });
    if (w.id === 'bed') return withBadges({ ...next, planted: { ...b.planted, [`bed:${k}`]: b.rounds } });
    return withBadges(next);
  }
  const item = itemOf(w.id);
  let next: BaseState = { ...b, owned: [...b.owned, w.id], goal };
  if (item.cat === 'module') next = { ...next, pending: [...next.pending, w.id] };
  if (item.cat === 'lander') next = { ...next, lander: w.id.slice(7) as LanderKind };
  if (item.cat === 'paint') next = { ...next, paint: w.id };
  if (item.cat === 'dome') next = { ...next, domePaint: w.id };
  if (item.cat === 'suit') next = { ...next, suit: w.id };
  if (item.cat === 'helmet') next = { ...next, helmet: w.id };
  if (item.cat === 'flag') next = { ...next, flag: w.id };
  if (item.cat === 'part' && item.slot === 'lights') next = { ...next, lights: w.id };
  if (item.cat === 'plant') next = { ...next, planted: { ...next.planted, [w.id]: b.rounds } };
  return withBadges(next);
}
/** Puts on something he owns (a lander, a paint, a suit ...). */
export function wear(b: BaseState, id: string): BaseState {
  if (!has(b, id)) return b;
  const item = itemOf(id);
  if (!item) return b;
  if (item.cat === 'lander') return { ...b, lander: id.slice(7) as LanderKind };
  if (item.cat === 'paint') return { ...b, paint: id };
  if (item.cat === 'dome') return { ...b, domePaint: id };
  if (item.cat === 'suit') return { ...b, suit: id };
  if (item.cat === 'helmet') return { ...b, helmet: id };
  if (item.cat === 'flag') return { ...b, flag: id };
  if (item.cat === 'part' && item.slot === 'lights') return { ...b, lights: id };
  return b;
}

// ---------- the lander ----------

const rank = (b: Pick<BaseState, 'owned'>, slot: 'legs' | 'engine' | 'jets') => Math.max(0, ...PARTS.filter(p => p.slot === slot && has(b, p.id)).map(p => p.rank ?? 0));
/** How his lander flies, with its parts: each rank of engine pushes harder, of jets slides faster, of legs lands softer. */
export function specOf(b: Pick<BaseState, 'owned' | 'lander'>): LanderSpec {
  const s = LANDER_SPECS[b.lander];
  return { ...s, thrust: s.thrust + rank(b, 'engine') * 1.5, slide: s.slide + rank(b, 'jets') * 6, bounce: s.bounce * (1 - rank(b, 'legs') * 0.22), hop: s.hop };
}
export const paintHex = (b: Pick<BaseState, 'paint'>) => (PAINTS.find(p => p.id === b.paint)?.hex ?? '#f2f2f2');
export const domeHex = (b: Pick<BaseState, 'domePaint'>) => (DOME_PAINTS.find(p => p.id === b.domePaint)?.hex ?? '#f4ecd8');
export const suitHex = (b: Pick<BaseState, 'suit'>) => (SUITS.find(p => p.id === b.suit)?.hex ?? '#ff8c1a');
export const helmetIcon = (b: Pick<BaseState, 'helmet'>) => (HELMETS.find(p => p.id === b.helmet)?.icon ?? '⚪');
export const flagIcon = (b: Pick<BaseState, 'flag'>) => (FLAGS.find(p => p.id === b.flag)?.icon ?? '🚩');
export const lightsHex = (b: Pick<BaseState, 'lights'>) => { const l = PARTS.find(p => p.id === b.lights); return l?.hex ?? null; };

// ---------- the crew ----------

/** Who lives at the base: the five letter-writers, Dot and Pip from the start, and one more for each living dome. */
export const CREW = ['Ava', 'Sam', 'Kit', 'Ben', 'Jo'] as const;
export const NEW_CREW = [
  { name: 'Max', dome: 'module:living1', line: 'I can fix rockets!' }, { name: 'Pam', dome: 'module:living2', line: 'I love the green dome!' },
  { name: 'Tess', dome: 'module:living3', line: 'Look at the Earth!' }, { name: 'Rex', dome: 'module:living4', line: 'Moon hops are the best!' },
  { name: 'Liz', dome: 'module:living5', line: 'I found a moon rock!' }, { name: 'Gus', dome: 'module:living6', line: 'Hi, Commander!' },
] as const;
export const crewOf = (b: Pick<BaseState, 'placed'>) => NEW_CREW.filter(c => Object.values(b.placed).includes(c.dome));

// ---------- the garden ----------

/** A plant's stage, 0 (seed) to GROWN: one stage a Round (two with the Glass Garden Dome). */
export const GROWN = 4;
export function stageOf(b: Pick<BaseState, 'rounds' | 'placed'>, plantedAt: number): number {
  const speed = Object.values(b.placed).includes('module:gardendome') ? 2 : 1;
  return Math.min(GROWN, (b.rounds - plantedAt) * speed);
}
/** What the grown plants have given, without end: each grown plant gives one a Round. */
export const harvestOf = (b: Pick<BaseState, 'rounds' | 'planted' | 'placed'>) =>
  Object.values(b.planted).reduce((s, at) => s + Math.max(0, b.rounds - at - GROWN), 0);
export const PLANT_ITEMS = PLANTS;

// ---------- a Landing ----------

/** A Landing pays this, plus one for each best he beats (his softest touchdown, his closest to the middle). A Round pays at most 6, so a
 *  Round and its Landing pay at most 11, under Turbo Tally's 15. */
export const LANDING_BOLTS = 3, BEST_BOLTS = 1;
export const MOST_LANDING_BOLTS = LANDING_BOLTS + 2 * BEST_BOLTS;

export interface GoPlan { n: number; landing: LandingPlan; carrying: string | null; special: Special | null }
/** The next Landing: its number, its ground, and what it carries (the newest module waiting, or a supply crate). */
export function planGo(b: BaseState): GoPlan {
  const n = b.goes + 1, sp = specialFor(n);
  return { n, landing: landingFor(n), carrying: b.pending.at(-1) ?? null, special: sp && !has(b, sp.id) ? sp : null };
}
export interface GoResult { /** How fast it first touched the pad, and how far from the middle it came to rest. */ soft: number; close: number }
export interface GoPay { bolts: number; bestSoft: boolean; bestClose: boolean; special: Special | null; carrying: string | null; badges: string[] }
export function payFor(b: BaseState, plan: GoPlan, res: GoResult): GoPay {
  const bestSoft = b.bests.soft !== null && res.soft < b.bests.soft - 0.05, bestClose = b.bests.close !== null && res.close < b.bests.close - 0.05;
  const pay: GoPay = { bolts: LANDING_BOLTS + (bestSoft ? BEST_BOLTS : 0) + (bestClose ? BEST_BOLTS : 0), bestSoft, bestClose, special: plan.special, carrying: plan.carrying, badges: [] };
  pay.badges = finishGo(b, plan, res).badges.filter(t => !b.badges.includes(t));
  return pay;
}
/** The Landing is done: it is used, the module it carried waits to be put down (one already waiting goes down by itself first), what it
 *  brought is his, and the bests are kept. */
export function finishGo(b: BaseState, plan: GoPlan, res: GoResult): BaseState {
  let s = b;
  if (s.toPlace) { const spot = freePlots(s)[0]; s = spot ? { ...s, placed: { ...s.placed, [spot]: s.toPlace }, toPlace: null } : s; }
  const carrying = plan.carrying && s.pending.includes(plan.carrying) && !s.toPlace ? plan.carrying : null;
  const owned = plan.special && !has(s, plan.special.id) ? [...s.owned, plan.special.id] : s.owned;
  return withBadges({
    ...s, owned, landings: Math.max(0, s.landings - 1), goes: s.goes + 1,
    pending: carrying ? s.pending.filter(x => x !== carrying) : s.pending, toPlace: carrying ?? s.toPlace,
    supplies: s.supplies + (carrying ? 0 : 1),
    bests: { soft: s.bests.soft === null ? res.soft : Math.min(s.bests.soft, res.soft), close: s.bests.close === null ? res.close : Math.min(s.bests.close, res.close) },
  }, res);
}
/** A Round finished: one more Landing, and the garden grows. */
export const earnLanding = (b: BaseState): BaseState => withBadges({ ...b, landings: b.landings + 1, rounds: b.rounds + 1 });
/** His moon rocks, one from each Landing flown, newest first (made from their number: there is no last rock). */
export const rocksOf = (b: Pick<BaseState, 'goes' | 'owned'>, limit = 24) =>
  Array.from({ length: Math.min(limit, b.goes) }, (_, i) => rockFor(b.goes - i, has(b, 'module:moonmine')));
export const genModule = moduleFor;

// ---------- badges ----------

type Check = (b: BaseState, res?: GoResult) => boolean;
const goes = (n: number): Check => b => b.goes >= n;
const modules = (n: number): Check => b => modulesOn(b).length >= n;
export const SOFT_BADGE = 3, BULLSEYE = 2;
export const BADGES = [
  { id: 'first', name: 'First Landing', icon: '🛬', check: goes(1) },
  { id: 'goes10', name: 'Ten Landings', icon: '🛬', check: goes(10) },
  { id: 'goes25', name: 'Space Pilot', icon: '🧑‍🚀', check: goes(25) },
  { id: 'goes50', name: 'Fifty Landings', icon: '🚀', check: goes(50) },
  { id: 'goes100', name: 'Hundred Landings', icon: '💯', check: goes(100) },
  { id: 'goes250', name: 'Moon Ace', icon: '🏅', check: goes(250) },
  { id: 'goes500', name: 'Moon Legend', icon: '🏆', check: goes(500) },
  { id: 'feather', name: 'Soft as a Feather', icon: '🪶', check: (b: BaseState) => b.bests.soft !== null && b.bests.soft <= SOFT_BADGE },
  { id: 'bullseye', name: 'Bullseye', icon: '🎯', check: (b: BaseState) => b.bests.close !== null && b.bests.close <= BULLSEYE },
  { id: 'mod5', name: 'Little Base', icon: '🏠', check: modules(5) },
  { id: 'mod10', name: 'Busy Base', icon: '🏘️', check: modules(10) },
  { id: 'mod25', name: 'Moon Town', icon: '🏙️', check: modules(25) },
  { id: 'mod50', name: 'Moon City', icon: '🌆', check: modules(50) },
  { id: 'crew3', name: 'Big Crew', icon: '👩‍🚀', check: (b: BaseState) => crewOf(b).length >= 3 },
  { id: 'crew6', name: 'Full Crew', icon: '👨‍👩‍👧‍👦', check: (b: BaseState) => crewOf(b).length >= 6 },
  { id: 'plants5', name: 'Green Thumb', icon: '🌱', check: (b: BaseState) => Object.keys(b.planted).length >= 5 },
  { id: 'plants20', name: 'Moon Farmer', icon: '🧑‍🌾', check: (b: BaseState) => Object.keys(b.planted).length >= 20 },
  { id: 'harvest100', name: 'Big Harvest', icon: '🧺', check: (b: BaseState) => harvestOf(b) >= 100 },
  { id: 'night', name: 'Night Lander', icon: '🌙', check: (b: BaseState) => b.goes >= 7 },
  { id: 'landers', name: 'Every Lander', icon: '🛸', check: (b: BaseState) => LANDERS.every(l => has(b, l.id)) },
  { id: 'land5', name: 'Land Owner', icon: '🟫', check: (b: BaseState) => b.more.land >= 5 },
  { id: 'land9', name: 'Moon Mayor', icon: '🗺️', check: (b: BaseState) => b.more.land >= 9 },
  { id: 'specials5', name: 'Crate Collector', icon: '🎁', check: (b: BaseState) => b.owned.filter(isSpecialId).length >= 5 },
  { id: 'flags10', name: 'Flag Fan', icon: '🚩', check: (b: BaseState) => FLAGS.filter(f => has(b, f.id)).length >= 10 },
  { id: 'supplies20', name: 'Supply Chief', icon: '📦', check: (b: BaseState) => b.supplies >= 20 },
] as const;
export type BadgeName = (typeof BADGES)[number]['name'];
export function withBadges(b: BaseState, res?: GoResult): BaseState {
  const got = BADGES.filter(t => !b.badges.includes(t.id) && t.check(b, res)).map(t => t.id);
  return got.length ? { ...b, badges: [...b.badges, ...got] } : b;
}

// ---------- counting ----------

/** The fixed catalogue: things to buy, crew to meet, named special crates and badges. The rocks, the made modules and plants, the lucky
 *  statues, the Landings and the land are on top, without end. */
export const CATALOGUE = { forSale: FOR_SALE.length, crew: NEW_CREW.length, specials: 12, badges: BADGES.length };
export const CATALOGUE_SIZE = CATALOGUE.forSale + CATALOGUE.crew + CATALOGUE.specials + CATALOGUE.badges;
export type { Item };
