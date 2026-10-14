// Mastery and Levels: each Game Mode raises its own Level when he shows Mastery.
import type { Outcome } from '../learning/session';
import type { ModeProgress } from './state';

export const WINDOW = 10;
export const MASTERY = 8; // right on the first try without help, of the last 10
export const STRUGGLE = 5; // missed, of the last 10
export const TOP_LEVEL = 3;

export type ProgressEvent = 'levelUp' | 'star';

export function recordOutcome(mode: ModeProgress, outcome: Outcome): { mode: ModeProgress; event: ProgressEvent | null } {
  const window = [...mode.window, outcome].slice(-WINDOW);
  const mastered = window.filter(o => o === 'clean').length >= MASTERY;
  if (mastered && mode.level < TOP_LEVEL) {
    return { mode: { ...mode, level: (mode.level + 1) as 2 | 3, window: [], introPending: true }, event: 'levelUp' };
  }
  if (mastered && !mode.starred) return { mode: { ...mode, window, starred: true }, event: 'star' };
  return { mode: { ...mode, window }, event: null };
}

/** He has missed a lot lately: help steps in after a single miss. */
export const struggling = (mode: ModeProgress) => mode.window.filter(o => o === 'missed').length >= STRUGGLE;
