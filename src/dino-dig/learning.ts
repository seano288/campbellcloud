// What Dino Dig asks, and his progress. As in Math Bots, Rover Code and Word Wreckers there is no picking: every Round mixes the kinds
// he has opened, and each kind keeps its own Level (1 to 3), raised by Mastery and never lowered. Only questions asked at his Level
// count, and a replayed miss never does. No Tune-Up: the quick Mastery rule for a kind's first questions places him.
//
// The words come by Pattern, in the list's order (words/list.ts, shared with Word Wreckers), as Sight Squad's words come by set: each Pattern is met
// before it's asked (a short spoken introduction with three example words, its sounds lit), the next one joins after PATTERN_GAP more
// answers right on the first try, and waits while any Pattern he has met is still shaky. Each Pattern keeps a strength from 0 to 5: up
// one on a first-try answer, down one with help, down two on a miss. Questions pick words from weak and new Patterns more often.
// A Level is how hard the question is, not which Pattern it uses.
import type { Check, Outcome, Progression } from '../learning/session';
import { recordOutcome, type MasteryRule } from '../modes/progress';
import type { ModeProgress } from '../modes/state';
import { PATTERN_IDS, type PatternId } from './words/list';
import type { Kind } from './reading/problems';

/** Shown on Home in this order, which is also the order he meets them in. */
export const MODE_IDS = ['read', 'hear', 'swap', 'real', 'sentence'] as const satisfies readonly Kind[];
export type ModeId = (typeof MODE_IDS)[number];
export const MODE_NAMES = { read: 'Read It', hear: 'Hear It', swap: 'Sound Swap', real: 'Real or Silly', sentence: 'Read and Find' } as const;
export type ModeName = (typeof MODE_NAMES)[ModeId];

/** A kind opens when all of these reach Level 2. Empty: open from the start. */
export const OPENS_AFTER: Record<ModeId, readonly ModeId[]> = { read: [], hear: [], swap: ['hear'], real: ['read'], sentence: ['read', 'hear'] };
export const OPENS_AT_LEVEL = 2;

/** Spoken when he taps a kind that is still locked. */
export const LOCKED_HINTS = {
  swap: 'Play more Hear It to open this!',
  real: 'Play more Read It to open this!',
  sentence: 'Play more Read It and Hear It to open this!',
} as const satisfies Partial<Record<ModeId, string>>;

// ---------- Mastery ----------

/** 16 of the last 20 right on the first try, or the last 10 in a row. */
export const SLOW_RULE: MasteryRule = { window: 20, mastery: 16, streak: 10, top: 3 };
/** For the first questions of a kind: he starts at Level 1, so one who already knows it clears a Level in 6. */
export const FAST_RULE: MasteryRule = { window: 10, mastery: 8, streak: 6, top: 3 };
export const FAST_PUSHED = 30;
export const ruleFor = (pushed: number) => (pushed < FAST_PUSHED ? FAST_RULE : SLOW_RULE);

// ---------- Patterns ----------

/** Right answers on the first try, after meeting a Pattern, before the next may come. */
export const PATTERN_GAP = 8;
/** A Pattern is shaky below this strength; the next one waits while any he has met is. */
export const SHAKY_BELOW = 2, TOP_STRENGTH = 5;
const STEP: Record<Outcome, number> = { clean: 1, helped: -1, missed: -2 };

// ---------- the save ----------

export interface LearningState {
  modes: Record<ModeId, ModeProgress>;
  /** Questions asked at his Level, per kind: the first FAST_PUSHED use the quicker rule. */
  pushed: Record<ModeId, number>;
  /** The Patterns he has met, in order. */
  patterns: PatternId[];
  /** Right on the first try since he met the last Pattern. */
  sinceMeet: number;
  /** How well he knows each Pattern he has met, 0 to 5. */
  strength: Partial<Record<PatternId, number>>;
}

export const freshMode = (id: ModeId): ModeProgress => ({ level: 1, window: [], opened: OPENS_AFTER[id].length === 0, starred: false, introPending: false, fresh: false });
const eachMode = <T,>(f: (id: ModeId) => T) => Object.fromEntries(MODE_IDS.map(id => [id, f(id)])) as Record<ModeId, T>;
export const freshLearning = (): LearningState => ({ modes: eachMode(freshMode), pushed: eachMode(() => 0), patterns: [], sinceMeet: 0, strength: {} });

export const strengthOf = (s: Pick<LearningState, 'strength'>, p: PatternId) => s.strength[p] ?? 0;
/** The next Pattern on the list he hasn't met. */
export const nextPattern = (s: Pick<LearningState, 'patterns'>): PatternId | undefined => PATTERN_IDS.find(p => !s.patterns.includes(p));
/** Time to meet the next Pattern: none met yet, or enough first-try answers since the last and none of his shaky. */
export const patternDue = (s: Pick<LearningState, 'patterns' | 'sinceMeet' | 'strength'>) =>
  nextPattern(s) !== undefined && (!s.patterns.length || (s.sinceMeet >= PATTERN_GAP && s.patterns.every(p => strengthOf(s, p) >= SHAKY_BELOW)));

type Raw = Record<string, unknown>;
const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);
const bool = (x: unknown, fallback: boolean) => (typeof x === 'boolean' ? x : fallback);
const OUTCOMES: readonly Outcome[] = ['clean', 'helped', 'missed'];
const count = (x: unknown, max = Infinity) => (typeof x === 'number' && Number.isInteger(x) && x >= 0 ? Math.min(x, max) : 0);
const isPattern = (x: unknown): x is PatternId => (PATTERN_IDS as readonly unknown[]).includes(x);

function readMode(id: ModeId, raw: unknown): ModeProgress {
  const f = freshMode(id);
  if (!isRecord(raw)) return f;
  return {
    level: ([1, 2, 3] as const).find(l => l === raw.level) ?? f.level,
    window: Array.isArray(raw.window) ? raw.window.filter((o): o is Outcome => OUTCOMES.includes(o as Outcome)).slice(-SLOW_RULE.window) : f.window,
    opened: bool(raw.opened, f.opened), starred: bool(raw.starred, f.starred), introPending: false, fresh: bool(raw.fresh, f.fresh),
  };
}

/** Reads a save of any age: whatever is missing or doesn't read comes back fresh, and a kind he has earned is opened. Patterns are met
 *  in order, so a save that lists a later one without an earlier one keeps only the run from the start. */
export function readLearning(raw: unknown): LearningState {
  const data = isRecord(raw) ? raw : {}, modes = isRecord(data.modes) ? data.modes : {}, pushed = isRecord(data.pushed) ? data.pushed : {};
  const listed = Array.isArray(data.patterns) ? data.patterns.filter(isPattern) : [];
  const patterns: PatternId[] = [];
  for (const p of PATTERN_IDS) { if (listed.includes(p)) patterns.push(p); else break; }
  const rawStrength = isRecord(data.strength) ? data.strength : {}, strength: Partial<Record<PatternId, number>> = {};
  for (const p of patterns) strength[p] = count(rawStrength[p], TOP_STRENGTH);
  const read: LearningState = { modes: eachMode(id => readMode(id, modes[id])), pushed: eachMode(id => count(pushed[id])), patterns, sinceMeet: count(data.sinceMeet), strength };
  openReady(read.modes);
  return read;
}

/** A Round starts: newly opened kinds have been seen. */
export const startPractice = (state: LearningState): LearningState => ({ ...state, modes: eachMode(id => ({ ...state.modes[id], fresh: false })) });

// ---------- what a solved question changes ----------

export type LearningChange =
  | { kind: 'levelUp'; mode: ModeId; level: 2 | 3 }
  | { kind: 'open'; mode: ModeId }
  | { kind: 'star'; mode: ModeId }
  | { kind: 'met'; pattern: PatternId };

/** Which kind was solved, about a word of which Pattern, and whether it counts toward Mastery; or the Pattern he just met. */
export type Asked = { readonly mode: ModeId; readonly push: boolean; readonly pattern: PatternId } | { readonly meet: PatternId };

/** Opens every locked kind whose parents are open and have reached Level 2. */
function openReady(modes: Record<ModeId, ModeProgress>): LearningChange[] {
  const changes: LearningChange[] = [];
  for (const id of MODE_IDS) {
    const parents = OPENS_AFTER[id];
    if (modes[id].opened || !parents.length || !parents.every(p => modes[p].opened && modes[p].level >= OPENS_AT_LEVEL)) continue;
    modes[id] = { ...modes[id], opened: true, fresh: true };
    changes.push({ kind: 'open', mode: id });
  }
  return changes;
}

export const recordSolved: Progression<LearningState, Asked, LearningChange> = (prior, asked, result) => {
  if ('meet' in asked) {
    if (prior.patterns.includes(asked.meet)) return { state: prior, changes: [] };
    return { state: { ...prior, patterns: [...prior.patterns, asked.meet], sinceMeet: 0, strength: { ...prior.strength, [asked.meet]: 0 } }, changes: [{ kind: 'met', pattern: asked.meet }] };
  }
  const { mode: id, push, pattern } = asked, outcome = result.outcome;
  const strength = prior.patterns.includes(pattern)
    ? { ...prior.strength, [pattern]: Math.max(0, Math.min(TOP_STRENGTH, strengthOf(prior, pattern) + STEP[outcome])) }
    : prior.strength;
  const state = { ...prior, strength, sinceMeet: outcome === 'clean' ? prior.sinceMeet + 1 : prior.sinceMeet };
  if (!push) return { state, changes: [] };
  const changes: LearningChange[] = [];
  const pushed = { ...state.pushed, [id]: state.pushed[id] + 1 };
  const recorded = recordOutcome(state.modes[id], outcome, ruleFor(state.pushed[id]));
  const modes = { ...state.modes, [id]: { ...recorded.mode, introPending: false } };
  if (recorded.event === 'levelUp') changes.push({ kind: 'levelUp', mode: id, level: modes[id].level as 2 | 3 }, ...openReady(modes));
  if (recorded.event === 'star') changes.push({ kind: 'star', mode: id });
  return { state: { ...state, modes, pushed }, changes };
};

export type Explanation<P> = (problem: P, answer: string, teach: boolean, signal: AbortSignal) => Promise<void>;
export const verdict = <P,>(correct: boolean, problem: P, answer: string, explain: Explanation<P>): Check =>
  correct ? { kind: 'correct' } : { kind: 'incorrect', explain: (teach, signal) => explain(problem, answer, teach, signal) };
