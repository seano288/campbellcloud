// The save, the Round's pay, the Station's prices and what there is to earn, and the Call's pay.
import { describe, expect, it } from 'vitest';
import type { SolvedProblem } from '../learning/session';
import { MAX_BOLTS } from '../round/rules';
import { SCENES } from './call/scenes';
import { createPractice, ladderSave, SAVE_KEY, SAVE_VERSION, settleCall, type LadderGame } from './game';
import { freshLearning } from './learning';
import { PLACE_KEY } from './nav';
import { MOST_EARNED, NUMBERS_TO } from './phrases';
import { ALL_KEYS, CATALOGUE, infoOf, keyOf, STARTERS, TABS, type ItemKey } from './station/parts';
import { CALL_BOLTS, callOf, fit, freshStation, gearOf, goalOf, isFitted, lookOf, pickCall, proposePurchase, readStation } from './station/station';

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
    const st = { ...freshStation(), owned: [...STARTERS, 'truck:ladder', 'pump:r1', 'paint:lime', 'station:bell', 'town:tree'] as ItemKey[], calls: 2, answered: ['bin', 'house'], trips: 3, next: 'house', goal: 'pump:r2' as ItemKey };
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
  it('has about 150 things to earn, none over 100 Bolts', () => {
    const toBuy = ALL_KEYS.filter(k => infoOf(k).price > 0);
    expect(toBuy.length + SCENES.length).toBeGreaterThanOrEqual(145);
    for (const k of ALL_KEYS) expect(infoOf(k).price, k).toBeLessThanOrEqual(NUMBERS_TO);
    // every tab has something to buy, and the eight trucks the brief names
    for (const t of TABS) expect(CATALOGUE[t].some(i => i.price > 0), t).toBe(true);
    expect(CATALOGUE.truck.map(t => t.id)).toEqual(['pumper', 'ladder', 'tanker', 'rescue', 'brush', 'crash', 'boat', 'heli']);
    expect(CATALOGUE.buddy[0]).toMatchObject({ id: 'dalmatian', price: 0 });
  });
  it('starts him with one free Call and every free part fitted', () => {
    const st = freshStation();
    expect(st.calls).toBe(1);
    expect(STARTERS.every(k => st.owned.includes(k))).toBe(true);
    expect(gearOf(st)).toEqual({ truck: 'pumper', pump: 0, hose: 0, ladder: 0, tank: 0, nozzle: 'straight' });
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
    expect(gearOf(st, keyOf('truck', 'heli')).truck).toBe('heli');
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
    const pay = settleCall(s, 'bin');
    expect(pay).toEqual({ bolts: CALL_BOLTS, firstTime: true });
    expect(s.state.currency.balance).toBe(CALL_BOLTS);
    expect(s.state.station.calls).toBe(0);
    expect(s.state.station.answered).toEqual(['bin']);
    expect(callOf(s.state.station).id).toBe('house');
    // no Call left: nothing is paid
    expect(settleCall(s, 'house')).toBeNull();
    expect(s.state.currency.balance).toBe(CALL_BOLTS);
  });
  it('goes back to a building he picks in the Town, and pays it again with no new badge', () => {
    const s = store({ ...ladderSave.fresh(), station: { ...freshStation(), calls: 2, answered: ['bin', 'house'] } });
    s.commit(x => ({ ...x, station: pickCall(x.station, 'bin')! }));
    expect(callOf(s.state.station).id).toBe('bin');
    expect(settleCall(s, 'bin')).toEqual({ bolts: CALL_BOLTS, firstTime: false });
    expect(s.state.station.answered).toEqual(['bin', 'house']);
    expect(callOf(s.state.station).id).toBe('barn');
    expect(pickCall(freshStation(), 'tower')).toBeNull();
  });
  it('after all sixteen it keeps going round them', () => {
    const all: string[] = SCENES.map(s => s.id);
    expect(SCENES.length).toBe(16);
    expect(all.includes(callOf({ answered: all, next: null, trips: 40 }).id)).toBe(true);
  });
  it('a Round and a Call together pay at most what the voice can say', () => {
    expect(MOST_EARNED).toBeGreaterThanOrEqual(Math.max(MAX_BOLTS, CALL_BOLTS));
  });
});
