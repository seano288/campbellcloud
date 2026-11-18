// What Sky Writer asks, and his progress. As in Math Bots, Rover Code and Dino Dig there is no picking: every Round mixes the kinds he
// has opened, and each kind keeps its own Level (1 to 3), raised by Mastery and never lowered. Only questions asked at his Level count,
// and a replayed miss never does. No Tune-Up: the quick Mastery rule for a kind's first questions places him.
//
// The letters come by Family (letters/strokes.ts), as Sight Squad's words come by set and Dino Dig's by Pattern: each Family is met
// before it's asked (the plane writes each of its letters in smoke while it's named), the next one joins after FAMILY_GAP more answers
// right on the first try, and waits while any Family he has met is still shaky. Each Family keeps a strength from 0 to 5: up one on a
// first-try answer, down one with help, down two on a miss. Questions pick letters from weak and new Families more often.
// A Level is how hard the question is, not which Family it uses.
import type { Check, Outcome, Progression } from '../learning/session';
import { recordOutcome, type MasteryRule } from '../modes/progress';
import type { ModeProgress } from '../modes/state';
import { FAMILY_IDS, type FamilyId } from './letters/strokes';

/** Shown on Home in this order, which is also the order he meets them in. */
export const MODE_IDS = ['trace', 'start', 'flip', 'size', 'write', 'word'] as const;
export type ModeId = (typeof MODE_IDS)[number];
export const MODE_NAMES = { trace: 'Trace It', start: 'Where to Start', flip: 'Which Way', size: 'Tall, Small, Tail', write: 'Write It', word: 'Write a Word' } as const;
export type ModeName = (typeof MODE_NAMES)[ModeId];

/** A kind opens when all of these reach Level 2. Empty: open from the start. */
export const OPENS_AFTER: Record<ModeId, readonly ModeId[]> = { trace: [], start: [], flip: ['trace'], size: ['start'], write: ['trace', 'start'], word: ['write'] };
export const OPENS_AT_LEVEL = 2;

/** Spoken when he taps a kind that is still locked. */
export const LOCKED_HINTS = {
  flip: 'Play more Trace It to open this!',
  size: 'Play more Where to Start to open this!',
  write: 'Play more Trace It and Where to Start to open this!',
  word: 'Play more Write It to open this!',
} as const satisfies Partial<Record<ModeId, string>>;

// ---------- Mastery ----------

/** 16 of the last 20 right on the first try, or the last 10 in a row. */
export const SLOW_RULE: MasteryRule = { window: 20, mastery: 16, streak: 10, top: 3 };
/** For the first questions of a kind: he starts at Level 1, so one who already knows it clears a Level in 6. */
export const FAST_RULE: MasteryRule = { window: 10, mastery: 8, streak: 6, top: 3 };
export const FAST_PUSHED = 30;
export const ruleFor = (pushed: number) => (pushed < FAST_PUSHED ? FAST_RULE : SLOW_RULE);

// ---------- Families ----------

/** Right answers on the first try, after meeting a Family, before the next may come. */
export const FAMILY_GAP = 8;
/** A Family is shaky below this strength; the next one waits while any he has met is. */
export const SHAKY_BELOW = 2, TOP_STRENGTH = 5;
const STEP: Record<Outcome, number> = { clean: 1, helped: -1, missed: -2 };

// ---------- the save ----------

export interface LearningState {
  modes: Record<ModeId, ModeProgress>;
  /** Questions asked at his Level, per kind: the first FAST_PUSHED use the quicker rule. */
  pushed: Record<ModeId, number>;
  /** The Families he has met, in order. */
  families: FamilyId[];
  /** Right on the first try since he met the last Family. */
  sinceMeet: number;
  /** How well he knows each Family he has met, 0 to 5. */
  strength: Partial<Record<FamilyId, number>>;
}

export const freshMode = (id: ModeId): ModeProgress => ({ level: 1, window: [], opened: OPENS_AFTER[id].length === 0, starred: false, introPending: false, fresh: false });
const eachMode = <T,>(f: (id: ModeId) => T) => Object.fromEntries(MODE_IDS.map(id => [id, f(id)])) as Record<ModeId, T>;
export const freshLearning = (): LearningState => ({ modes: eachMode(freshMode), pushed: eachMode(() => 0), families: [], sinceMeet: 0, strength: {} });

export const strengthOf = (s: Pick<LearningState, 'strength'>, f: FamilyId) => s.strength[f] ?? 0;
/** The next Family he hasn't met. */
export const nextFamily = (s: Pick<LearningState, 'families'>): FamilyId | undefined => FAMILY_IDS.find(f => !s.families.includes(f));
/** Time to meet the next Family: none met yet, or enough first-try answers since the last and none of his shaky. */
export const familyDue = (s: Pick<LearningState, 'families' | 'sinceMeet' | 'strength'>) =>
  nextFamily(s) !== undefined && (!s.families.length || (s.sinceMeet >= FAMILY_GAP && s.families.every(f => strengthOf(s, f) >= SHAKY_BELOW)));

type Raw = Record<string, unknown>;
const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);
const bool = (x: unknown, fallback: boolean) => (typeof x === 'boolean' ? x : fallback);
const OUTCOMES: readonly Outcome[] = ['clean', 'helped', 'missed'];
const count = (x: unknown, max = Infinity) => (typeof x === 'number' && Number.isInteger(x) && x >= 0 ? Math.min(x, max) : 0);
const isFamily = (x: unknown): x is FamilyId => (FAMILY_IDS as readonly unknown[]).includes(x);

function readMode(id: ModeId, raw: unknown): ModeProgress {
  const f = freshMode(id);
  if (!isRecord(raw)) return f;
  return {
    level: ([1, 2, 3] as const).find(l => l === raw.level) ?? f.level,
    window: Array.isArray(raw.window) ? raw.window.filter((o): o is Outcome => OUTCOMES.includes(o as Outcome)).slice(-SLOW_RULE.window) : f.window,
    opened: bool(raw.opened, f.opened), starred: bool(raw.starred, f.starred), introPending: false, fresh: bool(raw.fresh, f.fresh),
  };
}

/** Reads a save of any age: whatever is missing or doesn't read comes back fresh, and a kind he has earned is opened. Families are met
 *  in order, so a save that lists a later one without an earlier one keeps only the run from the start. */
export function readLearning(raw: unknown): LearningState {
  const data = isRecord(raw) ? raw : {}, modes = isRecord(data.modes) ? data.modes : {}, pushed = isRecord(data.pushed) ? data.pushed : {};
  const listed = Array.isArray(data.families) ? data.families.filter(isFamily) : [];
  const families: FamilyId[] = [];
  for (const f of FAMILY_IDS) { if (listed.includes(f)) families.push(f); else break; }
  const rawStrength = isRecord(data.strength) ? data.strength : {}, strength: Partial<Record<FamilyId, number>> = {};
  for (const f of families) strength[f] = count(rawStrength[f], TOP_STRENGTH);
  const read: LearningState = { modes: eachMode(id => readMode(id, modes[id])), pushed: eachMode(id => count(pushed[id])), families, sinceMeet: count(data.sinceMeet), strength };
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
  | { kind: 'met'; family: FamilyId };

/** Which kind was solved, about a letter of which Family, and whether it counts toward Mastery; or the Family he just met. */
export type Asked = { readonly mode: ModeId; readonly push: boolean; readonly family: FamilyId } | { readonly meet: FamilyId };

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
    if (prior.families.includes(asked.meet)) return { state: prior, changes: [] };
    return { state: { ...prior, families: [...prior.families, asked.meet], sinceMeet: 0, strength: { ...prior.strength, [asked.meet]: 0 } }, changes: [{ kind: 'met', family: asked.meet }] };
  }
  const { mode: id, push, family } = asked, outcome = result.outcome;
  const strength = prior.families.includes(family)
    ? { ...prior.strength, [family]: Math.max(0, Math.min(TOP_STRENGTH, strengthOf(prior, family) + STEP[outcome])) }
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
