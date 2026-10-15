import { garageCues } from './garageEconomy';
import type { LearningState } from '../modes/state';
import type { Save } from '../save/migrate';
import type { createStore } from '../save/store';
import type { MoneyState } from './save';
import { createMoneyPractice, type MoneyPracticeOptions } from './moneyPractice';

export const learningFromSave = (save: Save): LearningState => ({ modes: save.modes, lastMode: save.lastMode });
export { moneyEarnings } from './moneyPractice';

export function createPractice(
  store: Pick<ReturnType<typeof createStore<MoneyState>>, 'commit'>,
  options: MoneyPracticeOptions<MoneyState> = {},
) {
  return createMoneyPractice(store, {
    becameAffordable: (state, before, after) => garageCues.becameAffordable(state.garage, before, after),
    ...options,
  });
}
