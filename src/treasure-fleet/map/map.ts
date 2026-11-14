// The island maps the questions are asked on, as data: a grid of squares, the things standing on some of them, and sometimes a
// river running down one column with bridges across it. North is always up. x counts squares from the left (west), y from the top
// (north), so "north" is a smaller y. The same symbols are the sea chart's.
//
// Position words are the screen's: left and right are the screen's left and right, never a character's.

export const SYMS = ['palm', 'hut', 'cave', 'hill', 'rock', 'dock', 'bridge'] as const;
export type Sym = (typeof SYMS)[number];
/** What can stand anywhere on land. A bridge only ever sits on the river. */
export const LAND_SYMS = ['palm', 'hut', 'cave', 'hill', 'rock', 'dock'] as const satisfies readonly Sym[];
/** Everything a map key can list: the symbols, and the river. */
export type KeySym = Sym | 'river';

export interface Cell { readonly x: number; readonly y: number }
export interface Thing extends Cell { readonly sym: Sym }
export interface IsleMap {
  readonly w: number;
  readonly h: number;
  readonly things: readonly Thing[];
  /** The column the river runs down, or null. */
  readonly river: number | null;
}

export type Side = 'left' | 'right' | 'above' | 'below';
export type Cardinal = 'north' | 'east' | 'south' | 'west';
export type Rel = Side | Cardinal;
export const CARDINALS: readonly Cardinal[] = ['north', 'east', 'south', 'west'];
export const SIDES: readonly Side[] = ['left', 'right', 'above', 'below'];

/** One square in that direction. */
export const STEP: Record<Rel, readonly [number, number]> = {
  left: [-1, 0], west: [-1, 0], right: [1, 0], east: [1, 0], above: [0, -1], north: [0, -1], below: [0, 1], south: [0, 1],
};
/** The compass point a screen direction is. */
export const CARDINAL_OF: Record<Rel, Cardinal> = { left: 'west', west: 'west', right: 'east', east: 'east', above: 'north', north: 'north', below: 'south', south: 'south' };

export const same = (a: Cell, b: Cell) => a.x === b.x && a.y === b.y;
export const cellId = (c: Cell) => `${c.x},${c.y}`;
export const inside = (m: Pick<IsleMap, 'w' | 'h'>, c: Cell) => c.x >= 0 && c.y >= 0 && c.x < m.w && c.y < m.h;
export const thingAt = (m: Pick<IsleMap, 'things'>, c: Cell) => m.things.find(t => same(t, c)) ?? null;
export const isRiver = (m: Pick<IsleMap, 'river'>, c: Cell) => m.river !== null && c.x === m.river;
export const cells = (w: number, h: number): Cell[] => Array.from({ length: w * h }, (_, i) => ({ x: i % w, y: Math.floor(i / w) }));
export const countOf = (m: Pick<IsleMap, 'things'>, sym: Sym) => m.things.filter(t => t.sym === sym).length;

/**
 * Is `c` anywhere on that side of `ref`? The loose reading a child might take: "north of the hut" is anywhere higher up the map,
 * not only straight up. The questions are made so the loose and the strict reading (same row or column) give the same one thing.
 */
export function onSide(ref: Cell, rel: Rel, c: Cell): boolean {
  const [dx, dy] = STEP[rel];
  return dx ? (c.x - ref.x) * dx > 0 : (c.y - ref.y) * dy > 0;
}
/** In the same row or column as `ref`, on that side. */
export const inLine = (ref: Cell, rel: Rel, c: Cell) => onSide(ref, rel, c) && (STEP[rel][0] ? c.y === ref.y : c.x === ref.x);

// ---------- grid squares: letters along the bottom, numbers up the side, said letter first ----------

export const LETTERS = ['A', 'B', 'C', 'D', 'E'] as const;
export type Letter = (typeof LETTERS)[number];
/** The letters whose names rhyme ("bee", "see", "dee", "ee"): two of them are never rival answers. */
export const RHYMING: readonly Letter[] = ['B', 'C', 'D', 'E'];
/** Column x is a letter, counted from the left; row y is a number, counted up from the bottom (1 is the bottom row). */
export const letterOf = (x: number): Letter => LETTERS[x]!;
export const numberOf = (h: number, y: number) => h - y;
export const squareName = (h: number, c: Cell) => `${letterOf(c.x)}${numberOf(h, c.y)}`;
