// Purrdoku puzzles: an n×n board split into n coloured patches. Every row, every column and every patch gets exactly
// one sleeping cat, and no two cats may touch, not even at a corner. Each generated board has exactly one answer.

export interface Puzzle {
  readonly size: number;
  /** regions[row * size + col] is the patch that cell belongs to, 0..size-1 */
  readonly regions: readonly number[];
  /** cats[row] is the column of that row's cat */
  readonly cats: readonly number[];
}

/** mulberry32: small, fast and the same everywhere, so a seed always makes the same board. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Random = () => number;
const pick = <T>(items: readonly T[], random: Random) => items[Math.floor(random() * items.length)]!;

function shuffle<T>(items: T[], random: Random) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [items[i], items[j]] = [items[j]!, items[i]!];
  }
  return items;
}

/** A column per row where no two cats share a column or touch. */
function placeCats(size: number, random: Random): number[] {
  const cats: number[] = [];
  const used = new Set<number>();
  const go = (row: number): boolean => {
    if (row === size) return true;
    for (const col of shuffle([...Array(size).keys()], random)) {
      if (used.has(col) || (row > 0 && Math.abs(cats[row - 1]! - col) < 2)) continue;
      cats[row] = col; used.add(col);
      if (go(row + 1)) return true;
      used.delete(col);
    }
    return false;
  };
  go(0);
  return cats;
}

const neighbours = (size: number, cell: number) => {
  const r = Math.floor(cell / size), c = cell % size, out: number[] = [];
  if (r > 0) out.push(cell - size);
  if (r < size - 1) out.push(cell + size);
  if (c > 0) out.push(cell - 1);
  if (c < size - 1) out.push(cell + 1);
  return out;
};

/** Grows one patch from each cat, a random frontier cell at a time, until the board is covered. */
function growRegions(size: number, cats: readonly number[], random: Random): number[] {
  const regions = new Array<number>(size * size).fill(-1);
  cats.forEach((col, row) => { regions[row * size + col] = row; });
  let left = size * size - size;
  while (left > 0) {
    const frontier: [number, number][] = [];
    regions.forEach((region, cell) => {
      if (region < 0) return;
      for (const next of neighbours(size, cell)) if (regions[next] === -1) frontier.push([next, region]);
    });
    const [cell, region] = pick(frontier, random);
    regions[cell] = region;
    left--;
  }
  return regions;
}

/** Counts answers, stopping at `limit`. */
export function countSolutions(size: number, regions: readonly number[], limit = 2): number {
  let found = 0;
  const cols = new Array<boolean>(size).fill(false), used = new Array<boolean>(size).fill(false);
  let prev = -10;
  const go = (row: number) => {
    if (row === size) { found++; return; }
    for (let col = 0; col < size && found < limit; col++) {
      const region = regions[row * size + col]!;
      if (cols[col] || used[region] || Math.abs(prev - col) < 2) continue;
      cols[col] = used[region] = true;
      const before = prev; prev = col;
      go(row + 1);
      prev = before;
      cols[col] = used[region] = false;
    }
  };
  go(0);
  return found;
}

/** Finds one answer different from `cats`, or null when `cats` is the only one. */
function otherSolution(size: number, regions: readonly number[], cats: readonly number[]): number[] | null {
  const cols = new Array<boolean>(size).fill(false), used = new Array<boolean>(size).fill(false), now: number[] = [];
  const go = (row: number): boolean => {
    if (row === size) return now.some((col, r) => col !== cats[r]);
    for (let col = 0; col < size; col++) {
      const region = regions[row * size + col]!;
      if (cols[col] || used[region] || (row > 0 && Math.abs(now[row - 1]! - col) < 2)) continue;
      cols[col] = used[region] = true; now[row] = col;
      if (go(row + 1)) return true;
      cols[col] = used[region] = false;
    }
    return false;
  };
  return go(0) ? now : null;
}

const connected = (size: number, regions: readonly number[], region: number) => {
  const cells = regions.flatMap((r, i) => (r === region ? [i] : []));
  if (cells.length === 0) return false;
  const seen = new Set([cells[0]!]), todo = [cells[0]!];
  while (todo.length) for (const next of neighbours(size, todo.pop()!)) if (regions[next] === region && !seen.has(next)) { seen.add(next); todo.push(next); }
  return seen.size === cells.length;
};

/**
 * Makes a board with exactly one answer. Random patches usually allow several answers; while they do, a cat from a
 * rival answer that sits off our own cats is handed to a neighbouring patch, which rules that answer out.
 */
export function generate(size: number, seed: number): Puzzle {
  const random = rng(seed);
  for (;;) {
    const cats = placeCats(size, random);
    const regions = growRegions(size, cats, random);
    const catCells = new Set(cats.map((col, row) => row * size + col));
    for (let tries = 0; tries < size * size * 4; tries++) {
      const other = otherSolution(size, regions, cats);
      if (!other) return { size, regions, cats };
      const moves: [number, number][] = [];
      other.forEach((col, row) => {
        const cell = row * size + col;
        if (catCells.has(cell)) return;
        for (const next of neighbours(size, cell)) if (regions[next] !== regions[cell]) moves.push([cell, regions[next]!]);
      });
      shuffle(moves, random);
      const move = moves.find(([cell, to]) => {
        const from = regions[cell]!;
        regions[cell] = to;
        if (connected(size, regions, from)) return true;
        regions[cell] = from;
        return false;
      });
      if (!move) break;
    }
  }
}

/**
 * The same board turned or flipped, one of 8 ways (0 leaves it as it is). It keeps its one answer and its difficulty.
 */
export function turn(board: Puzzle, way: number): Puzzle {
  const n = board.size, regions = new Array<number>(n * n), cats = new Array<number>(n);
  const move = (r: number, c: number): [number, number] => {
    if (way & 4) [r, c] = [c, r];
    return [way & 2 ? n - 1 - r : r, way & 1 ? n - 1 - c : c];
  };
  board.regions.forEach((region, i) => {
    const [r, c] = move(Math.floor(i / n), i % n);
    regions[r * n + c] = region;
  });
  board.cats.forEach((col, row) => {
    const [r, c] = move(row, col);
    cats[r] = c;
  });
  return { size: n, regions, cats };
}

/** One step of reasoning: either a cat has to go in a cell, or none of some cells can have a cat. */
export interface Step {
  kind: 'cat' | 'cross';
  /** where the cat goes (one cell), or the cells that are ruled out */
  cells: number[];
  /** the cells that show why */
  because: number[];
  why: string;
  /** how hard the step is, as rate() counts it */
  tier: number;
}

const KINDS = ['row', 'column', 'patch'] as const;
const plural = (kind: string) => (kind === 'patch' ? 'patches' : `${kind}s`);

/**
 * The easiest next step on a board part-way through. `open[i]` says whether cell i could still have a cat; `done[u]`
 * whether unit u (rows 0..n-1, then columns, then patches) already has its cat. Null when only trial and error is left.
 * The steps, easiest first:
 * 1 · a row, column or patch has only one place left for its cat;
 * 2 · a patch fits in one row or column (or a row in one patch), or a cell would leave some row, column or patch with
 *     nowhere to go;
 * 3 · several patches fit in the same number of rows or columns (or the other way round).
 */
export function nextStep(board: Puzzle, open: readonly boolean[], done: readonly boolean[]): Step | null {
  const n = board.size, cells = n * n;
  const rowOf = (i: number) => Math.floor(i / n), colOf = (i: number) => i % n;
  const units: number[][] = [];
  for (let k = 0; k < n; k++) units.push([...Array(n).keys()].map(c => k * n + c)); // rows
  for (let k = 0; k < n; k++) units.push([...Array(n).keys()].map(r => r * n + k)); // columns
  for (let k = 0; k < n; k++) units.push([...Array(cells).keys()].filter(i => board.regions[i] === k)); // patches
  const unitsOf = (i: number) => [rowOf(i), n + colOf(i), 2 * n + board.regions[i]!];
  const kindOf = (u: number) => KINDS[Math.floor(u / n)]!;
  const left = (u: number) => units[u]!.filter(i => open[i]);

  const single = (): Step | null => {
    for (let u = 0; u < 3 * n; u++) {
      if (done[u]) continue;
      const l = left(u);
      if (l.length === 1) return { kind: 'cat', cells: l, because: units[u]!, why: `This is the only place left for this ${kindOf(u)}'s cat.`, tier: 1 };
    }
    return null;
  };

  const wipeout = (): Step | null => {
    for (let c = 0; c < cells; c++) {
      if (!open[c]) continue;
      const own = new Set(unitsOf(c));
      for (let u = 0; u < 3 * n; u++) {
        if (done[u] || own.has(u)) continue;
        const l = left(u);
        if (l.every(i => touches(board, c, i))) {
          return { kind: 'cross', cells: [c], because: l, why: `A cat here would leave this ${kindOf(u)} with nowhere for its cat.`, tier: 2 };
        }
      }
    }
    return null;
  };

  // k units of one kind whose cats must all fall inside k units of another kind claim those units for themselves
  const lineOf = (kind: number, i: number) => (kind === 0 ? rowOf(i) : kind === 1 ? colOf(i) : board.regions[i]!);
  const confine = (maxK: number, tier: number): Step | null => {
    for (const from of [0, 1, 2]) for (const to of [0, 1, 2]) {
      if (from === to || (from !== 2 && to !== 2)) continue; // rows vs columns is plain counting, never needed
      const free = [...Array(n).keys()].filter(k => !done[from * n + k]);
      const subsets = (start: number, chosen: number[]): Step | null => {
        if (chosen.length > 0 && chosen.length <= maxK) {
          const spread = new Set(chosen.flatMap(k => left(from * n + k).map(i => lineOf(to, i))));
          if (spread.size === chosen.length) {
            const mine = new Set(chosen);
            const shut = [...spread].flatMap(t => units[to * n + t]!).filter(i => open[i] && !mine.has(lineOf(from, i)));
            if (shut.length) {
              const a = KINDS[from]!, b = KINDS[to]!, k = chosen.length;
              return {
                kind: 'cross', cells: shut, because: chosen.flatMap(c => left(from * n + c)), tier,
                why: k === 1
                  ? `This ${a}'s cat has to be in this ${b}, so nothing else in the ${b} can have one.`
                  : `These ${k} ${plural(a)} have to have their cats in these ${k} ${plural(b)}, so nothing else in those ${plural(b)} can have one.`,
              };
            }
          }
        }
        if (chosen.length === maxK) return null;
        for (let s = start; s < free.length; s++) {
          const step = subsets(s + 1, [...chosen, free[s]!]);
          if (step) return step;
        }
        return null;
      };
      const step = subsets(0, []);
      if (step) return step;
    }
    return null;
  };

  return single() ?? confine(1, 2) ?? wipeout() ?? confine(n - 1, 3);
}

/** Whether cats in cells a and b would clash: same row, column or patch, or touching. */
export function touches(board: Puzzle, a: number, b: number) {
  const n = board.size, ra = Math.floor(a / n), rb = Math.floor(b / n), ca = a % n, cb = b % n;
  return a !== b && (ra === rb || ca === cb || board.regions[a] === board.regions[b] || (Math.abs(ra - rb) < 2 && Math.abs(ca - cb) < 2));
}

/** Lays a cat in `cell`, shutting every cell it rules out and marking its row, column and patch done. */
export function settle(board: Puzzle, open: boolean[], done: boolean[], cell: number) {
  const n = board.size;
  open.forEach((_, i) => { if (touches(board, cell, i)) open[i] = false; });
  open[cell] = false;
  for (const u of [Math.floor(cell / n), n + (cell % n), 2 * n + board.regions[cell]!]) done[u] = true;
}

/**
 * How hard a board is to solve by reasoning alone, 1..4: the hardest step (see nextStep) a player can't avoid, or 4
 * when those steps aren't enough and the player has to try a cat and see what goes wrong.
 */
export function rate(board: Puzzle): number {
  const n = board.size, open = new Array<boolean>(n * n).fill(true), done = new Array<boolean>(3 * n).fill(false);
  let tier = 1;
  for (let placed = 0; placed < n;) {
    const step = nextStep(board, open, done);
    if (!step) return 4;
    tier = Math.max(tier, step.tier);
    if (step.kind === 'cat') { settle(board, open, done, step.cells[0]!); placed++; }
    else for (const i of step.cells) open[i] = false;
  }
  return tier;
}

/** A board as text: each cell's patch, then each row's cat column, one base-36 digit apiece. */
export const encode = (board: Puzzle) => [...board.regions, ...board.cats].map(d => d.toString(36)).join('');

export function decode(size: number, text: string): Puzzle {
  const digits = [...text].map(ch => parseInt(ch, 36));
  return { size, regions: digits.slice(0, size * size), cats: digits.slice(size * size) };
}
