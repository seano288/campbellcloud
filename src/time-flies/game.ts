// The saved game and how practice changes it. Everything goes through player.commit(), which saves it under its own key,
// so Time Flies never touches the Monster Truck Money save on the same site.
import { readCurrency, type CurrencyState, type EarningsPolicy } from '../currency/currency';
import { createPracticeCoordinator } from '../app/coordination';
import { createRewardPurchases } from '../app/purchaseCoordination';
import type { SolvedProblem } from '../learning/session';
import { boltsFor } from '../round/rules';
import { browserStorage, createStore, type SaveAdapter } from '../save/storage';
import { countAnswer, freshTrophies, readTrophies, type TrophyState } from '../trophies/rules';
import type { JetId } from './hangar/catalog';
import type { Level } from './clock/time';
import { becameAffordable, freshHangar, proposePurchase, readHangar, type HangarState } from './hangar/hangar';
import { acknowledgeIntro, freshLearning, pendingIntro, readLearning, recordSolved, startPractice, type Asked, type LearningChange, type LearningState } from './learning';
import { completeTrophies, dayOf, STEP_IDS, type StepId, type TrophyStep } from './trophies';

interface CompleteFacts { trophies: TrophyStep[]; canBuild: boolean }

export const SAVE_KEY = 'time-flies-save';
export const SAVE_VERSION = 1;

export interface FliesState {
  learning: LearningState;
  currency: CurrencyState;
  hangar: HangarState;
  trophies: TrophyState<StepId>;
}

type Raw = Record<string, unknown>;
const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);

export const fliesSave: SaveAdapter<FliesState> = {
  fresh: () => ({ learning: freshLearning(), currency: { balance: 0 }, hangar: freshHangar(), trophies: freshTrophies() }),
  decode(raw) {
    const data = isRecord(raw) && raw.version === SAVE_VERSION ? raw : {};
    return {
      learning: readLearning(data.learning), currency: readCurrency(data.bolts),
      hangar: readHangar(data.hangar), trophies: readTrophies(data.trophies, STEP_IDS),
    };
  },
  encode: state => ({ version: SAVE_VERSION, bolts: state.currency.balance, learning: state.learning, hangar: state.hangar, trophies: state.trophies }),
};

export const player = createStore({ key: SAVE_KEY, adapter: fliesSave, backing: browserStorage });

export const earnings: EarningsPolicy = result => boltsFor(result.results.map(r => r.outcome));

export function createPractice(store: Pick<typeof player, 'commit'>, today = () => dayOf(new Date())) {
  const coordinator = createPracticeCoordinator<FliesState, void, Level, LearningChange, CompleteFacts, Asked>(store, {
    start(state) {
      // the context is the clock's new Level, when one of its kinds just reached it: its new times are introduced first
      const level = pendingIntro(state.learning);
      return { state: { ...state, learning: startPractice(state.learning) }, context: level, intro: level > 1 };
    },
    acknowledge: state => ({ ...state, learning: acknowledgeIntro(state.learning) }),
    interrupt: (state, outcome) => ({ ...state, trophies: countAnswer(state.trophies, outcome) }),
    solve(state, _context, fact, asked) {
      const next = asked ? recordSolved(state.learning, asked, fact) : { state: state.learning, changes: [] };
      return { state: { ...state, learning: next.state, trophies: countAnswer(state.trophies, fact.outcome) }, changes: next.changes };
    },
    earnings,
    complete(state, fact, before, after) {
      const done = completeTrophies(state.trophies, state.learning, fact.results.map(r => r.outcome), today());
      return { state: { ...state, trophies: done.state }, facts: { trophies: done.earned, canBuild: becameAffordable(state.hangar, before, after) } };
    },
  });
  return { ...coordinator, start: (resume?: readonly SolvedProblem[]) => coordinator.start(undefined, resume) };
}

export const practice = createPractice(player);
export const buy = createRewardPurchases(player, { proposePurchase }, {
  read: state => state.hangar,
  replace: (state, hangar) => ({ ...state, hangar }),
});
export const updateHangar = (change: (h: HangarState) => HangarState | null) =>
  player.commit(state => { const hangar = change(state.hangar); return hangar ? { ...state, hangar } : null; });

/** First launch: his first plane, one of the starters. */
export const setupJet = (jet: JetId) => player.commit(state => (state.hangar.jet === null && state.hangar.ownedJets.includes(jet) ? { ...state, hangar: { ...state.hangar, jet } } : null));
