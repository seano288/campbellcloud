// A coaster's track from its pieces: the station, his pieces in order, then (always) a gentle run back down to the ground, the brakes
// and the station again. The shape is turned into a profile for the one motion model (physics/motion.ts), which says where the car would
// stop and roll back, how fast it goes and how high its drops are. The builder, the Ride and the Guest Coasters all read it from here.
import { lengthOf, pointAt, profile, rollsBackAt, step as stepFor, type Profile, type Zone } from '../physics/motion';
import { heights, inversions, pieceOf, STEP, type Geo } from './pieces';

/** Rolling resistance of a coaster's wheels on its rails: small, so a little speed is lost all the way round. */
export const TRACK_RESISTANCE = 0.012;
/** The station's tyres push the car out at this speed; the chain lifts it at this speed, and creeps over the top. */
export const STATION_SPEED = 2.5, CHAIN_SPEED = 4, CREST_CREEP = 1.4;
/** The car must keep at least this speed over every crest it climbs by itself, or it is said to roll back. */
export const CREST_SPEED = 1.2;
const STATION_L = 16, RUNOUT_BRAKE_L = 18;

export interface Span {
  /** Which piece of his track (-1: the station; -2: the run back home). */
  readonly index: number;
  readonly id: string;
  readonly from: number; readonly to: number;
  readonly h0: number; readonly h1: number;
  readonly x0: number; readonly x1: number;
  readonly geo: Geo;
}
export interface Built {
  readonly profile: Profile;
  readonly spans: readonly Span[];
  /** Where the first chain ends: the top of the lift, where the car waits for the lever. */
  readonly liftTop: number | null;
  /** Pieces that fit, up to the first that doesn't. */
  readonly fitted: number;
  /** Where the home brakes start: reaching them is getting all the way round. */
  readonly home: number;
}

const EASE = (u: number) => (1 - Math.cos(Math.PI * u)) / 2;
const SAMPLES = 18;

/** Points for one piece starting at (x, y) metres; returns the points (excluding the start) and its zones relative to its own start. */
function shape(geo: Geo, x: number, y: number): { pts: [number, number][]; zones: { kind: Zone['kind']; a: number; b: number; speed?: number; resistance?: number }[] } {
  const pts: [number, number][] = [];
  const curve = (run: number, rise: number, f: (u: number) => number, n = SAMPLES) => { for (let i = 1; i <= n; i++) { const u = i / n; pts.push([x + run * u, y + rise * f(u)]); } };
  switch (geo.g) {
    case 'lift': {
      const rise = (geo.to * STEP) - y, run = rise / Math.tan(36 * Math.PI / 180);
      pts.push([x + 6, y]);
      for (let i = 1; i <= SAMPLES; i++) { const u = i / SAMPLES; pts.push([x + 6 + run * u, y + rise * u]); }
      pts.push([x + 6 + run + 4, y + rise], [x + 6 + run + 8, y + rise]);
      // the chain climbs briskly, then creeps over the top: he lets it go from there, with almost no speed of its own
      const total = 6 + Math.hypot(run, rise) + 8, top = (6 + Math.hypot(run, rise)) / total;
      return { pts, zones: [{ kind: 'chain', a: 0, b: top, speed: CHAIN_SPEED }, { kind: 'chain', a: top, b: 1, speed: CREST_CREEP }] };
    }
    case 'drop': { const d = geo.d * STEP; curve(d * (geo.steep ? .62 : 1.05) + 6, -d, EASE); return { pts, zones: [] }; }
    case 'hump': { const u = geo.u * STEP; curve(u * 2.6 + 10, u, t => (1 - Math.cos(2 * Math.PI * t)) / 2, SAMPLES * 2); return { pts, zones: [] }; }
    case 'climb': { const u = geo.u * STEP; curve(u * 1.6 + 6, u, EASE); return { pts, zones: [] }; }
    case 'dip': { const d = geo.d * STEP; curve(d * 2.6 + 10, -d, t => (1 - Math.cos(2 * Math.PI * t)) / 2, SAMPLES * 2); return { pts, zones: [] }; }
    case 'loop': {
      const R = geo.r * STEP, shift = R * .7;
      let cx = x + 8;
      pts.push([cx, y]);
      for (let k = 0; k < geo.n; k++) {
        const n = 48;
        for (let i = 1; i <= n; i++) {
          const t = -Math.PI / 2 + (2 * Math.PI * i) / n;
          pts.push([cx + R * Math.cos(t) + shift * (i / n), y + R + R * Math.sin(t)]);
        }
        cx += shift + 4;
        pts.push([cx, y]);
      }
      pts.push([cx + 8, y]);
      return { pts, zones: [] };
    }
    case 'twist': {
      const u = geo.u * STEP, run = 22 * geo.turns + u * 2;
      if (u > 0) curve(run, u, t => (1 - Math.cos(2 * Math.PI * t)) / 2, SAMPLES * 2);
      else pts.push([x + run, y]);
      return { pts, zones: [{ kind: 'drag', a: 0, b: Infinity, resistance: 0.02 + 0.006 * geo.turns }] };
    }
    case 'flat': {
      pts.push([x + geo.l, y]);
      const zones: ReturnType<typeof shape>['zones'] = [];
      if (geo.drag) zones.push({ kind: 'drag', a: 0, b: Infinity, resistance: geo.drag });
      if (geo.boost) zones.push({ kind: 'boost', a: 0, b: Infinity, speed: geo.boost });
      if (geo.brake) zones.push({ kind: 'brake', a: 0, b: Infinity, speed: geo.brake });
      return { pts, zones };
    }
    case 'splash': {
      // down into the pool, through the water, up and out
      const dep = 3.2, w = geo.l;
      for (let i = 1; i <= SAMPLES; i++) { const u = i / SAMPLES; pts.push([x + w * .3 * u, y - dep * EASE(u)]); }
      pts.push([x + w * .7, y - dep]);
      for (let i = 1; i <= SAMPLES; i++) { const u = i / SAMPLES; pts.push([x + w * .7 + w * .3 * u, y - dep + dep * EASE(u)]); }
      return { pts, zones: [{ kind: 'drag', a: .2, b: .8, resistance: 0.25 }] };
    }
  }
}

/** Builds the track for these pieces. Pieces that don't fit (which the builder never offers) end the track where they would start. */
export function build(ids: readonly string[]): Built {
  const pts: [number, number][] = [[0, 0]];
  const zones: Zone[] = [];
  const spans: Span[] = [];
  const lenNow = () => { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i]![0] - pts[i - 1]![0], pts[i]![1] - pts[i - 1]![1]); return L; };
  let L = 0;
  const add = (index: number, id: string, geo: Geo, h0: number, h1: number) => {
    const [x, y] = pts[pts.length - 1]!, from = L, sh = shape(geo, x, y);
    pts.push(...sh.pts);
    L = lenNow();
    for (const z of sh.zones) {
      const a = from + (L - from) * Math.min(1, z.a), b = z.b === Infinity ? L : from + (L - from) * Math.min(1, z.b);
      if (z.kind === 'chain' || z.kind === 'boost' || z.kind === 'brake') zones.push({ kind: z.kind, from: a, to: b, speed: z.speed! });
      else zones.push({ kind: 'drag', from: a, to: b, resistance: z.resistance! });
    }
    spans.push({ index, id, from, to: L, h0, h1, x0: x, x1: pts[pts.length - 1]![0], geo });
  };
  add(-1, 'station', { g: 'flat', l: STATION_L, look: 'straight' }, 0, 0);
  zones.push({ kind: 'boost', from: 0, to: STATION_L, speed: STATION_SPEED });
  const hs = heights(ids);
  let h = 0, fitted = 0;
  for (let i = 0; i < ids.length; i++) {
    const next = hs[i];
    if (next === null || next === undefined) break;
    add(i, ids[i]!, pieceOf(ids[i]!).geo, h, next);
    h = next; fitted++;
  }
  // home: a gentle run back down, the brakes, the station
  if (h > 0) add(-2, 'home-drop', { g: 'drop', d: h }, h, 0);
  add(-2, 'home-brakes', { g: 'flat', l: RUNOUT_BRAKE_L, look: 'brakes', brake: 4 }, 0, 0);
  add(-2, 'station', { g: 'flat', l: STATION_L, look: 'straight', brake: 1.5 }, 0, 0);
  const lift = spans.find(s => s.geo.g === 'lift');
  const home = spans.find(s => s.id === 'home-brakes')!;
  return { profile: profile(pts, TRACK_RESISTANCE, zones), spans, liftTop: lift ? lift.to - 8 : null, fitted, home: home.from };
}

export interface Check {
  /** Null when the car gets all the way round; else the piece where it would stop and roll back (an index into his pieces), and where. */
  readonly backAt: { readonly index: number; readonly s: number } | null;
  readonly topSpeed: number;
  /** Metres. */
  readonly tallestDrop: number;
  readonly inversions: number;
  readonly thrill: number;
}
export const START = { s: 0, v: STATION_SPEED };

/** Drops measured on the track itself: from each high point to the next low point. */
function tallestDropOf(b: Built): number {
  const pts = b.profile.pts;
  let best = 0, high = pts[0]![1];
  for (let i = 1; i < pts.length; i++) {
    const y = pts[i]![1];
    if (y > high) high = y;
    best = Math.max(best, high - y);
    // a climb back up starts a new drop from its top
    if (i + 1 < pts.length && pts[i + 1]![1] > y) high = y;
  }
  return best;
}

/** Runs the car round (as the Ride does, never failing it) and measures it. */
export function check(ids: readonly string[], built: Built = build(ids)): Check {
  const at = rollsBackAt(built.profile, START, CREST_SPEED, built.home);
  const backAt = at === null ? null : (() => { const sp = built.spans.find(s => at >= s.from && at < s.to) ?? built.spans[built.spans.length - 1]!; return { index: sp.index, s: at }; })();
  // top speed: the fastest the car goes on the way round (in m/s)
  let top = 0;
  {
    let c = { ...START };
    const L = lengthOf(built.profile), dt = 1 / 60;
    for (let t = 0; t < 400 && c.s < L; t += dt) {
      for (let k = 0; k < 2; k++) c = stepFor(built.profile, c, dt / 2);
      if (c.v <= 0) break;
      top = Math.max(top, c.v);
    }
  }
  const inv = built.spans.filter(s => s.index >= 0).reduce((n, s) => n + inversions(s.geo), 0);
  const tallestDrop = tallestDropOf(built);
  return { backAt, topSpeed: top, tallestDrop, inversions: inv, thrill: thrillOf(top, tallestDrop, inv) };
}

/** The Thrill number: top speed in km/h, plus half the tallest drop in metres, plus eight for each time it turns upside down. */
export const thrillOf = (topSpeed: number, tallestDrop: number, inv: number) => Math.round(topSpeed * 3.6 + tallestDrop / 2 + inv * 8);
export const kmh = (v: number) => Math.round(v * 3.6);

export { pointAt };
