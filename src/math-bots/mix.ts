// Every Round mixes the kinds he has opened, drawn from a working set rather than all of them: at most WORKING_SET unstarred
// kinds, the ones he's furthest behind on, each used once before any comes up again so none gets left out of a Round. Starred
// kinds come back as about one review question a Round. Each question then picks how hard, as in Chop Chop: mostly at that
// kind's Level, which counts toward Mastery, about one in three easier, and always easier right after a miss.
//
// The first Rounds are Tune-Up (learning.ts): one probe from each anchor a Round until every row is decided, looking just
// like the rest. A question whose picture he hasn't met waits for its Meeting. A miss comes back with new numbers and no
// Mastery credit, since he has just been shown the old answer.
import { int, pick, type Rng } from '../game/rng';
import type { Check, LearningSession, Outcome } from '../learning/session';
import { stretchOf, struggling, type Stretch } from '../modes/progress';
import { factKey, factsPool, MEETINGS, MODE_IDS, PROBE_LEVEL, PROBE_STORIES, rowOpen, ANCHORS, strengthOf, tuneUpOver, verdict, type Anchor, type Explanation, type FactsState, type LearningState, type MeetingId, type ModeId } from './learning';
import { makeBoard, makeQuestion, storyOp, type Input, type Level, type Pair, type StoryOp } from './numbers/problems';
import type { AnyQuestion } from './numbers/say';
import { meetingsFor } from './numbers/teach';

export const EASY_SHARE = 1 / 3, WORKING_SET = 5, BOARD_SHARE = 0.2;

export type Asking = {
  readonly mode: ModeId; readonly level: Level; readonly push: boolean; readonly stretch: Stretch;
  readonly q: AnyQuestion; readonly probe?: Anchor; readonly replay?: boolean;
};
export type Meet = { readonly mode: 'meet'; readonly meeting: MeetingId; readonly push: false };
export type Problem = Asking | Meet;

/** The kinds a Round practises: unstarred and open, lowest Level first, then in the order he meets them. */
export function workingSet(state: Pick<LearningState, 'modes'>): ModeId[] {
  return MODE_IDS.filter(m => state.modes[m].opened && !state.modes[m].starred)
    .sort((a, b) => state.modes[a].level - state.modes[b].level || MODE_IDS.indexOf(a) - MODE_IDS.indexOf(b))
    .slice(0, WORKING_SET);
}
export const reviewKinds = (state: Pick<LearningState, 'modes'>) => MODE_IDS.filter(m => state.modes[m].opened && state.modes[m].starred);

interface Base { readonly mode: ModeId; readonly level: Level; readonly push: boolean; readonly stretch: Stretch; readonly probe?: Anchor; readonly storyIndex?: number }

/** How hard a question of this kind is. */
export function pitch(state: LearningState, mode: ModeId, rng: Rng, missed: boolean): Base {
  const m = state.modes[mode], top = m.level as Level;
  const easy = top > 1 && (missed || rng() < EASY_SHARE);
  return easy ? { mode, level: int(rng, 1, top - 1) as Level, push: false, stretch: 0 } : { mode, level: top, push: true, stretch: stretchOf(m) };
}

const WEIGHTS = [6, 5, 4, 2, 1.5, 1];
/** One family from the pool: the shaky and new ones far more often than the ones he knows well. */
export function pickFact(facts: FactsState, rng: Rng, pool: readonly Pair[]): Pair {
  const weight = (p: Pair) => WEIGHTS[strengthOf(facts, factKey(p))]!;
  let r = rng() * pool.reduce((sum, p) => sum + weight(p), 0);
  for (const p of pool) if ((r -= weight(p)) < 0) return p;
  return pool.at(-1)!;
}

interface Balance { add: number; sub: number }
/** The question itself. `ops`: the story operations so far this Round; the next goes to whichever is behind. */
export function build(state: LearningState, base: Base, rng: Rng, avoid: string | undefined, ops: Balance): AnyQuestion {
  const { mode, level, stretch } = base;
  if (mode === 'story' && base.storyIndex === undefined && level >= 2 && (level === 3 || stretch >= 1) && rng() < BOARD_SHARE) return makeBoard(level, rng);
  if (mode === 'facts') return makeQuestion('facts', level, rng, { stretch, ...(avoid !== undefined && { avoid }), pool: [pickFact(state.facts, rng, factsPool(state.facts, level, state.modes.over.opened && state.modes.over.level >= 2))] });
  if (mode === 'story' && base.storyIndex !== undefined) return makeQuestion('story', level, rng, { only: PROBE_STORIES[base.storyIndex]! });
  const want: StoryOp = ops.add === ops.sub ? (rng() < 0.5 ? 'add' : 'sub') : ops.add < ops.sub ? 'add' : 'sub';
  return makeQuestion(mode, level, rng, { stretch, ...(avoid !== undefined && { avoid }), ...(mode === 'story' && { want }) });
}

/** Where the right answer is the same every time, or just where it landed: a replay needn't change it. */
const FIXED_ANSWERS: ReadonlySet<Input> = new Set(['same', 'cards', 'pick', 'tiles', 'fill']);
/** The same sort of question. */
const shapeOf = (q: AnyQuestion) => ('form' in q ? q.form : 'id' in q ? q.id : q.kind);
/** New numbers for a miss that comes back; the same shape when the kind can manage it. */
export function replayOf(state: LearningState, p: Asking, rng: Rng): Asking {
  const before = JSON.stringify(p.q);
  const base: Base = { mode: p.mode, level: p.level, push: false, stretch: p.stretch };
  let fallback: AnyQuestion | null = null;
  for (let tries = 0; tries < 40; tries++) {
    const q = p.q.kind === 'board' ? makeBoard(p.level, rng) : build(state, base, rng, undefined, { add: 0, sub: 0 });
    if (JSON.stringify(q) === before || q.kind !== p.q.kind || (q.answer === p.q.answer && !FIXED_ANSWERS.has(p.q.input))) continue;
    if (q.kind === 'shape' && q.form === 'fill' && p.q.kind === 'shape' && p.q.form === 'fill' && q.fill === p.q.fill) continue; // new numbers: here, a new outline
    if (shapeOf(q) === shapeOf(p.q)) return { ...p, q, push: false, replay: true, probe: undefined } as Asking;
    fallback ??= q;
  }
  return { ...p, q: fallback ?? p.q, push: false, replay: true, probe: undefined } as Asking;
}

/** Is this the right answer? `null`: not an answer at all; `more`: right so far (the steps of Over Ten, Fix It). */
export function isRight(p: Problem, answer: string): boolean | null | 'more' {
  if (p.mode === 'meet') return true;
  const q = p.q;
  if (!answer) return null;
  if (q.kind === 'over' && q.form === 'fill' && answer.startsWith('step:')) return Number(answer.slice(5)) === q.left ? 'more' : false;
  if (q.kind === 'scale' && q.form === 'same' && answer === 'pick:not') return q.answer === 'not' ? 'more' : false;
  if (q.kind === 'shape' && q.form === 'every' && answer.startsWith('tile:')) return q.targets.includes(Number(answer.slice(5))) ? 'more' : false;
  return answer === q.answer;
}

/** A Round's questions. `note` hears how each went, so a miss is followed by an easier one. */
export function mixedSession(read: () => LearningState, explain: Explanation<Asking>, rng: Rng = Math.random): LearningSession<Problem, string> & { note(outcome: Outcome): void } {
  let current: Problem | undefined, lastMode: ModeId | undefined, missed = false, waiting: Asking | null = null, asked = 0;
  const reviewAt = int(rng, 0, 4), used = new Set<ModeId>(), probed = new Set<Anchor>(), answers = new Map<ModeId, string>(), ops: Balance = { add: 0, sub: 0 }, met = new Set<MeetingId>();
  const count = (q: AnyQuestion) => { if (q.kind === 'story') ops[storyOp(q.id)]++; };
  /** Never the same kind twice running, while there's another to ask. */
  const notLast = (kinds: ModeId[]) => { const others = kinds.filter(m => m !== lastMode); return others.length ? others : kinds; };

  function nextBase(state: LearningState, r: Rng): Base {
    if (!tuneUpOver(state)) {
      const rows = ANCHORS.filter(a => rowOpen(state.tuneUp[a]) && !probed.has(a));
      const anchor = rows.sort((a, b) => state.tuneUp[a].asked - state.tuneUp[b].asked)[0];
      if (anchor) {
        probed.add(anchor);
        return { mode: anchor, level: PROBE_LEVEL[anchor], push: false, stretch: 0, probe: anchor, ...(anchor === 'story' && { storyIndex: state.tuneUp.story.asked }) };
      }
    }
    const review = reviewKinds(state);
    if (asked === reviewAt && review.some(m => m !== lastMode)) return { ...pitch(state, pick(r, notLast(review)), r, false), push: false };
    const set = workingSet(state);
    if (!set.length) return pitch(state, pick(r, review.length ? notLast(review) : ['ten']), r, missed);
    let fresh = set.filter(m => !used.has(m) && m !== lastMode);
    if (!fresh.length) { used.clear(); fresh = set.filter(m => m !== lastMode); }
    if (!fresh.length && notLast(review).some(m => m !== lastMode)) return { ...pitch(state, pick(r, notLast(review)), r, false), push: false };
    const mode = pick(r, fresh.length ? fresh : set);
    used.add(mode);
    return pitch(state, mode, r, missed);
  }

  function ask(p: Asking): Problem {
    const unmet = meetingsFor(p.q).find(m => !met.has(m) && !read().met.includes(m));
    if (unmet) { met.add(unmet); waiting = p; return (current = { mode: 'meet', meeting: unmet, push: false }); }
    waiting = null;
    answers.set(p.mode, p.q.answer);
    lastMode = p.mode;
    return (current = p);
  }

  return {
    makeProblem(r) {
      if (waiting) return ask(waiting);
      const state = read(), base = nextBase(state, r), q = build(state, base, r, answers.get(base.mode), ops);
      asked++;
      count(q);
      return ask({ mode: base.mode, level: base.level, push: base.push, stretch: base.stretch, q, ...(base.probe && { probe: base.probe }) });
    },
    replay(p, r) {
      if (p.mode === 'meet') return (current = p);
      const next = replayOf(read(), p, r);
      count(next.q);
      return ask(next);
    },
    check(p, answer): Check {
      const right = isRight(p, answer);
      if (right === null || right === 'more') return { kind: 'not-an-answer' };
      if (p.mode === 'meet') return { kind: 'correct' };
      return verdict(right, p, answer, explain);
    },
    // a probe stays a probe: no early help, whatever his Level has been doing
    needsEarlyHelp: () => !!current && current.mode !== 'meet' && !current.probe && struggling(read().modes[current.mode]),
    note(outcome) { missed = outcome !== 'clean'; },
  };
}

export { MEETINGS };
