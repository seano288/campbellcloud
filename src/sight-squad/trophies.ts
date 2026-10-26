// Trophies for Sight Squad, on the shared rules in src/trophies/rules.ts: a Level or a star in each kind of question, the
// words he has met, a first-try streak, a perfect Round, Rounds finished and days played. Earned, never bought and never lost.
import type { Outcome } from '../learning/session';
import { finishRound, type TrophyRule, type TrophyState } from '../trophies/rules';
import { MODE_IDS, MODE_NAMES, type LearningState, type ModeId, type ModeName } from './learning';

export const WORD_COUNTS = [10, 25, 50, 100] as const;
export const STREAKS = [5, 10, 20] as const;
export const ROUND_COUNTS = [10, 25, 50, 100, 250] as const;
export const DAYS = 5;
type WordsN = (typeof WORD_COUNTS)[number];
type StreakN = (typeof STREAKS)[number];
type RoundsN = (typeof ROUND_COUNTS)[number];

export type TrophyStep =
  | { kind: 'level'; mode: ModeId; level: 2 | 3 }
  | { kind: 'star'; mode: ModeId }
  | { kind: 'words'; n: WordsN }
  | { kind: 'streak'; n: StreakN }
  | { kind: 'perfect' }
  | { kind: 'rounds'; n: RoundsN }
  | { kind: 'days'; n: typeof DAYS };
export type StepId = `${ModeId}:${2 | 3 | 'star'}` | `words:${WordsN}` | `streak:${StreakN}` | 'perfect' | `rounds:${RoundsN}` | `days:${typeof DAYS}`;
export type Earned = Partial<Record<StepId, string>>;

export interface Trophy { id: string; kind: 'learning' | 'skill' | 'sticking'; steps: readonly TrophyStep[] }

export const TROPHIES: readonly Trophy[] = [
  { id: 'words', kind: 'learning', steps: WORD_COUNTS.map(n => ({ kind: 'words', n })) },
  ...MODE_IDS.flatMap((mode): Trophy[] => [
    { id: `${mode}:2`, kind: 'learning', steps: [{ kind: 'level', mode, level: 2 }] },
    { id: `${mode}:3`, kind: 'learning', steps: [{ kind: 'level', mode, level: 3 }] },
    { id: `${mode}:star`, kind: 'learning', steps: [{ kind: 'star', mode }] },
  ]),
  { id: 'streak', kind: 'skill', steps: STREAKS.map(n => ({ kind: 'streak', n })) },
  { id: 'perfect', kind: 'skill', steps: [{ kind: 'perfect' }] },
  { id: 'rounds', kind: 'sticking', steps: ROUND_COUNTS.map(n => ({ kind: 'rounds', n })) },
  { id: 'days', kind: 'sticking', steps: [{ kind: 'days', n: DAYS }] },
];

export function stepId(s: TrophyStep): StepId {
  switch (s.kind) {
    case 'level': return `${s.mode}:${s.level}`;
    case 'star': return `${s.mode}:star`;
    case 'perfect': return 'perfect';
    default: return `${s.kind}:${s.n}` as StepId;
  }
}
export const STEP_IDS: readonly StepId[] = TROPHIES.flatMap(t => t.steps.map(stepId));
export const earnedCount = (t: Trophy, earned: Earned) => t.steps.filter(s => earned[stepId(s)]).length;
export const dayOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function ruleFor(s: TrophyStep, learning: LearningState): TrophyRule<StepId> {
  const id = stepId(s);
  if (s.kind === 'level') return { id, kind: 'milestone', reached: learning.modes[s.mode].level >= s.level };
  if (s.kind === 'star') return { id, kind: 'milestone', reached: learning.modes[s.mode].starred };
  if (s.kind === 'words') return { id, kind: 'milestone', reached: learning.words.length >= s.n };
  return { ...s, id };
}

export function completeTrophies(state: TrophyState<StepId>, learning: LearningState, round: readonly Outcome[], day: string) {
  const steps = TROPHIES.flatMap(t => t.steps);
  const done = finishRound(state, round, day, steps.map(s => ruleFor(s, learning)));
  return { state: done.state, earned: steps.filter(s => done.earned.includes(stepId(s))) };
}

// ---------- what they're called ----------
export type TrophyName = `${ModeName} Level ${2 | 3}` | `${ModeName} Star` | `${WordsN} Words` | `${StreakN} in a Row` | 'Perfect Round' | `${RoundsN} Rounds` | `${typeof DAYS} Days`;
type TrophyHint = `Reach Level ${2 | 3} in ${ModeName}!` | `Be a ${ModeName} star!` | `Meet ${WordsN} words!` | `Get ${StreakN} right in a row on the first try!`
  | 'Get every answer right on the first try in one Round!' | `Finish ${RoundsN} Rounds!` | `Play on ${typeof DAYS} different days!`;
export function trophyName(s: TrophyStep): TrophyName {
  switch (s.kind) {
    case 'level': return `${MODE_NAMES[s.mode]} Level ${s.level}`;
    case 'star': return `${MODE_NAMES[s.mode]} Star`;
    case 'words': return `${s.n} Words`;
    case 'streak': return `${s.n} in a Row`;
    case 'perfect': return 'Perfect Round';
    case 'rounds': return `${s.n} Rounds`;
    case 'days': return `${s.n} Days`;
  }
}
export function trophyHint(s: TrophyStep): TrophyHint {
  switch (s.kind) {
    case 'level': return `Reach Level ${s.level} in ${MODE_NAMES[s.mode]}!`;
    case 'star': return `Be a ${MODE_NAMES[s.mode]} star!`;
    case 'words': return `Meet ${s.n} words!`;
    case 'streak': return `Get ${s.n} right in a row on the first try!`;
    case 'perfect': return 'Get every answer right on the first try in one Round!';
    case 'rounds': return `Finish ${s.n} Rounds!`;
    case 'days': return `Play on ${s.n} different days!`;
  }
}
export const earnedTrophy = (s: TrophyStep) => `You earned ${trophyName(s)}!` as const;
export const TROPHY_PHRASES = ['Trophies!', ...TROPHIES.flatMap(t => t.steps).flatMap(s => [trophyName(s), trophyHint(s), earnedTrophy(s)])] as const;
