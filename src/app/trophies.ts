import type { Outcome } from '../learning/session';
import type { LearningState } from '../modes/state';
import type { Save } from '../save/migrate';
import { finishRound as finish, freshTrophies, readTrophies, reached as ruleReached, type TrophyRule, type TrophyState } from '../trophies/rules';
import { STEP_IDS, stepId, TROPHIES, type Earned, type StepId, type TrophyStep } from '../trophies/trophies';

export const trophiesFromSave = (save: Save): TrophyState<StepId> => ({
  earned: save.trophies, currentStreak: save.currentStreak, bestStreak: save.bestStreak,
  roundsFinished: save.roundsFinished, daysPlayed: save.daysPlayed, lastDay: save.lastDay,
});

export const trophyFields = (state: TrophyState<StepId>) => ({
  trophies: state.earned, currentStreak: state.currentStreak, bestStreak: state.bestStreak,
  roundsFinished: state.roundsFinished, daysPlayed: state.daysPlayed, lastDay: state.lastDay,
});

export const readTrophyFields = (raw: Record<string, unknown>) => trophyFields(readTrophies({
  earned: raw.trophies, currentStreak: raw.currentStreak, bestStreak: raw.bestStreak,
  roundsFinished: raw.roundsFinished, daysPlayed: raw.daysPlayed, lastDay: raw.lastDay,
}, STEP_IDS));

function ruleFor(s: TrophyStep, modes: LearningState['modes']): TrophyRule<StepId> {
  const id = stepId(s);
  if (s.kind === 'level') return { id, kind: 'milestone', reached: modes[s.mode].level >= s.level };
  if (s.kind === 'star') return { id, kind: 'milestone', reached: modes[s.mode].starred };
  return { ...s, id };
}

/** What the checks read from the save. */
interface Progress {
  modes: LearningState['modes'];
  bestStreak: number;
  roundsFinished: number;
  daysPlayed: number;
}

/** Has he done what this step asks? `round` is the Round just finished, if any. */
export function reached(s: TrophyStep, progress: Progress, round: readonly Outcome[] | null): boolean {
  return ruleReached(ruleFor(s, progress.modes), { ...freshTrophies<StepId>(), ...progress }, round);
}

export function completeTrophies(state: TrophyState<StepId>, learning: LearningState, round: readonly Outcome[], day: string) {
  const steps = TROPHIES.flatMap(t => t.steps);
  const done = finish(state, round, day, steps.map(s => ruleFor(s, learning.modes)));
  return { state: done.state, earned: steps.filter(s => done.earned.includes(stepId(s))) };
}

/** The Learning trophies an older save already proves: the Levels and stars it reached. */
export function backfill(modes: LearningState['modes'], day: string): Earned {
  const progress = { modes, bestStreak: 0, roundsFinished: 0, daysPlayed: 0 };
  const steps = TROPHIES.filter(t => t.kind === 'learning').flatMap(t => t.steps).filter(s => reached(s, progress, null));
  return Object.fromEntries(steps.map(s => [stepId(s), day]));
}
