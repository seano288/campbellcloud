// Every Round mixes the kinds he has opened, never the same kind twice running while there's another. Unstarred kinds are practised;
// a starred kind comes back as about one review question a Round. Each question then picks how hard, as in Math Bots: mostly at that
// kind's Level, which counts toward Mastery, about one in three easier, and always easier right after a miss.
//
// A question that needs something he hasn't met (the compass rose, the map key, grid squares) waits for its Meeting. A miss comes
// back later as a new map of the same kind and Level, with no Mastery credit, since he has just been shown the old answer.
import { int, pick, type Rng } from '../game/rng';
import type { Check, LearningSession, Outcome } from '../learning/session';
import { stretchOf, struggling, type Stretch } from '../modes/progress';
import { isAnswer, makeQuestion, rightAnswer, usesCompass, type Level, type Question } from './map/problems';
import { MODE_IDS, verdict, type Explanation, type LearningState, type MeetingId, type ModeId } from './learning';

export const EASY_SHARE = 1 / 3;

export type Asking = { readonly mode: ModeId; readonly level: Level; readonly push: boolean; readonly stretch: Stretch; readonly q: Question; readonly replay?: boolean };
export type Meet = { readonly mode: 'meet'; readonly meeting: MeetingId; readonly push: false };
export type Problem = Asking | Meet;

export const practised = (state: Pick<LearningState, 'modes'>) => MODE_IDS.filter(m => state.modes[m].opened && !state.modes[m].starred);
export const reviewKinds = (state: Pick<LearningState, 'modes'>) => MODE_IDS.filter(m => state.modes[m].opened && state.modes[m].starred);

interface Base { readonly mode: ModeId; readonly level: Level; readonly push: boolean; readonly stretch: Stretch }

/** How hard a question of this kind is. */
export function pitch(state: LearningState, mode: ModeId, rng: Rng, missed: boolean): Base {
  const m = state.modes[mode], top = m.level as Level;
  const easy = top > 1 && (missed || rng() < EASY_SHARE);
  return easy ? { mode, level: int(rng, 1, top - 1) as Level, push: false, stretch: 0 } : { mode, level: top, push: true, stretch: stretchOf(m) };
}

/** What he must meet before this question: the rose first, then the key or the grid. */
export function meetingsFor(q: Question): MeetingId[] {
  const out: MeetingId[] = [];
  if (usesCompass(q)) out.push('compass');
  if (q.kind === 'key') out.push('key');
  if (q.kind === 'grid') out.push('grid');
  return out;
}

/** Is this the right answer? `null`: not an answer at all (a tap on the sea, say). */
export function isRight(p: Problem, answer: string): boolean | null {
  if (p.mode === 'meet') return true;
  if (!isAnswer(p.q, answer)) return null;
  return answer === rightAnswer(p.q);
}

/** A Round's questions. `note` hears how each went, so a miss is followed by an easier one. */
export function mixedSession(read: () => LearningState, explain: Explanation<Asking>, rng: Rng = Math.random): LearningSession<Problem, string> & { note(outcome: Outcome): void } {
  let current: Problem | undefined, lastMode: ModeId | undefined, missed = false, waiting: Asking | null = null, asked = 0;
  const reviewAt = int(rng, 0, 4), met = new Set<MeetingId>();
  const notLast = (kinds: readonly ModeId[]) => { const others = kinds.filter(m => m !== lastMode); return others.length ? others : [...kinds]; };

  function nextBase(state: LearningState, r: Rng): Base {
    const review = reviewKinds(state), set = practised(state);
    if (asked === reviewAt && review.some(m => m !== lastMode)) return { ...pitch(state, pick(r, notLast(review)), r, false), push: false };
    if (!set.length) return pitch(state, pick(r, review.length ? notLast(review) : ['where']), r, missed);
    return pitch(state, pick(r, notLast(set)), r, missed);
  }

  function ask(p: Asking): Problem {
    const meeting = meetingsFor(p.q).find(m => !met.has(m) && !read().met.includes(m));
    if (meeting) { met.add(meeting); waiting = p; return (current = { mode: 'meet', meeting, push: false }); }
    waiting = null;
    lastMode = p.mode;
    return (current = p);
  }

  return {
    makeProblem(r) {
      if (waiting) return ask(waiting);
      const base = nextBase(read(), r);
      asked++;
      return ask({ ...base, q: makeQuestion(base.mode, base.level, base.stretch, r) });
    },
    replay(p, r) {
      if (p.mode === 'meet') return (current = p);
      return ask({ ...p, q: makeQuestion(p.mode, p.level, p.stretch, r), push: false, replay: true });
    },
    check(p, answer): Check {
      const right = isRight(p, answer);
      if (right === null) return { kind: 'not-an-answer' };
      if (p.mode === 'meet') return { kind: 'correct' };
      return verdict(right, p, answer, explain);
    },
    needsEarlyHelp: () => !!current && current.mode !== 'meet' && struggling(read().modes[current.mode]),
    note(outcome) { missed = outcome !== 'clean'; },
  };
}
