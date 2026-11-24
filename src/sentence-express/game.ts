// The saved game and how practice changes it. Everything goes through player.commit(), which saves it under its own key, so Sentence
// Express never touches another game's save on the same site. A Round pays Tickets through the shared currency and earns a Delivery;
// the Shed spends Tickets through the shared reward purchases.
import { createPracticeCoordinator } from '../app/coordination';
import { createRewardPurchases } from '../app/purchaseCoordination';
import { credit, readCurrency, type CurrencyState, type EarningsPolicy } from '../currency/currency';
import { boltsFor } from '../round/rules';
import { browserStorage, createStore, type SaveAdapter } from '../save/storage';
import type { Layout } from './layout/track';
import { freshLearning, readLearning, recordSolved, startPractice, type Asked, type LearningChange, type LearningState } from './learning';
import { earnDelivery, finishDelivery, freshTrainSet, proposePurchase, readTrainSet, withLayout, type DeliveryPay, type Plan, type TrainSet } from './shed/trainset';

export const SAVE_KEY = 'sentence-express-save';
/** Saved progress is versioned like the other games: a version this build doesn't know reads as a blank save. */
export const SAVE_VERSION = 1;

export interface ExpressGame {
  learning: LearningState;
  currency: CurrencyState;
  trains: TrainSet;
}

type Raw = Record<string, unknown>;
const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);

export const expressSave: SaveAdapter<ExpressGame> = {
  fresh: () => ({ learning: freshLearning(), currency: { balance: 0 }, trains: freshTrainSet() }),
  decode(raw) {
    const data = isRecord(raw) && raw.version === SAVE_VERSION ? raw : {};
    return { learning: readLearning(data.learning), currency: readCurrency(data.balance), trains: readTrainSet(data.trains) };
  },
  encode: state => ({ version: SAVE_VERSION, balance: state.currency.balance, learning: state.learning, trains: state.trains }),
};

export const player = createStore({ key: SAVE_KEY, adapter: expressSave, backing: browserStorage });

export const earnings: EarningsPolicy = result => boltsFor(result.results.map(r => r.outcome));

export function createPractice(store: Pick<typeof player, 'commit'>) {
  const coordinator = createPracticeCoordinator<ExpressGame, void, void, LearningChange, Record<never, never>, Asked>(store, {
    start: state => ({ state: { ...state, learning: startPractice(state.learning) }, context: undefined, intro: false }),
    acknowledge: state => state,
    interrupt: state => state,
    solve(state, _context, fact, asked) {
      const next = asked ? recordSolved(state.learning, asked, fact) : { state: state.learning, changes: [] };
      return { state: { ...state, learning: next.state }, changes: next.changes };
    },
    earnings,
    complete: state => ({ state: { ...state, trains: earnDelivery(state.trains) }, facts: {} }),
  });
  return { ...coordinator, start: (resume?: Parameters<typeof coordinator.start>[1]) => coordinator.start(undefined, resume) };
}

export const practice = createPractice(player);
export const buy = createRewardPurchases(player, { proposePurchase }, {
  read: state => state.trains,
  replace: (state, trains) => ({ ...state, trains }),
});
export const updateTrains = (change: (t: TrainSet) => TrainSet | null) =>
  player.commit(state => { const trains = change(state.trains); return trains ? { ...state, trains } : null; });
export const saveLayout = (layout: Layout) => updateTrains(t => (t.layout === layout ? null : withLayout(t, layout)));

/** The cargo reached Toy Town: pay the Tickets, use the Delivery, give the gift and open the next station. */
export function settleDelivery(store: Pick<typeof player, 'commit'>, plan: Pick<Plan, 'layout' | 'pickup'>): DeliveryPay | null {
  let pay: DeliveryPay | null = null;
  store.commit(s => {
    if (s.trains.deliveries <= 0) return null;
    const done = finishDelivery(s.trains, plan);
    pay = done.pay;
    const paid = credit(s.currency, done.pay.tickets);
    return { ...s, trains: done.state, currency: paid.kind === 'accepted' ? paid.state : s.currency };
  });
  return pay;
}
