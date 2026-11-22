// The saved game and how practice changes it. Everything goes through player.commit(), which saves it under its own key, so Hook
// and Ladder never touches another game's save on the same site. A Round pays Bolts through the shared currency and earns a Call;
// the Station spends Bolts through the shared reward purchases.
import { createPracticeCoordinator } from '../app/coordination';
import { createRewardPurchases } from '../app/purchaseCoordination';
import { credit, readCurrency, type CurrencyState, type EarningsPolicy } from '../currency/currency';
import { boltsFor } from '../round/rules';
import type { SceneDef } from './call/scenes';
import { browserStorage, createStore, type SaveAdapter } from '../save/storage';
import { freshLearning, readLearning, recordSolved, startPractice, type Asked, type LearningChange, type LearningState } from './learning';
import { earnCall, finishCall, freshStation, proposePurchase, readStation, type CallPay, type StationState } from './station/station';

export const SAVE_KEY = 'hook-and-ladder-save';
/** Saved progress is versioned like the other games: a version this build doesn't know reads as a blank save. */
export const SAVE_VERSION = 1;

export interface LadderGame {
  learning: LearningState;
  currency: CurrencyState;
  station: StationState;
}

type Raw = Record<string, unknown>;
const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);

export const ladderSave: SaveAdapter<LadderGame> = {
  fresh: () => ({ learning: freshLearning(), currency: { balance: 0 }, station: freshStation() }),
  decode(raw) {
    const data = isRecord(raw) && raw.version === SAVE_VERSION ? raw : {};
    return { learning: readLearning(data.learning), currency: readCurrency(data.balance), station: readStation(data.station) };
  },
  encode: state => ({ version: SAVE_VERSION, balance: state.currency.balance, learning: state.learning, station: state.station }),
};

export const player = createStore({ key: SAVE_KEY, adapter: ladderSave, backing: browserStorage });

export const earnings: EarningsPolicy = result => boltsFor(result.results.map(r => r.outcome));

export function createPractice(store: Pick<typeof player, 'commit'>) {
  const coordinator = createPracticeCoordinator<LadderGame, void, void, LearningChange, Record<never, never>, Asked>(store, {
    start: state => ({ state: { ...state, learning: startPractice(state.learning) }, context: undefined, intro: false }),
    acknowledge: state => state,
    interrupt: state => state,
    solve(state, _context, fact, asked) {
      const next = asked ? recordSolved(state.learning, asked, fact) : { state: state.learning, changes: [] };
      return { state: { ...state, learning: next.state }, changes: next.changes };
    },
    earnings,
    complete: state => ({ state: { ...state, station: earnCall(state.station) }, facts: {} }),
  });
  return { ...coordinator, start: (resume?: Parameters<typeof coordinator.start>[1]) => coordinator.start(undefined, resume) };
}

export const practice = createPractice(player);
export const buy = createRewardPurchases(player, { proposePurchase }, {
  read: state => state.station,
  replace: (state, station) => ({ ...state, station }),
});
export const updateStation = (change: (s: StationState) => StationState | null) =>
  player.commit(state => { const station = change(state.station); return station ? { ...state, station } : null; });

/** The Call is finished: pay the Town's thank-you, use the Call, add the badge and the building (or the star, or the Level). */
export function settleCall(store: Pick<typeof player, 'commit'>, scene: Pick<SceneDef, 'id' | 'heat'>): CallPay | null {
  let pay: CallPay | null = null;
  store.commit(s => {
    if (s.station.calls <= 0) return null;
    const done = finishCall(s.station, scene);
    pay = done.pay;
    const paid = credit(s.currency, done.pay.bolts);
    return { ...s, station: done.state, currency: paid.kind === 'accepted' ? paid.state : s.currency };
  });
  return pay;
}
