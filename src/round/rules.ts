// The Round's rules against guessing: Bolts come from answers right on the first try, help steps in after two
// misses on a problem, and a missed problem comes back once, later in the Round.
import type { Outcome } from '../learning/session';

export const ROUND_LENGTH = 5;
/** A Bolt for finishing the Round, however it went. */
export const FINISH_BOLTS = 1;
/** The most one Round can earn: every answer right on the first try. */
export const MAX_BOLTS = ROUND_LENGTH + FINISH_BOLTS;
/** Help steps in on this miss of one problem (or on the first, when he has missed a lot lately). */
export const TEACH_ON_MISS = 2;
/** After a miss, taps wait this long once the explanation is done. */
export const THINK_MS = 1500;

/** A Bolt for each answer that counts toward Mastery, plus one for finishing. */
export const boltsFor = (results: readonly Outcome[]) => results.filter(o => o === 'clean').length + FINISH_BOLTS;

export const teachNow = (misses: number, struggling: boolean) => struggling || misses >= TEACH_ON_MISS;

/** A missed problem waiting to come back; `after` is how many answers there were once it was answered. */
export interface Again { problem: unknown; after: number }

/** The missed problem to ask again, once at least one other problem has come between. */
export function takeAgain(queue: readonly Again[], answered: number): { problem: unknown; rest: Again[] } | null {
  const i = queue.findIndex(a => answered > a.after);
  if (i < 0) return null;
  return { problem: queue[i]!.problem, rest: queue.filter((_, j) => j !== i) };
}
