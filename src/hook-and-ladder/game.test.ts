// The save, the Round's pay, the Station's prices and what there is to earn, and the Call's pay.
import { describe, expect, it } from 'vitest';
import type { SolvedProblem } from '../learning/session';
import { MAX_BOLTS } from '../round/rules';
import { heated, MAX_HEAT, MYSTERY_ID, SCENES } from './call/scenes';
import { createPractice, ladderSave, SAVE_KEY, SAVE_VERSION, settleCall, type LadderGame } from './game';
import { freshLearning } from './learning';
import { PLACE_KEY } from './nav';
import { MOST_EARNED, NUMBERS_TO } from './phrases';
import { ALL_KEYS, CATALOGUE, FOR_SALE, infoOf, keyOf, PRIZE_EVERY, PRIZES, STARTERS, TABS, type ItemKey } from './station/parts';
import { CALL_BOLTS, callOf, fit, freshStation, gearOf, goalOf, isFitted, lookOf, MYSTERY_BOLTS, MYSTERY_OPENS, pickCall, proposePurchase, readStation, STAR_BOLTS } from './station/station';

const store = (state: LadderGame = ladderSave.fresh()) => ({
  get state() { return state; },
  commit(change: (s: LadderGame) => LadderGame | null) { const next = change(state); if (!next) return { kind: 'rejected' as const, reason: 'rejected' as const }; state = next; return { kind: 'accepted' as const, state, saved: Promise.resolve(true) }; },
});

describe('the save', () => {
  it('has its own keys and a version', () => {
    expect(SAVE_KEY).toBe('hook-and-ladder-save');
    expect(PLACE_KEY).toBe('hook-and-ladder-place');
    expect(SAVE_VERSION).toBe(1);
  });
  it('round-trips', () => {
    const st = { ...freshStation(), owned: [...STARTERS, 'truck:ladder', 'pump:r1', 'paint:lime', 'station:bell', 'town:tree', 'gadget:bell'] as ItemKey[], calls: 2, answered: ['bin', 'house'], trips: 3, next: { id: 'house', heat: 2 }, goal: 'pump:r2' as ItemKey, gadgets: ['bell' as const], stars: { house: 1 }, mystery: 4 };
    const s: LadderGame = { learning: freshLearning(), currency: { balance: 17 }, station: fit(fit(st, 'truck:ladder'), 'paint:lime') };
    expect(ladderSave.decode(JSON.parse(JSON.stringify(ladderSave.encode(s))))).toEqual(s);
  });
  it('starts fresh from a version it does not know, or from nonsense', () => {
    const d = ladderSave.decode({ version: 99, balance: 5, station: { calls: 9 } });
    expect(d.currency.balance).toBe(0);
    expect(d.station).toEqual(freshStation());
    expect(ladderSave.decode('nonsense')).toEqual(ladderSave.fresh());
  });
  it('never fits something he does not own, and forgets a Call he has not answered', () => {
    const st = readStation({ fitted: { truck: 'heli', paint: 'galaxy', pump: 'r5' }, owned: ['truck:heli', 'nope:nope'], answered: ['bin', 'mars'], next: 'tower' });
    expect(st.fitted.truck).toBe('heli');
    expect(st.fitted.paint).toBe('red');
    expect(st.fitted.pump).toBe('r0');
    expect(st.owned).not.toContain('nope:nope');
    expect(st.answered).toEqual(['bin']);
    expect(st.next).toBeNull();
  });
  it('reads a save from before the Aircraft tab: the Fire Helicopter is still his and still fitted, and an old next Call goes there as it was', () => {
    const st = readStation({ owned: ['truck:heli', 'truck:ladder'], fitted: { truck: 'heli' }, answered: ['bin', 'house'], next: 'house', calls: 1 });
    expect(st.owned).toContain('air:heli');
    expect(st.owned).not.toContain('truck:heli');
    expect(st.fitted.truck).toBe('heli');
    expect(gearOf(st).truck).toBe('heli');
    expect(st.next).toEqual({ id: 'house', heat: 0 });
    expect(st.gadgets).toEqual([]);
    // saving up for the Fire Helicopter, he still is
    expect(readStation({ goal: 'truck:heli' }).goal).toBe('air:heli');
    expect(st.stars).toEqual({});
    expect(st.mystery).toBe(0);
  });
  it('never switches on a Gadget he does not own, nor keeps stars for a Call he has not answered', () => {
    const st = readStation({ owned: ['gadget:bell'], gadgets: ['bell', 'drone', 'nope'], answered: ['bin'], stars: { bin: 2, house: 3, barn: 'x' } });
    expect(st.gadgets).toEqual(['bell']);
    expect(st.stars).toEqual({ bin: 2 });
  });
});

describe('a Round', () => {
  it('pays a Bolt for each clean answer and one for finishing, and earns a Call', () => {
    const s = store(), practice = createPractice(s);
    const started = practice.start();
    if (started.kind !== 'accepted') throw new Error('no Round');
    const results: SolvedProblem[] = [];
    for (let i = 1; i <= 5; i++) {
      const fact: SolvedProblem = { index: i, outcome: i === 2 ? 'missed' : 'clean', misses: i === 2 ? 1 : 0, helped: false, replay: false };
      practice.solve(started.roundId, fact, { mode: 'join', push: true });
      results.push(fact);
    }
    expect(practice.terminal({ roundId: started.roundId, status: 'completed', results }).kind).toBe('accepted');
    expect(s.state.currency.balance).toBe(5);
    expect(s.state.station.calls).toBe(freshStation().calls + 1);
  });
});

describe('the Station', () => {
  it('has over twice as much to earn as it first did, none over 100 Bolts', () => {
    // it first had 133 things to buy for 3,496 Bolts, and 16 Calls with a badge each: about 150 things to earn
    const cost = FOR_SALE.reduce((n, k) => n + infoOf(k).price, 0);
    expect(cost).toBeGreaterThanOrEqual(2 * 3496);
    expect(SCENES.length).toBe(32);
    expect(FOR_SALE.length + PRIZES.length + SCENES.length * (1 + MAX_HEAT)).toBeGreaterThanOrEqual(2.5 * 150);
    for (const k of ALL_KEYS) expect(infoOf(k).price, k).toBeLessThanOrEqual(NUMBERS_TO);
    // every tab has something to buy; the eight first trucks are all still there, under the same names
    for (const t of TABS) expect(CATALOGUE[t].some(i => i.price > 0), t).toBe(true);
    const vehicles = [...CATALOGUE.truck, ...CATALOGUE.air].map(t => t.id);
    for (const id of ['pumper', 'ladder', 'tanker', 'rescue', 'brush', 'crash', 'boat', 'heli']) expect(vehicles).toContain(id);
    expect(vehicles.length).toBe(25);
    expect(CATALOGUE.buddy[0]).toMatchObject({ id: 'dalmatian', price: 0 });
  });
  it('kept every old price: nothing he was saving for got dearer', () => {
    const OLD: Record<string, number> = { 'truck:ladder': 25, 'truck:tanker': 35, 'truck:rescue': 45, 'truck:brush': 55, 'truck:crash': 70, 'truck:boat': 85, 'air:heli': 100, 'pump:r5': 75, 'ladder:r6': 100, 'tank:r5': 64, 'hose:r5': 64, 'nozzle:twin': 60, 'buddy:dino': 90, 'town:coaster': 85, 'station:disco': 60 };
    for (const [k, p] of Object.entries(OLD)) expect(infoOf(k as ItemKey).price, k).toBe(p);
  });
  it('has ten Mystery Call prizes, one for every fifth Level, that can\'t be bought', () => {
    expect(PRIZES.length).toBe(10);
    PRIZES.forEach((k, i) => expect(infoOf(k).prize).toBe((i + 1) * PRIZE_EVERY));
    for (const k of PRIZES) expect(STARTERS).not.toContain(k);
    expect(proposePurchase(freshStation(), PRIZES[0]!, 100)).toEqual({ kind: 'rejected', reason: 'prize' });
  });
  it('switches a Gadget on when he buys it, and off and on again when he taps it', () => {
    const bought = proposePurchase(freshStation(), 'gadget:drone', 100);
    if (bought.kind !== 'ready') throw new Error('not bought');
    expect(bought.state.gadgets).toEqual(['drone']);
    expect(gearOf(bought.state).gadgets).toEqual(['drone']);
    const off = fit(bought.state, 'gadget:drone');
    expect(off.gadgets).toEqual([]);
    expect(fit(off, 'gadget:drone').gadgets).toEqual(['drone']);
    // trying one on switches it on for the look
    expect(lookOf(freshStation(), 'gadget:flag').gadgets).toEqual(['flag']);
  });
  it('fits an aircraft in the vehicle\'s place', () => {
    const bought = proposePurchase(freshStation(), 'air:scooper', 100);
    if (bought.kind !== 'ready') throw new Error('not bought');
    expect(bought.state.fitted.truck).toBe('scooper');
    expect(isFitted(bought.state, 'air:scooper')).toBe(true);
    expect(isFitted(bought.state, 'truck:pumper')).toBe(false);
  });
  it('starts him with one free Call and every free part fitted', () => {
    const st = freshStation();
    expect(st.calls).toBe(1);
    expect(STARTERS.every(k => st.owned.includes(k))).toBe(true);
    expect(gearOf(st)).toEqual({ truck: 'pumper', engine: 0, pump: 0, hose: 0, ladder: 0, tank: 0, nozzle: 'straight', gadgets: [] });
  });
  it('buys only what he can afford and doesn\'t have, and fits it at once', () => {
    const st = freshStation();
    expect(proposePurchase(st, 'pump:r1', 7)).toEqual({ kind: 'rejected', reason: 'insufficient-funds' });
    expect(proposePurchase(st, 'truck:pumper', 100)).toEqual({ kind: 'rejected', reason: 'already-owned' });
    expect(proposePurchase(st, 'nope:x' as ItemKey, 100)).toEqual({ kind: 'rejected', reason: 'invalid-item' });
    const bought = proposePurchase(st, 'pump:r1', 8);
    if (bought.kind !== 'ready') throw new Error('not bought');
    expect(bought.cost).toBe(8);
    expect(isFitted(bought.state, 'pump:r1')).toBe(true);
    expect(gearOf(bought.state).pump).toBe(1);
  });
  it('tries a part on his truck before he buys it', () => {
    const st = freshStation();
    expect(lookOf(st, keyOf('paint', 'lime')).paint).toBe('lime');
    expect(gearOf(st, keyOf('air', 'heli')).truck).toBe('heli');
    expect(lookOf(st).paint).toBe('red');
  });
  it('aims him at the cheapest part that helps at the Call, or the one he picked', () => {
    expect(goalOf(freshStation())).toBe('hose:r1');
    expect(goalOf({ ...freshStation(), goal: 'town:coaster' })).toBe('town:coaster');
  });
});

describe('a Call', () => {
  it('the first one is free, it pays the Town\'s thank-you once, adds a badge and opens the next', () => {
    const s = store();
    expect(callOf(s.state.station).id).toBe('bin');
    const pay = settleCall(s, SCENES[0]);
    expect(pay).toEqual({ bolts: CALL_BOLTS, firstTime: true });
    expect(s.state.currency.balance).toBe(CALL_BOLTS);
    expect(s.state.station.calls).toBe(0);
    expect(s.state.station.answered).toEqual(['bin']);
    expect(callOf(s.state.station).id).toBe('house');
    // no Call left: nothing is paid
    expect(settleCall(s, SCENES[1])).toBeNull();
    expect(s.state.currency.balance).toBe(CALL_BOLTS);
  });
  it('goes back to a building he picks in the Town as a Star Call, one star hotter each time, up to three', () => {
    const s = store({ ...ladderSave.fresh(), station: { ...freshStation(), calls: 5, answered: ['bin', 'house'] } });
    const pays: unknown[] = [];
    for (const star of [1, 2, 3, 3]) {
      s.commit(x => ({ ...x, station: pickCall(x.station, 'house')! }));
      const scene = callOf(s.state.station);
      expect(scene.id).toBe('house');
      expect(scene.heat).toBe(star);
      expect(scene).toEqual(heated(SCENES[1], star));
      const pay = settleCall(s, scene);
      expect(s.state.station.stars.house).toBe(star);
      pays.push(pay);
    }
    // a new star pays more; once he has all three it pays as a Call does
    expect(pays).toEqual([1, 2, 3].map(star => ({ bolts: CALL_BOLTS + STAR_BOLTS, firstTime: false, star })).concat([{ bolts: CALL_BOLTS, firstTime: false } as never]));
    expect(s.state.station.answered).toEqual(['bin', 'house']);
    expect(callOf(s.state.station).id).toBe('barn');
    expect(pickCall(freshStation(), 'tower')).toBeNull();
  });
  it('opens the Mystery Call after sixteen Calls, goes there when there are no new ones, and wins a prize every fifth Level', () => {
    const sixteen = SCENES.slice(0, MYSTERY_OPENS).map(s => s.id), all: string[] = SCENES.map(s => s.id);
    expect(pickCall({ ...freshStation(), answered: sixteen.slice(1) }, MYSTERY_ID)).toBeNull();
    expect(pickCall({ ...freshStation(), answered: sixteen }, MYSTERY_ID)?.next).toEqual({ id: MYSTERY_ID, heat: 0 });
    expect(callOf({ answered: all, next: null, trips: 40, mystery: 0 }).id).toBe(MYSTERY_ID);
    const s = store({ ...ladderSave.fresh(), station: { ...freshStation(), calls: 12, answered: all } });
    const prizes: ItemKey[] = [];
    for (let level = 1; level <= 10; level++) {
      const pay = settleCall(s, callOf(s.state.station))!;
      expect(pay.level).toBe(level);
      expect(pay.bolts).toBe(MYSTERY_BOLTS);
      if (pay.prize) prizes.push(pay.prize);
    }
    expect(prizes).toEqual(PRIZES.slice(0, 2));
    expect(s.state.station.owned).toEqual(expect.arrayContaining(PRIZES.slice(0, 2)));
    expect(s.state.station.mystery).toBe(10);
  });
  it('a Round and a Call together pay at most what the voice can say', () => {
    expect(MOST_EARNED).toBeGreaterThanOrEqual(Math.max(MAX_BOLTS, CALL_BOLTS + STAR_BOLTS, MYSTERY_BOLTS));
  });
});
