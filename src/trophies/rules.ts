import type { Outcome } from '../learning/session';

export interface TrophyState<Id extends string> {
  earned: Partial<Record<Id, string>>;
  currentStreak: number;
  bestStreak: number;
  roundsFinished: number;
  daysPlayed: number;
  lastDay: string | null;
}

export type TrophyRule<Id extends string> = { id: Id } & (
  | { kind: 'milestone'; reached: boolean }
  | { kind: 'streak' | 'rounds' | 'days'; n: number }
  | { kind: 'perfect' }
);

export const freshTrophies = <Id extends string>(): TrophyState<Id> =>
  ({ earned: {}, currentStreak: 0, bestStreak: 0, roundsFinished: 0, daysPlayed: 0, lastDay: null });

export function reached<Id extends string>(rule: TrophyRule<Id>, state: TrophyState<Id>, round: readonly Outcome[] | null): boolean {
  switch (rule.kind) {
    case 'milestone': return rule.reached;
    case 'streak': return state.bestStreak >= rule.n;
    case 'perfect': return !!round?.length && round.every(o => o === 'clean');
    case 'rounds': return state.roundsFinished >= rule.n;
    case 'days': return state.daysPlayed >= rule.n;
  }
}

type Raw = Record<string, unknown>;
const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);
const count = (x: unknown) => typeof x === 'number' && Number.isInteger(x) && x >= 0 ? x : 0;

export function readTrophies<Id extends string>(raw: unknown, ids: readonly Id[]): TrophyState<Id> {
  const data = isRecord(raw) ? raw : {};
  const earned = isRecord(data.earned) ? data.earned : {};
  return {
    earned: Object.fromEntries(ids.filter(id => typeof earned[id] === 'string').map(id => [id, earned[id]])) as Partial<Record<Id, string>>,
    currentStreak: count(data.currentStreak), bestStreak: count(data.bestStreak),
    roundsFinished: count(data.roundsFinished), daysPlayed: count(data.daysPlayed),
    lastDay: typeof data.lastDay === 'string' ? data.lastDay : null,
  };
}

/** An answered problem: a first-try answer without help adds to the streak, anything else breaks it. */
export function countAnswer<Id extends string>(state: TrophyState<Id>, outcome: Outcome): TrophyState<Id> {
  const currentStreak = outcome === 'clean' ? state.currentStreak + 1 : 0;
  return { ...state, currentStreak, bestStreak: Math.max(state.bestStreak, currentStreak) };
}

/** The end of a Round: count it and the day, then earn every trophy step newly reached. */
export function finishRound<Id extends string>(state: TrophyState<Id>, round: readonly Outcome[], day: string, rules: readonly TrophyRule<Id>[]): { state: TrophyState<Id>; earned: Id[] } {
  const counted = { ...state, roundsFinished: state.roundsFinished + 1, daysPlayed: state.daysPlayed + (state.lastDay === day ? 0 : 1), lastDay: day };
  const earned = rules.filter(rule => !state.earned[rule.id] && reached(rule, counted, round)).map(rule => rule.id);
  return { state: { ...counted, earned: { ...state.earned, ...Object.fromEntries(earned.map(id => [id, day])) } }, earned };
}
