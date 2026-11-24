// The saved game and how practice changes it. Everything goes through player.commit(), which saves it under its own key, so Cargo Words
// never touches another game's save on the same site. A Round pays Bolts through the shared currency and earns a Ship to load; the Port
// spends Bolts through the shared reward purchases.
import { createPracticeCoordinator } from '../app/coordination';
import { createRewardPurchases } from '../app/purchaseCoordination';
import { credit, readCurrency, type CurrencyState, type EarningsPolicy } from '../currency/currency';
import { boltsFor } from '../round/rules';
import { browserStorage, createStore, type SaveAdapter } from '../save/storage';
import { earnShip, finishGo, freshPort, payFor, proposePurchase, readPort, type GoPay, type GoPlan, type GoResult, type PortState } from './port/port';
import { freshLearning, readLearning, recordSolved, startPractice, type Asked, type LearningChange, type LearningState } from './learning';
import { isTableWord } from './words/words';

export const SAVE_KEY = 'cargo-words-save';
/** Saved progress is versioned like the other games: a version this build doesn't know reads as a blank save. */
export const SAVE_VERSION = 1;
/** The words of his last Rounds, newest last: their syllables are the containers on the quay. */
export const WORDS_KEPT = 12;

export interface CargoState {
  learning: LearningState;
  currency: CurrencyState;
  port: PortState;
  words: string[];
}

type Raw = Record<string, unknown>;
const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);

export const cargoSave: SaveAdapter<CargoState> = {
  fresh: () => ({ learning: freshLearning(), currency: { balance: 0 }, port: freshPort(), words: [] }),
  decode(raw) {
    const data = isRecord(raw) && raw.version === SAVE_VERSION ? raw : {};
    return {
      learning: readLearning(data.learning), currency: readCurrency(data.balance), port: readPort(data.port),
      words: Array.isArray(data.words) ? data.words.filter(isTableWord).slice(-WORDS_KEPT) : [],
    };
  },
  encode: state => ({ version: SAVE_VERSION, balance: state.currency.balance, learning: state.learning, port: state.port, words: state.words }),
};

export const player = createStore({ key: SAVE_KEY, adapter: cargoSave, backing: browserStorage });

export const earnings: EarningsPolicy = result => boltsFor(result.results.map(r => r.outcome));

export function createPractice(store: Pick<typeof player, 'commit'>) {
  const coordinator = createPracticeCoordinator<CargoState, void, void, LearningChange, Record<never, never>, Asked>(store, {
    start: state => ({ state: { ...state, learning: startPractice(state.learning) }, context: undefined, intro: false }),
    acknowledge: state => state,
    interrupt: state => state,
    solve(state, _context, fact, asked) {
      const next = asked ? recordSolved(state.learning, asked, fact) : { state: state.learning, changes: [] };
      return { state: { ...state, learning: next.state }, changes: next.changes };
    },
    earnings,
    complete: state => ({ state: { ...state, port: earnShip(state.port) }, facts: {} }),
  });
  return { ...coordinator, start: (resume?: Parameters<typeof coordinator.start>[1]) => coordinator.start(undefined, resume) };
}

export const practice = createPractice(player);
export const buy = createRewardPurchases(player, { proposePurchase }, {
  read: state => state.port,
  replace: (state, port) => ({ ...state, port }),
});
export const updatePort = (change: (p: PortState) => PortState | null) =>
  player.commit(state => { const port = change(state.port); return port ? { ...state, port } : null; });
/** A word he answered in a Round: its syllables go on the next ship. */
export const noteWord = (w: string) => {
  if (!isTableWord(w)) return;
  player.commit(state => ({ ...state, words: [...state.words.filter(x => x !== w), w].slice(-WORDS_KEPT) }));
};

/** The ship sailed: pay it, use it, keep the bests, give what came back. Null if he had no Ship to load. */
export function settleGo(store: Pick<typeof player, 'commit'>, plan: GoPlan, res: GoResult): GoPay | null {
  let pay: GoPay | null = null;
  store.commit(s => {
    if (s.port.ships <= 0) return null;
    const p = payFor(s.port, plan, res);
    pay = p;
    const paid = credit(s.currency, p.bolts);
    return { ...s, port: finishGo(s.port, plan, res, p), currency: paid.kind === 'accepted' ? paid.state : s.currency };
  });
  return pay;
}
