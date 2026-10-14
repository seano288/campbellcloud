// The unlock chain, built from the list of modes: a mode opens when the one before it reaches Level 2.
import type { Level, ModeId } from './ids';

export const OPEN_AT: Level = 2;
export const OPENS_AFTER = { learn: null, count: 'learn', pay: 'count' } as const;

export function opensWith(modes: readonly { id: ModeId; opensAfter: ModeId | null }[], mode: ModeId, newLevel: Level): ModeId[] {
  return newLevel === OPEN_AT ? modes.filter(m => m.opensAfter === mode).map(m => m.id) : [];
}
