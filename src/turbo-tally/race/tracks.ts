// The tracks. Each is data: a closed centre line and a width, so more can be added cheaply. Most are made from a few waves round a
// circle (`loop()`), which always gives a smooth closed track that never crosses itself; a hand-drawn one can list its points instead.
// Ten Cups of four tracks, one surface each (night city is tarmac, the volcano is rock that wants knobbly tyres like dirt, candy is
// slippery icing like snow, the moon is dust like sand). The last four Cups (added 2026-11-21) are narrower and twistier. Mystery
// tracks are made on the spot from a Level number (`mysteryTrack()`), the same track every time for that Level.
//
// A track is sampled once into evenly spaced points (`laid()`), with the distance along it at each point, which the race uses to
// know how far round each car is.

export interface Pt { readonly x: number; readonly y: number }
export const SURFACES = ['tarmac', 'dirt', 'sand', 'snow'] as const;
export type Surface = (typeof SURFACES)[number];
export const CUP_IDS = ['tarmac', 'dirt', 'sand', 'snow', 'night', 'volcano', 'jungle', 'candy', 'moon', 'rainbow'] as const;
export type CupId = (typeof CUP_IDS)[number];

export const CUPS = [
  { id: 'tarmac', name: 'Tarmac Cup', surface: 'tarmac', icon: '🏁' },
  { id: 'dirt', name: 'Dirt Cup', surface: 'dirt', icon: '🟫' },
  { id: 'sand', name: 'Sand Cup', surface: 'sand', icon: '🏜️' },
  { id: 'snow', name: 'Snow Cup', surface: 'snow', icon: '❄️' },
  { id: 'night', name: 'Night City Cup', surface: 'tarmac', icon: '🌃' },
  { id: 'volcano', name: 'Volcano Cup', surface: 'dirt', icon: '🌋' },
  { id: 'jungle', name: 'Jungle Cup', surface: 'dirt', icon: '🌴' },
  { id: 'candy', name: 'Candy Cup', surface: 'snow', icon: '🍭' },
  { id: 'moon', name: 'Moon Cup', surface: 'sand', icon: '🌙' },
  { id: 'rainbow', name: 'Rainbow Cup', surface: 'tarmac', icon: '🌈' },
] as const satisfies readonly { id: CupId; name: string; surface: Surface; icon: string }[];
export type CupName = (typeof CUPS)[number]['name'];
export const cupOf = (id: CupId) => CUPS.find(c => c.id === id)!;

/** A wave round the circle: `k` bumps, `a` how big (a share of the radius), `p` where it starts. */
type Wave = readonly [k: number, a: number, p: number];
interface Shape { readonly r: number; readonly sx?: number; readonly sy?: number; readonly waves: readonly Wave[]; readonly turn?: number }

/** A closed loop from waves round a circle, `n` points, clockwise on screen. */
export function loop({ r, sx = 1, sy = 1, waves, turn = 0 }: Shape, n = 96): Pt[] {
  return Array.from({ length: n }, (_, i) => {
    const t = (i / n) * Math.PI * 2;
    const k = 1 + waves.reduce((sum, [f, a, p]) => sum + a * Math.cos(f * t + p), 0);
    const x = Math.cos(t) * r * k * sx, y = Math.sin(t) * r * k * sy;
    return { x: x * Math.cos(turn) - y * Math.sin(turn), y: x * Math.sin(turn) + y * Math.cos(turn) };
  });
}

export const TRACK_NAMES = [
  'Sunny Loop', 'Twisty Lane', 'Big Oval', 'Hairpin Park',
  'Muddy Ring', 'Bumpy Trail', 'Dusty Bends', 'Rocky Run',
  'Sandy Bay', 'Dune Loop', 'Cactus Curve', 'Oasis Run',
  'Frosty Ring', 'Snowball Bends', 'Icy Lake', 'Pine Peak',
  'Neon Street', 'Bright Lights', 'Tunnel Town', 'Moon Bridge',
  'Lava Loop', 'Ash Valley', 'Fire Mountain', 'Volcano Crater',
  'Vine Valley', 'Monkey Bridge', 'Waterfall Run', 'Temple Twist',
  'Lollipop Lane', 'Gumdrop Hills', 'Cupcake Curve', 'Chocolate River',
  'Crater Loop', 'Rocket Ring', 'Star Dust Trail', 'Dark Side',
  'Cloud Nine', 'Sky Bridge', 'Sunbeam Spiral', 'Rainbow Road',
] as const;
/** Every Mystery track has this name, and its Level on the screen. */
export const MYSTERY_NAME = 'Mystery Track';
export type TrackName = (typeof TRACK_NAMES)[number] | typeof MYSTERY_NAME;

export interface TrackDef {
  readonly id: string;
  readonly name: TrackName;
  readonly cup: CupId;
  /** Which tyre suits it. */
  readonly surface: Surface;
  /** From wall to wall. */
  readonly width: number;
  readonly centre: readonly Pt[];
}

// Each Cup's four shapes get a little harder: more bends, tighter. Widths stay generous: he is six.
const SHAPES: readonly Shape[] = [
  // Tarmac
  { r: 820, sx: 1.25, sy: .8, waves: [] },
  { r: 860, waves: [[3, .16, .4]] },
  { r: 900, sx: 1.45, sy: .7, waves: [[2, .06, 0]] },
  { r: 860, waves: [[2, .14, .3], [4, .07, 1]] },
  // Dirt
  { r: 840, sx: 1.1, sy: .9, waves: [[3, .1, 1.2]] },
  { r: 880, waves: [[4, .09, 0], [2, .08, 2]] },
  { r: 860, sx: 1.2, sy: .85, waves: [[5, .06, .5]] },
  { r: 900, waves: [[3, .15, 2.1], [5, .04, 0]] },
  // Sand
  { r: 840, sx: 1.3, sy: .75, waves: [[2, .1, 1]] },
  { r: 880, waves: [[3, .12, 0], [6, .03, 1]] },
  { r: 900, sx: 1.15, sy: .9, waves: [[4, .1, .7]] },
  { r: 920, waves: [[2, .16, 2.4], [3, .07, .2]] },
  // Snow
  { r: 860, sx: 1.2, sy: .85, waves: [[2, .08, .2]] },
  { r: 880, waves: [[5, .07, 1.5]] },
  { r: 900, sx: 1.35, sy: .75, waves: [[3, .08, 1]] },
  { r: 920, waves: [[4, .11, 2], [2, .07, .5]] },
  // Night city
  { r: 860, sx: 1.2, sy: .9, waves: [[4, .07, .8]], turn: .3 },
  { r: 880, waves: [[3, .14, 1.1], [6, .03, 0]] },
  { r: 900, sx: 1.4, sy: .72, waves: [[2, .1, .4], [4, .05, 1]] },
  { r: 920, waves: [[5, .08, .3], [2, .06, 1.7]] },
  // Volcano
  { r: 880, sx: 1.15, sy: .9, waves: [[3, .12, .9]] },
  { r: 900, waves: [[4, .1, 1.4], [3, .06, 0]] },
  { r: 920, sx: 1.25, sy: .85, waves: [[5, .07, 2.2]] },
  { r: 940, waves: [[3, .16, .2], [5, .05, 1]] },
  // Jungle
  { r: 920, sx: 1.2, sy: .85, waves: [[3, .13, .6], [5, .04, 1.1]] },
  { r: 940, waves: [[4, .12, 2.2], [2, .08, .3]] },
  { r: 960, sx: 1.3, sy: .8, waves: [[5, .07, 1.4], [3, .05, 0]] },
  { r: 980, waves: [[3, .17, 1.6], [6, .03, .4]] },
  // Candy
  { r: 940, sx: 1.25, sy: .8, waves: [[4, .1, .2], [2, .06, 1]] },
  { r: 960, waves: [[5, .08, 2.4], [3, .07, .9]] },
  { r: 980, sx: 1.15, sy: .9, waves: [[6, .05, .7], [2, .1, 1.9]] },
  { r: 1000, waves: [[4, .13, 1.2], [3, .06, 2.6]] },
  // Moon
  { r: 960, sx: 1.3, sy: .8, waves: [[3, .14, 2], [5, .04, .5]] },
  { r: 980, waves: [[5, .09, .1], [2, .08, 1.3]] },
  { r: 1000, sx: 1.2, sy: .85, waves: [[4, .12, 2.9], [6, .03, 1]] },
  { r: 1020, waves: [[3, .16, .8], [5, .06, 2]] },
  // Rainbow
  { r: 980, sx: 1.25, sy: .82, waves: [[5, .08, 1.7], [3, .08, .2]] },
  { r: 1000, waves: [[4, .13, .5], [6, .03, 2.2]] },
  { r: 1020, sx: 1.3, sy: .8, waves: [[6, .05, 1], [3, .1, 2.5]] },
  { r: 1040, waves: [[5, .09, .9], [3, .12, 1.5], [2, .05, 0]] },
];

export const TRACKS: readonly TrackDef[] = SHAPES.map((shape, i) => {
  const cup = CUPS[Math.floor(i / 4)]!;
  return { id: `t${i + 1}`, name: TRACK_NAMES[i]! as TrackName, cup: cup.id, surface: cup.surface, width: 250 - Math.floor(i / 4) * 6, centre: loop(shape) };
});
export type TrackId = string;
export const tracksIn = (cup: CupId) => TRACKS.filter(t => t.cup === cup);

// ---------- Mystery tracks: made on the spot from a Level ----------

/** The highest Mystery Level there is: far past anything he'll reach, it only keeps the save's numbers sensible. */
export const MYSTERY_TOP = 999;
const MYSTERY_ID = /^m([1-9]\d{0,2})$/;
export const mysteryId = (level: number) => `m${Math.max(1, Math.min(MYSTERY_TOP, Math.round(level)))}`;
export const mysteryLevelOf = (id: string): number | null => { const m = MYSTERY_ID.exec(id); return m ? Number(m[1]) : null; };

/** A small seeded random number source, so a Level's track is the same every time. */
function rng(seed: number) {
  let s = (seed * 2654435761) % 2147483647 || 1;
  return () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
}
/** Walls never meet: any two points far apart along the track stay at least a track and a half apart on the ground (as the tests check). */
export function clearOfItself(centre: readonly Pt[], width: number): boolean {
  const l = laidPoints(centre), n = l.length;
  for (let i = 0; i < n; i += 3) for (let j = i + 1; j < n; j += 3) {
    const along = Math.min(j - i, n - (j - i)) * SPACING;
    if (along < width * 3) continue;
    if (Math.hypot(l[i]!.x - l[j]!.x, l[i]!.y - l[j]!.y) <= width * 1.5) return false;
  }
  return true;
}
const mysteryCache = new Map<number, TrackDef>();
/** Level `level`'s track: any Cup's ground, a few random waves round a circle, a little narrower as the Levels climb. Each Level's
 *  shape is checked before it's used (`clearOfItself`), and a shape that fails is thrown away for the next one from the same seed. */
export function mysteryTrack(level: number): TrackDef {
  const L = Math.max(1, Math.min(MYSTERY_TOP, Math.round(level)));
  const hit = mysteryCache.get(L);
  if (hit) return hit;
  const rand = rng(L * 7 + 3), cup = CUPS[Math.floor(rand() * CUPS.length)]!, width = Math.max(196, 244 - L * 2);
  let centre: Pt[] | null = null;
  for (let tries = 0; tries < 30 && !centre; tries++) {
    const stretch = 1 + rand() * .35, waves: Wave[] = [];
    let bend = 0;
    for (let w = 0, n = 1 + Math.floor(rand() * 3); w < n; w++) {
      const k = 2 + Math.floor(rand() * 5), a = .03 + rand() * (.17 - k * .015);
      if (bend + a * k * k > 2) continue;
      bend += a * k * k;
      waves.push([k, a, rand() * Math.PI * 2]);
    }
    const shape: Shape = { r: 900 + rand() * 140, sx: stretch, sy: 1 / stretch, waves, turn: rand() * Math.PI };
    const pts = loop(shape);
    if (clearOfItself(pts, width)) centre = pts;
  }
  const def: TrackDef = { id: mysteryId(L), name: MYSTERY_NAME, cup: cup.id, surface: cup.surface, width, centre: centre ?? loop({ r: 920, sx: 1.2, sy: .85, waves: [[3, .1, L]] }) };
  mysteryCache.set(L, def);
  return def;
}
export const trackBy = (id: string): TrackDef => { const m = mysteryLevelOf(id); return m !== null ? mysteryTrack(m) : TRACKS.find(t => t.id === id) ?? TRACKS[0]!; };
export const isTrackId = (x: unknown): x is string => typeof x === 'string' && (TRACKS.some(t => t.id === x) || mysteryLevelOf(x) !== null);
export const isMystery = (t: TrackDef) => mysteryLevelOf(t.id) !== null;

// ---------- the laid track: evenly spaced points with the distance round at each ----------

export interface Laid {
  readonly def: TrackDef;
  readonly pts: readonly Pt[];
  /** Distance round at each point; `length` is all the way round. */
  readonly at: readonly number[];
  readonly length: number;
  /** Unit direction of travel at each point. */
  readonly dir: readonly Pt[];
  readonly half: number;
  readonly box: { x0: number; y0: number; x1: number; y1: number };
}

/** A point on a Catmull-Rom curve through the centre line, so the corners are smooth. */
function curve(c: readonly Pt[], i: number, t: number): Pt {
  const n = c.length, p0 = c[(i - 1 + n) % n]!, p1 = c[i % n]!, p2 = c[(i + 1) % n]!, p3 = c[(i + 2) % n]!;
  const t2 = t * t, t3 = t2 * t;
  const f = (a: number, b: number, d: number, e: number) => .5 * (2 * b + (-a + d) * t + (2 * a - 5 * b + 4 * d - e) * t2 + (-a + 3 * b - 3 * d + e) * t3);
  return { x: f(p0.x, p1.x, p2.x, p3.x), y: f(p0.y, p1.y, p2.y, p3.y) };
}

const cache = new Map<string, Laid>();
/** The track laid out every `SPACING` units. */
export const SPACING = 18;
export function laid(def: TrackDef): Laid {
  const hit = cache.get(def.id);
  if (hit) return hit;
  const pts = laidPoints(def.centre);
  const at = pts.map((_, i) => i * SPACING), length = pts.length * SPACING;
  const dir = pts.map((_, i) => {
    const a = pts[(i - 1 + pts.length) % pts.length]!, b = pts[(i + 1) % pts.length]!, d = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    return { x: (b.x - a.x) / d, y: (b.y - a.y) / d };
  });
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y), pad = def.width;
  const out: Laid = { def, pts, at, length, dir, half: def.width / 2, box: { x0: Math.min(...xs) - pad, y0: Math.min(...ys) - pad, x1: Math.max(...xs) + pad, y1: Math.max(...ys) + pad } };
  cache.set(def.id, out);
  return out;
}
/** A centre line smoothed and resampled every SPACING units. */
function laidPoints(centre: readonly Pt[]): Pt[] {
  const def = { centre };
  const fine: Pt[] = [];
  for (let i = 0; i < def.centre.length; i++) for (let s = 0; s < 8; s++) fine.push(curve(def.centre, i, s / 8));
  // resample evenly
  const pts: Pt[] = [fine[0]!];
  let carry = 0;
  for (let i = 1; i <= fine.length; i++) {
    const a = fine[i - 1]!, b = fine[i % fine.length]!, d = Math.hypot(b.x - a.x, b.y - a.y);
    let used = 0;
    while (carry + (d - used) >= SPACING) {
      const step = SPACING - carry;
      used += step;
      carry = 0;
      const k = used / d;
      pts.push({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k });
    }
    carry += d - used;
  }
  if (Math.hypot(pts[pts.length - 1]!.x - pts[0]!.x, pts[pts.length - 1]!.y - pts[0]!.y) < SPACING * .5) pts.pop();
  return pts;
}

/** The nearest point of the track to (x, y), looking near `hint` (a point index) when given. */
export function nearest(t: Laid, x: number, y: number, hint: number | null = null, reach = 14): { i: number; d: number; along: number; side: number } {
  const n = t.pts.length;
  let best = 0, bestD = Infinity;
  const look = (i: number) => { const p = t.pts[i]!, d = (p.x - x) ** 2 + (p.y - y) ** 2; if (d < bestD) { bestD = d; best = i; } };
  if (hint === null) for (let i = 0; i < n; i++) look(i);
  else for (let k = -reach; k <= reach; k++) look((hint + k + n) % n);
  // refine between the two neighbours
  const p = t.pts[best]!, dir = t.dir[best]!, dx = x - p.x, dy = y - p.y;
  const ahead = Math.max(-SPACING, Math.min(SPACING, dx * dir.x + dy * dir.y));
  const side = dx * -dir.y + dy * dir.x; // >0 on the right of the direction of travel... measured with y down
  return { i: best, d: Math.abs(side), along: (t.at[best]! + ahead + t.length) % t.length, side };
}

/** The point `ahead` units further round from index i, moved `lane` units to the side. */
export function pointAhead(t: Laid, i: number, ahead: number, lane = 0): Pt {
  const n = t.pts.length, j = (i + Math.round(ahead / SPACING) + n * 4) % n, p = t.pts[j]!, d = t.dir[j]!;
  return { x: p.x - d.y * lane, y: p.y + d.x * lane };
}
