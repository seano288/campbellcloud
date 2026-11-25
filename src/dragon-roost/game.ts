// The saved game and how practice changes it. Everything goes through player.commit(), which saves it under its own key, so Dragon Roost
// never touches another game's save on the same site. A Round pays Flames through the shared currency, earns a Flight and warms every egg
// in a nest; the Roost spends Flames through the shared reward purchases.
import { createPracticeCoordinator } from '../app/coordination';
import { createRewardPurchases } from '../app/purchaseCoordination';
import { credit, readCurrency, type CurrencyState, type EarningsPolicy } from '../currency/currency';
import { boltsFor } from '../round/rules';
import { browserStorage, createStore, type SaveAdapter } from '../save/storage';
import type { FlightResult } from './flight/sim';
import { freshLearning, readLearning, recordSolved, startPractice, type Asked, type LearningChange, type LearningState } from './learning';
import { earnFlight, finishFlight, freshRoost, payFor, proposePurchase, readRoost, type FlightPay, type FlightPlan, type RoostState } from './roost/roost';

export const SAVE_KEY = 'dragon-roost-save';
/** Saved progress is versioned like the other games: a version this build doesn't know reads as a blank save. */
export const SAVE_VERSION = 1;

export interface RoostGame {
  learning: LearningState;
  currency: CurrencyState;
  roost: RoostState;
}

type Raw = Record<string, unknown>;
const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);

export const roostSave: SaveAdapter<RoostGame> = {
  fresh: () => ({ learning: freshLearning(), currency: { balance: 0 }, roost: freshRoost() }),
  decode(raw) {
    const data = isRecord(raw) && raw.version === SAVE_VERSION ? raw : {};
    return { learning: readLearning(data.learning), currency: readCurrency(data.balance), roost: readRoost(data.roost) };
  },
  encode: state => ({ version: SAVE_VERSION, balance: state.currency.balance, learning: state.learning, roost: state.roost }),
};

export const player = createStore({ key: SAVE_KEY, adapter: roostSave, backing: browserStorage });

/** A Flame for each answer right on the first try, and one for finishing (the shared rule every game pays by). */
export const earnings: EarningsPolicy = result => boltsFor(result.results.map(r => r.outcome));

export function createPractice(store: Pick<typeof player, 'commit'>) {
  const coordinator = createPracticeCoordinator<RoostGame, void, void, LearningChange, Record<never, never>, Asked>(store, {
    start: state => ({ state: { ...state, learning: startPractice(state.learning) }, context: undefined, intro: false }),
    acknowledge: state => state,
    interrupt: state => state,
    solve(state, _context, fact, asked) {
      const next = asked ? recordSolved(state.learning, asked, fact) : { state: state.learning, changes: [] };
      return { state: { ...state, learning: next.state }, changes: next.changes };
    },
    earnings,
    complete: state => ({ state: { ...state, roost: earnFlight(state.roost) }, facts: {} }),
  });
  return { ...coordinator, start: (resume?: Parameters<typeof coordinator.start>[1]) => coordinator.start(undefined, resume) };
}

export const practice = createPractice(player);
export const buy = createRewardPurchases(player, { proposePurchase }, {
  read: state => state.roost,
  replace: (state, roost) => ({ ...state, roost }),
});
export const updateRoost = (change: (r: RoostState) => RoostState | null) =>
  player.commit(state => { const roost = change(state.roost); return roost ? { ...state, roost } : null; });

/** The Flight is over: pay it, use it, grow the dragon, keep the best. Null if he had no Flight to fly. */
export function settleFlight(store: Pick<typeof player, 'commit'>, plan: FlightPlan, res: FlightResult): FlightPay | null {
  let pay: FlightPay | null = null;
  store.commit(s => {
    if (s.roost.flights <= 0) return null;
    const p = payFor(s.roost, plan, res);
    pay = p;
    const paid = credit(s.currency, p.flames);
    return { ...s, roost: finishFlight(s.roost, plan, res), currency: paid.kind === 'accepted' ? paid.state : s.currency };
  });
  return pay;
}
