import type { CurrencyState, EarningsPolicy } from '../currency/currency';
import { boltsFor } from '../round/rules';
import { dayOf, type StepId } from '../trophies/trophies';
import type { ModeId } from '../modes/ids';
import { recordSolved } from '../modes/learning';
import { acknowledgeIntro, selectPractice, type LearningState } from '../modes/state';
import { completeTrophies } from './trophies';
import { countAnswer as countStreak, type TrophyState } from '../trophies/rules';
import type { createStore } from '../save/store';
import type { SolvedProblem } from '../learning/session';
import { createPracticeCoordinator } from './coordination';

export interface MoneyPracticeState {
  learning: LearningState;
  currency: CurrencyState;
  trophies: TrophyState<StepId>;
}

export const moneyEarnings: EarningsPolicy = result => boltsFor(result.results.map(result => result.outcome));

export interface MoneyPracticeOptions<State> {
  today?: () => string;
  earnings?: EarningsPolicy;
  trophies?: typeof completeTrophies;
  streak?: typeof countStreak;
  becameAffordable?: (state: State, before: number, after: number) => boolean;
}

export function createMoneyPractice<State extends MoneyPracticeState>(
  store: Pick<ReturnType<typeof createStore<State>>, 'commit'>,
  { today = () => dayOf(new Date()), earnings = moneyEarnings, trophies: evaluateTrophies = completeTrophies, streak = countStreak, becameAffordable = () => false }: MoneyPracticeOptions<State> = {},
) {
  const coordinator = createPracticeCoordinator(store, {
    start(state, mode: ModeId) {
      const practice = state.learning.modes[mode];
      const learning = selectPractice(state.learning, mode);
      return { state: { ...state, learning }, context: mode, intro: practice.introPending };
    },
    acknowledge: (state, mode) => ({ ...state, learning: acknowledgeIntro(state.learning, mode) }),
    interrupt: (state, outcome) => ({ ...state, trophies: streak(state.trophies, outcome) }),
    solve(state, mode, fact) {
      const next = recordSolved(state.learning, mode, fact);
      return { state: { ...state, learning: next.state, trophies: streak(state.trophies, fact.outcome) }, changes: next.changes };
    },
    earnings,
    complete(state, fact, beforeBalance, afterBalance) {
      const done = evaluateTrophies(state.trophies, state.learning, fact.results.map(r => r.outcome), today());
      return {
        state: { ...state, trophies: done.state },
        facts: { trophies: done.earned, canBuild: becameAffordable(state, beforeBalance, afterBalance) },
      };
    },
  });
  return {
    ...coordinator,
    start(mode: ModeId, resume?: readonly SolvedProblem[]) {
      const result = coordinator.start(mode, resume);
      return result.kind === 'accepted' ? { ...result, mode, level: result.state.learning.modes[mode].level } : result;
    },
  };
}
