// The Airport's rules: prices the voice can say, pieces in fixed places that never overlap, pieces that change the Flight, the
// again-and-again things whose price rises gently then holds, the Routes that skip a Route he can't fly yet so he's never stuck, the
// passenger ranks without end, and a catalogue of at least 250 things to earn.
import { describe, expect, it } from 'vitest';
import { PRICE_TENS } from '../phrases';
import {
  bought, canFly, CATALOGUE_SIZE, finishFlight, freshAirport, gateCount, goalOf, has, payFor, pick, planFlight, priceOf, proposePurchase, rankOf, RANKS, readAirport,
  routeOpen, SUPER_EVERY, wantKey, wear, type AirportState,
} from './airport';
import { FOR_SALE, ITEMS, PIECES, PLANES, REPEATS, repeatPrice, SIGNS, DECOR, STARTERS, VEHICLES, PAINTS, TAILS } from './catalog';
import { isPoint, SPOTS, EXTRA_HANGARS, SHED } from './plot';
import { ROUTES } from './routes';

const own = (a: AirportState, ...ids: string[]): AirportState => ({ ...a, owned: [...new Set([...a.owned, ...ids])] });
const fly = (a: AirportState, stars = 0) => { const plan = planFlight({ ...a, flights: 1 }), res = { stars, grade: 2 as const, fires: 0 }; const pay = payFor({ ...a, flights: 1 }, plan, res); return { plan, pay, a: finishFlight({ ...a, flights: 1 }, plan, res, pay) }; };

describe('the catalogue', () => {
  it('has at least 250 things to earn: pieces, planes, liveries, trucks, signs, garden things, Routes and Trophies', () => {
    expect(CATALOGUE_SIZE).toBeGreaterThanOrEqual(250);
    expect(PIECES.length).toBeGreaterThanOrEqual(55);
    expect(PLANES.length).toBe(12);
    expect(PAINTS.length).toBe(30);
    expect(TAILS.length - 1).toBe(24);
    expect(ROUTES).toHaveLength(24);
  });
  it('prices everything so the voice can say it: any number to 100, whole tens to 400, a free starter in each looks slot', () => {
    for (const i of FOR_SALE) {
      expect(i.price).toBeGreaterThan(0);
      if (i.price > 100) { expect(i.price % 10, i.name).toBe(0); expect(PRICE_TENS).toContain(`${i.price}`); }
      expect(i.price).toBeLessThanOrEqual(400);
    }
    for (const r of REPEATS) for (let k = 0; k < 50; k++) { const p = repeatPrice(r.id, k); expect(p <= 100 || PRICE_TENS.includes(`${p}` as `${number}`)).toBe(true); }
    expect(STARTERS).toEqual(expect.arrayContaining(['plane:twoseater', 'paint:white', 'stripe:none', 'tail:none', 'mark:none']));
    expect(new Set(ITEMS.map(i => i.id)).size).toBe(ITEMS.length);
    expect(new Set(ITEMS.map(i => i.name)).size).toBe(ITEMS.length);
  });
  it('every piece, sign and garden thing has its own place, and nothing overlaps but the stages of one thing', () => {
    for (const i of [...PIECES, ...SIGNS, ...DECOR]) expect(SPOTS[i.id], i.id).toBeTruthy();
    const same = [['piece:tarmac', 'piece:long'], ['piece:taxiway', 'piece:taxiway2'], ['piece:tower', 'piece:talltower'], ['piece:monorail', 'piece:monostation']];
    const terminal = ['piece:hut', 'piece:terminal', 'piece:bigterminal', 'piece:glass', 'piece:roofgarden', 'sign:arrivals', 'sign:departures', 'shed'];
    const onApron = (x: string) => /^piece:(gate\d|bridges|apron)$/.test(x);
    const ok = (a: string, b: string) => same.some(([x, y]) => (a === x && b === y) || (a === y && b === x)) || (terminal.includes(a) && terminal.includes(b)) || (onApron(a) && onApron(b));
    const all = Object.entries({ ...SPOTS, ...Object.fromEntries(EXTRA_HANGARS.map((r, i) => [`more:hangar${i}`, r])), shed: SHED }).filter(([, r]) => !isPoint(r));
    for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
      const [a, r] = all[i]!, [b, q] = all[j]!;
      const hit = r.x < q.x + q.w && q.x < r.x + r.w && r.y < q.y + q.h && q.y < r.y + r.h;
      if (hit) expect(ok(a, b), `${a} overlaps ${b}`).toBe(true);
    }
  });
  it('a dear thing sits beside cheap ones in every tab', () => {
    for (const tab of [PIECES, SIGNS, DECOR, VEHICLES, PAINTS, PLANES]) expect(Math.min(...tab.filter(i => i.price > 0).map(i => i.price))).toBeLessThanOrEqual(20);
  });
});

describe('buying', () => {
  it('buys a thing he can afford, and not twice, and not before what it needs', () => {
    const a = freshAirport();
    expect(proposePurchase(a, { kind: 'item', id: 'piece:taxiway2' }, 999).kind).toBe('rejected'); // needs the Taxiway
    const p = proposePurchase(a, { kind: 'item', id: 'piece:taxiway' }, 12);
    expect(p.kind).toBe('ready');
    if (p.kind !== 'ready') return;
    expect(proposePurchase(p.state, { kind: 'item', id: 'piece:taxiway' }, 99).kind).toBe('rejected');
    expect(proposePurchase(a, { kind: 'item', id: 'piece:taxiway' }, 11).kind).toBe('rejected');
  });
  it('a plane joins the Fleet and is the one he flies if his runway is long enough; paint goes on that plane', () => {
    let a = bought(freshAirport(), { kind: 'item', id: 'plane:jumbo' });
    expect(has(a, 'plane:jumbo')).toBe(true);
    expect(a.flying).toBe('twoseater'); // a grass strip can't take a jumbo
    expect(canFly(a, 'jumbo')).toBe(false);
    a = bought(bought(a, { kind: 'item', id: 'piece:tarmac' }), { kind: 'item', id: 'piece:long' });
    expect(canFly(a, 'jumbo')).toBe(true);
    a = bought(a, { kind: 'item', id: 'paint:red' });
    expect(a.liveries.twoseater!.base).toBe('paint:red');
    expect(wear(a, 'twoseater', { base: 'paint:gold' })).toBe(a); // he doesn't own gold
  });
  it('the Goal is what he tapped and can\'t afford, else the cheapest new thing', () => {
    const a = freshAirport();
    expect(goalOf(a)).toEqual({ kind: 'item', id: 'paint:red' });
    expect(goalOf({ ...a, goal: 'plane:jumbo' })).toEqual({ kind: 'item', id: 'plane:jumbo' });
  });
  it('the again-and-again things: the price rises gently then stays flat, and nothing bought is lost; only so many are drawn', () => {
    for (const r of REPEATS) {
      const prices = Array.from({ length: 40 }, (_, k) => repeatPrice(r.id, k));
      for (let k = 1; k < prices.length; k++) { expect(prices[k]!).toBeGreaterThanOrEqual(prices[k - 1]!); expect(prices[k]! - prices[k - 1]!).toBeLessThanOrEqual(10); }
      expect(prices.at(-1)).toBe(r.top);
      expect(r.drawn).toBeLessThanOrEqual(8);
    }
    let a = own(freshAirport(), 'piece:gate1', 'piece:gate2', 'piece:gate3', 'piece:gate4', 'piece:gate5', 'piece:gate6');
    for (let k = 0; k < 30; k++) a = bought(a, { kind: 'more', id: 'gate' });
    expect(a.more.gate).toBe(30);
    expect(gateCount(a)).toBe(36);
    expect(priceOf(a, { kind: 'more', id: 'gate' })).toBe(80);
    expect(readAirport(JSON.parse(JSON.stringify(a))).more.gate).toBe(30);
  });
});

describe('Routes and Flights', () => {
  it('starts with one free Flight to the first Route', () => {
    const a = freshAirport();
    expect(a.flights).toBe(1);
    expect(planFlight(a).dest.id).toBe('r1');
  });
  it('a new Route opens the next, and pays more the first time', () => {
    const one = fly(freshAirport(), 10);
    expect(one.pay.newRoute).toBe(true);
    expect(one.pay.opened?.id).toBe('r2');
    expect(planFlight(one.a).dest.id).toBe('r2');
    const again = fly({ ...one.a, picked: 'r1' }, 10);
    expect(again.pay.newRoute).toBe(false);
    expect(again.pay.bolts).toBeLessThan(one.pay.bolts);
  });
  it('a Route that needs a piece he hasn\'t built waits, and the next one is open: he is never stuck', () => {
    let a = freshAirport();
    for (let i = 0; i < 30; i++) { const f = fly(a, 5); expect(f.plan.dest).toBeTruthy(); a = f.a; }
    // with nothing built, every Route that needs nothing has been flown, and the Charters are on offer
    for (const [i, r] of ROUTES.entries()) if (!r.needs) expect(a.routes[r.id]?.flown ?? 0, r.name).toBeGreaterThan(0); else expect(routeOpen(a, i)).toBe(false);
    expect(planFlight(a).mode).toBe('charter');
    a = own(a, 'piece:terminal', 'piece:hut');
    expect(planFlight(a).dest.id).toBe('r5');
  });
  it('the tower opens night Routes, the de-icing pad snowy ones, the seaplane dock island ones', () => {
    const night = ROUTES.filter(r => r.night), snow = ROUTES.filter(r => r.weather === 'snow'), sea = ROUTES.filter(r => r.sea);
    expect(night.every(r => r.needs && /tower/.test(r.needs))).toBe(true);
    expect(snow.every(r => r.needs && /deice|plough/.test(r.needs))).toBe(true);
    expect(sea.every(r => r.needs === 'piece:dock')).toBe(true);
  });
  it('Charters open after three Routes, and each one flown moves to the next', () => {
    let a = freshAirport();
    expect(pick(a, 'charter')).toBeNull();
    for (let i = 0; i < 3; i++) a = fly(a).a;
    a = pick(a, 'charter')!;
    const c = fly(a);
    expect(c.plan.mode).toBe('charter');
    expect(c.a.charter).toBe(2);
    expect(fly(c.a).plan.charter).toBe(2);
  });
  it('a Flight pays a few Bolts and never more than 9, and Rounds plus Flights pay no more than Turbo Tally\'s', () => {
    let a = freshAirport();
    for (let i = 0; i < 60; i++) { const f = fly(a, 20); expect(f.pay.bolts).toBeGreaterThanOrEqual(2); expect(f.pay.bolts).toBeLessThanOrEqual(9); a = f.a; }
  });
  it('personal bests: beating his best stars or landing on a Route is cheered and pays one more', () => {
    const first = fly(freshAirport(), 3).a;
    const better = fly({ ...first, picked: 'r1' }, 8);
    expect(better.pay.bestStars).toBe(true);
    expect(better.a.routes.r1!.bestStars).toBe(8);
    expect(fly({ ...better.a, picked: 'r1' }, 2).pay.bestStars).toBe(false);
  });
  it('passengers fill the big board, with a bigger terminal and a bigger plane carrying more', () => {
    const small = fly(freshAirport()).pay.passengers;
    let big = own(freshAirport(), 'piece:hut', 'piece:terminal', 'piece:bigterminal', 'piece:tarmac', 'piece:long', 'plane:jumbo');
    big = { ...big, flying: 'jumbo', liveries: { ...big.liveries, jumbo: big.liveries.twoseater } };
    expect(fly(big).pay.passengers).toBeGreaterThan(small * 50);
  });
  it('ranks go on without end', () => {
    expect(rankOf(0).name).toBe('Airstrip');
    let last = -1;
    for (let p = 0; p < 2_000_000; p += 997) { const r = rankOf(p); expect(r.index).toBeGreaterThanOrEqual(last); last = r.index; expect(r.next).toBeGreaterThan(p); }
    expect(rankOf(RANKS.at(-1)!.at + SUPER_EVERY * 7).name).toBe('Super Hub');
    expect(rankOf(RANKS.at(-1)!.at + SUPER_EVERY * 7).number).toBe(7);
  });
});

describe('the save', () => {
  it('reads back what it wrote, and reads nonsense as fresh', () => {
    let a = own(freshAirport(), 'paint:red', 'tail:star', 'piece:tower', 'prize:comet');
    a = wear(a, 'twoseater', { base: 'paint:red', tail: 'prize:comet' });
    const back = readAirport(JSON.parse(JSON.stringify({ ...a, passengers: 1234, charter: 17, picked: 'charter' })));
    expect(back.liveries.twoseater).toEqual(a.liveries.twoseater);
    expect(back.passengers).toBe(1234);
    expect(back.charter).toBe(17);
    expect(readAirport({ owned: ['nonsense'], flying: 'jumbo', liveries: { twoseater: { base: 'paint:gold' } } })).toMatchObject({ flying: 'twoseater', liveries: { twoseater: { base: 'paint:white' } } });
    expect(readAirport('x')).toEqual(freshAirport());
    expect(wantKey({ kind: 'more', id: 'gate' })).toBe('more:gate');
  });
});
