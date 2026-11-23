import { describe, expect, it } from 'vitest';
import type { SolvedProblem } from '../learning/session';
import { createPractice, jetSave, SAVE_KEY, SAVE_VERSION, settleFlight, type JetState } from './game';
import { freshAirport, planFlight } from './airport/airport';
import { needLine, PHRASES, PRICE_TOP, sayable, sayNum } from './phrases';
import { FOR_SALE, REPEATS, repeatPrice } from './airport/catalog';
import { CLIPS } from './voice.gen';
import { PLACE_KEY } from './nav';

function store(initial: JetState = jetSave.fresh()) {
  let state = initial;
  return {
    get state() { return state; },
    commit(change: (s: JetState) => JetState | null) { const next = change(state); if (!next) return { kind: 'rejected' as const, reason: 'rejected' as const }; state = next; return { kind: 'accepted' as const, state, saved: Promise.resolve(true) }; },
  };
}
const solved = (i: number, outcome: SolvedProblem['outcome'] = 'clean'): SolvedProblem => ({ index: i, outcome, misses: outcome === 'clean' ? 0 : 1, helped: false, replay: false });

describe('the save', () => {
  it('has its own keys and a version', () => { expect(SAVE_KEY).toBe('jetway-save'); expect(PLACE_KEY).toBe('jetway-place'); expect(SAVE_VERSION).toBe(1); });
  it('round-trips', () => {
    const s = { ...jetSave.fresh(), currency: { balance: 42 }, airport: { ...freshAirport(), owned: [...freshAirport().owned, 'piece:tower'], passengers: 77 } };
    const back = jetSave.decode(JSON.parse(JSON.stringify(jetSave.encode(s))));
    expect(back.currency.balance).toBe(42);
    expect(back.airport.passengers).toBe(77);
    expect(back.airport.owned).toContain('piece:tower');
  });
  it('starts fresh from a version it does not know', () => expect(jetSave.decode({ version: 99, balance: 5 }).currency.balance).toBe(0));
});

describe('a Round', () => {
  it('pays a Bolt for each clean answer and one for finishing, and earns a Flight', () => {
    const s = store(), practice = createPractice(s);
    const started = practice.start();
    expect(started.kind).toBe('accepted');
    if (started.kind !== 'accepted') return;
    for (let i = 1; i <= 5; i++) practice.solve(started.roundId, solved(i, i === 3 ? 'missed' : 'clean'), { mode: 'add', push: true });
    const done = practice.terminal({ roundId: started.roundId, status: 'completed', results: [1, 2, 3, 4, 5].map(i => solved(i, i === 3 ? 'missed' : 'clean')) });
    expect(done.kind).toBe('accepted');
    expect(s.state.currency.balance).toBe(5);
    expect(s.state.airport.flights).toBe(2); // the free first one, and this Round's
  });
  it('a Flight is used at its end, pays, and does nothing without one', () => {
    const s = store();
    const plan = planFlight(s.state.airport);
    const pay = settleFlight(s, plan, { stars: 10, grade: 3, fires: 0 });
    expect(pay?.bolts).toBeGreaterThan(0);
    expect(s.state.airport.flights).toBe(0);
    expect(s.state.currency.balance).toBe(pay!.bolts);
    expect(settleFlight(s, plan, { stars: 10, grade: 3, fires: 0 })).toBeNull();
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
    for (let n = 0; n <= 999; n++) for (const p of sayNum(n)) expect(said.has(p), `${n}: ${p}`).toBe(true);
  });
});
