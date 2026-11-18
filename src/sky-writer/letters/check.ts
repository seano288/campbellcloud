// The stroke checker. No handwriting recogniser: a letter is its strokes (strokes.ts), and each time his finger lifts, the path it drew
// is walked along the stroke he is on.
//
//   - A stroke passes when the finger starts near its start, goes along it in order while staying in the lane, and gets near its end.
//     The lane narrows with the Level. Write It and Write a Word use the same checker with the lane hidden and wide, and the letter free
//     to sit anywhere along the lines (only its height is fixed by the lines).
//   - He may keep his finger down from one stroke into the next, as handwriting does ("pull down, push up, back up and over"): going
//     back along a stroke he has drawn on the way to the next one's start is fine, and so is lifting.
//   - Only two things are a miss: starting in the wrong place (a real try at the letter from somewhere else on it: the bottom of a tall
//     line, the round part of b first, the cross of t first) and going the wrong way (along the letter backwards: a circle going
//     forward instead of back, a line pushed up instead of pulled down). Either must be a real piece of writing along the letter
//     (MISS_LEN), so a slip or a tap never is.
//   - Anything else just rubs out and he tries again: a wobble out of the lane, a tap, a scribble away from the letter. A lift partway
//     along a stroke keeps what he drew, and he can carry on from there.
//
// The numbers (Tuning) were set with scripted fingers (check.test.ts: clean, wobbly, fast and slow, lifting, wrong-start and wrong-way)
// and still need tuning with him on the iPad (.scratch/sky-writer/spec.md).
import { endOf, startOf, type Letter, type Pt, type Stroke } from './strokes';

export interface Tuning {
  /** How far from the stroke's path the finger may go, in line units (the small letters are 1 tall). */
  readonly lane: number;
  /** How near its start a stroke must begin. */
  readonly startR: number;
  /** A stroke may also begin this far along itself (he started a little in). */
  readonly accept: number;
  /** How near its end a stroke must reach. */
  readonly endR: number;
  /** Write It: the letter can sit anywhere along the lines; only its height is fixed. */
  readonly free: boolean;
}

/** Trace It's three Levels narrow the lane; writing from memory has a wide one, hidden. */
export const TUNING = {
  1: { lane: 0.42, startR: 0.45, accept: 0.5, endR: 0.22, free: false },
  2: { lane: 0.34, startR: 0.38, accept: 0.42, endR: 0.2, free: false },
  3: { lane: 0.28, startR: 0.34, accept: 0.36, endR: 0.18, free: false },
  write: { lane: 0.45, startR: 0.5, accept: 0.5, endR: 0.22, free: true },
} as const satisfies Record<string, Tuning>;

/** A path shorter than this is a tap. */
export const TAP = 0.12;
/** How much real writing along the letter a miss needs. */
export const MISS_LEN = 0.7;
/** A wrong start must be at least this far from the right one (nearer is just a rub-out). */
export const MISS_START = 0.6;

export interface Progress {
  /** Strokes finished. */
  readonly done: number;
  /** Where the letter sits across the lines (Write It); 0 when traced; null until his first stroke places it. */
  readonly dx: number | null;
  /** A stroke he lifted from partway, and how far along it he got. */
  readonly partial: { readonly stroke: number; readonly u: number } | null;
  /** His last try rubbed out. Then a stroke from further on in the letter is him carrying on as if it had counted, not a wrong start. */
  readonly rubbed?: boolean;
}
export const startProgress = (t: Tuning): Progress => ({ done: 0, dx: t.free ? null : 0, partial: null });

export type Why = 'start' | 'way';
export type Rub = 'tap' | 'away' | 'lane' | 'lift';
export interface Result {
  readonly progress: Progress;
  /** Strokes this path finished. */
  readonly finished: readonly number[];
  /** What happened to the rest: nothing (it all counted), a rub-out, or a miss on a stroke. */
  readonly outcome: { kind: 'ok' } | { kind: 'rubout'; why: Rub } | { kind: 'miss'; why: Why; stroke: number };
}

// ---------- geometry ----------

const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const shift = (p: Pt, dx: number): Pt => [p[0] - dx, p[1]];
export const travel = (path: readonly Pt[]) => path.reduce((s, p, i) => (i ? s + dist(p, path[i - 1]!) : 0), 0);
/** Arc length at a sample (they are evenly spaced). */
const arcAt = (s: Stroke, i: number) => (s.pts.length > 1 ? (i / (s.pts.length - 1)) * s.len : 0);
const indexAt = (s: Stroke, u: number) => (s.pts.length > 1 ? Math.max(0, Math.min(s.pts.length - 1, Math.round((u / s.len) * (s.pts.length - 1)))) : 0);

/** The nearest sample of a stroke to a point, between two arc lengths. */
function nearest(s: Stroke, p: Pt, from = 0, to = Infinity): { i: number; d: number } {
  let best = { i: 0, d: Infinity };
  const lo = indexAt(s, Math.max(0, from)), hi = to === Infinity ? s.pts.length - 1 : indexAt(s, Math.min(s.len, to));
  for (let i = lo; i <= hi; i++) { const d = dist(s.pts[i]!, p); if (d < best.d) best = { i, d }; }
  return best;
}
function tangent(s: Stroke, i: number): Pt {
  const a = s.pts[Math.max(0, i - 1)]!, b = s.pts[Math.min(s.pts.length - 1, i + 1)]!, d = dist(a, b) || 1;
  return [(b[0] - a[0]) / d, (b[1] - a[1]) / d];
}
/** Is a point on any of these strokes (within the lane)? */
const onAny = (strokes: readonly Stroke[], p: Pt, lane: number) => strokes.some(s => !s.dot && nearest(s, p).d <= lane);

// ---------- following one stroke ----------

type Follow = { kind: 'done'; end: number } | { kind: 'lane' | 'lift'; u: number };

/** Walks the path from index j along the stroke, starting u along it. Progress only moves forward, and never further than the finger
 *  has travelled (so a shortcut across a circle doesn't count). */
function follow(s: Stroke, path: readonly Pt[], j: number, u0: number, t: Tuning, dx: number): Follow {
  let u = u0, since = 0, out = 0;
  for (let m = j; m < path.length; m++) {
    const p = shift(path[m]!, dx), seg = m > j ? dist(path[m]!, path[m - 1]!) : 0;
    since += seg;
    const n = nearest(s, p, u - 0.3, u + 0.12 + since * 1.6);
    if (n.d <= t.lane) { const a = arcAt(s, n.i); if (a > u) { u = a; since = 0; } out = 0; }
    else { out += seg; if (n.d > t.lane * 1.6 || out > 0.25) return { kind: 'lane', u }; }
    if (u >= s.len - t.endR) return { kind: 'done', end: m };
  }
  return { kind: 'lift', u };
}

/** Where along the path a stroke can begin, and how far along the stroke: near its start, a little way in, or where he lifted from.
 *  Everything before it must be on the letter (going back along a stroke he drew is how one stroke runs into the next). */
function entry(L: Letter, k: number, path: readonly Pt[], i: number, t: Tuning, dx: number, partial: Progress['partial']): { j: number; u: number } | null {
  const s = L.strokes[k]!, allowed = L.strokes.slice(0, k + 1), drawn = L.strokes.slice(0, k);
  for (let j = i; j < path.length; j++) {
    const p = shift(path[j]!, dx);
    if (dist(p, startOf(s)) <= t.startR) {
      // near the start: carry on to the nearest point to it, while he is still near it or going back along what he drew (he may have
      // overshot the last stroke's end and be coming back up to this one's start)
      let best = j, bestD = dist(p, startOf(s)), went = 0;
      for (let m = j + 1; m < path.length && went < 1.5; m++) {
        const q = shift(path[m]!, dx), d = dist(q, startOf(s));
        went += dist(path[m]!, path[m - 1]!);
        if (d > t.startR && !onAny(drawn, q, t.lane)) break;
        if (d < bestD - 0.01) { best = m; bestD = d; }
      }
      return { j: best, u: 0 };
    }
    const n = nearest(s, p);
    if (n.d <= t.lane && arcAt(s, n.i) <= t.accept) return { j, u: arcAt(s, n.i) };
    if (partial?.stroke === k) { const q = nearest(s, p, partial.u - 0.3, partial.u + t.startR); if (q.d <= t.startR) return { j, u: Math.min(partial.u, arcAt(s, q.i)) }; }
    // a lead-in: going back along a stroke already drawn (or this one) to get there
    if (!onAny(allowed, p, t.lane)) return null;
  }
  return null;
}

// ---------- telling a real wrong try from a slip ----------

/** Was this a real try along the letter, from the wrong place or the wrong way? `startedRight`: it began where it should, so it can
 *  only be the wrong way. `from`: strokes before this are already drawn, and going back along them is a lead-in, not a mistake. */
export function judge(L: Letter, t: Tuning, path: readonly Pt[], dx: number, from: number, startedRight: boolean, carryOn = false): { why: Why; stroke: number } | null {
  const strokes = L.strokes.map((s, k) => ({ s, k })).filter(x => !x.s.dot && x.k >= from);
  if (!strokes.length || path.length < 2) return null;
  const fwd = new Map<number, number>(), back = new Map<number, number>();
  let on = 0;
  for (let m = 1; m < path.length; m++) {
    const a = shift(path[m - 1]!, dx), b = shift(path[m]!, dx), seg = dist(a, b);
    if (!seg) continue;
    const mid: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    let best: { k: number; i: number; d: number } | null = null;
    for (const { s, k } of strokes) { const n = nearest(s, mid); if (!best || n.d < best.d) best = { k, i: n.i, d: n.d }; }
    // going back along a stroke he has drawn: neither for nor against
    const drawn = L.strokes.slice(0, from).some(s => !s.dot && nearest(s, mid).d < best!.d);
    if (!best || best.d > t.lane * 1.2 || drawn) continue;
    const tg = tangent(L.strokes[best.k]!, best.i), along = ((b[0] - a[0]) * tg[0] + (b[1] - a[1]) * tg[1]);
    on += seg;
    if (along > 0) fwd.set(best.k, (fwd.get(best.k) ?? 0) + along); else back.set(best.k, (back.get(best.k) ?? 0) - along);
  }
  const all = travel(path), sum = (x: Map<number, number>) => [...x.values()].reduce((a, b) => a + b, 0);
  const top = (x: Map<number, number>) => [...x.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? from;
  if (on < MISS_LEN || on < 0.6 * all) return null;
  const backs = sum(back);
  if (backs >= 0.55 * on && backs >= MISS_LEN * 0.8) {
    // just after a rub-out, a path that goes the right way along a later stroke is him carrying on, not going backwards
    if (carryOn && L.strokes.some((s, k) => k > from && !s.dot && alongOne(s, path, dx, t.lane) >= 0.6 * all)) return null;
    return { why: 'way', stroke: top(back) };
  }
  if (startedRight) return null;
  const expected = L.strokes[from];
  if (expected && dist(shift(path[0]!, dx), startOf(expected)) < MISS_START) return null;
  return sum(fwd) >= MISS_LEN ? { why: 'start', stroke: top(fwd) } : null;
}

/** How far the path goes the right way along one stroke (going back along it counts against). */
function alongOne(s: Stroke, path: readonly Pt[], dx: number, lane: number) {
  let net = 0;
  for (let m = 1; m < path.length; m++) {
    const a = shift(path[m - 1]!, dx), b = shift(path[m]!, dx), n = nearest(s, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]);
    if (n.d > lane * 1.2) continue;
    const tg = tangent(s, n.i);
    net += (b[0] - a[0]) * tg[0] + (b[1] - a[1]) * tg[1];
  }
  return net;
}

/** Write It, before the letter has a place: try every place along the lines where his start would sit on the letter, and keep the
 *  clearest wrong try (or none). */
function judgeFree(L: Letter, t: Tuning, path: readonly Pt[], from: number): { why: Why; stroke: number; dx: number } | null {
  const [x0, y0] = path[0]!, tried = new Set<number>();
  let best: { why: Why; stroke: number; dx: number } | null = null;
  for (const s of L.strokes) for (const q of s.pts) {
    if (Math.abs(q[1] - y0) > 0.12) continue;
    const dx = Math.round((x0 - q[0]) * 10) / 10;
    if (tried.has(dx)) continue;
    tried.add(dx);
    const j = judge(L, t, path, dx, from, false);
    if (j && (!best || (j.why === 'way' && best.why === 'start'))) best = { ...j, dx };
  }
  return best;
}

/** Where the path leaves the end of the stroke before k (its wobble as it ended isn't a try at the next one), or -1. */
function leftEnd(L: Letter, t: Tuning, path: readonly Pt[], i: number, dx: number, k: number) {
  const last = endOf(L.strokes[k - 1]!);
  for (let m = i; m < path.length; m++) if (dist(shift(path[m]!, dx), last) > t.lane + t.endR) return Math.max(i, m - 1);
  return -1;
}

// ---------- one lift of his finger ----------

/** What a path from finger-down to finger-up did to the letter. */
export function feed(L: Letter, t: Tuning, prog: Progress, path: readonly Pt[]): Result {
  const finished: number[] = [];
  let done = prog.done, dx = prog.dx, partial = prog.partial;
  const result = (outcome: Result['outcome'], keepDx = finished.length > 0 || outcome.kind === 'ok'): Result =>
    ({ progress: { done, dx: keepDx || prog.dx !== null ? dx : null, partial, rubbed: outcome.kind === 'rubout' && outcome.why !== 'tap' ? true : outcome.kind === 'ok' ? false : !!prog.rubbed }, finished, outcome });
  /** A wrong start right after a rub-out isn't one (see `rubbed`). */
  const fair = (m: { why: Why; stroke: number } | null) => (m && m.why === 'start' && prog.rubbed ? null : m);
  if (!path.length || done >= L.strokes.length) return result({ kind: 'rubout', why: 'tap' }, false);

  // a tap: a dot, if a dot is next and it's in its place
  if (travel(path) < TAP) {
    const s = L.strokes[done]!;
    if (s.dot && dx !== null && dist(shift(path[0]!, dx), startOf(s)) <= t.startR * 1.3) { finished.push(done); done++; partial = null; return result({ kind: 'ok' }); }
    return result({ kind: 'rubout', why: s.dot ? 'away' : 'tap' }, false);
  }

  // Write It: where the letter sits comes from where he starts it, if he starts it at the right height
  if (dx === null) {
    const st = startOf(L.strokes[done]!);
    if (Math.abs(path[0]![1] - st[1]) <= t.startR) dx = path[0]![0] - st[0];
    else {
      const m = prog.rubbed ? null : judgeFree(L, t, path, done); // a guess at where the letter sits: not after a rub-out
      return m ? { progress: prog, finished, outcome: { kind: 'miss', why: m.why, stroke: m.stroke } } : result({ kind: 'rubout', why: 'away' }, false);
    }
  }

  let i = 0;
  while (done < L.strokes.length && i < path.length) {
    const k = done, s = L.strokes[k]!;
    if (s.dot) break; // a dot needs its own tap
    const e = entry(L, k, path, i, t, dx, partial);
    if (!e) break;
    const f = follow(s, path, e.j, e.u, t, dx);
    if (f.kind === 'done') { finished.push(k); done++; partial = null; i = f.end + 1; continue; }
    // it didn't make it along: the wrong way, or a slip
    // (Write It doesn't guess here where else the letter might sit: a straight line pulled down can always be "explained" as one
    // pushed up somewhere else on the letter, so a wobbly right stroke would be called the wrong way.)
    const from = finished.length ? leftEnd(L, t, path, i, dx, k) : i;
    const m = from < 0 ? null : judge(L, t, path.slice(from), dx, k, true, !!prog.rubbed);
    if (m) return result({ kind: 'miss', why: m.why, stroke: m.stroke });
    if (f.kind === 'lift') { partial = { stroke: k, u: Math.max(f.u, partial?.stroke === k ? partial.u : 0) }; return result({ kind: 'rubout', why: 'lift' }, true); }
    return result({ kind: 'rubout', why: 'lane' });
  }
  const rest = path.slice(Math.max(0, i - 1));
  if (done >= L.strokes.length || travel(rest) < TAP) return result({ kind: 'ok' });
  if (i === 0) {
    // nothing he drew counted: a try from the wrong place or the wrong way, or just a slip
    const m = fair(judge(L, t, path, dx, done, false, !!prog.rubbed) ?? (prog.dx === null && !prog.rubbed ? judgeFree(L, t, path, done) : null));
    return m ? result({ kind: 'miss', why: m.why, stroke: m.stroke }, false) : result({ kind: 'rubout', why: 'away' }, false);
  }
  // after strokes that counted, only a clear wrong-way try on what comes next is a miss (not the wobble as the last one ended);
  // anything else is ignored
  const from = leftEnd(L, t, path, Math.max(0, i - 1), dx, done);
  const m = from < 0 ? null : judge(L, t, path.slice(from), dx, done, true);
  return m ? result({ kind: 'miss', ...m }) : result({ kind: 'ok' });
}

/** Where the next stroke starts on the lines, for the start dot (Write It: once the letter has a place). */
export function nextStart(L: Letter, prog: Progress): Pt | null {
  const s = L.strokes[prog.done];
  if (!s || prog.dx === null) return null;
  const p = startOf(s);
  return [p[0] + prog.dx, p[1]];
}
export { endOf };
