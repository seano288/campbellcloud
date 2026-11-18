// Every letter, capital and number as data: its strokes in order, each a path from its start to its end, and the words said for each
// stroke. No handwriting recogniser: the checker (check.ts) follows these paths. The shapes are ball-and-stick, in the style of
// Zaner-Bloser manuscript, which matches Andika (the site's reading font: a single-storey a and g, a straight-tailed y): circles that
// "circle back" (counterclockwise) for a, c, d, g, o, q, "back up and over" humps for n, m, h, r, and "back up and around" for b and p.
// That style is a default for the parent to confirm against what his school teaches (.scratch/sky-writer/spec.md).
//
// Coordinates are in line units: the top line is y = 0, the middle (dashed) line y = 1, the bottom line y = 2 and the tail line y = 3,
// so a small letter is 1 tall and a tall one 2. x starts at 0 at the letter's left edge.
//
// The stroke words are built only from STROKE_WORDS, a small shared set, so every letter says them the same way.

export type Pt = readonly [number, number];

export const STROKE_WORDS = [
  'Start at the top.', 'Start near the top.', 'Start at the middle.', 'Start near the middle.', 'Start on the right.',
  'Pull down.', 'Pull down below the line.', 'Push up.', 'Push up to the top.', 'Slide right.', 'Slide left.', 'Slant down.', 'Slant up.',
  'Curve back.', 'Curve forward.', 'Curve down.', 'Circle back all the way around.', 'Around and close it.', 'Back up and over.',
  'Back up and around.', 'Hook back.', 'Lift.', 'Cross.', 'Add the dot.',
] as const;
export type StrokeWord = (typeof STROKE_WORDS)[number];

export interface Stroke {
  /** The path, evenly spaced (STEP apart), from its start to its end. A dot is one point. */
  readonly pts: readonly Pt[];
  readonly dot: boolean;
  /** Its words, said while the plane flies it. */
  readonly say: readonly StrokeWord[];
  /** Its length in line units (0 for a dot). */
  readonly len: number;
}

export type Size = 'tall' | 'small' | 'tail';
export const FAMILY_IDS = ['lines', 'c', 'tall', 'bumps', 'slants', 'rest', 'numbers', 'capitals'] as const;
export type FamilyId = (typeof FAMILY_IDS)[number];

export interface Letter {
  readonly ch: string;
  readonly kind: 'lower' | 'capital' | 'number';
  readonly family: FamilyId;
  /** Lowercase letters only: does it reach the top line, stay small, or hang a tail below the line? */
  readonly size: Size | null;
  readonly strokes: readonly Stroke[];
  /** Its width in line units. */
  readonly width: number;
}

// ---------- drawing the paths ----------

export const STEP = 0.04;
const line = (x1: number, y1: number, x2: number, y2: number): Pt[] => [[x1, y1], [x2, y2]];
/** An arc around (cx, cy): angles in degrees as on a clock face drawn in maths (0 is 3 o'clock, 90 is 12 o'clock), going from a0 to
 *  a1. Increasing angles go counterclockwise ("circle back"), decreasing ones clockwise ("curve forward"). */
function arc(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number): Pt[] {
  const n = Math.max(8, Math.ceil(Math.abs(a1 - a0) / 6)), out: Pt[] = [];
  for (let i = 0; i <= n; i++) { const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180; out.push([cx + rx * Math.cos(a), cy - ry * Math.sin(a)]); }
  return out;
}
const poly = (...pts: Pt[]): Pt[] => pts;
/** Pieces joined end to end (each piece starts where the last ended). */
const path = (...parts: Pt[][]): Pt[] => parts.flatMap((p, i) => (i ? p.slice(1) : p));

/** A polyline evenly spaced STEP apart, so the checker can walk it by length. */
export function resample(pts: readonly Pt[], step = STEP): Pt[] {
  if (pts.length < 2) return [...pts];
  const out: Pt[] = [pts[0]!];
  let carry = 0;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1]!, [bx, by] = pts[i]!, d = Math.hypot(bx - ax, by - ay);
    let t = step - carry;
    while (t <= d) { out.push([ax + ((bx - ax) * t) / d, ay + ((by - ay) * t) / d]); t += step; }
    carry = d - (t - step);
  }
  const last = pts.at(-1)!, end = out.at(-1)!;
  if (Math.hypot(last[0] - end[0], last[1] - end[1]) > step * 0.3) out.push(last);
  return out;
}
const lengthOf = (pts: readonly Pt[]) => pts.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - pts[i - 1]![0], p[1] - pts[i - 1]![1]) : 0), 0);

type Raw = { pts: Pt[]; say: StrokeWord[]; dot?: boolean };
const S = (pts: Pt[], ...say: StrokeWord[]): Raw => ({ pts, say });
const DOT = (x: number, y: number, ...say: StrokeWord[]): Raw => ({ pts: [[x, y]], say, dot: true });

// ---------- the shapes ----------

const CIRCLE = () => S(arc(0.5, 1.5, 0.5, 0.5, 30, 390), 'Start near the middle.', 'Circle back all the way around.');
const HUMP = (x: number, w = 0.9, y0 = 1.45) => S(path(arc(x + w / 2, y0, w / 2, y0 - 1, 180, 0), line(x + w, y0, x + w, 2)), 'Back up and over.', 'Pull down.');
const BUMP = () => S(arc(0.5, 1.5, 0.5, 0.5, 170, -170), 'Back up and around.');

const LOWER: Record<string, Raw[]> = {
  // the c family: all start like c, near the middle line on the right, and circle back
  c: [S(arc(0.5, 1.5, 0.5, 0.5, 45, 315), 'Start near the middle.', 'Curve back.')],
  a: [CIRCLE(), S(line(1, 1, 1, 2), 'Push up.', 'Pull down.')],
  d: [CIRCLE(), S(line(1, 0, 1, 2), 'Push up to the top.', 'Pull down.')],
  g: [CIRCLE(), S(path(line(1, 1, 1, 2.55), arc(0.55, 2.55, 0.45, 0.45, 0, -160)), 'Push up.', 'Pull down below the line.', 'Hook back.')],
  o: [S(arc(0.5, 1.5, 0.5, 0.5, 85, 445), 'Start at the middle.', 'Circle back all the way around.')],
  q: [CIRCLE(), S(line(1, 1, 1, 3), 'Push up.', 'Pull down below the line.')],
  // tall lines and tails
  l: [S(line(0, 0, 0, 2), 'Start at the top.', 'Pull down.')],
  t: [S(line(0.4, 0, 0.4, 2), 'Start at the top.', 'Pull down.'), S(line(0, 1, 0.8, 1), 'Lift.', 'Cross.')],
  i: [S(line(0, 1, 0, 2), 'Start at the middle.', 'Pull down.'), DOT(0, 0.45, 'Lift.', 'Add the dot.')],
  j: [S(path(line(0.6, 1, 0.6, 2.55), arc(0.15, 2.55, 0.45, 0.45, 0, -160)), 'Start at the middle.', 'Pull down below the line.', 'Hook back.'), DOT(0.6, 0.45, 'Lift.', 'Add the dot.')],
  k: [S(line(0, 0, 0, 2), 'Start at the top.', 'Pull down.'), S(line(0.85, 1, 0.05, 1.55), 'Lift.', 'Start on the right.', 'Slant down.'), S(line(0.3, 1.38, 0.9, 2), 'Slant down.')],
  // bumps: down, then back up and over (or around)
  r: [S(line(0, 1, 0, 2), 'Start at the middle.', 'Pull down.'), S(arc(0.45, 1.45, 0.45, 0.45, 180, 35), 'Back up and over.')],
  n: [S(line(0, 1, 0, 2), 'Start at the middle.', 'Pull down.'), HUMP(0)],
  m: [S(line(0, 1, 0, 2), 'Start at the middle.', 'Pull down.'), HUMP(0, 0.7, 1.4), HUMP(0.7, 0.7, 1.4)],
  h: [S(line(0, 0, 0, 2), 'Start at the top.', 'Pull down.'), HUMP(0)],
  b: [S(line(0, 0, 0, 2), 'Start at the top.', 'Pull down.'), BUMP()],
  p: [S(line(0, 1, 0, 3), 'Start at the middle.', 'Pull down below the line.'), BUMP()],
  // slants
  v: [S(poly([0, 1], [0.5, 2], [1, 1]), 'Start at the middle.', 'Slant down.', 'Slant up.')],
  w: [S(poly([0, 1], [0.35, 2], [0.7, 1], [1.05, 2], [1.4, 1]), 'Start at the middle.', 'Slant down.', 'Slant up.', 'Slant down.', 'Slant up.')],
  x: [S(line(0, 1, 0.9, 2), 'Start at the middle.', 'Slant down.'), S(line(0.9, 1, 0, 2), 'Lift.', 'Start on the right.', 'Slant down.')],
  y: [S(line(0, 1, 0.6, 2), 'Start at the middle.', 'Slant down.'), S(line(1.05, 1, 0.15, 3), 'Lift.', 'Start on the right.', 'Pull down below the line.')],
  z: [S(poly([0, 1], [0.9, 1], [0, 2], [0.9, 2]), 'Start at the middle.', 'Slide right.', 'Slant down.', 'Slide right.')],
  // the rest
  s: [S(path(arc(0.45, 1.25, 0.4, 0.25, 30, 270), arc(0.45, 1.75, 0.4, 0.25, 90, -150)), 'Start near the middle.', 'Curve back.', 'Curve forward.')],
  e: [S(path(line(0, 1.5, 1, 1.5), arc(0.5, 1.5, 0.5, 0.5, 0, 320)), 'Start near the middle.', 'Slide right.', 'Curve back.')],
  f: [S(path(arc(0.8, 0.45, 0.38, 0.4, 25, 180), line(0.42, 0.45, 0.42, 2)), 'Start near the top.', 'Curve back.', 'Pull down.'), S(line(0, 1, 0.85, 1), 'Lift.', 'Cross.')],
  u: [S(path(line(0, 1, 0, 1.55), arc(0.45, 1.55, 0.45, 0.45, 180, 360), line(0.9, 1.55, 0.9, 1)), 'Start at the middle.', 'Pull down.', 'Curve forward.', 'Push up.'), S(line(0.9, 1, 0.9, 2), 'Pull down.')],
};

const DOWN = (x: number) => S(line(x, 0, x, 2), 'Start at the top.', 'Pull down.');
const BAR = (x1: number, x2: number, y: number) => S(line(x1, y, x2, y), 'Lift.', 'Slide right.');
const BOWL = (top: number, w: number) => S(path(line(0, top, w, top), arc(w, top + 0.5, 0.45, 0.5, 90, -90), line(w, top + 1, 0, top + 1)), 'Lift.', 'Slide right.', 'Curve forward.', 'Slide left.');
const RING = (cx: number, rx: number) => S(arc(cx, 1, rx, 1, 85, 445), 'Start at the top.', 'Circle back all the way around.');

const CAPITAL: Record<string, Raw[]> = {
  L: [DOWN(0), S(line(0, 2, 1.2, 2), 'Slide right.')],
  T: [DOWN(0.7), BAR(0, 1.4, 0)],
  I: [DOWN(0.6), BAR(0, 1.2, 0), BAR(0, 1.2, 2)],
  H: [DOWN(0), S(line(1.2, 0, 1.2, 2), 'Lift.', 'Pull down.'), BAR(0, 1.2, 1)],
  E: [DOWN(0), BAR(0, 1.1, 0), BAR(0, 0.9, 1), BAR(0, 1.1, 2)],
  F: [DOWN(0), BAR(0, 1.1, 0), BAR(0, 0.9, 1)],
  A: [S(line(0.7, 0, 0, 2), 'Start at the top.', 'Slant down.'), S(line(0.7, 0, 1.4, 2), 'Lift.', 'Slant down.'), BAR(0.27, 1.13, 1.25)],
  B: [DOWN(0), BOWL(0, 0.6), { ...S(path(line(0, 1, 0.65, 1), arc(0.65, 1.5, 0.5, 0.5, 90, -90), line(0.65, 2, 0, 2)), 'Slide right.', 'Curve forward.', 'Slide left.') }],
  C: [S(arc(0.95, 1, 0.95, 1, 45, 315), 'Start near the top.', 'Curve back.')],
  D: [DOWN(0), S(path(line(0, 0, 0.5, 0), arc(0.5, 1, 0.85, 1, 90, -90), line(0.5, 2, 0, 2)), 'Lift.', 'Slide right.', 'Curve forward.', 'Slide left.')],
  G: [S(arc(0.95, 1, 0.95, 1, 45, 360), 'Start near the top.', 'Curve back.'), S(line(1.9, 1, 1.1, 1), 'Slide left.')],
  J: [S(path(line(1, 0, 1, 1.5), arc(0.55, 1.5, 0.45, 0.5, 0, -180)), 'Start at the top.', 'Pull down.', 'Hook back.')],
  K: [DOWN(0), S(line(1.2, 0, 0, 1.1), 'Lift.', 'Start on the right.', 'Slant down.'), S(line(0.3, 0.825, 1.25, 2), 'Slant down.')],
  M: [DOWN(0), S(poly([0, 0], [0.75, 1.5], [1.5, 0], [1.5, 2]), 'Lift.', 'Slant down.', 'Slant up.', 'Pull down.')],
  N: [DOWN(0), S(poly([0, 0], [1.3, 2], [1.3, 0]), 'Lift.', 'Slant down.', 'Push up.')],
  O: [RING(0.95, 0.95)],
  P: [DOWN(0), BOWL(0, 0.6)],
  Q: [RING(0.95, 0.95), S(line(1.05, 1.4, 1.75, 2.15), 'Lift.', 'Slant down.')],
  R: [DOWN(0), BOWL(0, 0.6), S(line(0.5, 1, 1.3, 2), 'Slant down.')],
  S: [S(path(arc(0.75, 0.5, 0.7, 0.5, 30, 270), arc(0.75, 1.5, 0.7, 0.5, 90, -150)), 'Start near the top.', 'Curve back.', 'Curve forward.')],
  U: [S(path(line(0, 0, 0, 1.3), arc(0.65, 1.3, 0.65, 0.7, 180, 360), line(1.3, 1.3, 1.3, 0)), 'Start at the top.', 'Pull down.', 'Curve forward.', 'Push up.')],
  V: [S(poly([0, 0], [0.7, 2], [1.4, 0]), 'Start at the top.', 'Slant down.', 'Slant up.')],
  W: [S(poly([0, 0], [0.45, 2], [0.9, 0], [1.35, 2], [1.8, 0]), 'Start at the top.', 'Slant down.', 'Slant up.', 'Slant down.', 'Slant up.')],
  X: [S(line(0, 0, 1.3, 2), 'Start at the top.', 'Slant down.'), S(line(1.3, 0, 0, 2), 'Lift.', 'Start on the right.', 'Slant down.')],
  Y: [S(line(0, 0, 0.65, 1), 'Start at the top.', 'Slant down.'), S(line(1.3, 0, 0.65, 1), 'Lift.', 'Start on the right.', 'Slant down.'), S(line(0.65, 1, 0.65, 2), 'Pull down.')],
  Z: [S(poly([0, 0], [1.3, 0], [0, 2], [1.3, 2]), 'Start at the top.', 'Slide right.', 'Slant down.', 'Slide right.')],
};

const NUMBER: Record<string, Raw[]> = {
  0: [RING(0.6, 0.6)],
  1: [DOWN(0)],
  2: [S(path(arc(0.6, 0.55, 0.52, 0.52, 160, -35), line(1.026, 0.848, 0, 2), line(0, 2, 1.2, 2)), 'Start near the top.', 'Curve forward.', 'Slant down.', 'Slide right.')],
  3: [S(path(arc(0.55, 0.5, 0.5, 0.5, 150, -90), arc(0.55, 1.5, 0.55, 0.5, 90, -150)), 'Start near the top.', 'Curve forward.', 'Curve forward.')],
  4: [S(path(line(0.1, 0, 0.1, 1.25), line(0.1, 1.25, 1.3, 1.25)), 'Start at the top.', 'Pull down.', 'Slide right.'), S(line(1, 0, 1, 2), 'Lift.', 'Pull down.')],
  5: [S(path(line(0.2, 0, 0.2, 1.15), arc(0.62, 1.45, 0.5, 0.55, 147, -150)), 'Start at the top.', 'Pull down.', 'Curve forward.'), BAR(0.2, 1.05, 0)],
  6: [S(path(arc(1.0, 1.5, 0.95, 1.45, 100, 180), arc(0.55, 1.5, 0.5, 0.5, 180, 520)), 'Start near the top.', 'Curve down.', 'Around and close it.')],
  7: [S(poly([0, 0], [1.2, 0], [0.4, 2]), 'Start at the top.', 'Slide right.', 'Slant down.')],
  8: [S(path(arc(0.55, 0.5, 0.42, 0.5, 30, 270), arc(0.55, 1.5, 0.52, 0.5, 90, -270), arc(0.55, 0.5, 0.42, 0.5, 270, 390)), 'Start near the top.', 'Curve back.', 'Curve forward.', 'Slant up.')],
  9: [S(arc(0.55, 0.55, 0.5, 0.5, 30, 390), 'Start near the top.', 'Circle back all the way around.'), S(line(1.05, 0.55, 1.05, 2), 'Pull down.')],
};

// ---------- the Families, in the order he meets them ----------

/** Letters taught in groups that share a first stroke, as handwriting programs teach them. */
export const FAMILIES: Readonly<Record<FamilyId, readonly string[]>> = {
  lines: ['L', 'T', 'I', 'H', 'E', 'F'],
  c: ['c', 'a', 'd', 'g', 'o', 'q'],
  tall: ['l', 't', 'i', 'j', 'k'],
  bumps: ['r', 'n', 'm', 'h', 'b', 'p'],
  slants: ['v', 'w', 'x', 'y', 'z'],
  rest: ['s', 'e', 'f', 'u'],
  numbers: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
  capitals: ['C', 'O', 'Q', 'G', 'S', 'J', 'D', 'P', 'B', 'R', 'U', 'K', 'A', 'N', 'M', 'V', 'W', 'X', 'Y', 'Z'],
};

export const SIZES: Readonly<Record<Size, string>> = { tall: 'bdfhklt', small: 'acemnorsuvwxzi', tail: 'gjpqy' };

function build(ch: string, raws: Raw[], kind: Letter['kind'], family: FamilyId): Letter {
  const xs = raws.flatMap(r => r.pts.map(p => p[0])), minX = Math.min(...xs), maxX = Math.max(...xs);
  const strokes = raws.map(r => {
    const pts = resample(r.pts.map(([x, y]) => [x - minX, y] as Pt));
    return { pts, dot: !!r.dot, say: r.say, len: r.dot ? 0 : lengthOf(pts) };
  });
  const size = kind === 'lower' ? ((Object.keys(SIZES) as Size[]).find(s => SIZES[s].includes(ch)) ?? null) : null;
  return { ch, kind, family, size, strokes, width: Math.max(0.3, maxX - minX) };
}

const familyOf = (ch: string) => FAMILY_IDS.find(f => FAMILIES[f].includes(ch))!;
export const LETTERS: readonly Letter[] = [
  ...Object.entries(LOWER).map(([ch, r]) => build(ch, r, 'lower', familyOf(ch))),
  ...Object.entries(CAPITAL).map(([ch, r]) => build(ch, r, 'capital', familyOf(ch))),
  ...Object.entries(NUMBER).map(([ch, r]) => build(ch, r, 'number', familyOf(ch))),
];
const BY_CH = new Map(LETTERS.map(l => [l.ch, l]));
export const letter = (ch: string): Letter => { const l = BY_CH.get(ch); if (!l) throw new Error(`No letter ${ch}`); return l; };
export const isLetter = (ch: string) => BY_CH.has(ch);
/** The letters he has met: every letter in the Families he has met. */
export const metLetters = (families: readonly FamilyId[]) => families.flatMap(f => FAMILIES[f]);

/** Where a stroke starts, and where it ends. */
export const startOf = (s: Stroke): Pt => s.pts[0]!;
export const endOf = (s: Stroke): Pt => s.pts.at(-1)!;
/** The direction a stroke sets off in (a unit vector), for "which way does it go first?". */
export function firstWay(s: Stroke): Pt {
  const a = s.pts[0]!, b = s.pts[Math.min(s.pts.length - 1, 4)]!, d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  return [(b[0] - a[0]) / d, (b[1] - a[1]) / d];
}
