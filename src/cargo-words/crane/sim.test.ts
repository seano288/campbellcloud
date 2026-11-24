// The Crane cannot be failed, has no clock, and a child always finishes it: the careful child and the clumsy child both fill every ship,
// with every crane, and the ship sails. The swing never reaches the next stack. A row on the ship that reads a word is said.
import { describe, expect, it } from 'vitest';
import { seeded } from '../../game/rng';
import { BASE_SPEC, capacity, carefulChild, clumsyChild, COL, createCrane, MOST_SWING, NO_INPUT, playWith, quayColX, REST_Y, shipColX, stepCrane, takeEvents, type CraneSpec, type ShipShape } from './sim';

const SHAPES: ShipShape[] = [{ cols: 2, tiers: 1 }, { cols: 2, tiers: 2 }, { cols: 3, tiers: 2 }, { cols: 4, tiers: 2 }, { cols: 4, tiers: 3 }, { cols: 5, tiers: 3 }, { cols: 6, tiers: 2 }, { cols: 6, tiers: 3 }];
const SPECS: CraneSpec[] = [BASE_SPEC, { trolley: 30, cable: 22, twin: false }, { trolley: 40, cable: 30, twin: true }];
/** Words for a ship of n containers: two-syllable words, and a one-syllable one if n is odd. */
const wordsFor = (n: number) => [...Array.from({ length: Math.floor(n / 2) }, (_, i) => [['rab', 'bit'], ['sun', 'set'], ['nap', 'kin'], ['pic', 'nic'], ['muf', 'fin'], ['tik', 'et'], ['bas', 'ket'], ['rock', 'et'], ['pump', 'kin']][i % 9]!), ...(n % 2 ? [['ship']] : [])];

describe('the Crane', () => {
  for (const [name, child] of [['careful', carefulChild], ['clumsy', clumsyChild]] as const) {
    it(`a ${name} child fills every ship with every crane, and it sails`, () => {
      for (const ship of SHAPES) for (const [k, spec] of SPECS.entries()) {
        if (capacity(ship) > 12 && k === 0) continue; // the biggest ships come only with a better crane (port/ships.ts)
        const c = playWith(createCrane(spec, ship, wordsFor(capacity(ship))), child, seeded(ship.cols * 31 + ship.tiers * 7 + k), 900);
        expect(c.phase, `${ship.cols}x${ship.tiers} crane ${k}`).toBe('done');
        expect(c.loaded).toBe(capacity(ship));
        expect(c.boxes.every(b => b.where === 'ship')).toBe(true);
      }
    });
  }
  it('takes the careful child about a minute for a middling ship, and less with a better crane', () => {
    const t = (spec: CraneSpec, ship: ShipShape) => playWith(createCrane(spec, ship, wordsFor(capacity(ship))), carefulChild, seeded(1)).doneAt!;
    const mid = t(BASE_SPEC, { cols: 3, tiers: 2 });
    expect(mid).toBeGreaterThan(25);
    expect(mid).toBeLessThan(90);
    expect(t(SPECS[2]!, { cols: 6, tiers: 2 })).toBeLessThan(t(BASE_SPEC, { cols: 6, tiers: 2 }));
    // the biggest ships come only with the biggest cranes (port/ships.ts)
    expect(t(SPECS[2]!, { cols: 6, tiers: 3 })).toBeLessThan(150);
  });
  it('doing nothing does nothing, and never fails: it waits, and says how to start', () => {
    const c = createCrane(BASE_SPEC, { cols: 2, tiers: 1 }, wordsFor(2));
    const events = [];
    for (let i = 0; i < 60 * 40; i++) { stepCrane(c, NO_INPUT); events.push(...takeEvents(c)); }
    expect(c.phase).toBe('loading');
    expect(c.loaded).toBe(0);
    expect(events.filter(e => e.t === 'idle').length).toBeGreaterThanOrEqual(2);
  });
  it('lowering over the water or an empty spot does no harm, and a full stack keeps what the grab holds', () => {
    const c = createCrane(BASE_SPEC, { cols: 2, tiers: 1 }, wordsFor(2));
    const run = (lower: number) => { stepCrane(c, { to: null, lower }); for (let i = 0; i < 60 * 8; i++) stepCrane(c, NO_INPUT); return takeEvents(c); };
    expect(run((quayColX(c, 1) + shipColX(c, 0)) / 2).some(e => e.t === 'water')).toBe(true);
    expect(run(shipColX(c, 0)).some(e => e.t === 'empty')).toBe(true);
    expect(run(quayColX(c, 0)).some(e => e.t === 'lock')).toBe(true);
    expect(run(shipColX(c, 0)).some(e => e.t === 'place')).toBe(true);
    expect(run(quayColX(c, 1)).some(e => e.t === 'lock')).toBe(true);
    // the only stack on this ship's first column is one high: it's full
    expect(run(shipColX(c, 0)).some(e => e.t === 'stackFull')).toBe(true);
    expect(c.boxes.filter(b => b.where === 'grab')).toHaveLength(1);
    expect(c.y).toBe(REST_Y);
  });
  it('⬇ pressed while the trolley is still sliding lowers where it stops (found in the browser tour)', () => {
    const c = createCrane(BASE_SPEC, { cols: 2, tiers: 1 }, wordsFor(2));
    stepCrane(c, { to: null, lower: quayColX(c, 0) });
    for (let i = 0; i < 60 * 6; i++) stepCrane(c, NO_INPUT);
    // a drag toward the ship, let go, and ⬇ at once
    for (let i = 0; i < 20; i++) stepCrane(c, { to: shipColX(c, 0), lower: null });
    stepCrane(c, { to: null, lower: true });
    for (let i = 0; i < 60 * 8; i++) stepCrane(c, NO_INPUT);
    expect(c.boxes.filter(b => b.where === 'ship')).toHaveLength(1);
  });
  it('a container lowered off-centre straightens itself onto the stack', () => {
    const c = createCrane(BASE_SPEC, { cols: 2, tiers: 1 }, wordsFor(2));
    stepCrane(c, { to: null, lower: quayColX(c, 0) + COL * 0.6 });
    for (let i = 0; i < 60 * 6; i++) stepCrane(c, NO_INPUT);
    expect(c.boxes.filter(b => b.where === 'grab')).toHaveLength(1);
    stepCrane(c, { to: null, lower: shipColX(c, 1) - COL * 0.4 });
    for (let i = 0; i < 60 * 8; i++) stepCrane(c, NO_INPUT);
    const b = c.boxes.find(x => x.where === 'ship')!;
    expect(b.col).toBe(1);
    expect(c.x).toBeCloseTo(shipColX(c, 1));
  });
  it('the swing never reaches the next stack', () => {
    for (const ship of SHAPES) {
      const c = createCrane(SPECS[2]!, ship, wordsFor(capacity(ship)));
      let most = 0;
      const rng = seeded(ship.cols);
      while (c.phase !== 'done' && c.t < 600) { stepCrane(c, clumsyChild(c, rng)); most = Math.max(most, Math.abs(c.swing)); }
      expect(most).toBeLessThanOrEqual(MOST_SWING);
      // the furthest a hanging container moves sideways is less than the gap to the next stack
      expect(Math.sin(MOST_SWING) * 40).toBeLessThan(COL * 1.2);
    }
  });
  it('says each word when a row on the ship reads it, left to right', () => {
    const c = playWith(createCrane(BASE_SPEC, { cols: 4, tiers: 2 }, wordsFor(8)), carefulChild, seeded(2));
    expect(c.said.size).toBe(4);
  });
  it('the twin grab lifts two and sets down only what fits', () => {
    const c = createCrane(SPECS[2]!, { cols: 3, tiers: 1 }, wordsFor(8));
    stepCrane(c, { to: null, lower: quayColX(c, 0) });
    for (let i = 0; i < 60 * 5; i++) stepCrane(c, NO_INPUT);
    expect(c.boxes.filter(b => b.where === 'grab')).toHaveLength(2);
    stepCrane(c, { to: null, lower: shipColX(c, 0) });
    for (let i = 0; i < 60 * 6; i++) stepCrane(c, NO_INPUT);
    expect(c.boxes.filter(b => b.where === 'grab')).toHaveLength(1);
    expect(c.boxes.filter(b => b.where === 'ship')).toHaveLength(1);
  });
});
