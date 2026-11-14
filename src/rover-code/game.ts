// The saved game and how practice changes it. Everything goes through player.commit(), which saves it under its own key, so Rover
// Code never touches another game's save on the same site. A Round pays Bolts through the shared currency and earns a launch; the
// Space Base spends Bolts on rocket parts through the shared reward purchases.
import { createPracticeCoordinator } from '../app/coordination';
import { createRewardPurchases } from '../app/purchaseCoordination';
import { credit, readCurrency, type CurrencyState, type EarningsPolicy } from '../currency/currency';
import { boltsFor } from '../round/rules';
import { browserStorage, createStore, type SaveAdapter } from '../save/storage';
import { earnLaunch, finishTrip, freshBase, payFor, proposePurchase, readBase, type BaseState, type TripPay } from './base/base';
import type { PlanetId } from './base/planets';
import { freshLearning, readLearning, recordSolved, startPractice, type Asked, type LearningChange, type LearningState } from './learning';

export const SAVE_KEY = 'rover-code-save';
/** Saved progress is versioned like the other games: a version this build doesn't know reads as a blank save. */
export const SAVE_VERSION = 1;

export interface RoverState {
  learning: LearningState;
  currency: CurrencyState;
  base: BaseState;
}

type Raw = Record<string, unknown>;
const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);

export const roverSave: SaveAdapter<RoverState> = {
  fresh: () => ({ learning: freshLearning(), currency: { balance: 0 }, base: freshBase() }),
  decode(raw) {
    const data = isRecord(raw) && raw.version === SAVE_VERSION ? raw : {};
    return { learning: readLearning(data.learning), currency: readCurrency(data.balance), base: readBase(data.base) };
  },
  encode: state => ({ version: SAVE_VERSION, balance: state.currency.balance, learning: state.learning, base: state.base }),
};

export const player = createStore({ key: SAVE_KEY, adapter: roverSave, backing: browserStorage });

export const earnings: EarningsPolicy = result => boltsFor(result.results.map(r => r.outcome));

export function createPractice(store: Pick<typeof player, 'commit'>) {
  const coordinator = createPracticeCoordinator<RoverState, void, void, LearningChange, Record<never, never>, Asked>(store, {
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

/** The trip ended on the planet: pay what he caught and found, use the launch, count the visit, give the gadget. */
export function settleTrip(store: Pick<typeof player, 'commit'>, id: PlanetId, caught: number, crystals: number): TripPay | null {
  let pay: TripPay | null = null;
  store.commit(s => {
    if (s.base.launches <= 0) return null;
    pay = payFor(s.base, id, caught, crystals);
    const paid = credit(s.currency, pay.bolts);
    return { ...s, base: finishTrip(s.base, id, pay), currency: paid.kind === 'accepted' ? paid.state : s.currency };
  });
  return pay;
}
