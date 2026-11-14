import { describe, expect, it } from 'vitest';
import type { SolvedProblem } from '../learning/session';
import { canReach, destinationOf, freshBase, goalOf, nextPlanet, pickDestination, priceOf, proposePurchase, readBase } from './base/base';
import { ALL_KEYS, fit, keysIn, powerOf, SLOTS } from './base/parts';
import { planet, PLANETS } from './base/planets';
import { createPractice, roverSave, SAVE_KEY, SAVE_VERSION, settleTrip, type RoverState } from './game';
import { freshLearning } from './learning';
import { NUMBERS_TO } from './phrases';

const store = (state: RoverState = roverSave.fresh()) => ({
  get state() { return state; },
  commit(change: (s: RoverState) => RoverState | null) { const next = change(state); if (!next) return { kind: 'rejected' as const, reason: 'rejected' as const }; state = next; return { kind: 'accepted' as const, state, saved: Promise.resolve(true) }; },
});

describe('the save', () => {
  it('has its own key and a version', () => { expect(SAVE_KEY).toBe('rover-code-save'); expect(SAVE_VERSION).toBe(1); });
  it('round-trips', () => {
    const base = { ...freshBase(), owned: [...freshBase().owned, 'engine:twin' as const], rocket: fit(freshBase().rocket, 'engine:twin'), launches: 3, trips: 2, visits: { moon: 2 }, gadgets: ['antenna' as const], destination: 'moon' as const };
    const s: RoverState = { learning: freshLearning(), currency: { balance: 17 }, base };
    expect(roverSave.decode(JSON.parse(JSON.stringify(roverSave.encode(s))))).toEqual(s);
  });
  it('starts fresh from a version it does not know', () => expect(roverSave.decode({ version: 99, balance: 5 }).currency.balance).toBe(0));
  it('never fits a part he does not own, whatever the save says', () => {
    const b = readBase({ owned: ['nose:cone'], rocket: { engine: 'mega', paint: 'red' }, visits: { moon: 1, pluto: 3 }, gadgets: ['antenna', 'jetpack'] });
    expect(b.rocket).toEqual(freshBase().rocket);
    expect(b.visits).toEqual({ moon: 1 });
    expect(b.gadgets).toEqual(['antenna']);
  });
});

describe('a Round', () => {
  it('pays a Bolt for each clean answer and one for finishing, and earns a launch', () => {
    const s = store(), practice = createPractice(s);
    const started = practice.start();
    if (started.kind !== 'accepted') throw new Error('no Round');
    const results: SolvedProblem[] = [];
    for (let i = 1; i <= 5; i++) {
      const fact: SolvedProblem = { index: i, outcome: i === 2 ? 'missed' : 'clean', misses: i === 2 ? 1 : 0, helped: false, replay: false };
      practice.solve(started.roundId, fact, { mode: 'drive', push: true });
      results.push(fact);
    }
    expect(practice.terminal({ roundId: started.roundId, status: 'completed', results }).kind).toBe('accepted');
    expect(s.state.currency.balance).toBe(5);
    expect(s.state.base.launches).toBe(freshBase().launches + 1);
  });
});

describe('the Space Base', () => {
  it('starts with a free launch to the Moon, and the starter rocket can reach it', () => {
    const b = freshBase();
    expect(b.launches).toBe(1);
    expect(destinationOf(b).id).toBe('moon');
    expect(canReach(b, planet('moon'))).toBe(true);
    expect(canReach(b, planet('mars'))).toBe(false);
  });
  it('buys a part, fits it, and takes the Power that reaches Mars', () => {
    const buy = proposePurchase(freshBase(), 'engine:twin', 20);
    if (buy.kind !== 'ready') throw new Error(buy.reason);
    expect(buy.cost).toBe(12);
    expect(buy.state.rocket.engine).toBe('twin');
    expect(powerOf(buy.state.rocket)).toBe(5);
    expect(proposePurchase(freshBase(), 'engine:twin', 11)).toEqual({ kind: 'rejected', reason: 'insufficient-funds' });
    expect(proposePurchase(buy.state, 'engine:twin', 99)).toEqual({ kind: 'rejected', reason: 'already-owned' });
  });
  it('saves toward the cheapest part that adds Power', () => expect(goalOf(freshBase())).toBe('nose:bubble'));
  it('has a planet for every Power, and the top parts reach the last', () => {
    const top = { ...freshBase().rocket, nose: 'diamond', body: 'rainbow', fins: 'dragon', engine: 'hyper' };
    expect(powerOf(top)).toBe(PLANETS.at(-1)!.power);
    PLANETS.forEach((p, i) => { if (i) expect(p.power).toBeGreaterThan(PLANETS[i - 1]!.power); });
    // the first eight planets still need only the first three Rungs
    expect(powerOf({ ...top, nose: 'star', body: 'gold', fins: 'wing', engine: 'mega' })).toBe(planet('rainbow').power);
  });
  it('prices every part so the voice can say it, dearer up each slot', () => {
    for (const k of ALL_KEYS) expect(priceOf(k)).toBeLessThanOrEqual(NUMBERS_TO);
    for (const s of SLOTS) keysIn(s).forEach((k, i, all) => { if (i) expect(priceOf(k)).toBeGreaterThan(priceOf(all[i - 1]!)); });
  });
  it('gives a player who had built everything something new to save for', () => {
    const added = ['drill', 'shark', 'diamond', 'armor', 'zap', 'rainbow', 'spike', 'jet', 'dragon', 'quad', 'plasma', 'hyper', 'pink', 'yellow', 'teal', 'silver', 'navy', 'candy', 'lime'];
    const old = { ...freshBase(), owned: ALL_KEYS.filter(k => !added.includes(k.split(':')[1]!)) };
    expect(old.owned).toHaveLength(16 + 7);
    expect(goalOf(old)).toBe('nose:drill');
    expect(new Set(PLANETS.map(p => p.gadget)).size).toBe(PLANETS.length);
  });
  it('goes somewhere new when it can, and lets him pick only planets in reach', () => {
    const b = { ...freshBase(), visits: { moon: 1 }, rocket: { ...freshBase().rocket, engine: 'twin' } };
    expect(nextPlanet(b)!.id).toBe('mars');
    expect(destinationOf(b).id).toBe('mars');
    expect(pickDestination(b, 'frosty')).toBeNull();
    expect(destinationOf(pickDestination(b, 'moon')!).id).toBe('moon');
    expect(destinationOf({ ...b, rocket: freshBase().rocket }).id).toBe('moon');
  });
});

describe('a trip', () => {
  it('pays what he caught and found, uses the launch, and gives the gadget on a first visit only', () => {
    const s = store();
    const first = settleTrip(s, 'moon', 2, 4)!;
    expect(first).toEqual({ bolts: 6, firstVisit: true, gadget: 'antenna' });
    expect(s.state.currency.balance).toBe(6);
    expect(s.state.base.launches).toBe(0);
    expect(s.state.base.gadgets).toEqual(['antenna']);
    expect(settleTrip(s, 'moon', 3, 5)).toBeNull(); // no launch left: nothing happens
    s.commit(st => ({ ...st, base: { ...st.base, launches: 1 } }));
    expect(settleTrip(s, 'moon', 9, 9)).toEqual({ bolts: 8, firstVisit: false, gadget: null }); // at most 3 + 5
    expect(s.state.base.visits.moon).toBe(2);
  });
});
