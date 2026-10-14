// Trophies: earned by playing well, never bought and never lost. Each one is a pure check over the save (and the
// Round just finished), so new ones can be added any time without touching the Garage economy. A counting trophy
// takes one spot on the shelf and upgrades in place, bronze to silver to gold and on, one step at a time.
import { MODE_IDS, type ModeId } from '../modes/ids';

export const STREAKS = [5, 10, 20] as const;
export const ROUND_COUNTS = [10, 25, 50, 100, 250] as const;
export const DAYS = 5;
export type StreakN = (typeof STREAKS)[number];
export type RoundsN = (typeof ROUND_COUNTS)[number];

export type TrophyStep =
  | { kind: 'level'; mode: ModeId; level: 2 | 3 }
  | { kind: 'star'; mode: ModeId }
  | { kind: 'streak'; n: StreakN }
  | { kind: 'perfect' }
  | { kind: 'rounds'; n: RoundsN }
  | { kind: 'days'; n: typeof DAYS };

export type StepId = `${ModeId}:${2 | 3 | 'star'}` | `streak:${StreakN}` | 'perfect' | `rounds:${RoundsN}` | `days:${typeof DAYS}`;

/** Earned steps and the day each was earned ("2026-09-30"). */
export type Earned = Partial<Record<StepId, string>>;

export interface Trophy {
  id: string;
  kind: 'learning' | 'skill' | 'sticking';
  /** One step, or one per metal for a counting trophy. */
  steps: readonly TrophyStep[];
}

export const TROPHIES: readonly Trophy[] = [
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

/** The trophy this step belongs to, and how many of its steps it makes (1 for the first). */
export function trophyOf(s: TrophyStep): { trophy: Trophy; earned: number } {
  const id = stepId(s), trophy = TROPHIES.find(t => t.steps.some(x => stepId(x) === id))!;
  return { trophy, earned: trophy.steps.findIndex(x => stepId(x) === id) + 1 };
}

/** How many of this trophy's steps he has earned. */
export const earnedCount = (t: Trophy, earned: Earned) => t.steps.filter(s => earned[stepId(s)]).length;

/** The local calendar day, as "2026-09-30". */
export const dayOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
