// The endless layer: generated Missions, the Voyage's charts and the Yard's ships. Thousands of each, made twice: the same every time,
// each one playable and finished by the scripted children, a little harder than the last to a ceiling, and the prizes every fifth Mission
// all different and never for sale.
import { describe, expect, it } from 'vitest';
import { AIRCRAFT, FOR_SALE, MODELS } from './catalog';
import { LOOKS, yardShip } from './fleet';
import { chart, FIXED_COUNT, jobOf, mission, PRIZE_EVERY, prizeById, prizeFor } from './missions';
import { createSim, deckLength, flyWith, type MissionSetup } from '../mission/sim';
import { setupFor } from '../mission/setup';
import { bought, freshShip, payFor, planMission, finishMission, earnMission, type ShipState } from './ship';

const N = 3000;
const gen = Array.from({ length: N }, (_, i) => mission(FIXED_COUNT + 1 + i));
const plain = (n: number, model = MODELS[n % MODELS.length]!): MissionSetup => {
  const m = mission(n), spec = AIRCRAFT[model];
  return { job: m.job, subject: m.subject, count: m.count, wind: m.wind, seed: m.seed, speed: spec.speed, hover: spec.hover, deckLen: deckLength(n % 9), wires: 2 + (n % 3), angled: n % 2 === 0, skiJump: n % 5 === 0, calm: n % 7 === 0 };
};

describe('generated Missions', () => {
  it('are the same every time for the same number', () => {
    for (const m of gen.slice(0, 500)) expect(mission(m.n)).toEqual(m);
  });
  it('never have the same job twice running', () => {
    for (let n = FIXED_COUNT + 2; n < FIXED_COUNT + N; n++) expect(jobOf(n), String(n)).not.toBe(jobOf(n - 1));
  });
  it('get a little harder, then hold: more to do and windier, to a ceiling', () => {
    expect(gen.at(-1)!.count).toBeGreaterThan(gen[0]!.count);
    for (const m of gen) { expect(m.count).toBeLessThanOrEqual(9); expect(m.wind).toBeLessThanOrEqual(.8); }
  });
  it('can all be flown to the end: each one by the child who does nothing, every tenth by the clumsy child and the skilled child', () => {
    for (const m of gen) {
      const s = flyWith(plain(m.n), 'nothing', m.n);
      expect(s.phase, String(m.n)).toBe('done');
      if (m.n % 10 === 0) for (const child of ['clumsy', 'skilled'] as const) expect(flyWith(plain(m.n), child, m.n).phase, `${m.n} ${child}`).toBe('done');
    }
  }, 120_000);
  it('every fifth brings a prize: all different, each found by its id, and none for sale', () => {
    const prizes = gen.filter(m => m.prize).map(m => m.prize!);
    expect(prizes.length).toBe(Math.floor(N / PRIZE_EVERY));
    expect(new Set(prizes.map(p => p.id)).size).toBe(prizes.length);
    for (const p of prizes) expect(prizeById(p.id)).toEqual(p);
    const sale = new Set(FOR_SALE.map(i => i.id));
    for (const p of prizes) expect(sale.has(p.id)).toBe(false);
    for (const m of gen) expect(!!m.prize).toBe((m.n - FIXED_COUNT) % PRIZE_EVERY === 0);
    expect(prizeFor(FIXED_COUNT)).toBeNull();
  });
  it('lay their things out in order along the way, with room to fly between them', () => {
    for (const m of gen.slice(0, 600)) {
      const s = createSim(setupFor(m, 'rescue', freshShip()));
      const xs = [...s.targets.map(t => t.x), ...s.islands.map(i => i.x), ...s.rafts.map(r => r.x)];
      expect(xs.length).toBeGreaterThan(0);
      for (let i = 1; i < xs.length; i++) expect(xs[i]! - xs[i - 1]!).toBeGreaterThan(300);
      expect(s.stern).toBeGreaterThan(Math.max(...xs));
    }
  });
});

describe('the Voyage', () => {
  it('draws a new chart for every six Missions, the same each time, with a name the voice can say', () => {
    const names = new Set<string>();
    for (let n = 1; n <= 600; n++) {
      const c = chart(n);
      expect(chart(n)).toEqual(c);
      if (n > 6) { expect(c.name).toBe(`${c.first} ${c.second}`); names.add(c.name); }
    }
    expect(names.size).toBeGreaterThan(200);
  });
});

describe('the Yard', () => {
  it('always has a new ship, the same for the same number, and none the same as another', () => {
    const seen = new Set<string>();
    for (let n = 1; n <= 5000; n++) {
      const s = yardShip(n);
      expect(yardShip(n)).toEqual(s);
      seen.add(JSON.stringify(s.look));
    }
    expect(seen.size).toBe(5000);
    expect(LOOKS).toBeGreaterThan(50000);
  });
  it('a ship bought from the Yard joins his Fleet, and the next one is new', () => {
    let a: ShipState = { ...freshShip(), owned: [...freshShip().owned, 'part:hull1', 'fleet:tug'] };
    a = bought(a, { kind: 'more', id: 'yard' });
    a = bought(a, { kind: 'more', id: 'yard' });
    expect(a.yard).toEqual([1, 2]);
  });
});

describe('a long run of Missions', () => {
  it('flies the hand-made ones in order, then generated ones without end', () => {
    let a = freshShip();
    const flown: number[] = [];
    for (let i = 0; i < 200; i++) {
      a = earnMission(a);
      const plan = planMission(a), res = { stars: 2 as const, wire: 1, grade: 2 as const };
      a = finishMission(a, plan, res, payFor(a, plan, res));
      flown.push(plan.m.n);
    }
    expect(new Set(flown).size).toBe(flown.length);
    expect(Math.max(...flown)).toBeGreaterThan(FIXED_COUNT + 100);
  });
});
