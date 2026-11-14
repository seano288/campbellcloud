// The rover's grid and the programs that drive it. A program is a list of steps, each one square up, right, down or left as the
// screen shows it (never "turn left": a first grader reads arrows on a screen, not the rover's own left). A loop is a few steps and
// how many times to do them. Running a program says where the rover went and, when it didn't end on the flag, which step went wrong.
import type { Rng } from '../../game/rng';
import { int, shuffle } from '../../game/rng';

export type Dir = 'U' | 'R' | 'D' | 'L';
export const DIRS: readonly Dir[] = ['U', 'R', 'D', 'L'];
export const MOVE: Record<Dir, readonly [number, number]> = { U: [0, -1], R: [1, 0], D: [0, 1], L: [-1, 0] };
export const ARROW: Record<Dir, string> = { U: '⬆', R: '➡', D: '⬇', L: '⬅' };

export interface Cell { readonly x: number; readonly y: number }
export interface Grid {
  readonly w: number;
  readonly h: number;
  readonly start: Cell;
  readonly goal: Cell;
  readonly rocks: readonly Cell[];
}

export const same = (a: Cell, b: Cell) => a.x === b.x && a.y === b.y;
export const inside = (g: Pick<Grid, 'w' | 'h'>, c: Cell) => c.x >= 0 && c.y >= 0 && c.x < g.w && c.y < g.h;
export const rockAt = (g: Pick<Grid, 'rocks'>, c: Cell) => g.rocks.some(r => same(r, c));
export const step = (c: Cell, d: Dir): Cell => ({ x: c.x + MOVE[d][0], y: c.y + MOVE[d][1] });

/**
 * How a run ended. `bump`: a rock was in the way of step `step` (counted from 0), so the rover stayed put. `off`: that step would
 * have left the map. `past`: it reached the flag, then step `step` drove it away. `short`: it stopped before getting there.
 */
export type RunEnd =
  | { readonly kind: 'goal' }
  | { readonly kind: 'bump' | 'off'; readonly step: number; readonly at: Cell }
  | { readonly kind: 'past'; readonly step: number }
  | { readonly kind: 'short' };
/** `cells[i]` is where the rover is after i steps; it stops growing at a bump or the edge. */
export interface Run { readonly cells: readonly Cell[]; readonly end: RunEnd }

export function runProgram(g: Grid, program: readonly Dir[]): Run {
  const cells: Cell[] = [g.start];
  let at = g.start, reachedAt = -1;
  for (let i = 0; i < program.length; i++) {
    const next = step(at, program[i]!);
    if (!inside(g, next)) return { cells, end: { kind: 'off', step: i, at: next } };
    if (rockAt(g, next)) return { cells, end: { kind: 'bump', step: i, at: next } };
    at = next;
    cells.push(at);
    if (same(at, g.goal) && reachedAt < 0) reachedAt = i;
  }
  if (same(at, g.goal)) return { cells, end: { kind: 'goal' } };
  if (reachedAt >= 0) return { cells, end: { kind: 'past', step: reachedAt + 1 } };
  return { cells, end: { kind: 'short' } };
}
export const reaches = (g: Grid, program: readonly Dir[]) => runProgram(g, program).end.kind === 'goal';

/** How many times the program changes direction. */
export const turnsOf = (program: readonly Dir[]) => program.reduce((n, d, i) => (i > 0 && d !== program[i - 1] ? n + 1 : n), 0);

/** The shortest way to the flag with the fewest turns, which is the one a child would draw. Null when the flag can't be reached. */
export function bestPath(g: Grid): Dir[] | null {
  type Node = { c: Cell; last: Dir | null; steps: number; turns: number; path: Dir[] };
  const key = (c: Cell, d: Dir | null) => `${c.x},${c.y},${d ?? '-'}`;
  const seen = new Map<string, number>();
  let frontier: Node[] = [{ c: g.start, last: null, steps: 0, turns: 0, path: [] }];
  while (frontier.length) {
    frontier.sort((a, b) => a.steps - b.steps || a.turns - b.turns);
    const n = frontier.shift()!;
    if (same(n.c, g.goal)) return n.path;
    for (const d of DIRS) {
      const c = step(n.c, d);
      if (!inside(g, c) || rockAt(g, c)) continue;
      const turns = n.turns + (n.last && n.last !== d ? 1 : 0), cost = (n.steps + 1) * 100 + turns, k = key(c, d);
      if ((seen.get(k) ?? Infinity) <= cost) continue;
      seen.set(k, cost);
      frontier.push({ c, last: d, steps: n.steps + 1, turns, path: [...n.path, d] });
    }
  }
  return null;
}

// ---------- loops ----------

/** Some steps, done `times` times: "➡ ×3", or a pair "➡⬆ ×2" for a staircase. */
export interface Block { readonly steps: readonly Dir[]; readonly times: number }
export const expand = (blocks: readonly Block[]): Dir[] => blocks.flatMap(b => Array.from({ length: b.times }, () => b.steps).flat());
/** "R3,U2" or "RU3": the answer a loop question submits. */
export const encodeBlocks = (blocks: readonly Block[]) => blocks.map(b => `${b.steps.join('')}${b.times}`).join(',');
export function decodeBlocks(text: string): Block[] | null {
  const blocks: Block[] = [];
  for (const part of text.split(',')) {
    const m = /^([URDL]+)(\d{1,2})$/.exec(part);
    if (!m) return null;
    blocks.push({ steps: [...m[1]!] as Dir[], times: Number(m[2]) });
  }
  return blocks.length ? blocks : null;
}
export const encodeProgram = (program: readonly Dir[]) => program.join('');
export const decodeProgram = (text: string): Dir[] | null => (/^[URDL]*$/.test(text) ? ([...text] as Dir[]) : null);

/** The straight runs a program is made of: "RRRUU" is ➡×3 then ⬆×2. */
export function runsOf(program: readonly Dir[]): Block[] {
  const out: { steps: Dir[]; times: number }[] = [];
  for (const d of program) {
    const last = out.at(-1);
    if (last && last.steps[0] === d) last.times++;
    else out.push({ steps: [d], times: 1 });
  }
  return out;
}

// ---------- building grids ----------

export interface GridSpec {
  readonly w: number;
  readonly h: number;
  /** How long the best way to the flag is, at least and at most. */
  readonly length: readonly [number, number];
  /** How many turns the best way needs, at least and at most. */
  readonly turns: readonly [number, number];
  /** How many rocks, at least and at most. */
  readonly rocks: readonly [number, number];
  /** Rocks must make the way longer than a straight dash across: the rover has to go round. */
  readonly detour?: boolean;
}

/** A grid that matches the spec. It tries random ones until one fits, which on grids this small is quick. */
export function makeGrid(spec: GridSpec, rng: Rng): { grid: Grid; path: Dir[] } {
  const cells: Cell[] = [];
  for (let y = 0; y < spec.h; y++) for (let x = 0; x < spec.w; x++) cells.push({ x, y });
  for (let tries = 0; tries < 4000; tries++) {
    const [start, goal, ...rest] = shuffle(rng, cells);
    const rocks = rest.slice(0, int(rng, spec.rocks[0], spec.rocks[1]));
    const grid: Grid = { w: spec.w, h: spec.h, start: start!, goal: goal!, rocks };
    const path = bestPath(grid);
    if (!path) continue;
    const turns = turnsOf(path), manhattan = Math.abs(goal!.x - start!.x) + Math.abs(goal!.y - start!.y);
    if (path.length < spec.length[0] || path.length > spec.length[1] || turns < spec.turns[0] || turns > spec.turns[1]) continue;
    if (spec.detour && path.length <= manhattan) continue;
    return { grid, path };
  }
  throw new Error(`No grid fits ${JSON.stringify(spec)}`);
}

/** Every cell a program passes through on its way, start included, until it stops. */
export const trail = (g: Grid, program: readonly Dir[]) => runProgram(g, program).cells;
