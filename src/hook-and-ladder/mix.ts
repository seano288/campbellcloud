// Every Round mixes the kinds he has opened, never the same kind twice running while there's another. Unstarred kinds are practised;
// a starred kind comes back as about one review question a Round. Each question then picks how hard, as in Math Bots: mostly at that
// kind's Level, which counts toward Mastery, about one in three easier, and always easier right after a miss.
//
// A miss comes back later as a fresh question of the same kind and Level, with no Mastery credit, since he has just been shown the
// old answer. Within a Round the same word is not asked about twice when another will do.
import { int, pick, type Rng } from '../game/rng';
import type { Check, LearningSession, Outcome } from '../learning/session';
import { stretchOf, struggling, type Stretch } from '../modes/progress';
import { isAnswer, isRightAnswer, makeQuestion, topicOf, type Level, type Question } from './quiz/problems';
import { MODE_IDS, verdict, type Explanation, type LearningState, type ModeId } from './learning';

export const EASY_SHARE = 1 / 3;

export type Asking = { readonly mode: ModeId; readonly level: Level; readonly push: boolean; readonly stretch: Stretch; readonly q: Question; readonly replay?: boolean };
export type Problem = Asking;

export const practised = (state: Pick<LearningState, 'modes'>) => MODE_IDS.filter(m => state.modes[m].opened && !state.modes[m].starred);
export const reviewKinds = (state: Pick<LearningState, 'modes'>) => MODE_IDS.filter(m => state.modes[m].opened && state.modes[m].starred);

interface Base { readonly mode: ModeId; readonly level: Level; readonly push: boolean; readonly stretch: Stretch }

/** How hard a question of this kind is. */
export function pitch(state: LearningState, mode: ModeId, rng: Rng, missed: boolean): Base {
  const m = state.modes[mode], top = m.level as Level;
  const easy = top > 1 && (missed || rng() < EASY_SHARE);
  return easy ? { mode, level: int(rng, 1, top - 1) as Level, push: false, stretch: 0 } : { mode, level: top, push: true, stretch: stretchOf(m) };
}

/** Is this the right answer? `null`: not an answer at all. */
export function isRight(p: Problem, answer: string): boolean | null {
  if (!isAnswer(p.q, answer)) return null;
  return isRightAnswer(p.q, answer);
}

export { topicOf };

/** A Round's questions. `note` hears how each went, so a miss is followed by an easier one. */
export function mixedSession(read: () => LearningState, explain: Explanation<Asking>, rng: Rng = Math.random): LearningSession<Problem, string> & { note(outcome: Outcome): void } {
  let current: Problem | undefined, lastMode: ModeId | undefined, missed = false, asked = 0;
  const reviewAt = int(rng, 0, 4), seen = new Set<string>();
  const notLast = (kinds: readonly ModeId[]) => { const others = kinds.filter(m => m !== lastMode); return others.length ? others : [...kinds]; };

  function nextBase(state: LearningState, r: Rng): Base {
    const review = reviewKinds(state), set = practised(state);
    if (asked === reviewAt && review.some(m => m !== lastMode)) return { ...pitch(state, pick(r, notLast(review)), r, false), push: false };
    if (!set.length) return pitch(state, pick(r, review.length ? notLast(review) : ['join']), r, missed);
    return pitch(state, pick(r, notLast(set)), r, missed);
  }

  /** A fresh question of this kind and Level, not one already asked this Round if a few tries find another. */
  function fresh(b: Base, r: Rng): Question {
    let q = makeQuestion(b.mode, b.level, b.stretch, r);
    for (let tries = 0; tries < 8 && seen.has(topicOf(q)); tries++) q = makeQuestion(b.mode, b.level, b.stretch, r);
    seen.add(topicOf(q));
    return q;
  }

  return {
    makeProblem(r) {
      const base = nextBase(read(), r);
      asked++;
      lastMode = base.mode;
      return (current = { ...base, q: fresh(base, r) });
    },
    replay(p, r) {
      lastMode = p.mode;
      return (current = { ...p, q: fresh(p, r), push: false, replay: true });
    },
    check(p, answer): Check {
      const right = isRight(p, answer);
      if (right === null) return { kind: 'not-an-answer' };
      return verdict(right, p, answer, explain);
    },
    needsEarlyHelp: () => !!current && struggling(read().modes[current.mode]),
    note(outcome) { missed = outcome !== 'clean'; },
  };
}
