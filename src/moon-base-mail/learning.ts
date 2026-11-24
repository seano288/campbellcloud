// What Moon Base Mail asks, and his progress. As in the other games there is no picking: every Round mixes the kinds he has opened, and
// each kind keeps its own Level (1 to 3), raised by Mastery and never lowered. Only questions asked at his Level count, and a replayed
// miss never does.
//
// Placement copies Cargo Words: the first Rounds quietly probe Read the Mail and What Came Next three times each at Level 2 ("Tune-Up");
// three clean answers start that kind at Level 2, two misses stop the row. The first FAST_PUSHED questions of a kind use a quicker
// Mastery rule, so he climbs fast if he already reads well.
//
// The speaker rule is Sentence Express's What Happened rule: he reads the letter himself, and hearing a sentence (or a written answer)
// read aloud is help, so that answer is "helped": it earns no Mastery credit and no first-try Bolt. Every tap is counted in the save
// (`heard`), with how many answers were helped by listening, for the parent.
//
// The base words (mail/words.ts: moon, dome, the crew's names ...) are met in small groups, each in a short Meeting with its pictures and
// the voice, before the first question that uses them.
import type { Check, Outcome, Progression } from '../learning/session';
import { recordOutcome, type MasteryRule } from '../modes/progress';
import type { ModeProgress } from '../modes/state';
import { BASE_GROUP_COUNT } from './mail/words';
import { KINDS, type Kind, type Level } from './mail/types';

/** Shown on Home in this order, which is also the order he meets them in. */
export const MODE_IDS = KINDS;
export type ModeId = Kind;
export const MODE_NAMES = { ask: 'Read the Mail', order: 'What Came Next', main: 'Big Idea', infer: 'Clue Finder', fact: 'Fact File' } as const;
export type ModeName = (typeof MODE_NAMES)[ModeId];

/** A kind opens when all of these reach Level 2. Empty: open from the start. */
export const OPENS_AFTER: Record<ModeId, readonly ModeId[]> = { ask: [], order: [], main: ['ask'], infer: ['ask'], fact: ['order'] };
export const OPENS_AT_LEVEL = 2;
export const LOCKED_HINTS = {
  main: 'Play more Read the Mail to open this!',
  infer: 'Play more Read the Mail to open this!',
  fact: 'Play more What Came Next to open this!',
} as const satisfies Partial<Record<ModeId, string>>;

/** A Meeting shows one group of base words. */
export const MEETINGS = Array.from({ length: BASE_GROUP_COUNT }, (_, i) => `g${i}` as const);
export type MeetingId = (typeof MEETINGS)[number];

// ---------- Mastery ----------

/** 16 of the last 20 right on the first try, or the last 10 in a row. */
export const SLOW_RULE: MasteryRule = { window: 20, mastery: 16, streak: 10, top: 3 };
/** For the first questions of a kind: he's placed low, so one who already has it clears a Level in 6. */
export const FAST_RULE: MasteryRule = { window: 10, mastery: 8, streak: 6, top: 3 };
export const FAST_PUSHED = 30;
export const ruleFor = (pushed: number) => (pushed < FAST_PUSHED ? FAST_RULE : SLOW_RULE);

// ---------- placement ----------

export const ANCHORS = ['ask', 'order'] as const satisfies readonly ModeId[];
export type Anchor = (typeof ANCHORS)[number];
export interface Row { asked: number; clean: number; misses: number }
export const PROBES_PER_ROW = 3, ROW_STOPS_AT = 2, PROBE_LEVEL: Level = 2;
export const rowOpen = (r: Row) => r.asked < PROBES_PER_ROW && r.misses < ROW_STOPS_AT;
export const tuneUpOver = (s: Pick<LearningState, 'tuneUp'>) => !ANCHORS.some(a => rowOpen(s.tuneUp[a]));

// ---------- the save ----------

/** How often he has the letter read to him (Sentence Express's rule makes each of these answers "helped"). */
export interface Heard {
  /** Taps on a sentence's speaker. */
  sentences: number;
  /** Taps on a written answer's speaker. */
  choices: number;
  /** Questions he answered, and how many of them he had read to him first. */
  answered: number;
  helped: number;
}

/** How many letters must come between two askings of the same one (the brief's rule). */
export const LETTER_GAP = 20;
/** The letters asked, newest last (kept a little longer than the gap). */
export const RECENT_KEPT = 40;

export interface LearningState {
  modes: Record<ModeId, ModeProgress>;
  pushed: Record<ModeId, number>;
  met: MeetingId[];
  tuneUp: Record<Anchor, Row>;
  /** The letters asked lately, newest last, and the question each was asked last time (so it isn't asked the same way twice running). */
  recent: string[];
  lastQ: Record<string, number>;
  heard: Heard;
}

export const freshMode = (id: ModeId): ModeProgress => ({ level: 1, window: [], opened: OPENS_AFTER[id].length === 0, starred: false, introPending: false, fresh: false });
const eachMode = <T,>(f: (id: ModeId) => T) => Object.fromEntries(MODE_IDS.map(id => [id, f(id)])) as Record<ModeId, T>;
const eachAnchor = <T,>(f: (id: Anchor) => T) => Object.fromEntries(ANCHORS.map(id => [id, f(id)])) as Record<Anchor, T>;
export const freshHeard = (): Heard => ({ sentences: 0, choices: 0, answered: 0, helped: 0 });
export const freshLearning = (): LearningState => ({
  modes: eachMode(freshMode), pushed: eachMode(() => 0), met: [], tuneUp: eachAnchor(() => ({ asked: 0, clean: 0, misses: 0 })),
  recent: [], lastQ: {}, heard: freshHeard(),
});

type Raw = Record<string, unknown>;
const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);
const bool = (x: unknown, fallback: boolean) => (typeof x === 'boolean' ? x : fallback);
const OUTCOMES: readonly Outcome[] = ['clean', 'helped', 'missed'];
const count = (x: unknown, max = Number.MAX_SAFE_INTEGER) => (typeof x === 'number' && Number.isInteger(x) && x >= 0 ? Math.min(x, max) : 0);

function readMode(id: ModeId, raw: unknown): ModeProgress {
  const f = freshMode(id);
  if (!isRecord(raw)) return f;
  return {
    level: ([1, 2, 3] as const).find(l => l === raw.level) ?? f.level,
    window: Array.isArray(raw.window) ? raw.window.filter((o): o is Outcome => OUTCOMES.includes(o as Outcome)).slice(-SLOW_RULE.window) : f.window,
    opened: bool(raw.opened, f.opened), starred: bool(raw.starred, f.starred), introPending: false, fresh: bool(raw.fresh, f.fresh),
  };
}

/** Reads a save of any age: whatever is missing or doesn't read comes back fresh, and a kind he has earned is opened. `isLetter` tells a
 *  letter id this build still has. */
export function readLearning(raw: unknown, isLetter: (id: string) => boolean = () => true): LearningState {
  const data = isRecord(raw) ? raw : {}, modes = isRecord(data.modes) ? data.modes : {}, pushed = isRecord(data.pushed) ? data.pushed : {};
  const rows = isRecord(data.tuneUp) ? data.tuneUp : {}, lastQ = isRecord(data.lastQ) ? data.lastQ : {}, heard = isRecord(data.heard) ? data.heard : {};
  const read: LearningState = {
    modes: eachMode(id => readMode(id, modes[id])),
    pushed: eachMode(id => count(pushed[id])),
    met: Array.isArray(data.met) ? MEETINGS.filter(m => (data.met as unknown[]).includes(m)) : [],
    tuneUp: eachAnchor(id => { const r = rows[id]; return isRecord(r) ? { asked: count(r.asked, PROBES_PER_ROW), clean: count(r.clean, PROBES_PER_ROW), misses: count(r.misses) } : { asked: 0, clean: 0, misses: 0 }; }),
    recent: Array.isArray(data.recent) ? data.recent.filter((x): x is string => typeof x === 'string' && isLetter(x)).slice(-RECENT_KEPT) : [],
    lastQ: Object.fromEntries(Object.entries(lastQ).filter(([k, v]) => isLetter(k) && Number.isInteger(v) && (v as number) >= 0 && (v as number) < 3)) as Record<string, number>,
    heard: { sentences: count(heard.sentences), choices: count(heard.choices), answered: count(heard.answered), helped: count(heard.helped) },
  };
  openReady(read.modes);
  return read;
}

/** A Round starts: newly opened kinds have been seen. */
export const startPractice = (state: LearningState): LearningState => ({ ...state, modes: eachMode(id => ({ ...state.modes[id], fresh: false })) });

/** A letter was asked with this question: it goes to the back of the line. */
export const noteAsked = (state: LearningState, id: string, qi: number): LearningState =>
  ({ ...state, recent: [...state.recent.filter(x => x !== id), id].slice(-RECENT_KEPT), lastQ: { ...state.lastQ, [id]: qi } });
/** He tapped a speaker. */
export const noteHeard = (state: LearningState, what: 'sentences' | 'choices'): LearningState => ({ ...state, heard: { ...state.heard, [what]: state.heard[what] + 1 } });

// ---------- what a solved question changes ----------

export type LearningChange = { kind: 'levelUp'; mode: ModeId; level: 2 | 3 } | { kind: 'open'; mode: ModeId } | { kind: 'star'; mode: ModeId };

/** Which kind was solved and how it counts (and whether he listened), or the Meeting he just had. */
export type Asked = { readonly meet: MeetingId } | { readonly mode: ModeId; readonly push: boolean; readonly probe?: Anchor; readonly letter?: string; readonly qi?: number; readonly listened?: boolean };

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
  if ('meet' in asked) return { state: { ...prior, met: prior.met.includes(asked.meet) ? prior.met : [...prior.met, asked.meet] }, changes: [] };
  const { mode: id, push, probe } = asked, outcome = result.outcome;
  let state: LearningState = {
    ...prior,
    heard: { ...prior.heard, answered: prior.heard.answered + 1, helped: prior.heard.helped + (asked.listened ? 1 : 0) },
  };
  if (asked.letter !== undefined && asked.qi !== undefined) state = noteAsked(state, asked.letter, asked.qi);
  const changes: LearningChange[] = [];
  if (probe) {
    const r = state.tuneUp[probe], row = { asked: r.asked + 1, clean: r.clean + (outcome === 'clean' ? 1 : 0), misses: r.misses + result.misses };
    const modes = { ...state.modes };
    if (row.clean === PROBES_PER_ROW && modes[probe].level < 2) {
      modes[probe] = { ...modes[probe], level: 2, window: [] };
      changes.push({ kind: 'levelUp', mode: probe, level: 2 }, ...openReady(modes));
    }
    state = { ...state, modes, tuneUp: { ...state.tuneUp, [probe]: row } };
  }
  if (!push) return { state, changes };
  const pushed = { ...state.pushed, [id]: state.pushed[id] + 1 };
  const recorded = recordOutcome(state.modes[id], outcome, ruleFor(state.pushed[id]));
  const modes = { ...state.modes, [id]: { ...recorded.mode, introPending: false } };
  if (recorded.event === 'levelUp') changes.push({ kind: 'levelUp', mode: id, level: modes[id].level as 2 | 3 }, ...openReady(modes));
  if (recorded.event === 'star') changes.push({ kind: 'star', mode: id });
  return { state: { ...state, modes, pushed }, changes };
};

export type Explanation<P> = (problem: P, answer: string, teach: boolean, signal: AbortSignal) => Promise<void>;
export const verdict = <P>(correct: boolean, problem: P, answer: string, explain: Explanation<P>): Check =>
  correct ? { kind: 'correct' } : { kind: 'incorrect', explain: (teach, signal) => explain(problem, answer, teach, signal) };
