// The trip is the treat, so it must always be finishable by a clumsy six-year-old: these play it with a simple scripted child.
import { describe, expect, it } from 'vitest';
import { seeded } from '../../game/rng';
import { GADGET_IDS, PLANETS } from '../base/planets';
import { FEATURE_IDS, ROVER_IDS, type FeatureId, type RoverId } from '../base/rovers';
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
  const look = (kit: readonly FeatureId[] = [], kind: RoverId = 'scout') => ({ kind, kit });
  function play(planetIndex: number, kit: readonly FeatureId[], jumpEvery = 1.4, kind: RoverId = 'scout') {
    const d = createDrive(PLANETS[planetIndex]!, look(kit, kind), planetIndex + 1);
    let t = 0, next = jumpEvery;
    while (!d.atFlag && t < 120) { const jump = t >= next; if (jump) next += jumpEvery; stepDrive(d, DT, 1, jump); t += DT; }
    return { d, t };
  }
  it('reaches the flag on every planet in every rover, with or without gadgets', () => {
    PLANETS.forEach((_, i) => {
      for (const kind of ROVER_IDS) for (const kit of [[], GADGET_IDS, FEATURE_IDS]) {
        const { d, t } = play(i, kit, 1.4, kind);
        expect(d.atFlag).toBe(true);
        expect(d.x).toBeGreaterThan(FLAG_AT - 100);
        expect(t).toBeLessThan(40);
      }
    });
  });
  it('lets a child who goes back for a missed crystal get every one, and finds the low ones without jumping', () => {
    PLANETS.forEach((p, i) => {
      const d = createDrive(p, look(), i + 1), apex = Math.sqrt(2 * p.gravity * JUMP_HEIGHT) / p.gravity;
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
    const peak = (kit: FeatureId[]) => { const d = createDrive(PLANETS[1]!, look(kit), 1); let top = 0; stepDrive(d, DT, 0, true); for (let i = 0; i < 200; i++) { stepDrive(d, DT, 0, false); top = Math.max(top, d.y - d.ground(d.x)); } return top; };
    expect(peak(['wheels'])).toBeGreaterThan(peak([]) * 1.2);
    let plain = 0, magnet = 0;
    PLANETS.forEach((_, i) => { plain += play(i, [], 999).d.got; magnet += play(i, ['magnet'], 999).d.got; });
    expect(magnet).toBeGreaterThan(plain);
  });
  it('goes faster with Turbo Jets, bounces high on a mushroom, and fires confetti from the Cannon', () => {
    expect(play(1, ['turbo'], 999).t).toBeLessThan(play(1, [], 999).t * .9);
    const shroom = createDrive(PLANETS.find(p => p.feature === 'mushrooms')!, look(), 1);
    let bounced = false;
    for (let t = 0; t < 30 && !shroom.atFlag; t += DT) { stepDrive(shroom, DT, 1, false); bounced ||= shroom.events.includes('bounce'); }
    expect(bounced).toBe(true);
    const party = createDrive(PLANETS[0]!, look(['cannon']), 1);
    stepDrive(party, DT, 0, true);
    expect(party.bits.length).toBeGreaterThan(0);
    for (let i = 0; i < 200; i++) stepDrive(party, DT, 0, false);
    expect(party.bits).toHaveLength(0);
  });
  it('drives each rover its own way', () => {
    const peak = (kind: RoverId, kit: FeatureId[] = []) => { const d = createDrive(PLANETS[1]!, look(kit, kind), 1); let top = 0; stepDrive(d, DT, 0, true); for (let i = 0; i < 200; i++) { stepDrive(d, DT, 0, false); top = Math.max(top, d.y - d.ground(d.x)); } return top; };
    expect(play(1, [], 999, 'buggy').t).toBeLessThan(play(1, [], 999).t * .85);
    expect(peak('monster')).toBeGreaterThan(peak('scout') * 1.3);
    // the Spider Walker jumps again in mid-air
    const spider = createDrive(PLANETS[1]!, look([], 'spider'), 1);
    stepDrive(spider, DT, 0, true);
    for (let i = 0; i < 20; i++) stepDrive(spider, DT, 0, false);
    stepDrive(spider, DT, 0, true);
    expect(spider.events).toContain('boost');
    // the Hover Rover floats over lava; the Scout bounces off it
    const lava = PLANETS.findIndex(p => p.feature === 'lava'), hot = (kind: RoverId) => { const d = createDrive(PLANETS[lava]!, look([], kind), 1); let n = 0; for (let t = 0; t < 30 && !d.atFlag; t += DT) { stepDrive(d, DT, 1, false); n += d.events.filter(e => e === 'hot').length; } return n; };
    expect(hot('scout')).toBeGreaterThan(0);
    expect(hot('hover')).toBe(0);
    expect(hot('ufo')).toBe(0);
    // the Pogo Bot bounces higher than the Monster Truck, and the Rocket Car outruns the Dune Buggy
    expect(peak('pogo')).toBeGreaterThan(peak('monster'));
    expect(play(1, [], 999, 'rocketcar').t).toBeLessThan(play(1, [], 999, 'buggy').t);
    // the Robo Dog jumps twice in mid-air
    const dog = createDrive(PLANETS[1]!, look([], 'dog'), 1), boosts = [] as boolean[];
    stepDrive(dog, DT, 0, true);
    for (let j = 0; j < 3; j++) { for (let i = 0; i < 12; i++) stepDrive(dog, DT, 0, false); stepDrive(dog, DT, 0, true); boosts.push(dog.events.includes('boost')); }
    expect(boosts).toEqual([true, true, false]);
  });
  it('scoops crystals from further off with the Digger', () => {
    let scout = 0, digger = 0;
    PLANETS.forEach((_, i) => { scout += play(i, [], 999).d.got; digger += play(i, [], 999, 'digger').d.got; });
    expect(digger).toBeGreaterThan(scout);
  });
  it('stops sliding on ice with the Tank Crawler or the Snow Plow', () => {
    const ice = PLANETS.find(p => p.feature === 'ice')!, slide = (kind: RoverId, kit: FeatureId[] = []) => {
      const d = createDrive(ice, look(kit, kind), 1);
      for (let i = 0; i < 90; i++) stepDrive(d, DT, 1, false);
      const from = d.x;
      for (let i = 0; i < 120; i++) stepDrive(d, DT, 0, false);
      return d.x - from;
    };
    expect(slide('tank')).toBeLessThan(slide('scout') * .5);
    expect(slide('scout', ['plow'])).toBeLessThan(slide('scout') * .5);
  });
  it('comes down slowly with the Parachute, and blows bubbles that float away', () => {
    const fall = (kit: FeatureId[]) => { const d = createDrive(PLANETS[1]!, look(kit), 1); stepDrive(d, DT, 0, true); let low = 0; for (let i = 0; i < 200; i++) { stepDrive(d, DT, 0, false); low = Math.min(low, d.vy); } return { low, d }; };
    expect(fall(['chute']).low).toBeGreaterThanOrEqual(-241);
    expect(fall([]).low).toBeLessThan(-300);
    const d = createDrive(PLANETS[0]!, look(['bubbles']), 1);
    for (let i = 0; i < 60; i++) stepDrive(d, DT, 1, false);
    expect(d.bits.some(b => b.bubble)).toBe(true);
    for (let i = 0; i < 300; i++) stepDrive(d, DT, 0, false);
    expect(d.bits).toHaveLength(0);
  });
});
