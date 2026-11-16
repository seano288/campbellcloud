import { describe, expect, it } from 'vitest';
import type { SolvedProblem } from '../learning/session';
import { MAX_BOLTS } from '../round/rules';
import { createPractice, expressSave, SAVE_KEY, SAVE_VERSION, settleDelivery, type ExpressGame } from './game';
import { lay, trackSquares } from './layout/track';
import { freshLearning } from './learning';
import { MOST_EARNED, NUMBERS_TO, PHRASES, WORDS_SAID } from './phrases';
import { PAY_MAX } from './delivery/run';
import { SENTENCES } from './sentences/index';
import { ITEMS, capacityOf, freshTrainSet, placeOpen, planDelivery, type TrainSet } from './shed/trainset';
import { CLIPS } from './voice.gen';

const store = (state: ExpressGame = expressSave.fresh()) => ({
  get state() { return state; },
  commit(change: (s: ExpressGame) => ExpressGame | null) { const next = change(state); if (!next) return { kind: 'rejected' as const, reason: 'rejected' as const }; state = next; return { kind: 'accepted' as const, state, saved: Promise.resolve(true) }; },
});

describe('the save', () => {
  it('has its own keys and a version', () => { expect(SAVE_KEY).toBe('sentence-express-save'); expect(SAVE_VERSION).toBe(1); });
  it('round-trips, his Layout and all', () => {
    const t0 = freshTrainSet();
    const layout = lay(t0.layout, [3, 15, 27, 39], capacityOf(t0) - trackSquares(t0.layout)).layout;
    const trains: TrainSet = placeOpen({ ...t0, owned: [...t0.owned, 'engine:steam', 'car:coal', 'paint:blue', 'scenery:trees'], engine: 'steam', cars: ['wagon', 'coal'], paint: 'blue', layout: { ...layout, scenery: [{ id: 'trees', cell: 50 }] }, open: 3, delivered: ['farm', 'quarry'], deliveries: 2, trips: 2, goal: 'car:logs' });
    const s: ExpressGame = { learning: freshLearning(), currency: { balance: 17 }, trains };
    expect(expressSave.decode(JSON.parse(JSON.stringify(expressSave.encode(s))))).toEqual(s);
  });
  it('starts fresh from a version it does not know', () => {
    const d = expressSave.decode({ version: 99, balance: 5, trains: { deliveries: 9 } });
    expect(d.currency.balance).toBe(0);
    expect(d.trains).toEqual(freshTrainSet());
  });
  it('never puts on an engine, car or paint he does not own', () => {
    const d = expressSave.decode({ version: 1, trains: { engine: 'bullet', cars: ['dino', 'wagon', 'wagon'], paint: 'rainbow' } });
    expect(d.trains.engine).toBe('tank');
    expect(d.trains.cars).toEqual(['wagon']);
    expect(d.trains.paint).toBe('red');
  });
});

describe('a Round', () => {
  it('pays a Bolt for each clean answer and one for finishing, and earns a Delivery', () => {
    const s = store(), practice = createPractice(s);
    const started = practice.start();
    if (started.kind !== 'accepted') throw new Error('no Round');
    const results: SolvedProblem[] = [];
    for (let i = 1; i <= 5; i++) {
      const fact: SolvedProblem = { index: i, outcome: i === 2 ? 'missed' : 'clean', misses: i === 2 ? 1 : 0, helped: false, replay: false };
      practice.solve(started.roundId, fact, { mode: 'order', push: true });
      results.push(fact);
    }
    expect(practice.terminal({ roundId: started.roundId, status: 'completed', results }).kind).toBe('accepted');
    expect(s.state.currency.balance).toBe(5);
    expect(s.state.trains.deliveries).toBe(freshTrainSet().deliveries + 1);
  });
});

describe('a Delivery', () => {
  it('starts with one free Delivery, pays when the cargo reaches Toy Town, and can\'t be paid twice', () => {
    const s = store(), plan = planDelivery(s.state.trains);
    const pay = settleDelivery(s, plan);
    expect(pay?.bolts).toBe(3);
    expect(s.state.currency.balance).toBe(3);
    expect(s.state.trains.deliveries).toBe(0);
    expect(settleDelivery(s, plan)).toBeNull();
    expect(s.state.currency.balance).toBe(3);
  });
  it('a Round and a Delivery together pay at most 12', () => expect(MAX_BOLTS + PAY_MAX).toBe(12));
});

describe('the voice', () => {
  it('has a clip for every line, every sentence and every word', () => {
    for (const p of PHRASES) expect(CLIPS[p as keyof typeof CLIPS], p).toBeTruthy();
    for (const s of SENTENCES) expect(PHRASES).toContain(s.text);
    for (const w of WORDS_SAID) expect(PHRASES).toContain(w);
  });
  it('can say every price and every pay', () => {
    for (const i of ITEMS) expect(i.price).toBeLessThanOrEqual(NUMBERS_TO);
    expect(MOST_EARNED).toBeGreaterThanOrEqual(Math.max(MAX_BOLTS, PAY_MAX));
  });
});
