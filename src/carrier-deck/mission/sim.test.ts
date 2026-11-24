// The Mission can't be failed and he can't get stuck: every job, every aircraft speed, a short and a long deck, two to four wires, flown
// by the three scripted children. And the landing is fair: the skilled child catches the wire he aims for, doing nothing still lands.
import { describe, expect, it } from 'vitest';
import { seeded } from '../../game/rng';
import { JOBS, type Job } from '../ship/catalog';
import { createSim, deckLength, flyWith, jobResult, stepSim, takeEvents, targetWire, TUNING, type Child, type MissionSetup } from './sim';

const setup = (job: Job, over: Partial<MissionSetup> = {}): MissionSetup => ({
  job, subject: job === 'drop' ? 'crate' : job === 'winch' ? 'raft' : job === 'rings' ? 'rings' : job === 'storm' ? 'clouds' : 'whale',
  count: 6, wind: .4, seed: 7, speed: 1, hover: job === 'winch', deckLen: deckLength(0), wires: 2, angled: false, skiJump: false, calm: false, ...over,
});
const CHILDREN: Child[] = ['nothing', 'clumsy', 'skilled'];

describe('a Mission', () => {
  it('always ends on the deck, in under the time limit, whoever flies it', () => {
    for (const job of JOBS) for (const wires of [2, 3, 4]) for (const child of CHILDREN) for (const hover of [false, true]) for (const seed of [1, 2, 3]) {
      const s = flyWith(setup(job, { wires, hover, seed, deckLen: deckLength(seed * 3), speed: hover ? .8 : 1.1, count: 4 + seed * 2, wind: seed * .25 }), child, seed);
      const at = `${job} ${wires} wires ${child} hover ${hover} seed ${seed}`;
      expect(s.phase, at).toBe('done');
      expect(s.t, at).toBeLessThan(TUNING.maxS);
      expect(s.wire, at).toBeGreaterThanOrEqual(1);
      expect(s.wire, at).toBeLessThanOrEqual(wires);
      expect(s.pass, at).toBeLessThanOrEqual(3);
    }
  }, 60_000);
  it('takes about a minute', () => {
    const times = JOBS.map(job => flyWith(setup(job), 'skilled').t);
    for (const t of times) { expect(t).toBeGreaterThan(30); expect(t).toBeLessThan(95); }
  });
  it('never goes below the sea, and the deck is never hit', () => {
    for (const child of CHILDREN) for (const job of JOBS) {
      const s = createSim(setup(job)), rng = seeded(3);
      let low = Infinity;
      while (s.phase !== 'done') {
        stepSim(s, child === 'nothing' ? {} : { alt: rng() < .5 ? rng() * 600 - 100 : null, hold: rng() < .3, drop: rng() < .05 });
        takeEvents(s);
        if (s.phase !== 'trap') low = Math.min(low, s.alt);
      }
      expect(low).toBeGreaterThanOrEqual(TUNING.minAlt - 1);
    }
  });
  it('the skilled child launches at full, gets everything and catches the wire he aims for', () => {
    for (const job of JOBS) for (const wires of [2, 3, 4]) {
      const s = flyWith(setup(job, { wires }), 'skilled');
      expect(s.power, job).toBe(1);
      expect(jobResult(s).stars, job).toBe(3);
      expect(s.wire, job).toBe(targetWire(wires));
      expect(s.grade).toBe(3);
      expect(s.pass).toBe(1);
    }
  });
  it('doing nothing still launches, does the job well enough and lands first time, a wire long', () => {
    for (const job of JOBS) for (const wires of [2, 3, 4]) {
      const s = flyWith(setup(job, { wires }), 'nothing');
      expect(s.pass, `${job} ${wires}`).toBe(1);
      expect(s.grade, `${job} ${wires}`).toBe(2);
      expect(jobResult(s).stars).toBeGreaterThanOrEqual(1);
    }
  });
  it('the third pass lands itself', () => {
    let thirds = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const s = flyWith(setup('rings', { seed }), 'clumsy', seed);
      if (s.pass === 3) { thirds++; expect(s.grade).toBe(1); }
    }
    expect(thirds).toBeGreaterThan(0);
  });
  it('more wires make the landing zone longer: fewer go-rounds for the clumsy child', () => {
    const bolters = (wires: number, angled = false) => {
      let n = 0;
      for (let seed = 1; seed <= 60; seed++) n += flyWith(setup('rings', { seed, wires, angled }), 'clumsy', seed).pass - 1;
      return n;
    };
    expect(bolters(4)).toBeLessThan(bolters(2));
    expect(bolters(2, true)).toBeLessThanOrEqual(bolters(2));
  });
  it('a plane that can\'t hover drops a raft kit instead of winching', () => {
    const s = createSim(setup('winch', { hover: false }));
    expect(s.setup.job).toBe('drop');
    expect(s.islands.length).toBeGreaterThan(0);
  });
});
