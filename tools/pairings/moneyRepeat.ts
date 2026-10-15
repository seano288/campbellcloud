import { signal } from '@preact/signals';
import { createMoneyPractice } from '../../src/app/moneyPractice';
import { createRound } from '../../src/learning/round';
import { learnSession } from '../../src/modes/session';
import { explainLearn } from '../../src/modes/learn/feedback';
import { freshLearning, readLearning } from '../../src/modes/state';
import { freshTrophies, readTrophies } from '../../src/trophies/rules';
import { STEP_IDS, type StepId } from '../../src/trophies/trophies';
import { createStore, type BackingStore, type SaveAdapter } from '../../src/save/store';
import { fixtureDay, readWallet, record } from './data';
import { freshRepeat, readRepeat, repeatBuyer } from './repeat';

const fresh = () => ({ learning: freshLearning(), currency: { balance: 0 }, trophies: freshTrophies<StepId>(), reward: freshRepeat() });
export const moneyRepeatSave: SaveAdapter<ReturnType<typeof fresh>> = {
  fresh, encode: state => state,
  decode: raw => ({ learning: readLearning(record(raw).learning), currency: readWallet(raw), trophies: readTrophies(record(raw).trophies, STEP_IDS), reward: readRepeat(record(raw).reward) }),
};
export const moneyRepeatKey = 'test-money-repeat';
export function createMoneyRepeat(backing: BackingStore) {
  const store = createStore({ key: moneyRepeatKey, adapter: moneyRepeatSave, backing });
  const practice = createMoneyPractice(store, { today: () => fixtureDay });
  const completion = signal<{ earned: number } | null>(null);
  let active: { leave(): void } | undefined;
  return {
    store, practice, completion, buy: repeatBuyer(store),
    begin() {
      active?.leave();
      completion.value = null;
      const started = practice.start('learn');
      if (started.kind !== 'accepted') throw new Error('Money fixture is not loaded');
      const round = createRound({
        roundId: started.roundId,
        session: learnSession(started.level, () => store.state.peek().learning.modes.learn, explainLearn), rng: () => 0,
        introduction: started.intro ? { acknowledge: () => { practice.acknowledge(started.roundId); } } : undefined,
        interrupt: fact => { practice.interrupt(fact.roundId, fact.index, fact.outcome); },
        solved: (id, fact) => { practice.solve(id, fact); },
        terminal: fact => {
          const result = practice.terminal(fact);
          if (result.kind === 'accepted') completion.value = { earned: result.earned };
        },
      });
      active = round;
      return round;
    },
  };
}
