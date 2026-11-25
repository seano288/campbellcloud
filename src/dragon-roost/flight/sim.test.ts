// The Flight can't be failed and can always be finished: the 24 places and thousands of generated Flights, each flown to the end by a
// child who does nothing, a clumsy one and a skilled one. The skilled child lights every beacon (so every beacon can be reached), nobody
// ever goes into the land, and every Flight takes about a minute.
import { describe, expect, it } from 'vitest';
import { course, difficulty, FIXED_FLIGHTS, groundAt, PLACES } from './course';
import { flyWith, resultOf, startSim, step, STARTER_FLY, TUNING, type FlyWith } from './sim';

const GEN = 3000;
const ALL_TRICKS: FlyWith = { ...STARTER_FLY, tricks: (['zoom', 'ring', 'blaze', 'magnet', 'float', 'hop'] as const).map(effect => ({ effect, power: 1.2 })) };

describe('the Flights', () => {
  it('are the same for the same number, and there are 24 places first', () => {
    expect(PLACES).toHaveLength(24);
    for (const n of [1, 5, 24, 25, 100, 2999]) expect(course(n)).toEqual(course(n));
    expect(course(25).name).toBeNull();
    expect(new Set(PLACES.map(p => p.name)).size).toBe(24);
  });
  it('get a little longer and fuller, then hold', () => {
    expect(difficulty(200).length).toBeGreaterThan(difficulty(1).length);
    expect(difficulty(5000)).toEqual(difficulty(200));
    expect(difficulty(5000).length / TUNING.speed).toBeLessThan(80);
  });
  it('every beacon sits on the land, a castle or a post, under the sky', () => {
    for (let n = 1; n <= GEN; n++) {
      const c = course(n);
      for (const b of c.beacons) { expect(b.y).toBeLessThan(82); expect(b.y).toBeGreaterThanOrEqual(groundAt(c, b.x) + 2 - .01); }
    }
  }, 120_000);
  it('a child who does nothing finishes every one, never in the land', () => {
    for (let n = 1; n <= GEN; n++) {
      const c = course(n), s = startSim(c);
      let low = Infinity;
      while (!s.done) { step(s, 1 / 30, { target: null, breath: false, trick: null }); low = Math.min(low, s.y - groundAt(c, s.x)); }
      expect(s.x, String(n)).toBeGreaterThanOrEqual(c.length);
      expect(low).toBeGreaterThanOrEqual(TUNING.clearance - .01);
      expect(s.t).toBeLessThan(85);
    }
  }, 300_000);
  it('a skilled child lights every beacon of every one; a clumsy child finishes and lights some', () => {
    const missed: number[] = [];
    for (let n = 1; n <= GEN; n++) {
      const c = course(n), s = flyWith(c, 'skilled', n % 3 ? STARTER_FLY : ALL_TRICKS, n);
      if (resultOf(s).lit !== c.beacons.length) missed.push(n);
      if (n % 10 === 0) { const k = flyWith(c, 'clumsy', ALL_TRICKS, n); expect(k.done).toBe(true); }
    }
    expect(missed).toEqual([]);
  }, 300_000);
  it('the places are each flown to the end and lit by the skilled child', () => {
    for (let n = 1; n <= FIXED_FLIGHTS; n++) expect(resultOf(flyWith(course(n), 'skilled')).lit).toBe(course(n).beacons.length);
  });
  it('a speed trick is what beats a racing bird', () => {
    let withZoom = 0, without = 0;
    for (let n = 3; n < 200; n++) {
      withZoom += resultOf(flyWith(course(n), 'skilled', { ...STARTER_FLY, tricks: [{ effect: 'zoom', power: 1 }] }, n)).birds;
      without += resultOf(flyWith(course(n), 'skilled', STARTER_FLY, n)).birds;
    }
    expect(without).toBe(0);
    expect(withZoom).toBeGreaterThan(150);
  });
});
