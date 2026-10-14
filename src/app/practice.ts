import type { SolvedProblem } from '../learning/session';
import type { ModeId } from '../modes/ids';
import { recordSolved } from '../modes/learning';
import type { LearningState } from '../modes/state';
import type { Save } from '../save/migrate';
import { countAnswer } from './trophies';

export const learningFromSave = (save: Save): LearningState => ({ modes: save.modes, lastMode: save.lastMode });
export const withLearning = (save: Save, state: LearningState): Save => ({ ...save, modes: state.modes, lastMode: state.lastMode });

export function applySolved(save: Save, mode: ModeId, result: SolvedProblem) {
  const next = recordSolved(learningFromSave(save), mode, result);
  return { save: countAnswer(withLearning(save, next.state), result.outcome), changes: next.changes };
}
