// The clock's three Game Modes, in unlock order, and his progress in each. Mastery, Levels and the unlock chain work as in
// Monster Truck Money (src/modes/progress.ts): 8 of the last 10 right on the first try raises the Level, and a mode
// opens when the one before it reaches Level 2.
import type { Check, LearningSession, Outcome, Progression, Rng } from '../learning/session';
import { recordOutcome, struggling } from '../modes/progress';
import type { ModeProgress } from '../modes/state';
import { choicesFor, parseDigital, randomTime, sameTime, startingTime, type ClockTime, type Level } from './clock/time';

export const MODE_IDS = ['find', 'read', 'set'] as const;
export type ModeId = (typeof MODE_IDS)[number];
export const MODE_NAMES = { find: 'Find the Clock', read: 'Read the Clock', set: 'Set the Clock' } as const;
export type ModeName = (typeof MODE_NAMES)[ModeId];
export const OPENS_AFTER: Record<ModeId, ModeId | null> = { find: null, read: 'find', set: 'read' };
/** Spoken when he taps a mode that is still locked. */
export const LOCKED_HINTS = { read: 'Find more clocks to open this!', set: 'Read more clocks to open this!' } as const;
export type LockedHint = (typeof LOCKED_HINTS)[keyof typeof LOCKED_HINTS];

export interface LearningState {
  modes: Record<ModeId, ModeProgress>;
  lastMode: ModeId;
}

export const freshMode = (id: ModeId): ModeProgress => ({ level: 1, window: [], opened: id === 'find', starred: false, introPending: false, fresh: false });
export const freshLearning = (): LearningState => ({
  modes: { find: freshMode('find'), read: freshMode('read'), set: freshMode('set') },
  lastMode: 'find',
});

type Raw = Record<string, unknown>;
const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);
const bool = (x: unknown, fallback: boolean) => (typeof x === 'boolean' ? x : fallback);
const OUTCOMES: readonly Outcome[] = ['clean', 'helped', 'missed'];

function readMode(id: ModeId, raw: unknown): ModeProgress {
  const f = freshMode(id);
  if (!isRecord(raw)) return f;
  return {
    level: ([1, 2, 3] as const).find(l => l === raw.level) ?? f.level,
    window: Array.isArray(raw.window) ? raw.window.filter((o): o is Outcome => OUTCOMES.includes(o as Outcome)).slice(-10) : f.window,
    opened: bool(raw.opened, f.opened), starred: bool(raw.starred, f.starred),
    introPending: bool(raw.introPending, f.introPending), fresh: bool(raw.fresh, f.fresh),
  };
}

export function readLearning(raw: unknown): LearningState {
  const data = isRecord(raw) ? raw : {}, modes = isRecord(data.modes) ? data.modes : {};
  return {
    modes: { find: readMode('find', modes.find), read: readMode('read', modes.read), set: readMode('set', modes.set) },
    lastMode: MODE_IDS.find(id => id === data.lastMode) ?? 'find',
  };
}

export const selectPractice = (state: LearningState, id: ModeId): LearningState =>
  ({ ...state, lastMode: id, modes: { ...state.modes, [id]: { ...state.modes[id], fresh: false } } });
export const acknowledgeIntro = (state: LearningState, id: ModeId): LearningState =>
  ({ ...state, modes: { ...state.modes, [id]: { ...state.modes[id], introPending: false } } });

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
    if (mode.level === 2) for (const opened of MODE_IDS.filter(m => OPENS_AFTER[m] === id && !modes[m].opened)) {
      modes[opened] = { ...modes[opened], opened: true, fresh: true };
      changes.push({ kind: 'open', mode: opened });
    }
  }
  if (event === 'star') changes.push({ kind: 'star', mode: id });
  return { state: { ...state, modes }, changes };
};

// ---------- problems ----------

/** Find the Clock and What Time Is It?: a time and three choices (clocks or written times), answered with its digital form. */
export interface ChoiceProblem { readonly target: ClockTime; readonly choices: readonly ClockTime[] }
/** Set the Clock: a time to make, from where the hands start. Answered with the time the hands show. */
export interface SetProblem { readonly target: ClockTime; readonly start: ClockTime }

export type Explanation<P, A> = (problem: P, answer: A, teach: boolean, signal: AbortSignal) => Promise<void>;

let lastTarget: ClockTime | undefined; // a new problem never repeats the one just asked

export function makeChoice(level: Level, rng: Rng): ChoiceProblem {
  const target = randomTime(level, rng, lastTarget);
  lastTarget = target;
  return { target, choices: choicesFor(target, level, rng) };
}
export const replayChoice = (p: ChoiceProblem, level: Level, rng: Rng): ChoiceProblem => ({ target: p.target, choices: choicesFor(p.target, level, rng) });

export function makeSet(level: Level, rng: Rng): SetProblem {
  const target = randomTime(level, rng, lastTarget);
  lastTarget = target;
  return { target, start: startingTime(target, level, rng) };
}

function verdict<P, A>(correct: boolean, problem: P, answer: A, explain: Explanation<P, A>): Check {
  return correct ? { kind: 'correct' } : { kind: 'incorrect', explain: (teach, signal) => explain(problem, answer, teach, signal) };
}

export function choiceSession(level: Level, read: () => ModeProgress, explain: Explanation<ChoiceProblem, string>): LearningSession<ChoiceProblem, string> {
  return {
    makeProblem: rng => makeChoice(level, rng),
    replay: (p, rng) => replayChoice(p, level, rng),
    check(p, answer) {
      const t = parseDigital(answer);
      return t ? verdict(sameTime(t, p.target), p, answer, explain) : { kind: 'not-an-answer' };
    },
    needsEarlyHelp: () => struggling(read()),
  };
}

export function setSession(level: Level, read: () => ModeProgress, explain: Explanation<SetProblem, ClockTime>): LearningSession<SetProblem, ClockTime> {
  return {
    makeProblem: rng => makeSet(level, rng),
    replay: (p, rng) => ({ target: p.target, start: startingTime(p.target, level, rng) }),
    check: (p, answer) => verdict(sameTime(answer, p.target), p, answer, explain),
    needsEarlyHelp: () => struggling(read()),
  };
}
