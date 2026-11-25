// The saved game and how practice changes it. Everything goes through player.commit(), which saves it under its own key, so Big Air
// never touches another game's save on the same site. A Round pays Bolts through the shared currency and earns a Jump; the Arena
// spends Bolts through the shared reward purchases.
import { createPracticeCoordinator } from '../app/coordination';
import { createRewardPurchases } from '../app/purchaseCoordination';
import { credit, readCurrency, type CurrencyState, type EarningsPolicy } from '../currency/currency';
import { boltsFor } from '../round/rules';
import { browserStorage, createStore, type SaveAdapter } from '../save/storage';
import { earnJump, finishJump, freshArena, payFor, proposePurchase, readArena, type ArenaState, type Course, type JumpPay, type JumpResult } from './arena/arena';
import { freshLearning, readLearning, recordSolved, startPractice, type Asked, type LearningChange, type LearningState } from './learning';

export const SAVE_KEY = 'big-air-save';
/** Saved progress is versioned like the other games: a version this build doesn't know reads as a blank save. */
export const SAVE_VERSION = 1;

export interface AirState {
  learning: LearningState;
  currency: CurrencyState;
  arena: ArenaState;
}

type Raw = Record<string, unknown>;
const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);

export const airSave: SaveAdapter<AirState> = {
  fresh: () => ({ learning: freshLearning(), currency: { balance: 0 }, arena: freshArena() }),
  decode(raw) {
    const data = isRecord(raw) && raw.version === SAVE_VERSION ? raw : {};
    return { learning: readLearning(data.learning), currency: readCurrency(data.balance), arena: readArena(data.arena) };
  },
  encode: state => ({ version: SAVE_VERSION, balance: state.currency.balance, learning: state.learning, arena: state.arena }),
};

export const player = createStore({ key: SAVE_KEY, adapter: airSave, backing: browserStorage });

export const earnings: EarningsPolicy = result => boltsFor(result.results.map(r => r.outcome));

export function createPractice(store: Pick<typeof player, 'commit'>) {
  const coordinator = createPracticeCoordinator<AirState, void, void, LearningChange, Record<never, never>, Asked>(store, {
    start: state => ({ state: { ...state, learning: startPractice(state.learning) }, context: undefined, intro: false }),
    acknowledge: state => state,
    interrupt: state => state,
    solve(state, _context, fact, asked) {
      const next = asked ? recordSolved(state.learning, asked, fact) : { state: state.learning, changes: [] };
      return { state: { ...state, learning: next.state }, changes: next.changes };
    },
    earnings,
    complete: state => ({ state: { ...state, arena: earnJump(state.arena) }, facts: {} }),
  });
  return { ...coordinator, start: (resume?: Parameters<typeof coordinator.start>[1]) => coordinator.start(undefined, resume) };
}

export const practice = createPractice(player);
export const buy = createRewardPurchases(player, { proposePurchase }, {
  read: state => state.arena,
  replace: (state, arena) => ({ ...state, arena }),
});
export const updateArena = (change: (a: ArenaState) => ArenaState | null) =>
  player.commit(state => { const arena = change(state.arena); return arena ? { ...state, arena } : null; });

/** The Jump is over: pay it, use it, fill in the Record Board. Null if he had no Jump to take. */
export function settleJump(store: Pick<typeof player, 'commit'>, plan: { course: Course; setup: JumpResult['setup'] }, res: JumpResult): JumpPay | null {
  let pay: JumpPay | null = null;
  store.commit(s => {
    if (s.arena.jumps <= 0) return null;
    const p = payFor(s.arena, plan, res);
    pay = p;
    const paid = credit(s.currency, p.bolts);
    return { ...s, arena: finishJump(s.arena, plan, res), currency: paid.kind === 'accepted' ? paid.state : s.currency };
  });
  return pay;
}
