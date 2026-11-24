import { describe, expect, it } from 'vitest';
import type { SolvedProblem } from '../learning/session';
import { cargoSave, createPractice, SAVE_KEY, SAVE_VERSION, settleGo, type CargoState } from './game';
import { freshPort, planGo } from './port/port';
import { needLine, PHRASES, PRICE_TOP, sayable } from './phrases';
import { FOR_SALE, REPEATS, repeatPrice } from './port/catalog';
import { CLIPS } from './voice.gen';
import { PLACE_KEY } from './nav';

function store(initial: CargoState = cargoSave.fresh()) {
  let state = initial;
  return {
    get state() { return state; },
    commit(change: (s: CargoState) => CargoState | null) { const next = change(state); if (!next) return { kind: 'rejected' as const, reason: 'rejected' as const }; state = next; return { kind: 'accepted' as const, state, saved: Promise.resolve(true) }; },
  };
}
const solved = (i: number, outcome: SolvedProblem['outcome'] = 'clean'): SolvedProblem => ({ index: i, outcome, misses: outcome === 'clean' ? 0 : 1, helped: false, replay: false });

describe('the save', () => {
  it('has its own keys and a version', () => { expect(SAVE_KEY).toBe('cargo-words-save'); expect(PLACE_KEY).toBe('cargo-words-place'); expect(SAVE_VERSION).toBe(1); });
  it('round-trips', () => {
    const s = { ...cargoSave.fresh(), currency: { balance: 42 }, words: ['rabbit', 'sunset'], port: { ...freshPort(), owned: [...freshPort().owned, 'piece:lighthouse'], tonnes: 77 } };
    const back = cargoSave.decode(JSON.parse(JSON.stringify(cargoSave.encode(s))));
    expect(back.currency.balance).toBe(42);
    expect(back.port.tonnes).toBe(77);
    expect(back.port.owned).toContain('piece:lighthouse');
    expect(back.words).toEqual(['rabbit', 'sunset']);
  });
  it('starts fresh from a version it does not know, and drops what it can\'t read', () => {
    expect(cargoSave.decode({ version: 99, balance: 5 }).currency.balance).toBe(0);
    const odd = cargoSave.decode({ version: 1, words: ['rabbit', 'notaword', 3], port: { owned: ['piece:nope', 'crane:giant'], crane: 'crane:giant', next: 'liner', ships: -2 } });
    expect(odd.words).toEqual(['rabbit']);
    expect(odd.port.owned).not.toContain('piece:nope');
    expect(odd.port.crane).toBe('crane:giant');
    expect(odd.port.next).toBeNull();
    expect(odd.port.ships).toBe(0);
  });
});

describe('a Round', () => {
  it('pays a Bolt for each clean answer and one for finishing, and earns a Ship', () => {
    const s = store(), practice = createPractice(s);
    const started = practice.start();
    expect(started.kind).toBe('accepted');
    if (started.kind !== 'accepted') return;
    for (let i = 1; i <= 5; i++) practice.solve(started.roundId, solved(i, i === 3 ? 'missed' : 'clean'), { mode: 'count', push: true });
    const done = practice.terminal({ roundId: started.roundId, status: 'completed', results: [1, 2, 3, 4, 5].map(i => solved(i, i === 3 ? 'missed' : 'clean')) });
    expect(done.kind).toBe('accepted');
    expect(s.state.currency.balance).toBe(5);
    expect(s.state.port.ships).toBe(2); // the free first one, and this Round's
  });
  it('a Ship is used when it sails, pays, and does nothing without one', () => {
    const s = store();
    const plan = planGo(s.state.port);
    const pay = settleGo(s, plan, { loaded: 2, tallest: 1, seconds: 30 });
    expect(pay?.bolts).toBe(5); // 2 for the Ship, 3 for a new harbour
    expect(s.state.port.ships).toBe(0);
    expect(s.state.currency.balance).toBe(5);
    expect(settleGo(s, plan, { loaded: 2, tallest: 1, seconds: 30 })).toBeNull();
  });
});

describe('the voice', () => {
  it('has a clip for every line', () => { for (const p of PHRASES) expect(CLIPS[p as keyof typeof CLIPS], p).toBeTruthy(); });
  it('can say every price and every "you need" gap: each thing for sale, the again-and-again things at every rank, any gap to 400', () => {
    const said = new Set<string>(PHRASES);
    const prices = [...FOR_SALE.map(i => i.price), ...REPEATS.flatMap(r => Array.from({ length: 60 }, (_, k) => repeatPrice(r.id, k)))];
    for (const price of prices) {
      expect(price, 'a price over 400').toBeLessThanOrEqual(PRICE_TOP);
      const { said: n, exact } = sayable(price);
      expect(exact, `${price} is not a whole ten`).toBe(true);
      expect(said.has(n)).toBe(true);
    }
    for (let gap = 1; gap <= PRICE_TOP; gap++) for (const p of needLine(gap)) expect(said.has(p), `${gap}: ${p}`).toBe(true);
  });
});
