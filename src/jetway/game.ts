// The saved game and how practice changes it. Everything goes through player.commit(), which saves it under its own key, so Jetway never
// touches another game's save on the same site. A Round pays Bolts through the shared currency and earns a Flight; the Airport spends
// Bolts through the shared reward purchases.
import { createPracticeCoordinator } from '../app/coordination';
import { createRewardPurchases } from '../app/purchaseCoordination';
import { credit, readCurrency, type CurrencyState, type EarningsPolicy } from '../currency/currency';
import { boltsFor } from '../round/rules';
import { browserStorage, createStore, type SaveAdapter } from '../save/storage';
import { earnFlight, freshAirport, payFor, proposePurchase, readAirport, finishFlight, type AirportState, type FlightPay, type FlightPlan, type FlightResult } from './airport/airport';
import { freshLearning, readLearning, recordSolved, startPractice, type Asked, type LearningChange, type LearningState } from './learning';

export const SAVE_KEY = 'jetway-save';
/** Saved progress is versioned like the other games: a version this build doesn't know reads as a blank save. */
export const SAVE_VERSION = 1;

export interface JetState {
  learning: LearningState;
  currency: CurrencyState;
  airport: AirportState;
}

type Raw = Record<string, unknown>;
const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);

export const jetSave: SaveAdapter<JetState> = {
  fresh: () => ({ learning: freshLearning(), currency: { balance: 0 }, airport: freshAirport() }),
  decode(raw) {
    const data = isRecord(raw) && raw.version === SAVE_VERSION ? raw : {};
    return { learning: readLearning(data.learning), currency: readCurrency(data.balance), airport: readAirport(data.airport) };
  },
  encode: state => ({ version: SAVE_VERSION, balance: state.currency.balance, learning: state.learning, airport: state.airport }),
};

export const player = createStore({ key: SAVE_KEY, adapter: jetSave, backing: browserStorage });

export const earnings: EarningsPolicy = result => boltsFor(result.results.map(r => r.outcome));

export function createPractice(store: Pick<typeof player, 'commit'>) {
  const coordinator = createPracticeCoordinator<JetState, void, void, LearningChange, Record<never, never>, Asked>(store, {
    start: state => ({ state: { ...state, learning: startPractice(state.learning) }, context: undefined, intro: false }),
    acknowledge: state => state,
    interrupt: state => state,
    solve(state, _context, fact, asked) {
      const next = asked ? recordSolved(state.learning, asked, fact) : { state: state.learning, changes: [] };
      return { state: { ...state, learning: next.state }, changes: next.changes };
    },
    earnings,
    complete: state => ({ state: { ...state, airport: earnFlight(state.airport) }, facts: {} }),
  });
  return { ...coordinator, start: (resume?: Parameters<typeof coordinator.start>[1]) => coordinator.start(undefined, resume) };
}

export const practice = createPractice(player);
export const buy = createRewardPurchases(player, { proposePurchase }, {
  read: state => state.airport,
  replace: (state, airport) => ({ ...state, airport }),
});
export const updateAirport = (change: (a: AirportState) => AirportState | null) =>
  player.commit(state => { const airport = change(state.airport); return airport ? { ...state, airport } : null; });

/** The Flight ended at the far runway: pay it, use it, keep the record, give the prize. Null if he had no Flight to use. */
export function settleFlight(store: Pick<typeof player, 'commit'>, plan: FlightPlan, res: FlightResult): FlightPay | null {
  let pay: FlightPay | null = null;
  store.commit(s => {
    if (s.airport.flights <= 0) return null;
    const p = payFor(s.airport, plan, res);
    pay = p;
    const paid = credit(s.currency, p.bolts);
    return { ...s, airport: finishFlight(s.airport, plan, res, p), currency: paid.kind === 'accepted' ? paid.state : s.currency };
  });
  return pay;
}
