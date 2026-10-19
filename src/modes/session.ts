// A Round's problems adapt as he plays. Each one is asked at his Level, sized by how his recent answers went
// (src/modes/progress.ts stretchOf), and those count toward Mastery. The first problem of a Round, and the one right after
// a miss or help, is a warm-up from the Level below, which doesn't count. If he levels up during a Round, the rest of it
// is asked at its hardest and doesn't count toward the new Level.
import type { Check, Effect, LearningSession, Outcome, Rng } from '../learning/session';
import type { MoneyKey } from '../money/money';
import { checkCount, makeCount, replayCount, type CountProblem } from './count/count';
import type { Level } from './ids';
import { checkLearn, makeLearn, replayLearn, type LearnProblem } from './learn/learn';
import { makePay, type PayProblem } from './pay/pay';
import { checkFewest, checkPay, type MoneyPayment, type PayMiss } from '../money/payment';
import { stretchOf, struggling, type Stretch } from './progress';
import type { ModeProgress } from './state';

export type Explanation<P, A> = (problem: P, answer: A, teach: boolean, signal: AbortSignal) => Promise<void>;

/** Whether a problem was asked at his Level (`push`, so it counts toward Mastery) or is an easier one mixed in. */
export interface Asked { readonly push: boolean }
export type Adaptive<P> = P & Asked;
export type AdaptiveSession<P, A> = LearningSession<Adaptive<P>, A> & {
  /** How the problem just solved went, so a miss is followed by an easier one. */
  note(outcome: Outcome): void;
};

/** The Level and stretch of the next problem. `first`: it opens the Round; `missed`: he missed the one before. */
export function nextShape(level: Level, now: ModeProgress, first: boolean, missed: boolean): { level: Level; stretch: Stretch; push: boolean } {
  if (now.level !== level) return { level, stretch: 2, push: false };
  if (level > 1 && (first || missed)) return { level: (level - 1) as Level, stretch: 1, push: false };
  return { level, stretch: missed ? 0 : stretchOf(now), push: true };
}

function choiceVerdict<P, A>(correct: boolean, problem: P, answer: A, explain: Explanation<P, A>): Check {
  return correct ? { kind: 'correct' } : { kind: 'incorrect', explain: (teach, signal) => explain(problem, answer, teach, signal) };
}

function session<P, A>(level: Level, read: () => ModeProgress, make: (level: Level, rng: Rng, stretch: Stretch) => P, replay: (p: P, rng: Rng) => P, check: (p: Adaptive<P>, answer: A) => Check): AdaptiveSession<P, A> {
  let first = true, missed = false;
  return {
    makeProblem(rng) {
      const shape = nextShape(level, read(), first, missed);
      first = false;
      return { ...make(shape.level, rng, shape.stretch), push: shape.push };
    },
    replay: (p, rng) => ({ ...replay(p, rng), push: p.push }),
    check,
    needsEarlyHelp: () => struggling(read()),
    note(outcome) { missed = outcome !== 'clean'; },
  };
}

export const learnSession = (level: Level, read: () => ModeProgress, explain: Explanation<LearnProblem, MoneyKey>) =>
  session(level, read, makeLearn, replayLearn, (p, answer: MoneyKey) => choiceVerdict(checkLearn(p, answer), p, answer, explain));

export const countSession = (level: Level, read: () => ModeProgress, explain: Explanation<CountProblem, number>) =>
  session(level, read, makeCount, replayCount, (p, answer: number) => choiceVerdict(checkCount(p, answer), p, answer, explain));

export type PaymentExplanation = (result: PayMiss, teach: boolean, signal: AbortSignal) => Promise<void>;

export function checkPayInput(p: MoneyPayment & { fewest?: boolean }, tray: readonly MoneyKey[], explain: PaymentExplanation, prompt: Effect): Check {
  const paid = checkPay(p, tray);
  const result = paid.kind === 'paid' && p.fewest ? checkFewest(p, tray) : paid;
  if (result.kind === 'paid') return { kind: 'correct' };
  if (result.kind === 'empty') return { kind: 'not-an-answer', prompt };
  return { kind: 'incorrect', explain: (teach, signal) => explain(result, teach, signal) };
}

export const paySession = (level: Level, read: () => ModeProgress, explain: (problem: PayProblem, ...args: Parameters<PaymentExplanation>) => Promise<void>, prompt: Effect) =>
  session(level, read, makePay, (p: PayProblem) => p, (p, tray: readonly MoneyKey[]) => checkPayInput(p, tray, (result, teach, signal) => explain(p, result, teach, signal), prompt));
