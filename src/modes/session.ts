import type { Check, Effect, LearningSession, Rng } from '../learning/session';
import type { MoneyKey } from '../money/money';
import { checkCount, makeCount, replayCount, type CountProblem } from './count/count';
import type { Level } from './ids';
import { checkLearn, makeLearn, replayLearn, type LearnProblem } from './learn/learn';
import { checkPay, makePay, type PayCheck, type PayProblem } from './pay/pay';
import { struggling } from './progress';
import type { ModeProgress } from './state';

export type Explanation<P, A> = (problem: P, answer: A, teach: boolean, signal: AbortSignal) => Promise<void>;

function choiceVerdict<P, A>(correct: boolean, problem: P, answer: A, explain: Explanation<P, A>): Check {
  return correct ? { kind: 'correct' } : { kind: 'incorrect', explain: (teach, signal) => explain(problem, answer, teach, signal) };
}

function session<P, A>(level: Level, read: () => ModeProgress, make: (level: Level, rng: Rng) => P, replay: (p: P, rng: Rng) => P, check: (p: P, answer: A) => Check): LearningSession<P, A> {
  return { makeProblem: rng => make(level, rng), replay, check, needsEarlyHelp: () => struggling(read()) };
}

export const learnSession = (level: Level, read: () => ModeProgress, explain: Explanation<LearnProblem, MoneyKey>) =>
  session(level, read, makeLearn, replayLearn, (p, answer: MoneyKey) => choiceVerdict(checkLearn(p, answer), p, answer, explain));

export const countSession = (level: Level, read: () => ModeProgress, explain: Explanation<CountProblem, number>) =>
  session(level, read, makeCount, replayCount, (p, answer: number) => choiceVerdict(checkCount(p, answer), p, answer, explain));

export type PaymentExplanation = (result: Extract<PayCheck, { kind: 'short' | 'over' }>, teach: boolean, signal: AbortSignal) => Promise<void>;

export function checkPayInput(p: { price: number }, tray: readonly MoneyKey[], explain: PaymentExplanation, prompt: Effect): Check {
  const result = checkPay(p, tray);
  if (result.kind === 'paid') return { kind: 'correct' };
  if (result.kind === 'empty') return { kind: 'not-an-answer', prompt };
  return { kind: 'incorrect', explain: (teach, signal) => explain(result, teach, signal) };
}

export const paySession = (level: Level, read: () => ModeProgress, explain: (problem: PayProblem, ...args: Parameters<PaymentExplanation>) => Promise<void>, prompt: Effect) =>
  session(level, read, makePay, (p: PayProblem) => p, (p, tray: readonly MoneyKey[]) => checkPayInput(p, tray, (result, teach, signal) => explain(p, result, teach, signal), prompt));
