// What Chop Chop asks, and his progress in each kind of fraction question. As in Time Flies there is no picking: every
// Round mixes all the kinds he has opened (src/chop-chop/mix.ts), and each kind keeps its own Level, raised by Mastery
// (src/modes/progress.ts): 16 of the last 20 right on the first try, or 10 in a row when he clearly has it. Only the
// questions asked at his Level count; the easier ones mixed in are there for confidence.
import type { Check, Outcome, Progression } from '../learning/session';
import { recordOutcome, type MasteryRule } from '../modes/progress';
import type { ModeProgress } from '../modes/state';
import type { Level } from './fractions/problems';

/** Shown on Home in this order: the chain that starts with fair pieces, the one that starts with finding parts, and sharing. */
export const MODE_IDS = ['fair', 'name', 'bigger', 'find', 'color', 'share'] as const;
export type ModeId = (typeof MODE_IDS)[number];
export const MODE_NAMES = {
  fair: 'Fair Shares', name: 'Name the Piece', bigger: 'Bigger Piece',
  find: 'Find the Part', color: 'Color the Part', share: 'Share It',
} as const;
export type ModeName = (typeof MODE_NAMES)[ModeId];
/** A kind opens when the one before it reaches Level 2; the rest are open from the start. */
export const OPENS_AFTER: Record<ModeId, ModeId | null> = { fair: null, name: 'fair', bigger: 'name', find: null, color: 'find', share: null };
/** Spoken when he taps a kind that is still locked. */
export const LOCKED_HINTS = {
  name: 'Play more Fair Shares to open this!', bigger: 'Name more pieces to open this!', color: 'Find more parts to open this!',
} as const;
export type LockedHint = (typeof LOCKED_HINTS)[keyof typeof LOCKED_HINTS];

export interface LearningState {
  modes: Record<ModeId, ModeProgress>;
}

/** 16 of the last 20 right on the first try, or the last 10 in a row. */
export const FRACTION_RULE: MasteryRule = { window: 20, mastery: 16, streak: 10, top: 3 };

export const freshMode = (id: ModeId): ModeProgress => ({ level: 1, window: [], opened: OPENS_AFTER[id] === null, starred: false, introPending: false, fresh: false });
const eachMode = (f: (id: ModeId) => ModeProgress) => Object.fromEntries(MODE_IDS.map(id => [id, f(id)])) as Record<ModeId, ModeProgress>;
export const freshLearning = (): LearningState => ({ modes: eachMode(freshMode) });

type Raw = Record<string, unknown>;
const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);
const bool = (x: unknown, fallback: boolean) => (typeof x === 'boolean' ? x : fallback);
const OUTCOMES: readonly Outcome[] = ['clean', 'helped', 'missed'];

function readMode(id: ModeId, raw: unknown): ModeProgress {
  const f = freshMode(id);
  if (!isRecord(raw)) return f;
  return {
    level: ([1, 2, 3] as const).find(l => l === raw.level) ?? f.level,
    window: Array.isArray(raw.window) ? raw.window.filter((o): o is Outcome => OUTCOMES.includes(o as Outcome)).slice(-FRACTION_RULE.window) : f.window,
    opened: bool(raw.opened, f.opened), starred: bool(raw.starred, f.starred), introPending: false, fresh: bool(raw.fresh, f.fresh),
  };
}

export function readLearning(raw: unknown): LearningState {
  const data = isRecord(raw) ? raw : {}, modes = isRecord(data.modes) ? data.modes : {};
  return { modes: eachMode(id => readMode(id, modes[id])) };
}

/** A Round starts: newly opened kinds have been seen. */
export const startPractice = (state: LearningState): LearningState =>
  ({ modes: eachMode(id => ({ ...state.modes[id], fresh: false })) });

export type LearningChange =
  | { kind: 'levelUp'; mode: ModeId; level: 2 | 3 }
  | { kind: 'open'; mode: ModeId }
  | { kind: 'star'; mode: ModeId };

/** Which kind of question was solved, and whether it was asked at his Level (`push`) or was an easier one. */
export interface Asked { readonly mode: ModeId; readonly push: boolean }

export const recordSolved: Progression<LearningState, Asked, LearningChange> = (state, { mode: id, push }, result) => {
  if (!push) return { state, changes: [] };
  const recorded = recordOutcome(state.modes[id], result.outcome, FRACTION_RULE), event = recorded.event;
  const mode = { ...recorded.mode, introPending: false }; // no card for a new Level: the questions themselves teach
  const changes: LearningChange[] = [];
  const modes = { ...state.modes, [id]: mode };
  if (event === 'levelUp') {
    changes.push({ kind: 'levelUp', mode: id, level: mode.level as 2 | 3 });
    if (mode.level === 2) for (const opened of MODE_IDS.filter(m => OPENS_AFTER[m] === id && !modes[m].opened)) {
      modes[opened] = { ...modes[opened], opened: true, fresh: true };
      changes.push({ kind: 'open', mode: opened });
    }
  }
  if (event === 'star') changes.push({ kind: 'star', mode: id });
  return { state: { ...state, modes }, changes };
};

export const levelOf = (state: LearningState, id: ModeId) => state.modes[id].level as Level;

export type Explanation<P> = (problem: P, answer: string, teach: boolean, signal: AbortSignal) => Promise<void>;
export const verdict = <P>(correct: boolean, problem: P, answer: string, explain: Explanation<P>): Check =>
  correct ? { kind: 'correct' } : { kind: 'incorrect', explain: (teach, signal) => explain(problem, answer, teach, signal) };
