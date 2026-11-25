// The saved game and how practice changes it. Everything goes through player.commit(), which saves it under its own key, so Coaster Crew
// never touches another game's save on the same site. A Round pays Tokens through the shared currency and earns a Ride; the Coaster Yard
// spends Tokens through the shared reward purchases.
import { createPracticeCoordinator } from '../app/coordination';
import { createRewardPurchases } from '../app/purchaseCoordination';
import { credit, readCurrency, type CurrencyState, type EarningsPolicy } from '../currency/currency';
import { boltsFor } from '../round/rules';
import { browserStorage, createStore, type SaveAdapter } from '../save/storage';
import { earnRide, finishRide, freshYard, payFor, proposePurchase, readYard, type RidePay, type RidePlan, type RideResult, type YardState } from './park/yard';
import { freshLearning, readLearning, recordSolved, startPractice, type Asked, type LearningChange, type LearningState } from './learning';

export const SAVE_KEY = 'coaster-crew-save';
/** Saved progress is versioned like the other games: a version this build doesn't know reads as a blank save. */
export const SAVE_VERSION = 1;

export interface CoasterState {
  learning: LearningState;
  currency: CurrencyState;
  yard: YardState;
}

type Raw = Record<string, unknown>;
const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);

export const coasterSave: SaveAdapter<CoasterState> = {
  fresh: () => ({ learning: freshLearning(), currency: { balance: 0 }, yard: freshYard() }),
  decode(raw) {
    const data = isRecord(raw) && raw.version === SAVE_VERSION ? raw : {};
    return { learning: readLearning(data.learning), currency: readCurrency(data.balance), yard: readYard(data.yard) };
  },
  encode: state => ({ version: SAVE_VERSION, balance: state.currency.balance, learning: state.learning, yard: state.yard }),
};

export const player = createStore({ key: SAVE_KEY, adapter: coasterSave, backing: browserStorage });

/** One Token for each answer right on the first try, and one for finishing (the shared rule every game pays by). */
export const earnings: EarningsPolicy = result => boltsFor(result.results.map(r => r.outcome));

export function createPractice(store: Pick<typeof player, 'commit'>) {
  const coordinator = createPracticeCoordinator<CoasterState, void, void, LearningChange, Record<never, never>, Asked>(store, {
    start: state => ({ state: { ...state, learning: startPractice(state.learning) }, context: undefined, intro: false }),
    acknowledge: state => state,
    interrupt: state => state,
    solve(state, _context, fact, asked) {
      const next = asked ? recordSolved(state.learning, asked, fact) : { state: state.learning, changes: [] };
      return { state: { ...state, learning: next.state }, changes: next.changes };
    },
    earnings,
    complete: state => ({ state: { ...state, yard: earnRide(state.yard) }, facts: {} }),
  });
  return { ...coordinator, start: (resume?: Parameters<typeof coordinator.start>[1]) => coordinator.start(undefined, resume) };
}

export const practice = createPractice(player);
export const buy = createRewardPurchases(player, { proposePurchase }, {
  read: state => state.yard,
  replace: (state, yard) => ({ ...state, yard }),
});
export const updateYard = (change: (y: YardState) => YardState | null) =>
  player.commit(state => { const yard = change(state.yard); return yard ? { ...state, yard } : null; });

/** The Ride is over: pay it, use it, count the riders, keep the bests. Null if he had no Ride to take. */
export function settleRide(store: Pick<typeof player, 'commit'>, plan: RidePlan, res: RideResult): RidePay | null {
  let pay: RidePay | null = null;
  store.commit(s => {
    if (s.yard.rides <= 0) return null;
    const p = payFor(s.yard, plan, res);
    pay = p;
    const paid = credit(s.currency, p.tokens);
    return { ...s, yard: finishRide(s.yard, plan, res), currency: paid.kind === 'accepted' ? paid.state : s.currency };
  });
  return pay;
}
