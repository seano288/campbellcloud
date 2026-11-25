// The Arena on the saved game: what he has bought, how his truck and ramp are put together, the Jumps he has earned and taken, the Rows
// and Shows he has cleared, his Record Board and the replay of his best jump.
//
// A finished Round earns Bolts and one Jump. Bolts buy truck parts, ramp pieces, Rows, paint, arena pieces, drivers and horns. Each Jump
// goes over the next thing to clear: a Row he has bought and not cleared yet, or the next Show once Shows are open (they take turns while
// there are Rows left), or, with nothing new set up, his newest Row again, for distance. A Jump that falls short is not lost: the same row
// waits for the next Jump with a little more tail wind each time (the mercy step). Every Jump pays a few Bolts, and nothing is ever lost.
// A Jump is only used at its end, so leaving halfway costs nothing.
import { isAmount } from '../../currency/amount';
import type { PurchaseProposal } from '../../rewards/purchase';
import {
  BODIES, COLOURS, DECALS, DRIVERS, FOR_SALE, HORNS, isItemId, itemOf, PATTERNS, RAMP_SLOTS, REPEAT_IDS, repeatOf, repeatPrice, ROWS, SLOTS, STARTERS, starterPart, starterRamp,
  TRIMS, tuneTotal, type Item, type PartItem, type RampItem, type RampSlot, type RepeatId, type RowItem, type Slot, type BodyItem,
} from './catalog';
import { show, type Show } from './shows';
import type { Setup, Tape } from '../jump/sim';

/** How his truck is put together: one thing in every slot, and its paint made from four parts. */
export interface TruckLook {
  body: string;
  engine: string; tires: string; springs: string; booster: string; exhaust: string; lights: string; flag: string;
  colour: string; pattern: string; decal: string; trim: string;
  driver: string; horn: string;
}
export const LOOK_KEYS = ['body', ...SLOTS, 'colour', 'pattern', 'decal', 'trim', 'driver', 'horn'] as const satisfies readonly (keyof TruckLook)[];
export type RampLook = Record<RampSlot, string>;

export interface JumpRecord { feet: number; jump: number }
export interface Best { feet: number; jump: number; setup: Setup; tape: Tape; row: Target }
export interface ArenaState {
  owned: string[];
  more: { [K in RepeatId]: number };
  truck: TruckLook;
  ramp: RampLook;
  /** What he's saving for: an item id, or `more:<repeat>`. */
  goal: string | null;
  /** Jumps earned and not taken yet; Jumps taken, ever. */
  jumps: number;
  jumped: number;
  /** Hand-made Rows cleared (the next is rowsCleared + 1) and Shows cleared (the next is shows + 1). */
  rowsCleared: number;
  shows: number;
  /** Jumps that fell short of the Row and of the Show he's on now (the mercy step): each try adds a little tail wind. */
  tries: { row: number; show: number };
  /** Whether the last Jump went at a Row (Rows and Shows take turns). */
  lastRow: boolean;
  /** His ten longest jumps, longest first. */
  records: JumpRecord[];
  best: Best | null;
  /** Jump at night (once he has the Floodlights). */
  night: boolean;
}

/** He starts with one free Jump, so he sees the reward before his first purchase. */
export const FIRST_JUMPS = 1;
export const freshTruck = (): TruckLook => ({
  body: BODIES[0].id, engine: starterPart('engine').id, tires: starterPart('tires').id, springs: starterPart('springs').id, booster: starterPart('booster').id,
  exhaust: starterPart('exhaust').id, lights: starterPart('lights').id, flag: starterPart('flag').id,
  colour: COLOURS[0].id, pattern: PATTERNS[0].id, decal: DECALS[0].id, trim: TRIMS[0].id, driver: DRIVERS[0].id, horn: HORNS[0].id,
});
export const freshRamp = (): RampLook => ({ runup: starterRamp('runup').id, kicker: starterRamp('kicker').id, landing: starterRamp('landing').id });
const noMore = (): ArenaState['more'] => ({ seats: 0, engine: 0, springs: 0, booster: 0 });
export const freshArena = (): ArenaState => ({
  owned: [...STARTERS], more: noMore(), truck: freshTruck(), ramp: freshRamp(), goal: null, jumps: FIRST_JUMPS, jumped: 0, rowsCleared: 0, shows: 0, tries: { row: 0, show: 0 },
  lastRow: false, records: [], best: null, night: false,
});

type Raw = { [k: string]: unknown };
const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);
const count = (x: unknown, max = Number.MAX_SAFE_INTEGER) => (isAmount(x) ? Math.min(x as number, max) : 0);

/** The slot a thing goes in on his truck, if it goes on the truck. */
export function truckSlot(item: Item): keyof TruckLook | null {
  if (item.cat === 'part') return item.slot;
  if (item.cat === 'body' || item.cat === 'colour' || item.cat === 'pattern' || item.cat === 'decal' || item.cat === 'trim' || item.cat === 'driver' || item.cat === 'horn') return item.cat;
  return null;
}
function readSetup(x: unknown): Setup | null {
  if (!isRecord(x)) return null;
  const keys = ['top', 'accel', 'runUp', 'angle', 'lip', 'boost', 'window', 'tilt', 'wind', 'help', 'row'] as const;
  if (!keys.every(k => typeof x[k] === 'number' && Number.isFinite(x[k]))) return null;
  return Object.fromEntries(keys.map(k => [k, x[k]])) as unknown as Setup;
}
function readTape(x: unknown): Tape | null {
  if (!Array.isArray(x) || x.length > 5000) return null;
  const out: (readonly [number, 0 | 1, -1 | 0 | 1, 0 | 1])[] = [];
  for (const r of x) {
    if (!Array.isArray(r) || r.length !== 4 || !Number.isInteger(r[0]) || ![0, 1].includes(r[1]) || ![-1, 0, 1].includes(r[2]) || ![0, 1].includes(r[3])) return null;
    out.push([r[0], r[1], r[2], r[3]] as const);
  }
  return out;
}
const readTarget = (x: unknown): Target | null =>
  isRecord(x) && (x.kind === 'row' || x.kind === 'show' || x.kind === 'again') && Number.isInteger(x.n) && (x.n as number) >= 1 ? { kind: x.kind, n: x.n as number } : null;

/** Whatever is missing or doesn't read comes back fresh; nothing he doesn't own can be fitted. */
export function readArena(raw: unknown): ArenaState {
  const f = freshArena();
  if (!isRecord(raw)) return f;
  const owned = [...new Set([...STARTERS, ...(Array.isArray(raw.owned) ? raw.owned.filter(isItemId) : [])])];
  const has = (id: string) => owned.includes(id);
  const tr = isRecord(raw.truck) ? raw.truck : {}, truck = { ...f.truck };
  for (const k of LOOK_KEYS) { const v = tr[k]; if (typeof v === 'string' && has(v) && truckSlot(itemOf(v)) === k) truck[k] = v; }
  const rp = isRecord(raw.ramp) ? raw.ramp : {}, ramp = { ...f.ramp };
  for (const k of RAMP_SLOTS) { const v = rp[k]; if (typeof v === 'string' && has(v)) { const it = itemOf(v); if (it.cat === 'ramp' && it.slot === k) ramp[k] = v; } }
  const more = isRecord(raw.more) ? raw.more : {};
  const goal = typeof raw.goal === 'string' && (raw.goal.startsWith('more:') ? REPEAT_IDS.includes(raw.goal.slice(5) as RepeatId) : isItemId(raw.goal) && !has(raw.goal)) ? raw.goal : null;
  const records = Array.isArray(raw.records)
    ? raw.records.filter(isRecord).map(r => ({ feet: count(r.feet, 9999), jump: count(r.jump) })).filter(r => r.feet > 0).sort((a, b) => b.feet - a.feet).slice(0, RECORDS)
    : [];
  const b = isRecord(raw.best) ? raw.best : null, setup = b && readSetup(b.setup), tape = b && readTape(b.tape), row = b && readTarget(b.row);
  const rowsCleared = Math.min(ROWS.length, count(raw.rowsCleared)), tries = isRecord(raw.tries) ? raw.tries : {};
  return {
    owned, more: Object.fromEntries(REPEAT_IDS.map(id => [id, count(more[id], 1_000_000)])) as ArenaState['more'], truck, ramp, goal,
    jumps: count(raw.jumps, 99), jumped: count(raw.jumped), rowsCleared, shows: count(raw.shows), tries: { row: count(tries.row, 99), show: count(tries.show, 99) },
    lastRow: raw.lastRow === true, records,
    best: b && setup && tape && row ? { feet: count(b.feet, 9999), jump: count(b.jump), setup, tape, row } : null,
    night: raw.night === true && has('arena:floodlights'),
  };
}

export const has = (a: Pick<ArenaState, 'owned'>, id: string) => a.owned.includes(id);
export const doesArena = (a: Pick<ArenaState, 'owned'>, does: string) => a.owned.some(id => { const i = itemOf(id); return i.cat === 'arena' && i.does === does; });

// ---------- what the truck can do ----------

const power = (id: string) => (itemOf(id) as PartItem).power;
const rampOf = (id: string) => itemOf(id) as RampItem;
export interface Stats { top: number; accel: number; window: number; boost: number; tilt: number; runUp: number; angle: number; lip: number }
export function statsOf(a: Pick<ArenaState, 'truck' | 'ramp' | 'more'>): Stats {
  const t = a.truck, k = rampOf(a.ramp.kicker), boost = power(t.booster);
  return {
    top: power(t.engine) + tuneTotal('engine', a.more.engine),
    accel: power(t.tires) + (power(t.engine) - 40) * .15,
    window: power(t.springs) + rampOf(a.ramp.landing).window + tuneTotal('springs', a.more.springs),
    boost: boost > 0 ? boost + tuneTotal('booster', a.more.booster) : 0,
    tilt: (itemOf(t.body) as BodyItem).tilt,
    runUp: rampOf(a.ramp.runup).feet, angle: k.angle, lip: k.lip,
  };
}

/** Fit something he owns: a part or a look on his truck, or a ramp piece on his ramp. */
export function fit(a: ArenaState, id: string): ArenaState | null {
  if (!has(a, id)) return null;
  const item = itemOf(id);
  if (item.cat === 'ramp') return { ...a, ramp: { ...a.ramp, [item.slot]: id } };
  const slot = truckSlot(item);
  return slot ? { ...a, truck: { ...a.truck, [slot]: id } } : null;
}

// ---------- what the next Jump goes over ----------

/** A hand-made Row, a generated Show, or a Row he has cleared, again for distance. */
export type Target = { kind: 'row' | 'show' | 'again'; n: number };
export const SHOWS_AFTER = 3;
export const showsOpen = (a: Pick<ArenaState, 'rowsCleared'>) => a.rowsCleared >= SHOWS_AFTER;
export function nextTarget(a: ArenaState): Target {
  const row = a.rowsCleared + 1, rowReady = row <= ROWS.length && has(a, `row:${row}`);
  if (rowReady && (!showsOpen(a) || !a.lastRow)) return { kind: 'row', n: row };
  if (showsOpen(a)) return { kind: 'show', n: a.shows + 1 };
  if (rowReady) return { kind: 'row', n: row };
  return { kind: 'again', n: Math.max(1, a.rowsCleared) };
}
export const targetKey = (t: Target) => `${t.kind}:${t.n}`;
export interface Course { target: Target; name: string; feet: number; parts: RowItem['parts']; wind: number; night: boolean; show: Show | null }
export function courseOf(t: Target): Course {
  if (t.kind === 'show') { const s = show(t.n); return { target: t, name: 'Show', feet: s.feet, parts: s.parts, wind: s.wind, night: s.night, show: s }; }
  const r = ROWS[t.n - 1]!;
  return { target: t, name: r.name, feet: r.feet, parts: r.parts, wind: 0, night: false, show: null };
}
/** Everything the Jump needs: his truck and ramp, the row, the wind and the mercy help. */
export function planJump(a: ArenaState): { course: Course; setup: Setup; night: boolean } {
  const target = nextTarget(a), course = courseOf(target), s = statsOf(a);
  const help = target.kind === 'again' ? 0 : a.tries[target.kind];
  const setup: Setup = { top: s.top, accel: s.accel, runUp: s.runUp, angle: s.angle, lip: s.lip, boost: s.boost, window: s.window, tilt: s.tilt, wind: course.wind, help, row: course.feet };
  return { course, setup, night: course.night || (a.night && has(a, 'arena:floodlights')) };
}

// ---------- buying ----------

export type Want = { kind: 'item'; id: string } | { kind: 'more'; id: RepeatId };
export const wantKey = (w: Want) => (w.kind === 'item' ? w.id : `more:${w.id}`);
export const wantOf = (key: string): Want => (key.startsWith('more:') ? { kind: 'more', id: key.slice(5) as RepeatId } : { kind: 'item', id: key });
/** What it needs first, if he hasn't got it: the Row before (cleared), the Floodlights, the part a tune works on. */
export function missingNeed(a: ArenaState, w: Want): string | null {
  if (w.kind === 'more') { const n = repeatOf(w.id).needs; return n && !has(a, n) ? n : null; }
  const item = itemOf(w.id);
  if (item.cat === 'row') return item.n > a.rowsCleared + 1 ? `row:${item.n - 1}` : null;
  return item.needs && !has(a, item.needs) ? item.needs : null;
}
export const priceOf = (a: Pick<ArenaState, 'more'>, w: Want) => (w.kind === 'item' ? itemOf(w.id).price : repeatPrice(w.id, a.more[w.id]));
export const isNew = (a: Pick<ArenaState, 'owned'>, w: Want) => w.kind === 'more' || !has(a, w.id);
export function buyable(a: ArenaState, w: Want): boolean {
  if (!isNew(a, w) || missingNeed(a, w)) return false;
  return w.kind === 'more' || itemOf(w.id).price > 0;
}
export const shopNow = (a: ArenaState): Want[] =>
  FOR_SALE.filter(i => buyable(a, { kind: 'item', id: i.id })).sort((x, y) => x.price - y.price).map(i => ({ kind: 'item', id: i.id }));
export const repeatsNow = (a: ArenaState): Want[] =>
  REPEAT_IDS.map(id => ({ kind: 'more', id }) as Want).filter(w => buyable(a, w))
    .sort((x, y) => priceOf(a, x) - priceOf(a, y) || a.more[(x as { id: RepeatId }).id] - a.more[(y as { id: RepeatId }).id]);
export const catalogueDone = (a: Pick<ArenaState, 'owned'>) => FOR_SALE.every(i => has(a, i.id));
/** His Goal: what he tapped and couldn't afford, else the cheapest new thing, else the cheapest again-and-again thing. */
export function goalOf(a: ArenaState): Want | null {
  if (a.goal) { const w = wantOf(a.goal); if (buyable(a, w)) return w; }
  return shopNow(a)[0] ?? repeatsNow(a)[0] ?? null;
}
export const selectGoal = (a: ArenaState, w: Want): ArenaState => ({ ...a, goal: wantKey(w) });

export type PurchaseFailure = 'invalid-item' | 'invalid-balance' | 'insufficient-funds' | 'already-owned' | 'not-yet';
export function proposePurchase(a: ArenaState, w: Want, balance: number): PurchaseProposal<ArenaState, PurchaseFailure> {
  if (!isAmount(balance)) return { kind: 'rejected', reason: 'invalid-balance' };
  if (w.kind === 'item' ? !isItemId(w.id) || itemOf(w.id).price <= 0 : !REPEAT_IDS.includes(w.id)) return { kind: 'rejected', reason: 'invalid-item' };
  if (!isNew(a, w)) return { kind: 'rejected', reason: 'already-owned' };
  if (!buyable(a, w)) return { kind: 'rejected', reason: 'not-yet' };
  const cost = priceOf(a, w);
  if (balance < cost) return { kind: 'rejected', reason: 'insufficient-funds' };
  return { kind: 'ready', cost, state: bought(a, w) };
}
/** A part, a look or a ramp piece goes straight on (he can swap back any time); a Row is set up for the next Jump. */
export function bought(a: ArenaState, w: Want): ArenaState {
  const goal = a.goal === wantKey(w) ? null : a.goal;
  if (w.kind === 'more') return { ...a, more: { ...a.more, [w.id]: a.more[w.id] + 1 }, goal };
  const next: ArenaState = { ...a, owned: [...a.owned, w.id], goal };
  return fit(next, w.id) ?? next;
}

// ---------- ranks and trophies ----------

/** Ranks by Jumps taken. After Legend, a numbered Legend every 40 Jumps, without end. */
export const RANKS = [
  { name: 'Rookie', at: 0 }, { name: 'Hopper', at: 3 }, { name: 'Flyer', at: 8 }, { name: 'Jumper', at: 15 }, { name: 'Stunt Driver', at: 25 },
  { name: 'Daredevil', at: 40 }, { name: 'Air Ace', at: 60 }, { name: 'Big Air Star', at: 85 }, { name: 'Sky King', at: 120 }, { name: 'Legend', at: 160 },
] as const;
export type RankName = (typeof RANKS)[number]['name'];
export const LEGEND_EVERY = 40;
export function rankOf(jumped: number): { index: number; name: RankName; number: number; next: number } {
  const top = RANKS[RANKS.length - 1]!.at;
  if (jumped < top + LEGEND_EVERY) {
    const i = RANKS.findLastIndex(r => jumped >= r.at);
    return { index: i, name: RANKS[i]!.name, number: 0, next: i + 1 < RANKS.length ? RANKS[i + 1]!.at : top + LEGEND_EVERY };
  }
  const k = Math.floor((jumped - top) / LEGEND_EVERY);
  return { index: RANKS.length - 1 + k, name: 'Legend', number: k + 1, next: top + (k + 1) * LEGEND_EVERY };
}
/** Trophies for distance: his first jump of each length wins it. */
export const TROPHIES = [20, 30, 40, 50, 60, 70, 80, 100, 125, 150, 175, 200] as const;
export const trophiesFor = (feet: number) => TROPHIES.filter(t => feet >= t);

// ---------- paying for a Jump ----------

/** A Jump pays this, one more for a clean landing, one for a new record and one for clearing a Row or Show for the first time. A Round
 *  pays at most 6, so a Round and its Jump pay at most 6 + 5 = 11, under Turbo Tally's ceiling of 15. */
export const JUMP_BOLTS = 2, CLEAN_BOLTS = 1, RECORD_BOLTS = 1, CLEAR_BOLTS = 1;
export const MOST_JUMP_BOLTS = JUMP_BOLTS + CLEAN_BOLTS + RECORD_BOLTS + CLEAR_BOLTS;
export const RECORDS = 10;

export interface JumpResult { feet: number; clean: boolean; tape: Tape; setup: Setup }
export interface JumpPay {
  bolts: number;
  record: boolean;
  /** He cleared the Row or Show (and it is the first time). */
  cleared: boolean;
  target: Target;
  trophies: number[];
  cup: Show['cup'];
  rank: ReturnType<typeof rankOf> | null;
  /** He fell short: the next Jump at this row gets this much help. */
  help: number;
}
export function payFor(a: ArenaState, plan: { course: Course; setup: Setup }, res: JumpResult): JumpPay {
  const t = plan.course.target, cleared = t.kind !== 'again' && res.feet >= plan.course.feet;
  const record = res.feet > (a.records[0]?.feet ?? 0);
  const before = rankOf(a.jumped), after = rankOf(a.jumped + 1), old = new Set(trophiesFor(a.records[0]?.feet ?? 0));
  return {
    bolts: JUMP_BOLTS + (res.clean ? CLEAN_BOLTS : 0) + (record && a.jumped > 0 ? RECORD_BOLTS : 0) + (cleared ? CLEAR_BOLTS : 0),
    record, cleared, target: t, trophies: trophiesFor(res.feet).filter(x => !old.has(x)), cup: cleared && t.kind === 'show' ? plan.course.show!.cup : null,
    rank: after.index > before.index ? after : null, help: cleared || t.kind === 'again' ? 0 : a.tries[t.kind] + 1,
  };
}
/** The Jump ended: it's used, the Row or Show is cleared or waits with more help, and the Record Board is filled in. */
export function finishJump(a: ArenaState, plan: { course: Course; setup: Setup }, res: JumpResult): ArenaState {
  const pay = payFor(a, plan, res), t = plan.course.target, n = a.jumped + 1;
  const records = [...a.records, { feet: res.feet, jump: n }].sort((x, y) => y.feet - x.feet || x.jump - y.jump).slice(0, RECORDS);
  const best = pay.record || !a.best ? { feet: res.feet, jump: n, setup: res.setup, tape: res.tape, row: t } : a.best;
  return {
    ...a, jumps: Math.max(0, a.jumps - 1), jumped: n, records, best,
    rowsCleared: pay.cleared && t.kind === 'row' ? Math.max(a.rowsCleared, t.n) : a.rowsCleared,
    shows: pay.cleared && t.kind === 'show' ? Math.max(a.shows, t.n) : a.shows,
    tries: t.kind === 'again' ? a.tries : { ...a.tries, [t.kind]: pay.help },
    lastRow: t.kind === 'row',
  };
}
/** A Round finished: one more Jump. */
export const earnJump = (a: ArenaState): ArenaState => ({ ...a, jumps: a.jumps + 1 });

// ---------- the crowd ----------

/** People in the stands: a starting crowd and more for every seat block. */
export const crowdOf = (a: Pick<ArenaState, 'more'>) => 200 + a.more.seats * 150;

// ---------- counting ----------

/** The fixed catalogue: things to buy, the hand-made Rows to clear (bought, and cleared one Jump at a time), ranks and trophies. Shows
 *  and their cups, seat blocks, tunes and the numbered Legends are on top, without end. */
export const CATALOGUE = { forSale: FOR_SALE.length, ranks: RANKS.length, trophies: TROPHIES.length };
export const CATALOGUE_SIZE = CATALOGUE.forSale + CATALOGUE.ranks + CATALOGUE.trophies;
export type { Item, Slot, RampSlot };
