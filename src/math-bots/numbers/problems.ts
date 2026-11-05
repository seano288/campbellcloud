// The nine first-release kinds of math question, Level by Level. .scratch/math-bots/spec.md says what each kind is for, and
// the research note beside it has the wording and teaching. Every question carries its right answer as the string a view
// submits, and its traps: the wrong answers that show a real misconception, labelled so a miss can be taught and logged.
import { int, pick, shuffle, type Rng } from '../../game/rng';
import type { Stretch } from '../../modes/progress';
import { numberChoices } from './choices';

export type Level = 1 | 2 | 3;
export const MATH_KINDS = ['ten', 'on', 'story', 'facts', 'tens', 'skip', 'part', 'scale', 'over'] as const;
export type Kind = (typeof MATH_KINDS)[number];

/** How he answers. Strip: a fixed 0 to 20 row, for recall. Wheels: two digits. */
export type Input = 'choices' | 'strip' | 'wheels' | 'same' | 'cards' | 'sign';
export interface Trap { readonly value: string; readonly why: string }
export interface Asked { readonly answer: string; readonly traps: readonly Trap[]; readonly input: Input; readonly choices?: readonly number[] }

const STRIP_TOP = 20;
const trapsOf = (answer: number, list: ReadonlyArray<readonly [number, string]>): Trap[] => {
  const seen = new Set([answer]), out: Trap[] = [];
  for (const [value, why] of list) if (value >= 0 && !seen.has(value)) { seen.add(value); out.push({ value: String(value), why }); }
  return out;
};
const onStrip = (answer: number, list: ReadonlyArray<readonly [number, string]>): Asked =>
  ({ answer: String(answer), traps: trapsOf(answer, list), input: 'strip' });
function onChoices(rng: Rng, answer: number, list: ReadonlyArray<readonly [number, string]>, hi: number): Asked {
  const traps = trapsOf(answer, list);
  return { answer: String(answer), traps, input: 'choices', choices: numberChoices(rng, answer, traps.map(t => Number(t.value)), 2, 0, hi) };
}

// ---------- Make Ten ----------

export type TenProblem = Asked & (
  | { readonly kind: 'ten'; readonly form: 'look'; readonly n: number }
  | { readonly kind: 'ten'; readonly form: 'partners'; readonly n: number }
  | { readonly kind: 'ten'; readonly form: 'hiding'; readonly whole: number; readonly part: number }
);
function makeTen(level: Level, stretch: Stretch, rng: Rng): TenProblem {
  if (level === 1) {
    const n = stretch === 0 ? int(rng, 1, 5) : pick(rng, [1, 2, 3, 4, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10]);
    return { kind: 'ten', form: 'look', n, ...onChoices(rng, n, [[n - 1, 'one less'], [n + 1, 'one more'], ...(n > 5 && n < 10 ? [[5, 'saw only the full row'] as const] : []), [10, 'saw a full frame']], 10) };
  }
  if (level === 2) {
    const n = int(rng, 1, 9), a = 10 - n;
    return { kind: 'ten', form: 'partners', n, ...onStrip(a, [[n, 'repeated what he sees'], [10, 'said the ten'], [a - 1, 'one short'], [a + 1, 'one over']]) };
  }
  const whole = int(rng, 4, 10), part = int(rng, 1, whole - 1), a = whole - part;
  return { kind: 'ten', form: 'hiding', whole, part, ...onStrip(a, [[whole, 'said the whole'], [part, 'said the part he sees'], [whole + part, 'added everything'], [a - 1, 'one short'], [a + 1, 'one over']]) };
}

// ---------- Count On ----------

export type OnProblem = Asked & (
  | { readonly kind: 'on'; readonly form: 'box'; readonly a: number; readonly b: number }
  | { readonly kind: 'on'; readonly form: 'biggerFirst'; readonly a: number; readonly b: number }
  | { readonly kind: 'on'; readonly form: 'countUp'; readonly from: number; readonly to: number }
);
const onTraps = (a: number, b: number) => [[a + b - 1, 'counted the start number'], [a + b + 1, 'one too many'], [a, 'stopped at the start'], [b, 'said the second number']] as const;
function makeOn(level: Level, stretch: Stretch, rng: Rng): OnProblem {
  if (level === 1) {
    const a = int(rng, 3, 9 + stretch * 3), b = int(rng, 1, 3);
    return { kind: 'on', form: 'box', a, b, ...onChoices(rng, a + b, onTraps(a, b), STRIP_TOP) };
  }
  if (level === 2) {
    const small = int(rng, 1, 4), big = int(rng, Math.max(2 * small, small + 1), STRIP_TOP - small);
    const [a, b] = rng() < 0.5 ? [small, big] : [big, small];
    return { kind: 'on', form: 'biggerFirst', a, b, ...onStrip(a + b, onTraps(a, b)) };
  }
  const from = int(rng, 3, 15), d = int(rng, 1, 5), to = from + d;
  return { kind: 'on', form: 'countUp', from, to, ...onStrip(d, [[to, 'said the end'], [from, 'said the start'], [d + 1, 'counted the start square'], [d - 1, 'one short']]) };
}

// ---------- Facts ----------

/** a + b = c or c - b = a. `flip` puts the single number on the left (10 = 7 + 3), so = doesn't come to mean "the answer is next". */
export interface Equation { readonly a: number; readonly b: number; readonly c: number; readonly op: 'add' | 'sub'; readonly flip: boolean }
export type Pair = readonly [number, number];
const pairKey = ([a, b]: Pair) => `${Math.max(a, b)}+${Math.min(a, b)}`;

/** Each Level's facts, as the strategies he uses for them. Turnarounds and subtractions come from the same pairs. */
export function factsFor(level: Level): Pair[] {
  const easy = new Map<string, Pair>(), add = (p: Pair) => easy.set(pairKey(p), p);
  for (let a = 0; a <= 10; a++) for (const b of [0, 1, 2]) if (a >= b) add([a, b]);
  for (let a = 0; a <= 5; a++) add([a, a]);
  for (const a of [5, 6, 7, 8, 9, 10]) add([a, 10 - a]);
  if (level === 1) return [...easy.values()];
  if (level === 2) {
    const rest: Pair[] = [];
    for (let a = 3; a <= 7; a++) for (let b = 3; b <= a; b++) if (a + b <= 10 && !easy.has(pairKey([a, b]))) rest.push([a, b]);
    return rest;
  }
  const hard = new Map<string, Pair>();
  for (let a = 6; a <= 10; a++) hard.set(pairKey([a, a]), [a, a]);
  for (let b = 5; b <= 9; b++) hard.set(pairKey([b + 1, b]), [b + 1, b]);
  for (let n = 3; n <= 9; n++) hard.set(pairKey([10, n]), [10, n]);
  return [...hard.values()];
}

export type FactsProblem = Asked & { readonly kind: 'facts'; readonly eq: Equation };
function makeFacts(level: Level, rng: Rng, pool: readonly Pair[]): FactsProblem {
  const [x, y] = pick(rng, pool)!, [a, b] = rng() < 0.5 ? [x, y] : [y, x], c = a + b, sub = rng() < 0.5, flip = rng() < 0.25;
  const eq: Equation = { a, b, c, op: sub ? 'sub' : 'add', flip };
  const answer = sub ? a : c;
  const traps = sub
    ? [[c + b, 'used the wrong operation'], [a - 1, 'one short'], [a + 1, 'one over'], [b, 'said the number taken away']] as const
    : [[c - 1, 'one short'], [c + 1, 'one over'], [Math.abs(a - b), 'used the wrong operation'], [a, 'said the first number'], [b, 'said the second number']] as const;
  return { kind: 'facts', eq, ...(level === 1 ? onChoices(rng, answer, traps, STRIP_TOP) : onStrip(answer, traps)) };
}

// ---------- Over Ten ----------

export type OverProblem = Asked & (
  | { readonly kind: 'over'; readonly form: 'fill'; readonly a: number; readonly b: number; readonly moved: number; readonly left: number; readonly steps?: readonly number[] }
  | { readonly kind: 'over'; readonly form: 'plain'; readonly a: number; readonly b: number }
  | { readonly kind: 'over'; readonly form: 'through'; readonly c: number; readonly b: number }
);
function makeOver(level: Level, rng: Rng): OverProblem {
  if (level === 3 && rng() < 0.4) {
    const b = int(rng, 3, 9), a = int(rng, 11 - b, 9), c = a + b;
    return { kind: 'over', form: 'through', c, b, ...onStrip(a, [[a - 1, 'one short'], [a + 1, 'one over'], [b, 'said the number taken away'], [c + b, 'used the wrong operation']]) };
  }
  const a = level === 1 ? 9 : level === 2 ? pick(rng, [7, 8]) : int(rng, 2, 9);
  const b = int(rng, Math.max(2, 11 - a), 9), total = a + b;
  const moved = 10 - a, left = b - moved;
  const asked = onStrip(total, [[total - 1, 'one short'], [total + 1, 'one over'], [10 + moved, 'added the number he moved']]);
  if (level === 3) return { kind: 'over', form: 'plain', a, b, ...asked };
  // At Level 2 he picks the step (10 + left) after filling: the wrong ones forgot the move, or used the moved part.
  const steps = level === 2 ? [...new Set([left, b, moved, left + 1])].slice(0, 3).sort((x, y) => x - y) : undefined;
  return { kind: 'over', form: 'fill', a, b, moved, left, ...(steps && { steps }), ...asked };
}

// ---------- Missing Part ----------

export type PartProblem = Asked & (
  | { readonly kind: 'part'; readonly form: 'bond'; readonly whole: number; readonly here: number }
  | { readonly kind: 'part'; readonly form: 'addTo'; readonly a: number; readonly c: number }
  | { readonly kind: 'part'; readonly form: 'takeFrom'; readonly c: number; readonly a: number }
  | { readonly kind: 'part'; readonly form: 'firstAdd'; readonly b: number; readonly c: number }
  | { readonly kind: 'part'; readonly form: 'flipTake'; readonly a: number; readonly b: number }
);
function makePart(level: Level, rng: Rng): PartProblem {
  const near = (x: number) => [[x - 1, 'one short'], [x + 1, 'one over']] as const;
  if (level === 1) {
    const whole = int(rng, 3, 10), here = int(rng, 1, whole - 1), d = whole - here;
    return { kind: 'part', form: 'bond', whole, here, ...onStrip(d, [[whole, 'said the whole'], [here, 'said the part he sees'], ...near(d)]) };
  }
  const c = int(rng, 11, STRIP_TOP), d = int(rng, 2, 9), a = c - d;
  const wrong = [[c, 'wrote the total: the answer goes after ='], [a, 'said the number he sees'], [a + c, 'added what he sees'], ...near(d)] as const;
  if (level === 2) return { kind: 'part', form: 'addTo', a, c, ...onStrip(d, wrong) };
  if (rng() < 0.25) { // 5 = ? - 3
    const x = int(rng, 2, 12), y = int(rng, 2, 8), t = x + y;
    return { kind: 'part', form: 'flipTake', a: x, b: y, ...onStrip(t, [[x - y, 'did the sum he sees'], [x, 'said the left number'], ...near(t)]) };
  }
  return rng() < 0.5
    ? { kind: 'part', form: 'takeFrom', c, a, ...onStrip(d, wrong) }
    : { kind: 'part', form: 'firstAdd', b: a, c, ...onStrip(d, wrong) };
}

// ---------- Weigh-In ----------

/** One side of an equation. */
export type Side = { readonly n: number } | { readonly a: number; readonly op: '+' | '-'; readonly b: number };
export const valueOf = (s: Side) => ('n' in s ? s.n : s.op === '+' ? s.a + s.b : s.a - s.b);
export interface Balance { readonly left: Side; readonly right: Side }

export type ScaleProblem = Asked & (
  | { readonly kind: 'scale'; readonly form: 'same'; readonly eq: Balance }
  | { readonly kind: 'scale'; readonly form: 'cards'; readonly cards: readonly Balance[] }
  | { readonly kind: 'scale'; readonly form: 'balance'; readonly a: number; readonly b: number; readonly c: number; readonly blankFirst: boolean }
);
/** A side worth `n`, written one of three ways. */
function sideOf(n: number, rng: Rng): Side {
  const form = int(rng, 0, 2);
  if (form === 0 || n < 2) return { n };
  if (form === 1) { const a = int(rng, 1, n - 1); return { a, op: '+', b: n - a }; }
  const b = int(rng, 1, 5); return { a: n + b, op: '-', b };
}
function makeScale(level: Level, rng: Rng): ScaleProblem {
  if (level === 1) {
    const n = int(rng, 3, 10), yes = rng() < 0.5, off = yes ? 0 : pick(rng, [-2, -1, 1, 2]);
    const eq: Balance = rng() < 0.5 ? { left: { n }, right: sideOf(n + off, rng) } : { left: sideOf(n + off, rng), right: { n } };
    return { kind: 'scale', form: 'same', eq, answer: yes ? 'same' : 'not', traps: [], input: 'same' };
  }
  if (level === 2) {
    const c = int(rng, 4, 10), a = int(rng, 1, c - 1), b = c - a;
    const truth: Balance = pick(rng, [{ left: { n: c }, right: { a, op: '+', b } }, { left: { a, op: '+', b }, right: { a: b, op: '+', b: a } }] as Balance[]);
    const shape: Balance = { left: { a, op: '+', b }, right: { a: a + 1, op: '+', b: b + 1 } }; // looks right, but it isn't
    const off: Balance = { left: { n: c + pick(rng, [-1, 1]) }, right: { a, op: '+', b } };
    const cards = shuffle(rng, [truth, shape, off]);
    return { kind: 'scale', form: 'cards', cards, answer: String(cards.indexOf(truth)), traps: [], input: 'cards' };
  }
  for (;;) {
    const a = int(rng, 2, 10), b = int(rng, 2, 10), total = a + b, x = int(rng, 1, 10), c = total - x;
    if (total > STRIP_TOP || c < 1 || x === a || x === b) continue;
    return { kind: 'scale', form: 'balance', a, b, c, blankFirst: rng() < 0.5, ...onStrip(x, [[total, 'answer-comes-next: wrote the total'], [total + c, 'added everything'], [a, 'copied the number across from it']]) };
  }
}

// ---------- Bot Stories ----------

export type StoryOp = 'add' | 'sub';
interface Template { readonly id: string; readonly slot: 'a' | 'b' | 'c' | 'sum'; readonly lines: readonly string[] }
const T = (id: string, slot: Template['slot'], ...lines: string[]): Template => ({ id, slot, lines });

/** Each sentence is one clip or chain; {a}, {b}, {c}, {d} are numbers. a + b = c. */
export const STORIES = {
  addResult: T('addResult', 'c', 'Torque has {a} bolts.', 'The crew gives it {b} more.', 'How many bolts now?'),
  takeResult: T('takeResult', 'a', 'The bin has {c} bolts.', 'Torque uses {b}.', 'How many are left?'),
  putTotal: T('putTotal', 'c', '{a} red wheels and {b} blue wheels are on the bench.', 'How many wheels in all?'),
  addChange: T('addChange', 'b', 'Torque has {a} bolts.', 'It gets some more.', 'Now it has {c}.', 'How many more did it get?'),
  takeChange: T('takeChange', 'b', 'The bin has {c} bolts.', 'Torque uses some.', 'Now {a} are left.', 'How many did it use?'),
  putPart: T('putPart', 'b', '{c} wheels are on the bench.', '{a} are red.', 'The rest are blue.', 'How many are blue?'),
  match: T('match', 'b', 'There are {c} bots and {a} batteries.', 'Each bot gets one.', "How many bots won't get a battery?"),
  diffMore: T('diffMore', 'b', 'Torque has {c} bolts.', 'Anvil has {a}.', 'How many more does Torque have?'),
  diffFewer: T('diffFewer', 'b', 'Torque has {c} bolts.', 'Anvil has {a}.', 'How many fewer does Anvil have?'),
  bigMore: T('bigMore', 'c', 'Anvil has {a} bolts.', 'Torque has {b} more than Anvil.', 'How many does Torque have?'),
  smallFewer: T('smallFewer', 'a', 'Torque has {c} bolts.', 'Anvil has {b} fewer.', 'How many does Anvil have?'),
  addStart: T('addStart', 'a', 'Torque had some bolts.', 'It got {b} more.', 'Now it has {c}.', 'How many did it have at first?'),
  takeStart: T('takeStart', 'c', 'The bin had some bolts.', 'Torque used {b}.', 'Now {a} are left.', 'How many were in it at first?'),
  bigFewer: T('bigFewer', 'c', 'Anvil has {a} bolts.', 'Anvil has {b} fewer than Torque.', 'How many does Torque have?'),
  smallMore: T('smallMore', 'a', 'Torque has {c} bolts.', 'Torque has {b} more than Anvil.', 'How many does Anvil have?'),
  three: T('three', 'sum', 'The crew finds {a} bolts, then {b}, then {d}.', 'How many in all?'),
} as const;
export type StoryId = keyof typeof STORIES;

function storyIds(level: Level, stretch: Stretch): StoryId[] {
  if (level === 1) return ['addResult', 'takeResult', 'putTotal'];
  if (level === 3) return ['addStart', 'takeStart', 'bigFewer', 'smallMore', 'three'];
  return [
    'addChange', 'takeChange', 'putPart', 'match',
    ...(stretch >= 1 ? ['diffMore', 'diffFewer'] as const : []),
    ...(stretch === 2 ? ['bigMore', 'smallFewer'] as const : []),
  ];
}
const storyCap = (level: Level, stretch: Stretch) => (level === 1 ? (stretch ? STRIP_TOP : 10) : level === 2 ? (stretch ? STRIP_TOP : 15) : STRIP_TOP);
const opOf = (id: StoryId): StoryOp => (STORIES[id].slot === 'c' || STORIES[id].slot === 'sum' ? 'add' : 'sub');

export interface StoryNumbers { readonly a: number; readonly b: number; readonly c: number; readonly d: number }
export interface StoryProblem extends Asked { readonly kind: 'story'; readonly id: StoryId; readonly lines: readonly string[]; readonly nums: StoryNumbers }
export const storyOp = opOf;
/** `want`: which operation solves it, so a Round can balance them and "add the two numbers" keeps failing. `only`: this story. */
function makeStory(level: Level, stretch: Stretch, rng: Rng, want?: StoryOp, only?: StoryId): StoryProblem {
  const all = storyIds(level, stretch), fit = want ? all.filter(id => opOf(id) === want) : all;
  // Level 2's stories are nearly all solved by subtracting: when a Round wants an addition, it borrows one from Level 1
  const borrowed = want ? storyIds(1, 0).filter(id => opOf(id) === want) : [];
  const id = only ?? pick(rng, fit.length ? fit : borrowed.length ? borrowed : all), cap = storyCap(level, stretch);
  // every number is at least 2, because the sentences are plural: never "1 red wheels" or "1 are left"
  const c = int(rng, 5, cap);
  let a = int(rng, 2, c - 2);
  if (a === c - a) a = a > 2 ? a - 1 : a + 1; // two different numbers, so he can't echo "the number in the story"
  const three = id === 'three';
  if (three) a = int(rng, 2, 9);
  const b = three ? int(rng, 2, 9) : c - a, d = int(rng, 2, Math.min(9, STRIP_TOP - a - b)); // three addends still fit the strip
  const values = { a, b, c, d }, slot = STORIES[id].slot;
  const answer = slot === 'sum' ? a + b + d : values[slot];
  const other = opOf(id) === 'add' ? Math.abs(a - b) : c + (slot === 'a' ? b : a);
  const lines = STORIES[id].lines.map(line => line.replace(/\{([abcd])\}/g, (_, k: keyof typeof values) => String(values[k])));
  return { kind: 'story', id, lines, nums: values, ...onStrip(answer, [[other, 'used the other operation'], [a, 'said a number in the story'], [b, 'said a number in the story'], ...(three ? [] : [[c, 'said a number in the story'] as const]), [answer - 1, 'one short'], [answer + 1, 'one over']]) };
}

// ---------- The Scoreboard ----------

/** A Bot Stories chart: one plain square per hit, three rows. Asked by the Round on its own, as it needs its own screen. */
export const BOARD_ROWS = ['drum', 'hammer', 'flipper'] as const;
export type BoardRow = (typeof BOARD_ROWS)[number];
export type BoardProblem = Asked & { readonly kind: 'board'; readonly rows: Readonly<Record<BoardRow, number>> } & (
  | { readonly form: 'total' }
  | { readonly form: 'each'; readonly row: BoardRow }
  | { readonly form: 'more'; readonly row: BoardRow; readonly other: BoardRow }
);
export function makeBoard(level: Level, rng: Rng): BoardProblem {
  const [x, y, z] = shuffle(rng, BOARD_ROWS) as [BoardRow, BoardRow, BoardRow];
  const big = int(rng, 3, 6), small = int(rng, 1, big - 1), third = int(rng, 1, 6);
  const rows = { [x]: big, [y]: small, [z]: third } as Record<BoardRow, number>, total = big + small + third;
  const near = (v: number) => [[v - 1, 'one short'], [v + 1, 'one over']] as const;
  if (level >= 3 && rng() < 0.6) return { kind: 'board', form: 'more', rows, row: x, other: y, ...onStrip(big - small, [[big, 'said the bigger row'], [small, 'said the smaller row'], [big + small, 'added the two rows'], ...near(big - small)]) };
  if (rng() < 0.5) return { kind: 'board', form: 'total', rows, ...onStrip(total, [[big, 'read one row'], [big + small, 'left a row out'], ...near(total)]) };
  return { kind: 'board', form: 'each', rows, row: x, ...onStrip(big, [[small, 'read another row'], [total, 'added them all'], ...near(big)]) };
}

// ---------- Tens and Ones ----------

export type TensProblem = Asked & (
  | { readonly kind: 'tens'; readonly form: 'read'; readonly rods: number; readonly cubes: number }
  | { readonly kind: 'tens'; readonly form: 'make'; readonly n: number }
  | { readonly kind: 'tens'; readonly form: 'howManyTens'; readonly n: number }
  | { readonly kind: 'tens'; readonly form: 'compare'; readonly a: number; readonly b: number }
);
const swapped = (n: number) => (n % 10) * 10 + Math.floor(n / 10);
const placeTraps = (n: number) => {
  const tens = Math.floor(n / 10), ones = n % 10;
  return [[swapped(n), 'swapped the digits'], [tens * 100 + ones, 'wrote it as heard'], [tens + ones, 'added the digits'], [n - 1, 'one short'], [n + 1, 'one over']] as const;
};
function makeTens(level: Level, stretch: Stretch, rng: Rng): TensProblem {
  if (level === 1) {
    const n = int(rng, 11, 19), cubes = n - 10;
    const asked = onChoices(rng, n, [...placeTraps(n), [cubes * 10, 'sound-alike: fourteen and forty']], 120);
    return rng() < 0.5 ? { kind: 'tens', form: 'read', rods: 1, cubes, ...asked } : { kind: 'tens', form: 'make', n, ...asked };
  }
  if (level === 2) {
    const tens = int(rng, 2, 9), ones = int(rng, 0, 9), n = tens * 10 + ones;
    const wheels = (x: number, t: ReadonlyArray<readonly [number, string]>): Asked => ({ answer: String(x), traps: trapsOf(x, t).filter(v => Number(v.value) < 100), input: 'wheels' });
    if (stretch === 2 && rng() < 0.4 && tens < 9) { // regrouped: 4 rods and 12 cubes
      const rods = tens, cubes = 10 + ones;
      return { kind: 'tens', form: 'read', rods, cubes, ...wheels(rods * 10 + cubes, [[rods * 10 + (cubes % 10), 'left the extra ten out'], ...placeTraps(rods * 10 + cubes)]) };
    }
    if (rng() < 0.25) { const m = tens * 10; return { kind: 'tens', form: 'howManyTens', n: m, ...wheels(tens, [[m, 'said the number'], [0, 'read the ones digit']]) }; }
    return { kind: 'tens', form: 'make', n, ...wheels(n, placeTraps(n)) };
  }
  const roll = rng();
  let a: number, b: number;
  if (roll < 1 / 6) a = b = int(rng, 11, 99);
  else if (roll < 2 / 3) { // the bigger ones digit belongs to the smaller number
    const low = int(rng, 1, 8), high = int(rng, low + 1, 9), oa = int(rng, 1, 9), ob = int(rng, 0, oa - 1);
    [a, b] = [low * 10 + oa, high * 10 + ob];
  } else { a = int(rng, 11, 99); do b = int(rng, 11, 99); while (b === a); }
  if (rng() < 0.5) [a, b] = [b, a];
  const sign = a < b ? '<' : a > b ? '>' : '=';
  const byOnes = a % 10 < b % 10 ? '<' : a % 10 > b % 10 ? '>' : '=';
  return { kind: 'tens', form: 'compare', a, b, answer: sign, input: 'sign', traps: byOnes !== sign ? [{ value: byOnes, why: 'compared the ones digit' }] : [] };
}

// ---------- Skip Count ----------

export const SKIP_TOP = 120;
const SKIP_REACH = 200; // choices may go past the top, so "after 100, 200" can be offered
const SKIP_STEP: Record<Level, 10 | 5 | 2> = { 1: 10, 2: 5, 3: 2 };
const SKIP_CAP: Record<Level, readonly [number, number, number]> = { 1: [50, SKIP_TOP, SKIP_TOP], 2: [50, SKIP_TOP, SKIP_TOP], 3: [20, 40, SKIP_TOP] };

export type SkipProblem = Asked & { readonly step: 10 | 5 | 2 } & (
  | { readonly kind: 'skip'; readonly form: 'next'; readonly shown: readonly number[] }
  | { readonly kind: 'skip'; readonly form: 'middle'; readonly shown: readonly (number | null)[] }
  | { readonly kind: 'skip'; readonly form: 'groups'; readonly groups: number }
);
function makeSkip(level: Level, stretch: Stretch, rng: Rng): SkipProblem {
  const step = SKIP_STEP[level], cap = SKIP_CAP[level][stretch], others = ([10, 5, 2] as const).filter(s => s !== step);
  const wrong = (target: number, before: number): ReadonlyArray<readonly [number, string]> => [
    [before + 1, 'counted by ones'], [before, 'stopped where he was'],
    ...others.map(s => [before + s, `jumped by ${s}`] as const),
    ...(before === 100 ? [[200, 'after a hundred, went to the next hundred'] as const] : []),
    [target + step, 'jumped twice'],
  ];
  if (stretch > 0 && rng() < 0.3) {
    const groups = int(rng, 2, Math.min(Math.floor(cap / step), 12)), answer = groups * step;
    return { kind: 'skip', step, form: 'groups', groups, ...onChoices(rng, answer, wrong(answer, answer - step), SKIP_REACH) };
  }
  const offset = stretch === 2 && step === 10 ? int(rng, 1, 9) : 0; // 3, 13, 23
  // Three stops are shown before the blank, so the first shown is one step in: 10, 20, 30, what comes next?
  const target = offset + step * int(rng, 4, Math.floor((cap - offset) / step));
  if (stretch > 0 && rng() < 0.5) {
    const shown = [target - step * 2, target - step, null, target + step];
    if (target + step <= cap) return { kind: 'skip', step, form: 'middle', shown, ...onChoices(rng, target, wrong(target, target - step), SKIP_REACH) };
  }
  return { kind: 'skip', step, form: 'next', shown: [target - step * 3, target - step * 2, target - step], ...onChoices(rng, target, wrong(target, target - step), SKIP_REACH) };
}

// ---------- Any kind ----------

export type Question = TenProblem | OnProblem | StoryProblem | FactsProblem | TensProblem | SkipProblem | PartProblem | ScaleProblem | OverProblem;

export interface Ask {
  readonly stretch?: Stretch;
  /** The last answer of this kind, so the next one asks something else. */
  readonly avoid?: string;
  /** Facts: the pairs to draw from (the learning layer narrows this by Strength). */
  readonly pool?: readonly Pair[];
  /** Bot Stories: which operation should solve it. */
  readonly want?: StoryOp;
  /** Bot Stories: exactly this story (placement). */
  readonly only?: StoryId;
}

function once(kind: Kind, level: Level, rng: Rng, { stretch = 0, pool, want, only }: Ask): Question {
  switch (kind) {
    case 'ten': return makeTen(level, stretch, rng);
    case 'on': return makeOn(level, stretch, rng);
    case 'story': return makeStory(level, stretch, rng, want, only);
    case 'facts': return makeFacts(level, rng, pool ?? factsFor(level));
    case 'tens': return makeTens(level, stretch, rng);
    case 'skip': return makeSkip(level, stretch, rng);
    case 'part': return makePart(level, rng);
    case 'scale': return makeScale(level, rng);
    case 'over': return makeOver(level, rng);
  }
}

export function makeQuestion(kind: Kind, level: Level, rng: Rng, ask: Ask = {}): Question {
  let q = once(kind, level, rng, ask);
  for (let tries = 0; tries < 8 && ask.avoid !== undefined && q.answer === ask.avoid; tries++) q = once(kind, level, rng, ask);
  return q;
}
