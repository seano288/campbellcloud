// Cat Nap puzzles: an n×n board split into n coloured patches. Every row, every column and every patch gets exactly
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

/** A seed for each calendar day, so everyone gets the same daily board. */
export const daySeed = (date: Date) => date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
