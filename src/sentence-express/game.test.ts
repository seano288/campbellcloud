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
  it('a save from before the rewards were doubled keeps everything: what he owns, his train, his Layout, his stations and his Tickets', () => {
    // a version 1 save as the first build wrote it: no track colour, time of day or weather, eight stations on the line
    const t0 = freshTrainSet();
    const layout = { ...lay(t0.layout, [3, 15, 27, 39], capacityOf(t0) - trackSquares(t0.layout)).layout };
    const old = {
      version: 1, balance: 83,
      learning: freshLearning(),
      trains: {
        owned: ['engine:tank', 'car:wagon', 'paint:red', 'engine:bullet', 'engine:mail', 'car:coal', 'car:party', 'car:dino', 'paint:rainbow', 'track:box1', 'track:box2', 'track:table1', 'scenery:trees', 'scenery:tunnel', 'scenery:spaceship', 'gift:barn', 'gift:digger', 'gift:teddy'],
        engine: 'bullet', cars: ['coal', 'party', 'dino'], paint: 'rainbow',
        layout: { w: 14, h: 9, cells: [] as number[], points: [] as number[], stations: [] as unknown[], scenery: [] as unknown[] },
        open: 8, delivered: ['farm', 'quarry', 'port', 'city', 'mill', 'mine', 'zoo', 'toys'], deliveries: 3, trips: 11, goal: 'scenery:castle',
      },
    };
    // his Layout on the bigger table, with stations moved and scenery placed where he put them
    const grown = placeOpen({ ...t0, owned: old.trains.owned as never, layout: { ...layout } as never, open: 8 });
    const big = expressSave.decode({ version: 1, trains: { ...old.trains, layout: grown.layout } }).trains.layout;
    old.trains.layout = { ...big, scenery: [{ id: 'trees', cell: 2 }, { id: 'spaceship', cell: 120 }, { id: 'barn', cell: 0 }], stations: big.stations } as never;
    const raw = JSON.parse(JSON.stringify(old));
    const d = expressSave.decode(raw);
    expect(d.currency.balance).toBe(83);
    expect([...d.trains.owned].sort()).toEqual([...old.trains.owned, 'track:wood', 'sky:day'].sort());
    expect([d.trains.engine, d.trains.cars, d.trains.paint]).toEqual(['bullet', ['coal', 'party', 'dino'], 'rainbow']);
    expect(d.trains.layout.cells).toEqual(raw.trains.layout.cells);
    expect(d.trains.layout.scenery).toEqual(raw.trains.layout.scenery);
    for (const s of raw.trains.layout.stations) expect(d.trains.layout.stations).toContainEqual(s);
    expect([d.trains.open, d.trains.delivered, d.trains.deliveries, d.trains.trips, d.trains.goal]).toEqual([8, old.trains.delivered, 3, 11, 'scenery:castle']);
    expect([d.trains.rails, d.trains.time, d.trains.weather]).toEqual(['wood', 'day', null]);
    // and it carries on: his next Delivery opens the ninth station, the Bakery
    const s = store(d), pay = settleDelivery(s, planDelivery(s.state.trains));
    expect(pay?.opened).toBe('bakery');
    expect(s.state.trains.layout.stations.some(x => x.id === 'bakery')).toBe(true);
    expect(s.state.trains.layout.scenery).toEqual(expect.arrayContaining(raw.trains.layout.scenery));
  });
  it('never puts on an engine, car or paint he does not own', () => {
    const d = expressSave.decode({ version: 1, trains: { engine: 'bullet', cars: ['dino', 'wagon', 'wagon'], paint: 'rainbow' } });
    expect(d.trains.engine).toBe('tank');
    expect(d.trains.cars).toEqual(['wagon']);
    expect(d.trains.paint).toBe('red');
  });
});

describe('a Round', () => {
  it('pays a Ticket for each clean answer and one for finishing, and earns a Delivery', () => {
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
    expect(pay?.tickets).toBe(3);
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
