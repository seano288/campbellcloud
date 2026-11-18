// The spoken stroke words must describe what the plane flies in a lesson (its stroke, and for "Push up." and "Back up and over." the
// push back up what was just drawn): a letter taught with words that don't match the smoke is taught wrong.
import { describe, expect, it } from 'vitest';
import { LETTERS, leadIn, type Letter, type Pt, type StrokeWord } from './strokes';

/** What the plane flies for stroke k: its lead-in (if any), then the stroke. */
const flight = (L: Letter, k: number): Pt[] => [...leadIn(L, k), ...L.strokes[k]!.pts];
const runs = (pts: readonly Pt[]) => pts.slice(1).map((p, i) => [p[0] - pts[i]![0], p[1] - pts[i]![1]] as Pt);
/** How far the flight goes in a direction (unit vector) along pieces that point within ~35° of it. */
const goes = (pts: readonly Pt[], [ux, uy]: Pt) => runs(pts).reduce((s, [dx, dy]) => { const d = Math.hypot(dx, dy), c = d ? (dx * ux + dy * uy) / d : 0; return c > 0.82 ? s + d : s; }, 0);
/** Turning, in degrees: on the screen (y down) negative is counterclockwise ("back"), positive clockwise ("forward"). */
function turning(pts: readonly Pt[]) {
  let t = 0;
  const r = runs(pts).filter(([dx, dy]) => Math.hypot(dx, dy) > 1e-6);
  for (let i = 1; i < r.length; i++) { const a = Math.atan2(r[i - 1]![1], r[i - 1]![0]), b = Math.atan2(r[i]![1], r[i]![0]); let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; if (Math.abs(d) < 1) t += d; }
  return (t * 180) / Math.PI;
}
const DOWN: Pt = [0, 1], UP: Pt = [0, -1], RIGHT: Pt = [1, 0], LEFT: Pt = [-1, 0];
const slant = (pts: readonly Pt[], down: boolean) => runs(pts).reduce((s, [dx, dy]) => (Math.abs(dx) > 0.15 * Math.abs(dy) && Math.abs(dy) > 0.25 * Math.abs(dx) && (down ? dy > 0 : dy < 0) ? s + Math.hypot(dx, dy) : s), 0);
/** "Curve forward" and "curve back" are Zaner-Bloser's words for a curve setting off to the right (forward, the way writing goes) or to
 *  the left (back): somewhere the flight bends at least 45° while heading that way. */
function curves(pts: readonly Pt[], forward: boolean) {
  for (let i = 0; i + 12 < pts.length; i += 2) {
    const w = pts.slice(i, i + 20), half = w[Math.floor(w.length / 2)]!;
    if (Math.abs(turning(w)) > 45 && (forward ? half[0] - w[0]![0] > 0.05 : half[0] - w[0]![0] < -0.05)) return true;
  }
  return false;
}

const SAYS: Record<StrokeWord, (f: Pt[], L: Letter, k: number) => boolean> = {
  'Start at the top.': f => f[0]![1] < 0.1,
  'Start near the top.': f => f[0]![1] < 0.6,
  'Start at the middle.': f => Math.abs(f[0]![1] - 1) < 0.1,
  'Start near the middle.': f => f[0]![1] >= 0.95 && f[0]![1] <= 1.6,
  'Start on the right.': f => f[0]![0] > f.at(-1)![0] + 0.3,
  'Pull down.': f => goes(f, DOWN) >= 0.4,
  'Pull down below the line.': f => goes(f, DOWN) + slant(f, true) >= 0.8 && Math.max(...f.map(p => p[1])) > 2.4,
  'Push up.': f => goes(f, UP) >= 0.2,
  'Push up to the top.': f => goes(f, UP) >= 0.8 && Math.min(...f.map(p => p[1])) < 0.1,
  'Slide right.': f => goes(f, RIGHT) >= 0.4,
  'Slide left.': f => goes(f, LEFT) >= 0.4,
  'Slant down.': f => slant(f, true) >= 0.5,
  'Slant up.': f => slant(f, false) >= 0.5,
  'Curve back.': f => curves(f, false),
  'Curve forward.': f => curves(f, true),
  'Curve down.': f => goes(f, DOWN) + slant(f, true) >= 0.4 && Math.abs(turning(f)) > 30,
  'Circle back all the way around.': f => turning(f) < -300,
  'Around and close it.': f => Math.abs(turning(f)) > 300,
  'Back up and over.': f => goes(f, UP) + slant(f, false) >= 0.2 && turning(f) > 90,
  'Back up and around.': f => goes(f, UP) + slant(f, false) >= 0.2 && turning(f) > 200,
  'Hook back.': f => turning(f.slice(-25)) > 60,
  'Lift.': (f, L, k) => k > 0 && Math.hypot(f[0]![0] - L.strokes[k - 1]!.pts.at(-1)![0], f[0]![1] - L.strokes[k - 1]!.pts.at(-1)![1]) > 0.1,
  'Cross.': f => goes(f, RIGHT) >= 0.5 && f.every(p => Math.abs(p[1] - 1) < 0.05),
  'Add the dot.': (_f, L, k) => L.strokes[k]!.dot,
};

describe('the stroke words', () => {
  it('describe what the plane flies, for every stroke of every letter, capital and number', () => {
    const bad: string[] = [];
    for (const L of LETTERS) for (const [k, s] of L.strokes.entries()) for (const w of s.say) if (!SAYS[w](flight(L, k), L, k)) bad.push(`${L.ch} stroke ${k + 1}: "${w}"`);
    expect(bad).toEqual([]);
  });
  it('say "Lift." whenever the next stroke starts away from where the last one ended', () => {
    for (const L of LETTERS) for (const [k, s] of L.strokes.entries()) {
      if (!k) continue;
      const a = L.strokes[k - 1]!.pts.at(-1)!, b = s.pts[0]!, apart = Math.hypot(a[0] - b[0], a[1] - b[1]);
      // a stroke that starts on what's drawn (back up the stem, along the bowl) needs no lift; anywhere else does
      const onDrawn = L.strokes.slice(0, k).some(o => o.pts.some(p => Math.hypot(p[0] - b[0], p[1] - b[1]) < 0.06));
      // ("Push up." and "Back up and over." go back up what was drawn first: the plane flies that too)
      if (apart > 0.1 && !onDrawn && !leadIn(L, k).length) expect(s.say[0], `${L.ch} stroke ${k + 1}`).toBe('Lift.');
    }
  });
  it('have the plane push back up what was drawn when the words say so', () => {
    for (const ch of ['a', 'd', 'g', 'q', 'n', 'm', 'h', 'r', 'b', 'p']) {
      const L = LETTERS.find(l => l.ch === ch)!, k = L.strokes.findIndex(s => /^(Push up|Back up)/.test(s.say[0]!));
      expect(k, ch).toBeGreaterThan(0);
      expect(goes(flight(L, k).slice(0, 12), UP), ch).toBeGreaterThan(0.15);
    }
  });
});
