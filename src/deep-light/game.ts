// The saved game and how practice changes it. Everything goes through player.commit(), which saves it under its own key, so Deep
// Light never touches another game's save on the same site. A Round pays Pearls through the shared currency and earns a Dive; the
// Dock spends Pearls through the shared reward purchases.
import { createPracticeCoordinator } from '../app/coordination';
import { createRewardPurchases } from '../app/purchaseCoordination';
import { credit, readCurrency, type CurrencyState, type EarningsPolicy } from '../currency/currency';
import { boltsFor } from '../round/rules';
import { browserStorage, createStore, type SaveAdapter } from '../save/storage';
import { earnDive, finishDive, freshDock, proposePurchase, readDock, type DivePay, type DockState } from './dock/dock';
import { freshLearning, readLearning, recordSolved, startPractice, type Asked, type LearningChange, type LearningState } from './learning';
import type { AnimalId } from './sea/animals';

export const SAVE_KEY = 'deep-light-save';
/** Saved progress is versioned like the other games: a version this build doesn't know reads as a blank save. */
export const SAVE_VERSION = 1;

export interface DeepGame {
  learning: LearningState;
  currency: CurrencyState;
  dock: DockState;
}

type Raw = Record<string, unknown>;
const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);

export const deepSave: SaveAdapter<DeepGame> = {
  fresh: () => ({ learning: freshLearning(), currency: { balance: 0 }, dock: freshDock() }),
  decode(raw) {
    const data = isRecord(raw) && raw.version === SAVE_VERSION ? raw : {};
    return { learning: readLearning(data.learning), currency: readCurrency(data.balance), dock: readDock(data.dock) };
  },
  encode: state => ({ version: SAVE_VERSION, balance: state.currency.balance, learning: state.learning, dock: state.dock }),
};

export const player = createStore({ key: SAVE_KEY, adapter: deepSave, backing: browserStorage });

export const earnings: EarningsPolicy = result => boltsFor(result.results.map(r => r.outcome));

export function createPractice(store: Pick<typeof player, 'commit'>) {
  const coordinator = createPracticeCoordinator<DeepGame, void, void, LearningChange, Record<never, never>, Asked>(store, {
    start: state => ({ state: { ...state, learning: startPractice(state.learning) }, context: undefined, intro: false }),
    acknowledge: state => state,
    interrupt: state => state,
    solve(state, _context, fact, asked) {
      const next = asked ? recordSolved(state.learning, asked, fact) : { state: state.learning, changes: [] };
      return { state: { ...state, learning: next.state }, changes: next.changes };
    },
    earnings,
    complete: state => ({ state: { ...state, dock: earnDive(state.dock) }, facts: {} }),
  });
  return { ...coordinator, start: (resume?: Parameters<typeof coordinator.start>[1]) => coordinator.start(undefined, resume) };
}

export const practice = createPractice(player);
export const buy = createRewardPurchases(player, { proposePurchase }, {
  read: state => state.dock,
  replace: (state, dock) => ({ ...state, dock }),
});
export const updateDock = (change: (s: DockState) => DockState | null) =>
  player.commit(state => { const dock = change(state.dock); return dock ? { ...state, dock } : null; });

/** The Dive is over: pay its treasure, use the Dive, and put every new animal in the Logbook. */
export function settleDive(store: Pick<typeof player, 'commit'>, photographed: readonly AnimalId[], treasure: number): DivePay | null {
  let pay: DivePay | null = null;
  store.commit(s => {
    if (s.dock.dives <= 0) return null;
    const done = finishDive(s.dock, photographed, treasure);
    pay = done.pay;
    const paid = credit(s.currency, done.pay.pearls);
    return { ...s, dock: done.state, currency: paid.kind === 'accepted' ? paid.state : s.currency };
  });
  return pay;
}
