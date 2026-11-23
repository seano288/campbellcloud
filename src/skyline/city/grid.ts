// The city's fixed street grid, in world units. The land is cut into Blocks, every Block the same size (four cells across, two
// down) with a street all round it, so every plot faces a street and every street joins every other: any Job can always be driven.
// A Block is cut into Plots by one of a few fixed patterns: small (one cell), wide (two across) and large (two by two).
//
// The six Districts are 2×2 Blocks each, laid out three across and two down. After them the city grows east for ever, one column
// of four Blocks at a time (`blockAt`), so no Block ever moves when another is added.

export const CELL = 64;
export const BLOCK_W = CELL * 4, BLOCK_H = CELL * 2;
export const STREET = 60;
export const PITCH_X = BLOCK_W + STREET, PITCH_Y = BLOCK_H + STREET;
/** Blocks per column: the city is always four Blocks tall. */
export const ROWS = 4;
export const DISTRICT_COUNT = 6;
export const DISTRICT_BLOCKS = 4;
/** The Blocks the six Districts hold; every Block from here on is one he buys after them. */
export const FIRST_EXTRA = DISTRICT_COUNT * DISTRICT_BLOCKS;

export type PlotSize = 's' | 'w' | 'l';
export interface Pt { x: number; y: number }
export interface Rect { x: number; y: number; w: number; h: number }

/** Where Block `id` sits on the grid: column and row. */
export function blockAt(id: number): { bx: number; by: number } {
  if (id < FIRST_EXTRA) {
    const d = Math.floor(id / DISTRICT_BLOCKS), k = id % DISTRICT_BLOCKS;
    return { bx: 2 * (d % 3) + (k % 2), by: 2 * Math.floor(d / 3) + Math.floor(k / 2) };
  }
  const n = id - FIRST_EXTRA;
  return { bx: 6 + Math.floor(n / ROWS), by: n % ROWS };
}
export const districtOf = (id: number): number | null => (id < FIRST_EXTRA ? Math.floor(id / DISTRICT_BLOCKS) : null);
export const blockIdAt = (bx: number, by: number): number | null => {
  if (bx < 0 || by < 0 || by >= ROWS) return null;
  if (bx >= 6) return FIRST_EXTRA + (bx - 6) * ROWS + by;
  const d = Math.floor(bx / 2) + 3 * Math.floor(by / 2), k = (bx % 2) + 2 * (by % 2);
  return d * DISTRICT_BLOCKS + k;
};
export function blockRect(id: number): Rect {
  const { bx, by } = blockAt(id);
  return { x: STREET + bx * PITCH_X, y: STREET + by * PITCH_Y, w: BLOCK_W, h: BLOCK_H };
}

// ---------- plots ----------

/** A plot inside a Block, in cells: column, row, width, height. */
interface PlotCells { c: number; r: number; w: number; h: number }
const S = (c: number, r: number): PlotCells => ({ c, r, w: 1, h: 1 });
const W = (c: number, r: number): PlotCells => ({ c, r, w: 2, h: 1 });
const L = (c: number): PlotCells => ({ c, r: 0, w: 2, h: 2 });
/** The ways a Block is cut. Every one has small plots (where towers stand) and at least one wide or large one. */
export const PATTERNS: readonly (readonly PlotCells[])[] = [
  [W(0, 0), S(2, 0), S(3, 0), S(0, 1), S(1, 1), W(2, 1)],
  [L(0), S(2, 0), S(3, 0), W(2, 1)],
  [S(0, 0), S(1, 0), L(2), W(0, 1)],
  [S(0, 0), S(1, 0), S(2, 0), S(3, 0), W(0, 1), W(2, 1)],
  [W(0, 0), W(2, 0), S(0, 1), S(1, 1), S(2, 1), S(3, 1)],
];
export const patternOf = (id: number) => (id === 0 ? 0 : (id * 7 + Math.floor(id / 3)) % PATTERNS.length);

export interface Plot { id: string; block: number; index: number; size: PlotSize; rect: Rect; /** where a vehicle stops for it */ kerb: Pt; /** the street side it faces */ side: 'top' | 'bottom' }
const sizeOf = (p: PlotCells): PlotSize => (p.w === 2 && p.h === 2 ? 'l' : p.w === 2 ? 'w' : 's');

const plotCache = new Map<number, Plot[]>();
export function plotsOf(block: number): Plot[] {
  let got = plotCache.get(block);
  if (got) return got;
  const b = blockRect(block);
  got = PATTERNS[patternOf(block)]!.map((p, index) => {
    const rect = { x: b.x + p.c * CELL, y: b.y + p.r * CELL, w: p.w * CELL, h: p.h * CELL };
    const side = p.r === 0 ? 'top' as const : 'bottom' as const;
    const kerb = { x: rect.x + rect.w / 2, y: side === 'top' ? b.y - STREET / 2 : b.y + BLOCK_H + STREET / 2 };
    return { id: `${block}:${index}`, block, index, size: sizeOf(p), rect, kerb, side };
  });
  plotCache.set(block, got);
  return got;
}
export const plotById = (id: string): Plot | null => {
  const [b, i] = id.split(':').map(Number);
  if (!Number.isInteger(b) || !Number.isInteger(i) || b! < 0) return null;
  return plotsOf(b!)[i!] ?? null;
};

// ---------- the streets ----------

/** The city's extent in Block columns: every street up to one column past the furthest Block he owns. */
export interface Bounds { cols: number }
export const boundsOf = (blocks: readonly number[]): Bounds => ({ cols: Math.max(2, ...blocks.map(b => blockAt(b).bx + 1)) });
export const worldSize = (b: Bounds) => ({ w: STREET + b.cols * PITCH_X, h: STREET + ROWS * PITCH_Y });
/** The centre of street line i across (vertical streets) and j down (horizontal streets). */
export const streetX = (i: number) => STREET / 2 + i * PITCH_X;
export const streetY = (j: number) => STREET / 2 + j * PITCH_Y;

/** The nearest point on a street centre line, inside the city. */
export function snapToStreet(p: Pt, b: Bounds): Pt {
  const { w, h } = worldSize(b);
  const x = Math.max(STREET / 2, Math.min(w - STREET / 2, p.x)), y = Math.max(STREET / 2, Math.min(h - STREET / 2, p.y));
  const i = Math.round((x - STREET / 2) / PITCH_X), j = Math.round((y - STREET / 2) / PITCH_Y);
  const vx = streetX(Math.max(0, Math.min(b.cols, i))), hy = streetY(Math.max(0, Math.min(ROWS, j)));
  return Math.abs(x - vx) < Math.abs(y - hy) ? { x: vx, y } : { x, y: hy };
}

/** Is this point on a street (not inside a Block)? */
export function onStreet(p: Pt, b: Bounds, pad = 0): boolean {
  const { w, h } = worldSize(b);
  if (p.x < 0 || p.y < 0 || p.x > w || p.y > h) return false;
  const inX = ((p.x % PITCH_X) + PITCH_X) % PITCH_X, inY = ((p.y % PITCH_Y) + PITCH_Y) % PITCH_Y;
  return inX < STREET - pad || inY < STREET - pad;
}

/**
 * The way along the streets from one street point to another: the corners to pass through, then the end. Streets make a full grid,
 * so the shortest way is an L or a Z: along the street he's on to a crossing, across, and along again. Both points must be on a
 * street centre line (snapToStreet).
 */
export function routeBetween(a: Pt, z: Pt): Pt[] {
  const aV = isVertical(a), zV = isVertical(z);
  const ai = colOf(a.x), aj = rowOf(a.y), zi = colOf(z.x), zj = rowOf(z.y);
  // the same street: straight there
  if (aV && zV && near(a.x, z.x)) return [z];
  if (!aV && !zV && near(a.y, z.y)) return [z];
  if (aV && !zV) return [{ x: a.x, y: z.y }, z];
  if (!aV && zV) return [{ x: z.x, y: a.y }, z];
  if (aV && zV) {
    // two up-and-down streets: across on whichever crossing street is nearer the pair
    const j = bestCross(a.y, z.y, aj, zj, rowOf, streetY);
    return [{ x: a.x, y: streetY(j) }, { x: z.x, y: streetY(j) }, z];
  }
  const i = bestCross(a.x, z.x, ai, zi, colOf, streetX);
  return [{ x: streetX(i), y: a.y }, { x: streetX(i), y: z.y }, z];
}
const near = (p: number, q: number) => Math.abs(p - q) < 1;
const colOf = (x: number) => Math.round((x - STREET / 2) / PITCH_X);
const rowOf = (y: number) => Math.round((y - STREET / 2) / PITCH_Y);
/** On a vertical street: its x is on a street line (a crossing counts as both, and is taken as vertical). */
function isVertical(p: Pt) { return near(p.x, streetX(colOf(p.x))); }
function bestCross(a: number, z: number, ai: number, zi: number, idx: (v: number) => number, at: (i: number) => number) {
  const lo = Math.min(a, z), hi = Math.max(a, z);
  // a crossing between the two if there is one, else the nearest to them
  const first = Math.ceil((lo - STREET / 2) / (at(1) - at(0)) - 1e-6), last = Math.floor((hi - STREET / 2) / (at(1) - at(0)) + 1e-6);
  if (first <= last) return Math.max(0, first);
  const options = [idx(lo), idx(hi), ai, zi].filter(i => i >= 0);
  return options.sort((p, q) => Math.abs(at(p) - (a + z) / 2) - Math.abs(at(q) - (a + z) / 2))[0] ?? 0;
}
