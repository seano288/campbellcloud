import { signal, type ReadonlySignal } from '@preact/signals';
import { ROUND_LENGTH, takeAgain, teachNow, THINK_MS, type Again } from '../round/rules';
import type { Effect, LearningSession, Outcome, ProblemActions, Rng, RoundResult, SolvedProblem } from './session';

export interface ProblemInstance<P, A> {
  readonly id: number;
  readonly problem: P;
  readonly actions: ProblemActions<A>;
  readonly signal: AbortSignal;
}

export interface RoundDisplay<P, A> {
  readonly roundId: string;
  readonly phase: 'introduction' | 'answering' | 'explaining' | 'thinking' | 'success' | 'completed' | 'abandoned';
  readonly introduction: { readonly signal: AbortSignal; acknowledge(): void } | null;
  readonly current: ProblemInstance<P, A>;
  readonly answered: number;
  readonly total: number;
  readonly results: readonly SolvedProblem[];
}

export interface RoundOptions<P, A> {
  roundId: string;
  session: LearningSession<P, A>;
  rng: Rng;
  signal?: AbortSignal;
  introduction?: { acknowledge(): void };
  /** The answers he already gave in this Round before the page reloaded: it carries on from the next one. */
  resume?: readonly SolvedProblem[];
  effects?: { correct?(fact: SolvedProblem, signal: AbortSignal): Promise<void>; incorrect?: Effect };
  interrupt(fact: { roundId: string; problemId: number; index: number; outcome: Exclude<Outcome, 'clean'> }): void;
  solved(roundId: string, fact: SolvedProblem): void;
  terminal(fact: RoundResult): void;
}

export function createRound<P, A>({ roundId, session, rng, signal: parent, introduction, resume = [], effects, interrupt, solved, terminal }: RoundOptions<P, A>): {
  display: ReadonlySignal<RoundDisplay<P, A>>;
  leave(): void;
} {
  let sequence = 0;
  let terminalStatus: RoundResult['status'] | null = null;
  let results: readonly SolvedProblem[] = resume;
  let queue: Again<P>[] = [];
  let work: AbortController;
  let transition: ReturnType<typeof setTimeout> | undefined;
  let thinking: ReturnType<typeof setTimeout> | undefined;
  const intro = new AbortController();
  const roundWork = new AbortController();
  const display = signal<RoundDisplay<P, A>>({
    roundId, phase: introduction ? 'introduction' : 'answering',
    introduction: introduction ? {
      signal: intro.signal,
      acknowledge() {
        if (intro.signal.aborted || display.peek().phase !== 'introduction') return;
        intro.abort();
        introduction.acknowledge();
        if (display.peek().phase === 'introduction') display.value = { ...display.peek(), phase: 'answering', introduction: null };
      },
    } : null,
    current: instance(session.makeProblem(rng)), answered: results.length, total: ROUND_LENGTH, results,
  });

  function instance(problem: P, replay = false): ProblemInstance<P, A> {
    const lifetime = new AbortController();
    let misses = 0, helped = false, ended = false, locked = false;
    work = lifetime;
    const report = (outcome: Exclude<Outcome, 'clean'>) => interrupt({ roundId, problemId: current.id, index: display.peek().answered + 1, outcome });
    const markHelp = () => { helped = true; report('helped'); };
    const current: ProblemInstance<P, A> = {
      id: ++sequence, problem, signal: lifetime.signal,
      actions: {
        get busy() { return ended || locked || lifetime.signal.aborted || display.peek().phase !== 'answering'; },
        submit(answer) {
          if (current.actions.busy) return 'ignored';
          const verdict = session.check(problem, answer);
          if (verdict.kind === 'not-an-answer' && verdict.prompt) void run(verdict.prompt, lifetime.signal);
          if (verdict.kind === 'incorrect') {
            misses++;
            locked = true;
            report('missed');
            if (lifetime.signal.aborted) return verdict.kind;
            const teach = teachNow(misses, session.needsEarlyHelp());
            if (teach) markHelp();
            if (lifetime.signal.aborted) return verdict.kind;
            display.value = { ...display.peek(), phase: 'explaining' };
            if (effects?.incorrect) void run(effects.incorrect, lifetime.signal);
            void run(signal => verdict.explain(teach, signal), lifetime.signal).finally(() => {
              if (lifetime.signal.aborted) return;
              display.value = { ...display.peek(), phase: 'thinking' };
              thinking = setTimeout(() => {
                if (!lifetime.signal.aborted) {
                  locked = false;
                  display.value = { ...display.peek(), phase: 'answering' };
                }
              }, THINK_MS);
            });
          }
          if (verdict.kind !== 'correct') return verdict.kind;
          const state = display.peek();
          const fact: SolvedProblem = { index: state.answered + 1, outcome: misses ? 'missed' : helped ? 'helped' : 'clean', misses, helped, replay };
          ended = true;
          results = [...results, fact];
          if (misses && !replay) queue.push({ problem, after: fact.index });
          solved(roundId, fact);
          lifetime.abort();
          if (roundWork.signal.aborted) return 'correct';
          display.value = { ...display.peek(), phase: 'success', answered: fact.index, results };
          if (roundWork.signal.aborted) return 'correct';
          const success = effects?.correct;
          if (success) void run(signal => success(fact, signal), roundWork.signal);
          transition = setTimeout(() => {
            if (display.peek().phase !== 'success' || display.peek().current !== current) return;
            if (fact.index === ROUND_LENGTH) {
              terminalStatus = 'completed';
              terminal({ roundId, status: 'completed', results });
              finish();
              display.value = { ...display.peek(), phase: 'completed' };
            } else {
              const back = takeAgain(queue, fact.index);
              if (back) queue = back.rest;
              display.value = { ...display.peek(), phase: 'answering', current: instance(back ? session.replay(back.problem, rng) : session.makeProblem(rng), !!back) };
            }
          }, fact.index === ROUND_LENGTH ? 900 : 1500);
          return 'correct';
        },
        help(effect) {
          if (ended || lifetime.signal.aborted || display.peek().phase === 'introduction') return;
          markHelp();
          void run(effect, lifetime.signal);
        },
      },
    };
    return current;
  }

  async function run(effect: Effect, signal: AbortSignal) {
    try { if (!signal.aborted) await effect(signal); } catch {}
  }

  function finish() {
    roundWork.abort();
    parent?.removeEventListener('abort', leave);
  }

  function leave() {
    const alreadyEnded = terminalStatus !== null;
    terminalStatus ??= 'abandoned';
    clearTimeout(transition);
    clearTimeout(thinking);
    intro.abort();
    work.abort();
    finish();
    const state = display.peek();
    if (alreadyEnded) return;
    display.value = { ...state, phase: 'abandoned', answered: results.length, results };
    terminal({ roundId, status: 'abandoned', results });
  }

  parent?.addEventListener('abort', leave, { once: true });
  if (parent?.aborted) leave();
  return { display, leave };
}
