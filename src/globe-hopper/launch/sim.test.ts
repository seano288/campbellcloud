// The Launch can't be failed: every rocket reaches orbit with every scripted child, the skilled child is smoother and quicker than the
// clumsy one, and it takes about a minute.
import { describe, expect, it } from 'vitest';
import { createSim, flyWith, smoothness, starsFor, stepSim, takeEvents, TUNING, type LaunchSetup } from './sim';

const setups: LaunchSetup[] = [];
for (const boosters of [false, true]) for (const upper of [false, true]) for (const load of [0, .5, 1]) for (const calm of [false, true]) setups.push({ boosters, upper, load, calm, seed: setups.length + 1 });

describe('the Launch', () => {
  it('reaches orbit with every rocket and every child, and drops every stage but the top one', () => {
    for (const setup of setups) for (const child of ['nothing', 'clumsy', 'skilled'] as const) {
      const s = flyWith(setup, child, setup.seed);
      expect(s.phase, `${JSON.stringify(setup)} ${child}`).toBe('orbit');
      expect(s.stages.length).toBe(1);
    }
  });
  it('takes about a minute for the skilled child, never more than about two and a half for a child who does nothing', () => {
    for (const setup of setups) {
      expect(flyWith(setup, 'skilled', 3).t).toBeLessThan(75);
      expect(flyWith(setup, 'skilled', 3).t).toBeGreaterThan(40);
      expect(flyWith(setup, 'nothing', 3).t).toBeLessThan(TUNING.countdown + TUNING.maxS);
    }
  });
  it('rewards a steady hand: the skilled child earns three stars, the clumsy child fewer and slower', () => {
    for (const setup of setups) {
      const good = flyWith(setup, 'skilled', 5), bad = flyWith(setup, 'clumsy', 5);
      expect(starsFor(smoothness(good))).toBe(3);
      expect(smoothness(bad)).toBeLessThan(smoothness(good));
      expect(bad.t).toBeGreaterThan(good.t);
    }
  });
  it('counts down from ten, then lifts off', () => {
    const s = createSim(setups[0]!);
    const ticks: number[] = [];
    let liftoff = false;
    for (let i = 0; i < 12 * 60; i++) { stepSim(s); for (const e of takeEvents(s)) { if (e.t === 'tick') ticks.push(e.n); if (e.t === 'liftoff') liftoff = true; } }
    expect(ticks).toEqual([10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
    expect(liftoff).toBe(true);
  });
});
