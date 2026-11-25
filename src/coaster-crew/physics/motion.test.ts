// The motion model must be true: a wrong idea taught here would stay with him. These check it against the plain physics it claims, and the
// commonest wrong idea of all gets its own test: weight does not make a cart roll downhill faster.
import { describe, expect, it } from 'vitest';
import * as motion from './motion';
import { coastDistance, G, headOn, magnetPulls, MAGNET_REACH, offWall, polesPull, profile, pullStrength, pushStarts, roll, rollsBackAt, sidePush, speedAfterPush, speedFromDrop, stoppingDistance } from './motion';

const hill = (start: number, next?: number) => {
  const pts: [number, number][] = [];
  for (let i = 0; i <= 30; i++) pts.push([i * .3, start * (1 + Math.cos(Math.PI * i / 30)) / 2]);
  if (next !== undefined) for (let i = 1; i <= 40; i++) pts.push([9 + i * .3, next * (1 - Math.cos(2 * Math.PI * i / 40)) / 2]);
  pts.push([pts.at(-1)![0] + 5, 0]);
  return profile(pts, 0.01);
};

describe('the trap: weight does not make it roll downhill faster', () => {
  it('the motion along a track has no weight in it at all', () => {
    // step, roll and rollsBackAt take a track and a position and speed: nothing for a mass to go in
    expect(motion.step.length).toBe(3);
    expect(motion.roll.length).toBeLessThanOrEqual(3);
    expect(Object.keys(motion).filter(k => /mass|weight|heavy/i.test(k))).toEqual([]);
  });
  it('a full cart and an empty cart let go from the same hill reach the bottom together, at the same speed', () => {
    // there is no way to tell the model a cart is full: whatever is in it, the same hill gives the same run
    const a = roll(hill(3), { s: .1, v: .2 }), b = roll(hill(3), { s: .1, v: .2 });
    expect(a.frames).toEqual(b.frames);
  });
  it('the speed at the bottom of a drop comes from its height alone: sqrt(2gh)', () => {
    for (const h of [1, 2, 5, 10]) {
      const r = roll(profile([[0, h], [h * 3, 0], [h * 3 + 10, 0]], 0), { s: 0, v: 0.001 });
      expect(r.topSpeed).toBeCloseTo(speedFromDrop(h), 0);
    }
  });
});

describe('hills', () => {
  it('a cart started higher is faster at the bottom', () => {
    expect(roll(hill(4), { s: .1, v: .2 }).topSpeed).toBeGreaterThan(roll(hill(2), { s: .1, v: .2 }).topSpeed);
  });
  it('a cart cannot climb a hill as high as where it started: it rolls back', () => {
    const r = roll(hill(3, 3), { s: .1, v: .2 });
    expect(r.rolledBack).toBe(true);
    expect(r.end).toBe('rest');
  });
  it('a hill a quarter lower than the start is got over', () => {
    expect(roll(hill(3, 2.4), { s: .1, v: .2 }).end).toBe('through');
    expect(rollsBackAt(hill(3, 2.4), { s: .1, v: .2 })).toBeNull();
    expect(rollsBackAt(hill(3, 3.2), { s: .1, v: .2 })).not.toBeNull();
  });
});

describe('flat ground', () => {
  it('the same push gets a light cart going faster, so it goes farther; the ground slows both alike', () => {
    expect(speedAfterPush(50, 20)).toBeGreaterThan(speedAfterPush(50, 100));
    expect(coastDistance(speedAfterPush(50, 20), .05)).toBeGreaterThan(coastDistance(speedAfterPush(50, 100), .05));
    // at the same speed, the ground stops any cart in the same distance: weight doesn't change how fast rubbing slows it
    expect(coastDistance(2, .05)).toBeCloseTo(4 / (2 * .05 * G));
  });
  it('a heavy cart needs a bigger push to get going, and is harder to stop', () => {
    expect(pushStarts(50, 20, .08)).toBe(true);
    expect(pushStarts(50, 100, .08)).toBe(false);
    expect(stoppingDistance(100, 2, 40)).toBeGreaterThan(stoppingDistance(20, 2, 40));
  });
  it('rough ground stops it sooner than smooth', () => expect(coastDistance(4, .45)).toBeLessThan(coastDistance(4, .02)));
});

describe('bumps on a table, from above (no gravity in it)', () => {
  it('a rolling ball meeting a still one of the same size stops, and the still one goes on', () => {
    const r = headOn({ x: 1, y: 0 });
    expect(r.mover).toEqual({ x: 0, y: 0 });
    expect(r.struck).toEqual({ x: 1, y: 0 });
  });
  it('a ball comes off a wall the mirror way', () => {
    const v = offWall({ x: 1, y: 1 }, { x: -1, y: 0 });
    expect(v.x).toBeLessThan(0);
    expect(v.y).toBeCloseTo(1);
  });
  it('a push from the side adds to the way it was going', () => {
    const v = sidePush({ x: 2, y: 0 }, { x: 0, y: 2 }, 1);
    expect(v).toEqual({ x: 2, y: 2 });
  });
});

describe('magnets', () => {
  it('pull iron and steel when near, not other things, and not from too far', () => {
    expect(magnetPulls(true, MAGNET_REACH / 2)).toBe(true);
    expect(magnetPulls(false, MAGNET_REACH / 2)).toBe(false);
    expect(magnetPulls(true, MAGNET_REACH * 2)).toBe(false);
  });
  it('pull harder when nearer', () => expect(pullStrength(MAGNET_REACH / 2)).toBeGreaterThan(pullStrength(MAGNET_REACH)));
  it('different ends pull together; the same ends push apart', () => {
    expect(polesPull('N', 'S')).toBe(true);
    expect(polesPull('S', 'N')).toBe(true);
    expect(polesPull('N', 'N')).toBe(false);
    expect(polesPull('S', 'S')).toBe(false);
  });
});
