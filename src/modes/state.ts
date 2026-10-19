import type { Outcome } from '../learning/session';
import { LEVELS, MODE_IDS, type Level, type ModeId } from './ids';

export interface ModeProgress {
  level: Level;
  /** The last 10 problems, oldest first. */
  window: Outcome[];
  opened: boolean;
  starred: boolean;
  /** The introduction card for the new money still has to be shown before the next Round. */
  introPending: boolean;
  /** Newly opened: the tile pulses and replays "You opened …!" until he taps it. */
  fresh: boolean;
}

export interface LearningState {
  modes: Record<ModeId, ModeProgress>;
  lastMode: ModeId;
}

export const freshMode = (id: ModeId): ModeProgress => ({ level: 1, window: [], opened: id === 'learn', starred: false, introPending: false, fresh: false });

export const freshLearning = (): LearningState => ({
  modes: Object.fromEntries(MODE_IDS.map(id => [id, freshMode(id)])) as Record<ModeId, ModeProgress>,
  lastMode: 'learn',
});

type Raw = Record<string, unknown>;
const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);
const bool = (x: unknown, fallback: boolean) => typeof x === 'boolean' ? x : fallback;

function readMode(id: ModeId, raw: unknown): ModeProgress {
  const f = freshMode(id);
  if (!isRecord(raw)) return f;
  const outcomes = ['clean', 'helped', 'missed'] as const;
  return {
    level: LEVELS.find(l => l === raw.level) ?? f.level,
    window: Array.isArray(raw.window) ? raw.window.filter((o): o is Outcome => outcomes.includes(o as Outcome)).slice(-10) : f.window,
    opened: bool(raw.opened, f.opened),
    starred: bool(raw.starred, f.starred),
    introPending: bool(raw.introPending, f.introPending),
    fresh: bool(raw.fresh, f.fresh),
  };
}

export function readLearning(raw: unknown): LearningState {
  const data = isRecord(raw) ? raw : {};
  const modes = isRecord(data.modes) ? data.modes : {};
  return {
    modes: Object.fromEntries(MODE_IDS.map(id => [id, readMode(id, modes[id])])) as Record<ModeId, ModeProgress>,
    lastMode: MODE_IDS.find(id => id === data.lastMode) ?? 'learn',
  };
}

export const selectPractice = (state: LearningState, id: ModeId): LearningState =>
  ({ ...state, lastMode: id, modes: { ...state.modes, [id]: { ...state.modes[id], fresh: false } } });

export const acknowledgeIntro = (state: LearningState, id: ModeId): LearningState =>
  ({ ...state, modes: { ...state.modes, [id]: { ...state.modes[id], introPending: false } } });
