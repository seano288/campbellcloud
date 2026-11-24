// The saved game and how practice changes it. Everything goes through player.commit(), which saves it under its own key, so Treasure
// Fleet never touches another game's save on the same site. A Round pays Doubloons through the shared currency and earns a Voyage; the
// Shipyard spends Doubloons on ship parts through the shared reward purchases.
import { createPracticeCoordinator } from '../app/coordination';
import { createRewardPurchases } from '../app/purchaseCoordination';
import { credit, readCurrency, type CurrencyState, type EarningsPolicy } from '../currency/currency';
import { boltsFor } from '../round/rules';
import { browserStorage, createStore, type SaveAdapter } from '../save/storage';
import { earnVoyage, finishVoyage, freshFleet, payFor, proposePurchase, readFleet, type FleetState, type VoyagePay } from './fleet/fleet';
import type { IslandId } from './fleet/islands';
import { freshLearning, readLearning, recordSolved, startPractice, type Asked, type LearningChange, type LearningState } from './learning';

export const SAVE_KEY = 'treasure-fleet-save';
/** Saved progress is versioned like the other games: a version this build doesn't know reads as a blank save. */
export const SAVE_VERSION = 1;

export interface FleetGame {
  learning: LearningState;
  currency: CurrencyState;
  fleet: FleetState;
}

type Raw = Record<string, unknown>;
const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);

export const fleetSave: SaveAdapter<FleetGame> = {
  fresh: () => ({ learning: freshLearning(), currency: { balance: 0 }, fleet: freshFleet() }),
  decode(raw) {
    const data = isRecord(raw) && raw.version === SAVE_VERSION ? raw : {};
    return { learning: readLearning(data.learning), currency: readCurrency(data.balance), fleet: readFleet(data.fleet) };
  },
  encode: state => ({ version: SAVE_VERSION, balance: state.currency.balance, learning: state.learning, fleet: state.fleet }),
};

export const player = createStore({ key: SAVE_KEY, adapter: fleetSave, backing: browserStorage });

export const earnings: EarningsPolicy = result => boltsFor(result.results.map(r => r.outcome));

export function createPractice(store: Pick<typeof player, 'commit'>) {
  const coordinator = createPracticeCoordinator<FleetGame, void, void, LearningChange, Record<never, never>, Asked>(store, {
    start: state => ({ state: { ...state, learning: startPractice(state.learning) }, context: undefined, intro: false }),
    acknowledge: state => state,
    interrupt: state => state,
    solve(state, _context, fact, asked) {
      const next = asked ? recordSolved(state.learning, asked, fact) : { state: state.learning, changes: [] };
      return { state: { ...state, learning: next.state }, changes: next.changes };
    },
    earnings,
    complete: state => ({ state: { ...state, fleet: earnVoyage(state.fleet) }, facts: {} }),
  });
  return { ...coordinator, start: (resume?: Parameters<typeof coordinator.start>[1]) => coordinator.start(undefined, resume) };
}

export const practice = createPractice(player);
export const buy = createRewardPurchases(player, { proposePurchase }, {
  read: state => state.fleet,
  replace: (state, fleet) => ({ ...state, fleet }),
});
export const updateFleet = (change: (f: FleetState) => FleetState | null) =>
  player.commit(state => { const fleet = change(state.fleet); return fleet ? { ...state, fleet } : null; });

/** The chest opened: pay the barrels and the gold, use the Voyage, count the visit, put the treasure in the Hoard. */
export function settleVoyage(store: Pick<typeof player, 'commit'>, id: IslandId, barrels: number): VoyagePay | null {
  let pay: VoyagePay | null = null;
  store.commit(s => {
    if (s.fleet.voyages <= 0) return null;
    pay = payFor(s.fleet, id, barrels);
    const paid = credit(s.currency, pay.doubloons);
    return { ...s, fleet: finishVoyage(s.fleet, id, pay), currency: paid.kind === 'accepted' ? paid.state : s.currency };
  });
  return pay;
}
