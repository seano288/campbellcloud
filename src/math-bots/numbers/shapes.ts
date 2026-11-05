// The shape table for Shapes: every drawing he can be shown, what it really is, and what's wrong with it if it's a foil, and the
// outlines he fills at Level 3. Plain data, so a question, a lesson and a test all read the same thing. A square is a rectangle,
// which is true and too much for this Level, so a rectangle question never shows one: no answer here depends on that.
export const SHAPE_NAMES = ['triangle', 'square', 'rectangle', 'circle', 'hexagon'] as const;
export type ShapeName = (typeof SHAPE_NAMES)[number];
type Pt = readonly [number, number];
/** Why a drawing isn't the shape it looks like. */
export type Flaw = 'gap' | 'curve' | 'stretched';
/** What sets a four-sided foil apart from a square or rectangle, which also have four sides: counting them explains nothing there. */
export type Off = 'lengths' | 'corners';
export interface Drawing {
  /** The corners in order; a closed drawing joins the last to the first. Round drawings have none. */
  readonly pts: readonly Pt[];
  readonly closed: boolean;
  /** Straight sides. */
  readonly sides: number;
  readonly is?: ShapeName;
  readonly flaw?: Flaw;
  readonly off?: Off;
  /** For anything with a curve in it. */
  readonly d?: string;
}
const ring = (n: number, r = 44, turn = -90): Pt[] => Array.from({ length: n }, (_, i) => {
  const a = ((turn + (360 / n) * i) * Math.PI) / 180;
  return [Math.round(50 + r * Math.cos(a)), Math.round(50 + r * Math.sin(a))];
});
const closed = (is: ShapeName | undefined, ...pts: Pt[]): Drawing => ({ pts, closed: true, sides: pts.length, ...(is && { is }) });
const open = (...pts: Pt[]): Drawing => ({ pts, closed: false, sides: pts.length - 1, flaw: 'gap' });

export const DRAWINGS = {
  triEven: closed('triangle', [50, 10], [92, 84], [8, 84]),
  triRight: closed('triangle', [14, 12], [14, 88], [88, 88]),
  triThin: closed('triangle', [46, 4], [60, 96], [32, 96]),
  triWide: closed('triangle', [4, 72], [96, 72], [68, 30]),
  square: closed('square', [18, 18], [82, 18], [82, 82], [18, 82]),
  rectLong: { ...closed('rectangle', [6, 28], [94, 28], [94, 72], [6, 72]), off: 'lengths' },
  rectThin: { ...closed('rectangle', [4, 40], [96, 40], [96, 60], [4, 60]), off: 'lengths' },
  hexagon: closed('hexagon', ...ring(6)),
  circle: { pts: [], closed: true, sides: 0, is: 'circle', d: 'M50 10 A40 40 0 1 1 49.9 10 Z' },
  // the foils
  triGap: open([50, 10], [92, 84], [8, 84], [32, 42]),
  squareGap: open([18, 18], [82, 18], [82, 82], [18, 82], [18, 44]),
  rectGap: open([6, 28], [94, 28], [94, 72], [6, 72], [6, 52]),
  triCurve: { pts: [], closed: true, sides: 2, flaw: 'curve', d: 'M50 10 L92 84 Q50 54 8 84 Z' },
  rectCurve: { pts: [], closed: true, sides: 3, flaw: 'curve', d: 'M6 28 H94 V72 Q50 98 6 72 Z' },
  oval: { pts: [], closed: true, sides: 0, flaw: 'stretched', d: 'M4 50 A46 28 0 1 1 96 50 A46 28 0 1 1 4 50 Z' },
  circleGap: { pts: [], closed: false, sides: 0, flaw: 'gap', d: 'M72 18 A38 38 0 1 0 88 50' },
  lean: { ...closed(undefined, [30, 20], [96, 20], [70, 80], [4, 80]), off: 'corners' },
  kite: { ...closed(undefined, [50, 6], [88, 44], [50, 94], [12, 44]), off: 'corners' },
  ramp: { ...closed(undefined, [28, 22], [72, 22], [94, 78], [6, 78]), off: 'corners' },
  pentagon: closed(undefined, ...ring(5)),
  octagon: closed(undefined, ...ring(8, 44, -67.5)),
} as const satisfies Record<string, Drawing>;
export type DrawingId = keyof typeof DRAWINGS;
export const drawing = (id: DrawingId): Drawing => DRAWINGS[id];
/** How many sides each named shape has, so a foil is never told apart by a count it shares. */
export const SIDES_OF: Record<ShapeName, number> = { triangle: 3, square: 4, rectangle: 4, circle: 0, hexagon: 6 };

/** A drawing as one tile shows it: colour, size and turn change, and never decide anything. */
export interface Tile { readonly id: DrawingId; readonly turn: number; readonly size: number; readonly hue: number }

/** Stretch 0 is the plain shapes without hexagons, then turned and skinny ones; `near` foils join at Stretch 2. */
export const SHAPE_SETS: Record<ShapeName, { yes: readonly DrawingId[]; moreYes: readonly DrawingId[]; plain: readonly DrawingId[]; near: readonly DrawingId[] }> = {
  triangle: { yes: ['triEven', 'triRight'], moreYes: ['triThin', 'triWide'], plain: ['square', 'circle', 'rectLong', 'pentagon'], near: ['triGap', 'triCurve', 'kite'] },
  square: { yes: ['square'], moreYes: [], plain: ['triEven', 'circle', 'pentagon', 'hexagon'], near: ['rectLong', 'squareGap', 'lean', 'kite'] },
  rectangle: { yes: ['rectLong'], moreYes: ['rectThin'], plain: ['triEven', 'circle', 'pentagon', 'hexagon'], near: ['rectGap', 'rectCurve', 'lean', 'ramp'] },
  circle: { yes: ['circle'], moreYes: [], plain: ['triEven', 'square', 'pentagon', 'hexagon'], near: ['oval', 'circleGap', 'octagon'] },
  hexagon: { yes: ['hexagon'], moreYes: [], plain: ['triEven', 'square', 'circle'], near: ['pentagon', 'octagon', 'ramp'] },
};

// ---------- filling an outline ----------

export const PIECES = ['triangle', 'square', 'half'] as const;
export type Piece = (typeof PIECES)[number];
export interface Fill {
  /** The line that sums it up. He's only ever told "Fill the shape.": naming the outline would name a piece that's wrong on some of them. */
  readonly says: 'Two triangles make a square.' | 'Two squares make a rectangle.' | 'Two triangles make a rectangle.' | 'Two triangles make a bigger triangle.' | 'Two half circles make a circle.' | 'Four squares make a bigger square.' | 'Four triangles make a square.' | 'Six triangles make a hexagon.' | 'A square and a triangle make a house.';
  /** Each part of the outline, in 120 by 120 space. */
  readonly parts: readonly { readonly piece: Piece; readonly d: string }[];
}
const part = (piece: Piece, d: string) => ({ piece, d });
const CX = 60, CY = 60;
const hexPts = ring(6, 56).map(([x, y]) => [x + 10, y + 10] as const);
export const FILLS = {
  squareTwo: { says: 'Two triangles make a square.', parts: [part('triangle', 'M12 12 H108 V108 Z'), part('triangle', 'M12 12 V108 H108 Z')] },
  rectSquares: { says: 'Two squares make a rectangle.', parts: [part('square', 'M4 32 H60 V88 H4 Z'), part('square', 'M60 32 H116 V88 H60 Z')] },
  rectTwo: { says: 'Two triangles make a rectangle.', parts: [part('triangle', 'M4 28 H116 V92 Z'), part('triangle', 'M4 28 V92 H116 Z')] },
  bigTriangle: { says: 'Two triangles make a bigger triangle.', parts: [part('triangle', `M${CX} 14 V106 H8 Z`), part('triangle', `M${CX} 14 V106 H112 Z`)] },
  circleHalves: { says: 'Two half circles make a circle.', parts: [part('half', `M${CX} 12 A48 48 0 0 1 ${CX} 108 Z`), part('half', `M${CX} 12 A48 48 0 0 0 ${CX} 108 Z`)] },
  fourSquares: { says: 'Four squares make a bigger square.', parts: [part('square', 'M12 12 H60 V60 H12 Z'), part('square', 'M60 12 H108 V60 H60 Z'), part('square', 'M12 60 H60 V108 H12 Z'), part('square', 'M60 60 H108 V108 H60 Z')] },
  squareFour: { says: 'Four triangles make a square.', parts: [part('triangle', `M12 12 H108 L${CX} ${CY} Z`), part('triangle', `M108 12 V108 L${CX} ${CY} Z`), part('triangle', `M108 108 H12 L${CX} ${CY} Z`), part('triangle', `M12 108 V12 L${CX} ${CY} Z`)] },
  hexSix: { says: 'Six triangles make a hexagon.', parts: hexPts.map(([x, y], i) => { const [p, q] = hexPts[(i + 1) % 6]!; return part('triangle', `M${x} ${y} L${p} ${q} L${CX} ${CY} Z`); }) },
  house: { says: 'A square and a triangle make a house.', parts: [part('square', 'M32 56 H88 V112 H32 Z'), part('triangle', `M${CX} 12 L88 56 H32 Z`)] },
} as const satisfies Record<string, Fill>;
export type FillId = keyof typeof FILLS;
export const FILLS_BY_STRETCH: readonly (readonly FillId[])[] = [['squareTwo', 'rectSquares'], ['rectTwo', 'bigTriangle', 'circleHalves', 'fourSquares'], ['squareFour', 'hexSix', 'house']];
