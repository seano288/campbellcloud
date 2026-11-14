// What Rover Code asks, and his progress. As in Math Bots there is no picking: every Round mixes the kinds he has opened, and each
// kind keeps its own Level (1 to 3), raised by Mastery and never lowered. Only questions asked at his Level count, and a replayed
// miss never does.
//
// Placement copies Math Bots, smaller: nobody sets a Level by hand. The first Rounds quietly probe Drive It and Patterns three times
// each at Level 2 ("Tune-Up"); three clean answers start that kind at Level 2, two misses stop the row. Since Levels never go down
// it places low, and the first FAST_PUSHED questions of a kind use a quicker Mastery rule, so he climbs fast if he already knows it.
import type { Check, Outcome, Progression } from '../learning/session';
import { recordOutcome, type MasteryRule } from '../modes/progress';
import type { ModeProgress } from '../modes/state';
import type { Kind, Level } from './code/problems';

/** Shown on Home in this order, which is also the order he meets them in. */
export const MODE_IDS = ['drive', 'pattern', 'bug', 'loop'] as const satisfies readonly Kind[];
export type ModeId = (typeof MODE_IDS)[number];
export const MODE_NAMES = { drive: 'Drive It', pattern: 'Patterns', bug: 'Bug Hunt', loop: 'Loops' } as const;
export type ModeName = (typeof MODE_NAMES)[ModeId];

/** A kind opens when all of these reach Level 2. Empty: open from the start. */
export const OPENS_AFTER: Record<ModeId, readonly ModeId[]> = { drive: [], pattern: [], bug: ['drive'], loop: ['drive', 'pattern'] };
export const OPENS_AT_LEVEL = 2;

/** Spoken when he taps a kind that is still locked. */
export const LOCKED_HINTS = {
  bug: 'Play more Drive It to open this!',
  loop: 'Play more Drive It and Patterns to open this!',
} as const satisfies Partial<Record<ModeId, string>>;

/** The pictures he meets before a question needs them: the program bar, and the loop block. */
export const MEETINGS = ['program', 'loop'] as const;
export type MeetingId = (typeof MEETINGS)[number];
export const meetingFor = (mode: ModeId): MeetingId | null => (mode === 'drive' || mode === 'bug' ? 'program' : mode === 'loop' ? 'loop' : null);

// ---------- Mastery ----------

/** 16 of the last 20 right on the first try, or the last 10 in a row. */
export const SLOW_RULE: MasteryRule = { window: 20, mastery: 16, streak: 10, top: 3 };
/** For the first questions of a kind: he's placed low, so one who already has it clears a Level in 6. */
export const FAST_RULE: MasteryRule = { window: 10, mastery: 8, streak: 6, top: 3 };
export const FAST_PUSHED = 30;
export const ruleFor = (pushed: number) => (pushed < FAST_PUSHED ? FAST_RULE : SLOW_RULE);

// ---------- placement ----------

export const ANCHORS = ['drive', 'pattern'] as const satisfies readonly ModeId[];
export type Anchor = (typeof ANCHORS)[number];
export interface Row { asked: number; clean: number; misses: number }
export const PROBES_PER_ROW = 3, ROW_STOPS_AT = 2, PROBE_LEVEL: Level = 2;
export const rowOpen = (r: Row) => r.asked < PROBES_PER_ROW && r.misses < ROW_STOPS_AT;
export const tuneUpOver = (s: Pick<LearningState, 'tuneUp'>) => !ANCHORS.some(a => rowOpen(s.tuneUp[a]));

// ---------- the save ----------

export interface LearningState {
  modes: Record<ModeId, ModeProgress>;
  /** Questions asked at his Level, per kind: the first FAST_PUSHED use the quicker rule. */
  pushed: Record<ModeId, number>;
  met: MeetingId[];
  tuneUp: Record<Anchor, Row>;
}

export const freshMode = (id: ModeId): ModeProgress => ({ level: 1, window: [], opened: OPENS_AFTER[id].length === 0, starred: false, introPending: false, fresh: false });
const eachMode = <T,>(f: (id: ModeId) => T) => Object.fromEntries(MODE_IDS.map(id => [id, f(id)])) as Record<ModeId, T>;
const eachAnchor = <T,>(f: (id: Anchor) => T) => Object.fromEntries(ANCHORS.map(id => [id, f(id)])) as Record<Anchor, T>;
export const freshLearning = (): LearningState => ({
  modes: eachMode(freshMode), pushed: eachMode(() => 0), met: [], tuneUp: eachAnchor(() => ({ asked: 0, clean: 0, misses: 0 })),
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

/** Reads a save of any age: whatever is missing or doesn't read comes back fresh, and a kind he has earned is opened. */
export function readLearning(raw: unknown): LearningState {
  const data = isRecord(raw) ? raw : {}, modes = isRecord(data.modes) ? data.modes : {}, pushed = isRecord(data.pushed) ? data.pushed : {};
  const rows = isRecord(data.tuneUp) ? data.tuneUp : {};
  const read: LearningState = {
    modes: eachMode(id => readMode(id, modes[id])),
    pushed: eachMode(id => count(pushed[id])),
    met: Array.isArray(data.met) ? MEETINGS.filter(m => (data.met as unknown[]).includes(m)) : [],
    tuneUp: eachAnchor(id => { const r = rows[id]; return isRecord(r) ? { asked: count(r.asked, PROBES_PER_ROW), clean: count(r.clean, PROBES_PER_ROW), misses: count(r.misses) } : { asked: 0, clean: 0, misses: 0 }; }),
  };
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
export type Asked = { readonly meet: MeetingId } | { readonly mode: ModeId; readonly push: boolean; readonly probe?: Anchor };

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
  if ('meet' in asked) return { state: { ...prior, met: prior.met.includes(asked.meet) ? prior.met : [...prior.met, asked.meet] }, changes: [] };
  const { mode: id, push, probe } = asked, outcome = result.outcome;
  let state = prior;
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
