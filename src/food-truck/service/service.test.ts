// The Service can't be failed: whatever a child does (plays it properly, drags things anywhere, taps every tray, or does nothing at all)
// it ends, with everyone who came fed, on every truck, with any parts. And nothing he can touch is smaller than 44px, on every screen.
import { describe, expect, it } from 'vitest';
import { seeded } from '../../game/rng';
import { HELPERS, TRUCKS, type HelperId, type TruckId } from '../truck/parts';
import type { Setup } from '../truck/state';
import { REGULARS } from '../truck/world';
import { createService, layoutFor, nextStep, pointerDown, pointerMove, pointerUp, SERVICE_S, STEP, stepService, takeEvents, whereFor, type Service, type ServiceEvent } from './service';

const noHelpers = Object.fromEntries(HELPERS.map(h => [h.id, false])) as Record<HelperId, boolean>;
const setup = (over: Partial<Setup> = {}): Setup => ({ truck: 'taco', spot: 'park', grills: 1, line: 2, gap: 7, helpers: noHelpers, regular: null, toppings: [1, 3], ...over });

type Child = (s: Service, rng: () => number) => void;
/** Runs a Service with a child doing `act` every so often; returns it once done (or after ten minutes, which would be a failure). */
function play(su: Setup, act: Child, seed = 1, w = 810, h = 1000) {
  const rng = seeded(seed), s = createService(su, w, h, rng), events: ServiceEvent[] = [];
  let arrived = 0;
  for (let i = 0; i < 60 * 600 && s.phase !== 'done'; i++) {
    if (i % 20 === 0) act(s, rng);
    stepService(s, STEP);
    for (const e of takeEvents(s)) { events.push(e); if (e.t === 'arrive') arrived++; }
  }
  return { s, events, arrived };
}

/** A child who knows what to do: drags the right thing to the right place, holds to cook, drags the food up to the customer. */
const good: Child = s => {
  const step = nextStep(s);
  if (!step || s.pieces.some(p => p.state === 'held')) return;
  const { from, to, hold } = whereFor(s, step);
  pointerDown(s, 1, from.x, from.y);
  if (hold) { for (let k = 0; k < 90; k++) stepService(s, STEP); pointerUp(s, 1, from.x, from.y); return; }
  pointerMove(s, 1, (from.x + to!.x) / 2, (from.y + to!.y) / 2);
  pointerMove(s, 1, to!.x + 20, to!.y - 15); // a little off: it snaps
  pointerUp(s, 1, to!.x + 20, to!.y - 15);
};
/** Taps trays at random and drops things anywhere. */
const messy: Child = (s, rng) => {
  const L = s.layout, x = rng() * L.w, y = rng() * L.h;
  const t = L.trays[Math.floor(rng() * L.trays.length)]!;
  if (rng() < .5) { pointerDown(s, 2, t.x, t.y); pointerUp(s, 2, t.x, t.y); return; }
  pointerDown(s, 2, t.x, t.y); pointerMove(s, 2, x, y); pointerUp(s, 2, x, y);
};
const idle: Child = () => {};

describe('the Service', () => {
  it('a child who plays it properly feeds everyone who came, and a minute brings several customers', () => {
    for (const truck of TRUCKS.map(k => k.id)) {
      const { s, arrived, events } = play(setup({ truck: truck as TruckId }), good);
      expect(s.phase, truck).toBe('done');
      expect(s.fed, truck).toBe(arrived);
      expect(arrived, truck).toBeGreaterThanOrEqual(5);
      expect(events.some(e => e.t === 'auto'), `${truck}: nothing should have needed doing for him`).toBe(false);
      expect(s.t).toBeLessThan(SERVICE_S + 40);
    }
  });
  it('can not be failed: a child who does nothing, or drops things anywhere, still finishes with everyone fed', () => {
    for (const [name, child] of [['idle', idle], ['messy', messy]] as const) for (const truck of ['taco', 'burger', 'smoothie'] as const) for (const seed of [1, 2, 3]) {
      const { s, arrived } = play(setup({ truck, toppings: [1, 3] }), child, seed);
      expect(s.phase, `${name} ${truck} ${seed}`).toBe('done');
      expect(s.fed).toBe(arrived);
      expect(arrived).toBeGreaterThanOrEqual(1);
    }
  });
  it('every part and helper still finishes, and the big grill and fast speaker feed more people', () => {
    const allOn = Object.fromEntries(HELPERS.map(h => [h.id, true])) as Record<HelperId, boolean>;
    for (const helpers of [noHelpers, allOn, ...HELPERS.map(h => ({ ...noHelpers, [h.id]: true }))]) for (const grills of [1, 2, 3]) {
      const { s, arrived } = play(setup({ helpers, grills, line: Math.max(grills, 4), gap: 4 }), good);
      expect(s.phase).toBe('done');
      expect(s.fed).toBe(arrived);
    }
    const small = play(setup({ grills: 1, line: 2, gap: 7 }), good).s.fed, big = play(setup({ grills: 3, line: 4, gap: 4 }), good).s.fed;
    expect(big).toBeGreaterThan(small);
  });
  it('a wrong topping bounces back to its tray and the food is untouched', () => {
    const s = createService(setup({ toppings: [1, 1] }), 810, 1000, seeded(4));
    while (!s.foods[0]) stepService(s, STEP);
    const order = s.customers[0]!.order, wrong = s.kind.toppings.map(t => t.id).find(t => !order.includes(t))!;
    // the base first
    const base = s.layout.trays[0]!, spot = s.layout.spots[0]!;
    pointerDown(s, 1, base.x, base.y); pointerMove(s, 1, spot.x, spot.y); pointerUp(s, 1, spot.x, spot.y);
    for (let k = 0; k < 60; k++) stepService(s, STEP);
    expect(s.foods[0]!.base).toBe(true);
    takeEvents(s);
    const tray = s.layout.trays.find(t => t.id === wrong)!;
    pointerDown(s, 1, tray.x, tray.y); pointerMove(s, 1, spot.x, spot.y); pointerUp(s, 1, spot.x, spot.y);
    expect(takeEvents(s)).toContainEqual({ t: 'wrong', why: 'order' });
    for (let k = 0; k < 60; k++) stepService(s, STEP);
    expect(s.foods[0]!.toppings).toEqual([]);
    expect(s.pieces).toHaveLength(0);
  });
  it('brings the new Regular, second in line, and remembers him once fed', () => {
    const regular = REGULARS.find(r => r.truck === 'pizza')!;
    const { s, events } = play(setup({ truck: 'pizza', regular }), good);
    expect(events.filter(e => e.t === 'arrive').map(e => (e as { regular: string | null }).regular)[1]).toBe(regular.name);
    expect(s.metRegular).toBe(regular.id);
  });
});

describe('the Service layout', () => {
  const screens = [[810, 1000], [1080, 730], [390, 760], [844, 330], [1366, 950], [320, 560]] as const;
  it('keeps every tray and grill spot at least 48px across, on screen and above the floor, never overlapping', () => {
    for (const [w, h] of screens) for (const grills of [1, 2, 3]) {
      const L = layoutFor(w, h, ['base', 'a', 'b', 'c', 'd', 'e'], grills, 4);
      expect(L.r * 2, `${w}x${h}`).toBeGreaterThanOrEqual(48);
      expect(L.sr * 2).toBeGreaterThanOrEqual(48);
      const things = [...L.trays.map(t => ({ ...t, r: L.r })), ...L.spots.map(p => ({ ...p, r: L.sr }))];
      for (const t of things) {
        expect(t.x - t.r, `${w}x${h}`).toBeGreaterThanOrEqual(0);
        expect(t.x + t.r).toBeLessThanOrEqual(w);
        expect(t.y - t.r).toBeGreaterThanOrEqual(L.streetH);
        expect(t.y + t.r, `${w}x${h} grills ${grills}`).toBeLessThanOrEqual(h - 56 + 1);
      }
      for (let i = 0; i < things.length; i++) for (let j = i + 1; j < things.length; j++) {
        const a = things[i]!, b = things[j]!;
        expect(Math.hypot(a.x - b.x, a.y - b.y), `${w}x${h}`).toBeGreaterThan(a.r + b.r);
      }
    }
  });
});
