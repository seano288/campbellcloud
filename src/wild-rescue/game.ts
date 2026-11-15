// The saved game and how practice changes it. Everything goes through player.commit(), which saves it under its own key, so Wild
// Rescue never touches another game's save on the same site. A Round pays Bolts through the shared currency and earns a Rescue call;
// the Garage and the Park spend Bolts through the shared reward purchases.
import { createPracticeCoordinator } from '../app/coordination';
import { createRewardPurchases } from '../app/purchaseCoordination';
import { credit, readCurrency, type CurrencyState, type EarningsPolicy } from '../currency/currency';
import { boltsFor } from '../round/rules';
import { browserStorage, createStore, type SaveAdapter } from '../save/storage';
import type { HabitatId } from './facts/habitats';
import { freshLearning, readLearning, recordSolved, startPractice, type Asked, type LearningChange, type LearningState } from './learning';
import { earnCall, finishRescue, freshRescue, payFor, placeAnimal, proposePurchase, readRescue, type Call, type RescuePay, type RescueState } from './park/rescue';

export const SAVE_KEY = 'wild-rescue-save';
/** Saved progress is versioned like the other games: a version this build doesn't know reads as a blank save. */
export const SAVE_VERSION = 1;

export interface RescueGame {
  learning: LearningState;
  currency: CurrencyState;
  rescue: RescueState;
}

type Raw = Record<string, unknown>;
const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);

export const rescueSave: SaveAdapter<RescueGame> = {
  fresh: () => ({ learning: freshLearning(), currency: { balance: 0 }, rescue: freshRescue() }),
  decode(raw) {
    const data = isRecord(raw) && raw.version === SAVE_VERSION ? raw : {};
    return { learning: readLearning(data.learning), currency: readCurrency(data.balance), rescue: readRescue(data.rescue) };
  },
  encode: state => ({ version: SAVE_VERSION, balance: state.currency.balance, learning: state.learning, rescue: state.rescue }),
};

export const player = createStore({ key: SAVE_KEY, adapter: rescueSave, backing: browserStorage });

export const earnings: EarningsPolicy = result => boltsFor(result.results.map(r => r.outcome));

export function createPractice(store: Pick<typeof player, 'commit'>) {
  const coordinator = createPracticeCoordinator<RescueGame, void, void, LearningChange, Record<never, never>, Asked>(store, {
    start: state => ({ state: { ...state, learning: startPractice(state.learning) }, context: undefined, intro: false }),
    acknowledge: state => state,
    interrupt: state => state,
    solve(state, _context, fact, asked) {
      const next = asked ? recordSolved(state.learning, asked, fact) : { state: state.learning, changes: [] };
      return { state: { ...state, learning: next.state }, changes: next.changes };
    },
    earnings,
    complete: state => ({ state: { ...state, rescue: earnCall(state.rescue) }, facts: {} }),
  });
  return { ...coordinator, start: (resume?: Parameters<typeof coordinator.start>[1]) => coordinator.start(undefined, resume) };
}

export const practice = createPractice(player);
export const buy = createRewardPurchases(player, { proposePurchase }, {
  read: state => state.rescue,
  replace: (state, rescue) => ({ ...state, rescue }),
});
export const updateRescue = (change: (r: RescueState) => RescueState | null) =>
  player.commit(state => { const rescue = change(state.rescue); return rescue ? { ...state, rescue } : null; });

/** The animal is in the crate: pay the Bolts picked up on the drive, use the call, and it rides home in his hands. */
export function settleRescue(store: Pick<typeof player, 'commit'>, call: Call, bolts: number): RescuePay | null {
  let pay: RescuePay | null = null;
  store.commit(s => {
    if (s.rescue.calls <= 0) return null;
    pay = payFor(call, bolts);
    const paid = credit(s.currency, pay.bolts);
    return { ...s, rescue: finishRescue(s.rescue, pay), currency: paid.kind === 'accepted' ? paid.state : s.currency };
  });
  return pay;
}

/** He set the animal he's holding down in a habitat. True if it was its home and it's in. */
export const setDown = (store: Pick<typeof player, 'commit'>, h: HabitatId) => store.commit(s => { const r = placeAnimal(s.rescue, h); return r ? { ...s, rescue: r } : null; }).kind === 'accepted';
