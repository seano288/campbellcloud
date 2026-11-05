import { describe, expect, it } from 'vitest';
import { freshLearning } from './learning';
import { createPractice, mathSave, SAVE_KEY, type MathState } from './game';
import { freshWorkshop } from './workshop/workshop';
import type { SolvedProblem } from '../learning/session';

const store = () => {
  let state: MathState = mathSave.fresh();
  return { get state() { return state; }, commit(change: (s: MathState) => MathState | null) { const next = change(state); if (!next) return { kind: 'unchanged' as const, state }; state = next; return { kind: 'accepted' as const, state }; } };
};

describe('the save', () => {
  it('has its own key', () => expect(SAVE_KEY).toBe('math-bots-save'));
  it('round-trips', () => {
    const s: MathState = { learning: freshLearning(), currency: { balance: 9 }, workshop: { ...freshWorkshop(), unlocked: ['paint:1'], gear: { ...freshWorkshop().gear, paint: 1 }, fights: 3, ticket: true } };
    expect(mathSave.decode(JSON.parse(JSON.stringify(mathSave.encode(s))))).toEqual(s);
  });
  it('keeps a save from before the Workshop', () => {
    const old = { version: 1, balance: 12, learning: freshLearning() };
    const s = mathSave.decode(JSON.parse(JSON.stringify(old)));
    expect(s.currency.balance).toBe(12);
    expect(s.workshop).toEqual(freshWorkshop());
  });
  it('starts fresh from anything else', () => expect(mathSave.decode({ version: 99, balance: 5 }).currency.balance).toBe(0));
});

describe('a Round', () => {
  it('pays a Bolt for each clean answer and one for finishing, through the shared currency', () => {
    const s = store(), practice = createPractice(s as never);
    const started = practice.start();
    if (started.kind !== 'accepted') throw 0;
    const results: SolvedProblem[] = [];
    for (let i = 1; i <= 5; i++) {
      const fact: SolvedProblem = { index: i, outcome: i === 3 ? 'missed' : 'clean', misses: i === 3 ? 1 : 0, helped: false, replay: false };
      practice.solve(started.roundId, fact, { mode: 'ten', push: true });
      results.push(fact);
    }
    const done = practice.terminal({ roundId: started.roundId, status: 'completed', results });
    expect(done.kind).toBe('accepted');
    expect(s.state.currency.balance).toBe(5);
  });
});
