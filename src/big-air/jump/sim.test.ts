// The Jump can't be failed, and it is fair: every truck and every scripted child finishes the jump and lands on its wheels, the same truck
// and the same inputs always go the same distance (so the Record Board means something and "Watch it" replays a jump exactly), better
// hands and better parts go farther, and the mercy wind grows each try.
import { describe, expect, it } from 'vitest';
import { seeded } from '../../game/rng';
import { createSim, fromTape, inputFor, jumpWith, recorder, replay, stepSim, takeEvents, TUNING, type Child, type Input, type Setup } from './sim';

const base: Setup = { top: 40, accel: 12, runUp: 40, angle: 18, lip: 3, boost: 0, window: 10, tilt: 60, wind: 0, help: 0, row: 14 };
const setups: Setup[] = [];
for (const top of [40, 60, 88]) for (const accel of [12, 22, 31]) for (const [angle, lip] of [[18, 3], [26, 5], [35, 9]] as const) for (const boost of [0, 15, 25])
  setups.push({ ...base, top, accel, angle, lip, boost, runUp: 40 + (top - 40) * 1.8, window: 10 + boost, row: 30 });
const CHILDREN: readonly Child[] = ['nothing', 'clumsy', 'skilled'];

describe('the Jump', () => {
  it('always finishes: every truck, every child, lands back on its wheels, in well under a minute', () => {
    for (const s of setups) for (const child of CHILDREN) {
      const j = jumpWith(s, child);
      expect(j.phase, `${JSON.stringify(s)} ${child}`).toBe('done');
      expect(j.pitch).toBe(0);
      expect(j.feet).toBeGreaterThan(0);
      expect(j.t).toBeLessThan(30);
    }
  });
  it('is the same every time: the same truck and the same inputs give the same distance', () => {
    for (const s of setups.slice(0, 20)) for (const child of CHILDREN) expect(jumpWith(s, child).feet).toBe(jumpWith(s, child).feet);
  });
  it('replays a recorded jump to the foot, from its inputs ("Watch it")', () => {
    for (const [i, s] of setups.entries()) {
      // a jumpy, random-handed child, recorded as the screen records him
      const rng = seeded(i + 1), sim = createSim(s), rec = recorder();
      let held = false, tilt: -1 | 0 | 1 = 0;
      while (sim.phase !== 'done') {
        if (rng() < .05) held = !held;
        if (rng() < .05) tilt = ([-1, 0, 1] as const)[Math.floor(rng() * 3)]!;
        const input: Input = { pedal: held, tilt, boost: rng() < .02 };
        rec.note(sim.steps + 1, input);
        stepSim(sim, input);
      }
      const again = replay(s, rec.tape());
      expect(again.feet).toBe(sim.feet);
      expect(again.landed).toEqual(sim.landed);
    }
    expect(fromTape([[5, 1, 0, 0], [9, 0, -1, 0]], 7)).toEqual({ pedal: true, tilt: 0, boost: false });
  });
  it('rewards better hands: the skilled child goes farthest, the clumsy child next, doing nothing least', () => {
    for (const s of setups) {
      const [n, c, k] = CHILDREN.map(ch => jumpWith(s, ch).feet);
      expect(k).toBeGreaterThan(c!); expect(c).toBeGreaterThan(n!);
    }
  });
  it('rewards better parts: a bigger engine, better tires, a steeper kicker and a booster each go farther', () => {
    const f = (x: Partial<Setup>) => jumpWith({ ...base, ...x }, 'skilled').feet;
    expect(f({ top: 60 })).toBeGreaterThan(f({}));
    expect(f({ accel: 20 })).toBeGreaterThan(f({}));
    expect(f({ angle: 26, lip: 5 })).toBeGreaterThan(f({}));
    expect(f({ boost: 12 })).toBeGreaterThan(f({}));
    expect(f({ runUp: 80 })).toBeGreaterThan(f({}));
  });
  it('the mercy wind grows each try he falls short, and a head wind drops once he has', () => {
    let last = 0;
    for (let help = 0; help < TUNING.helpSure; help++) { const d = jumpWith({ ...base, help, wind: -3, row: 300 }, 'nothing').feet; expect(d).toBeGreaterThan(last); last = d; }
  });
  it('nobody is stuck on a row for ever: a child who touched the pedal clears it after two tries short, anyone after five', () => {
    for (const s of setups) for (const row of [14, 30, 60, 107, 200, 302, 420]) {
      for (const child of CHILDREN) {
        const sure = child === 'nothing' ? TUNING.helpSure : TUNING.helpSureTrying;
        for (let help = sure; help <= sure + 3; help++) {
          const j = jumpWith({ ...s, row, help }, child);
          expect(j.feet, `${child} try ${help + 1} at ${row} ft`).toBeGreaterThanOrEqual(row);
          expect(j.phase).toBe('done');
        }
      }
      // a pedal held badly (only the first fifth of the run-up) still counts as trying
      const early = createSim({ ...s, row, help: TUNING.helpSureTrying });
      while (early.phase !== 'done') stepSim(early, { pedal: early.phase === 'run' && early.t < TUNING.lights + .5, tilt: 0, boost: false });
      expect(early.feet).toBeGreaterThanOrEqual(row);
    }
  });
  it('the mercy wind carries him just past the row, never farther, so a helped jump never sets a record the truck did not earn', () => {
    for (const s of setups) for (const row of [30, 60, 107, 200]) for (const child of CHILDREN) for (let help = 1; help <= 8; help++) {
      const own = jumpWith({ ...s, row, help: 0 }, child).feet, helped = jumpWith({ ...s, row, help }, child).feet;
      // the booster fires after the lip, on top of the wind, so it can still add his own few feet
      const boosted = s.boost * 2.5;
      expect(helped, `${child} try ${help + 1}`).toBeLessThanOrEqual(Math.max(own, row + TUNING.helpPast + 1 + boosted));
      expect(helped).toBeGreaterThanOrEqual(own);
    }
  });
  it('a clean landing needs the nose level: the skilled child lands clean, the child who does nothing often lands on its tail or nose and bounces', () => {
    for (const s of setups) {
      expect(jumpWith(s, 'skilled').landed?.clean, JSON.stringify(s)).toBe(true);
    }
    expect(setups.filter(s => !jumpWith(s, 'nothing').landed?.clean).length).toBeGreaterThan(setups.length / 4);
  });
  it('counts down three lights, then GO, and gets to the ramp even with no pedal at all', () => {
    const s = createSim(base), lights: number[] = [];
    let go = false;
    while (s.phase !== 'done') { stepSim(s, inputFor(s, 'nothing')); for (const e of takeEvents(s)) { if (e.t === 'light') lights.push(e.n); if (e.t === 'go') go = true; } }
    expect(lights).toEqual([3, 2, 1]);
    expect(go).toBe(true);
    expect(s.lipSpeed).toBeGreaterThan(0);
  });
  it('crunches the row when it lands on it, and still counts the jump', () => {
    const s = jumpWith({ ...base, row: 200 }, 'skilled');
    expect(s.landed?.onRow).toBe(true);
    expect(s.feet).toBeGreaterThan(0);
  });
});
