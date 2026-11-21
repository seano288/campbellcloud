// The Dive can't be failed: a scripted child always gets to the end, in every zone, with the starter parts and with the best, and a
// child who does nothing at all still rises at the end. An early Dive almost always meets an animal he hasn't photographed yet.
import { describe, expect, it } from 'vitest';
import { DIVE_S, freshDock, gearOf, lookOf, type Gear } from '../dock/dock';
import { CLAW_REACH, FLASH_COUNT, LIGHT_HALF, LIGHT_REACH, MOTOR_SPEED, SONAR_EVERY, SONAR_RANGE } from '../dock/parts';
import { animalsIn } from '../sea/animals';
import { ZONES } from '../sea/zones';
import { flash, hold, inBeam, release, startDive, step, takeEvents, WORLD, type DiveState } from './sim';

const STARTER: Gear = gearOf(freshDock());
const BEST: Gear = { ...STARTER, reach: LIGHT_REACH.at(-1)!, half: LIGHT_HALF.at(-1)!, sonarRange: SONAR_RANGE.at(-1)!, sonarEvery: SONAR_EVERY.at(-1)!, speed: MOTOR_SPEED.at(-1)!, claw: CLAW_REACH.at(-1)!, flashes: FLASH_COUNT.at(-1)! };

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

describe('the submarine he steers', () => {
  it('always faces where its light points, however he steers', () => {
    for (const gear of [STARTER, BEST]) {
      const s = startDive('midnight', gear, [], 3);
      const frame = 1 / 60;
      for (let i = 0; i < 60 * 40 && s.phase === 'dive'; i++) {
        // a finger that jumps about: ahead, behind, above, released
        if (i % 90 === 0) { const r = (i / 90) % 5; if (r === 4) release(s); else hold(s, s.sub.x + [300, -300, 40, -40][r]!, s.sub.y + [60, -60, -250, 250][r]!); }
        step(s, frame);
        const ax = Math.cos(s.sub.aim);
        if (Math.abs(ax) > 0.2) expect(s.sub.face, `frame ${i}`).toBe(ax > 0 ? 1 : -1);
      }
    }
  });
  it('a fast Motor stops at his finger instead of overshooting and turning round', () => {
    const s = startDive('midnight', BEST, [], 3);
    hold(s, s.sub.x + 250, s.sub.y + 75);
    let turned = false;
    for (let i = 0; i < 240; i++) { step(s, 1 / 60); if (Math.cos(s.sub.aim) < 0) turned = true; }
    expect(turned).toBe(false);
  });
});

describe('every submarine', () => {
  it('finishes a Dive in every zone, with the starter parts and with the best, whatever its trick', async () => {
    const { SUBS } = await import('../dock/subs');
    const { fit } = await import('../dock/dock');
    const { ALL_KEYS } = await import('../dock/parts');
    for (const sub of SUBS) for (const best of [false, true]) {
      let d = { ...freshDock(), owned: [...ALL_KEYS] };
      d = fit(d, `sub:${sub.id}`);
      if (best) for (const t of ['hull', 'lights', 'sonar', 'motor', 'claw', 'flash'] as const) d = fit(d, `${t}:r${t === 'hull' ? 6 : t === 'flash' ? 4 : 5}`);
      for (const z of ZONES) {
        const s = startDive(z.id, gearOf(d), [], 7);
        play(s);
        expect(s.phase, `${sub.id} ${z.id}`).toBe('done');
      }
    }
  });
});
