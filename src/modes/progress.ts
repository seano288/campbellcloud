// Mastery and Levels: each Game Mode raises its own Level when he shows Mastery, and within a Level the problems
// stretch as his recent answers improve.
import type { Outcome } from '../learning/session';
import type { ModeProgress } from './state';

export const WINDOW = 10;
export const MASTERY = 8; // right on the first try without help, of the last 10
export const HOT_STREAK = 6; // or this many in a row: he's clearly ready, so he doesn't wait for 8 of 10
export const STRUGGLE = 5; // missed, of the last 10
export const TOP_LEVEL = 5;

export type ProgressEvent = 'levelUp' | 'star';

/**
 * How Mastery is judged: `mastery` right on the first try of the last `window` problems, or the last `streak` in a row
 * when there is one. `top` is the highest Level, where Mastery gives the star.
 */
export interface MasteryRule { readonly window: number; readonly mastery: number; readonly streak?: number; readonly top: number }
export const DEFAULT_RULE: MasteryRule = { window: WINDOW, mastery: MASTERY, streak: HOT_STREAK, top: TOP_LEVEL };

export function recordOutcome(mode: ModeProgress, outcome: Outcome, rule: MasteryRule = DEFAULT_RULE): { mode: ModeProgress; event: ProgressEvent | null } {
  const window = [...mode.window, outcome].slice(-rule.window);
  const onStreak = !!rule.streak && window.length >= rule.streak && window.slice(-rule.streak).every(o => o === 'clean');
  const mastered = onStreak || window.filter(o => o === 'clean').length >= rule.mastery;
  if (mastered && mode.level < rule.top) {
    return { mode: { ...mode, level: (mode.level + 1) as ModeProgress['level'], window: [], introPending: true }, event: 'levelUp' };
  }
  if (mastered && !mode.starred) return { mode: { ...mode, window, starred: true }, event: 'star' };
  return { mode: { ...mode, window }, event: null };
}

/** He has missed a lot lately (of the last 10): help steps in after a single miss. */
export const struggling = (mode: ModeProgress) => mode.window.slice(-WINDOW).filter(o => o === 'missed').length >= STRUGGLE;

/** How far a problem stretches within its Level: 0 small and gentle, 2 the hardest the Level asks. */
export type Stretch = 0 | 1 | 2;

/**
 * Fresh on a Level (the window starts empty) or missing a lot, problems are small; as the first-try answers outnumber the
 * misses, they grow toward the hardest the Level has.
 */
export function stretchOf(mode: ModeProgress): Stretch {
  const recent = mode.window.slice(-WINDOW);
  const score = recent.filter(o => o === 'clean').length - recent.filter(o => o === 'missed').length;
  return score >= 5 ? 2 : score >= 2 ? 1 : 0;
}
