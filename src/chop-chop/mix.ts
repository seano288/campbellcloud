// Every Round mixes all the kinds of question he has opened, as in Time Flies: each question picks a kind (never the same
// one twice in a row, when there's a choice), then how hard: mostly at that kind's Level, which pushes him and counts
// toward Mastery, with about one in three from an easier Level for a quick win. Right after a miss the next one is
// always easier, and when he's been missing a lot help steps in after a single miss.
//
// No question uses a piece word he hasn't met. When one is about to use the next word (src/chop-chop/learning.ts says
// when it may), he meets the word first: it's cut and named on a food (fractions/teach.ts, teachMeet), he taps one piece,
// and then that question is asked. The first Top and Bottom question waits the same way while he meets writing (teachMeetWriting).
import { int, pick, shuffle, type Rng } from '../game/rng';
import type { Check, LearningSession, Outcome } from '../learning/session';
import { struggling } from '../modes/progress';
import { key, parseKey, same, WORD_ORDER, type Den } from './fractions/fraction';
import {
  biggerAnswer, makeBigger, makeColor, makeFair, makeFind, makeMeet, makeMeetWriting, makeName, makeShare, makeWrite, piecesFor, SAME,
  type BiggerProblem, type ColorProblem, type FairProblem, type FindProblem, type Level, type MeetProblem, type MeetWritingProblem, type NameProblem,
  type ShareProblem, type Words, type WriteProblem,
} from './fractions/problems';
import { MODE_IDS, verdict, wordsFor, type Explanation, type LearningState, type ModeId } from './learning';

/** About one question in three comes from an easier Level. */
export const EASY_SHARE = 1 / 3;

interface Base { readonly mode: ModeId; readonly push: boolean; readonly level: Level }
interface Shape { readonly level: Level; readonly push: boolean }
export type Problem =
  | Shape & { readonly mode: 'fair'; readonly q: FairProblem }
  | Shape & { readonly mode: 'name'; readonly q: NameProblem }
  | Shape & { readonly mode: 'bigger'; readonly q: BiggerProblem }
  | Shape & { readonly mode: 'find'; readonly q: FindProblem }
  | Shape & { readonly mode: 'color'; readonly q: ColorProblem }
  | Shape & { readonly mode: 'share'; readonly q: ShareProblem }
  | Shape & { readonly mode: 'write'; readonly q: WriteProblem }
  | Shape & { readonly mode: 'meet'; readonly q: MeetProblem }
  | Shape & { readonly mode: 'meetWriting'; readonly q: MeetWritingProblem };
/** Meeting a word or writing: not a kind of question, nothing to get wrong. */
export const isMeeting = (p: Problem): p is Extract<Problem, { mode: 'meet' | 'meetWriting' }> => p.mode === 'meet' || p.mode === 'meetWriting';

/** The kind and Level of the next question. `last`: the kind just asked, and whether he missed it. */
export function pickNext(state: LearningState, rng: Rng, last?: { mode: ModeId; missed: boolean }, skip: readonly ModeId[] = []): Base {
  const open = MODE_IDS.filter(m => state.modes[m].opened && !skip.includes(m));
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
  write: Explanation<WriteProblem>;
}
const explainMeet: Explanation<unknown> = async () => {}; // any piece is right

/** What the last question of each kind was, so the next one of that kind asks something else. */
const avoidOf = (p: Problem | undefined) => {
  if (!p || isMeeting(p)) return undefined;
  switch (p.mode) {
    case 'name': return p.q.d;
    case 'find': case 'color': case 'write': return p.q.target;
    case 'bigger': return `${key(p.q.a)}|${key(p.q.b)}`;
    case 'share': return 'friends' in p.q ? p.q.friends : p.q.total;
    default: return undefined;
  }
};

/** A question of this kind and Level, using only `words`; null when there's nothing it can ask with them yet. */
export function makeProblem(base: Base, rng: Rng, words: Words, last: Partial<Record<ModeId, Problem>> = {}): Problem | null {
  const { level, push } = base, avoid = avoidOf(last[base.mode]) as never;
  switch (base.mode) {
    case 'fair': return { level, push, mode: 'fair', q: makeFair(level, rng) };
    case 'name': { const q = makeName(level, rng, words, avoid); return q && { level, push, mode: 'name', q }; }
    case 'bigger': { const q = makeBigger(level, rng, words, avoid); return q && { level, push, mode: 'bigger', q }; }
    case 'find': { const q = makeFind(level, rng, words, avoid); return q && { level, push, mode: 'find', q }; }
    case 'color': { const q = makeColor(level, rng, words, avoid); return q && { level, push, mode: 'color', q }; }
    case 'share': { const q = makeShare(level, rng, words, avoid); return q && { level, push, mode: 'share', q }; }
    case 'write': { const q = makeWrite(level, rng, words, avoid); return q && { level, push, mode: 'write', q }; }
  }
}

/** The piece words a question says (or says when he misses). */
export function wordsIn(p: Problem): Den[] {
  switch (p.mode) {
    case 'fair': return [];
    case 'name': return [...p.q.choices];
    case 'find': case 'write': return p.q.choices.filter(c => c.n > 0 && c.n < c.d).map(c => c.d);
    case 'color': return [p.q.target.d];
    case 'bigger': return [p.q.a.d, p.q.b.d];
    case 'share': return 'friends' in p.q ? [] : [p.q.d];
    case 'meet': case 'meetWriting': return [p.q.d];
  }
}

/** The next question: a kind he has open that can ask something with the words he may hear (Fair Shares always can). */
function nextQuestion(state: LearningState, rng: Rng, words: Words, last: Partial<Record<ModeId, Problem>>, prev?: { mode: ModeId; missed: boolean }): Problem {
  const skip: ModeId[] = [];
  for (;;) {
    const base = pickNext(state, rng, prev, skip), top = state.modes[base.mode].level as Level;
    const p = makeProblem(base, rng, words, last) ?? (base.level < top ? makeProblem({ ...base, level: top, push: true }, rng, words, last) : null);
    if (p) return p;
    skip.push(base.mode);
    if (skip.length >= MODE_IDS.length) return makeProblem({ mode: 'fair', level: 1, push: false }, rng, words)!;
  }
}

/** Is this the right answer? Answers are what the views submit: a picture's place, a part ("3/4"), a number, or "same". */
export function isRight(p: Problem, answer: string): boolean | null {
  switch (p.mode) {
    case 'fair': { const i = Number(answer); return Number.isInteger(i) && i >= 0 && i < p.q.pictures.length ? i === p.q.answer : null; }
    case 'name': { const f = parseKey(answer); return f && f.n === 1 && p.q.choices.includes(f.d) ? f.d === p.q.d : null; }
    case 'find': case 'write': { const f = parseKey(answer); return f && p.q.choices.some(c => key(c) === answer) ? same(f, p.q.target) : null; }
    case 'color': { const f = parseKey(answer); return f && f.d === p.q.d ? f.n === piecesFor(p.q) : null; }
    case 'bigger': return answer === SAME || answer === key(p.q.a) || answer === key(p.q.b) ? answer === biggerAnswer(p.q) : null;
    case 'share': { const n = Number(answer); return p.q.choices.includes(n) ? n === p.q.answer : null; }
    case 'meet': { const i = Number(answer); return Number.isInteger(i) && i >= 0 && i < p.q.d ? true : null; }
    case 'meetWriting': return answer === key({ n: 1, d: p.q.d }) ? true : null;
  }
}

/** The Round's questions. `note` hears how each one went, so a miss is followed by an easier one. */
export function mixedSession(read: () => LearningState, explain: Explainers): LearningSession<Problem, string> & { note(outcome: Outcome): void } {
  let current: Problem | undefined, missed = false, waiting: Problem | undefined, metWriting = false;
  const last: Partial<Record<ModeId, Problem>> = {}, met = new Set<Den>();
  return {
    makeProblem(rng) {
      const state = read(), known = [...new Set([...state.words, ...met])];
      const prev = current && !isMeeting(current) ? { mode: current.mode, missed } : undefined;
      const next = waiting ?? nextQuestion(state, rng, wordsFor({ words: known, sinceWord: state.sinceWord }), last, prev);
      waiting = undefined;
      const fresh = WORD_ORDER.find(d => wordsIn(next).includes(d) && !known.includes(d));
      if (fresh) { // meet the word, then ask the question
        met.add(fresh);
        waiting = next;
        return (current = { level: 1, push: false, mode: 'meet', q: makeMeet(fresh, rng) });
      }
      if (next.mode === 'write' && !state.writing && !metWriting) { // meet writing, then ask the question
        metWriting = true;
        waiting = next;
        return (current = { level: 1, push: false, mode: 'meetWriting', q: makeMeetWriting(known, rng) });
      }
      if (!isMeeting(next)) last[next.mode] = next;
      return (current = next);
    },
    replay(p, rng) {
      // the same question again, its choices in a new order
      if (p.mode === 'fair') { const pictures = shuffle(rng, p.q.pictures); return (current = { ...p, q: { ...p.q, pictures, answer: pictures.indexOf(p.q.pictures[p.q.answer]!) } }); }
      if (p.mode === 'find' || p.mode === 'write') return (current = { ...p, q: { ...p.q, choices: shuffle(rng, p.q.choices) } } as Problem);
      return (current = p);
    },
    check(p, answer): Check {
      const right = isRight(p, answer);
      if (right === null) return { kind: 'not-an-answer' };
      const e = (isMeeting(p) ? explainMeet : explain[p.mode]) as Explanation<Problem['q']>;
      return verdict(right, p.q, answer, e);
    },
    needsEarlyHelp: () => !!current && !isMeeting(current) && struggling(read().modes[current.mode]),
    note(outcome) { missed = outcome !== 'clean'; },
  };
}
