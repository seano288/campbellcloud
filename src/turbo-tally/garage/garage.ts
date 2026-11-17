// The Garage on the saved game: what he owns, what's on his car, the Races he has earned, and how far through the Cups he is.
// A finished Round earns Bolts and one Race. Bolts buy parts. A Race against a track's featured Rival wins that Rival's part (by
// finishing ahead of that one Rival, not by coming first) and opens the next track; the fourth track of a Cup, the Cup Final, wins
// the Cup's trophy. A Rival who beats him gets slower on that track each time until he wins (rivals.ts, MERCY). Every finish pays a
// few Bolts and is cheered; nothing is ever lost. A Race is only used up at the finish, so leaving halfway costs nothing.
import { isAmount } from '../../currency/amount';
import type { PurchaseProposal } from '../../rewards/purchase';
import { featuredOn, isFinal } from '../race/rivals';
import { CUP_IDS, isTrackId, TRACKS, trackBy, type CupId, type TrackDef } from '../race/tracks';
import { ALL_KEYS, changesStats, fit, fittedKeys, forSale, isPartKey, keysIn, partOf, priceOf, SLOTS, slotOf, starterCar, STARTERS, type Car, type PartKey, type Slot } from './parts';

export interface TrackRecord {
  /** His best place there, 1 to 4. */
  best: number;
  /** Times its featured Rival has beaten him there, since he last beat it. */
  losses: number;
  /** He has finished ahead of its featured Rival. */
  beaten: boolean;
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
  /** The track he picked on the Cups shelf, if any. */
  picked: string | null;
  /** The last track he raced, for "Watch it go". */
  last: string | null;
}

/** He starts with one free Race, so he sees the reward before his first purchase. */
export const FIRST_RACES = 1;
export const freshGarage = (): GarageState => ({ owned: [...STARTERS], car: starterCar(), goal: null, races: FIRST_RACES, raced: 0, tracks: {}, cups: [], picked: null, last: null });

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
      const best = count(r.best, 4);
      return [[t.id, { best: best >= 1 ? best : 4, losses: count(r.losses, 99), beaten: r.beaten === true }]];
    })),
    cups: Array.isArray(raw.cups) ? CUP_IDS.filter(c => (raw.cups as unknown[]).includes(c)) : [],
    picked: isTrackId(raw.picked) ? raw.picked : null,
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

export const record = (g: Pick<GarageState, 'tracks'>, t: TrackDef): TrackRecord => g.tracks[t.id] ?? { best: 0, losses: 0, beaten: false };
/** A track is open when it's the first, or the one before it has been beaten. */
export const isOpen = (g: Pick<GarageState, 'tracks'>, t: TrackDef) => { const i = TRACKS.indexOf(t); return i <= 0 || record(g, TRACKS[i - 1]!).beaten; };
export const openTracks = (g: Pick<GarageState, 'tracks'>) => TRACKS.filter(t => isOpen(g, t));
/** The first open track he hasn't beaten, or null once he has beaten them all. */
export const frontier = (g: Pick<GarageState, 'tracks'>): TrackDef | null => TRACKS.find(t => isOpen(g, t) && !record(g, t).beaten) ?? null;
/** Where Race goes: the track he picked, or else the next one to beat, or else the last. */
export function nextTrack(g: Pick<GarageState, 'tracks' | 'picked'>): TrackDef {
  const picked = g.picked ? trackBy(g.picked) : null;
  if (picked && isOpen(g, picked)) return picked;
  return frontier(g) ?? TRACKS[TRACKS.length - 1]!;
}
export const pickTrack = (g: GarageState, id: string): GarageState | null => (isOpen(g, trackBy(id)) ? { ...g, picked: id } : null);

/** A finish pays this, plus one for each car he beat, so at most 5. */
export const FINISH_BOLTS = 2, PER_CAR = 1;
export interface RacePay {
  bolts: number;
  place: number;
  /** He finished ahead of the featured Rival. */
  beat: boolean;
  /** What he won the first time he beat it: its part, or the Cup's trophy at a Cup Final. */
  prize: PartKey | null;
  cup: CupId | null;
  /** The track that opened. */
  opened: TrackDef | null;
}
export function payFor(g: GarageState, t: TrackDef, place: number, beat: boolean): RacePay {
  const first = beat && !record(g, t).beaten, final = isFinal(t);
  const prize = first && !final && !isOwned(g, featuredOn(t).prize) ? featuredOn(t).prize : null;
  const cup = first && final && !g.cups.includes(t.cup) ? t.cup : null;
  const i = TRACKS.indexOf(t), opened = first && i + 1 < TRACKS.length ? TRACKS[i + 1]! : null;
  return { bolts: FINISH_BOLTS + PER_CAR * Math.max(0, Math.min(3, 4 - place)), place, beat, prize, cup, opened };
}
/** The Race finished: it's used, the track's record kept, and what he won is his (a Rival's part goes straight on). */
export function finishRace(g: GarageState, t: TrackDef, pay: RacePay): GarageState {
  const was = record(g, t);
  const rec: TrackRecord = { best: was.best ? Math.min(was.best, pay.place) : pay.place, losses: pay.beat ? 0 : was.losses + 1, beaten: was.beaten || pay.beat };
  const owned = pay.prize && !g.owned.includes(pay.prize) ? [...g.owned, pay.prize] : g.owned;
  return {
    ...g, owned, car: pay.prize ? fit(g.car, pay.prize) : g.car,
    races: Math.max(0, g.races - 1), raced: g.raced + 1, tracks: { ...g.tracks, [t.id]: rec },
    cups: pay.cup && !g.cups.includes(pay.cup) ? [...g.cups, pay.cup] : g.cups,
    picked: null, last: t.id,
  };
}
/** A Round finished: one more Race. */
export const earnRace = (g: GarageState): GarageState => ({ ...g, races: g.races + 1 });

/** Everything there is to earn, for the shelf's count and the tests. */
export const EARNABLE = { parts: ALL_KEYS.filter(k => partOf(k).price !== 0).length, tracks: TRACKS.length, cups: CUP_IDS.length };
