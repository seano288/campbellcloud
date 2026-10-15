import { signal } from '@preact/signals';
import { createPracticeCoordinator } from '../../src/app/coordination';
import type { CurrencyState } from '../../src/currency/currency';
import { createRound } from '../../src/learning/round';
import { nonMoneySession, progressNonMoney } from '../../src/learning/nonMoney.fixture';
import { countAnswer, finishRound, freshTrophies, readTrophies, type TrophyState } from '../../src/trophies/rules';
import type { createStore } from '../../src/save/store';
import { count, fixtureDay, record } from './data';

export const clockSteps = ['first-clock', 'perfect', 'rounds:1', 'rounds:2'] as const;
export type ClockStep = typeof clockSteps[number];
export const freshClock = () => ({ learning: { solved: 0 }, currency: { balance: 0 }, trophies: freshTrophies<ClockStep>() });
export const readClock = (raw: unknown) => ({
  learning: { solved: count(record(record(raw).learning).solved) },
  trophies: readTrophies(record(raw).trophies, clockSteps),
});

export function clockPractice<State extends { learning: { solved: number }; currency: CurrencyState; trophies: TrophyState<ClockStep> }>(
  store: Pick<ReturnType<typeof createStore<State>>, 'commit'>,
) {
  const completion = signal<{ earned: number; trophies: ClockStep[] } | null>(null);
  const practice = createPracticeCoordinator(store, {
    start: state => ({ state: { ...state }, context: undefined, intro: false }),
    acknowledge: state => state,
    interrupt: (state, outcome) => ({ ...state, trophies: countAnswer(state.trophies, outcome) }),
    solve(state, context, fact) {
      const next = progressNonMoney(state.learning, context, fact);
      return { state: { ...state, learning: next.state, trophies: countAnswer(state.trophies, fact.outcome) }, changes: next.changes };
    },
    earnings: () => 4,
    complete(state, fact) {
      const done = finishRound(state.trophies, fact.results.map(r => r.outcome), fixtureDay, [
        { id: 'first-clock', kind: 'milestone', reached: state.learning.solved > 0 },
        { id: 'perfect', kind: 'perfect' }, { id: 'rounds:1', kind: 'rounds', n: 1 }, { id: 'rounds:2', kind: 'rounds', n: 2 },
      ]);
      return { state: { ...state, trophies: done.state }, facts: { trophies: done.earned } };
    },
  });
  let active: { leave(): void } | undefined;
  return {
    practice, completion,
    begin() {
      active?.leave();
      completion.value = null;
      const started = practice.start(undefined);
      if (started.kind !== 'accepted') throw new Error('Clock fixture is not loaded');
      const round = createRound({
        roundId: started.roundId, session: nonMoneySession(), rng: () => 0,
        interrupt: fact => { practice.interrupt(fact.roundId, fact.index, fact.outcome); },
        solved: (id, fact) => { practice.solve(id, fact); },
        terminal: fact => {
          const result = practice.terminal(fact);
          if (result.kind === 'accepted') completion.value = { earned: result.earned, trophies: result.trophies };
        },
      });
      active = round;
      return round;
    },
  };
}
