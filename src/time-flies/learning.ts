// What Time Flies asks, and his progress in each kind of question. There is no picking: every Round mixes all the kinds
// he has opened (src/time-flies/mix.ts). Each kind keeps its own Level, raised as in Monster Truck Money
// (src/modes/progress.ts) but with Mastery taking twice as long: 16 of the last 20 right on the first try. Only the
// questions asked at his Level count toward it; the easier ones mixed in are there for confidence.
import type { Check, Outcome, Progression } from '../learning/session';
import { recordOutcome, type MasteryRule } from '../modes/progress';
import type { ModeProgress } from '../modes/state';
import { choicesFor, randomTime, startingTime, type ClockTime, type Level } from './clock/time';
import type { Rng } from '../game/rng';

export const MODE_IDS = ['find', 'read', 'set', 'days', 'months', 'units'] as const;
export type ModeId = (typeof MODE_IDS)[number];
export const MODE_NAMES = {
  find: 'Find the Clock', read: 'Read the Clock', set: 'Set the Clock',
  days: 'Days of the Week', months: 'Months of the Year', units: 'Time Facts',
} as const;
export type ModeName = (typeof MODE_NAMES)[ModeId];
/** The kinds that use the clock face (and its Level introductions). */
export const CLOCK_MODES = ['find', 'read', 'set'] as const satisfies readonly ModeId[];
export const isClock = (m: ModeId): m is (typeof CLOCK_MODES)[number] => (CLOCK_MODES as readonly ModeId[]).includes(m);
/** A kind opens when the one before it reaches Level 2; the rest are open from the start. */
export const OPENS_AFTER: Record<ModeId, ModeId | null> = { find: null, read: 'find', set: 'read', days: null, months: 'days', units: null };
/** Spoken when he taps a kind that is still locked. */
export const LOCKED_HINTS = {
  read: 'Find more clocks to open this!', set: 'Read more clocks to open this!', months: 'Learn more days to open this!',
} as const;
export type LockedHint = (typeof LOCKED_HINTS)[keyof typeof LOCKED_HINTS];

export interface LearningState {
  modes: Record<ModeId, ModeProgress>;
}

/** 16 of the last 20 right on the first try. */
export const CLOCK_RULE: MasteryRule = { window: 20, mastery: 16, top: 3 };

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
    window: Array.isArray(raw.window) ? raw.window.filter((o): o is Outcome => OUTCOMES.includes(o as Outcome)).slice(-CLOCK_RULE.window) : f.window,
    opened: bool(raw.opened, f.opened), starred: bool(raw.starred, f.starred),
    introPending: bool(raw.introPending, f.introPending), fresh: bool(raw.fresh, f.fresh),
  };
}

export function readLearning(raw: unknown): LearningState {
  const data = isRecord(raw) ? raw : {}, modes = isRecord(data.modes) ? data.modes : {};
  return { modes: eachMode(id => readMode(id, modes[id])) };
}

/** A Round starts: newly opened kinds have been seen. */
export const startPractice = (state: LearningState): LearningState =>
  ({ modes: eachMode(id => ({ ...state.modes[id], fresh: false })) });
/** The clock's next Level to introduce, when a clock kind has just reached one (1 when there's none). */
export const pendingIntro = (state: LearningState): Level =>
  Math.max(1, ...CLOCK_MODES.filter(m => state.modes[m].opened && state.modes[m].introPending).map(m => state.modes[m].level)) as Level;
export const acknowledgeIntro = (state: LearningState): LearningState =>
  ({ modes: eachMode(id => ({ ...state.modes[id], introPending: false })) });

export type LearningChange =
  | { kind: 'levelUp'; mode: ModeId; level: 2 | 3 }
  | { kind: 'open'; mode: ModeId }
  | { kind: 'star'; mode: ModeId };

/** Which kind of question was solved, and whether it was asked at his Level (`push`) or was an easier one. */
export interface Asked { readonly mode: ModeId; readonly push: boolean }

export const recordSolved: Progression<LearningState, Asked, LearningChange> = (state, { mode: id, push }, result) => {
  if (!push) return { state, changes: [] };
  const recorded = recordOutcome(state.modes[id], result.outcome, CLOCK_RULE), event = recorded.event;
  // only the clock has a card for its new times
  const mode = isClock(id) ? recorded.mode : { ...recorded.mode, introPending: false };
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

// ---------- clock problems ----------

/** Find the Clock and Read the Clock: a time and three choices (clocks or written times), answered with its digital form. */
export interface ChoiceProblem { readonly target: ClockTime; readonly choices: readonly ClockTime[] }
/** Set the Clock: a time to make, from where the hands start. Answered with the digital form of the time the hands show. */
export interface SetProblem { readonly target: ClockTime; readonly start: ClockTime }

export type Explanation<P> = (problem: P, answer: string, teach: boolean, signal: AbortSignal) => Promise<void>;

export const makeChoice = (level: Level, rng: Rng, avoid?: ClockTime): ChoiceProblem => {
  const target = randomTime(level, rng, avoid);
  return { target, choices: choicesFor(target, level, rng) };
};
export const replayChoice = (p: ChoiceProblem, level: Level, rng: Rng): ChoiceProblem => ({ target: p.target, choices: choicesFor(p.target, level, rng) });

export const makeSet = (level: Level, rng: Rng, avoid?: ClockTime): SetProblem => {
  const target = randomTime(level, rng, avoid);
  return { target, start: startingTime(target, level, rng) };
};

export const verdict = <P>(correct: boolean, problem: P, answer: string, explain: Explanation<P>): Check =>
  correct ? { kind: 'correct' } : { kind: 'incorrect', explain: (teach, signal) => explain(problem, answer, teach, signal) };
