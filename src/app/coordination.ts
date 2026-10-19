import { earn, type CurrencyState, type EarningsPolicy } from '../currency/currency';
import type { Outcome, RoundResult, SolvedProblem } from '../learning/session';
import { ROUND_LENGTH } from '../round/rules';
import type { createStore } from '../save/store';

export interface PracticePolicy<State, Selection, Context, Change, Facts> {
  start(state: State, selection: Selection): { state: State; context: Context; intro: boolean };
  acknowledge(state: State, context: Context): State;
  solve(state: State, context: Context, fact: SolvedProblem): { state: State; changes: Change[] };
  interrupt(state: State, outcome: Exclude<Outcome, 'clean'>): State;
  earnings: EarningsPolicy;
  complete(state: State, result: RoundResult, beforeBalance: number, afterBalance: number): { state: State; facts: Facts };
}

export function createPracticeCoordinator<State extends { currency: CurrencyState }, Selection, Context, Change, Facts>(
  store: Pick<ReturnType<typeof createStore<State>>, 'commit'>,
  policy: PracticePolicy<State, Selection, Context, Change, Facts>,
) {
  let sequence = 0;
  let active: { roundId: string; context: Context; intro: boolean; results: SolvedProblem[]; terminal: boolean } | undefined;

  /** `resume`: the answers already given in this Round before the page reloaded (already counted in the save). */
  function start(selection: Selection, resume: readonly SolvedProblem[] = []) {
    const roundId = `round-${++sequence}`;
    let context!: Context, intro = false;
    const result = store.commit(state => {
      const next = policy.start(state, selection);
      context = next.context;
      intro = next.intro;
      active = { roundId, context, intro, results: resume.length < ROUND_LENGTH ? resume.map(r => ({ ...r })) : [], terminal: false };
      return next.state;
    });
    return result.kind === 'accepted' ? { ...result, roundId, context, intro } : result;
  }

  function acknowledge(roundId: string) {
    return store.commit(state => {
      if (!active || active.roundId !== roundId || active.terminal || !active.intro) return null;
      const next = policy.acknowledge(state, active.context);
      active.intro = false;
      return next;
    });
  }

  const accepts = (roundId: string, index: number) => active?.roundId === roundId && !active.terminal && !active.intro && index <= ROUND_LENGTH && index === active.results.length + 1;

  function interrupt(roundId: string, index: number, outcome: Exclude<Outcome, 'clean'>) {
    return store.commit(state => accepts(roundId, index) ? policy.interrupt(state, outcome) : null);
  }

  function solve(roundId: string, fact: SolvedProblem) {
    let changes: Change[] = [];
    const result = store.commit(state => {
      if (!active || !accepts(roundId, fact.index)) return null;
      const next = policy.solve(state, active.context, fact);
      changes = next.changes;
      active.results.push({ ...fact });
      return next.state;
    });
    return result.kind === 'accepted' ? { ...result, changes } : result;
  }

  function terminal(fact: RoundResult) {
    const current = active;
    if (!current || current.roundId !== fact.roundId || current.terminal) return { kind: 'rejected', reason: 'rejected' } as const;
    if (fact.status === 'abandoned') {
      current.terminal = true;
      return { kind: 'abandoned' } as const;
    }
    if (fact.results.length !== current.results.length || !fact.results.every((r, i) => {
      const solved = current.results[i]!;
      return r.index === solved.index && r.outcome === solved.outcome && r.misses === solved.misses && r.helped === solved.helped && r.replay === solved.replay;
    })) return { kind: 'rejected', reason: 'rejected' } as const;
    let earned = 0, beforeBalance = 0, afterBalance = 0;
    let facts!: Facts;
    const result = store.commit(state => {
      if (!active || active.roundId !== fact.roundId || active.terminal || active.results.length !== ROUND_LENGTH || fact.status !== 'completed') return null;
      const currency = earn(state.currency, { ...fact, status: 'completed' }, policy.earnings);
      if (currency.kind === 'rejected') return null;
      beforeBalance = state.currency.balance;
      afterBalance = currency.state.balance;
      const done = policy.complete(state, fact, beforeBalance, afterBalance);
      facts = done.facts;
      earned = currency.amount;
      active.terminal = true;
      return { ...done.state, currency: currency.state };
    });
    return result.kind === 'accepted' ? { ...result, ...facts, earned, beforeBalance, afterBalance } : result;
  }

  return { start, acknowledge, interrupt, solve, terminal };
}
