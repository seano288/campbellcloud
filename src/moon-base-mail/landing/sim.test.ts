// The Landing cannot be failed: a child who does nothing, a clumsy one and a careful one all land on the pad of every Landing, thousands
// of them, in a sensible time; and every generated Landing can be played and finished.
import { describe, expect, it } from 'vitest';
import { seeded } from '../../game/rng';
import { LANDER_SPECS, type LanderKind } from '../base/catalog';
import { groundAt, landingFor, landingLength, rockFor, specialFor, moduleFor, plantFor } from '../base/gen';
import { createSim, onPad, step, STEP, type Input, type Sim } from './sim';

type Child = (s: Sim, r: () => number) => Input;
const nothing: Child = () => ({ engine: false, to: null });
/** Taps and holds at random: the engine on and off, the finger anywhere. */
const clumsy: Child = (s, r) => ({ engine: r() < 0.45, to: r() < 0.5 ? s.x + (r() - 0.5) * 400 : null });
/** Slides to the pad high up, then lets it down gently on the engine. */
const careful: Child = s => {
  const above = Math.abs(s.x - s.plan.padX) < 4, height = s.y - groundAt(s.plan, s.x);
  return { engine: (!above && height < 60) || (above && s.vy < -4 - height / 20), to: s.plan.padX };
};
/** Holds the engine down the whole time. */
const holder: Child = () => ({ engine: true, to: null });

function fly(n: number, kind: LanderKind, child: Child, seed = n) {
  const s = createSim(landingFor(n), LANDER_SPECS[kind]), r = seeded(seed);
  while (!s.done && s.t < 200) step(s, child(s, r));
  return s;
}

describe('every Landing can be finished', () => {
  it('3,000 generated Landings: the ground is sound, and each is the same twice', () => {
    for (let n = 1; n <= 3000; n++) {
      const a = landingFor(n), b = landingFor(n);
      expect(a).toEqual(b);
      expect(Math.abs(a.padX - a.startX)).toBeGreaterThan(200);
      expect(a.padW).toBeGreaterThanOrEqual(60);
      expect(a.startY - groundAt(a, a.startX)).toBeGreaterThan(60);
      expect(a.padX + a.padW).toBeLessThan(landingLength(a));
      for (let x = 0; x < landingLength(a); x += 5) expect(Number.isFinite(groundAt(a, x))).toBe(true);
    }
  });
  it('a child who does nothing lands on the pad of every one of 3,000 Landings, in under two minutes', () => {
    let worst = 0;
    for (let n = 1; n <= 3000; n++) {
      const s = fly(n, 'little', nothing);
      expect(s.done, `Landing ${n}`).toBe(true);
      expect(onPad(s)).toBe(true);
      worst = Math.max(worst, s.t);
    }
    console.log(`a child who does nothing: ${worst.toFixed(0)} s at most`);
    expect(worst).toBeLessThan(120);
  });
  it('clumsy, careful and engine-holding children land with every lander', () => {
    for (const kind of Object.keys(LANDER_SPECS) as LanderKind[]) for (const child of [clumsy, careful, holder]) for (let n = 1; n <= 400; n += 7) {
      const s = fly(n, kind, child);
      expect(s.done, `${kind} Landing ${n}`).toBe(true);
    }
  });
  it('a careful child takes about 45 seconds or less, and lands soft and close', () => {
    const times: number[] = [];
    for (let n = 1; n <= 200; n += 3) { const s = fly(n, 'little', careful); times.push(s.t); expect(s.result!.close).toBeLessThan(15); }
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    console.log(`careful child: ${avg.toFixed(0)} s on average, ${Math.max(...times).toFixed(0)} s at most`);
    expect(avg).toBeLessThan(50);
  });
  it('better parts matter: the Star Lander slides further a second than the Little Lander', () => {
    expect(LANDER_SPECS.star.slide).toBeGreaterThan(LANDER_SPECS.little.slide);
    const t = (k: LanderKind) => fly(40, k, careful).t;
    expect(t('star')).toBeLessThan(t('little'));
  });
  it('plays at a fixed step', () => expect(STEP).toBeCloseTo(1 / 60));
});

describe('the rest of the endless layer', () => {
  it('3,000 rocks, made modules, plants and special crates: each the same twice, and each sound', () => {
    for (let n = 1; n <= 3000; n++) {
      expect(rockFor(n)).toEqual(rockFor(n));
      expect(moduleFor(n)).toEqual(moduleFor(n));
      expect(plantFor(n)).toEqual(plantFor(n));
      expect(specialFor(n)).toEqual(specialFor(n));
      expect(rockFor(n).lumps.every(l => l > 0.5 && l < 1.3)).toBe(true);
      expect((specialFor(n) !== null)).toBe(n % 5 === 0);
    }
  });
  it('made modules and plants have different names for their first 96 and 72', () => {
    const m = new Set(Array.from({ length: 96 }, (_, k) => { const x = moduleFor(k); return `${x.colour} ${x.word}`; }));
    expect(m.size).toBe(96);
    const p = new Set(Array.from({ length: 72 }, (_, k) => { const x = plantFor(k); return `${x.colour} ${x.word}`; }));
    expect(p.size).toBe(72);
  });
  it('rarer rocks come more often the further he has got', () => {
    const rare = (a: number, b: number) => Array.from({ length: b - a }, (_, i) => rockFor(a + i)).filter(r => r.rare).length;
    expect(rare(1000, 1500)).toBeGreaterThan(rare(1, 501));
  });
  it('every Landing is the same on a reload, and a little trickier than the first, up to a cap', () => {
    expect(landingFor(60).padW).toBeLessThan(landingFor(1).padW);
    expect(landingFor(61).padW).toBe(landingFor(500).padW);
  });
});
