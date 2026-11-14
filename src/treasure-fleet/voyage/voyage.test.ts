// The Voyage is the treat, so it must always be finishable by a clumsy six-year-old: these play it with a simple scripted child.
import { describe, expect, it } from 'vitest';
import { seeded } from '../../game/rng';
import { BARRELS } from '../fleet/fleet';
import { createWalk, dig, DIGS, stepWalk, X_AT } from './island';
import { ARRIVE_S, createSail, fire, SAIL_S, SHIP_Y, stepSail, TENTACLE_TIMES } from './sail';

const DT = 1 / 60;

describe('at sea', () => {
  it('always arrives, whatever he does, and a bump costs nothing', () => {
    for (let seed = 1; seed <= 20; seed++) {
      for (const aspect of [.75, 1.33, .46, 2.16]) {
        const s = createSail(aspect, 1, seeded(seed));
        s.started = true;
        let t = 0;
        // hands off, or a finger jabbing at random, or holding hard to one side
        const finger = seed % 3 === 0 ? null : seed % 3 === 1 ? () => ({ x: s.rng() * s.width, y: s.rng() * 1000 }) : () => ({ x: 0, y: SHIP_Y });
        while (!s.done && t < SAIL_S + ARRIVE_S + 1) { stepSail(s, DT, finger ? finger() : null); t += DT; }
        expect(s.done).toBe(true);
        expect(s.barrels).toBeLessThanOrEqual(BARRELS);
        expect(s.x).toBeGreaterThan(0);
        expect(s.x).toBeLessThan(s.width);
      }
    }
  });
  it('lets a child who steers for the barrels pick them up', () => {
    let total = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const s = createSail(1.33, 1, seeded(seed));
      s.started = true;
      while (!s.done) { const b = s.floaters.find(f => f.kind === 'barrel' && f.y < SHIP_Y + 20); stepSail(s, DT, b ? { x: b.x, y: b.y } : null); }
      total += s.barrels;
    }
    expect(total / 20).toBeGreaterThan(2.3);
  });
  it('splashes every tentacle he fires at, and they sink on their own if he doesn\'t', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const s = createSail(.75, 1, seeded(seed));
      s.started = true;
      while (!s.done) { stepSail(s, DT, null); if (s.tentacles.some(t => t.splashed === null && t.age > .5)) fire(s); }
      expect(s.splashed).toBe(TENTACLE_TIMES.length);
      const lazy = createSail(.75, 1, seeded(seed));
      lazy.started = true;
      while (!lazy.done) stepSail(lazy, DT, null);
      expect(lazy.tentacles.filter(t => !t.gone)).toHaveLength(0);
    }
  });
  it('waits for Set sail', () => {
    const s = createSail(1, 1, seeded(1));
    for (let i = 0; i < 600; i++) stepSail(s, DT, null);
    expect(s.t).toBe(0);
  });
  it('fires more shots with better cannons', () => {
    const one = createSail(1, 1, seeded(1)), three = createSail(1, 3, seeded(1));
    one.started = three.started = true;
    fire(one); fire(three);
    expect(three.balls.length).toBe(3 * one.balls.length);
  });
});

describe('on the island', () => {
  it('reaches the X whether he jumps the crabs or just holds on, and three digs open the chest', () => {
    for (const jumpEvery of [.9, 1.7, Infinity]) {
      const w = createWalk();
      let t = 0, next = jumpEvery;
      while (!w.atX && t < 60) { const jump = t >= next; if (jump) next += jumpEvery; stepWalk(w, DT, true, jump); t += DT; }
      expect(w.atX).toBe(true);
      expect(w.x).toBe(X_AT);
      expect(t).toBeLessThan(25);
      for (let i = 0; i < DIGS; i++) expect(dig(w)).toBe(true);
      expect(w.open).toBe(true);
      expect(dig(w)).toBe(false);
    }
  });
  it('lets a child who lets go and taps again still get there', () => {
    const w = createWalk();
    let t = 0;
    while (!w.atX && t < 120) { stepWalk(w, DT, Math.floor(t * 2) % 2 === 0, Math.floor(t * 3) % 5 === 0); t += DT; }
    expect(w.atX).toBe(true);
  });
  it('can hop a crab cleanly with a well-timed jump', () => {
    const w = createWalk();
    let hopped = false, nipped = false;
    while (!w.atX) {
      const crab = w.crabs.find(c => c.x > w.x && c.hidden <= 0), jump = !!crab && crab.x - w.x < 95 && crab.x - w.x > 70;
      stepWalk(w, DT, true, jump);
      hopped ||= w.events.includes('hop-over'); nipped ||= w.events.includes('nip');
    }
    expect(hopped).toBe(true);
    expect(nipped).toBe(false);
  });
});
