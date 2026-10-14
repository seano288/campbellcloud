export type Outcome = 'clean' | 'helped' | 'missed';
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
export type CompletedRound = RoundResult & { status: 'completed' };
export type Effect = (signal: AbortSignal) => Promise<void>;
export type Check =
  | { kind: 'correct' }
  | { kind: 'incorrect'; explain(teach: boolean, signal: AbortSignal): Promise<void> }
  | { kind: 'not-an-answer'; prompt?: Effect };
export interface LearningSession<P, A> {
  makeProblem(rng: () => number): P;
  replay(problem: P, rng: () => number): P;
  check(problem: P, answer: A): Check;
  needsEarlyHelp(): boolean;
}
export interface Learning<P, A, L> {
  title: string;
  initial: L;
  session(): LearningSession<P, A>;
  record(state: L, result: SolvedProblem): L;
  describe(problem: P): string;
  answers: readonly { label: string; answer: A }[];
}
export interface CurrencyState { readonly balance: number }
export type CurrencyFailure = 'invalid-balance' | 'invalid-amount' | 'insufficient-funds' | 'overflow';
export type Change<S, E> =
  | { kind: 'accepted'; state: S; amount: number }
  | { kind: 'rejected'; reason: E };
export type EarningsPolicy = (result: CompletedRound) => number;
export type PurchaseProposal<S, E> =
  | { kind: 'ready'; state: S; cost: number }
  | { kind: 'rejected'; reason: E };
export interface RewardPurchases<S, Request, Failure> {
  proposePurchase(state: S, request: Request, balance: number): PurchaseProposal<S, Failure>;
}
export interface RewardCues<S> {
  hasAffordable(state: S, balance: number): boolean;
  becameAffordable(state: S, beforeBalance: number, afterBalance: number): boolean;
}
export interface Reward<S, Request, Failure> extends RewardPurchases<S, Request, Failure>, RewardCues<S> {
  title: string;
  initial: S;
}
export interface Aggregate<L, S> {
  learning: L;
  currency: CurrencyState;
  reward: S;
  completedRounds: number;
}
export interface BackingStore {
  read(key: string): string | null;
  write(key: string, value: string): void;
}
export function memoryStore(): BackingStore {
  const values = new Map<string, string>();
  return { read: key => values.get(key) ?? null, write: (key, value) => { values.set(key, value); } };
}

const validAmount = (amount: number) => Number.isSafeInteger(amount) && amount >= 0;
export const currency = {
  earn(state: CurrencyState, result: CompletedRound, policy: EarningsPolicy): Change<CurrencyState, CurrencyFailure> {
    const amount = policy(result);
    if (!validAmount(state.balance)) return { kind: 'rejected', reason: 'invalid-balance' };
    if (!validAmount(amount)) return { kind: 'rejected', reason: 'invalid-amount' };
    if (!validAmount(state.balance + amount)) return { kind: 'rejected', reason: 'overflow' };
    return { kind: 'accepted', state: { balance: state.balance + amount }, amount };
  },
  debit(state: CurrencyState, amount: number): Change<CurrencyState, CurrencyFailure> {
    if (!validAmount(state.balance)) return { kind: 'rejected', reason: 'invalid-balance' };
    if (!validAmount(amount)) return { kind: 'rejected', reason: 'invalid-amount' };
    if (amount > state.balance) return { kind: 'rejected', reason: 'insufficient-funds' };
    return { kind: 'accepted', state: { balance: state.balance - amount }, amount };
  },
};
export const earnings: EarningsPolicy = result => result.results.filter(r => r.outcome === 'clean').length + 1;

export const clockLearning: Learning<{ hour: number; minute: number }, string, { observations: Outcome[] }> = {
  title: 'Clock stub',
  initial: { observations: [] },
  session: () => ({
    makeProblem: () => ({ hour: 3, minute: 0 }),
    replay: problem => ({ ...problem }),
    check: (problem, answer) => answer === `${problem.hour}:00`
      ? { kind: 'correct' }
      : { kind: 'incorrect', explain: async () => {} },
    needsEarlyHelp: () => false,
  }),
  record: (state, result) => ({ observations: [...state.observations, result.outcome] }),
  describe: () => 'The short hand points to 3. The long hand points to 12. What time is it?',
  answers: [{ label: '3:00', answer: '3:00' }, { label: '4:00', answer: '4:00' }],
};

export const moneyLearning: Learning<{ coins: readonly number[] }, number, { practice: 'count'; answers: number }> = {
  title: 'Money stub',
  initial: { practice: 'count', answers: 0 },
  session: () => ({
    makeProblem: () => ({ coins: [10, 5] }),
    replay: problem => ({ coins: [...problem.coins].reverse() }),
    check: (problem, answer) => answer === problem.coins.reduce((sum, coin) => sum + coin, 0)
      ? { kind: 'correct' }
      : { kind: 'incorrect', explain: async () => {} },
    needsEarlyHelp: () => false,
  }),
  record: state => ({ ...state, answers: state.answers + 1 }),
  describe: () => 'A dime and a nickel. How many cents?',
  answers: [{ label: '15 cents', answer: 15 }, { label: '25 cents', answer: 25 }],
};

export const recruitmentReward: Reward<{ quantity: number }, 'recruit', string> = {
  title: 'Recruitment stub',
  initial: { quantity: 0 },
  hasAffordable: (_state, balance) => balance >= 3,
  becameAffordable: (_state, before, after) => before < 3 && after >= 3,
  proposePurchase(state, _request, balance) {
    if (balance < 3) return { kind: 'rejected', reason: 'insufficient-funds' };
    return { kind: 'ready', cost: 3, state: { quantity: state.quantity + 1 } };
  },
};

export interface GarageState {
  unlocked: string[];
  fitted: string;
  goal: string | null;
}
export interface MoneyCheckoutPolicy { kind: 'practice-money'; priceBand: 1 | 2 | 3 }
export function garageReward(policy: MoneyCheckoutPolicy): Reward<GarageState, 'tires:1', string> {
  if (policy?.kind !== 'practice-money' || ![1, 2, 3].includes(policy.priceBand)) {
    throw new Error('Garage requires an explicit practice-money checkout context');
  }
  return {
    title: 'Garage stub',
    initial: { unlocked: [], fitted: 'tires:0', goal: 'tires:1' },
    hasAffordable: (state, balance) => !state.unlocked.includes('tires:1') && balance >= 5,
    becameAffordable: (state, before, after) => !state.unlocked.includes('tires:1') && before < 5 && after >= 5,
    proposePurchase(state, request, balance) {
      if (state.unlocked.includes(request)) return { kind: 'rejected', reason: 'already-owned' };
      if (balance < 5) return { kind: 'rejected', reason: 'insufficient-funds' };
      return {
        kind: 'ready', cost: 5,
        state: { unlocked: [...state.unlocked, request], fitted: request, goal: state.goal === request ? null : state.goal },
      };
    },
  };
}

let nextRoundId = 1;
export function createApp<P, A, L, S, Request, Failure>(
  learning: Learning<P, A, L>,
  reward: Reward<S, Request, Failure>,
  store: BackingStore,
  key: string,
  policy: EarningsPolicy = earnings,
) {
  if (!key.trim()) throw new Error('An explicit synthetic storage key is required');
  const saved = store.read(key);
  let state: Aggregate<L, S> = saved ? JSON.parse(saved) : {
    learning: structuredClone(learning.initial), currency: { balance: 0 },
    reward: structuredClone(reward.initial), completedRounds: 0,
  };
  let round: { id: string; results: SolvedProblem[]; terminal: boolean; again: { value: P; after: number }[] } | null = null;
  let effects = new AbortController();
  let problem: {
    value: P;
    signal: AbortSignal;
    actions: { readonly busy: boolean; submit(answer: A): string; help(run: Effect): void };
  } | null = null;
  let completion: { earned: number; beforeBalance: number; afterBalance: number; newlyAffordable: boolean } | null = null;
  let lastResult: RoundResult | null = null;
  let writeFailed = false;
  const session = learning.session();
  function publish(next: Aggregate<L, S>) {
    state = next;
    try { store.write(key, JSON.stringify(state)); writeFailed = false; }
    catch { writeFailed = true; }
  }
  function makeProblem() {
    if (!round) return;
    effects.abort();
    effects = new AbortController();
    const signal = effects.signal;
    const current = round;
    const queued = current.again.findIndex(item => current.results.length > item.after);
    const replay = queued >= 0;
    const value = replay
      ? session.replay(current.again.splice(queued, 1)[0]!.value, Math.random)
      : session.makeProblem(Math.random);
    let solved = false;
    let misses = 0;
    let helped = false;
    function run(effect: Effect) {
      void Promise.resolve().then(() => { if (!signal.aborted) return effect(signal); }).catch(() => {});
    }
    const instance = {
      value, signal,
      actions: {
        get busy(): boolean { return solved || round !== current || current.terminal || problem !== instance; },
        help(effect: Effect) {
          if (this.busy) return;
          helped = true;
          run(effect);
        },
        submit(answer: A) {
          if (this.busy) return 'ignored';
          const check = session.check(value, answer);
          if (check.kind === 'not-an-answer') { if (check.prompt) run(check.prompt); return check.kind; }
          if (check.kind === 'incorrect') {
            misses++;
            const teach = misses >= 2 || session.needsEarlyHelp();
            helped ||= teach;
            run(signal => check.explain(teach, signal));
            return check.kind;
          }
          solved = true;
          const result: SolvedProblem = {
            index: current.results.length + 1, outcome: misses ? 'missed' : helped ? 'helped' : 'clean',
            misses, helped, replay,
          };
          current.results.push(result);
          if (misses && !replay) current.again.push({ value, after: current.results.length });
          effects.abort();
          publish({ ...state, learning: learning.record(state.learning, result) });
          return 'correct';
        },
      },
    };
    problem = instance;
  }
  function notify(result: RoundResult | null) {
    if (!result || !round || round.terminal || result.roundId !== round.id) return 'ignored';
    if (result.status === 'abandoned') {
      round.terminal = true; lastResult = result; effects.abort(); problem = null;
      return 'abandoned';
    }
    if (result.results.length !== 5) return 'ignored';
    const credit = currency.earn(state.currency, result as CompletedRound, policy);
    if (credit.kind === 'rejected') return credit.reason;
    const presentation = {
      earned: credit.amount, beforeBalance: state.currency.balance, afterBalance: credit.state.balance,
      newlyAffordable: reward.becameAffordable(state.reward, state.currency.balance, credit.state.balance),
    };
    round.terminal = true;
    lastResult = result;
    completion = presentation;
    problem = null;
    publish({ ...state, currency: credit.state, completedRounds: state.completedRounds + 1 });
    return 'accepted';
  }
  return {
    get state() { return state; },
    get completion() { return completion; },
    get problem() { return problem; },
    get results() { return round?.results ?? []; },
    get lastResult() { return lastResult; },
    get writeFailed() { return writeFailed; },
    start() {
      if (round && !round.terminal) notify({ roundId: round.id, status: 'abandoned', results: [...round.results] });
      completion = null;
      round = { id: `round-${nextRoundId++}`, results: [], terminal: false, again: [] };
      makeProblem();
    },
    abandon() {
      if (round) notify({ roundId: round.id, status: 'abandoned', results: [...round.results] });
    },
    advance() {
      if (round && !round.terminal && problem?.actions.busy && round.results.length < 5) makeProblem();
    },
    finish() {
      if (!round || round.terminal || round.results.length !== 5) return lastResult;
      const result: CompletedRound = { roundId: round.id, status: 'completed', results: [...round.results] };
      notify(result);
      return result;
    },
    notify,
    buy(request: Request) {
      const proposal = reward.proposePurchase(state.reward, request, state.currency.balance);
      if (proposal.kind === 'rejected') return proposal.reason;
      const debit = currency.debit(state.currency, proposal.cost);
      if (debit.kind === 'rejected') return debit.reason;
      publish({ ...state, currency: debit.state, reward: proposal.state });
      return 'accepted';
    },
  };
}
