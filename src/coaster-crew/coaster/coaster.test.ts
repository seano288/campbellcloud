// The coaster obeys the Rounds: speed from the height it has fallen, less a little lost to the track; a hill taller than it can climb makes
// it roll back. And the endless layer: thousands of Guest Coasters, each the same from its number, each run from end to end.
import { describe, expect, it } from 'vitest';
import { ALL_PIECES, afterPiece, fitsAfter, heights, MAX_H, PIECES, PRIZE_PIECES } from './pieces';
import { build, check } from './track';
import { guest, guestLength, guestPaint, MAX_GUEST_LENGTH, prizeFor, PRIZE_EVERY, PRIZES } from './guest';
import { rideWith } from '../ride/ride';

describe('pieces', () => {
  it('each fits only where its shape does: a drop needs height under it, a splash pool sits on the ground, nothing goes above the sky', () => {
    for (const p of ALL_PIECES) for (let h = 0; h <= MAX_H; h++) {
      const after = afterPiece(p.geo, h);
      if (after === null) continue;
      expect(after).toBeGreaterThanOrEqual(0);
      expect(after).toBeLessThanOrEqual(MAX_H);
      if (p.geo.g === 'splash') expect(h).toBe(0);
    }
    expect(fitsAfter([], 'pc:drop2')).toBe(false);
    expect(fitsAfter(['pc:lift3'], 'pc:drop2')).toBe(true);
    expect(fitsAfter(['pc:lift3'], 'pc:splash')).toBe(false);
    expect(heights(['pc:lift5', 'pc:drop3', 'pc:hump2'])).toEqual([5, 2, 2]);
  });
  it('are about fifty, in families, each named once', () => {
    expect(PIECES.length + PRIZE_PIECES.length).toBeGreaterThanOrEqual(50);
    expect(new Set(ALL_PIECES.map(p => p.name)).size).toBe(ALL_PIECES.length);
  });
});

describe('the coaster obeys the Rounds', () => {
  it('a taller lift and drop make it faster', () => {
    expect(check(['pc:lift7', 'pc:drop7']).topSpeed).toBeGreaterThan(check(['pc:lift3', 'pc:drop2']).topSpeed);
  });
  it('a hill as tall as the lift rolls it back on that hill; a lower one is got over', () => {
    expect(check(['pc:lift3', 'pc:drop2', 'pc:hump2']).backAt?.index).toBe(2);
    expect(check(['pc:lift5', 'pc:drop3', 'pc:hump2']).backAt).toBeNull();
    expect(check(['pc:lift3', 'pc:drop3', 'pc:loop']).backAt).toBeNull();
    expect(check(['pc:lift3', 'pc:drop2', 'pc:bigloop']).backAt?.index).toBe(2);
  });
  it('a booster in front of a hill too tall gets it over', () => {
    expect(check(['pc:lift3', 'pc:drop3', 'pc:camel4']).backAt).not.toBeNull();
    expect(check(['pc:lift3', 'pc:drop3', 'pc:boost', 'pc:camel4']).backAt).toBeNull();
  });
  it('a splash pool slows it a lot', () => {
    const a = check(['pc:lift5', 'pc:drop5', 'pc:splash', 'pc:camel4']), b = check(['pc:lift5', 'pc:drop5', 'pc:straight', 'pc:camel4']);
    expect(b.backAt).toBeNull();
    expect(a.backAt).not.toBeNull();
  });
  it('always comes home: every track ends with a run down to the ground, the brakes and the station', () => {
    const b = build(['pc:lift7', 'pc:climb2']);
    expect(b.spans.at(-1)!.id).toBe('station');
    expect(b.spans.at(-2)!.id).toBe('home-brakes');
    expect(b.profile.pts.at(-1)![1]).toBeCloseTo(0);
  });
  it('the Thrill number grows with speed, drop and loops', () => {
    const small = check(['pc:lift3', 'pc:drop2']), big = check(['pc:lift9', 'pc:drop9', 'pc:loop']);
    expect(big.thrill).toBeGreaterThan(small.thrill);
    expect(big.inversions).toBe(1);
  });
});

describe('Guest Coasters, the endless layer', () => {
  const N = 3000, gs = Array.from({ length: N }, (_, i) => guest(i + 1));
  it('are the same every time for the same number', () => {
    for (const n of [1, 7, 99, 500, 2999]) expect(JSON.stringify(guest(n))).toBe(JSON.stringify(gs[n - 1]));
  });
  it('run from end to end without rolling back, every one of thousands', () => {
    for (const g of gs) { const c = check(g.pieces); expect(c.backAt, `Guest Coaster ${g.n}: ${g.pieces.join(' ')}`).toBeNull(); expect(heights(g.pieces).every(h => h !== null)).toBe(true); }
  }, 240_000);
  it('get a little longer and wilder, up to what a Ride can carry', () => {
    expect(guestLength(1)).toBeLessThan(guestLength(30));
    expect(Math.max(...gs.map(g => g.pieces.length))).toBeLessThanOrEqual(MAX_GUEST_LENGTH);
    const inv = (from: number, to: number) => gs.slice(from, to).reduce((n, g) => n + check(g.pieces).inversions, 0) / (to - from);
    expect(inv(200, 300)).toBeGreaterThan(inv(0, 30));
    expect(new Set(gs.map(g => g.pieces.join())).size).toBeGreaterThan(N * .95);
  }, 60_000);
  it('can each be ridden to the end by a child who does nothing, a clumsy one and a skilled one (every 25th, all three)', () => {
    for (const g of gs.filter(x => x.n % 25 === 1)) for (const child of ['nothing', 'clumsy', 'skilled'] as const) {
      const st = rideWith(g.pieces, child, g.n);
      expect(st.phase, `${g.n} ${child}`).toBe('done');
      expect(st.t).toBeLessThan(90);
    }
  }, 120_000);
  it('every fifth gives a prize that is never sold: the prize pieces and cars, then numbered Guest Paints without end', () => {
    for (let n = 1; n <= 5000; n++) expect(!!prizeFor(n)).toBe(n % PRIZE_EVERY === 0);
    expect(PRIZES.length).toBe(20);
    expect(prizeFor(5)).toEqual(PRIZES[0]);
    expect(prizeFor(100)).toEqual(PRIZES[19]);
    expect(prizeFor(105)).toEqual({ kind: 'paint', id: 'gp:1', k: 1 });
    const paints = new Set(Array.from({ length: 2000 }, (_, k) => JSON.stringify(guestPaint(k + 1))));
    expect(paints.size).toBe(2000);
  });
});
