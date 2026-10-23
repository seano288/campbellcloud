// Every Round mixes all the kinds of question he has opened, as in Time Flies: each question picks a kind (never the same
// one twice in a row, when there's a choice), then how hard: mostly at that kind's Level, which pushes him and counts
// toward Mastery, with about one in three from an easier Level for a quick win. Right after a miss the next one is
// always easier, and when he's been missing a lot help steps in after a single miss.
import { int, pick, shuffle, type Rng } from '../game/rng';
import type { Check, LearningSession, Outcome } from '../learning/session';
import { struggling } from '../modes/progress';
import { key, parseKey, same } from './fractions/fraction';
import {
  biggerAnswer, makeBigger, makeColor, makeFair, makeFind, makeName, makeShare, piecesFor, SAME,
  type BiggerProblem, type ColorProblem, type FairProblem, type FindProblem, type Level, type NameProblem, type ShareProblem,
} from './fractions/problems';
import { MODE_IDS, verdict, type Asked, type Explanation, type LearningState, type ModeId } from './learning';

/** About one question in three comes from an easier Level. */
export const EASY_SHARE = 1 / 3;

interface Base extends Asked { readonly level: Level }
interface Shape { readonly level: Level; readonly push: boolean }
export type Problem =
  | Shape & { readonly mode: 'fair'; readonly q: FairProblem }
  | Shape & { readonly mode: 'name'; readonly q: NameProblem }
  | Shape & { readonly mode: 'bigger'; readonly q: BiggerProblem }
  | Shape & { readonly mode: 'find'; readonly q: FindProblem }
  | Shape & { readonly mode: 'color'; readonly q: ColorProblem }
  | Shape & { readonly mode: 'share'; readonly q: ShareProblem };

/** The kind and Level of the next question. `last`: the kind just asked, and whether he missed it. */
export function pickNext(state: LearningState, rng: Rng, last?: { mode: ModeId; missed: boolean }): Base {
  const open = MODE_IDS.filter(m => state.modes[m].opened);
  const others = open.filter(m => m !== last?.mode);
  const mode = pick(rng, others.length ? others : open), top = state.modes[mode].level as Level;
  const easy = top > 1 && (last?.missed || rng() < EASY_SHARE);
  return easy ? { mode, level: int(rng, 1, top - 1) as Level, push: false } : { mode, level: top, push: true };
}

export interface Explainers {
  fair: Explanation<FairProblem>;
  name: Explanation<NameProblem>;
  bigger: Explanation<BiggerProblem>;
  find: Explanation<FindProblem>;
  color: Explanation<ColorProblem>;
  share: Explanation<ShareProblem>;
}

/** What the last question of each kind was, so the next one of that kind asks something else. */
const avoidOf = (p: Problem | undefined) => {
  if (!p) return undefined;
  switch (p.mode) {
    case 'name': return p.q.d;
    case 'find': case 'color': return p.q.target;
    case 'bigger': return `${key(p.q.a)}|${key(p.q.b)}`;
    case 'share': return 'friends' in p.q ? p.q.friends : p.q.total;
    default: return undefined;
  }
};

export function makeProblem(base: Base, rng: Rng, last: Partial<Record<ModeId, Problem>> = {}): Problem {
  const { level, push } = base, avoid = avoidOf(last[base.mode]) as never;
  switch (base.mode) {
    case 'fair': return { level, push, mode: 'fair', q: makeFair(level, rng) };
    case 'name': return { level, push, mode: 'name', q: makeName(level, rng, avoid) };
    case 'bigger': return { level, push, mode: 'bigger', q: makeBigger(level, rng, avoid) };
    case 'find': return { level, push, mode: 'find', q: makeFind(level, rng, avoid) };
    case 'color': return { level, push, mode: 'color', q: makeColor(level, rng, avoid) };
    case 'share': return { level, push, mode: 'share', q: makeShare(level, rng, avoid) };
  }
}

/** Is this the right answer? Answers are what the views submit: a picture's place, a part ("3/4"), a number, or "same". */
export function isRight(p: Problem, answer: string): boolean | null {
  switch (p.mode) {
    case 'fair': { const i = Number(answer); return Number.isInteger(i) && i >= 0 && i < p.q.pictures.length ? i === p.q.answer : null; }
    case 'name': { const f = parseKey(answer); return f && f.n === 1 && p.q.choices.includes(f.d) ? f.d === p.q.d : null; }
    case 'find': { const f = parseKey(answer); return f && p.q.choices.some(c => key(c) === answer) ? same(f, p.q.target) : null; }
    case 'color': { const f = parseKey(answer); return f && f.d === p.q.d ? f.n === piecesFor(p.q) : null; }
    case 'bigger': return answer === SAME || answer === key(p.q.a) || answer === key(p.q.b) ? answer === biggerAnswer(p.q) : null;
    case 'share': { const n = Number(answer); return p.q.choices.includes(n) ? n === p.q.answer : null; }
  }
}

/** The Round's questions. `note` hears how each one went, so a miss is followed by an easier one. */
export function mixedSession(read: () => LearningState, explain: Explainers): LearningSession<Problem, string> & { note(outcome: Outcome): void } {
  let current: Problem | undefined, missed = false;
  const last: Partial<Record<ModeId, Problem>> = {};
  return {
    makeProblem(rng) {
      const next = pickNext(read(), rng, current && { mode: current.mode, missed });
      current = makeProblem(next, rng, last);
      last[current.mode] = current;
      return current;
    },
    replay(p, rng) {
      // the same question again, its choices in a new order
      if (p.mode === 'fair') { const pictures = shuffle(rng, p.q.pictures); return (current = { ...p, q: { ...p.q, pictures, answer: pictures.indexOf(p.q.pictures[p.q.answer]!) } }); }
      if (p.mode === 'find') return (current = { ...p, q: { ...p.q, choices: shuffle(rng, p.q.choices) } });
      return (current = p);
    },
    check(p, answer): Check {
      const right = isRight(p, answer);
      if (right === null) return { kind: 'not-an-answer' };
      const e = explain[p.mode] as Explanation<Problem['q']>;
      return verdict(right, p.q, answer, e);
    },
    needsEarlyHelp: () => !!current && struggling(read().modes[current.mode]),
    note(outcome) { missed = outcome !== 'clean'; },
  };
}
