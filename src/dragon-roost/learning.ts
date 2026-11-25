// What Dragon Roost asks, and his progress. As in Math Bots, Globe Hopper and Sentence Express there is no picking: every Round mixes the
// kinds he has opened, and each kind keeps its own Level (1 to 3), raised by Mastery and never lowered. Only questions asked at his Level
// count, and a replayed miss never does.
//
// No Tune-Up (as Sentence Express): the quick Mastery rule for a kind's first questions places him instead.
//
// Each kind is met in a short spoken Meeting before its first question (as Math Bots meets a new picture): the Nouns Meeting says what a
// noun is and meets the dragon words (dragon, egg, roost, wing, flame), the Verbs Meeting has the dragon fly, roar, glide, flap, loop and
// dive, and so on. Nouns is met before anything else, so the dragon words are met before any sentence uses them.
//
// A word or sentence is not asked again until at least twenty others have been: the last RECENT topics are kept in the save.
import type { Check, Outcome, Progression } from '../learning/session';
import { recordOutcome, type MasteryRule } from '../modes/progress';
import type { ModeProgress } from '../modes/state';
import { TERMS } from './words/terms';

/** Shown on Home in this order, which is also the order he meets them in. */
export const MODE_IDS = ['noun', 'verb', 'adj', 'plural', 'past', 'squeeze', 'capital'] as const;
export type ModeId = (typeof MODE_IDS)[number];
export const MODE_NAMES = {
  noun: TERMS.noun.kind, verb: TERMS.verb.kind, adj: TERMS.adj.kind, plural: 'More Than One', past: 'Yesterday', squeeze: 'Squeeze', capital: 'Big Letters',
} as const;
export type ModeName = (typeof MODE_NAMES)[ModeId];

/** A kind opens when all of these reach Level 2. Empty: open from the start. */
export const OPENS_AFTER: Record<ModeId, readonly ModeId[]> = { noun: [], verb: [], adj: ['noun'], plural: ['noun'], past: ['verb'], squeeze: ['verb'], capital: ['adj'] };
export const OPENS_AT_LEVEL = 2;

/** Spoken when he taps a kind that is still locked. */
export const LOCKED_HINTS = {
  adj: TERMS.noun.playMore, plural: TERMS.noun.playMore, past: TERMS.verb.playMore, squeeze: TERMS.verb.playMore, capital: TERMS.adj.playMore,
} as const satisfies Partial<Record<ModeId, string>>;

/** Every kind has a Meeting before its first question. */
export type MeetingId = ModeId;
/** The Meetings a question needs: Nouns first (it meets the dragon words), then its own. */
export const meetingFor = (kind: ModeId, met: readonly MeetingId[]): MeetingId | null =>
  (['noun', kind] as const).find(m => !met.includes(m)) ?? null;

// ---------- Mastery ----------

/** 16 of the last 20 right on the first try, or the last 10 in a row. */
export const SLOW_RULE: MasteryRule = { window: 20, mastery: 16, streak: 10, top: 3 };
/** For the first questions of a kind: he starts at Level 1, so one who already knows it clears a Level in 6. */
export const FAST_RULE: MasteryRule = { window: 10, mastery: 8, streak: 6, top: 3 };
export const FAST_PUSHED = 30;
export const ruleFor = (pushed: number) => (pushed < FAST_PUSHED ? FAST_RULE : SLOW_RULE);

/** A word or sentence comes back only after this many others. The save keeps a few more than that. */
export const NOT_AGAIN_FOR = 20;
export const RECENT_KEPT = 40;

// ---------- the save ----------

export interface LearningState {
  modes: Record<ModeId, ModeProgress>;
  /** Questions asked at his Level, per kind: the first FAST_PUSHED use the quicker rule. */
  pushed: Record<ModeId, number>;
  met: MeetingId[];
  /** The words and sentences asked lately, oldest first. */
  recent: string[];
}

export const freshMode = (id: ModeId): ModeProgress => ({ level: 1, window: [], opened: OPENS_AFTER[id].length === 0, starred: false, introPending: false, fresh: false });
const eachMode = <T,>(f: (id: ModeId) => T) => Object.fromEntries(MODE_IDS.map(id => [id, f(id)])) as Record<ModeId, T>;
export const freshLearning = (): LearningState => ({ modes: eachMode(freshMode), pushed: eachMode(() => 0), met: [], recent: [] });

type Raw = Record<string, unknown>;
const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);
const bool = (x: unknown, fallback: boolean) => (typeof x === 'boolean' ? x : fallback);
const OUTCOMES: readonly Outcome[] = ['clean', 'helped', 'missed'];
const count = (x: unknown) => (typeof x === 'number' && Number.isInteger(x) && x >= 0 ? x : 0);

function readMode(id: ModeId, raw: unknown): ModeProgress {
  const f = freshMode(id);
  if (!isRecord(raw)) return f;
  return {
    level: ([1, 2, 3] as const).find(l => l === raw.level) ?? f.level,
    window: Array.isArray(raw.window) ? raw.window.filter((o): o is Outcome => OUTCOMES.includes(o as Outcome)).slice(-SLOW_RULE.window) : f.window,
    opened: bool(raw.opened, f.opened), starred: bool(raw.starred, f.starred), introPending: false, fresh: bool(raw.fresh, f.fresh),
  };
}

/** Reads a save of any age: whatever is missing or doesn't read comes back fresh, and a kind he has earned is opened. */
export function readLearning(raw: unknown): LearningState {
  const data = isRecord(raw) ? raw : {}, modes = isRecord(data.modes) ? data.modes : {}, pushed = isRecord(data.pushed) ? data.pushed : {};
  const read: LearningState = {
    modes: eachMode(id => readMode(id, modes[id])),
    pushed: eachMode(id => count(pushed[id])),
    met: Array.isArray(data.met) ? MODE_IDS.filter(m => (data.met as unknown[]).includes(m)) : [],
    recent: Array.isArray(data.recent) ? data.recent.filter((t): t is string => typeof t === 'string' && t.length < 200).slice(-RECENT_KEPT) : [],
  };
  openReady(read.modes);
  return read;
}

/** A Round starts: newly opened kinds have been seen. */
export const startPractice = (state: LearningState): LearningState => ({ ...state, modes: eachMode(id => ({ ...state.modes[id], fresh: false })) });

// ---------- what a solved question changes ----------

export type LearningChange =
  | { kind: 'levelUp'; mode: ModeId; level: 2 | 3 }
  | { kind: 'open'; mode: ModeId }
  | { kind: 'star'; mode: ModeId };

/** Which kind was solved, whether it counts toward Mastery and what it asked; or the Meeting he just had. */
export type Asked = { readonly meet: MeetingId } | { readonly mode: ModeId; readonly push: boolean; readonly topic: string };

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

export const remember = (recent: readonly string[], topic: string) => [...recent.filter(t => t !== topic), topic].slice(-RECENT_KEPT);

export const recordSolved: Progression<LearningState, Asked, LearningChange> = (prior, asked, result) => {
  if ('meet' in asked) return { state: { ...prior, met: prior.met.includes(asked.meet) ? prior.met : [...prior.met, asked.meet] }, changes: [] };
  const { mode: id, push, topic } = asked;
  const state = { ...prior, recent: remember(prior.recent, topic) };
  if (!push) return { state, changes: [] };
  const changes: LearningChange[] = [];
  const pushed = { ...state.pushed, [id]: state.pushed[id] + 1 };
  const recorded = recordOutcome(state.modes[id], result.outcome, ruleFor(state.pushed[id]));
  const modes = { ...state.modes, [id]: { ...recorded.mode, introPending: false } };
  if (recorded.event === 'levelUp') changes.push({ kind: 'levelUp', mode: id, level: modes[id].level as 2 | 3 }, ...openReady(modes));
  if (recorded.event === 'star') changes.push({ kind: 'star', mode: id });
  return { state: { ...state, modes, pushed }, changes };
};

export type Explanation<P> = (problem: P, answer: string, teach: boolean, signal: AbortSignal) => Promise<void>;
export const verdict = <P,>(correct: boolean, problem: P, answer: string, explain: Explanation<P>): Check =>
  correct ? { kind: 'correct' } : { kind: 'incorrect', explain: (teach, signal) => explain(problem, answer, teach, signal) };
