// The Show can't be failed: whatever a child does (nothing at all, steering at every ring, scribbling everywhere), the rings end, the
// plane stays in the sky, and Free Sky keeps a drawing. Parts change how it flies.
import { describe, expect, it } from 'vitest';
import { seeded } from '../../game/rng';
import { flight, freshAirfield } from '../airfield/state';
import { TRICKS, type TrickId } from '../airfield/parts';
import { createShow, currentRing, H, postcardPoints, RINGS, RINGS_S, startTrick, stepShow, turbo, type Gear, type ShowWorld } from './show';

const NO_GEAR: Gear = { magnet: false, shield: false, turbo: false, autopilot: false };
const base = flight(freshAirfield());
const best = { speed: base.speed * 1.7 * 1.35, turn: base.turn * 1.9 * 1.35, trail: 3, accel: 1.8 };
const DT = 1 / 60;
function fly(w: ShowWorld, seconds: number, steer: (w: ShowWorld) => { x: number; y: number } | null) {
  const seen = new Set<string>();
  for (let i = 0; i < seconds * 60; i++) {
    stepShow(w, DT, steer(w));
    for (const e of w.events) seen.add(e);
    expect(Number.isFinite(w.x) && Number.isFinite(w.y) && Number.isFinite(w.heading)).toBe(true);
    expect(w.x).toBeGreaterThanOrEqual(0); expect(w.x).toBeLessThanOrEqual(w.width);
    expect(w.y).toBeGreaterThanOrEqual(0); expect(w.y).toBeLessThanOrEqual(H);
  }
  return seen;
}

describe('the Show', { timeout: 30000 }, () => {
  it('ends its rings by itself however he flies, even if he does nothing', () => {
    for (const aspect of [0.75, 1.33, 0.46, 2.16]) {
      const w = createShow(aspect, base, NO_GEAR, seeded(1));
      const seen = fly(w, RINGS_S + 1, () => null);
      expect(w.phase).toBe('free');
      expect(seen.has('rings-done')).toBe(true);
    }
  });
  it('lets a child who steers at the rings fly through most of them, in about 45 seconds or less', () => {
    for (const [seed, aspect] of [[1, 0.75], [2, 1.33], [3, 0.46], [4, 2.16]] as const) {
      const w = createShow(aspect, base, NO_GEAR, seeded(seed));
      let t = 0;
      while (w.phase === 'rings' && t < 60) { stepShow(w, DT, currentRing(w)); t += DT; }
      expect(w.passed, `seed ${seed} aspect ${aspect}`).toBeGreaterThanOrEqual(7);
      expect(t).toBeLessThanOrEqual(RINGS_S + DT);
    }
  });
  it('flies faster and turns tighter with better parts', () => {
    const slow = createShow(1, base, NO_GEAR, seeded(5)), fast = createShow(1, best, NO_GEAR, seeded(5));
    let ts = 0, tf = 0;
    while (slow.phase === 'rings' && ts < 60) { stepShow(slow, DT, currentRing(slow)); ts += DT; }
    while (fast.phase === 'rings' && tf < 60) { stepShow(fast, DT, currentRing(fast)); tf += DT; }
    expect(fast.passed).toBeGreaterThanOrEqual(slow.passed);
    expect(tf).toBeLessThan(ts);
  });
  it('keeps a longer trail with a bigger Smoke Tank', () => {
    const a = createShow(1, base, NO_GEAR, seeded(6)), b = createShow(1, best, NO_GEAR, seeded(6));
    fly(a, 5, () => null); fly(b, 5, () => null);
    expect(b.trail.length).toBeGreaterThan(a.trail.length * 2);
  });
  it('only wobbles when it bumps a cloud, and the Bubble Shield stops even that', () => {
    const w = createShow(1, base, NO_GEAR, seeded(7));
    const seen = fly(w, RINGS_S, ww => ({ x: ww.hazards[0]!.x, y: ww.hazards[0]!.y }));
    expect(seen.has('bump')).toBe(true);
    const s = createShow(1, base, { ...NO_GEAR, shield: true }, seeded(7));
    const seen2 = fly(s, RINGS_S, ww => ({ x: ww.hazards[0]!.x, y: ww.hazards[0]!.y }));
    expect(seen2.has('bump')).toBe(false);
  });
  it('flies every trick and stays in the sky, from any corner', () => {
    for (const t of TRICKS) for (const [x, y] of [[60, 80], [900, 900], [500, 500]] as const) {
      const w = createShow(1, base, { ...NO_GEAR, turbo: true }, seeded(8));
      w.x = x; w.y = y;
      expect(startTrick(w, t.id as TrickId)).toBe(true);
      turbo(w);
      fly(w, 3.2, () => null);
      expect(w.trick).toBeNull();
    }
  });
  it('autopilot flies to the rings when he lets go, and the Ring Magnet pulls them in', () => {
    const w = createShow(1, base, { ...NO_GEAR, autopilot: true, magnet: true }, seeded(9));
    fly(w, RINGS_S, () => null);
    expect(w.passed).toBeGreaterThanOrEqual(7);
    expect(w.rings.length).toBeLessThanOrEqual(RINGS);
  });
  it('keeps what he draws in Free Sky as a small postcard', () => {
    const w = createShow(1, base, NO_GEAR, seeded(10));
    fly(w, RINGS_S + 1, () => null);
    expect(w.phase).toBe('free');
    // he draws two strokes with his finger
    let k = 0;
    fly(w, 3, () => ({ x: 200 + (k++ % 180) * 3, y: 300 }));
    fly(w, 0.5, () => null);
    fly(w, 3, () => ({ x: 500, y: 200 + (k++ % 180) * 3 }));
    expect(w.drawing.length).toBeGreaterThanOrEqual(2);
    const pts = postcardPoints(w);
    expect(pts.length).toBeGreaterThan(20);
    expect(pts.length).toBeLessThanOrEqual(1500);
    expect(pts.every(n => n === -1 || (n >= 0 && n <= 255))).toBe(true);
  });
});
