// The saved game and how practice changes it. Everything goes through player.commit(), which saves it under its own key, so Sky Writer
// never touches another game's save on the same site. A Round pays Bolts through the shared currency and earns a Show; the Airfield
// spends Bolts through the shared reward purchases.
import { createPracticeCoordinator } from '../app/coordination';
import { createRewardPurchases } from '../app/purchaseCoordination';
import { credit, readCurrency, type CurrencyState, type EarningsPolicy } from '../currency/currency';
import { boltsFor } from '../round/rules';
import { browserStorage, createStore, type SaveAdapter } from '../save/storage';
import { earnShow, finishShow, freshAirfield, keepPostcard, proposePurchase, readAirfield, SHOW_BOLTS, takeDown, type AirfieldState, type Postcard } from './airfield/state';
import { freshLearning, readLearning, recordSolved, startPractice, type Asked, type LearningChange, type LearningState } from './learning';
import type { ShowId } from './show/places';

export const SAVE_KEY = 'sky-writer-save';
/** Saved progress is versioned like the other games: a version this build doesn't know reads as a blank save. */
export const SAVE_VERSION = 1;

export interface SkyGame {
  learning: LearningState;
  currency: CurrencyState;
  airfield: AirfieldState;
}

type Raw = Record<string, unknown>;
const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);

export const skySave: SaveAdapter<SkyGame> = {
  fresh: () => ({ learning: freshLearning(), currency: { balance: 0 }, airfield: freshAirfield() }),
  decode(raw) {
    const data = isRecord(raw) && raw.version === SAVE_VERSION ? raw : {};
    return { learning: readLearning(data.learning), currency: readCurrency(data.balance), airfield: data.airfield === undefined ? freshAirfield() : readAirfield(data.airfield) };
  },
  encode: state => ({ version: SAVE_VERSION, balance: state.currency.balance, learning: state.learning, airfield: state.airfield }),
};

export const player = createStore({ key: SAVE_KEY, adapter: skySave, backing: browserStorage });

export const earnings: EarningsPolicy = result => boltsFor(result.results.map(r => r.outcome));

export function createPractice(store: Pick<typeof player, 'commit'>) {
  const coordinator = createPracticeCoordinator<SkyGame, void, void, LearningChange, Record<never, never>, Asked>(store, {
    start: state => ({ state: { ...state, learning: startPractice(state.learning) }, context: undefined, intro: false }),
    acknowledge: state => state,
    interrupt: state => state,
    solve(state, _context, fact, asked) {
      const next = asked ? recordSolved(state.learning, asked, fact) : { state: state.learning, changes: [] };
      return { state: { ...state, learning: next.state }, changes: next.changes };
    },
    earnings,
    complete: state => ({ state: { ...state, airfield: earnShow(state.airfield) }, facts: {} }),
  });
  return { ...coordinator, start: (resume?: Parameters<typeof coordinator.start>[1]) => coordinator.start(undefined, resume) };
}

export const practice = createPractice(player);
export const buy = createRewardPurchases(player, { proposePurchase }, {
  read: state => state.airfield,
  replace: (state, airfield) => ({ ...state, airfield }),
});
export const updateAirfield = (change: (a: AirfieldState) => AirfieldState | null) =>
  player.commit(state => { const airfield = change(state.airfield); return airfield ? { ...state, airfield } : null; });

/** A Show's rings are done: the Show is used and paid, a new place gets its patch and opens the next. Null if there was no Show. */
export function settleShow(store: Pick<typeof player, 'commit'>, at: ShowId): { patch: boolean; opens: ShowId | null } | null {
  let out: { patch: boolean; opens: ShowId | null } | null = null;
  const c = store.commit(s => {
    const done = finishShow(s.airfield, at);
    if (!done) return null;
    out = { patch: done.patch, opens: done.opens };
    const paid = credit(s.currency, SHOW_BOLTS);
    return { ...s, airfield: done.state, currency: paid.kind === 'accepted' ? paid.state : s.currency };
  });
  return c.kind === 'accepted' ? out : null;
}

/** Keeps a Free Sky drawing on his Wall. False when the Wall is full. */
export const keepCard = (store: Pick<typeof player, 'commit'>, card: Postcard) =>
  store.commit(s => { const airfield = keepPostcard(s.airfield, card); return airfield ? { ...s, airfield } : null; }).kind === 'accepted';
/** The Wall is full: take postcard `i` down and put this one up, in one go (nothing is taken down unless the new one goes up). */
export const swapCard = (store: Pick<typeof player, 'commit'>, i: number, card: Postcard) =>
  store.commit(s => { const down = takeDown(s.airfield, i), airfield = down && keepPostcard(down, card); return airfield ? { ...s, airfield } : null; }).kind === 'accepted';
