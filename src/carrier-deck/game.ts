// The saved game and how practice changes it. Everything goes through player.commit(), which saves it under its own key, so Carrier Deck
// never touches another game's save on the same site. A Round pays Bolts through the shared currency and earns a Mission; the Carrier
// spends Bolts through the shared reward purchases.
import { createPracticeCoordinator } from '../app/coordination';
import { createRewardPurchases } from '../app/purchaseCoordination';
import { credit, readCurrency, type CurrencyState, type EarningsPolicy } from '../currency/currency';
import { boltsFor } from '../round/rules';
import { browserStorage, createStore, type SaveAdapter } from '../save/storage';
import { earnMission, finishMission, freshShip, payFor, proposePurchase, readShip, type MissionPay, type MissionPlan, type MissionResult, type ShipState } from './ship/ship';
import { freshLearning, readLearning, recordSolved, startPractice, type Asked, type LearningChange, type LearningState } from './learning';

export const SAVE_KEY = 'carrier-deck-save';
/** Saved progress is versioned like the other games: a version this build doesn't know reads as a blank save. */
export const SAVE_VERSION = 1;

export interface DeckState {
  learning: LearningState;
  currency: CurrencyState;
  ship: ShipState;
}

type Raw = Record<string, unknown>;
const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);

export const deckSave: SaveAdapter<DeckState> = {
  fresh: () => ({ learning: freshLearning(), currency: { balance: 0 }, ship: freshShip() }),
  decode(raw) {
    const data = isRecord(raw) && raw.version === SAVE_VERSION ? raw : {};
    return { learning: readLearning(data.learning), currency: readCurrency(data.balance), ship: readShip(data.ship) };
  },
  encode: state => ({ version: SAVE_VERSION, balance: state.currency.balance, learning: state.learning, ship: state.ship }),
};

export const player = createStore({ key: SAVE_KEY, adapter: deckSave, backing: browserStorage });

export const earnings: EarningsPolicy = result => boltsFor(result.results.map(r => r.outcome));

export function createPractice(store: Pick<typeof player, 'commit'>) {
  const coordinator = createPracticeCoordinator<DeckState, void, void, LearningChange, Record<never, never>, Asked>(store, {
    start: state => ({ state: { ...state, learning: startPractice(state.learning) }, context: undefined, intro: false }),
    acknowledge: state => state,
    interrupt: state => state,
    solve(state, _context, fact, asked) {
      const next = asked ? recordSolved(state.learning, asked, fact) : { state: state.learning, changes: [] };
      return { state: { ...state, learning: next.state }, changes: next.changes };
    },
    earnings,
    complete: state => ({ state: { ...state, ship: earnMission(state.ship) }, facts: {} }),
  });
  return { ...coordinator, start: (resume?: Parameters<typeof coordinator.start>[1]) => coordinator.start(undefined, resume) };
}

export const practice = createPractice(player);
export const buy = createRewardPurchases(player, { proposePurchase }, {
  read: state => state.ship,
  replace: (state, ship) => ({ ...state, ship }),
});
export const updateShip = (change: (a: ShipState) => ShipState | null) =>
  player.commit(state => { const ship = change(state.ship); return ship ? { ...state, ship } : null; });

/** The Mission ended on the deck: pay it, use it, keep the record, give the prize. Null if he had no Mission to use. */
export function settleMission(store: Pick<typeof player, 'commit'>, plan: MissionPlan, res: MissionResult): MissionPay | null {
  let pay: MissionPay | null = null;
  store.commit(s => {
    if (s.ship.missions <= 0) return null;
    const p = payFor(s.ship, plan, res);
    pay = p;
    const paid = credit(s.currency, p.bolts);
    return { ...s, ship: finishMission(s.ship, plan, res, p), currency: paid.kind === 'accepted' ? paid.state : s.currency };
  });
  return pay;
}
