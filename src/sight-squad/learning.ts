// What Sight Squad asks, and his progress. As in Chop Chop there is no picking: every Round mixes all the kinds of question
// he has opened (src/sight-squad/mix.ts), and each kind keeps its own Level, raised by Mastery (src/modes/progress.ts): 16
// of the last 20 right on the first try, or 10 in a row. Only the questions asked at his Level count.
//
// The words come one at a time, in the order of src/sight-squad/words/list.ts, and each is met before it's asked. The
// next joins once he has answered WORD_GAP more questions right on the first try, and waits while more than SHAKY_MAX of
// his words are still shaky. Each word keeps a strength from 0 to 5: up one on a first-try answer, down two on a miss.
import type { Check, Outcome, Progression } from '../learning/session';
import { recordOutcome, type MasteryRule } from '../modes/progress';
import type { ModeProgress } from '../modes/state';
import { isWord, WORDS, type Word } from './words/list';
import type { Level } from './words/problems';

/** Shown on Home in this order: each kind on the top row opens the one below it. */
export const MODE_IDS = ['hear', 'hunt', 'spell', 'read', 'sentence', 'fill'] as const;
export type ModeId = (typeof MODE_IDS)[number];
export const MODE_NAMES = {
  hear: 'Find It', hunt: 'Word Hunt', spell: 'Build It', read: 'Read It', sentence: 'Sentence Hunt', fill: 'Fill the Gap',
} as const;
export type ModeName = (typeof MODE_NAMES)[ModeId];
/** A kind opens when the one before it reaches Level 2; the rest are open from the start. */
export const OPENS_AFTER: Record<ModeId, ModeId | null> = { hear: null, hunt: null, spell: null, read: 'hear', sentence: 'hunt', fill: 'spell' };
/** Spoken when he taps a kind that is still locked. */
export const LOCKED_HINTS = {
  read: 'Play more Find It to open this!', sentence: 'Play more Word Hunt to open this!', fill: 'Play more Build It to open this!',
} as const;
export type LockedHint = (typeof LOCKED_HINTS)[keyof typeof LOCKED_HINTS];

export interface LearningState {
  modes: Record<ModeId, ModeProgress>;
  /** The words he has met, in the order he met them. */
  words: Word[];
  /** Questions right on the first try since he met the last word. */
  sinceWord: number;
  /** How well he knows each word he has met, 0 to 5. */
  strength: Partial<Record<Word, number>>;
}

/** Right answers on the first try, after meeting one word, before the next may come (fewer for the first set, so the
 * first Rounds aren't all one word). */
export const WORD_GAP = 5, FIRST_GAP = 3;
const gapAfter = (known: number) => (known < 5 ? FIRST_GAP : WORD_GAP);
/** A word is shaky below this strength; the next word waits while more than SHAKY_MAX are. */
export const SHAKY_BELOW = 2, SHAKY_MAX = 2, TOP_STRENGTH = 5;

export const strengthOf = (state: Pick<LearningState, 'strength'>, w: Word) => state.strength[w] ?? 0;
export const shaky = (state: Pick<LearningState, 'words' | 'strength'>) => state.words.filter(w => strengthOf(state, w) < SHAKY_BELOW);
/** The next word on the list he hasn't met. */
export const nextWord = (state: Pick<LearningState, 'words'>): Word | undefined => WORDS.find(w => !state.words.includes(w));
/** The words a question may use: the ones he has met, and the next one when it's time (he meets it first). */
export function wordsFor(state: Pick<LearningState, 'words' | 'sinceWord' | 'strength'>): Word[] {
  const next = nextWord(state);
  const due = !state.words.length || (state.sinceWord >= gapAfter(state.words.length) && shaky(state).length <= SHAKY_MAX);
  return next && due ? [...state.words, next] : state.words;
}

/** 16 of the last 20 right on the first try, or the last 10 in a row. */
export const WORD_RULE: MasteryRule = { window: 20, mastery: 16, streak: 10, top: 3 };

export const freshMode = (id: ModeId): ModeProgress => ({ level: 1, window: [], opened: OPENS_AFTER[id] === null, starred: false, introPending: false, fresh: false });
const eachMode = (f: (id: ModeId) => ModeProgress) => Object.fromEntries(MODE_IDS.map(id => [id, f(id)])) as Record<ModeId, ModeProgress>;
export const freshLearning = (): LearningState => ({ modes: eachMode(freshMode), words: [], sinceWord: 0, strength: {} });

type Raw = Record<string, unknown>;
const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);
const bool = (x: unknown, fallback: boolean) => (typeof x === 'boolean' ? x : fallback);
const OUTCOMES: readonly Outcome[] = ['clean', 'helped', 'missed'];
const count = (x: unknown, max = Infinity) => (typeof x === 'number' && Number.isInteger(x) && x >= 0 ? Math.min(x, max) : 0);

function readMode(id: ModeId, raw: unknown): ModeProgress {
  const f = freshMode(id);
  if (!isRecord(raw)) return f;
  return {
    level: ([1, 2, 3] as const).find(l => l === raw.level) ?? f.level,
    window: Array.isArray(raw.window) ? raw.window.filter((o): o is Outcome => OUTCOMES.includes(o as Outcome)).slice(-WORD_RULE.window) : f.window,
    opened: bool(raw.opened, f.opened), starred: bool(raw.starred, f.starred), introPending: false, fresh: bool(raw.fresh, f.fresh),
  };
}

export function readLearning(raw: unknown): LearningState {
  const data = isRecord(raw) ? raw : {}, modes = isRecord(data.modes) ? data.modes : {};
  const words = Array.isArray(data.words) ? [...new Set(data.words.filter(isWord))] : [];
  const rawStrength = isRecord(data.strength) ? data.strength : {};
  const strength: Partial<Record<Word, number>> = {};
  for (const w of words) if (w in rawStrength) strength[w] = count(rawStrength[w], TOP_STRENGTH);
  return { modes: eachMode(id => readMode(id, modes[id])), words, sinceWord: count(data.sinceWord), strength };
}

/** A Round starts: newly opened kinds have been seen. */
export const startPractice = (state: LearningState): LearningState =>
  ({ ...state, modes: eachMode(id => ({ ...state.modes[id], fresh: false })) });

export type LearningChange =
  | { kind: 'levelUp'; mode: ModeId; level: 2 | 3 }
  | { kind: 'open'; mode: ModeId }
  | { kind: 'star'; mode: ModeId };

/** Which kind of question was solved, about which word, and whether it was asked at his Level (`push`); or the word he just met. */
export type Asked = { readonly mode: ModeId; readonly push: boolean; readonly word: Word } | { readonly meet: Word };

const STEP: Record<Outcome, number> = { clean: 1, helped: -1, missed: -2 };

export const recordSolved: Progression<LearningState, Asked, LearningChange> = (prior, asked, result) => {
  if ('meet' in asked) {
    const words = prior.words.includes(asked.meet) ? prior.words : [...prior.words, asked.meet];
    return { state: { ...prior, words, sinceWord: 0, strength: { ...prior.strength, [asked.meet]: strengthOf(prior, asked.meet) } }, changes: [] };
  }
  const { mode: id, push, word } = asked, outcome = result.outcome;
  const strength = prior.words.includes(word)
    ? { ...prior.strength, [word]: Math.max(0, Math.min(TOP_STRENGTH, strengthOf(prior, word) + STEP[outcome])) }
    : prior.strength;
  const state = { ...prior, strength, sinceWord: outcome === 'clean' ? prior.sinceWord + 1 : prior.sinceWord };
  if (!push) return { state, changes: [] };
  const recorded = recordOutcome(state.modes[id], outcome, WORD_RULE), event = recorded.event;
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
