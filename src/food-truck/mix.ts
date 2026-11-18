// Every Round mixes the kinds he has opened, never the same kind twice running while there's another. Unstarred kinds are practised;
// a starred kind comes back as about one review question a Round. Each question then picks how hard, as in Math Bots and Rover Code:
// mostly at that kind's Level, which counts toward Mastery, about one in three easier, and always easier right after a miss.
//
// Add It Up overlaps Math Bots' sums, so its share is kept small: at most one Add It Up question a Round (a missed one still comes back),
// unless it's the only kind there is. The first Rounds are Tune-Up (learning.ts): that one Add It Up is a probe at Level 2 until the
// row is decided. A question that needs something he hasn't met (needs and wants, goods and services, the money) waits for its
// Meeting. A miss comes back as a new question of the same kind and Level, with no Mastery credit, since he has just been shown the old
// answer.
import { int, pick, type Rng } from '../game/rng';
import type { Check, LearningSession, Outcome } from '../learning/session';
import { stretchOf, struggling, type Stretch } from '../modes/progress';
import { isRightAnswer, makeQuestion, type Level, type Question } from './econ/problems';
import { ANCHORS, kindMeeting, meetingFor, MODE_IDS, PROBE_LEVEL, rowOpen, tuneUpOver, verdict, type Anchor, type Explanation, type LearningState, type MeetingId, type ModeId } from './learning';

export const EASY_SHARE = 1 / 3;
/** Add It Up questions in a Round, not counting a miss coming back. */
export const MOST_TOTALS = 1;
/** Meetings in a Round: each counts as one of the five. */
export const MOST_MEETS = 2;

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
  let current: Problem | undefined, lastMode: ModeId | undefined, missed = false, waiting: Asking | null = null, asked = 0, totals = 0, meets = 0;
  const reviewAt = int(rng, 0, 4), probed = new Set<Anchor>(), met = new Set<MeetingId>();
  const notLast = (kinds: readonly ModeId[]) => { const others = kinds.filter(m => m !== lastMode); return others.length ? others : [...kinds]; };

  /** Add It Up only while none has been asked this Round (during Tune-Up the probe is that one), or when nothing else is open. And two
   *  Meetings a Round at most, so a new player's first Round is mostly questions: after that, kinds that need another wait for the next
   *  Round, while there's another kind. */
  const known = (state: LearningState, m: ModeId) => { const mt = kindMeeting(m); return !mt || met.has(mt) || state.met.includes(mt); };
  const limit = (state: LearningState, kinds: readonly ModeId[]) => {
    const rest = kinds.filter(m => m !== 'total' || (totals < MOST_TOTALS && tuneUpOver(state)));
    const some = rest.length ? rest : [...kinds], calm = some.filter(m => meets < MOST_MEETS || known(state, m));
    return calm.length ? calm : some;
  };

  function nextBase(state: LearningState, r: Rng): Base {
    if (!tuneUpOver(state) && totals < MOST_TOTALS) {
      const anchor = ANCHORS.filter(a => rowOpen(state.tuneUp[a]) && !probed.has(a) && a !== lastMode && state.modes[a].opened && (meets < MOST_MEETS || known(state, a))).sort((a, b) => state.tuneUp[a].asked - state.tuneUp[b].asked)[0];
      // not the first question of all: a new player meets needs and wants first
      if (anchor && asked > 0) { probed.add(anchor); return { mode: anchor, level: PROBE_LEVEL, push: false, stretch: 0, probe: anchor }; }
    }
    // a new player's very first question is about needs and wants, so he meets the game's first idea first
    if (asked === 0 && !state.met.length && state.modes.need.opened && !state.modes.need.starred) return pitch(state, 'need', r, false);
    const review = limit(state, reviewKinds(state)), set = limit(state, practised(state));
    if (asked === reviewAt && review.some(m => m !== lastMode)) return { ...pitch(state, pick(r, notLast(review)), r, false), push: false };
    if (!set.length) return pitch(state, pick(r, review.length ? notLast(review) : ['need']), r, missed);
    return pitch(state, pick(r, notLast(set)), r, missed);
  }

  function ask(p: Asking): Problem {
    const meeting = meetingFor(p.q);
    if (meeting && !met.has(meeting) && !read().met.includes(meeting)) { met.add(meeting); meets++; waiting = p; return (current = { mode: 'meet', meeting, push: false }); }
    waiting = null;
    lastMode = p.mode;
    return (current = p);
  }

  return {
    makeProblem(r) {
      if (waiting) return ask(waiting);
      const base = nextBase(read(), r);
      asked++;
      if (base.mode === 'total') totals++;
      return ask({ ...base, q: makeQuestion(base.mode, base.level, base.stretch, r) });
    },
    replay(p, r) {
      if (p.mode === 'meet') return (current = p);
      // its idea has been met already (it was asked once), and a question waiting behind a Meeting keeps waiting
      lastMode = p.mode;
      return (current = { ...p, q: makeQuestion(p.mode, p.level, p.stretch, r), push: false, replay: true, probe: undefined });
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
