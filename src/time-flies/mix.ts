// Every Round mixes all the kinds of question he has opened. Each question picks a kind (never the same one twice in a
// row, when there's a choice), then how hard: mostly at that kind's Level, which pushes him and counts toward Mastery,
// with about one in three from an easier Level for a quick win. Right after a miss, the next one is always easier.
import { int, pick, shuffle, type Rng } from '../game/rng';
import type { Check, LearningSession, Outcome } from '../learning/session';
import { struggling } from '../modes/progress';
import { makeQuiz, type QuizKind, type QuizProblem } from './calendar/calendar';
import { parseDigital, sameTime, startingTime, type ClockTime, type Level } from './clock/time';
import {
  makeChoice, makeSet, MODE_IDS, replayChoice, verdict,
  type Asked, type ChoiceProblem, type Explanation, type LearningState, type ModeId, type SetProblem,
} from './learning';

/** About one question in three comes from an easier Level. */
export const EASY_SHARE = 1 / 3;

interface Base extends Asked { readonly level: Level }
interface Shape { readonly level: Level; readonly push: boolean }
export type Problem =
  | Shape & { readonly mode: 'find'; readonly choice: ChoiceProblem }
  | Shape & { readonly mode: 'read'; readonly choice: ChoiceProblem }
  | Shape & { readonly mode: 'set'; readonly set: SetProblem }
  | Shape & { readonly mode: QuizKind; readonly quiz: QuizProblem };

/** The kind and Level of the next question. `last`: the kind just asked, and whether he missed it. */
export function pickNext(state: LearningState, rng: Rng, last?: { mode: ModeId; missed: boolean }): Base {
  const open = MODE_IDS.filter(m => state.modes[m].opened);
  const others = open.filter(m => m !== last?.mode);
  const mode = pick(rng, others.length ? others : open), top = state.modes[mode].level as Level; // the clock's Levels stop at 3
  const easy = top > 1 && (last?.missed || rng() < EASY_SHARE);
  return easy ? { mode, level: int(rng, 1, top - 1) as Level, push: false } : { mode, level: top, push: true };
}

export interface Explainers {
  find: Explanation<ChoiceProblem>;
  read: Explanation<ChoiceProblem>;
  set: Explanation<SetProblem>;
  quiz: Explanation<QuizProblem>;
}

/** The Round's questions. `note` hears how each one went, so a miss is followed by an easier one. */
export function mixedSession(read: () => LearningState, explain: Explainers): LearningSession<Problem, string> & { note(outcome: Outcome): void } {
  let current: Problem | undefined, missed = false;
  let lastTime: ClockTime | undefined; // a clock question never repeats the time just asked
  const make = (base: Base, rng: Rng, avoid?: Problem): Problem => {
    if (base.mode === 'find' || base.mode === 'read') {
      const choice = makeChoice(base.level, rng, lastTime);
      lastTime = choice.target;
      return { level: base.level, push: base.push, mode: base.mode, choice } as Problem;
    }
    if (base.mode === 'set') {
      const set = makeSet(base.level, rng, lastTime);
      lastTime = set.target;
      return { level: base.level, push: base.push, mode: 'set', set };
    }
    return { level: base.level, push: base.push, mode: base.mode, quiz: makeQuiz(base.mode, base.level, rng, avoid && 'quiz' in avoid ? avoid.quiz.ask : undefined) };
  };
  return {
    makeProblem(rng) {
      const next = pickNext(read(), rng, current && { mode: current.mode, missed });
      return (current = make(next, rng, current));
    },
    replay(p, rng) {
      if (p.mode === 'find' || p.mode === 'read') return (current = { ...p, choice: replayChoice(p.choice, p.level, rng) });
      if (p.mode === 'set') return (current = { ...p, set: { target: p.set.target, start: startingTime(p.set.target, p.level, rng) } });
      return (current = { ...p, quiz: { ...p.quiz, choices: shuffle(rng, p.quiz.choices) } });
    },
    check(p, answer): Check {
      if (p.mode === 'find' || p.mode === 'read' || p.mode === 'set') {
        const t = parseDigital(answer);
        if (!t) return { kind: 'not-an-answer' };
        const target = p.mode === 'set' ? p.set.target : p.choice.target;
        return p.mode === 'set' ? verdict(sameTime(t, target), p.set, answer, explain.set) : verdict(sameTime(t, target), p.choice, answer, explain[p.mode]);
      }
      if (!p.quiz.choices.includes(answer as never)) return { kind: 'not-an-answer' };
      return verdict(answer === p.quiz.answer, p.quiz, answer, explain.quiz);
    },
    needsEarlyHelp: () => !!current && struggling(read().modes[current.mode]),
    note(outcome) { missed = outcome !== 'clean'; },
  };
}
