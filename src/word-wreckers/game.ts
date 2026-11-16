// The saved game and how practice changes it. Everything goes through player.commit(), which saves it under its own key, so Word
// Wreckers never touches another game's save on the same site. A Round pays Bolts through the shared currency and earns a Job; the Yard
// spends Bolts through the shared reward purchases.
import { createPracticeCoordinator } from '../app/coordination';
import { createRewardPurchases } from '../app/purchaseCoordination';
import { credit, readCurrency, type CurrencyState, type EarningsPolicy } from '../currency/currency';
import { boltsFor } from '../round/rules';
import { browserStorage, createStore, type SaveAdapter } from '../save/storage';
import { freshLearning, readLearning, recordSolved, startPractice, type Asked, type LearningChange, type LearningState } from './learning';
import type { TreasureId } from './yard/shop';
import { earnJob, finishJob, freshYard, JOB_BOLTS, proposePurchase, readYard, type JobChoice, type YardState } from './yard/yard';

export const SAVE_KEY = 'word-wreckers-save';
/**
 * Saved progress is versioned like the other games: a version this build doesn't know reads as a blank save. Still version 1: the
 * bigger reward ladder only added rows to the shop (no id changed) and three fields to the Yard (his horn, his road features and his
 * treasures), which a save from before them reads without (readYard), so every save keeps all it had.
 */
export const SAVE_VERSION = 1;

export interface WreckersGame {
  learning: LearningState;
  currency: CurrencyState;
  yard: YardState;
}

type Raw = Record<string, unknown>;
const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);

export const wreckersSave: SaveAdapter<WreckersGame> = {
  fresh: () => ({ learning: freshLearning(), currency: { balance: 0 }, yard: freshYard() }),
  decode(raw) {
    const data = isRecord(raw) && raw.version === SAVE_VERSION ? raw : {};
    return { learning: readLearning(data.learning), currency: readCurrency(data.balance), yard: data.yard === undefined ? freshYard() : readYard(data.yard) };
  },
  encode: state => ({ version: SAVE_VERSION, balance: state.currency.balance, learning: state.learning, yard: state.yard }),
};

export const player = createStore({ key: SAVE_KEY, adapter: wreckersSave, backing: browserStorage });

export const earnings: EarningsPolicy = result => boltsFor(result.results.map(r => r.outcome));

export function createPractice(store: Pick<typeof player, 'commit'>) {
  const coordinator = createPracticeCoordinator<WreckersGame, void, void, LearningChange, Record<never, never>, Asked>(store, {
    start: state => ({ state: { ...state, learning: startPractice(state.learning) }, context: undefined, intro: false }),
    acknowledge: state => state,
    interrupt: state => state,
    solve(state, _context, fact, asked) {
      const next = asked ? recordSolved(state.learning, asked, fact) : { state: state.learning, changes: [] };
      return { state: { ...state, learning: next.state }, changes: next.changes };
    },
    earnings,
    complete: state => ({ state: { ...state, yard: earnJob(state.yard) }, facts: {} }),
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

/** The new building is up (or the road paved): the Job is used, the Bolts found in the rubble are paid, the Town has it, and a treasure
 *  he found is on his shelf. False if there was no Job. */
export function settleJob(store: Pick<typeof player, 'commit'>, choice: JobChoice, found: TreasureId | null = null): boolean {
  return store.commit(s => {
    const yard = finishJob(s.yard, choice, found);
    if (!yard) return null;
    const paid = credit(s.currency, JOB_BOLTS);
    return { ...s, yard, currency: paid.kind === 'accepted' ? paid.state : s.currency };
  }).kind === 'accepted';
}
