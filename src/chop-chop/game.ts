// The saved game and how practice changes it. Everything goes through player.commit(), which saves it under its own key,
// so Chop Chop never touches another game's save on the same site.
import { readCurrency, type CurrencyState, type EarningsPolicy } from '../currency/currency';
import { createPracticeCoordinator } from '../app/coordination';
import { createRewardPurchases } from '../app/purchaseCoordination';
import type { SolvedProblem } from '../learning/session';
import { boltsFor } from '../round/rules';
import { browserStorage, createStore, type SaveAdapter } from '../save/storage';
import { countAnswer, freshTrophies, readTrophies, type TrophyState } from '../trophies/rules';
import type { HeliId } from './hangar/catalog';
import { becameAffordable, freshHelipad, proposePurchase, readHelipad, type HelipadState } from './hangar/helipad';
import { freshLearning, readLearning, recordSolved, startPractice, type Asked, type LearningChange, type LearningState } from './learning';
import { completeTrophies, dayOf, STEP_IDS, type StepId, type TrophyStep } from './trophies';

interface CompleteFacts { trophies: TrophyStep[]; canBuild: boolean }

export const SAVE_KEY = 'chop-chop-save';
export const SAVE_VERSION = 1;

export interface ChopState {
  learning: LearningState;
  currency: CurrencyState;
  helipad: HelipadState;
  trophies: TrophyState<StepId>;
}

type Raw = Record<string, unknown>;
const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);

export const chopSave: SaveAdapter<ChopState> = {
  fresh: () => ({ learning: freshLearning(), currency: { balance: 0 }, helipad: freshHelipad(), trophies: freshTrophies() }),
  decode(raw) {
    const data = isRecord(raw) && raw.version === SAVE_VERSION ? raw : {};
    return {
      learning: readLearning(data.learning), currency: readCurrency(data.bolts),
      helipad: readHelipad(data.helipad), trophies: readTrophies(data.trophies, STEP_IDS),
    };
  },
  encode: state => ({ version: SAVE_VERSION, bolts: state.currency.balance, learning: state.learning, helipad: state.helipad, trophies: state.trophies }),
};

export const player = createStore({ key: SAVE_KEY, adapter: chopSave, backing: browserStorage });

export const earnings: EarningsPolicy = result => boltsFor(result.results.map(r => r.outcome));

export function createPractice(store: Pick<typeof player, 'commit'>, today = () => dayOf(new Date())) {
  const coordinator = createPracticeCoordinator<ChopState, void, void, LearningChange, CompleteFacts, Asked>(store, {
    start: state => ({ state: { ...state, learning: startPractice(state.learning) }, context: undefined, intro: false }),
    acknowledge: state => state,
    interrupt: (state, outcome) => ({ ...state, trophies: countAnswer(state.trophies, outcome) }),
    solve(state, _context, fact, asked) {
      const next = asked ? recordSolved(state.learning, asked, fact) : { state: state.learning, changes: [] };
      return { state: { ...state, learning: next.state, trophies: countAnswer(state.trophies, fact.outcome) }, changes: next.changes };
    },
    earnings,
    complete(state, fact, before, after) {
      const done = completeTrophies(state.trophies, state.learning, fact.results.map(r => r.outcome), today());
      return { state: { ...state, trophies: done.state }, facts: { trophies: done.earned, canBuild: becameAffordable(state.helipad, before, after) } };
    },
  });
  return { ...coordinator, start: (resume?: readonly SolvedProblem[]) => coordinator.start(undefined, resume) };
}

export const practice = createPractice(player);
export const buy = createRewardPurchases(player, { proposePurchase }, {
  read: state => state.helipad,
  replace: (state, helipad) => ({ ...state, helipad }),
});
export const updateHelipad = (change: (h: HelipadState) => HelipadState | null) =>
  player.commit(state => { const helipad = change(state.helipad); return helipad ? { ...state, helipad } : null; });

/** First launch: his first helicopter, one of the starters. */
export const setupHeli = (heli: HeliId) => player.commit(state => (state.helipad.heli === null && state.helipad.ownedHelis.includes(heli) ? { ...state, helipad: { ...state.helipad, heli } } : null));
