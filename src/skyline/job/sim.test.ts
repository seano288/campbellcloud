// The Job can't be failed or got stuck in, whatever his finger does, and the Jobs made from his city don't repeat.
// gen.test.ts drives every Job with a perfect finger; here the finger is a six-year-old's: held on buildings, off the map, at the
// edges, lifted, moved about at random, then at last on the star. From wherever that leaves him, every stop must still be reached.
import { describe, expect, it } from 'vitest';
import { seeded } from '../../game/rng';
import { NAMED_JOBS } from '../city/catalog';
import { freshCity, nextJob, type CityState } from '../city/city';
import { simulate } from '../city/economy';
import { worldSize } from '../city/grid';
import { planJob } from './plan';
import { createJob, scriptedTarget, STEP, stepJob } from './sim';

const run = simulate(700, [2, 30, 120, 400]);
const cities: CityState[] = [freshCity(), ...[2, 30, 120, 400].map(r => run.at.get(r)!), run.state];

describe('a clumsy finger', () => {
  it('20 seconds of random holds anywhere, then the star: never stuck, never off the map', () => {
    let worst = 0;
    for (let n = 1; n <= 90; n++) {
      const city = cities[n % cities.length]!, rng = seeded(n * 31);
      const ref = n % 3 ? nextJob({ ...city, named: NAMED_JOBS.map(j => j.key), done: n }) : nextJob(city);
      const job = planJob(city, ref), sim = createJob(job.plan, job.stats, seeded(n)), { w, h } = worldSize(job.plan.bounds);
      let target: { x: number; y: number } | null = null, until = 0;
      for (let t = 0; t < 20; t += STEP) {
        if (t >= until) {
          const r = rng();
          target = r < .2 ? null : r < .3 ? { x: -200 + rng() * (w + 400), y: -200 + rng() * (h + 400) } : { x: rng() * w, y: rng() * h };
          until = t + .2 + rng() * 2;
        }
        stepJob(sim, target);
        expect(sim.car.x >= 0 && sim.car.x <= w && sim.car.y >= 0 && sim.car.y <= h).toBe(true);
      }
      let steps = 0;
      while (!sim.done && steps < 200 / STEP) { stepJob(sim, scriptedTarget(sim)); steps++; }
      expect(sim.done, `Job ${n} (${job.kind}) stuck at stop ${sim.next} of ${job.plan.stops.length}, at ${sim.car.x.toFixed(0)},${sim.car.y.toFixed(0)}`).toBe(true);
      worst = Math.max(worst, steps * STEP);
    }
    expect(worst).toBeLessThan(120);
  }, 60_000);
});

describe('Jobs made from his city', () => {
  it("don't repeat: the next ten numbered Jobs in the same city are ten different routes", () => {
    for (const city of cities.slice(1)) {
      const done = { ...city, named: NAMED_JOBS.map(j => j.key) };
      for (let start = 50; start < 400; start += 70) {
        const routes = Array.from({ length: 10 }, (_, k) => {
          const ref = nextJob({ ...done, done: start + k });
          return JSON.stringify([ref, planJob(city, ref).plan.stops.map(s => s.plot)]);
        });
        expect(new Set(routes).size, `Jobs ${start + 1} to ${start + 10}`).toBe(10);
      }
    }
  });
});
