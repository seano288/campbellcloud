// "Watch it run" on airports from bare to fully built: planes land, park, leave and land again for as long as he watches; one plane is
// on the runway at a time; two planes never share a stand (pass 2 found a third plane parking on top of the first with two gates); and
// no more than the caps move at once.
import { describe, expect, it } from 'vitest';
import { FOR_SALE, PLANE_MODELS } from '../airport/catalog';
import { bought, freshAirport, type AirportState } from '../airport/airport';
import { createTraffic, MAX_PLANES, MAX_VEHICLES, stands, stepTraffic } from './traffic';

const own = (a: AirportState, ids: string[]) => ids.reduce((x, id) => bought(x, { kind: 'item', id }), a);
const AIRPORTS: [string, AirportState][] = [
  ['bare', freshAirport()],
  ['two gates, five planes', own(freshAirport(), ['piece:gate1', 'piece:gate2', 'piece:tarmac', ...['duster', 'float', 'turboprop', 'regional'].map(m => `plane:${m}`)])],
  ['everything, and twelve more gates', { ...own(freshAirport(), FOR_SALE.map(i => i.id)), more: { concourse: 9, gate: 12, hangar: 6, stretch: 7 } }],
];

describe('Watch it run', () => {
  for (const [name, a] of AIRPORTS) it(`${name}: keeps landing, one plane on the runway, one plane to a stand`, () => {
    const tr = createTraffic(a), dt = 1 / 30;
    expect(tr.planes.length).toBeLessThanOrEqual(MAX_PLANES);
    expect(tr.planes.length).toBeLessThanOrEqual(stands(a).length);
    expect(tr.vehicles.length).toBeLessThanOrEqual(MAX_VEHICLES);
    expect(new Set(tr.planes.map(p => `${p.stand.x},${p.stand.y}`)).size).toBe(tr.planes.length);
    let busy = 0, lost = 0;
    for (let i = 0; i < 30 * 600; i++) { // ten minutes of watching
      stepTraffic(tr, a, dt);
      if (tr.planes.filter(p => p.state === 'roll' || p.state === 'land').length > 1) busy++;
      for (const p of [...tr.planes, ...tr.vehicles]) if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) lost++;
    }
    expect(busy).toBe(0);
    expect(lost).toBe(0);
    expect(tr.landings).toBeGreaterThan(10);
  }, 20000);
  it('a bigger airport with more planes has more traffic', () => {
    const counts = AIRPORTS.map(([, a]) => createTraffic(a).planes.length);
    expect(counts[2]).toBeGreaterThan(counts[0]!);
    expect(createTraffic(AIRPORTS[2]![1]).planes.length).toBe(Math.min(MAX_PLANES, PLANE_MODELS.length - 1));
  });
});
