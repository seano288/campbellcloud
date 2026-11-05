import { beforeAll, describe, expect, it } from 'vitest';
import { Fight, initPhysics } from './sim';
import { createStepper, nothingHeard, reached } from './timeline';

const SECONDS = 26, STEPS = SECONDS * 120;
function run(seed: number, tap: (at: number) => boolean, taps: number[] = []) {
  const f = new Fight(seed, 40), s = createStepper(f, taps);
  for (let i = 0; i < STEPS; i++) { if (tap(i)) s.tap(); s.step(); }
  const events = f.events.map((e: { t: number; type: string; J: number }) => `${e.t.toFixed(4)} ${e.type} ${e.J.toFixed(2)}`);
  f.world.free();
  return { events, taps };
}

describe('a rebuilt fight', () => {
  beforeAll(() => initPhysics());
  it('comes out the same with his taps replayed', () => {
    const first = run(7, i => i === 700 || i === 1300);
    expect(first.taps).toEqual([700, 1300]);
    const again = run(7, () => false, [...first.taps]);
    expect(again.events).toEqual(first.events);
  });
  it('a tap really changes the fight, so replaying it matters', () => {
    expect(run(7, i => i === 700).events).not.toEqual(run(7, () => false).events);
  });
});

describe('hearing events', () => {
  const E = (t: number, type: string) => ({ t, type });
  it('gives each event once, up to now', () => {
    const list = [E(1, 'drum'), E(2, 'hammer'), E(3, 'drum')], heard = nothingHeard();
    expect(reached(list, heard, 1.5).map(e => e.t)).toEqual([1]);
    expect(reached(list, heard, 1.5)).toEqual([]);
    expect(reached(list, heard, 9).map(e => e.t)).toEqual([2, 3]);
  });
  it('keeps two events on the same step', () => {
    expect(reached([E(1, 'drum'), E(1, 'ko')], nothingHeard(), 2).map(e => e.type)).toEqual(['drum', 'ko']);
  });
  it('does not repeat what a rebuilt fight moved earlier, or skip what it moved later', () => {
    const heard = nothingHeard();
    reached([E(1, 'drum'), E(2, 'drum')], heard, 2.5);
    expect(reached([E(1.01, 'drum'), E(1.9, 'drum'), E(3, 'hammer')], heard, 4).map(e => e.t)).toEqual([3]);
  });
  it('always hears the knockout, once, even if a rebuilt fight moved it behind the picture', () => {
    const heard = nothingHeard();
    reached([E(5, 'drum')], heard, 5);
    expect(reached([E(4, 'ko')], heard, 6).map(e => e.type)).toEqual(['ko']);
    expect(reached([E(4, 'ko')], heard, 7)).toEqual([]);
  });
});
