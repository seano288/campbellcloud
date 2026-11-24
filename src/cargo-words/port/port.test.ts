// The Port: buying, what pieces change, the sea chart and its waiting harbours, paying for a go, ranks without end, and the endless layer
// (generated ships, chart harbours with flags, special crates), thousands of each checked: the same every time, every ship can be loaded
// to the end by a scripted child, and nothing generated is ever for sale.
import { describe, expect, it } from 'vitest';
import { seeded } from '../../game/rng';
import { capacity, carefulChild, clumsyChild, createCrane, playWith } from '../crane/sim';
import { cargoFor } from '../crane/cargo';
import { CRANES, FOR_SALE, ITEMS, REPEATS, repeatPrice, SHIP_SHAPES, SHIPS, STARTERS, craneSpec } from './catalog';
import {
  berths, bought, canLoad, finishGo, freshPort, has, missingNeed, nextHarbour, payFor, planGo, proposePurchase, rankOf, readPort, reachOf, quickKey, specOf, waiting, type PortState,
} from './port';
import { chartHarbour, CRATES, FIRST_CHART, HARBOURS, isSpecialId, specialFor, SPECIAL_EVERY, SPECIALS, visitor } from './sea';
import { PLACES, STRIPS, VEHICLES } from './plot';
import { WORDS } from '../words/words';

const own = (p: PortState, ...ids: string[]): PortState => ({ ...p, owned: [...new Set([...p.owned, ...ids])] });

describe('buying', () => {
  it('costs what it says, needs what it needs, and is never bought twice', () => {
    const p = freshPort();
    expect(proposePurchase(p, { kind: 'item', id: 'piece:berth2' }, 5)).toMatchObject({ kind: 'rejected', reason: 'insufficient-funds' });
    expect(proposePurchase(p, { kind: 'item', id: 'piece:berth3' }, 999)).toMatchObject({ kind: 'rejected', reason: 'not-yet' });
    const r = proposePurchase(p, { kind: 'item', id: 'piece:berth2' }, 12);
    expect(r).toMatchObject({ kind: 'ready', cost: 12 });
    if (r.kind === 'ready') expect(proposePurchase(r.state, { kind: 'item', id: 'piece:berth2' }, 99)).toMatchObject({ kind: 'rejected', reason: 'already-owned' });
  });
  it('a ship needs a free berth: the wooden pier holds the Tug, each berth one more', () => {
    const p = own(freshPort(), 'piece:fishmarket');
    expect(berths(p)).toBe(1);
    expect(missingNeed(p, { kind: 'item', id: 'ship:fishing' })).toBe('berth');
    expect(missingNeed(own(p, 'piece:berth2'), { kind: 'item', id: 'ship:fishing' })).toBeNull();
  });
  it('a bought ship sails next, if his crane reaches it; a bought crane is the one he works', () => {
    let p = own(freshPort(), 'piece:berth2');
    p = bought(p, { kind: 'item', id: 'ship:feeder' });
    expect(p.next).toBe('feeder');
    p = bought(own(p, 'piece:berth3', 'piece:longquay'), { kind: 'item', id: 'ship:boxship' });
    expect(canLoad(p, 'boxship')).toBe(false);
    expect(p.next).toBe('feeder');
    p = bought(own(p, 'piece:rails'), { kind: 'item', id: 'crane:gantry' });
    expect(p.crane).toBe('crane:gantry');
    expect(canLoad(p, 'boxship')).toBe(true);
  });
  it('parts make the crane quicker and give it the twin grab', () => {
    const base = specOf(freshPort()), fast = specOf(own(freshPort(), 'part:cable2', 'part:cable3', 'part:trolley2', 'part:twin'));
    expect(fast.cable).toBeGreaterThan(base.cable); expect(fast.trolley).toBeGreaterThan(base.trolley); expect(fast.twin).toBe(true);
    expect(craneSpec(() => false).twin).toBe(false);
  });
  it('every crane reaches further than the one before it, and every ship he can own can be loaded by some crane', () => {
    for (const s of SHIPS) expect(CRANES.some(c => SHIP_SHAPES[s.kind].cols <= c.reach.cols && SHIP_SHAPES[s.kind].tiers <= c.reach.tiers), s.kind).toBe(true);
    expect(capacity(CRANES.at(-1)!.reach)).toBeGreaterThan(capacity(CRANES[0].reach));
  });
  it('the again-and-again things rise gently then stay flat, and are never over 400', () => {
    for (const r of REPEATS) {
      const prices = Array.from({ length: 50 }, (_, k) => repeatPrice(r.id, k));
      for (let k = 1; k < prices.length; k++) expect(prices[k]! - prices[k - 1]!).toBeGreaterThanOrEqual(0);
      expect(prices.at(-1)).toBe(r.top);
      expect(r.top).toBeLessThanOrEqual(400);
    }
  });
  it('prices up to 100 are any number, past it whole tens, never over 400; a cheap thing always beside a dear one', () => {
    for (const i of FOR_SALE) { expect(i.price).toBeLessThanOrEqual(400); if (i.price > 100) expect(i.price % 10).toBe(0); }
    expect(FOR_SALE.filter(i => i.price <= 15).length).toBeGreaterThan(40);
  });
  it('every piece has its own place, and no two places overlap except layers of one place (the quay strips, the solar roof)', () => {
    const ids = Object.keys(PLACES).filter(id => !STRIPS.includes(id) && !VEHICLES.includes(id));
    for (const a of ids) for (const b of ids) if (a < b) {
      const x = PLACES[a]!, y = PLACES[b]!;
      expect(x.x < y.x + y.w && y.x < x.x + x.w && x.y < y.y + y.h && y.y < x.y + x.h, `${a} overlaps ${b}`).toBe(false);
    }
    // berths have theirs along the quay (BERTH_X)
    for (const i of ITEMS) if (i.cat === 'piece' && i.does !== 'berth') expect(PLACES[i.id], i.id).toBeTruthy();
  });
  it('reads any old save safely', () => {
    expect(readPort(null)).toEqual(freshPort());
    expect(readPort({ owned: ['nope'], goes: -1, tonnes: 'x' })).toMatchObject({ goes: 0, tonnes: 0 });
    expect(readPort({}).owned).toEqual(expect.arrayContaining([...STARTERS]));
  });
});

describe('the sea chart', () => {
  it('sails to the named harbours in order, skipping one that waits for a piece, then the chart without end', () => {
    let p = freshPort();
    const order: string[] = [];
    for (let i = 0; i < 30; i++) {
      const plan = planGo(p), res = { loaded: capacity(plan.shape), tallest: 1, seconds: 30 };
      order.push(plan.harbour.name);
      p = { ...finishGo(p, plan, res, payFor(p, plan, res)), ships: 1 };
    }
    expect(order[0]).toBe('Pebble Bay');
    expect(order).not.toContain('Lighthouse Rock');
    expect(waiting(p).map(h => h.name)).toContain('Lighthouse Rock');
    expect(order.slice(-3).every(n => !HARBOURS.some(h => h.name === n))).toBe(true);
    expect(nextHarbour(own(p, 'piece:lighthouse')).name).toBe('Lighthouse Rock');
  });
  it('a named harbour sends back its crate once; every fifth go a special crate; neither is ever for sale', () => {
    const forSale = new Set(FOR_SALE.map(i => i.id));
    for (const c of CRATES) expect(forSale.has(c.id)).toBe(false);
    for (const s of SPECIALS) expect(forSale.has(s.id)).toBe(false);
    const p = freshPort(), plan = planGo(p), pay = payFor(p, plan, { loaded: 2, tallest: 1, seconds: 20 });
    expect(pay.crate?.name).toBe('Pebble Path');
    expect(has(finishGo(p, plan, { loaded: 2, tallest: 1, seconds: 20 }, pay), 'crate:pebble')).toBe(true);
  });
  it('ranks go on for ever', () => {
    expect(rankOf(0).name).toBe('Wooden Pier');
    const a = rankOf(1_000_000), b = rankOf(2_000_000);
    expect(a.name).toBe('Super Port'); expect(b.number).toBeGreaterThan(a.number);
  });
});

describe('the endless layer, thousands of each', () => {
  it('3,000 chart harbours: the same every time, never waiting for a piece, each with a flag and a name from the clips', () => {
    const names = new Set<string>();
    for (let n = FIRST_CHART; n < FIRST_CHART + 3000; n++) {
      const h = chartHarbour(n);
      expect(chartHarbour(n)).toEqual(h);
      expect(h.needs).toBeNull();
      expect(h.flag.a).not.toBe(h.flag.b);
      expect(h.name.startsWith(`${h.first} ${h.second}`)).toBe(true);
      names.add(h.name);
    }
    expect(names.size).toBe(3000);
  });
  it('3,000 special crates: one every fifth go, the hand-made ones first, then numbered Lucky Containers, each its own', () => {
    const ids = new Set<string>();
    for (let n = 1; n <= 15000; n++) {
      const s = specialFor(n);
      if (n % SPECIAL_EVERY) { expect(s).toBeNull(); continue; }
      expect(s).toBeTruthy();
      expect(isSpecialId(s!.id)).toBe(true);
      expect(ids.has(s!.id)).toBe(false);
      ids.add(s!.id);
    }
    expect(ids.size).toBe(3000);
  });
  it('3,000 visiting ships: the same every time, as big as the crane reaches and no bigger, growing with the go number', () => {
    for (const c of CRANES) for (let n = 1; n <= 3000; n++) {
      const v = visitor(n, c.reach);
      expect(visitor(n, c.reach)).toEqual(v);
      expect(v.shape.cols).toBeLessThanOrEqual(c.reach.cols); expect(v.shape.tiers).toBeLessThanOrEqual(c.reach.tiers);
      expect(v.shape.cols).toBeGreaterThanOrEqual(2);
    }
    const early = capacity(visitor(3, CRANES[4].reach).shape), late = capacity(visitor(300, CRANES[4].reach).shape);
    expect(late).toBeGreaterThan(early);
  });
  it('3,000 goes in a row: every ship is loaded to the end by a careful child (every tenth by a clumsy one), and sails', () => {
    let p: PortState = own(freshPort(), 'piece:rails', 'piece:deepquay', 'piece:longquay', 'crane:tall', 'crane:gantry', 'crane:giant', 'part:twin', 'part:cable2', 'part:trolley2');
    p = { ...p, crane: 'crane:dock' };
    const rng = seeded(4);
    for (let g = 1; g <= 3000; g++) {
      // the crane he works changes as he'd buy better ones
      p = { ...p, crane: g < 300 ? 'crane:dock' : g < 900 ? 'crane:tall' : g < 1800 ? 'crane:gantry' : 'crane:giant', ships: 1 };
      const plan = planGo(p), words = cargoFor(['rabbit', 'sunset'], capacity(plan.shape), plan.n);
      expect(words.flat()).toHaveLength(capacity(plan.shape));
      expect(plan.shape.cols).toBeLessThanOrEqual(reachOf(p).cols);
      if (g % 10 === 0 || g < 50) {
        const c = playWith(createCrane(specOf(p), plan.shape, words), g % 10 === 0 ? clumsyChild : carefulChild, rng, 1500);
        expect(c.phase, `go ${g}`).toBe('done');
      }
      const res = { loaded: capacity(plan.shape), tallest: plan.shape.tiers, seconds: 40 };
      p = finishGo(p, plan, res, payFor(p, plan, res));
    }
    expect(p.goes).toBe(3000);
  }, 60_000);
  it('the quay\'s words are whole words from the table, his newest first', () => {
    const w = cargoFor(['rabbit', 'sunset', 'tiger'], 6, 1);
    expect(w.slice(0, 3).map(x => x.join(''))).toEqual(['tiger', 'sunset', 'rabbit']);
    for (let n = 1; n < 200; n++) for (const cap of [2, 3, 5, 8, 12, 18]) {
      const words = cargoFor([], cap, n);
      expect(words.flat()).toHaveLength(cap);
      for (const x of words) expect(WORDS.some(t => t.word === x.join(''))).toBe(true);
    }
  });
  it('a quickest loading is kept for each number of containers, so a best on a ship of 10 is never set against a ship of 18', () => {
    expect(quickKey({ cols: 2, tiers: 1 })).toBe('2'); expect(quickKey({ cols: 6, tiers: 3 })).toBe('18');
    let p = freshPort();
    const plan = (cols: number, tiers: number) => ({ ...planGo(p), shape: { cols, tiers } });
    p = finishGo(p, plan(5, 2), { loaded: 10, tallest: 2, seconds: 40 }, { tonnes: 0, crate: null, special: null });
    // an 18-container ship is a new size: it sets its own best, and doesn't have to beat the 10's 40 seconds
    expect(payFor(p, plan(6, 3), { loaded: 18, tallest: 3, seconds: 90 }).bestQuick).toBe(false);
    p = finishGo(p, plan(6, 3), { loaded: 18, tallest: 3, seconds: 90 }, { tonnes: 0, crate: null, special: null });
    expect(p.bests.quick).toEqual({ 10: 40, 18: 90 });
    expect(payFor(p, plan(6, 3), { loaded: 18, tallest: 3, seconds: 80 }).bestQuick).toBe(true);
    expect(payFor(p, plan(5, 2), { loaded: 10, tallest: 2, seconds: 41 }).bestQuick).toBe(false);
    expect(readPort(JSON.parse(JSON.stringify(p))).bests.quick).toEqual({ 10: 40, 18: 90 });
    expect(readPort({ bests: { quick: { 0: 5, small: 4, 18: -1, 12: 'x', 7: 30 } } }).bests.quick).toEqual({ 7: 30 });
  });
});
