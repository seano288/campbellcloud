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
  it('keeps a version 2 save from before Legendaries and the later kinds: balance, Levels, Tune-Up, purchases and ticket', () => {
    const nine = ['ten', 'on', 'story', 'facts', 'tens', 'part', 'skip', 'scale', 'over'];
    const old = {
      version: 2, balance: 41,
      learning: {
        modes: Object.fromEntries(nine.map(m => [m, { level: m === 'on' ? 3 : 2, window: ['clean'], opened: m !== 'over', starred: m === 'ten', introPending: false, fresh: false }])),
        pushed: Object.fromEntries(nine.map(m => [m, 20])), facts: { strength: { '5+3': 3 }, since: 1 }, met: ['frame', 'path', 'bond', 'rod', 'same', 'signs'],
        tuneUp: { ten: { asked: 3, clean: 3, misses: 0 }, on: { asked: 2, clean: 2, misses: 0 }, facts: { asked: 3, clean: 1, misses: 2 }, tens: { asked: 1, clean: 1, misses: 0 }, story: { asked: 0, clean: 0, misses: 0 } },
      },
      workshop: { unlocked: ['paint:1', 'paint:2', 'paint:3', 'drum:1'], gear: { paint: 3, drum: 1, armour: 0, wheels: 0 }, goal: 'wheels:2', fights: 4, ticket: true },
    };
    const s = mathSave.decode(JSON.parse(JSON.stringify(old)));
    expect(s.currency.balance).toBe(41);
    expect(s.learning.modes.on.level).toBe(3);
    expect(s.learning.modes.ten.starred).toBe(true);
    expect(s.learning.tuneUp).toEqual(old.learning.tuneUp);
    expect(s.workshop).toEqual(old.workshop);
    expect(s.learning.modes.chart.opened).toBe(true);
    expect(s.learning.modes.jump.opened).toBe(false);
    const again = mathSave.decode(JSON.parse(JSON.stringify(mathSave.encode(s))));
    expect(again).toEqual(s); // and it writes back as it read
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
