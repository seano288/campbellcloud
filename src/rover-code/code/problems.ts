// The four kinds of question and how each one is made at each Level, with Stretch growing it inside a Level (longer paths, more
// rocks, longer patterns). Every question carries what its lesson needs: the grid and the best way across it, or the pattern's unit.
//
//  Drive It  build a program from arrows that takes the rover to the flag. L1 straight, L2 one turn, L3 two or more, round rocks.
//  Patterns  what comes next. L1 AB, L2 AAB / ABB / ABC (then the gap in the middle), L3 arrows turning and units of four.
//  Bug Hunt  one step of a program is wrong. L1 watch it run and tap the wrong step, L2 then pick the right arrow, L3 find it
//            without watching first.
//  Loops     a step done again and again. L1 how many times, L2 two loops round a corner, L3 which program gets there.
import { int, pick, shuffle, type Rng } from '../../game/rng';
import type { Stretch } from '../../modes/progress';
import { bestPath, DIRS, encodeBlocks, encodeProgram, expand, makeGrid, MOVE, reaches, runProgram, runsOf, type Block, type Dir, type Grid, type GridSpec } from './grid';

export type Kind = 'drive' | 'pattern' | 'bug' | 'loop';
export type Level = 1 | 2 | 3;

export interface DriveProblem { readonly kind: 'drive'; readonly grid: Grid; readonly path: readonly Dir[]; readonly slots: number; readonly answer: string }

export interface BugProblem {
  readonly kind: 'bug';
  readonly grid: Grid;
  readonly path: readonly Dir[];
  /** The program as shown, with one step wrong. */
  readonly program: readonly Dir[];
  readonly bug: number;
  /** It runs once by itself after it's asked (Levels 1 and 2), so he can watch where it goes wrong. */
  readonly preview: boolean;
  /** He picks the right arrow after finding the step (Levels 2 and 3); at Level 1 finding it is enough. */
  readonly choose: boolean;
  readonly answer: string;
}

export const OBJECTS = ['star', 'moon', 'planet', 'rocket', 'alien', 'sun'] as const;
export type SpaceThing = (typeof OBJECTS)[number];
export type Token = SpaceThing | Dir;
export interface PatternProblem {
  readonly kind: 'pattern';
  readonly form: 'next' | 'missing';
  /** The row, with null for the gap. */
  readonly items: readonly (Token | null)[];
  /** How many items repeat. */
  readonly unit: number;
  readonly choices: readonly Token[];
  readonly answer: Token;
}

export interface LoopProblem {
  readonly kind: 'loop';
  /** count: the arrow is there, how many times? build: fill in the loops. pick: which program gets to the flag? */
  readonly form: 'count' | 'build' | 'pick';
  readonly grid: Grid;
  readonly path: readonly Dir[];
  /** The right program. */
  readonly blocks: readonly Block[];
  /** For count and build: which arrows and counts are already filled in (null: he fills it). */
  readonly given: readonly { readonly dir: Dir | null; readonly times: number | null }[];
  /** For pick: the programs to choose from. */
  readonly options: readonly (readonly Block[])[];
  readonly answer: string;
}

export type Question = DriveProblem | BugProblem | PatternProblem | LoopProblem;

/** The most steps a program holds: two rows of five on an iPhone. */
export const MAX_SLOTS = 10;
/** The loop counts he can pick from. */
export const COUNTS = [2, 3, 4, 5, 6] as const;

// ---------- Drive It ----------

const DRIVE: Record<Level, readonly GridSpec[]> = {
  1: [
    { w: 5, h: 4, length: [2, 2], turns: [0, 0], rocks: [0, 0] },
    { w: 5, h: 4, length: [3, 3], turns: [0, 0], rocks: [1, 1] },
    { w: 5, h: 4, length: [3, 4], turns: [0, 0], rocks: [1, 2] },
  ],
  2: [
    { w: 5, h: 4, length: [3, 4], turns: [1, 1], rocks: [1, 2] },
    { w: 5, h: 4, length: [4, 5], turns: [1, 1], rocks: [2, 3] },
    { w: 5, h: 4, length: [5, 6], turns: [1, 1], rocks: [3, 4] },
  ],
  3: [
    { w: 5, h: 5, length: [5, 6], turns: [2, 3], rocks: [3, 5] },
    { w: 5, h: 5, length: [5, 7], turns: [2, 3], rocks: [4, 6], detour: true },
    { w: 5, h: 5, length: [6, 8], turns: [2, 4], rocks: [5, 7], detour: true },
  ],
};

export function makeDrive(level: Level, stretch: Stretch, rng: Rng): DriveProblem {
  const { grid, path } = makeGrid(DRIVE[level][stretch]!, rng);
  return { kind: 'drive', grid, path, slots: Math.min(MAX_SLOTS, path.length + (level === 1 ? 2 : 3)), answer: encodeProgram(path) };
}

// ---------- Bug Hunt ----------

const BUG: Record<Level, GridSpec> = {
  1: { w: 5, h: 4, length: [3, 4], turns: [0, 1], rocks: [0, 2] },
  2: { w: 5, h: 4, length: [4, 5], turns: [1, 1], rocks: [1, 3] },
  3: { w: 5, h: 5, length: [5, 6], turns: [2, 3], rocks: [3, 5] },
};

/** Can this one step be changed so the program works? A program can have more than one fix, and any step that has one is a bug he may tap. */
export const fixesAt = (grid: Grid, program: readonly Dir[], i: number): Dir[] =>
  DIRS.filter(d => d !== program[i] && reaches(grid, program.map((s, j) => (j === i ? d : s))));

export function makeBug(level: Level, stretch: Stretch, rng: Rng): BugProblem {
  for (let tries = 0; tries < 200; tries++) {
    const spec = BUG[level], { grid, path } = makeGrid(level === 1 && stretch === 0 ? { ...spec, turns: [0, 0] } : spec, rng);
    // Level 1 keeps the bug off the first step at first: a rover that goes wrong straight away is hard to watch.
    const bug = int(rng, level === 1 && stretch === 0 ? 1 : 0, path.length - 1);
    const wrong = shuffle(rng, DIRS.filter(d => d !== path[bug]));
    for (const d of wrong) {
      const program = path.map((s, j) => (j === bug ? d : s));
      // the step he finds must be the only one that can be fixed, so "the bug" means one thing
      const fixable = program.map((_, i) => fixesAt(grid, program, i).length > 0);
      if (fixable.filter(Boolean).length !== 1 || !fixable[bug]) continue;
      return { kind: 'bug', grid, path, program, bug, preview: level < 3, choose: level > 1, answer: `fix:${bug}:${path[bug]}` };
    }
  }
  throw new Error('No bug found');
}

// ---------- Patterns ----------

type Unit = string; // letters: "AB", "AAB", "ABCD"
const UNITS: Record<Level, readonly (readonly Unit[])[]> = {
  1: [['AB'], ['AB'], ['AB']],
  2: [['AAB', 'ABB'], ['ABC'], ['AAB', 'ABB', 'ABC']],
  3: [['turn'], ['AABB', 'ABCD', 'ABBC'], ['AABB', 'ABCD', 'turn']],
};
/** How many items show before the gap, for each Level and Stretch. */
const SHOWN: Record<Level, readonly number[]> = { 1: [4, 5, 6], 2: [6, 5, 9], 3: [5, 6, 10] };
const CLOCKWISE: readonly Dir[] = ['U', 'R', 'D', 'L'];

export function makePattern(level: Level, stretch: Stretch, rng: Rng): PatternProblem {
  const form = stretch === 2 && level > 1 ? 'missing' : 'next';
  const unitName = pick(rng, UNITS[level][stretch]!);
  let unit: Token[];
  let family: readonly Token[];
  if (unitName === 'turn') { // the arrow turns round like a clock hand: up, right, down, left
    const from = int(rng, 0, 3);
    unit = [0, 1, 2, 3].map(i => CLOCKWISE[(from + i) % 4]!);
    family = DIRS;
  } else {
    const things = shuffle(rng, OBJECTS), letters = [...new Set(unitName)];
    const of = Object.fromEntries(letters.map((l, i) => [l, things[i]!]));
    unit = [...unitName].map(l => of[l]!);
    family = OBJECTS;
  }
  const shown = SHOWN[level][stretch]!, length = form === 'next' ? shown + 1 : shown;
  const row = Array.from({ length }, (_, i) => unit[i % unit.length]!);
  // the gap in the middle comes after one whole unit, so what fills it is always known
  const gap = form === 'next' ? length - 1 : int(rng, unit.length, length - 2);
  const answer = row[gap]!;
  const inRow = [...new Set(unit)].filter(t => t !== answer), others = shuffle(rng, family.filter(t => t !== answer && !inRow.includes(t)));
  const foils = [...shuffle(rng, inRow), ...others].slice(0, 2);
  return { kind: 'pattern', form, items: row.map((t, i) => (i === gap ? null : t)), unit: unit.length, choices: shuffle(rng, [answer, ...foils]), answer };
}

// ---------- Loops ----------

const opposite: Record<Dir, Dir> = { U: 'D', D: 'U', L: 'R', R: 'L' };

/** A straight run of n squares in a direction that fits, on a clear-enough grid. */
function straight(n: number, rng: Rng): { grid: Grid; path: Dir[] } {
  const spec: GridSpec = { w: 6, h: 4, length: [n, n], turns: [0, 0], rocks: [0, 2] };
  return makeGrid(spec, rng);
}

/** Round one corner: two runs of at least two. */
function corner(rng: Rng, longest = 4): { grid: Grid; path: Dir[]; runs: Block[] } {
  for (let tries = 0; tries < 400; tries++) {
    const made = makeGrid({ w: 6, h: 5, length: [4, longest * 2], turns: [1, 1], rocks: [0, 3] }, rng), runs = runsOf(made.path);
    if (runs.length === 2 && runs.every(r => r.times >= 2 && r.times <= longest)) return { ...made, runs };
  }
  throw new Error('No corner found');
}

/** A staircase: the same two steps, again and again. A rock on the other order's first step means only one order works. */
function stairs(times: number, rng: Rng): { grid: Grid; path: Dir[]; pair: [Dir, Dir] } {
  const across = pick(rng, ['R', 'L'] as const), upDown = pick(rng, ['U', 'D'] as const), pair: [Dir, Dir] = rng() < .5 ? [across, upDown] : [upDown, across];
  const w = 5, h = 5, dx = MOVE[across][0] * times, dy = MOVE[upDown][1] * times;
  const x0 = dx > 0 ? int(rng, 0, w - 1 - dx) : int(rng, -dx, w - 1), y0 = dy > 0 ? int(rng, 0, h - 1 - dy) : int(rng, -dy, h - 1);
  const start = { x: x0, y: y0 }, goal = { x: x0 + dx, y: y0 + dy };
  const wrongFirst = { x: x0 + MOVE[pair[1]][0], y: y0 + MOVE[pair[1]][1] };
  const grid: Grid = { w, h, start, goal, rocks: [wrongFirst] };
  return { grid, path: expand([{ steps: pair, times }]), pair };
}

const sameBlocks = (a: readonly Block[], b: readonly Block[]) => encodeBlocks(a) === encodeBlocks(b);

export function makeLoop(level: Level, stretch: Stretch, rng: Rng): LoopProblem {
  if (level === 1) {
    const [lo, hi] = ([[2, 3], [3, 4], [4, 5]] as const)[stretch], n = int(rng, lo, hi), { grid, path } = straight(n, rng), d = path[0]!;
    const blocks = [{ steps: [d], times: n }];
    return { kind: 'loop', form: 'count', grid, path, blocks, given: [{ dir: d, times: null }], options: [], answer: encodeBlocks(blocks) };
  }
  if (level === 2) {
    const { grid, path, runs } = corner(rng);
    const given = runs.map((r, i) => ({ dir: stretch === 2 ? null : r.steps[0]!, times: stretch === 0 && i === 0 ? r.times : null }));
    return { kind: 'loop', form: 'build', grid, path, blocks: runs, given, options: [], answer: encodeBlocks(runs) };
  }
  // Level 3: which program gets there? Two loops round a corner first, then a staircase loop.
  let grid: Grid, path: Dir[], blocks: Block[], candidates: Block[][];
  if (stretch === 0) {
    const c = corner(rng);
    ({ grid, path } = c);
    blocks = c.runs;
    const [a, b] = c.runs as [Block, Block];
    candidates = [
      [a, { ...b, times: b.times + 1 }], [{ ...a, times: a.times - 1 }, b], [b, a],
      [a, { steps: [opposite[b.steps[0]!]], times: b.times }], [{ ...a, times: a.times + 1 }, b],
    ];
  } else {
    const times = stretch === 1 ? 2 : 3, s = stairs(times, rng);
    ({ grid, path } = s);
    blocks = [{ steps: s.pair, times }];
    candidates = [[{ steps: [s.pair[1], s.pair[0]], times }], [{ steps: s.pair, times: times - 1 }], [{ steps: s.pair, times: times + 1 }], [{ steps: [s.pair[0], s.pair[0]], times }]];
  }
  const wrong = shuffle(rng, candidates).filter((c, i, all) => c.every(b => b.times >= 1) && !reaches(grid, expand(c)) && !sameBlocks(c, blocks) && all.findIndex(o => sameBlocks(o, c)) === i).slice(0, 2);
  return { kind: 'loop', form: 'pick', grid, path, blocks, given: [], options: shuffle(rng, [blocks, ...wrong]), answer: encodeBlocks(blocks) };
}

export function makeQuestion(kind: Kind, level: Level, stretch: Stretch, rng: Rng): Question {
  if (kind === 'drive') return makeDrive(level, stretch, rng);
  if (kind === 'bug') return makeBug(level, stretch, rng);
  if (kind === 'pattern') return makePattern(level, stretch, rng);
  return makeLoop(level, stretch, rng);
}

/** The best way across, said as a program: the first lesson for any grid question. */
export const pathOf = (q: Exclude<Question, PatternProblem>) => q.path;
/** Where a loop program (or any program) gets to. */
export const runOfBlocks = (grid: Grid, blocks: readonly Block[]) => runProgram(grid, expand(blocks));
export { bestPath };
