// The saved game and how practice changes it. Everything goes through player.commit(), which saves it under its own key, so
// Math Bots never touches another game's save on the same site. A Round pays Bolts through the shared currency; the Workshop
// spends them through the shared reward purchases.
import { createPracticeCoordinator } from '../app/coordination';
import { createRewardPurchases } from '../app/purchaseCoordination';
import { readCurrency, type CurrencyState, type EarningsPolicy } from '../currency/currency';
import { boltsFor } from '../round/rules';
import { browserStorage, createStore, type SaveAdapter } from '../save/storage';
import { freshLearning, readLearning, recordSolved, startPractice, type Asked, type LearningChange, type LearningState } from './learning';
import { freshWorkshop, proposePurchase, readWorkshop, type WorkshopState } from './workshop/workshop';

export const SAVE_KEY = 'math-bots-save';
export const SAVE_VERSION = 2;
/** Saves from before the Workshop: the same, with nothing bought. */
const OLD_VERSIONS: readonly unknown[] = [1];

export interface MathState {
  learning: LearningState;
  currency: CurrencyState;
  workshop: WorkshopState;
}

type Raw = Record<string, unknown>;
const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);

export const mathSave: SaveAdapter<MathState> = {
  fresh: () => ({ learning: freshLearning(), currency: { balance: 0 }, workshop: freshWorkshop() }),
  decode(raw) {
    const data = isRecord(raw) && (raw.version === SAVE_VERSION || OLD_VERSIONS.includes(raw.version)) ? raw : {};
    return { learning: readLearning(data.learning), currency: readCurrency(data.balance), workshop: readWorkshop(data.workshop) };
  },
  encode: state => ({ version: SAVE_VERSION, balance: state.currency.balance, learning: state.learning, workshop: state.workshop }),
};

export const player = createStore({ key: SAVE_KEY, adapter: mathSave, backing: browserStorage });

export const earnings: EarningsPolicy = result => boltsFor(result.results.map(r => r.outcome));

export function createPractice(store: Pick<typeof player, 'commit'>) {
  const coordinator = createPracticeCoordinator<MathState, void, void, LearningChange, Record<never, never>, Asked>(store, {
    start: state => ({ state: { ...state, learning: startPractice(state.learning) }, context: undefined, intro: false }),
    acknowledge: state => state,
    interrupt: state => state,
    solve(state, _context, fact, asked) {
      const next = asked ? recordSolved(state.learning, asked, fact) : { state: state.learning, changes: [] };
      return { state: { ...state, learning: next.state }, changes: next.changes };
    },
    earnings,
    complete: state => ({ state, facts: {} }),
  });
  return { ...coordinator, start: (resume?: Parameters<typeof coordinator.start>[1]) => coordinator.start(undefined, resume) };
}

export const practice = createPractice(player);
export const buy = createRewardPurchases(player, { proposePurchase }, {
  read: state => state.workshop,
  replace: (state, workshop) => ({ ...state, workshop }),
});
export const updateWorkshop = (change: (w: WorkshopState) => WorkshopState | null) =>
  player.commit(state => { const workshop = change(state.workshop); return workshop ? { ...state, workshop } : null; });
