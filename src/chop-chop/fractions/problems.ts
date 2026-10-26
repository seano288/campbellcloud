// The seven kinds of fraction question, Level by Level. Each starts with the idea and only later asks for the words:
// first "are these pieces fair?", then what one piece is called, then finding, colouring and comparing parts, and
// sharing a pile fairly. Last come the numbers a part is written with (Top and Bottom), once he knows the words. Every kind has three Levels; the tables below say what each Level asks.
//
// A question only uses the piece words he may hear (`words`: the ones he has met, and maybe the next one, which he meets
// just before the question; see src/chop-chop/mix.ts). A kind that can't ask anything with those words returns null.
import { pick, shuffle, type Rng } from '../../game/rng';
import {
  bigger, colorLine, cutEachInHalf, HALF_OF, makeTheWhole, MEET_CUTS, tapOne, thatOne, wholeFood, WORD_ORDER, cookiesAsk, cut, cutInto, DENS, eachGets, equalPieces, fillLine, filledLine, findLine, FOODS, FRAC_WORDS, fracWord,
  friendsNeed, friendsShare, isBigger, isSame, key, means, numberPhrase, onePieceIs, parseKey, partOf, partsOfTank, piecesAre, platesLine,
  coloredLine, findWritten, numbersSay, same, thatShows, thisShows, thoseSay, unit, whichBigger, whichFair, writeLike, youGet,
  type Den, type Food, type Frac, type FractionPhrase, type Picture, type SaidFrac,
} from './fraction';

export type Level = 1 | 2 | 3;
const f = (k: SaidFrac): Frac => parseKey(k)!;
/** The piece words he may hear. */
export type Words = readonly Den[];
const knows = (words: Words, ...fracs: Frac[]) => fracs.every(x => words.includes(x.d));

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
const NAME_CHOICES: Record<Level, readonly Den[]> = { 1: [2, 4], 2: [2, 3, 4, 6], 3: DENS };
export interface NameProblem { readonly kind: 'name'; readonly picture: Picture; readonly d: Den; readonly choices: readonly Den[] }

export function makeName(level: Level, rng: Rng, words: Words, avoid?: Den): NameProblem | null {
  const known = NAME_DENS[level].filter(d => words.includes(d)), options = known.filter(d => d !== avoid);
  if (!known.length) return null;
  const food = pick(rng, FOODS), d = pick(rng, options.length ? options : known);
  const others = shuffle(rng, NAME_CHOICES[level].filter(x => x !== d && words.includes(x))).slice(0, 2);
  if (!others.length) return null; // he knows only one word: nothing to choose between yet
  return { kind: 'name', picture: cut(food, d, 1), d, choices: [...others, d].sort((a, b) => a - b) };
}

// ---------- Find It: which food has the part he hears left? ----------

export const FIND_TARGETS: Record<Level, readonly SaidFrac[]> = {
  1: ['1/2', '1/4'], 2: ['1/2', '1/3', '1/4', '1/6', '1/8'], 3: ['2/3', '3/4', '3/8', '5/8', '5/6', '2/4'],
};
const FIND_OTHERS: Record<Level, readonly SaidFrac[]> = {
  1: ['1/2', '1/4'], 2: ['1/2', '1/3', '1/4', '1/6', '1/8'], 3: ['1/3', '1/4', '2/3', '3/4', '3/8', '5/8', '5/6', '1/8', '1/6', '2/6'],
};
export interface FindProblem { readonly kind: 'find'; readonly food: Food; readonly target: Frac; readonly choices: readonly Frac[] }

export function makeFind(level: Level, rng: Rng, words: Words, avoid?: Frac): FindProblem | null {
  const known = FIND_TARGETS[level].map(f).filter(t => knows(words, t)), options = known.filter(t => !avoid || !same(t, avoid));
  if (!known.length) return null;
  const target = pick(rng, options.length ? options : known);
  // the others never show the same amount (two quarters is one half too), nor the same amount as each other
  const pool = shuffle(rng, FIND_OTHERS[level].map(f).filter(c => knows(words, c))), others: Frac[] = [];
  for (const c of pool) if (others.length < 2 && !same(c, target) && !others.some(o => same(o, c))) others.push(c);
  // too few words he knows yet: the whole thing, or all of it eaten, cut the same way
  for (const c of shuffle(rng, [{ n: target.d, d: target.d }, { n: 0, d: target.d }])) if (others.length < 2) others.push(c);
  // at Level 3 one of the others is cut the same way, so counting the pieces isn't enough
  if (level === 3 && !others.some(o => o.d === target.d)) {
    const n = target.n === 1 ? target.d - 1 : 1, alt = { n, d: target.d };
    if (!same(alt, target) && !others.some(o => same(o, alt))) others[0] = alt;
  }
  return { kind: 'find', food: pick(rng, FOODS), target, choices: shuffle(rng, [target, ...others]) };
}

// ---------- Top and Bottom: the numbers a part is written with ----------

/**
 * Level 1: one piece is left, and he taps the numbers that show it. Level 2: he reads the numbers and taps the food they
 * show. Level 3: either way round, with parts of more than one piece, and one of the others cut the same way, so he has
 * to read the top number as well as the bottom one. The part is never said aloud: he reads it.
 */
export const WRITE_TARGETS: Record<Level, readonly SaidFrac[]> = {
  1: ['1/2', '1/3', '1/4'], 2: ['1/2', '1/3', '1/4', '1/6', '1/8'], 3: ['2/3', '3/4', '3/8', '5/8', '5/6'],
};
const WRITE_OTHERS: Record<Level, readonly SaidFrac[]> = {
  1: ['1/2', '1/3', '1/4'], 2: ['1/2', '1/3', '1/4', '1/6', '1/8'], 3: FIND_OTHERS[3],
};
/** `read`: the food is shown and he taps the numbers; otherwise the numbers are shown and he taps the food. */
export interface WriteProblem { readonly kind: 'write'; readonly food: Food; readonly target: Frac; readonly choices: readonly Frac[]; readonly read: boolean }

export function makeWrite(level: Level, rng: Rng, words: Words, avoid?: Frac): WriteProblem | null {
  const known = WRITE_TARGETS[level].map(f).filter(t => knows(words, t)), options = known.filter(t => !avoid || !same(t, avoid));
  if (!known.length) return null;
  const target = pick(rng, options.length ? options : known);
  const pool = shuffle(rng, WRITE_OTHERS[level].map(f).filter(c => knows(words, c))), others: Frac[] = [];
  if (level === 3) { // one cut the same way: counting the pieces isn't enough, the top number matters too
    const alt = { n: target.n === 1 ? target.d - 1 : 1, d: target.d };
    if (!same(alt, target)) others.push(alt);
  }
  for (const c of pool) if (others.length < 2 && !same(c, target) && !others.some(o => same(o, c))) others.push(c);
  if (!others.length) return null; // he knows only one word: nothing to tell apart yet
  const read = level === 1 || (level === 3 && rng() < 0.5);
  return { kind: 'write', food: pick(rng, FOODS), target, choices: shuffle(rng, [target, ...others]), read };
}

// ---------- Color It: colour the part he hears ----------

export const COLOR_TARGETS: Record<Level, readonly [SaidFrac, Den][]> = {
  1: [['1/2', 2], ['1/2', 4], ['1/4', 4]],
  2: [['1/3', 3], ['1/3', 6], ['3/4', 4], ['1/2', 6], ['1/2', 8], ['1/4', 8]],
  3: [['2/3', 3], ['2/3', 6], ['3/8', 8], ['5/8', 8], ['5/6', 6], ['3/4', 8], ['1/6', 6]],
};
export interface ColorProblem { readonly kind: 'color'; readonly food: Food; readonly target: Frac; readonly d: Den }

export function makeColor(level: Level, rng: Rng, words: Words, avoid?: Frac): ColorProblem | null {
  const known = COLOR_TARGETS[level].filter(([t]) => knows(words, f(t))), options = known.filter(([t]) => !avoid || !same(f(t), avoid));
  if (!known.length) return null;
  const [t, d] = pick(rng, options.length ? options : known);
  return { kind: 'color', food: pick(rng, FOODS), target: f(t), d };
}
/** How many pieces make the part. */
export const piecesFor = (p: { target: Frac; d: Den }) => (p.target.n * p.d) / p.target.d;

// ---------- Bigger Piece: which part is bigger (or are they the same)? ----------

export const BIGGER_PAIRS: Record<Level, readonly [SaidFrac, SaidFrac][]> = {
  1: [['1/2', '1/4']],
  2: [['1/2', '1/8'], ['1/3', '1/6'], ['1/4', '1/8'], ['1/2', '1/3'], ['1/3', '1/4'], ['1/2', '1/6'], ['1/4', '1/6']],
  3: [['1/3', '1/8'], ['1/6', '1/8'], ['1/4', '1/6'], ['2/4', '1/2'], ['2/6', '1/3'], ['2/8', '1/4'], ['4/8', '1/2'], ['3/4', '1/4'], ['2/3', '1/3']],
};
export const SAME = 'same';
/** At Levels 1 and 2 he taps one of two pictures; at Level 3 he hears the parts and taps a word (or "the same"). */
export interface BiggerProblem { readonly kind: 'bigger'; readonly food: Food; readonly a: Frac; readonly b: Frac; readonly words: boolean }

export function makeBigger(level: Level, rng: Rng, words: Words, avoid?: string): BiggerProblem | null {
  const known = BIGGER_PAIRS[level].filter(([x, y]) => knows(words, f(x), f(y))), options = known.filter(([x, y]) => `${x}|${y}` !== avoid);
  if (!known.length) return null;
  const [x, y] = pick(rng, options.length ? options : known), [a, b] = rng() < 0.5 ? [x, y] : [y, x];
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

export function makeShare(level: Level, rng: Rng, words: Words, avoid?: number): ShareProblem | null {
  if (level === 1) { // no piece words: one piece for each friend
    const options = FRIENDS.filter(n => n !== avoid), friends = pick(rng, options);
    return { kind: 'share', friends, food: pick(rng, FOODS), answer: friends, choices: numberChoices(friends, [friends - 1, friends + 1, friends * 2], rng) };
  }
  const known = COOKIES[level].filter(([, d]) => words.includes(d)), options = known.filter(([t]) => t !== avoid);
  if (!known.length) return null;
  const [total, d] = pick(rng, options.length ? options : known), answer = total / d;
  return { kind: 'share', total, d, answer, choices: numberChoices(answer, [total, answer + 1, answer - 1, total - answer, answer * 2], rng) };
}

// ---------- the Fuel Lock: fill the tank to open the vault ----------

export const FUEL_TARGETS: Record<Level, readonly [SaidFrac, Den][]> = {
  1: [['1/2', 2], ['1/2', 4], ['1/4', 4], ['3/4', 4]],
  2: [['1/3', 3], ['2/3', 3], ['3/4', 4], ['1/2', 6], ['3/4', 8]],
  3: [['2/3', 6], ['5/6', 6], ['3/8', 8], ['5/8', 8], ['1/4', 8]],
};
export interface FuelProblem { readonly target: Frac; readonly d: Den }
export function makeFuel(level: Level, rng: Rng, words: Words): FuelProblem {
  // the easiest Level he has the words for (one half, at the least)
  const known = ([level, 2, 1] as const).map(l => FUEL_TARGETS[l].filter(([t]) => knows(words, f(t)))).find(k => k.length) ?? [['1/2', 2] as const];
  const [t, d] = pick(rng, known);
  return { target: f(t), d };
}

// ---------- meeting a new word, and meeting writing ----------

/** The word he meets, shown on one food before any question asks it. Any one piece he taps is right. */
export interface MeetProblem { readonly kind: 'meet'; readonly food: Food; readonly d: Den }
export const makeMeet = (d: Den, rng: Rng): MeetProblem => ({ kind: 'meet', food: pick(rng, FOODS), d });
/** Meeting writing: one piece of a food left, and the numbers that show it. Tapping the numbers is right. */
export interface MeetWritingProblem { readonly kind: 'meetWriting'; readonly food: Food; readonly d: Den }
/** Shown with one quarter when he knows it (a top and a bottom number that are easy to tell apart), else one half. */
export const makeMeetWriting = (words: Words, rng: Rng): MeetWritingProblem => ({ kind: 'meetWriting', food: pick(rng, FOODS), d: words.includes(4) ? 4 : 2 });

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
    for (const t of FIND_TARGETS[l]) for (const food of FOODS) out.push(findLine(f(t), food));
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
  out.push(thatOne({ n: 2, d: 2 }), thatOne({ n: 0, d: 2 }), ...FOODS.map(wholeFood), ...([2, 3, 4] as const).map(cutEachInHalf), ...Object.values(HALF_OF));
  for (const d of WORD_ORDER) { out.push(tapOne(d)); for (const food of FOODS) out.push(makeTheWhole(d, food)); }
  for (const d of WORD_ORDER) for (const c of MEET_CUTS[d]) out.push(piecesAre(c));
  out.push(...fracs.map(numbersSay), ...fracs.map(thoseSay), ...WORD_ORDER.map(d => writeLike(unit(d))), ...FOODS.map(findWritten));
  return out;
}
