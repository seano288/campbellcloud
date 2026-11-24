// Every Round mixes the kinds he has opened, never the same kind twice running while there's another. Unstarred kinds are practised;
// a starred kind comes back as about one review question a Round. Each question then picks how hard, as in Math Bots and Rover Code:
// mostly at that kind's Level, which counts toward Mastery, about one in three easier, and always easier right after a miss.
//
// The first Rounds are Tune-Up (learning.ts): one probe from each open row a Round until every row is decided. A question whose words use
// a syllable type he hasn't met (open, consonant-le, final y) waits for its Meeting. A miss comes back as a new question of the same kind
// and Level, with no Mastery credit, since he has just been shown the old answer.
import { int, pick, type Rng } from '../game/rng';
import type { Check, LearningSession, Outcome } from '../learning/session';
import { stretchOf, struggling, type Stretch } from '../modes/progress';
import { isRightAnswer, makeQuestion, type Level, type Question } from './reading/problems';
import { ANCHORS, meetingFor, MODE_IDS, PROBE_LEVEL, rowOpen, tuneUpOver, verdict, type Anchor, type Explanation, type LearningState, type MeetingId, type ModeId } from './learning';

export const EASY_SHARE = 1 / 3;

export type Asking = {
  readonly mode: ModeId; readonly level: Level; readonly push: boolean; readonly stretch: Stretch;
  readonly q: Question; readonly probe?: Anchor; readonly replay?: boolean;
};
export type Meet = { readonly mode: 'meet'; readonly meeting: MeetingId; readonly push: false };
export type Problem = Asking | Meet;

export const practised = (state: Pick<LearningState, 'modes'>) => MODE_IDS.filter(m => state.modes[m].opened && !state.modes[m].starred);
export const reviewKinds = (state: Pick<LearningState, 'modes'>) => MODE_IDS.filter(m => state.modes[m].opened && state.modes[m].starred);

interface Base { readonly mode: ModeId; readonly level: Level; readonly push: boolean; readonly stretch: Stretch; readonly probe?: Anchor }

/** How hard a question of this kind is. */
export function pitch(state: LearningState, mode: ModeId, rng: Rng, missed: boolean): Base {
  const m = state.modes[mode], top = m.level as Level;
  const easy = top > 1 && (missed || rng() < EASY_SHARE);
  return easy ? { mode, level: int(rng, 1, top - 1) as Level, push: false, stretch: 0 } : { mode, level: top, push: true, stretch: stretchOf(m) };
}

export function isRight(p: Problem, answer: string): boolean | null {
  if (p.mode === 'meet') return true;
  return isRightAnswer(p.q, answer);
}

/** A Round's questions. `note` hears how each went, so a miss is followed by an easier one. */
export function mixedSession(read: () => LearningState, explain: Explanation<Asking>, rng: Rng = Math.random): LearningSession<Problem, string> & { note(outcome: Outcome): void } {
  let current: Problem | undefined, lastMode: ModeId | undefined, missed = false, waiting: Asking | null = null, asked = 0;
  const reviewAt = int(rng, 0, 4), probed = new Set<Anchor>(), met = new Set<MeetingId>();
  const notLast = (kinds: readonly ModeId[]) => { const others = kinds.filter(m => m !== lastMode); return others.length ? others : [...kinds]; };

  function nextBase(state: LearningState, r: Rng): Base {
    if (!tuneUpOver(state)) {
      const anchor = ANCHORS.filter(a => rowOpen(state.tuneUp[a]) && !probed.has(a) && a !== lastMode).sort((a, b) => state.tuneUp[a].asked - state.tuneUp[b].asked)[0];
      if (anchor) { probed.add(anchor); return { mode: anchor, level: PROBE_LEVEL, push: false, stretch: 0, probe: anchor }; }
    }
    const review = reviewKinds(state), set = practised(state);
    if (asked === reviewAt && review.some(m => m !== lastMode)) return { ...pitch(state, pick(r, notLast(review)), r, false), push: false };
    if (!set.length) return pitch(state, pick(r, review.length ? notLast(review) : ['count']), r, missed);
    return pitch(state, pick(r, notLast(set)), r, missed);
  }

  function ask(p: Asking): Problem {
    const meeting = meetingFor(p.q, [...read().met, ...met]);
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
      return ask({ ...p, q: makeQuestion(p.mode, p.level, p.stretch, r), push: false, replay: true, probe: undefined } as Asking);
    },
    check(p, answer): Check {
      const right = isRight(p, answer);
      if (right === null) return { kind: 'not-an-answer' };
      if (p.mode === 'meet') return { kind: 'correct' };
      return verdict(right, p, answer, explain);
    },
    // a probe stays a probe: no early help, whatever his Level has been doing
    needsEarlyHelp: () => !!current && current.mode !== 'meet' && !current.probe && struggling(read().modes[current.mode]),
    note(outcome) { missed = outcome !== 'clean'; },
  };
}
