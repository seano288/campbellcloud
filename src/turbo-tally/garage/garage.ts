// The Garage on the saved game: what he owns, what's on his car, the Races he has earned, and how far through the Cups he is.
// A finished Round earns Bolts and one Race. Bolts buy parts. A Race against a track's featured Rival wins that Rival's part (by
// finishing ahead of that one Rival, not by coming first) and opens the next track; the fourth track of a Cup, the Cup Final, wins
// the Cup's trophy. A Rival who beats him gets slower on that track each time until he wins (rivals.ts, MERCY). Every finish pays a
// few Bolts and is cheered; nothing is ever lost. A Race is only used up at the finish, so leaving halfway costs nothing.
//
// Added 2026-11-21, because he beat every track in 90 minutes: a beaten track can be raced again for three Stars, each against a
// faster grid and won only by coming first (rivals.ts, STAR); and the Mystery Race, an endless ladder of made-up tracks that opens with
// the Tarmac Cup, where first place goes up a Level and every fifth Level wins a Mystery part.
import { isAmount } from '../../currency/amount';
import type { PurchaseProposal } from '../../rewards/purchase';
import { featuredOn, gridFor, isFinal, STARS, type RacePlan } from '../race/rivals';
import { CUP_IDS, isMystery, isTrackId, mysteryLevelOf, mysteryTrack, MYSTERY_TOP, TRACKS, trackBy, type CupId, type TrackDef } from '../race/tracks';
import { ALL_KEYS, changesStats, fit, fittedKeys, forSale, isPartKey, keysIn, MYSTERY_KEYS, partOf, priceOf, SLOTS, slotOf, starterCar, STARTERS, type Car, type PartKey, type Slot } from './parts';

export interface TrackRecord {
  /** His best place there, 1 to 4. */
  best: number;
  /** Times its featured Rival has beaten him there, since he last beat it. */
  losses: number;
  /** He has finished ahead of its featured Rival. */
  beaten: boolean;
  /** Stars won there since (0 to 3), each by coming first in a Star Race. */
  stars: number;
}

/** How far up the Mystery Race he is. */
export interface MysteryRecord {
  /** The Level he races next (he has won every one below it). */
  level: number;
  /** Times he has fallen short at this Level. */
  losses: number;
}

export interface GarageState {
  owned: PartKey[];
  car: Car;
  /** The part he's saving for, once he has tapped one he can't afford yet. */
  goal: PartKey | null;
  /** Races earned and not used yet. */
  races: number;
  /** Races finished, ever. */
  raced: number;
  tracks: Record<string, TrackRecord>;
  cups: CupId[];
  /** The track he picked on the Cups shelf ('mystery' for the Mystery Race), if any. */
  picked: string | null;
  mystery: MysteryRecord;
  /** The last track he raced, for "Watch it go". */
  last: string | null;
}

/** He starts with one free Race, so he sees the reward before his first purchase. */
export const FIRST_RACES = 1;
export const freshGarage = (): GarageState => ({ owned: [...STARTERS], car: starterCar(), goal: null, races: FIRST_RACES, raced: 0, tracks: {}, cups: [], picked: null, mystery: { level: 1, losses: 0 }, last: null });
/** What the Cups shelf picks to send the Race button to the Mystery Race. */
export const MYSTERY_PICK = 'mystery';

type Raw = Record<string, unknown>;
const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);
const count = (x: unknown, max = Infinity) => (isAmount(x) ? Math.min(x as number, max) : 0);

function readCar(raw: unknown, owned: readonly PartKey[]): Car {
  const r = isRecord(raw) ? raw : {}, fresh = starterCar();
  const slots = Object.fromEntries(SLOTS.map(s => {
    const k = r[s];
    return [s, isPartKey(k) && slotOf(k) === s && owned.includes(k) ? k : fresh[s]];
  })) as { [S in Slot]: PartKey };
  const number = typeof r.number === 'number' && Number.isInteger(r.number) && r.number >= 0 && r.number <= 99 ? r.number : fresh.number;
  return { ...slots, number };
}

/** Whatever is missing or doesn't read comes back fresh. */
export function readGarage(raw: unknown): GarageState {
  if (!isRecord(raw)) return freshGarage();
  const owned = [...new Set([...STARTERS, ...(Array.isArray(raw.owned) ? raw.owned.filter(isPartKey) : [])])];
  const tracks = isRecord(raw.tracks) ? raw.tracks : {};
  return {
    owned, car: readCar(raw.car, owned),
    goal: isPartKey(raw.goal) && forSale(raw.goal) && !owned.includes(raw.goal) ? raw.goal : null,
    races: count(raw.races, 99), raced: count(raw.raced),
    tracks: Object.fromEntries(TRACKS.flatMap(t => {
      const r = tracks[t.id];
      if (!isRecord(r)) return [];
      const best = count(r.best, 6), beaten = r.beaten === true;
      return [[t.id, { best: best >= 1 ? best : 4, losses: count(r.losses, 99), beaten, stars: beaten ? count(r.stars, STARS) : 0 }]];
    })),
    cups: Array.isArray(raw.cups) ? CUP_IDS.filter(c => (raw.cups as unknown[]).includes(c)) : [],
    picked: raw.picked === MYSTERY_PICK || (isTrackId(raw.picked) && !mysteryLevelOf(raw.picked)) ? raw.picked as string : null,
    mystery: isRecord(raw.mystery) ? { level: Math.max(1, count(raw.mystery.level, MYSTERY_TOP)), losses: count(raw.mystery.losses, 99) } : { level: 1, losses: 0 },
    last: isTrackId(raw.last) ? raw.last : null,
  };
}

export const isOwned = (g: Pick<GarageState, 'owned'>, k: PartKey) => g.owned.includes(k);

// ---------- buying and fitting ----------

/** The one he chose while he can't afford it, otherwise the cheapest part for sale he hasn't got that changes a number, then any. */
export function goalOf(g: Pick<GarageState, 'owned' | 'goal'>): PartKey | null {
  if (g.goal && !isOwned(g, g.goal)) return g.goal;
  const left = ALL_KEYS.filter(k => forSale(k) && !isOwned(g, k)).sort((x, y) => priceOf(x)! - priceOf(y)!);
  return left.find(changesStats) ?? left[0] ?? null;
}
export function selectGoal(g: GarageState, k: PartKey): GarageState {
  if (isOwned(g, k) || !forSale(k)) throw new Error('A Goal is something for sale he has not got');
  return { ...g, goal: k };
}

export type PurchaseFailure = 'invalid-item' | 'invalid-balance' | 'insufficient-funds' | 'already-owned' | 'not-for-sale';
/** Buying a part fits it straight away. */
export function proposePurchase(g: GarageState, k: PartKey, balance: number): PurchaseProposal<GarageState, PurchaseFailure> {
  if (!isAmount(balance)) return { kind: 'rejected', reason: 'invalid-balance' };
  if (!isPartKey(k)) return { kind: 'rejected', reason: 'invalid-item' };
  if (!forSale(k)) return { kind: 'rejected', reason: 'not-for-sale' };
  if (isOwned(g, k)) return { kind: 'rejected', reason: 'already-owned' };
  const cost = priceOf(k)!;
  if (balance < cost) return { kind: 'rejected', reason: 'insufficient-funds' };
  return { kind: 'ready', cost, state: { ...g, owned: [...g.owned, k], car: fit(g.car, k), goal: g.goal === k ? null : g.goal } };
}
/** Fits a part he owns. */
export const fitOwned = (g: GarageState, k: PartKey): GarageState | null => (isOwned(g, k) ? { ...g, car: fit(g.car, k) } : null);
export const setNumber = (g: GarageState, n: number): GarageState => ({ ...g, car: { ...g.car, number: Math.max(0, Math.min(99, Math.round(n))) } });
/** Fitted parts he owns: a car from a save that was cut down can't sneak one in. */
export const allowed = (g: Pick<GarageState, 'owned'>, car: Car) => fittedKeys(car).every(k => g.owned.includes(k));
export const shopKeys = (slot: Slot) => keysIn(slot);
export const allBought = (g: Pick<GarageState, 'owned'>) => ALL_KEYS.filter(forSale).every(k => isOwned(g, k));

// ---------- tracks and Cups ----------

export const record = (g: Pick<GarageState, 'tracks'>, t: TrackDef): TrackRecord => g.tracks[t.id] ?? { best: 0, losses: 0, beaten: false, stars: 0 };
/** A track is open when it's the first, or the one before it has been beaten. A Mystery track is open when the Mystery Race is. */
export const isOpen = (g: Pick<GarageState, 'tracks' | 'cups'>, t: TrackDef) => {
  if (isMystery(t)) return mysteryOpen(g);
  const i = TRACKS.indexOf(t);
  return i <= 0 || record(g, TRACKS[i - 1]!).beaten;
};
export const openTracks = (g: Pick<GarageState, 'tracks' | 'cups'>) => TRACKS.filter(t => isOpen(g, t));
/** The first open track he hasn't beaten, or null once he has beaten them all. */
export const frontier = (g: Pick<GarageState, 'tracks' | 'cups'>): TrackDef | null => TRACKS.find(t => isOpen(g, t) && !record(g, t).beaten) ?? null;
/** The next Star to race for: every beaten track's first Star before any second Star, and so on, in track order. */
export function nextStar(g: Pick<GarageState, 'tracks'>): TrackDef | null {
  for (let s = 0; s < STARS; s++) { const t = TRACKS.find(x => record(g, x).beaten && record(g, x).stars === s); if (t) return t; }
  return null;
}
/** The Mystery Race opens with the Tarmac Cup. */
export const MYSTERY_OPENS: CupId = 'tarmac';
export const mysteryOpen = (g: Pick<GarageState, 'cups'>) => g.cups.includes(MYSTERY_OPENS);
/** Where Race goes: what he picked, or else the next track to beat, or else the next Star to win, or else the Mystery Race. */
export function nextTrack(g: Pick<GarageState, 'tracks' | 'picked' | 'cups' | 'mystery'>): TrackDef {
  if (g.picked === MYSTERY_PICK && mysteryOpen(g)) return mysteryTrack(g.mystery.level);
  const picked = g.picked && g.picked !== MYSTERY_PICK ? trackBy(g.picked) : null;
  if (picked && isOpen(g, picked)) return picked;
  return frontier(g) ?? nextStar(g) ?? (mysteryOpen(g) ? mysteryTrack(g.mystery.level) : TRACKS[TRACKS.length - 1]!);
}
export const pickTrack = (g: GarageState, id: string): GarageState | null =>
  id === MYSTERY_PICK ? (mysteryOpen(g) ? { ...g, picked: id } : null) : isOpen(g, trackBy(id)) ? { ...g, picked: id } : null;

/** What a Race on this track is for (rivals.ts, RacePlan). */
export function planFor(g: Pick<GarageState, 'tracks' | 'mystery'>, t: TrackDef): RacePlan {
  if (isMystery(t)) return { track: t, mode: 'mystery', star: 0, level: mysteryLevelOf(t.id)! };
  const rec = record(g, t);
  if (!rec.beaten) return { track: t, mode: 'cup', star: 0, level: 0 };
  return rec.stars < STARS ? { track: t, mode: 'star', star: rec.stars + 1, level: 0 } : { track: t, mode: 'fun', star: 0, level: 0 };
}
/** How many times in a row he has fallen short at what this Race is for. */
export const lossesFor = (g: Pick<GarageState, 'tracks' | 'mystery'>, plan: RacePlan) => plan.mode === 'mystery' ? (plan.level === g.mystery.level ? g.mystery.losses : 0) : plan.mode === 'fun' ? 0 : record(g, plan.track).losses;
/** The grid for the Race the Garage would start on this track. */
export const gridOf = (g: Pick<GarageState, 'tracks' | 'mystery'>, t: TrackDef) => { const plan = planFor(g, t); return gridFor(plan, lossesFor(g, plan)); };

/** A finish pays this, plus one for each car he beat (so 5 with four cars, 7 with six). */
export const FINISH_BOLTS = 2, PER_CAR = 1;
/** The first time he wins each Star on a track. */
export const STAR_BOLTS = [0, 3, 5, 8] as const;
/** Winning a Mystery Level pays this much more, rising with the Level up to MYSTERY_BONUS_TOP. */
export const mysteryBonus = (level: number) => Math.min(8, 3 + Math.floor(level / 5));
/** Every fifth Mystery Level wins the next Mystery part. */
export const MYSTERY_PRIZE_EVERY = 5;
export const mysteryPrizeAt = (level: number): PartKey | null => level % MYSTERY_PRIZE_EVERY === 0 ? MYSTERY_KEYS[level / MYSTERY_PRIZE_EVERY - 1] ?? null : null;
/** The Level that wins the next Mystery part he hasn't got. */
export const nextMysteryPrize = (g: Pick<GarageState, 'owned' | 'mystery'>): { level: number; prize: PartKey } | null => {
  for (let l = g.mystery.level; l <= MYSTERY_KEYS.length * MYSTERY_PRIZE_EVERY; l++) { const p = mysteryPrizeAt(l); if (p && !isOwned(g, p)) return { level: l, prize: p }; }
  return null;
};
/** The most one Race can pay: seven for a finish in front of six cars, and the biggest Star or Mystery bonus. */
export const MOST_RACE_BOLTS = FINISH_BOLTS + PER_CAR * 5 + Math.max(STAR_BOLTS[3], mysteryBonus(MYSTERY_TOP));

export interface RacePay {
  bolts: number;
  place: number;
  /** He did what this Race was for: finished ahead of the featured Rival (a Cup Race), or came first (a Star or Mystery Race). */
  beat: boolean;
  /** What he won the first time he beat it: its part, or the Cup's trophy at a Cup Final, or a Mystery part. */
  prize: PartKey | null;
  cup: CupId | null;
  /** The track that opened. */
  opened: TrackDef | null;
  /** The Star he won, 1 to 3. */
  star: number | null;
  /** The Mystery Level he goes up to. */
  level: number | null;
}
/** What a Race pays. `cars` is how many raced, his included. */
export function payFor(g: GarageState, plan: RacePlan, place: number, beat: boolean, cars = 4): RacePay {
  const t = plan.track, base = FINISH_BOLTS + PER_CAR * Math.max(0, Math.min(cars - 1, cars - place));
  const none = { place, beat, prize: null, cup: null, opened: null, star: null, level: null };
  if (plan.mode === 'star') {
    const won = beat && record(g, t).stars < plan.star;
    return { ...none, bolts: base + (won ? STAR_BOLTS[plan.star as 1 | 2 | 3] : 0), star: won ? plan.star : null };
  }
  if (plan.mode === 'mystery') {
    const prize = beat ? mysteryPrizeAt(plan.level) : null;
    return { ...none, bolts: base + (beat ? mysteryBonus(plan.level) : 0), level: beat ? plan.level + 1 : null, prize: prize && !isOwned(g, prize) ? prize : null };
  }
  if (plan.mode === 'fun') return { ...none, bolts: base };
  const first = beat && !record(g, t).beaten, final = isFinal(t), featured = featuredOn(t).prize;
  const prize = first && !final && featured && !isOwned(g, featured) ? featured : null;
  const cup = first && final && !g.cups.includes(t.cup) ? t.cup : null;
  const i = TRACKS.indexOf(t), opened = first && i + 1 < TRACKS.length ? TRACKS[i + 1]! : null;
  return { ...none, bolts: base, prize, cup, opened };
}
/** The Race finished: it's used, the record kept, and what he won is his (a prize part goes straight on). A Race he fell short in
 *  stays picked, so "Race again" tries the same thing. */
export function finishRace(g: GarageState, plan: RacePlan, pay: RacePay): GarageState {
  const t = plan.track, owned = pay.prize && !g.owned.includes(pay.prize) ? [...g.owned, pay.prize] : g.owned;
  const common = { ...g, owned, car: pay.prize ? fit(g.car, pay.prize) : g.car, races: Math.max(0, g.races - 1), raced: g.raced + 1, last: t.id };
  if (plan.mode === 'mystery') {
    const mystery = plan.level !== g.mystery.level ? g.mystery : pay.level ? { level: Math.min(MYSTERY_TOP, pay.level), losses: 0 } : { ...g.mystery, losses: g.mystery.losses + 1 };
    return { ...common, mystery };
  }
  const was = record(g, t), best = was.best ? Math.min(was.best, pay.place) : pay.place;
  const rec: TrackRecord = plan.mode === 'cup'
    ? { best, losses: pay.beat ? 0 : was.losses + 1, beaten: was.beaten || pay.beat, stars: was.stars }
    : plan.mode === 'star'
      ? { best, losses: pay.star ? 0 : was.losses + 1, beaten: true, stars: pay.star ? Math.max(was.stars, pay.star) : was.stars }
      : { ...was, best };
  const done = plan.mode === 'fun' || pay.beat;
  return {
    ...common, tracks: { ...g.tracks, [t.id]: rec },
    cups: pay.cup && !g.cups.includes(pay.cup) ? [...g.cups, pay.cup] : g.cups,
    picked: done ? null : g.picked,
  };
}
/** Stars won, of all there are. */
export const starCount = (g: Pick<GarageState, 'tracks'>) => TRACKS.reduce((n, t) => n + record(g, t).stars, 0);
/** A Round finished: one more Race. */
export const earnRace = (g: GarageState): GarageState => ({ ...g, races: g.races + 1 });

/** Everything there is to earn, for the shelf's count and the tests. */
export const EARNABLE = { parts: ALL_KEYS.filter(k => partOf(k).price !== 0).length, tracks: TRACKS.length, cups: CUP_IDS.length, stars: TRACKS.length * STARS };
