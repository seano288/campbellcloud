// The tracks. Each is data: a closed centre line and a width, so more can be added cheaply. Most are made from a few waves round a
// circle (`loop()`), which always gives a smooth closed track that never crosses itself; a hand-drawn one can list its points instead.
// Six Cups of four tracks, one surface each (night city is tarmac, the volcano is rock that wants knobbly tyres like dirt).
//
// A track is sampled once into evenly spaced points (`laid()`), with the distance along it at each point, which the race uses to
// know how far round each car is.

export interface Pt { readonly x: number; readonly y: number }
export const SURFACES = ['tarmac', 'dirt', 'sand', 'snow'] as const;
export type Surface = (typeof SURFACES)[number];
export const CUP_IDS = ['tarmac', 'dirt', 'sand', 'snow', 'night', 'volcano'] as const;
export type CupId = (typeof CUP_IDS)[number];

export const CUPS = [
  { id: 'tarmac', name: 'Tarmac Cup', surface: 'tarmac', icon: '🏁' },
  { id: 'dirt', name: 'Dirt Cup', surface: 'dirt', icon: '🟫' },
  { id: 'sand', name: 'Sand Cup', surface: 'sand', icon: '🏜️' },
  { id: 'snow', name: 'Snow Cup', surface: 'snow', icon: '❄️' },
  { id: 'night', name: 'Night City Cup', surface: 'tarmac', icon: '🌃' },
  { id: 'volcano', name: 'Volcano Cup', surface: 'dirt', icon: '🌋' },
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
] as const;
export type TrackName = (typeof TRACK_NAMES)[number];

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
];

export const TRACKS: readonly TrackDef[] = SHAPES.map((shape, i) => {
  const cup = CUPS[Math.floor(i / 4)]!;
  return { id: `t${i + 1}`, name: TRACK_NAMES[i]!, cup: cup.id, surface: cup.surface, width: 250 - Math.floor(i / 4) * 6, centre: loop(shape) };
});
export type TrackId = string;
export const trackBy = (id: string) => TRACKS.find(t => t.id === id) ?? TRACKS[0]!;
export const isTrackId = (x: unknown): x is string => typeof x === 'string' && TRACKS.some(t => t.id === x);
export const tracksIn = (cup: CupId) => TRACKS.filter(t => t.cup === cup);

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
