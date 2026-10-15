import type { Outcome, RoundResult, SolvedProblem } from '../learning/session';
import { earn, type EarningsPolicy } from '../currency/currency';
import { becameAffordable } from '../garage/economy';
import { boltsFor, ROUND_LENGTH } from '../round/rules';
import { dayOf, type TrophyStep } from '../trophies/trophies';
import type { ModeId } from '../modes/ids';
import { recordSolved } from '../modes/learning';
import { acknowledgeIntro, selectPractice, type LearningState } from '../modes/state';
import type { Save } from '../save/migrate';
import { completeTrophies } from './trophies';
import { countAnswer as countStreak } from '../trophies/rules';
import type { createStore } from '../save/store';
import type { MoneyState } from './save';

export const learningFromSave = (save: Save): LearningState => ({ modes: save.modes, lastMode: save.lastMode });

export function createPractice(
  store: Pick<ReturnType<typeof createStore<MoneyState>>, 'commit'>,
  { today = () => dayOf(new Date()), earnings = result => boltsFor(result.results.map(r => r.outcome)) }: { today?: () => string; earnings?: EarningsPolicy } = {},
) {
  let sequence = 0;
  let active: { roundId: string; mode: ModeId; intro: boolean; results: SolvedProblem[]; terminal: boolean } | undefined;

  function start(mode: ModeId) {
    const roundId = `round-${++sequence}`;
    const result = store.commit(state => {
      const practice = state.learning.modes[mode];
      const learning = selectPractice(state.learning, mode);
      active = { roundId, mode, intro: practice.introPending, results: [], terminal: false };
      return { ...state, learning };
    });
    return result.kind === 'accepted'
      ? { ...result, roundId, mode, level: result.state.learning.modes[mode].level, intro: result.state.learning.modes[mode].introPending }
      : result;
  }

  function acknowledge(roundId: string) {
    return store.commit(state => {
      if (!active || active.roundId !== roundId || active.terminal || !active.intro) return null;
      const learning = acknowledgeIntro(state.learning, active.mode);
      active.intro = false;
      return { ...state, learning };
    });
  }

  const accepts = (roundId: string, index: number) => active?.roundId === roundId && !active.terminal && !active.intro && index <= ROUND_LENGTH && index === active.results.length + 1;

  function interrupt(roundId: string, index: number, outcome: Exclude<Outcome, 'clean'>) {
    return store.commit(state => accepts(roundId, index) ? { ...state, trophies: countStreak(state.trophies, outcome) } : null);
  }

  function solve(roundId: string, fact: SolvedProblem) {
    let changes: ReturnType<typeof recordSolved>['changes'] = [];
    const result = store.commit(state => {
      if (!active || !accepts(roundId, fact.index)) return null;
      const next = recordSolved(state.learning, active.mode, fact);
      const trophies = countStreak(state.trophies, fact.outcome);
      changes = next.changes;
      active.results.push({ ...fact });
      return { ...state, learning: next.state, trophies };
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
    let earned = 0, canBuild = false;
    let trophies: TrophyStep[] = [];
    const result = store.commit(state => {
      if (!active || active.roundId !== fact.roundId || active.terminal || active.results.length !== ROUND_LENGTH || fact.status !== 'completed') return null;
      const currency = earn(state.currency, { ...fact, status: 'completed' }, earnings);
      if (currency.kind === 'rejected') return null;
      const done = completeTrophies(state.trophies, state.learning, fact.results.map(r => r.outcome), today());
      canBuild = becameAffordable(state.garage, state.currency.balance, currency.state.balance);
      earned = currency.amount;
      trophies = done.earned;
      active.terminal = true;
      return { ...state, currency: currency.state, trophies: done.state };
    });
    return result.kind === 'accepted' ? { ...result, earned, trophies, canBuild } : result;
  }

  return { start, acknowledge, interrupt, solve, terminal };
}
