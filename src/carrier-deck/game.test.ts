import { describe, expect, it } from 'vitest';
import type { SolvedProblem } from '../learning/session';
import { createPractice, deckSave, SAVE_KEY, SAVE_VERSION, settleMission, type DeckState } from './game';
import { freshShip, planMission, readShip } from './ship/ship';
import { needLine, PHRASES, PRICE_TOP, sayable } from './phrases';
import { FOR_SALE, REPEATS, repeatPrice } from './ship/catalog';
import { CLIPS } from './voice.gen';
import { PLACE_KEY } from './nav';

function store(initial: DeckState = deckSave.fresh()) {
  let state = initial;
  return {
    get state() { return state; },
    commit(change: (s: DeckState) => DeckState | null) { const next = change(state); if (!next) return { kind: 'rejected' as const, reason: 'rejected' as const }; state = next; return { kind: 'accepted' as const, state, saved: Promise.resolve(true) }; },
  };
}
const solved = (i: number, outcome: SolvedProblem['outcome'] = 'clean'): SolvedProblem => ({ index: i, outcome, misses: outcome === 'clean' ? 0 : 1, helped: false, replay: false });

describe('the save', () => {
  it('has its own keys and a version', () => { expect(SAVE_KEY).toBe('carrier-deck-save'); expect(PLACE_KEY).toBe('carrier-deck-place'); expect(SAVE_VERSION).toBe(1); });
  it('round-trips', () => {
    const s = { ...deckSave.fresh(), currency: { balance: 42 }, ship: { ...freshShip(), owned: [...freshShip().owned, 'part:island', 'gpatch:3'], minutes: 777, yard: [1, 2], more: { hull: 2, bay: 0, yard: 2 } } };
    const back = deckSave.decode(JSON.parse(JSON.stringify(deckSave.encode(s))));
    expect(back.currency.balance).toBe(42);
    expect(back.ship.minutes).toBe(777);
    expect(back.ship.owned).toContain('part:island');
    expect(back.ship.owned).toContain('gpatch:3');
    expect(back.ship.yard).toEqual([1, 2]);
    expect(back.ship.more.hull).toBe(2);
  });
  it('starts fresh from a version it does not know', () => expect(deckSave.decode({ version: 99, balance: 5 }).currency.balance).toBe(0));
  it('reads anything broken as fresh, and never wears what he does not own', () => {
    const s = readShip({ owned: ['part:nope', 'paint:red'], flying: 'jump', hullPaint: 'hull:red', mark: 'gmark:9', looks: { trainer: { paint: 'paint:gold', tail: 7, num: 300 } }, gen: -4, missions: 'x' });
    expect(s.owned).toContain('paint:red');
    expect(s.owned).not.toContain('part:nope');
    expect(s.flying).toBe('trainer');
    expect(s.hullPaint).toBe('hull:grey');
    expect(s.mark).toBe('mark:none');
    expect(s.looks.trainer!.paint).toBe('paint:white');
    expect(s.looks.trainer!.num).toBe(99);
    expect(s.gen).toBe(36);
    expect(s.missions).toBe(0);
  });
});

describe('a Round', () => {
  it('pays a Bolt for each clean answer and one for finishing, and earns a Mission', () => {
    const s = store(), practice = createPractice(s);
    const started = practice.start();
    expect(started.kind).toBe('accepted');
    if (started.kind !== 'accepted') return;
    for (let i = 1; i <= 5; i++) practice.solve(started.roundId, solved(i, i === 3 ? 'missed' : 'clean'), { mode: 'one', push: true });
    const done = practice.terminal({ roundId: started.roundId, status: 'completed', results: [1, 2, 3, 4, 5].map(i => solved(i, i === 3 ? 'missed' : 'clean')) });
    expect(done.kind).toBe('accepted');
    expect(s.state.currency.balance).toBe(5);
    expect(s.state.ship.missions).toBe(2); // the free first one, and this Round's
  });
  it('a Mission is used at its end, pays, and does nothing without one', () => {
    const s = store();
    const plan = planMission(s.state.ship);
    const pay = settleMission(s, plan, { stars: 3, wire: 1, grade: 3 });
    expect(pay?.bolts).toBe(2 + 2 + 2 + 1); // base, three stars, a new Mission, the wire he aimed for
    expect(s.state.ship.missions).toBe(0);
    expect(s.state.ship.records[1]).toMatchObject({ flown: 1, bestGrade: 3 });
    expect(s.state.currency.balance).toBe(pay!.bolts);
    expect(settleMission(s, plan, { stars: 3, wire: 1, grade: 3 })).toBeNull();
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
