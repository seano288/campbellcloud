// The endless layer, generated and checked by the thousand: buildings made from parts (the same every time for a seed), Blocks of
// land without end (none overlapping, every plot facing a street), and Jobs made from his own city, each one driven to its end by a
// scripted finger held on the next stop.
import { describe, expect, it } from 'vitest';
import { seeded } from '../../game/rng';
import { canSay, NAMES } from '../phrases';
import { planJob, MOST_COLLECTED, MOST_GROUP, MIN_STOPS, MAX_STOPS } from '../job/plan';
import { createJob, scriptedTarget, STEP, stepJob } from '../job/sim';
import { NAMED_JOBS, PARTS } from './catalog';
import { freshCity, nextJob, type CityState, type JobRef } from './city';
import { simulate } from './economy';
import { genDesign } from './gen';
import { BLOCK_H, BLOCK_W, blockAt, blockIdAt, blockRect, boundsOf, onStreet, plotsOf, STREET } from './grid';

describe('buildings made from parts', () => {
  it('5,000 of them: whole, sayable, buildable, and the same every time', () => {
    const roofs = new Set(PARTS.filter(p => p.slot === 'roof').map(p => p.value)), windows = new Set(PARTS.filter(p => p.slot === 'window').map(p => p.value));
    const names = new Set<string>(NAMES);
    for (let seed = 1; seed <= 5000; seed++) {
      const d = genDesign(seed);
      expect(roofs.has(d.look.roof)).toBe(true);
      expect(windows.has(d.look.window)).toBe(true);
      expect(['s', 'w']).toContain(d.size);
      expect(d.look.floors).toBeGreaterThanOrEqual(1);
      expect(d.look.floors).toBeLessThanOrEqual(6);
      expect(canSay(d.price) && d.price > 0 && d.price <= 48).toBe(true);
      for (const w of d.said) expect(names.has(w), w).toBe(true);
      if (d.tower) expect(d.size).toBe('s');
    }
    expect(JSON.stringify(genDesign(77))).toBe(JSON.stringify({ ...genDesign(77) }));
    // and they differ: a fresh street isn't the same building four times
    const looks = new Set(Array.from({ length: 200 }, (_, i) => JSON.stringify(genDesign(i + 1).look)));
    expect(looks.size).toBeGreaterThan(190);
  });
});

describe('land without end', () => {
  it('3,000 Blocks: each in its own place on the grid, its plots inside it, every plot facing a street', () => {
    const seen = new Set<string>();
    for (let id = 0; id < 3000; id++) {
      const { bx, by } = blockAt(id), key = `${bx},${by}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
      expect(blockIdAt(bx, by)).toBe(id);
      const r = blockRect(id), plots = plotsOf(id), bounds = boundsOf([id]);
      let area = 0;
      for (const p of plots) {
        expect(p.rect.x).toBeGreaterThanOrEqual(r.x); expect(p.rect.y).toBeGreaterThanOrEqual(r.y);
        expect(p.rect.x + p.rect.w).toBeLessThanOrEqual(r.x + BLOCK_W); expect(p.rect.y + p.rect.h).toBeLessThanOrEqual(r.y + BLOCK_H);
        expect(onStreet(p.kerb, bounds)).toBe(true);
        area += p.rect.w * p.rect.h;
      }
      expect(area).toBe(BLOCK_W * BLOCK_H); // the plots fill the Block, with no overlaps (they're cut from it)
      for (let i = 0; i < plots.length; i++) for (let j = i + 1; j < plots.length; j++) {
        const a = plots[i]!.rect, b = plots[j]!.rect;
        expect(a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h).toBe(false);
      }
      expect(plots.some(p => p.size === 's')).toBe(true);
    }
    expect(STREET).toBeGreaterThan(40);
  });
});

/** Cities of every size: brand new, and the scripted child's city at points along the way. */
function cities(): CityState[] {
  const rounds = [3, 15, 40, 90, 200, 400, 650, 900], run = simulate(900, rounds);
  return [freshCity(), ...rounds.map(r => run.at.get(r)!), { ...run.state, blocks: [...run.state.blocks, 24, 25, 26, 27, 28, 29, 30, 31] }];
}

function drive(city: CityState, ref: JobRef, seed: number) {
  const job = planJob(city, ref), sim = createJob(job.plan, job.stats, seeded(seed));
  let steps = 0;
  const limit = 240 / STEP;
  while (!sim.done && steps < limit) { stepJob(sim, scriptedTarget(sim)); steps++; }
  return { job, sim, seconds: steps * STEP };
}

describe('Jobs made from his own city', () => {
  const all = cities();
  it('every named Job, in every city that can do it, is drivable to the end', () => {
    let driven = 0;
    for (const city of all) for (const j of NAMED_JOBS) {
      const { job, sim, seconds } = drive(city, { named: j }, driven + 7);
      expect(sim.done, `${j.name} in a city of ${city.blocks.length} Blocks: stopped at stop ${sim.next} after ${seconds}s`).toBe(true);
      expect(job.plan.stops.length).toBeGreaterThanOrEqual(Math.min(MIN_STOPS, 3));
      driven++;
    }
    expect(driven).toBeGreaterThan(300);
  }, 60_000);
  it('1,200 numbered Jobs (the endless ones) are drivable to the end, about a minute or less, in equal groups of 10 or less', () => {
    const times: number[] = [], JOBS = 1200;
    for (let n = 1; n <= JOBS; n++) {
      const city = all[n % all.length]!, ref = nextJob({ ...city, named: NAMED_JOBS.map(j => j.key), done: n - 1 }) as JobRef;
      const { job, sim, seconds } = drive(city, 'named' in ref ? { n, kind: 'bus' } : { ...ref, n }, n);
      expect(sim.done, `Job ${n}: stopped at stop ${sim.next} of ${job.plan.stops.length}`).toBe(true);
      expect(job.plan.stops.length).toBeLessThanOrEqual(MAX_STOPS);
      expect(job.plan.group).toBeLessThanOrEqual(MOST_GROUP);
      expect(job.plan.group * job.plan.stops.length).toBeLessThanOrEqual(MOST_COLLECTED);
      expect(sim.collected).toBe(job.plan.group * job.plan.stops.length);
      if (!job.stats.fly) for (const s of job.plan.stops) expect(onStreet(s.at, job.plan.bounds, 2), `a stop off the street in Job ${n}`).toBe(true);
      times.push(seconds);
    }
    times.sort((a, b) => a - b);
    console.log(`numbered Jobs driven by a scripted finger: median ${times[JOBS / 2]!.toFixed(0)}s, longest ${times[JOBS - 1]!.toFixed(0)}s`);
    expect(times[JOBS - 1]!).toBeLessThan(150);
  }, 120_000);
  it('the same Job is the same route every time, so a reload doesn\'t change it', () => {
    const city = all[5]!;
    for (let n = 1; n < 50; n++) expect(JSON.stringify(planJob(city, { n, kind: 'taxi' }).plan)).toBe(JSON.stringify(planJob(city, { n, kind: 'taxi' }).plan));
  });
  it('a bigger city makes longer Jobs', () => {
    const small = planJob(all[0]!, { n: 5, kind: 'bus' }).plan.stops.length, big = planJob(all[all.length - 1]!, { n: 5, kind: 'bus' }).plan.stops.length;
    expect(big).toBeGreaterThan(small);
  });
});
