// The saved game and how practice changes it. Everything goes through player.commit(), which saves it under its own key, so Dino Dig
// never touches another game's save on the same site. A Round pays Gems through the shared currency and earns a Dig; the shop spends
// Gems through the shared reward purchases.
import { createPracticeCoordinator } from '../app/coordination';
import { createRewardPurchases } from '../app/purchaseCoordination';
import { credit, readCurrency, type CurrencyState, type EarningsPolicy } from '../currency/currency';
import { boltsFor } from '../round/rules';
import { browserStorage, createStore, type SaveAdapter } from '../save/storage';
import { freshLearning, readLearning, recordSolved, startPractice, type Asked, type LearningChange, type LearningState } from './learning';
import type { DinoId } from './museum/dinos';
import { DIG_GEMS, earnDig, finishDig, freshMuseum, proposePurchase, readMuseum, wake, type Dig, type MuseumState } from './museum/state';

export const SAVE_KEY = 'dino-dig-save';
/** Saved progress is versioned like the other games: a version this build doesn't know reads as a blank save. */
export const SAVE_VERSION = 1;

export interface DinoGame {
  learning: LearningState;
  currency: CurrencyState;
  museum: MuseumState;
}

type Raw = Record<string, unknown>;
const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);

export const dinoSave: SaveAdapter<DinoGame> = {
  fresh: () => ({ learning: freshLearning(), currency: { balance: 0 }, museum: freshMuseum() }),
  decode(raw) {
    const data = isRecord(raw) && raw.version === SAVE_VERSION ? raw : {};
    return { learning: readLearning(data.learning), currency: readCurrency(data.balance), museum: data.museum === undefined ? freshMuseum() : readMuseum(data.museum) };
  },
  encode: state => ({ version: SAVE_VERSION, balance: state.currency.balance, learning: state.learning, museum: state.museum }),
};

export const player = createStore({ key: SAVE_KEY, adapter: dinoSave, backing: browserStorage });

export const earnings: EarningsPolicy = result => boltsFor(result.results.map(r => r.outcome));

export function createPractice(store: Pick<typeof player, 'commit'>) {
  const coordinator = createPracticeCoordinator<DinoGame, void, void, LearningChange, Record<never, never>, Asked>(store, {
    start: state => ({ state: { ...state, learning: startPractice(state.learning) }, context: undefined, intro: false }),
    acknowledge: state => state,
    interrupt: state => state,
    solve(state, _context, fact, asked) {
      const next = asked ? recordSolved(state.learning, asked, fact) : { state: state.learning, changes: [] };
      return { state: { ...state, learning: next.state }, changes: next.changes };
    },
    earnings,
    complete: state => ({ state: { ...state, museum: earnDig(state.museum) }, facts: {} }),
  });
  return { ...coordinator, start: (resume?: Parameters<typeof coordinator.start>[1]) => coordinator.start(undefined, resume) };
}

export const practice = createPractice(player);
export const buy = createRewardPurchases(player, { proposePurchase }, {
  read: state => state.museum,
  replace: (state, museum) => ({ ...state, museum }),
});
export const updateMuseum = (change: (m: MuseumState) => MuseumState | null) =>
  player.commit(state => { const museum = change(state.museum); return museum ? { ...state, museum } : null; });

/** Every bone is in the crate: the Dig is used, the Gems found in the dirt are paid, the bones go on the skeleton and the fossil on
 *  the shelf. False if there was no Dig. */
export function settleDig(store: Pick<typeof player, 'commit'>, dig: Dig): boolean {
  return store.commit(s => {
    const museum = finishDig(s.museum, dig);
    if (!museum) return null;
    const paid = credit(s.currency, DIG_GEMS);
    return { ...s, museum, currency: paid.kind === 'accepted' ? paid.state : s.currency };
  }).kind === 'accepted';
}

/** A whole skeleton comes alive. */
export const wakeDino = (store: Pick<typeof player, 'commit'>, d: DinoId) => store.commit(s => { const museum = wake(s.museum, d); return museum ? { ...s, museum } : null; }).kind === 'accepted';
