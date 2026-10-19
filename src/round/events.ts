// What each end-of-Round moment says, and the order they play in: smallest first.
import { modeById } from '../modes/modes';
import { levelLine } from '../modes/phrases';
import { earnedTrophy } from '../trophies/phrases';
import type { Phrase } from '../voice/phrases';
import type { RoundEvent } from './round';

/** Trophies come last: each one sums up something that just happened. */
export const tierOf = (e: RoundEvent) => (e.kind === 'trophy' ? 4 : e.kind === 'star' ? 3 : 2);
export const smallestFirst = (events: readonly RoundEvent[]) => [...events].sort((a, b) => tierOf(a) - tierOf(b));

export function eventLines(e: RoundEvent): Phrase[] {
  if (e.kind === 'trophy') return [earnedTrophy(e.step)];
  const name = modeById(e.mode).name;
  if (e.kind === 'levelUp') return ['Level up!', levelLine(e.mode, e.level)];
  if (e.kind === 'star') return [`You are a ${name} star!`];
  return [`You opened ${name}!`];
}
