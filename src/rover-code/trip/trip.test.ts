// The trip is the treat, so it must always be finishable by a clumsy six-year-old: these play it with a simple scripted child.
import { describe, expect, it } from 'vitest';
import { seeded } from '../../game/rng';
import { GADGET_IDS, PLANETS, type GadgetId } from '../base/planets';
import { CLIMB_S, COUNT_S, createFlight, LAND_S, stepFlight } from './flight';
import { createDrive, FLAG_AT, JUMP_HEIGHT, stepDrive } from './drive';
import { CRYSTALS } from '../base/base';

const DT = 1 / 60;

describe('the flight', () => {
  it('always arrives, whatever he does, and a bump costs nothing', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const f = createFlight(.75, seeded(seed));
      f.started = true;
      let t = 0;
      while (!f.done && t < COUNT_S + CLIMB_S + LAND_S + 2) { stepFlight(f, DT, null, 0); t += DT; } // hands off
      expect(f.done).toBe(true);
      expect(f.caught).toBeLessThanOrEqual(3);
    }
  });
  it('lets a child who follows the Bolts catch them', () => {
    let total = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const f = createFlight(1.33, seeded(seed));
      f.started = true;
      while (!f.done) { const bolt = f.things.find(s => s.kind === 'bolt' && !s.gone); stepFlight(f, DT, bolt ? bolt.x : null, 0); }
      total += f.caught;
    }
    expect(total / 20).toBeGreaterThan(2.5);
  });
  it('waits for the big button', () => {
    const f = createFlight(1, seeded(1));
    for (let i = 0; i < 600; i++) stepFlight(f, DT, null, 0);
    expect(f.t).toBe(0);
  });
});

describe('the planet drive', () => {
  /** Holds ▶ and jumps every so often, as a child does. */
  function play(planetIndex: number, gadgets: readonly GadgetId[], jumpEvery = 1.4) {
    const d = createDrive(PLANETS[planetIndex]!, gadgets, planetIndex + 1);
    let t = 0, next = jumpEvery;
    while (!d.atFlag && t < 120) { const jump = t >= next; if (jump) next += jumpEvery; stepDrive(d, DT, 1, jump); t += DT; }
    return { d, t };
  }
  it('reaches the flag on every planet, with or without gadgets', () => {
    PLANETS.forEach((_, i) => {
      for (const gadgets of [[], GADGET_IDS]) {
        const { d, t } = play(i, gadgets);
        expect(d.atFlag).toBe(true);
        expect(d.x).toBeGreaterThan(FLAG_AT - 100);
        expect(t).toBeLessThan(40);
      }
    });
  });
  it('lets a child who goes back for a missed crystal get every one, and finds the low ones without jumping', () => {
    PLANETS.forEach((p, i) => {
      const d = createDrive(p, [], i + 1), apex = Math.sqrt(2 * p.gravity * JUMP_HEIGHT) / p.gravity;
      let dir = 1;
      for (let t = 0; d.got < CRYSTALS && t < 180; t += DT) {
        const want = d.crystals.find(c => !c.got)!, ahead = (want.x - d.x) * dir;
        if (ahead < -40) dir = -dir; // went past it: turn round
        else if (dir < 0 && want.x - d.x > -260) dir = 1; // far enough back for a run-up
        const high = want.y - d.ground(want.x) > 120;
        stepDrive(d, DT, dir, high && dir > 0 && ahead > 0 && ahead < Math.abs(d.vx) * apex + 10);
      }
      expect(d.got).toBe(CRYSTALS);
      expect(play(i, [], 999).d.got).toBeGreaterThanOrEqual(2);
    });
  });
  it('jumps higher with Big Wheels and pulls crystals in with the Magnet', () => {
    const peak = (gadgets: GadgetId[]) => { const d = createDrive(PLANETS[1]!, gadgets, 1); let top = 0; stepDrive(d, DT, 0, true); for (let i = 0; i < 200; i++) { stepDrive(d, DT, 0, false); top = Math.max(top, d.y - d.ground(d.x)); } return top; };
    expect(peak(['wheels'])).toBeGreaterThan(peak([]) * 1.2);
    let plain = 0, magnet = 0;
    PLANETS.forEach((_, i) => { plain += play(i, [], 999).d.got; magnet += play(i, ['magnet'], 999).d.got; });
    expect(magnet).toBeGreaterThan(plain);
  });
  it('goes faster with Turbo Jets, bounces high on a mushroom, and fires confetti from the Cannon', () => {
    expect(play(1, ['turbo'], 999).t).toBeLessThan(play(1, [], 999).t * .9);
    const shroom = createDrive(PLANETS.find(p => p.feature === 'mushrooms')!, [], 1);
    let bounced = false;
    for (let t = 0; t < 30 && !shroom.atFlag; t += DT) { stepDrive(shroom, DT, 1, false); bounced ||= shroom.events.includes('bounce'); }
    expect(bounced).toBe(true);
    const party = createDrive(PLANETS[0]!, ['cannon'], 1);
    stepDrive(party, DT, 0, true);
    expect(party.bits.length).toBeGreaterThan(0);
    for (let i = 0; i < 200; i++) stepDrive(party, DT, 0, false);
    expect(party.bits).toHaveLength(0);
  });
});
