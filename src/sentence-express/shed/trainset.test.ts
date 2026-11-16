import { describe, expect, it } from 'vitest';
import { int, seeded, type Rng } from '../../game/rng';
import { createRun, payFor, PAY_MAX, stepRun, tapPoints, carAt } from '../delivery/run';
import { bits, cellAt, count, erase, fillIn, isEnd, lay, opposite, starterLayout, step, trackSquares, type Layout } from '../layout/track';
import { CARS, ENGINES, LINE, MAX_CARS, PAINTS, SCENERY, START_SQUARES, TRACK } from './catalogue';
import {
  canPlace, capacityOf, finishDelivery, freshTrainSet, goalOf, ITEMS, planDelivery, placeScenery, proposePurchase, readTrainSet, SHOP, SHOP_TOTAL,
  readTrainSet as read, supplyOf, tableOf, use, withLayout, type ItemKey, type TrainSet,
} from './trainset';

/** Joins always go both ways and a square joins at most four sides. */
function wellJoined(l: Layout) {
  for (let c = 0; c < l.cells.length; c++) {
    expect(count(l.cells[c]!)).toBeLessThanOrEqual(4);
    for (const d of bits(l.cells[c]!)) { const n = step(l, c, d); expect(n).toBeGreaterThanOrEqual(0); expect(l.cells[n]! & opposite(d)).toBeTruthy(); }
  }
}

/** A child scribbling: strokes across the table, some starting on his track, some erasing. */
function scribble(t: TrainSet, rng: Rng, strokes: number): TrainSet {
  let l = t.layout;
  for (let k = 0; k < strokes; k++) {
    const pick = () => cellAt(l, int(rng, 0, l.w - 1), int(rng, 0, l.h - 1));
    const pts = Array.from({ length: int(rng, 2, 4) }, pick), path = [pts[0]!];
    for (let i = 1; i < pts.length; i++) path.push(...fillIn(l, pts[i - 1]!, pts[i]!));
    if (rng() < .2) l = erase(l, path.slice(0, int(rng, 1, 3)), Math.max(0, capacityOf(t) - trackSquares(l))).layout;
    else l = lay(l, path, Math.max(0, capacityOf(t) - trackSquares(l))).layout;
    wellJoined(l);
    expect(trackSquares(l)).toBeLessThanOrEqual(capacityOf(t) + 1e-9);
  }
  return { ...t, layout: l };
}

describe('the catalogue', () => {
  it('every price is at most 100 Bolts, the most the voice says', () => {
    for (const i of ITEMS) expect(i.price, i.name).toBeLessThanOrEqual(100);
  });
  it('names are all different (each is a clip) and the ladder is long', () => {
    expect(new Set(ITEMS.map(i => i.name)).size).toBe(ITEMS.length);
    expect(ENGINES.length).toBeGreaterThanOrEqual(12);
    expect(CARS.length).toBeGreaterThanOrEqual(20);
    expect(PAINTS.length).toBeGreaterThanOrEqual(20);
    expect(SCENERY.length).toBeGreaterThanOrEqual(45);
    expect(LINE.length).toBe(8);
    expect(SHOP_TOTAL).toBeGreaterThanOrEqual(3500);
  });
  it('the brief\'s prices: track 2 to 5, engines about 30, 60 and 100', () => {
    for (const t of TRACK) if ('squares' in t) { expect(t.price).toBeGreaterThanOrEqual(2); expect(t.price).toBeLessThanOrEqual(5); }
    expect(ENGINES.find(e => e.id === 'steam')!.price).toBe(30);
    expect(ENGINES.find(e => e.id === 'diesel')!.price).toBe(60);
    expect(ENGINES.find(e => e.id === 'bullet')!.price).toBe(100);
    expect(ENGINES[0]!.price).toBe(0);
  });
});

describe('buying', () => {
  it('is all or nothing, and what he buys goes to use', () => {
    const t = freshTrainSet();
    expect(proposePurchase(t, 'engine:steam', 29).kind).toBe('rejected');
    const p = proposePurchase(t, 'engine:steam', 30);
    expect(p.kind).toBe('ready');
    if (p.kind !== 'ready') return;
    expect(p.cost).toBe(30);
    expect(p.state.engine).toBe('steam');
    expect(proposePurchase(p.state, 'engine:steam', 100).kind).toBe('rejected');
    const car = proposePurchase(t, 'car:coal', 10);
    expect(car.kind === 'ready' && car.state.cars).toEqual(['wagon', 'coal']);
    expect(proposePurchase(t, 'gift:barn', 100).kind).toBe('rejected');
  });
  it('a track box gives him more track; a table grows his Layout and keeps his track', () => {
    let t = freshTrainSet();
    expect(supplyOf(t)).toBe(START_SQUARES - trackSquares(t.layout));
    const box = proposePurchase(t, 'track:box1', 5);
    expect(box.kind === 'ready' && supplyOf(box.state)).toBe(supplyOf(t) + 12);
    const table = proposePurchase(t, 'track:table1', 25);
    if (table.kind !== 'ready') throw new Error('table');
    t = table.state;
    expect(tableOf(t)).toEqual({ w: 14, h: 9 });
    expect(t.layout.w).toBe(14);
    expect(trackSquares(t.layout)).toBe(trackSquares(freshTrainSet().layout));
  });
  it('a car can be uncoupled and coupled again, up to the most an engine pulls', () => {
    let t: TrainSet = { ...freshTrainSet(), owned: [...freshTrainSet().owned, ...CARS.map(c => `car:${c.id}` as ItemKey)] };
    for (const c of CARS) t = use(t, `car:${c.id}`);
    expect(t.cars.length).toBe(MAX_CARS);
    t = use(t, 'car:wagon');
    expect(t.cars).not.toContain('wagon');
  });
  it('the Goal is the cheapest thing he hasn\'t got, never something he has', () => {
    const t = freshTrainSet();
    const g = goalOf(t)!;
    expect(t.owned).not.toContain(g);
    expect(SHOP.find(i => i.key === g)!.price).toBeLessThanOrEqual(10);
  });
});

describe('the save', () => {
  it('reads anything: junk is a fresh train set', () => {
    for (const junk of [null, 3, 'x', [], { owned: 'no', layout: { w: 3 } }]) expect(readTrainSet(junk).engine).toBe('tank');
  });
  it('keeps what he made, and a Layout that doesn\'t join up comes back as the starter loop', () => {
    const t = scribble(freshTrainSet(), seeded(3), 6);
    const back = readTrainSet(JSON.parse(JSON.stringify(t)));
    expect(back.layout.cells).toEqual(t.layout.cells);
    const broken = JSON.parse(JSON.stringify(t));
    broken.layout.cells[0] = 2; // joins east, but its neighbour doesn't join back
    broken.layout.cells[1] = 0;
    expect(readTrainSet(broken).layout.cells).toEqual(starterLayout(12, 8).cells);
  });
});

describe('the track', () => {
  it('laying and erasing always leaves track joined both ways, within his supply', () => {
    for (let seed = 0; seed < 60; seed++) scribble(freshTrainSet(), seeded(seed), 8);
  });
  it('a loose end is closed up when there is a way to other track', () => {
    const t = freshTrainSet(), l = t.layout;
    // a spur out from the loop into the middle of the table
    const from = cellAt(l, 4, 1), path = [from, cellAt(l, 4, 2), cellAt(l, 4, 3)];
    const laid = lay(l, path, 40).layout;
    wellJoined(laid);
    expect(laid.cells.filter(isEnd).length).toBe(0);
  });
  it('a stroke that cuts across the loop makes points, and a straight line across a straight makes a crossing', () => {
    const l = starterLayout(12, 8);
    const across = lay(l, [cellAt(l, 5, 0), ...fillIn(l, cellAt(l, 5, 0), cellAt(l, 5, 7))], 40).layout;
    const top = across.cells[cellAt(l, 5, 1)]!;
    expect(count(top)).toBe(4);
  });
  it('scenery goes on an empty square; a tunnel only on straight track', () => {
    const l = starterLayout(12, 8);
    expect(canPlace(l, 'trees', cellAt(l, 5, 4))).toBe(true);
    expect(canPlace(l, 'trees', cellAt(l, 1, 1))).toBe(false);
    expect(canPlace(l, 'tunnel', cellAt(l, 3, 1))).toBe(true);
    expect(canPlace(l, 'tunnel', cellAt(l, 1, 1))).toBe(false);
    const placed = placeScenery(l, 'trees', cellAt(l, 5, 4));
    expect(canPlace(placed, 'flowers', cellAt(l, 5, 4))).toBe(false);
  });
});

describe('his Layout keeps what he has', () => {
  it('track drawn through a station, or rubbed out under it, leaves the station on the table', () => {
    const t = freshTrainSet(), l = t.layout, town = l.stations.find(s => s.id === 'town')!.cell, { x } = { x: town % l.w };
    // a stroke down across Toy Town's straight makes it a crossing, which is no place for a station
    const across = lay(l, [cellAt(l, x, 0), cellAt(l, x, 1), cellAt(l, x, 2), cellAt(l, x, 3)], supplyOf(t)).layout;
    expect(across.stations.some(s => s.id === 'town'), 'the track change alone takes it off').toBe(false);
    const kept = withLayout(t, across);
    expect(kept.layout.stations.map(s => s.id).sort()).toEqual(['farm', 'town']);
    const rubbed = withLayout(t, erase(l, [town], supplyOf(t)).layout);
    expect(rubbed.layout.stations.map(s => s.id).sort()).toEqual(['farm', 'town']);
  });
  it('the starter loop put back on a big table never takes more track than he has', () => {
    // the Giant Table and no Track Boxes: his own track rubbed out, so the Delivery puts the loop back
    let t = use({ ...freshTrainSet(), owned: [...freshTrainSet().owned, 'track:table3'] }, 'track:table3');
    expect(tableOf(t)).toEqual({ w: 18, h: 11 });
    t = { ...t, layout: erase(t.layout, t.layout.cells.map((_, c) => c), 0).layout };
    const plan = planDelivery(t);
    expect(plan.fixed).toBe(true);
    expect(trackSquares(plan.layout)).toBeLessThanOrEqual(capacityOf(t));
    // and a Layout in a save that doesn't join up comes back the same way
    const back = read({ ...JSON.parse(JSON.stringify(t)), layout: { w: 18, h: 11, cells: [2] } });
    expect(trackSquares(back.layout)).toBeLessThanOrEqual(capacityOf(back));
  });
});

describe('a Delivery', () => {
  /** A child driving: the throttle full on (or half), tapping points when they light up, sometimes not. */
  function drive(t: TrainSet, rng: Rng, tapsPoints: boolean) {
    const plan = planDelivery(t), run = createRun(plan.layout, plan.pickupCell, plan.townCell, t.cars.length)!;
    expect(run, 'the plan makes a run').not.toBeNull();
    let secs = 0;
    const throttle = rng() < .5 ? 1 : .55;
    while (run.leg !== 'done' && secs < 400) {
      if (run.leg === 'pickup' || run.leg === 'dropoff') run.throttle = throttle;
      if (tapsPoints && run.hint !== null && rng() < .1) tapPoints(run, run.hint);
      stepRun(run, 1 / 30);
      secs += 1 / 30;
      // every car is somewhere real (checked now and then: it's the slow part)
      if (Math.round(secs * 30) % 15 === 0) for (let k = 0; k <= run.cars; k++) { const p = carAt(run, k * .92); if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) throw new Error('a car is nowhere'); }
    }
    return { run, secs, plan };
  }
  it('the free first Delivery runs on the starter loop, and pays by the length of the train', () => {
    const t = freshTrainSet();
    const { run, plan } = drive(t, seeded(1), true);
    expect(run.leg).toBe('done');
    expect(plan.fixed).toBe(false);
    const done = finishDelivery(t, plan);
    expect(done.pay.bolts).toBe(payFor(1));
    expect(done.pay.gift).toBe('barn');
    expect(done.pay.opened).toBe('quarry');
    expect(done.state.deliveries).toBe(0);
    expect(done.state.owned).toContain('gift:barn');
    expect(done.state.layout.stations.some(s => s.id === 'quarry')).toBe(true);
    expect(payFor(MAX_CARS)).toBe(PAY_MAX);
    expect(payFor(0)).toBeGreaterThan(0);
  });
  it('a scripted child always finishes, on whatever Layout he has scribbled, tapping the points or not', () => {
    let worst = 0;
    for (let seed = 0; seed < 80; seed++) {
      const rng = seeded(seed);
      let t = scribble({ ...freshTrainSet(), owned: [...freshTrainSet().owned, 'track:box1', 'track:box2'] }, rng, int(rng, 0, 10));
      t = { ...t, open: int(rng, 1, 8), cars: ['wagon'] };
      const { run, secs } = drive(t, rng, rng() < .7);
      expect(run.leg, `seed ${seed}`).toBe('done');
      worst = Math.max(worst, secs);
    }
    expect(worst).toBeLessThan(200);
  }, 60000);
  it('also finishes when he has moved stations, put scenery in the way, grown his table and coupled a long train', () => {
    for (let seed = 0; seed < 30; seed++) {
      const rng = seeded(seed + 500), base = freshTrainSet();
      let t: TrainSet = { ...base, owned: [...base.owned, ...TRACK.map(r => `track:${r.id}` as ItemKey), ...CARS.map(c => `car:${c.id}` as ItemKey)] };
      const table = (['table1', 'table2', 'table3', null] as const)[int(rng, 0, 3)];
      if (table) t = use(t, `track:${table}`);
      t = { ...t, cars: CARS.slice(0, int(rng, 0, MAX_CARS)).map(c => c.id), open: int(rng, 1, 8) };
      let l = scribble(t, rng, int(rng, 0, 12)).layout;
      for (let k = 0; k < 4; k++) {
        const c = cellAt(l, int(rng, 0, l.w - 1), int(rng, 0, l.h - 1));
        if (rng() < .5) l = placeScenery(l, SCENERY[int(rng, 0, SCENERY.length - 1)]!.id, c);
        else if (l.cells[c] === 5 || l.cells[c] === 10) { const s = l.stations[int(rng, 0, l.stations.length - 1)]!; if (!l.stations.some(x => x.cell === c)) l = { ...l, stations: l.stations.map(x => (x === s ? { ...x, cell: c } : x)) }; }
      }
      t = { ...t, layout: l };
      for (let trip = 0; trip < 2; trip++) {
        const { run, plan } = drive(t, rng, rng() < .7);
        expect(run.leg, `seed ${seed} trip ${trip}`).toBe('done');
        t = finishDelivery({ ...t, deliveries: 1 }, { layout: run.layout, pickup: plan.pickup }).state;
      }
    }
  }, 120000);
  it('opens all eight stations, one a Delivery, each giving its gift once', () => {
    let t = freshTrainSet();
    const gifts: string[] = [];
    for (let k = 0; k < 10; k++) {
      t = { ...t, deliveries: t.deliveries + 1 };
      const plan = planDelivery(t), done = finishDelivery(t, plan);
      if (done.pay.gift) gifts.push(done.pay.gift);
      t = done.state;
    }
    expect(t.open).toBe(LINE.length);
    expect(new Set(gifts).size).toBe(LINE.length);
    expect(t.layout.stations.length).toBe(LINE.length + 1);
  });
});
