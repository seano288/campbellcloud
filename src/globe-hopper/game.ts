// The saved game and how practice changes it. Everything goes through player.commit(), which saves it under its own key, so Globe Hopper
// never touches another game's save on the same site. A Round pays Bolts through the shared currency and earns a Launch; the Rocket Base
// spends Bolts through the shared reward purchases.
import { createPracticeCoordinator } from '../app/coordination';
import { createRewardPurchases } from '../app/purchaseCoordination';
import { credit, readCurrency, type CurrencyState, type EarningsPolicy } from '../currency/currency';
import { boltsFor } from '../round/rules';
import { browserStorage, createStore, type SaveAdapter } from '../save/storage';
import { earnLaunch, finishLaunch, freshBase, payFor, proposePurchase, readBase, type BaseState, type LaunchPay, type LaunchPlan, type LaunchResult } from './base/base';
import { freshLearning, readLearning, recordSolved, startPractice, type Asked, type LearningChange, type LearningState } from './learning';

export const SAVE_KEY = 'globe-hopper-save';
/** Saved progress is versioned like the other games: a version this build doesn't know reads as a blank save. */
export const SAVE_VERSION = 1;

export interface GlobeState {
  learning: LearningState;
  currency: CurrencyState;
  base: BaseState;
}

type Raw = Record<string, unknown>;
const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);

export const globeSave: SaveAdapter<GlobeState> = {
  fresh: () => ({ learning: freshLearning(), currency: { balance: 0 }, base: freshBase() }),
  decode(raw) {
    const data = isRecord(raw) && raw.version === SAVE_VERSION ? raw : {};
    return { learning: readLearning(data.learning), currency: readCurrency(data.balance), base: readBase(data.base) };
  },
  encode: state => ({ version: SAVE_VERSION, balance: state.currency.balance, learning: state.learning, base: state.base }),
};

export const player = createStore({ key: SAVE_KEY, adapter: globeSave, backing: browserStorage });

export const earnings: EarningsPolicy = result => boltsFor(result.results.map(r => r.outcome));

export function createPractice(store: Pick<typeof player, 'commit'>) {
  const coordinator = createPracticeCoordinator<GlobeState, void, void, LearningChange, Record<never, never>, Asked>(store, {
    start: state => ({ state: { ...state, learning: startPractice(state.learning) }, context: undefined, intro: false }),
    acknowledge: state => state,
    interrupt: state => state,
    solve(state, _context, fact, asked) {
      const next = asked ? recordSolved(state.learning, asked, fact) : { state: state.learning, changes: [] };
      return { state: { ...state, learning: next.state }, changes: next.changes };
    },
    earnings,
    complete: state => ({ state: { ...state, base: earnLaunch(state.base) }, facts: {} }),
  });
  return { ...coordinator, start: (resume?: Parameters<typeof coordinator.start>[1]) => coordinator.start(undefined, resume) };
}

export const practice = createPractice(player);
export const buy = createRewardPurchases(player, { proposePurchase }, {
  read: state => state.base,
  replace: (state, base) => ({ ...state, base }),
});
export const updateBase = (change: (b: BaseState) => BaseState | null) =>
  player.commit(state => { const base = change(state.base); return base ? { ...state, base } : null; });

/** The Launch is over: pay it, use it, keep the bests and the photos. Null if he had no Launch to fly. */
export function settleLaunch(store: Pick<typeof player, 'commit'>, plan: LaunchPlan, res: LaunchResult): LaunchPay | null {
  let pay: LaunchPay | null = null;
  store.commit(s => {
    if (s.base.launches <= 0) return null;
    const p = payFor(s.base, plan, res);
    pay = p;
    const paid = credit(s.currency, p.bolts);
    return { ...s, base: finishLaunch(s.base, plan, res), currency: paid.kind === 'accepted' ? paid.state : s.currency };
  });
  return pay;
}
