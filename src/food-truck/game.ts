// The saved game and how practice changes it. Everything goes through player.commit(), which saves it under its own key, so Food Truck
// never touches another game's save on the same site. A Round pays Bolts through the shared currency and earns a Service; the Truck
// shop spends Bolts through the shared reward purchases. A Service pays stars, not Bolts.
import { createPracticeCoordinator } from '../app/coordination';
import { createRewardPurchases } from '../app/purchaseCoordination';
import { readCurrency, type CurrencyState, type EarningsPolicy } from '../currency/currency';
import { boltsFor } from '../round/rules';
import { browserStorage, createStore, type SaveAdapter } from '../save/storage';
import { freshLearning, readLearning, recordSolved, startPractice, type Asked, type LearningChange, type LearningState } from './learning';
import { earnService, finishService, freshTruck, proposePurchase, readTruck, type ServicePay, type TruckState } from './truck/state';
import type { RegularId } from './truck/world';

export const SAVE_KEY = 'food-truck-save';
/** Saved progress is versioned like the other games: a version this build doesn't know reads as a blank save. */
export const SAVE_VERSION = 1;

export interface TruckGame {
  learning: LearningState;
  currency: CurrencyState;
  truck: TruckState;
}

type Raw = Record<string, unknown>;
const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);

export const truckSave: SaveAdapter<TruckGame> = {
  fresh: () => ({ learning: freshLearning(), currency: { balance: 0 }, truck: freshTruck() }),
  decode(raw) {
    const data = isRecord(raw) && raw.version === SAVE_VERSION ? raw : {};
    return { learning: readLearning(data.learning), currency: readCurrency(data.balance), truck: readTruck(data.truck) };
  },
  encode: state => ({ version: SAVE_VERSION, balance: state.currency.balance, learning: state.learning, truck: state.truck }),
};

export const player = createStore({ key: SAVE_KEY, adapter: truckSave, backing: browserStorage });

export const earnings: EarningsPolicy = result => boltsFor(result.results.map(r => r.outcome));

export function createPractice(store: Pick<typeof player, 'commit'>) {
  const coordinator = createPracticeCoordinator<TruckGame, void, void, LearningChange, Record<never, never>, Asked>(store, {
    start: state => ({ state: { ...state, learning: startPractice(state.learning) }, context: undefined, intro: false }),
    acknowledge: state => state,
    interrupt: state => state,
    solve(state, _context, fact, asked) {
      const next = asked ? recordSolved(state.learning, asked, fact) : { state: state.learning, changes: [] };
      return { state: { ...state, learning: next.state }, changes: next.changes };
    },
    earnings,
    complete: state => ({ state: { ...state, truck: earnService(state.truck) }, facts: {} }),
  });
  return { ...coordinator, start: (resume?: Parameters<typeof coordinator.start>[1]) => coordinator.start(undefined, resume) };
}

export const practice = createPractice(player);
export const buy = createRewardPurchases(player, { proposePurchase }, {
  read: state => state.truck,
  replace: (state, truck) => ({ ...state, truck }),
});
export const updateTruck = (change: (t: TruckState) => TruckState | null) =>
  player.commit(state => { const truck = change(state.truck); return truck ? { ...state, truck } : null; });

/** The Service ended: it's used, the people he fed become stars, and a new Regular goes in the book. Null if he had no Service. */
export function settleService(store: Pick<typeof player, 'commit'>, fed: number, regular: RegularId | null): ServicePay | null {
  let pay: ServicePay | null = null;
  store.commit(s => {
    const done = finishService(s.truck, fed, regular);
    if (!done) return null;
    pay = done.pay;
    return { ...s, truck: done.state };
  });
  return pay;
}
