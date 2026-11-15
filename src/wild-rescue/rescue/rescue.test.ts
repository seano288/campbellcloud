// The Rescue is the treat, so a clumsy six-year-old must always be able to finish it: these play it with simple scripted children.
import { describe, expect, it } from 'vitest';
import { seeded } from '../../game/rng';
import { HABITAT_IDS } from '../facts/habitats';
import { CRAWL, createDrive, END_X, groundAt, stepDrive } from './drive';
import { createJob, done, drag, feed, tapNet, TREATS, winch, winchTaps } from './jobs';

const DT = 1 / 60;

describe('the drive', () => {
  it('always arrives, in every place and with every tire, whether he holds on, lets go now and then, or jumps all the time', () => {
    for (const home of HABITAT_IDS) for (const tires of [0, 3, 6]) for (const style of ['hold', 'pulse', 'jumpy', 'random'] as const) {
      const d = createDrive(home, tires), rng = seeded(home.length * 13 + tires);
      let t = 0;
      while (!d.arrived && t < 90) {
        const holding = style === 'hold' || style === 'jumpy' ? true : style === 'pulse' ? Math.floor(t * 2) % 3 !== 0 : rng() < .7;
        const jump = style === 'jumpy' ? Math.floor(t * 60) % 40 === 0 : style === 'random' ? rng() < .02 : false;
        stepDrive(d, DT, holding, jump);
        t += DT;
      }
      expect(d.arrived, `${home} ${tires} ${style}`).toBe(true);
      expect(d.x).toBe(END_X);
      expect(t).toBeLessThan(style === 'hold' ? 20 : 45);
      expect(d.got).toBeLessThanOrEqual(4);
    }
  });
  it('never stops while he holds, even in mud, sand, snow or a stream, or bouncing off a log', () => {
    for (const home of HABITAT_IDS) {
      const d = createDrive(home, 0);
      let last = d.x, still = 0;
      while (!d.arrived) { stepDrive(d, DT, true, false); still = d.x - last < CRAWL * .3 * DT ? still + 1 : 0; last = d.x; expect(still, home).toBeLessThan(30); }
      expect(d.events).toContain('arrive');
    }
  });
  it('stays put when he lets go, and waits on solid ground at the end', () => {
    const d = createDrive('farm', 0);
    for (let i = 0; i < 300; i++) stepDrive(d, DT, false, false);
    expect(d.x).toBe(createDrive('farm', 0).x);
    while (!d.arrived) stepDrive(d, DT, true, true);
    expect(d.grounded).toBe(true);
    expect(d.y).toBeCloseTo(groundAt(d, END_X));
  });
  it('lets a child who jumps for the high Bolts and drives under the low ones collect all four', () => {
    for (const home of HABITAT_IDS) {
      const d = createDrive(home, 2);
      while (!d.arrived) {
        const high = d.bolts.find(b => !b.got && b.y > 100 && b.x - d.x > 60 && b.x - d.x < 150);
        stepDrive(d, DT, true, !!high);
      }
      expect(d.got, home).toBe(4);
    }
  });
  it('is quicker with better tires', () => {
    const time = (tires: number) => { const d = createDrive('farm', tires); let t = 0; while (!d.arrived) { stepDrive(d, DT, true, false); t += DT; } return t; };
    expect(time(6)).toBeLessThan(time(0));
  });
});

describe('the job', () => {
  it('pulls the net off with a drag, or with taps, and never puts it back', () => {
    let j = createJob('pull');
    if (j.kind !== 'pull') throw new Error();
    j = drag(j, -.5);
    expect(j.pulled).toBe(0);
    for (let i = 0; i < 4; i++) j = tapNet(j);
    expect(done(j)).toBe(true);
    let d = createJob('pull');
    if (d.kind !== 'pull') throw new Error();
    for (let i = 0; i < 40 && !done(d); i++) d = drag(d, .04);
    expect(done(d)).toBe(true);
  });
  it('winches the animal out in fewer taps with a better winch', () => {
    for (let rung = 0; rung <= 6; rung++) {
      let j = createJob('lift', rung);
      if (j.kind !== 'lift') throw new Error();
      let taps = 0;
      while (!done(j)) { j = winch(j); taps++; }
      expect(taps).toBe(winchTaps(rung));
    }
    expect(winchTaps(0)).toBe(5);
    expect(winchTaps(6)).toBe(2);
  });
  it('leads the animal along the treats in order, whatever else he taps', () => {
    let j = createJob('lead');
    if (j.kind !== 'lead') throw new Error();
    j = feed(j, 2);
    expect(j.eaten).toBe(0);
    for (let i = 0; i < TREATS; i++) j = feed(j, i);
    expect(done(j)).toBe(true);
  });
});
