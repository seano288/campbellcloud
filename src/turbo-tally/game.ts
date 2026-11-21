// The saved game and how practice changes it. Everything goes through player.commit(), which saves it under its own key, so Turbo
// Tally never touches another game's save on the same site. A Round pays Bolts through the shared currency and earns a Race; the
// Garage spends Bolts on parts through the shared reward purchases.
import { createPracticeCoordinator } from '../app/coordination';
import { createRewardPurchases } from '../app/purchaseCoordination';
import { credit, readCurrency, type CurrencyState, type EarningsPolicy } from '../currency/currency';
import { boltsFor } from '../round/rules';
import { browserStorage, createStore, type SaveAdapter } from '../save/storage';
import { earnRace, finishRace, freshGarage, payFor, proposePurchase, readGarage, type GarageState, type RacePay } from './garage/garage';
import type { RacePlan } from './race/rivals';
import { freshLearning, readLearning, recordSolved, startPractice, type Asked, type LearningChange, type LearningState } from './learning';

export const SAVE_KEY = 'turbo-tally-save';
/** Saved progress is versioned like the other games: a version this build doesn't know reads as a blank save. */
export const SAVE_VERSION = 1;

export interface TallyState {
  learning: LearningState;
  currency: CurrencyState;
  garage: GarageState;
}

type Raw = Record<string, unknown>;
const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);

export const tallySave: SaveAdapter<TallyState> = {
  fresh: () => ({ learning: freshLearning(), currency: { balance: 0 }, garage: freshGarage() }),
  decode(raw) {
    const data = isRecord(raw) && raw.version === SAVE_VERSION ? raw : {};
    return { learning: readLearning(data.learning), currency: readCurrency(data.balance), garage: readGarage(data.garage) };
  },
  encode: state => ({ version: SAVE_VERSION, balance: state.currency.balance, learning: state.learning, garage: state.garage }),
};

export const player = createStore({ key: SAVE_KEY, adapter: tallySave, backing: browserStorage });

export const earnings: EarningsPolicy = result => boltsFor(result.results.map(r => r.outcome));

export function createPractice(store: Pick<typeof player, 'commit'>) {
  const coordinator = createPracticeCoordinator<TallyState, void, void, LearningChange, Record<never, never>, Asked>(store, {
    start: state => ({ state: { ...state, learning: startPractice(state.learning) }, context: undefined, intro: false }),
    acknowledge: state => state,
    interrupt: state => state,
    solve(state, _context, fact, asked) {
      const next = asked ? recordSolved(state.learning, asked, fact) : { state: state.learning, changes: [] };
      return { state: { ...state, learning: next.state }, changes: next.changes };
    },
    earnings,
    complete: state => ({ state: { ...state, garage: earnRace(state.garage) }, facts: {} }),
  });
  return { ...coordinator, start: (resume?: Parameters<typeof coordinator.start>[1]) => coordinator.start(undefined, resume) };
}

export const practice = createPractice(player);
export const buy = createRewardPurchases(player, { proposePurchase }, {
  read: state => state.garage,
  replace: (state, garage) => ({ ...state, garage }),
});
export const updateGarage = (change: (g: GarageState) => GarageState | null) =>
  player.commit(state => { const garage = change(state.garage); return garage ? { ...state, garage } : null; });

/** The Race ended at the line: pay the finish, use the Race, keep the record, give the prize. Null if he had no Race to use. `beat`
 *  is whether he did what the Race was for (rivals.ts, RacePlan); `cars` how many raced, his included. */
export function settleRace(store: Pick<typeof player, 'commit'>, plan: RacePlan, place: number, beat: boolean, cars = 4): RacePay | null {
  let pay: RacePay | null = null;
  store.commit(s => {
    if (s.garage.races <= 0) return null;
    pay = payFor(s.garage, plan, place, beat, cars);
    const paid = credit(s.currency, pay.bolts);
    return { ...s, garage: finishRace(s.garage, plan, pay), currency: paid.kind === 'accepted' ? paid.state : s.currency };
  });
  return pay;
}
