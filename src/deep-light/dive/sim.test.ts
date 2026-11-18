// The Dive can't be failed: a scripted child always gets to the end, in every zone, with the starter parts and with the best, and a
// child who does nothing at all still rises at the end. An early Dive almost always meets an animal he hasn't photographed yet.
import { describe, expect, it } from 'vitest';
import { DIVE_S, freshDock, gearOf, lookOf, type Gear } from '../dock/dock';
import { CLAW_REACH, FLASH_COUNT, LIGHT_HALF, LIGHT_REACH, MOTOR_SPEED, SONAR_EVERY, SONAR_RANGE } from '../dock/parts';
import { animalsIn } from '../sea/animals';
import { ZONES } from '../sea/zones';
import { flash, hold, inBeam, release, startDive, step, takeEvents, WORLD, type DiveState } from './sim';

const STARTER: Gear = gearOf(freshDock());
const BEST: Gear = { reach: LIGHT_REACH.at(-1)!, half: LIGHT_HALF.at(-1)!, sonarRange: SONAR_RANGE.at(-1)!, sonarEvery: SONAR_EVERY.at(-1)!, speed: MOTOR_SPEED.at(-1)!, claw: CLAW_REACH.at(-1)!, flashes: FLASH_COUNT.at(-1)! };

/** A child playing: holds a finger on the nearest animal he hasn't photographed, or on the nearest treasure. */
function play(s: DiveState, idle = false) {
  const frame = 1 / 30;
  for (let t = 0; t < DIVE_S + 30 && s.phase !== 'done'; t += frame) {
    if (!idle) {
      const m = s.animals.filter(a => !a.done).sort((a, b) => Math.hypot(a.x - s.sub.x, a.y - s.sub.y) - Math.hypot(b.x - s.sub.x, b.y - s.sub.y))[0];
      const tr = s.treasures.find(x => !x.got);
      if (m) hold(s, m.x, m.y);
      else if (tr) hold(s, tr.x, tr.y - 40);
      else release(s);
    }
    step(s, frame);
    takeEvents(s);
  }
  return s;
}

describe('the Dive', () => {
  it('always ends, in every zone, with the starter parts and the best, and lasts about a minute', () => {
    for (const z of ZONES) for (const gear of [STARTER, BEST]) {
      const s = play(startDive(z.id, gear, [], 7));
      expect(s.phase, z.id).toBe('done');
      expect(s.t).toBeGreaterThanOrEqual(DIVE_S);
      expect(s.t).toBeLessThan(DIVE_S + 15);
    }
  });
  it('a child who does nothing still rises at the end, and is never pushed out of the sea', () => {
    const s = startDive('reef', STARTER, [], 3);
    for (let t = 0; t < DIVE_S + 20 && s.phase !== 'done'; t += 1 / 30) {
      step(s, 1 / 30);
      expect(s.sub.x).toBeGreaterThanOrEqual(80); expect(s.sub.x).toBeLessThanOrEqual(WORLD.w - 80);
      expect(s.sub.y).toBeLessThanOrEqual(WORLD.floor - 70);
    }
    expect(s.phase).toBe('done');
  });
  it('a first Dive in every zone photographs someone new, with only the starter parts', () => {
    for (const z of ZONES) for (const seed of [1, 2, 3, 4, 5]) {
      const s = play(startDive(z.id, STARTER, [], seed));
      expect(s.photos.length, `${z.id} seed ${seed}`).toBeGreaterThan(0);
    }
  });
  it('puts animals he has not met on the Dive first', () => {
    for (const z of ZONES) {
      const all = animalsIn(z.id).map(a => a.id), met = all.slice(0, all.length - 2);
      const s = startDive(z.id, STARTER, met, 9);
      const fresh = s.animals.filter(m => !met.includes(m.a.id));
      expect(fresh.length).toBe(2);
    }
  });
  it('the light is a cone: what is in front of him within reach is lit, what is behind or too far is not', () => {
    const s = startDive('midnight', STARTER, [], 1);
    s.sub = { ...s.sub, x: 1000, y: 700, aim: 0 };
    expect(inBeam(s, 1000 + STARTER.reach - 10, 700)).toBe(true);
    expect(inBeam(s, 1000 + STARTER.reach + 40, 700)).toBe(false);
    expect(inBeam(s, 800, 700)).toBe(false);
    const wide = { ...s, gear: BEST };
    expect(inBeam(wide, 1000 + Math.cos(0.6) * 300, 700 + Math.sin(0.6) * 300)).toBe(true);
    expect(inBeam(s, 1000 + Math.cos(0.6) * 300, 700 + Math.sin(0.6) * 300)).toBe(false);
  });
  it('the camera flash photographs everything near him at once, and only as many times as the flash allows', () => {
    const s = startDive('twilight', { ...STARTER, flashes: 1 }, [], 2);
    s.sub = { ...s.sub, x: WORLD.w / 2, y: WORLD.h / 2 };
    expect(flash(s)).toBe(true);
    expect(s.photos.length).toBeGreaterThan(0);
    for (let i = 0; i < 40; i++) step(s, 1 / 30);
    expect(flash(s)).toBe(false);
  });
  it('the starter look draws, and a Dive starts with the starter gear', () => {
    expect(lookOf(freshDock()).paint).toBe('#ffd23f');
    expect(startDive('reef', STARTER, []).flashes).toBe(0);
  });
});
