// Every Round mixes the kinds he has opened, never the same kind twice running while there's another. Unstarred kinds are practised;
// a starred kind comes back as about one review question a Round. Each question then picks how hard, as in Math Bots and Globe Hopper:
// mostly at that kind's Level, which counts toward Mastery, about one in three easier, and always easier right after a miss.
//
// The first Rounds are Tune-Up (learning.ts): one probe from each open row a Round until every row is decided. A miss comes back as a new
// question of the same kind and Level, with no Mastery credit, since he has just been shown the old answer.
import { int, pick, type Rng } from '../game/rng';
import type { Check, LearningSession, Outcome } from '../learning/session';
import { stretchOf, struggling, type Stretch } from '../modes/progress';
import { isRightAnswer, makeQuestion, type Level, type Question } from './questions/problems';
import { ANCHORS, MODE_IDS, PROBE_LEVEL, rowOpen, tuneUpOver, verdict, type Anchor, type Explanation, type LearningState, type ModeId } from './learning';

export const EASY_SHARE = 1 / 3;

export type Asking = {
  readonly mode: ModeId; readonly level: Level; readonly push: boolean; readonly stretch: Stretch;
  readonly q: Question; readonly probe?: Anchor; readonly replay?: boolean;
};
export type Problem = Asking;

export const practised = (state: Pick<LearningState, 'modes'>) => MODE_IDS.filter(m => state.modes[m].opened && !state.modes[m].starred);
export const reviewKinds = (state: Pick<LearningState, 'modes'>) => MODE_IDS.filter(m => state.modes[m].opened && state.modes[m].starred);

interface Base { readonly mode: ModeId; readonly level: Level; readonly push: boolean; readonly stretch: Stretch; readonly probe?: Anchor }

/** How hard a question of this kind is. */
export function pitch(state: LearningState, mode: ModeId, rng: Rng, missed: boolean): Base {
  const m = state.modes[mode], top = m.level as Level;
  const easy = top > 1 && (missed || rng() < EASY_SHARE);
  return easy ? { mode, level: int(rng, 1, top - 1) as Level, push: false, stretch: 0 } : { mode, level: top, push: true, stretch: stretchOf(m) };
}

export const isRight = (p: Problem, answer: string): boolean | null => isRightAnswer(p.q, answer);

/** A Round's questions. `note` hears how each went, so a miss is followed by an easier one. */
export function mixedSession(read: () => LearningState, explain: Explanation<Asking>, rng: Rng = Math.random): LearningSession<Problem, string> & { note(outcome: Outcome): void } {
  let current: Problem | undefined, lastMode: ModeId | undefined, missed = false, asked = 0;
  const reviewAt = int(rng, 0, 4), probed = new Set<Anchor>();
  const notLast = (kinds: readonly ModeId[]) => { const others = kinds.filter(m => m !== lastMode); return others.length ? others : [...kinds]; };

  function nextBase(state: LearningState, r: Rng): Base {
    if (!tuneUpOver(state)) {
      const anchor = ANCHORS.filter(a => rowOpen(state.tuneUp[a]) && !probed.has(a) && a !== lastMode).sort((a, b) => state.tuneUp[a].asked - state.tuneUp[b].asked)[0];
      if (anchor) { probed.add(anchor); return { mode: anchor, level: PROBE_LEVEL, push: false, stretch: 0, probe: anchor }; }
    }
    const review = reviewKinds(state), set = practised(state);
    if (asked === reviewAt && review.some(m => m !== lastMode)) return { ...pitch(state, pick(r, notLast(review)), r, false), push: false };
    if (!set.length) return pitch(state, pick(r, review.length ? notLast(review) : ['push']), r, missed);
    return pitch(state, pick(r, notLast(set)), r, missed);
  }
  const ask = (p: Asking): Problem => { lastMode = p.mode; return (current = p); };

  return {
    makeProblem(r) {
      const base = nextBase(read(), r);
      asked++;
      return ask({ ...base, q: makeQuestion(base.mode, base.level, r) });
    },
    replay(p, r) { return ask({ ...p, q: makeQuestion(p.mode, p.level, r), push: false, replay: true, probe: undefined } as Asking); },
    check(p, answer): Check {
      const right = isRight(p, answer);
      if (right === null) return { kind: 'not-an-answer' };
      return verdict(right, p, answer, explain);
    },
    // a probe stays a probe: no early help, whatever his Level has been doing
    needsEarlyHelp: () => !!current && !current.probe && struggling(read().modes[current.mode]),
    note(outcome) { missed = outcome !== 'clean'; },
  };
}
