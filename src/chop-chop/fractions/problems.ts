// The six kinds of fraction question, Level by Level. Each starts with the idea and only later asks for the words:
// first "are these pieces fair?", then what one piece is called, then finding, colouring and comparing parts, and
// sharing a pile fairly. Every kind has three Levels; the tables below say what each Level asks.
import { pick, shuffle, type Rng } from '../../game/rng';
import {
  bigger, colorLine, cookiesAsk, cut, cutInto, DENS, eachGets, equalPieces, fillLine, filledLine, findLine, FOODS, FRAC_WORDS, fracWord,
  friendsNeed, friendsShare, isBigger, isSame, key, means, numberPhrase, onePieceIs, parseKey, partOf, partsOfTank, piecesAre, platesLine,
  coloredLine, same, thatShows, thisShows, unit, whichBigger, whichFair, youGet,
  type Den, type Food, type Frac, type FractionPhrase, type Picture, type SaidFrac,
} from './fraction';

export type Level = 1 | 2 | 3;
const f = (k: SaidFrac): Frac => parseKey(k)!;

// ---------- Fair Shares: which one is cut into equal pieces? ----------

export const FAIR_DENS: Record<Level, readonly Den[]> = { 1: [2], 2: [3, 4], 3: [4, 6, 8] };
export interface FairProblem { readonly kind: 'fair'; readonly food: Food; readonly pictures: readonly Picture[]; readonly answer: number }

/** Pieces that are clearly not the same size: the biggest is at least half as big again as the smallest. */
export function unequalPieces(food: Food, d: number, rng: Rng): number[] {
  const rows = rowsFor(food, d), cols = d / rows;
  for (;;) {
    const w = Array.from({ length: cols }, () => 0.45 + rng() * 1.3), sum = w.reduce((a, b) => a + b, 0);
    if (Math.max(...w) / Math.min(...w) < 1.6) continue;
    const share = w.map(x => x / sum / rows);
    return Array.from({ length: d }, (_, i) => share[i % cols]!);
  }
}
/** The cake and the chocolate bar are cut into a grid: how many rows (the pizza is always one ring of wedges). */
export function rowsFor(food: Food, d: number) {
  if (food === 'pizza' || d <= 3) return 1;
  if (food === 'chocolate bar' && d === 4) return 1;
  return 2;
}

export function makeFair(level: Level, rng: Rng): FairProblem {
  const food = pick(rng, FOODS), d = pick(rng, FAIR_DENS[level]);
  const fair: Picture = { food, pieces: equalPieces(d), shaded: [] };
  const pictures = shuffle(rng, [fair, { food, pieces: unequalPieces(food, d, rng), shaded: [] }, { food, pieces: unequalPieces(food, d, rng), shaded: [] }]);
  return { kind: 'fair', food, pictures, answer: pictures.indexOf(fair) };
}

// ---------- Name the Piece: what is one piece called? ----------

export const NAME_DENS: Record<Level, readonly Den[]> = { 1: [2, 4], 2: [2, 3, 4], 3: [3, 4, 6, 8] };
const NAME_CHOICES: Record<Level, readonly Den[]> = { 1: [2, 3, 4], 2: [2, 3, 4, 6], 3: DENS };
export interface NameProblem { readonly kind: 'name'; readonly picture: Picture; readonly d: Den; readonly choices: readonly Den[] }

export function makeName(level: Level, rng: Rng, avoid?: Den): NameProblem {
  const food = pick(rng, FOODS), options = NAME_DENS[level].filter(d => d !== avoid), d = pick(rng, options.length ? options : NAME_DENS[level]);
  const others = shuffle(rng, NAME_CHOICES[level].filter(x => x !== d)).slice(0, 2);
  return { kind: 'name', picture: cut(food, d, 1), d, choices: [...others, d].sort((a, b) => a - b) };
}

// ---------- Find It: which picture shows the part he hears? ----------

export const FIND_TARGETS: Record<Level, readonly SaidFrac[]> = {
  1: ['1/2', '1/4'], 2: ['1/2', '1/3', '1/4', '1/6', '1/8'], 3: ['2/3', '3/4', '3/8', '5/8', '5/6', '2/4'],
};
const FIND_OTHERS: Record<Level, readonly SaidFrac[]> = {
  1: ['1/2', '1/3', '1/4'], 2: ['1/2', '1/3', '1/4', '1/6', '1/8'], 3: ['1/3', '1/4', '2/3', '3/4', '3/8', '5/8', '5/6', '1/8', '1/6', '2/6'],
};
export interface FindProblem { readonly kind: 'find'; readonly food: Food; readonly target: Frac; readonly choices: readonly Frac[] }

export function makeFind(level: Level, rng: Rng, avoid?: Frac): FindProblem {
  const options = FIND_TARGETS[level].map(f).filter(t => !avoid || !same(t, avoid)), target = pick(rng, options);
  // the others never show the same amount (two quarters is one half too), nor the same amount as each other
  const pool = shuffle(rng, FIND_OTHERS[level].map(f)), others: Frac[] = [];
  for (const c of pool) if (others.length < 2 && !same(c, target) && !others.some(o => same(o, c))) others.push(c);
  // at Level 3 one of the others is cut the same way, so counting the pieces isn't enough
  if (level === 3 && !others.some(o => o.d === target.d)) {
    const n = target.n === 1 ? target.d - 1 : 1, alt = { n, d: target.d };
    if (!same(alt, target) && !others.some(o => same(o, alt))) others[0] = alt;
  }
  return { kind: 'find', food: pick(rng, FOODS), target, choices: shuffle(rng, [target, ...others]) };
}

// ---------- Color It: colour the part he hears ----------

export const COLOR_TARGETS: Record<Level, readonly [SaidFrac, Den][]> = {
  1: [['1/2', 2], ['1/2', 4], ['1/4', 4]],
  2: [['1/3', 3], ['1/3', 6], ['3/4', 4], ['1/2', 6], ['1/2', 8], ['1/4', 8]],
  3: [['2/3', 3], ['2/3', 6], ['3/8', 8], ['5/8', 8], ['5/6', 6], ['3/4', 8], ['1/6', 6]],
};
export interface ColorProblem { readonly kind: 'color'; readonly food: Food; readonly target: Frac; readonly d: Den }

export function makeColor(level: Level, rng: Rng, avoid?: Frac): ColorProblem {
  const options = COLOR_TARGETS[level].filter(([t]) => !avoid || !same(f(t), avoid)), [t, d] = pick(rng, options.length ? options : COLOR_TARGETS[level]);
  return { kind: 'color', food: pick(rng, FOODS), target: f(t), d };
}
/** How many pieces make the part. */
export const piecesFor = (p: { target: Frac; d: Den }) => (p.target.n * p.d) / p.target.d;

// ---------- Bigger Piece: which part is bigger (or are they the same)? ----------

export const BIGGER_PAIRS: Record<Level, readonly [SaidFrac, SaidFrac][]> = {
  1: [['1/2', '1/4'], ['1/2', '1/8']],
  2: [['1/3', '1/6'], ['1/4', '1/8'], ['1/2', '1/3'], ['1/3', '1/4'], ['1/2', '1/6'], ['1/4', '1/6']],
  3: [['1/3', '1/8'], ['1/6', '1/8'], ['1/4', '1/6'], ['2/4', '1/2'], ['2/6', '1/3'], ['2/8', '1/4'], ['4/8', '1/2'], ['3/4', '1/4'], ['2/3', '1/3']],
};
export const SAME = 'same';
/** At Levels 1 and 2 he taps one of two pictures; at Level 3 he hears the parts and taps a word (or "the same"). */
export interface BiggerProblem { readonly kind: 'bigger'; readonly food: Food; readonly a: Frac; readonly b: Frac; readonly words: boolean }

export function makeBigger(level: Level, rng: Rng, avoid?: string): BiggerProblem {
  const options = BIGGER_PAIRS[level].filter(([x, y]) => `${x}|${y}` !== avoid);
  const [x, y] = pick(rng, options.length ? options : BIGGER_PAIRS[level]), [a, b] = rng() < 0.5 ? [x, y] : [y, x];
  return { kind: 'bigger', food: pick(rng, FOODS), a: f(a), b: f(b), words: level === 3 };
}
export const biggerAnswer = (p: Pick<BiggerProblem, 'a' | 'b'>) => (same(p.a, p.b) ? SAME : key(bigger(p.a, p.b) ? p.a : p.b));

// ---------- Share It: cut for friends, then share a pile of cookies fairly ----------

export const FRIENDS = [2, 3, 4] as const;
export const COOKIES: Record<2 | 3, readonly [number, Den][]> = {
  2: [[2, 2], [4, 2], [6, 2], [8, 2], [10, 2]],
  3: [[4, 4], [8, 4], [12, 4], [3, 3], [6, 3], [9, 3]],
};
/** Level 1: how many pieces for this many friends. Levels 2 and 3: how many cookies is a half (a quarter, a third) of the pile. */
export type ShareProblem =
  | { readonly kind: 'share'; readonly friends: number; readonly food: Food; readonly answer: number; readonly choices: readonly number[] }
  | { readonly kind: 'share'; readonly total: number; readonly d: Den; readonly answer: number; readonly choices: readonly number[] };

function numberChoices(answer: number, near: number[], rng: Rng) {
  const others = shuffle(rng, [...new Set(near)].filter(n => n !== answer && n >= 1 && n <= 12)).slice(0, 2);
  return [answer, ...others].sort((a, b) => a - b);
}

export function makeShare(level: Level, rng: Rng, avoid?: number): ShareProblem {
  if (level === 1) {
    const options = FRIENDS.filter(n => n !== avoid), friends = pick(rng, options);
    return { kind: 'share', friends, food: pick(rng, FOODS), answer: friends, choices: numberChoices(friends, [friends - 1, friends + 1, friends * 2], rng) };
  }
  const options = COOKIES[level].filter(([t]) => t !== avoid), [total, d] = pick(rng, options.length ? options : COOKIES[level]), answer = total / d;
  return { kind: 'share', total, d, answer, choices: numberChoices(answer, [total, answer + 1, answer - 1, total - answer, answer * 2], rng) };
}

// ---------- the Fuel Lock: fill the tank to open the vault ----------

export const FUEL_TARGETS: Record<Level, readonly [SaidFrac, Den][]> = {
  1: [['1/2', 2], ['1/2', 4], ['1/4', 4], ['3/4', 4]],
  2: [['1/3', 3], ['2/3', 3], ['3/4', 4], ['1/2', 6], ['3/4', 8]],
  3: [['2/3', 6], ['5/6', 6], ['3/8', 8], ['5/8', 8], ['1/4', 8]],
};
export interface FuelProblem { readonly target: Frac; readonly d: Den }
export const makeFuel = (level: Level, rng: Rng): FuelProblem => { const [t, d] = pick(rng, FUEL_TARGETS[level]); return { target: f(t), d }; };

// ---------- everything these questions can say ----------

export function problemPhrases(): FractionPhrase[] {
  const out: FractionPhrase[] = [];
  const fracs = Object.keys(FRAC_WORDS).map(k => f(k as SaidFrac));
  out.push(...fracs.map(fracWord), ...fracs.map(thisShows), ...fracs.map(thatShows), ...fracs.map(means));
  for (const food of FOODS) {
    out.push(whichFair(food));
    for (const d of DENS) out.push(cutInto(food, d));
  }
  for (const d of DENS) {
    out.push(piecesAre(d), onePieceIs(d));
    for (let k = 0; k <= d; k++) out.push(filledLine(k, d));
    for (let k = 1; k <= d; k++) out.push(coloredLine(k, d));
  }
  for (const l of [1, 2, 3] as const) {
    for (const t of FIND_TARGETS[l]) out.push(findLine(f(t)));
    for (const [t, d] of COLOR_TARGETS[l]) { for (const food of FOODS) out.push(colorLine(f(t), food)); out.push(partOf(f(t), d)); }
    for (const [x, y] of BIGGER_PAIRS[l]) {
      out.push(whichBigger(f(x), f(y)), whichBigger(f(y), f(x)));
      if (same(f(x), f(y))) out.push(isSame(f(x), f(y)), isSame(f(y), f(x)));
      else out.push(isBigger(bigger(f(x), f(y)) ? f(x) : f(y)));
    }
    for (const [t, d] of FUEL_TARGETS[l]) out.push(fillLine(f(t)), partsOfTank(f(t), d));
  }
  for (const n of FRIENDS) { out.push(friendsNeed(n)); for (const food of FOODS) out.push(friendsShare(n, food)); }
  for (const l of [2, 3] as const) for (const [total, d] of COOKIES[l]) out.push(cookiesAsk(total, unit(d)), platesLine(d), eachGets(total / d), youGet(total / d));
  for (let n = 1; n <= 12; n++) out.push(numberPhrase(n));
  return out;
}
