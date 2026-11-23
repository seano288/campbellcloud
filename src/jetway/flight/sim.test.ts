// The Flight cannot be failed and he can never get stuck in it: every Route, in every plane, from every starting airport, reaches the
// far runway and stops, whatever a scripted child does (nothing at all, clumsy, or careful). It takes about a minute. Holding the
// throttle and following the lights are worth it: the careful child picks up every star and lands smoothly.
import { describe, expect, it } from 'vitest';
import { seeded } from '../../game/rng';
import { PLANE_MODELS, PLANE_SPECS } from '../airport/catalog';
import { ROUTES } from '../airport/routes';
import { HOLD_POINT, standFor } from '../airport/plot';
import { clumsyChild, createFlight, flyWith, idleChild, MAX_S, skilledChild, starsGot, STEP, stepFlight, takeEvents, TOO_HIGH, type Child, type FlightSetup } from './sim';

const bare = (id: string): boolean => id === 'none';
const built = (id: string): boolean => id !== 'none';
function setup(route = 0, model: (typeof PLANE_MODELS)[number] = 'twoseater', owned = bare): FlightSetup {
  const spec = PLANE_SPECS[model];
  return { dest: ROUTES[route]!, ability: spec.ability, speed: spec.speed, runway: 900, approachLights: owned('sign:approach'), taxi: spec.ability === 'heli' ? null : { from: standFor(owned), owned } };
}
const CHILDREN: [string, Child][] = [['does nothing', idleChild], ['clumsy', clumsyChild], ['careful', skilledChild]];

describe('the Flight', () => {
  for (const [name, child] of CHILDREN) {
    it(`a child who is ${name} reaches the far runway on every Route in every plane`, () => {
      for (const [i] of ROUTES.entries()) for (const m of PLANE_MODELS) for (const owned of [bare, built]) {
        const f = flyWith(setup(i, m, owned), child, seeded(i * 13 + m.length), STEP * 2);
        expect(f.phase, `${ROUTES[i]!.name} ${m}`).toBe('done');
        expect(f.t).toBeLessThan(MAX_S);
        expect(f.alt).toBe(0);
        expect(f.x).toBeGreaterThan(f.threshold - 200);
      }
    });
  }
  it('takes about a minute', () => {
    const times = ROUTES.map((_, i) => flyWith(setup(i), idleChild, seeded(i)).t);
    expect(Math.min(...times)).toBeGreaterThan(35);
    expect(Math.max(...times)).toBeLessThan(95);
  });
  it('the careful child picks up every star and lands smoothly; doing nothing picks up few', () => {
    for (const [i, r] of ROUTES.entries()) {
      const f = flyWith(setup(i, 'turboprop', built), skilledChild, seeded(i));
      expect(starsGot(f), r.name).toBe(r.stars.length);
      expect(f.grade).toBe(3);
      expect(starsGot(flyWith(setup(i), idleChild, seeded(i)))).toBeLessThan(r.stars.length);
    }
  });
  it('a finger held off the plot only takes the plane to the edge, and the follow-me car leads it to the runway', () => {
    const f = createFlight(setup(0));
    let led = false;
    while (f.phase === 'taxi') { stepFlight(f, { taxiTo: { x: 5000, y: -5000 } }); if (takeEvents(f).some(e => e.t === 'followme')) led = true; }
    expect(led).toBe(true);
    expect(f.t).toBeLessThan(40);
  });
  it('leaving the taxiway only slows him: grass is slower, never a stop', () => {
    const f = createFlight(setup(0, 'twoseater', bare));
    const x0 = f.tx;
    for (let i = 0; i < 120; i++) stepFlight(f, { taxiTo: { x: f.tx, y: 100 } });
    expect(f.onGrass).toBe(true);
    expect(Math.hypot(f.tx - x0, f.ty - 535)).toBeGreaterThan(30);
  });
  it('the throttle speeds up the take-off, and letting go only slows it', () => {
    const time = (throttle: boolean) => { const f = createFlight({ ...setup(0), taxi: null }); while (f.phase === 'roll') stepFlight(f, { throttle }); return f.t; };
    expect(time(true)).toBeLessThan(time(false));
    expect(time(false)).toBeLessThan(10);
  });
  it('too high over the runway goes round once, then lands itself', () => {
    const f = createFlight({ ...setup(0), taxi: null });
    while (f.phase !== 'done') stepFlight(f, { throttle: true, alt: f.phase === 'approach' ? 500 : null });
    expect(f.goArounds).toBe(1);
    expect(f.autoland).toBe(true);
    expect(TOO_HIGH).toBeGreaterThan(0);
  });
  it('the ground can\'t be hit: holding the finger at the bottom keeps it in the sky until the approach', () => {
    const f = createFlight({ ...setup(5), taxi: null });
    let low = Infinity;
    while (f.phase !== 'done') { stepFlight(f, { throttle: true, alt: -500 }); if (f.phase === 'cruise') low = Math.min(low, f.alt); }
    expect(low).toBeGreaterThan(40);
  });
  it('the water bomber puts fires out by dropping over them; the helicopter lifts straight up', () => {
    const f = flyWith(setup(3, 'bomber', built), skilledChild, seeded(1));
    expect(f.fires.every(Boolean)).toBe(true);
    const h = createFlight(setup(3, 'heli', built));
    expect(h.phase).toBe('roll');
    while (h.phase === 'roll') stepFlight(h, { throttle: true });
    expect(h.x).toBeLessThan(300);
  });
  it('Approach Lights start the line of lights further out', () => {
    expect(createFlight(setup(0, 'twoseater', built)).lightAt.length).toBeGreaterThan(createFlight(setup(0)).lightAt.length);
  });
  it('the taxi ends at the runway\'s hold point', () => {
    const f = createFlight(setup(0, 'jumbo', built));
    while (f.phase === 'taxi') stepFlight(f, {});
    expect(Math.hypot(f.tx - HOLD_POINT.x, f.ty - HOLD_POINT.y)).toBeLessThan(41);
  });
});
