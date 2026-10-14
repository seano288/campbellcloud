import type { Progression } from '../learning/session';
import { OPENS_AFTER, opensWith } from './chain';
import { MODE_IDS, type ModeId } from './ids';
import { recordOutcome } from './progress';
import type { LearningState } from './state';

const UNLOCK_CHAIN = MODE_IDS.map(id => ({ id, opensAfter: OPENS_AFTER[id] }));

export type LearningChange =
  | { kind: 'levelUp'; mode: ModeId; level: 2 | 3 }
  | { kind: 'open'; mode: ModeId }
  | { kind: 'star'; mode: ModeId };

export const recordSolved: Progression<LearningState, ModeId, LearningChange> = (state, id, result) => {
  const { mode, event } = recordOutcome(state.modes[id], result.outcome);
  const changes: LearningChange[] = [];
  const modes = { ...state.modes, [id]: mode };
  if (event === 'levelUp') {
    changes.push({ kind: 'levelUp', mode: id, level: mode.level as 2 | 3 });
    for (const opened of opensWith(UNLOCK_CHAIN, id, mode.level)) {
      modes[opened] = { ...modes[opened], opened: true, fresh: true };
      changes.push({ kind: 'open', mode: opened });
    }
  }
  if (event === 'star') changes.push({ kind: 'star', mode: id });
  return { state: { ...state, modes }, changes };
};
