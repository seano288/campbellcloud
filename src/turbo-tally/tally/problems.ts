// What Turbo Tally asks: five kinds, three Levels each, with Stretch inside a Level for size. Every question is a tap. Every generated
// question has exactly one right answer (problems.test.ts checks thousands of them).
//
// - Podium (`place`): cars in a line heading for the finish, on the right, the way they drive. Cars are told apart by colour and a
//   symbol on the roof, never a number (a number on a car would be read as its place), and no two are level.
// - Faster Car (`more`): two cars, each with a speed number on its sign. Tap the faster (or slower) one; at Level 3, the sign between.
// - Tally Board (`tally`): tally marks on a pit board, always in bundles of five with the fifth across.
// - Race Chart (`chart`): three cars' wins as a picture graph, then a bar graph with numbers up the side.
// - Line Up (`order`): three numbers on three cars, put in order; at Level 3, which number goes between two others.
//
// Number choices come from real mistakes and near misses; where the right one sits among the sorted choices is picked first, so it is
// not always in the middle (the Math Bots research, 6.3).
import { int, pick, shuffle, type Rng } from '../../game/rng';
import type { Stretch } from '../../modes/progress';

export type Level = 1 | 2 | 3;
export const KINDS = ['place', 'more', 'tally', 'chart', 'order'] as const;
export type Kind = (typeof KINDS)[number];

// ---------- the cars in a question ----------

/** Podium's ten cars: a colour each, with its own symbol on the roof. */
export const CAR_COLOURS = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'white', 'black', 'brown'] as const;
export type CarColour = (typeof CAR_COLOURS)[number];
export const COLOUR_ART: Record<CarColour, { fill: string; ink: string; symbol: 'star' | 'bolt' | 'leaf' | 'sun' | 'flame' | 'moon' | 'heart' | 'diamond' | 'crown' | 'ring' }> = {
  red: { fill: '#e63946', ink: '#fff', symbol: 'star' }, blue: { fill: '#2f6fd6', ink: '#fff', symbol: 'bolt' }, green: { fill: '#2fa84f', ink: '#fff', symbol: 'leaf' },
  yellow: { fill: '#ffd23f', ink: '#1d1d1f', symbol: 'sun' }, orange: { fill: '#ff8a1f', ink: '#1d1d1f', symbol: 'flame' }, purple: { fill: '#8e5bd8', ink: '#fff', symbol: 'moon' },
  pink: { fill: '#ff7ac8', ink: '#1d1d1f', symbol: 'heart' }, white: { fill: '#f4f6fa', ink: '#1d1d1f', symbol: 'diamond' }, black: { fill: '#2a2d36', ink: '#ffd23f', symbol: 'crown' },
  brown: { fill: '#8a5a2b', ink: '#fff', symbol: 'ring' },
};
/** Race Chart's cars: six colours that are easy to say and to tell apart in a bar. */
export const CHART_COLOURS = ['red', 'blue', 'green', 'yellow', 'orange', 'purple'] as const satisfies readonly CarColour[];
export type ChartColour = (typeof CHART_COLOURS)[number];

export const ORDINALS = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'] as const;
export type Ordinal = (typeof ORDINALS)[number];
/** "1st", "2nd": how a place is written on a choice. */
export const placeText = (n: number) => `${n}${n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th'}`;

// ---------- choices ----------

const uniq = (xs: readonly number[]) => [...new Set(xs)];
/** `wrong` wrong numbers from the traps, topped up with near misses, all in [lo, hi]; the right one's place among them is random. */
export function numberChoices(rng: Rng, target: number, traps: readonly number[], wrong: number, lo: number, hi: number): number[] {
  const usable = traps.filter(t => t !== target && t >= lo && t <= hi);
  const near = (side: 1 | -1) => [1, 2, 3, 4, 5].map(d => target + side * d).filter(x => x >= lo && x <= hi);
  const below = uniq([...shuffle(rng, usable.filter(t => t < target)), ...near(-1)]);
  const above = uniq([...shuffle(rng, usable.filter(t => t > target)), ...near(1)]);
  let under = int(rng, 0, wrong);
  if (below.length < under) under = below.length;
  if (above.length < wrong - under) under = wrong - above.length;
  return [...below.slice(0, under), target, ...above.slice(0, wrong - under)].sort((a, b) => a - b);
}

// ---------- Podium ----------

export type PlaceForm = 'tap' | 'which' | 'passes' | 'passed';
export interface PlaceProblem {
  readonly kind: 'place'; readonly form: PlaceForm;
  /** Front first: cars[0] is nearest the finish. */
  readonly cars: readonly CarColour[];
  /** The car asked about (which, passes, passed), or the car in the asked place (tap). */
  readonly target: CarColour;
  /** The place asked for (tap), or the place it is in now, before any pass. */
  readonly place: number;
  /** Tap: the colour. Otherwise the new place, as a number. */
  readonly answer: string;
  readonly choices: readonly number[];
}

export function makePlace(level: Level, stretch: Stretch, rng: Rng): PlaceProblem {
  if (level === 1) {
    const n = 3 + stretch, cars = shuffle(rng, CAR_COLOURS).slice(0, n), place = int(rng, 1, n);
    return { kind: 'place', form: 'tap', cars, target: cars[place - 1]!, place, answer: cars[place - 1]!, choices: [] };
  }
  if (level === 2) {
    const n = [5, 7, 10][stretch]!, cars = shuffle(rng, CAR_COLOURS).slice(0, n), place = int(rng, 1, Math.min(n, 3 + stretch * 3));
    const counted = n + 1 - place; // counted from the back
    return { kind: 'place', form: 'which', cars, target: cars[place - 1]!, place, answer: String(place), choices: numberChoices(rng, place, [counted, place - 1, place + 1], 2, 1, n) };
  }
  const form: PlaceForm = stretch === 0 ? 'passes' : stretch === 1 ? 'passed' : pick(rng, ['passes', 'passed'] as const);
  const n = [5, 6, 8][stretch]!, cars = shuffle(rng, CAR_COLOURS).slice(0, n);
  const place = form === 'passes' ? int(rng, 2, Math.min(n, 6)) : int(rng, 1, Math.min(n - 1, 6)), now = form === 'passes' ? place - 1 : place + 1;
  return { kind: 'place', form, cars, target: cars[place - 1]!, place, answer: String(now), choices: numberChoices(rng, now, [place, form === 'passes' ? place + 1 : place - 1], 2, 1, n) };
}

// ---------- Faster Car ----------

export type MoreForm = 'faster' | 'slower' | 'sign';
export type Sign = '<' | '>' | '=';
export const SIGNS: readonly Sign[] = ['<', '=', '>'];
export interface MoreProblem {
  readonly kind: 'more'; readonly form: MoreForm;
  readonly a: number; readonly b: number;
  /** 'a' or 'b' (the car), or the sign between them. */
  readonly answer: 'a' | 'b' | Sign;
}

const signOf = (a: number, b: number): Sign => (a < b ? '<' : a > b ? '>' : '=');
const swapOf = (n: number) => (n % 10) * 10 + Math.floor(n / 10);

/** Two different numbers for a Level and Stretch. */
function pairFor(level: Level, stretch: Stretch, rng: Rng): [number, number] {
  if (level === 1) {
    const gap = [6, 3, 1][stretch]!;
    for (;;) { const a = int(rng, 1, 20), b = int(rng, 1, 20); if (Math.abs(a - b) >= gap && (stretch < 2 || Math.abs(a - b) <= 4)) return [a, b]; }
  }
  if (level === 2) {
    for (;;) {
      const a = int(rng, 10, 99), b = int(rng, 10, 99), sameTens = Math.floor(a / 10) === Math.floor(b / 10);
      if (a === b) continue;
      if (stretch === 2 ? sameTens : !sameTens && (stretch === 1 || Math.abs(a - b) >= 15)) return [a, b];
    }
  }
  // swapped digits: 14 and 41, never a number that swaps to itself
  for (;;) { const a = int(rng, 12, 98); if (a % 10 && a % 11) return rng() < .5 ? [a, swapOf(a)] : [swapOf(a), a]; }
}

export function makeMore(level: Level, stretch: Stretch, rng: Rng): MoreProblem {
  if (level === 3 && stretch > 0) {
    // the signs: = turns up about one in six, and only on a sign question
    if (rng() < 1 / 6) { const a = int(rng, 10, 99); return { kind: 'more', form: 'sign', a, b: a, answer: '=' }; }
    const [a, b] = stretch === 1 ? pairFor(3, 0, rng) : pairFor(2, pick(rng, [0, 2] as const), rng);
    return { kind: 'more', form: 'sign', a, b, answer: signOf(a, b) };
  }
  const [a, b] = pairFor(level, stretch, rng);
  const form: MoreForm = stretch > 0 && rng() < 1 / 3 ? 'slower' : 'faster';
  const aWins = form === 'faster' ? a > b : a < b;
  return { kind: 'more', form, a, b, answer: aWins ? 'a' : 'b' };
}

// ---------- Tally Board ----------

export type TallyForm = 'read' | 'make' | 'pick';
export interface TallyProblem {
  readonly kind: 'tally'; readonly form: TallyForm;
  readonly n: number;
  /** read: numbers to pick from; pick: the counts of the three tallies shown. */
  readonly choices: readonly number[];
  readonly answer: string;
}
/** The tally for n: full bundles of five (the fifth across), then the loose marks. */
export const bundlesOf = (n: number) => ({ fives: Math.floor(n / 5), ones: n % 5 });
export const TALLY_MOST = 30;

export function makeTally(level: Level, stretch: Stretch, rng: Rng): TallyProblem {
  if (level === 1) {
    const n = int(rng, [2, 4, 6][stretch]!, [5, 8, 10][stretch]!);
    return { kind: 'tally', form: 'read', n, answer: String(n), choices: numberChoices(rng, n, [n - 1, n + 1, n - 5 >= 1 ? n - 4 : n + 4, n % 5 + 1], 2, 1, 12) };
  }
  if (level === 2) {
    const n = int(rng, [11, 15, 20][stretch]!, [20, 25, 30][stretch]!), { fives, ones } = bundlesOf(n);
    // the mistakes: a bundle counted as 4 or as 1, a loose mark missed, the bundles alone
    return { kind: 'tally', form: 'read', n, answer: String(n), choices: numberChoices(rng, n, [fives * 4 + ones, fives + ones, n - 1, n + 1, fives * 5], 2, 1, TALLY_MOST + 5) };
  }
  if (stretch === 0 || (stretch === 2 && rng() < .5)) {
    const n = int(rng, 6, stretch === 0 ? 20 : TALLY_MOST);
    return { kind: 'tally', form: 'make', n, answer: String(n), choices: [] };
  }
  const n = int(rng, 8, TALLY_MOST);
  return { kind: 'tally', form: 'pick', n, answer: String(n), choices: shuffle(rng, [n, ...shuffle(rng, [n - 1, n + 1, n + 5, n - 5].filter(x => x >= 1 && x <= TALLY_MOST)).slice(0, 2)]) };
}

// ---------- Race Chart ----------

export type ChartForm = 'most' | 'fewest' | 'each' | 'more' | 'total';
export interface ChartProblem {
  readonly kind: 'chart'; readonly form: ChartForm;
  /** Picture graph (a trophy for each win) at Level 1, a bar graph with numbers up the side after. */
  readonly graph: 'picture' | 'bar';
  readonly rows: readonly { readonly car: ChartColour; readonly wins: number }[];
  /** The car asked about (each, more), and the one compared with (more). */
  readonly car: ChartColour | null;
  readonly other: ChartColour | null;
  /** A colour (most, fewest) or a number. */
  readonly answer: string;
  readonly choices: readonly number[];
}
export const CHART_TOP = 10;

export function makeChart(level: Level, stretch: Stretch, rng: Rng): ChartProblem {
  const cars = shuffle(rng, CHART_COLOURS).slice(0, 3) as ChartColour[];
  if (level === 1) {
    // a clear winner and a clear loser, each by at least two
    const top = [6, 7, 8][stretch]!, gap = 2;
    const lo = int(rng, 1, top - gap * 2), mid = int(rng, lo + gap, top - gap), hi = int(rng, mid + gap, top);
    const wins = shuffle(rng, [lo, mid, hi]), rows = cars.map((car, i) => ({ car, wins: wins[i]! }));
    const form: ChartForm = rng() < .5 ? 'most' : 'fewest';
    const want = form === 'most' ? hi : lo;
    return { kind: 'chart', form, graph: 'picture', rows, car: null, other: null, answer: rows.find(r => r.wins === want)!.car, choices: [] };
  }
  if (level === 2) {
    const top = [5, 8, 10][stretch]!, wins = cars.map(() => int(rng, 1, top)), rows = cars.map((car, i) => ({ car, wins: wins[i]! }));
    const k = int(rng, 0, 2), n = wins[k]!;
    return { kind: 'chart', form: 'each', graph: 'bar', rows, car: cars[k]!, other: null, answer: String(n), choices: numberChoices(rng, n, [...wins.filter((_, j) => j !== k), n - 1, n + 1], 2, 0, CHART_TOP) };
  }
  if (stretch === 0 || (stretch === 2 && rng() < .5)) {
    // how many more: never zero, the bigger first
    for (;;) {
      const wins = cars.map(() => int(rng, 1, CHART_TOP)), [i, j] = shuffle(rng, [0, 1, 2]);
      if (wins[i!]! <= wins[j!]!) continue;
      const rows = cars.map((car, x) => ({ car, wins: wins[x]! })), d = wins[i!]! - wins[j!]!;
      return { kind: 'chart', form: 'more', graph: 'bar', rows, car: cars[i!]!, other: cars[j!]!, answer: String(d), choices: numberChoices(rng, d, [wins[i!]!, wins[j!]!, wins[i!]! + wins[j!]!, d + 1, d - 1], 2, 1, 20) };
    }
  }
  for (;;) {
    const wins = cars.map(() => int(rng, 1, 9)), total = wins.reduce((a, b) => a + b, 0);
    if (total > 20) continue;
    const rows = cars.map((car, x) => ({ car, wins: wins[x]! })), two = wins[0]! + wins[1]!;
    return { kind: 'chart', form: 'total', graph: 'bar', rows, car: null, other: null, answer: String(total), choices: numberChoices(rng, total, [two, Math.max(...wins), total - 1, total + 1], 2, 1, 30) };
  }
}

// ---------- Line Up ----------

export type OrderForm = 'up' | 'down' | 'between';
export interface OrderProblem {
  readonly kind: 'order'; readonly form: OrderForm;
  /** The numbers on the cars, as they stand on the grid (up, down), or the three choices (between). */
  readonly nums: readonly number[];
  readonly lo: number; readonly hi: number;
  /** up / down: the numbers in the order to tap, joined by commas; between: the number. */
  readonly answer: string;
}

function three(rng: Rng, lo: number, hi: number, sameTens: boolean): number[] {
  for (;;) {
    const t = int(rng, Math.ceil(lo / 10), Math.floor(hi / 10));
    const ns = sameTens ? [0, 0, 0].map(() => t * 10 + int(rng, 0, 9)) : [0, 0, 0].map(() => int(rng, lo, hi));
    if (new Set(ns).size === 3 && ns.every(n => n >= lo && n <= hi)) return ns;
  }
}

export function makeOrder(level: Level, stretch: Stretch, rng: Rng): OrderProblem {
  if (level === 3) {
    const lo = int(rng, 10, 70), hi = lo + int(rng, [10, 8, 5][stretch]!, [20, 14, 9][stretch]!);
    const right = int(rng, lo + 1, hi - 1);
    const below = int(rng, Math.max(1, lo - 9), lo - 1), above = int(rng, hi + 1, Math.min(99, hi + 9));
    const nums = shuffle(rng, [right, below, above]);
    return { kind: 'order', form: 'between', nums, lo, hi, answer: String(right) };
  }
  const nums = level === 1 ? three(rng, 1, 20, false) : three(rng, 10, 99, stretch === 2 && rng() < .5);
  const form: OrderForm = level === 1 || stretch === 0 ? 'up' : rng() < .5 ? 'up' : 'down';
  const sorted = [...nums].sort((a, b) => (form === 'up' ? a - b : b - a));
  if (nums.join() === sorted.join()) return makeOrder(level, stretch, rng); // never already in order
  return { kind: 'order', form, nums, lo: 0, hi: 0, answer: sorted.join(',') };
}

// ---------- all of them ----------

export type Question = PlaceProblem | MoreProblem | TallyProblem | ChartProblem | OrderProblem;
export function makeQuestion(kind: Kind, level: Level, stretch: Stretch, rng: Rng): Question {
  switch (kind) {
    case 'place': return makePlace(level, stretch, rng);
    case 'more': return makeMore(level, stretch, rng);
    case 'tally': return makeTally(level, stretch, rng);
    case 'chart': return makeChart(level, stretch, rng);
    case 'order': return makeOrder(level, stretch, rng);
  }
}

/** Is this the right answer? null: not an answer to this question at all. */
export function isRightAnswer(q: Question, answer: string): boolean | null {
  if (!answer) return null;
  switch (q.kind) {
    case 'place': return q.form === 'tap' ? (q.cars.includes(answer as CarColour) ? answer === q.answer : null) : /^\d+$/.test(answer) ? answer === q.answer : null;
    case 'more': return ['a', 'b', ...SIGNS].includes(answer) ? answer === q.answer : null;
    case 'tally': return /^\d+$/.test(answer) ? answer === q.answer : null;
    case 'chart': return (q.form === 'most' || q.form === 'fewest') ? (q.rows.some(r => r.car === answer) ? answer === q.answer : null) : /^\d+$/.test(answer) ? answer === q.answer : null;
    case 'order': return q.form === 'between' ? (/^\d+$/.test(answer) ? answer === q.answer : null) : answer.split(',').length === 3 ? answer === q.answer : null;
  }
}

/** Every answer he could give to a question (the choices, the cars, every order): the tests check exactly one is right. */
export function possibleAnswers(q: Question): string[] {
  switch (q.kind) {
    case 'place': return q.form === 'tap' ? [...q.cars] : q.choices.map(String);
    case 'more': return q.form === 'sign' ? [...SIGNS] : ['a', 'b'];
    case 'tally': return q.form === 'make' ? Array.from({ length: TALLY_MOST + 1 }, (_, i) => String(i)) : q.choices.map(String);
    case 'chart': return q.form === 'most' || q.form === 'fewest' ? q.rows.map(r => r.car) : q.choices.map(String);
    case 'order': {
      if (q.form === 'between') return q.nums.map(String);
      const [a, b, c] = q.nums as [number, number, number];
      return [[a, b, c], [a, c, b], [b, a, c], [b, c, a], [c, a, b], [c, b, a]].map(o => o.join(','));
    }
  }
}
