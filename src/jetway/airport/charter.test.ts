// The endless layer: a few thousand Charters generated, each the same on a reload, each laid out properly (the far airport's parts never
// overlap and fit beside its runway, the stars sit in the band he can fly in), each a little longer than the last up to a ceiling,
// every one flown to its end by a child who does nothing and the clumsy child, and a Charter-only prize every fifth, never sold.
import { describe, expect, it } from 'vitest';
import { seeded } from '../../game/rng';
import { clumsyChild, flyWith, idleChild, MAX_S, STEP } from '../flight/sim';
import { FOR_SALE } from './catalog';
import { charter, CHARTER_PRIZES, charterDistance, prizeById, prizeFor, PRIZE_EVERY, TOWNS } from './charter';
import { SKY_HIGH, SKY_LOW } from './routes';

const N = 3000;
const setupFor = (n: number) => ({ dest: charter(n), ability: 'none' as const, speed: 1, runway: 900, approachLights: false, taxi: null });

describe('Charter Flights', () => {
  it(`${N} of them: the same Charter for the same number, every time`, () => {
    for (let n = 1; n <= N; n += 7) expect(JSON.stringify(charter(n))).toBe(JSON.stringify(charter(n)));
    expect(JSON.stringify(charter(5))).not.toBe(JSON.stringify(charter(6)));
  });
  it(`${N} of them are laid out properly: far airport parts apart and beside the runway, stars where he can fly`, () => {
    for (let n = 1; n <= N; n++) {
      const c = charter(n), parts = c.far.parts;
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i]!;
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.x + p.w).toBeLessThanOrEqual(c.far.runway);
        for (let j = i + 1; j < parts.length; j++) { const q = parts[j]!; expect(p.x + p.w <= q.x || q.x + q.w <= p.x, `charter ${n}`).toBe(true); }
      }
      for (const s of c.stars) { expect(s.alt).toBeGreaterThanOrEqual(SKY_LOW); expect(s.alt).toBeLessThanOrEqual(SKY_HIGH); expect(s.x).toBeGreaterThan(0); expect(s.x).toBeLessThan(c.distance); }
      expect(c.wind).toBeLessThanOrEqual(.8);
      expect(TOWNS).toContain(c.town);
    }
  });
  it('each is a little longer than the last, to a ceiling', () => {
    for (let n = 2; n <= N; n++) expect(charterDistance(n)).toBeGreaterThanOrEqual(charterDistance(n - 1));
    expect(charterDistance(N)).toBeLessThanOrEqual(9000);
    expect(charterDistance(40)).toBeGreaterThan(charterDistance(1));
  });
  it(`${N} of them are flown to the end by a child who does nothing, and every tenth by the clumsy child`, () => {
    for (let n = 1; n <= N; n++) {
      const f = flyWith(setupFor(n), idleChild, seeded(n), STEP * 3);
      expect(f.phase, `charter ${n}`).toBe('done');
      expect(f.t).toBeLessThan(MAX_S);
    }
    for (let n = 1; n <= N; n += 10) expect(flyWith(setupFor(n), clumsyChild, seeded(n), STEP * 3).phase, `charter ${n}`).toBe('done');
  }, 120_000);
  it('every fifth brings a Charter-only prize, never sold, without end', () => {
    const ids = new Set<string>();
    for (let n = 1; n <= N; n++) {
      const p = prizeFor(n);
      expect(!!p).toBe(n % PRIZE_EVERY === 0);
      if (!p) continue;
      expect(ids.has(p.id)).toBe(false);
      ids.add(p.id);
      expect(prizeById(p.id)).toEqual(p);
      expect(FOR_SALE.some(i => i.id === p.id)).toBe(false);
    }
    expect(ids.size).toBe(N / PRIZE_EVERY);
    expect(prizeFor(PRIZE_EVERY * CHARTER_PRIZES.length)!.id).toBe(CHARTER_PRIZES.at(-1)!.id);
    expect(prizeFor(PRIZE_EVERY * (CHARTER_PRIZES.length + 1))!.name).toBe('Charter Tail');
  });
});
