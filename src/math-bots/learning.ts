// What Math Bots asks, and his progress. As in Chop Chop and Sight Squad there is no picking: every Round mixes the kinds he
// has opened, and each kind keeps its own Level, raised by Mastery (src/modes/progress.ts). Only questions asked at his Level
// count, and a replayed miss never does.
//
// Three things are different here, and live here rather than in the shared code, so no other game changes:
//  - A kind can need several parents, each at its own Level (OPENS_AFTER, OPENS_AT): Over Ten needs two.
//  - Placement: nobody sets a Level by hand. The first Rounds quietly probe five anchors ("Tune-Up"). Since Levels never go
//    down it places low, and the first FAST_PUSHED questions of a kind use a quicker Mastery rule so he climbs fast.
//  - Facts keep a Strength, one per family (3+5, 5+3, 8-3 and 8-5 are one family), like Sight Squad's words.
import type { Check, Outcome, Progression } from '../learning/session';
import { recordOutcome, type MasteryRule } from '../modes/progress';
import type { ModeProgress } from '../modes/state';
import { crossingFacts, factsFor, type Kind, type Level, type Pair, type StoryId } from './numbers/problems';

/** Shown on Home in this order, which is also the order he meets them in. */
export const MODE_IDS = ['ten', 'on', 'story', 'facts', 'tens', 'part', 'skip', 'chart', 'measure', 'shape', 'scale', 'over', 'jump'] as const satisfies readonly Kind[];
export type ModeId = (typeof MODE_IDS)[number];
export const MODE_NAMES = {
  ten: 'Make Ten', on: 'Count On', story: 'Bot Stories', facts: 'Facts', tens: 'Tens and Ones',
  part: 'Missing Part', skip: 'Skip Count', scale: 'Weigh-In', over: 'Over Ten',
  chart: 'Number Chart', jump: 'Big Jumps', measure: 'Measure It', shape: 'Shapes',
} as const;
export type ModeName = (typeof MODE_NAMES)[ModeId];

/** A kind opens when all of these reach the Level in OPENS_AT (Level 2 unless it says otherwise). Empty: open from the start. */
export const OPENS_AFTER: Record<ModeId, readonly ModeId[]> = {
  ten: [], on: [], story: [], facts: ['ten'], tens: ['ten'], part: ['on'], skip: ['on'], scale: ['part'], over: ['ten', 'tens'],
  chart: ['on'], measure: ['story'], shape: ['facts'], jump: ['tens', 'chart'],
};
export const OPENS_AT: Partial<Record<ModeId, Partial<Record<ModeId, Level>>>> = { over: { ten: 3 }, jump: { tens: 3 } };
export const opensAt = (id: ModeId, parent: ModeId): Level => OPENS_AT[id]?.[parent] ?? 2;

/** Spoken when he taps a kind that is still locked. */
export const LOCKED_HINTS = {
  facts: 'Play more Make Ten to open this!', tens: 'Play more Make Ten to open this!',
  part: 'Play more Count On to open this!', skip: 'Play more Count On to open this!',
  scale: 'Play more Missing Part to open this!', over: 'Play more Make Ten and Tens and Ones to open this!',
  chart: 'Play more Count On to open this!', measure: 'Play more Bot Stories to open this!', shape: 'Play more Facts to open this!',
  jump: 'Play more Tens and Ones and Number Chart to open this!',
} as const satisfies Partial<Record<ModeId, string>>;

/** The visuals he meets before a question needs them. */
export const MEETINGS = ['frame', 'path', 'bond', 'rod', 'same', 'signs', 'chart', 'unit', 'sides', 'fill'] as const;
export type MeetingId = (typeof MEETINGS)[number];

// ---------- Mastery ----------

/** 16 of the last 20 right on the first try, or the last 10 in a row. */
export const SLOW_RULE: MasteryRule = { window: 20, mastery: 16, streak: 10, top: 3 };
/** For the first questions of a kind: he's placed low, so one who already has it clears a Level in 6. */
export const FAST_RULE: MasteryRule = { window: 10, mastery: 8, streak: 6, top: 3 };
export const FAST_PUSHED = 30;
export const ruleFor = (pushed: number) => (pushed < FAST_PUSHED ? FAST_RULE : SLOW_RULE);

// ---------- placement ----------

/** What the first Rounds probe, three questions each: three clean answers place him at Level 2. */
export const ANCHORS = ['ten', 'on', 'facts', 'tens', 'story'] as const satisfies readonly ModeId[];
export type Anchor = (typeof ANCHORS)[number];
export interface Row { asked: number; clean: number; misses: number }
export const PROBES_PER_ROW = 3, ROW_STOPS_AT = 2;
/** The Level each anchor is probed with. */
export const PROBE_LEVEL: Record<Anchor, Level> = { ten: 2, on: 1, facts: 2, tens: 1, story: 2 };
export const PROBE_STORIES: readonly StoryId[] = ['diffMore', 'addChange', 'putPart'];
export const rowOpen = (r: Row) => r.asked < PROBES_PER_ROW && r.misses < ROW_STOPS_AT;
export const tuneUpOver = (s: Pick<LearningState, 'tuneUp'>) => !ANCHORS.some(a => rowOpen(s.tuneUp[a]));

// ---------- Facts ----------

export interface FactsState {
  /** How well he knows each family he has met, 0 to 5. */
  strength: Record<string, number>;
  /** Right on the first try since the last family joined. */
  since: number;
}
export const factKey = ([a, b]: Pair) => `${Math.max(a, b)}+${Math.min(a, b)}`;
/** Each Level starts with this many families; the next joins after FACT_GAP clean answers, unless too many are shaky. */
export const FIRST_FACTS = 4, FACT_GAP = 3, SHAKY_BELOW = 2, SHAKY_MAX = 2, TOP_STRENGTH = 5;
export const strengthOf = (f: FactsState, key: string) => f.strength[key] ?? 0;
/** The families a Facts question may use at this Level. `crossing`: Over Ten is far enough along for the facts that cross ten to join Level 3. */
export function factsPool(f: FactsState, level: Level, crossing = false): Pair[] {
  const all = [...factsFor(level), ...(crossing && level === 3 ? crossingFacts() : [])], met = all.filter(p => factKey(p) in f.strength), rest = all.filter(p => !(factKey(p) in f.strength));
  if (met.length < FIRST_FACTS) return [...met, ...rest.slice(0, FIRST_FACTS - met.length)];
  const shaky = met.filter(p => strengthOf(f, factKey(p)) < SHAKY_BELOW).length;
  return rest.length && f.since >= FACT_GAP && shaky <= SHAKY_MAX ? [...met, rest[0]!] : met;
}
const FACT_STEP: Record<Outcome, number> = { clean: 1, helped: -1, missed: -2 };
/** Top Strength is for recall: it needs a clean answer that came quickly, though he's never told that or timed on screen. */
export function stepFact(f: FactsState, key: string, outcome: Outcome, quick: boolean): FactsState {
  const before = strengthOf(f, key), next = Math.max(0, Math.min(TOP_STRENGTH, before + FACT_STEP[outcome]));
  const after = quick || outcome !== 'clean' ? next : Math.min(next, Math.max(before, TOP_STRENGTH - 1));
  const joined = !(key in f.strength);
  return { strength: { ...f.strength, [key]: after }, since: joined ? 0 : outcome === 'clean' ? f.since + 1 : f.since };
}

// ---------- the save ----------

export interface LearningState {
  modes: Record<ModeId, ModeProgress>;
  /** Questions asked at his Level, per kind: the first FAST_PUSHED use the quicker rule. */
  pushed: Record<ModeId, number>;
  facts: FactsState;
  met: MeetingId[];
  tuneUp: Record<Anchor, Row>;
}

export const freshMode = (id: ModeId): ModeProgress => ({ level: 1, window: [], opened: OPENS_AFTER[id].length === 0, starred: false, introPending: false, fresh: false });
const eachMode = <T,>(f: (id: ModeId) => T) => Object.fromEntries(MODE_IDS.map(id => [id, f(id)])) as Record<ModeId, T>;
const eachAnchor = <T,>(f: (id: Anchor) => T) => Object.fromEntries(ANCHORS.map(id => [id, f(id)])) as Record<Anchor, T>;
export const freshLearning = (): LearningState => ({
  modes: eachMode(freshMode), pushed: eachMode(() => 0), facts: { strength: {}, since: 0 }, met: [],
  tuneUp: eachAnchor(() => ({ asked: 0, clean: 0, misses: 0 })),
});

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
    window: Array.isArray(raw.window) ? raw.window.filter((o): o is Outcome => OUTCOMES.includes(o as Outcome)).slice(-SLOW_RULE.window) : f.window,
    opened: bool(raw.opened, f.opened), starred: bool(raw.starred, f.starred), introPending: false, fresh: bool(raw.fresh, f.fresh),
  };
}

/** Reads a save of any age. Kinds added since it was written come back closed, so this opens the ones he has already earned: there may be no Level up left to do it. */
export function readLearning(raw: unknown): LearningState {
  const data = isRecord(raw) ? raw : {}, modes = isRecord(data.modes) ? data.modes : {}, pushed = isRecord(data.pushed) ? data.pushed : {};
  const facts = isRecord(data.facts) ? data.facts : {}, strength = isRecord(facts.strength) ? facts.strength : {}, rows = isRecord(data.tuneUp) ? data.tuneUp : {};
  const read: LearningState = {
    modes: eachMode(id => readMode(id, modes[id])),
    pushed: eachMode(id => count(pushed[id])),
    facts: { strength: Object.fromEntries(Object.entries(strength).filter(([k]) => /^\d+\+\d+$/.test(k)).map(([k, v]) => [k, count(v, TOP_STRENGTH)])), since: count(facts.since) },
    met: Array.isArray(data.met) ? MEETINGS.filter(m => (data.met as unknown[]).includes(m)) : [],
    tuneUp: eachAnchor(id => { const r = rows[id]; return isRecord(r) ? { asked: count(r.asked, PROBES_PER_ROW), clean: count(r.clean, PROBES_PER_ROW), misses: count(r.misses) } : { asked: 0, clean: 0, misses: 0 }; }),
  };
  if (read.tuneUp.tens.clean === PROBES_PER_ROW) openChart(read.modes);
  openReady(read.modes);
  return read;
}

/** A Round starts: newly opened kinds have been seen. */
export const startPractice = (state: LearningState): LearningState =>
  ({ ...state, modes: eachMode(id => ({ ...state.modes[id], fresh: false })) });

// ---------- what a solved question changes ----------

export type LearningChange =
  | { kind: 'levelUp'; mode: ModeId; level: 2 | 3 }
  | { kind: 'open'; mode: ModeId }
  | { kind: 'star'; mode: ModeId };

/** Which kind was solved and how it counts, or the Meeting he just had. */
export type Asked =
  | { readonly meet: MeetingId }
  | { readonly mode: ModeId; readonly push: boolean; readonly fact?: string; readonly quick?: boolean; readonly probe?: Anchor };

/** Opens every locked kind whose parents are open and have all reached their Levels. Tune-Up can place a kind that isn't open yet. */
function openReady(modes: Record<ModeId, ModeProgress>): LearningChange[] {
  const changes: LearningChange[] = [];
  for (const id of MODE_IDS) {
    const parents = OPENS_AFTER[id];
    if (modes[id].opened || !parents.length || !parents.every(p => modes[p].opened && modes[p].level >= opensAt(id, p))) continue;
    modes[id] = { ...modes[id], opened: true, fresh: true };
    changes.push({ kind: 'open', mode: id });
  }
  return changes;
}

function openChart(modes: Record<ModeId, ModeProgress>): LearningChange[] {
  if (modes.chart.opened) return [];
  modes.chart = { ...modes.chart, opened: true, fresh: true };
  return [{ kind: 'open', mode: 'chart' }];
}

/** Three clean probes: he starts this anchor at Level 2. Three clean teens open Tens and Ones, even before Make Ten does, and Number Chart. */
function place(modes: Record<ModeId, ModeProgress>, id: Anchor): LearningChange[] {
  const changes: LearningChange[] = [];
  if (modes[id].level < 2) modes[id] = { ...modes[id], level: 2, window: [] };
  if (id === 'tens' && !modes.tens.opened) { modes.tens = { ...modes.tens, opened: true, fresh: true }; changes.push({ kind: 'open', mode: 'tens' }); }
  if (id === 'tens') changes.push(...openChart(modes));
  if (modes[id].opened) changes.unshift({ kind: 'levelUp', mode: id, level: 2 });
  return [...changes, ...openReady(modes)];
}

export const recordSolved: Progression<LearningState, Asked, LearningChange> = (prior, asked, result) => {
  if ('meet' in asked) return { state: { ...prior, met: prior.met.includes(asked.meet) ? prior.met : [...prior.met, asked.meet] }, changes: [] };
  const { mode: id, push, fact, quick = false, probe } = asked, outcome = result.outcome;
  let state: LearningState = fact ? { ...prior, facts: stepFact(prior.facts, fact, outcome, quick) } : prior;
  const changes: LearningChange[] = [];
  if (probe) {
    const r = state.tuneUp[probe], row = { asked: r.asked + 1, clean: r.clean + (outcome === 'clean' ? 1 : 0), misses: r.misses + result.misses };
    const modes = { ...state.modes };
    if (row.clean === PROBES_PER_ROW) changes.push(...place(modes, probe));
    state = { ...state, modes, tuneUp: { ...state.tuneUp, [probe]: row } };
  }
  if (!push) return { state, changes };
  const pushed = { ...state.pushed, [id]: state.pushed[id] + 1 };
  const recorded = recordOutcome(state.modes[id], outcome, ruleFor(state.pushed[id])), event = recorded.event;
  const modes = { ...state.modes, [id]: { ...recorded.mode, introPending: false } }; // no card for a new Level: Meetings and questions teach
  if (event === 'levelUp') {
    changes.push({ kind: 'levelUp', mode: id, level: modes[id].level as 2 | 3 });
    changes.push(...openReady(modes));
  }
  if (event === 'star') changes.push({ kind: 'star', mode: id });
  return { state: { ...state, modes, pushed }, changes };
};

export type Explanation<P> = (problem: P, answer: string, teach: boolean, signal: AbortSignal) => Promise<void>;
export const verdict = <P>(correct: boolean, problem: P, answer: string, explain: Explanation<P>): Check =>
  correct ? { kind: 'correct' } : { kind: 'incorrect', explain: (teach, signal) => explain(problem, answer, teach, signal) };
