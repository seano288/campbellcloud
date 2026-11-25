// The endless layer: Shows generated from their number. Thousands, made twice: the same every time, every one playable (its things fit in
// its length, a little longer than the last or the same, never shorter), a Show Cup every fifth, and every one clearable with the truck a
// child who buys the cheapest new thing first would own when he reaches it. The three scripted children of the build guide's
// "Competition" are measured against them, and the numbers printed for the spec.
import { describe, expect, it } from 'vitest';
import { jumpWith, TUNING, type Child } from '../jump/sim';
import { OBSTACLES, ROW_GAP, ROWS } from './catalog';
import { CUP_EVERY, cupFor, show, showFeet } from './shows';
import { play } from './play';
import type { Stats } from './arena';

const N = 3000;
const shows = Array.from({ length: N }, (_, i) => show(i + 1));
// the truck he has when he first reaches each Show (from the economy run); past the run's end, the last truck it had
const run = play(2100), at = new Map<number, Stats>();
for (const j of run.jumps) if (j.target.kind === 'show' && !at.has(j.target.n)) at.set(j.target.n, j.stats);
const last = run.jumps.at(-1)!.stats;
const rowTruck = new Map<number, Stats>();
for (const j of run.jumps) if (j.target.kind === 'row' && !rowTruck.has(j.target.n)) rowTruck.set(j.target.n, j.stats);
const truckAt = (n: number) => at.get(n) ?? last;
/** How many tries a child needs to clear Show n with the truck he'd have by then: 1 is the first try. */
function tries(n: number, child: Child, most = TUNING.helpSure + 1): number {
  const s = shows[n - 1]!, t = truckAt(n);
  for (let k = 0; k < most; k++) if (jumpWith({ ...t, wind: s.wind, help: k, row: s.feet }, child).feet >= s.feet) return k + 1;
  return Infinity;
}

describe('generated Shows', () => {
  it('are the same every time for the same number', () => {
    for (const s of shows.slice(0, 500)) expect(show(s.n)).toEqual(s);
  });
  it('are each playable: their things fit in their length, and they never get shorter', () => {
    for (const s of shows) {
      const used = s.parts.reduce((t, [k, c]) => t + c * (OBSTACLES[k].len + ROW_GAP), 0);
      expect(used).toBeLessThanOrEqual(s.feet);
      expect(used).toBeGreaterThan(s.feet * .6);
      expect(s.parts.every(([, c]) => c >= 1)).toBe(true);
      expect(new Set(s.parts.map(([k]) => k)).size, `Show ${s.n}`).toBe(s.parts.length);
      if (s.n > 1) expect(s.feet).toBeGreaterThanOrEqual(showFeet(s.n - 1));
    }
    expect(showFeet(N * 10)).toBeGreaterThan(showFeet(N));
  });
  it('give a Show Cup every fifth Show, numbered, without end', () => {
    for (let n = 1; n <= 5000; n++) expect(!!cupFor(n)).toBe(n % CUP_EVERY === 0);
    expect(shows[4]!.cup?.n).toBe(1);
  });
  it('can each be cleared with the truck he could own by then: the skilled child within two tries, the clumsy child within three', () => {
    for (let n = 1; n <= N; n += n < 200 ? 1 : 7) {
      expect(tries(n, 'skilled'), `Show ${n}`).toBeLessThanOrEqual(2);
      expect(tries(n, 'clumsy'), `Show ${n}`).toBeLessThanOrEqual(3);
    }
  }, 120_000);
  it('every child clears every Show in the end: doing nothing never at the first try, and never more than six tries', () => {
    for (let n = 1; n <= N; n += n < 100 ? 1 : 13) {
      const t = tries(n, 'nothing');
      expect(t, `Show ${n}`).toBeGreaterThan(1);
      expect(t, `Show ${n}`).toBeLessThanOrEqual(TUNING.helpSure + 1);
    }
  }, 120_000);
  it('every hand-made Row can be cleared with the truck he has when he gets to it: skilled within two tries, clumsy within three, doing nothing in the end', () => {
    expect(rowTruck.size).toBe(ROWS.length);
    for (const r of ROWS) {
      const t = rowTruck.get(r.n)!, go = (child: Child) => { for (let k = 0; k < 20; k++) if (jumpWith({ ...t, wind: 0, help: k, row: r.feet }, child).feet >= r.feet) return k + 1; return Infinity; };
      expect(go('skilled'), r.name).toBeLessThanOrEqual(2);
      expect(go('clumsy'), r.name).toBeLessThanOrEqual(3);
      const idle = go('nothing');
      expect(idle, r.name).toBeGreaterThan(1);
      expect(idle, r.name).toBeLessThanOrEqual(TUNING.helpSure + 1);
    }
  });
  it('the skilled child clears about two in three at the first try, not all of them; doing nothing does not clear them', () => {
    const ns = [...at.keys()].filter(n => n < 60 || n % 3 === 0); // every Show early on, then every third
    const first = ns.filter(n => tries(n, 'skilled', 1) === 1).length / ns.length;
    const clumsy = ns.filter(n => tries(n, 'clumsy', 1) === 1).length / ns.length;
    const nothing = ns.filter(n => tries(n, 'nothing', 3) <= 3).length / ns.length;
    const later = ns.filter(n => n > 400), laterFirst = later.filter(n => tries(n, 'skilled', 1) === 1).length / later.length;
    console.log(`Shows reached in 2,100 Rounds: ${at.size} (${ns.length} measured). First-try clears: skilled ${(first * 100).toFixed(0)}% (Shows past 400: ${(laterFirst * 100).toFixed(0)}%), clumsy ${(clumsy * 100).toFixed(0)}%; doing nothing within three tries: ${(nothing * 100).toFixed(0)}%`);
    expect(first).toBeGreaterThan(.55); expect(first).toBeLessThan(.85);
    expect(laterFirst).toBeLessThan(.9);
    expect(nothing).toBeLessThan(.05);
  }, 120_000);
});
