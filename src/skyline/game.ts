// The saved game and how practice changes it. Everything goes through player.commit(), which saves it under its own key, so Skyline
// never touches another game's save on the same site. A Round pays Bricks through the shared currency and earns a Job; the City
// spends Bricks through the shared reward purchases.
import { createPracticeCoordinator } from '../app/coordination';
import { createRewardPurchases } from '../app/purchaseCoordination';
import { credit, readCurrency, type CurrencyState, type EarningsPolicy } from '../currency/currency';
import { boltsFor } from '../round/rules';
import { browserStorage, createStore, type SaveAdapter } from '../save/storage';
import { awardTrophies, earnJob, finishJob, freshCity, proposePurchase, readCity, type CityState, type JobPay, type JobRef } from './city/city';
import { freshLearning, readLearning, recordSolved, startPractice, type Asked, type LearningChange, type LearningState } from './learning';

export const SAVE_KEY = 'skyline-save';
/** Saved progress is versioned like the other games: a version this build doesn't know reads as a blank save. */
export const SAVE_VERSION = 1;

export interface SkylineState {
  learning: LearningState;
  currency: CurrencyState;
  city: CityState;
}

type Raw = Record<string, unknown>;
const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);

export const skylineSave: SaveAdapter<SkylineState> = {
  fresh: () => ({ learning: freshLearning(), currency: { balance: 0 }, city: freshCity() }),
  decode(raw) {
    const data = isRecord(raw) && raw.version === SAVE_VERSION ? raw : {};
    return { learning: readLearning(data.learning), currency: readCurrency(data.balance), city: readCity(data.city) };
  },
  encode: state => ({ version: SAVE_VERSION, balance: state.currency.balance, learning: state.learning, city: state.city }),
};

export const player = createStore({ key: SAVE_KEY, adapter: skylineSave, backing: browserStorage });

export const earnings: EarningsPolicy = result => boltsFor(result.results.map(r => r.outcome));

export function createPractice(store: Pick<typeof player, 'commit'>) {
  const coordinator = createPracticeCoordinator<SkylineState, void, void, LearningChange, Record<never, never>, Asked>(store, {
    start: state => ({ state: { ...state, learning: startPractice(state.learning) }, context: undefined, intro: false }),
    acknowledge: state => state,
    interrupt: state => state,
    solve(state, _context, fact, asked) {
      const next = asked ? recordSolved(state.learning, asked, fact) : { state: state.learning, changes: [] };
      return { state: { ...state, learning: next.state }, changes: next.changes };
    },
    earnings,
    complete: state => ({ state: { ...state, city: earnJob(state.city) }, facts: {} }),
  });
  return { ...coordinator, start: (resume?: Parameters<typeof coordinator.start>[1]) => coordinator.start(undefined, resume) };
}

export const practice = createPractice(player);
const purchase = createRewardPurchases(player, { proposePurchase }, {
  read: state => state.city,
  replace: (state, city) => ({ ...state, city }),
});
/** Buys, then hands out any trophy the purchase earned (a bigger population, a taller tower). */
export function buy(request: Parameters<typeof purchase>[0]) {
  const before = player.state.peek().city.trophies.length, done = purchase(request);
  if (done.kind === 'accepted') updateCity(c => { const a = awardTrophies(c); return a.won.length ? a.state : null; });
  return { ...done, trophies: player.state.peek().city.trophies.slice(before) };
}
export const updateCity = (change: (c: CityState) => CityState | null) =>
  player.commit(state => { const city = change(state.city); return city ? { ...state, city } : null; });

/** The Job ended: pay it, use it, count it, open a District if he's done enough. Null if he had no Job to use. */
export function settleJob(store: Pick<typeof player, 'commit'>, job: JobRef, most: number): JobPay | null {
  let pay: JobPay | null = null;
  store.commit(s => {
    if (s.city.jobs <= 0) return null;
    const done = finishJob(s.city, job, most);
    pay = done.pay;
    const paid = credit(s.currency, done.pay.bricks);
    return { ...s, city: done.state, currency: paid.kind === 'accepted' ? paid.state : s.currency };
  });
  return pay;
}
