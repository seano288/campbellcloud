export type Rng = () => number;
/** One problem's result in a mode's 10-problem window. */
export type Outcome = 'clean' | 'helped' | 'missed';
export type Effect = (signal: AbortSignal) => Promise<void>;

export type Check =
  | { kind: 'correct' }
  | { kind: 'incorrect'; explain(teach: boolean, signal: AbortSignal): Promise<void> }
  | { kind: 'not-an-answer'; prompt?: Effect };

export interface LearningSession<P, A> {
  makeProblem(rng: Rng): P;
  replay(problem: P, rng: Rng): P;
  check(problem: P, answer: A): Check;
  needsEarlyHelp(): boolean;
}

export interface ProblemActions<A> {
  readonly busy: boolean;
  submit(answer: A): 'correct' | 'incorrect' | 'not-an-answer' | 'ignored';
  help(run: Effect): void;
}

export interface SolvedProblem {
  index: number;
  outcome: Outcome;
  misses: number;
  helped: boolean;
  replay: boolean;
}

export interface RoundResult {
  roundId: string;
  status: 'completed' | 'abandoned';
  results: readonly SolvedProblem[];
}

export type Progression<S, C, F> = (state: S, context: C, result: SolvedProblem) => { state: S; changes: F[] };
