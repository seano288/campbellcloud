import {
  createApp, clockLearning, moneyLearning, garageReward, recruitmentReward,
  type BackingStore, type Learning, type Reward, type RoundResult,
} from './model';

const values = new Map<string, string>();
const accesses: string[] = [];
let rejectWrites = false;
const store: BackingStore = {
  read(key) { accesses.push(`Read ${key}`); return values.get(key) ?? null; },
  write(key, value) {
    accesses.push(`${rejectWrites ? 'Blocked write' : 'Write'} ${key}`);
    if (rejectWrites) throw new Error('Synthetic storage failure');
    values.set(key, value);
  },
};
const checkout = { kind: 'practice-money', priceBand: 2 } as const;

function compose<P, A, L, S, Request, Failure>(
  id: string, learning: Learning<P, A, L>, reward: Reward<S, Request, Failure>,
  request: Request, currencyName: string, describeReward: (state: S, balance: number) => string,
  goal?: (state: S, balance: number) => string,
) {
  let app = createApp(learning, reward, store, id);
  let oldAnswer: (() => string | undefined) | null = null;
  let terminal: RoundResult | null = null;
  return {
    id, label: `${learning.title} + ${reward.title}`, currencyName,
    get state() { return app.state; },
    get results() { return app.results; },
    get terminal() { return app.lastResult?.status ?? 'none'; },
    get saved() { return values.get(id) ?? null; },
    get title() { return app.problem ? learning.describe(app.problem.value) : 'Start a Round to see the question.'; },
    get reward() { return describeReward(app.state.reward, app.state.currency.balance); },
    get goal() { return goal?.(app.state.reward, app.state.currency.balance) ?? 'No Goal. This reward supplies a purchase response instead.'; },
    get affordable() { return reward.hasAffordable(app.state.reward, app.state.currency.balance); },
    get show() {
      const result = app.completion;
      return result
        ? `Round complete. Earned ${result.earned} ${currencyName}. Balance ${result.beforeBalance} → ${result.afterBalance}. ${result.newlyAffordable ? 'A reward became affordable.' : 'No newly affordable reward.'}`
        : 'No committed completion to present.';
    },
    get writeFailed() { return app.writeFailed; },
    start() {
      const actions = app.problem?.actions;
      if (actions) oldAnswer = () => actions.submit(learning.answers[0]!.answer);
      app.start();
      return 'New Round. Earlier answer progress stays; earnings wait for completion.';
    },
    answer(correct: boolean) {
      const choice = learning.answers[correct ? 0 : 1]!;
      return `${choice.label}: ${app.problem?.actions.submit(choice.answer) ?? 'no active question'}`;
    },
    help() { app.problem?.actions.help(async () => {}); return 'Help marked. Teaching is a text-only stub.'; },
    next() { app.advance(); return 'Advanced only if the current problem was solved.'; },
    solve() { app.problem?.actions.submit(learning.answers[0]!.answer); app.advance(); return 'Answered correctly and advanced if another place remains.'; },
    finish() { terminal = app.finish(); return app.completion ? 'Completion committed. Presentation cannot credit it again.' : 'Completion needs five solved answers.'; },
    repeat() { return `Repeated terminal notification: ${app.notify(terminal)}`; },
    abandon() { app.abandon(); terminal = app.lastResult; return 'Round abandoned. No earnings; recorded answers remain.'; },
    stale() { return `Old problem action: ${oldAnswer?.() ?? 'start a replacement Round first'}`; },
    buy() { return `Purchase: ${app.buy(request)}. ${describeReward(app.state.reward, app.state.currency.balance)}`; },
    reload() {
      app.abandon();
      app = createApp(learning, reward, store, id);
      terminal = null;
      return 'Reloaded this app from the in-memory backing store. Transient Round and show are gone.';
    },
  };
}

function compositions() {
  const garage = garageReward(checkout);
  const garageText = (state: typeof garage.initial) => `Owned Mods: ${state.unlocked.join(', ') || 'none'}. Fitted: ${state.fitted}.`;
  const garageGoal = (state: typeof garage.initial, balance: number) => state.unlocked.includes('tires:1')
    ? 'The one represented Bolt Mod is owned. Legendary Tires cost $1.10 at the explicitly supplied money context 2. Top-Rung ownership is still required. Checkout is not simulated here.'
    : `Goal: first-Rung Tires, ${Math.min(balance, 5)} / 5 Bolts${balance >= 5 ? ', ready to buy' : ''}.`;
  const recruitText = (state: { quantity: number }) => `Recruits owned: ${state.quantity}. Another costs 3 credits. No fitting or one-time unlock list.`;
  return [
    compose('prototype-money-garage', moneyLearning, garage, 'tires:1', 'Bolts', garageText, garageGoal),
    compose('prototype-clock-recruit', clockLearning, recruitmentReward, 'recruit', 'credits', recruitText),
    compose('prototype-money-recruit', moneyLearning, recruitmentReward, 'recruit', 'credits', recruitText),
    compose('prototype-clock-garage', clockLearning, garage, 'tires:1', 'Bolts', garageText, garageGoal),
  ];
}
let demos = compositions();
let selected = 3;
let message = 'Synthetic state only. Choose a walkthrough or use the free-play buttons.';
let step = 0;
let scenario = 0;
const active = () => demos[selected]!;
const use = (index: number, action: (demo: ReturnType<typeof compose>) => string) => () => {
  selected = index;
  return action(active());
};
const fiveAnswers = (index: number) => Array.from({ length: 5 }, (_, i) => ({
  label: `Answer ${i + 1} correctly`, run: use(index, demo => demo.solve()),
}));
const scenarios = [
  {
    name: 'Clock + Garage',
    description: 'A string clock answer earns Bolts and buys a one-time Mod. A duplicate purchase and duplicate completion change nothing.',
    steps: [
      { label: 'Start clock with Garage', run: use(3, demo => demo.start()) },
      ...fiveAnswers(3),
      { label: 'Complete and credit six Bolts', run: use(3, demo => demo.finish()) },
      { label: 'Buy and fit Tires for five Bolts', run: use(3, demo => demo.buy()) },
      { label: 'Try buying the owned Mod again', run: use(3, demo => demo.buy()) },
      { label: 'Repeat completion notification', run: use(3, demo => demo.repeat()) },
      { label: 'Reload only this synthetic app', run: use(3, demo => demo.reload()) },
    ],
  },
  {
    name: 'Money + recruitment',
    description: 'Numeric money answers work with a reward that has a quantity, no Garage, no setup and no Goal. Two purchases are intentional.',
    steps: [
      { label: 'Start money with recruitment', run: use(2, demo => demo.start()) },
      ...fiveAnswers(2),
      { label: 'Complete and credit six credits', run: use(2, demo => demo.finish()) },
      { label: 'Recruit once for three credits', run: use(2, demo => demo.buy()) },
      { label: 'Recruit again for three credits', run: use(2, demo => demo.buy()) },
      { label: 'Try a third purchase without funds', run: use(2, demo => demo.buy()) },
      { label: 'Repeat completion notification', run: use(2, demo => demo.repeat()) },
    ],
  },
  {
    name: 'Help and leaving',
    description: 'Help changes the outcome, misses take precedence and a missed question returns after one intervening answer. Leaving keeps answers but earns nothing.',
    steps: [
      { label: 'Start clock with recruitment', run: use(1, demo => demo.start()) },
      { label: 'Ask for help', run: use(1, demo => demo.help()) },
      { label: 'Solve the helped problem', run: use(1, demo => demo.solve()) },
      { label: 'Make a wrong answer', run: use(1, demo => demo.answer(false)) },
      { label: 'Solve after the miss', run: use(1, demo => demo.solve()) },
      { label: 'Solve one intervening question', run: use(1, demo => demo.solve()) },
      { label: 'Solve the replay cleanly', run: use(1, demo => demo.solve()) },
      { label: 'Leave before completing', run: use(1, demo => demo.abandon()) },
      { label: 'Start a replacement Round', run: use(1, demo => demo.start()) },
      { label: 'Try the old terminal notification', run: use(1, demo => demo.repeat()) },
    ],
  },
  {
    name: 'Isolated saves',
    description: 'Two compositions share one fake same-origin store. Reloading each retains its own balance, learning and reward without importing the other save.',
    steps: [
      { label: 'Start money with Garage', run: use(0, demo => demo.start()) },
      ...fiveAnswers(0),
      { label: 'Complete money Round', run: use(0, demo => demo.finish()) },
      { label: 'Buy Tires in the money app', run: use(0, demo => demo.buy()) },
      { label: 'Open the fresh clock app', run: use(1, () => 'Clock still starts at zero with no recruits. Money remains at one Bolt.') },
      { label: 'Start clock with recruitment', run: use(1, demo => demo.start()) },
      ...fiveAnswers(1),
      { label: 'Complete clock Round', run: use(1, demo => demo.finish()) },
      { label: 'Buy a recruit in the clock app', run: use(1, demo => demo.buy()) },
      { label: 'Reload money, retaining one Bolt and Tires', run: use(0, demo => demo.reload()) },
      { label: 'Reload clock, retaining three credits and one recruit', run: use(1, demo => demo.reload()) },
    ],
  },
  {
    name: 'Blocked save',
    description: 'A failed completion write does not roll back the in-memory credit or reopen the completion guard. A later accepted purchase saves the whole latest state.',
    steps: [
      { label: 'Start clock with recruitment', run: use(1, demo => demo.start()) },
      ...fiveAnswers(1),
      { label: 'Block fake writes', run: () => { rejectWrites = true; return 'Writes blocked in the fake store only.'; } },
      { label: 'Complete despite the failed write', run: use(1, demo => demo.finish()) },
      { label: 'Repeat completion, without another credit', run: use(1, demo => demo.repeat()) },
      { label: 'Allow fake writes again', run: () => { rejectWrites = false; return 'Fake writes allowed.'; } },
      { label: 'Buy a recruit and save the entire state', run: use(1, demo => demo.buy()) },
      { label: 'Reload the saved combined state', run: use(1, demo => demo.reload()) },
    ],
  },
];

function element<T extends HTMLElement>(id: string) {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Missing prototype element ${id}`);
  return found as T;
}
function button(label: string, run: () => string, selected = false) {
  const node = document.createElement('button');
  node.textContent = label;
  node.setAttribute('aria-pressed', String(selected));
  node.onclick = () => { message = run(); render(); };
  return node;
}
function field(label: string, value: string) {
  const row = document.createElement('div');
  const term = document.createElement('dt');
  const description = document.createElement('dd');
  term.textContent = label;
  description.textContent = value;
  row.append(term, description);
  return row;
}
function render() {
  const demo = active();
  element('message').textContent = message;
  element('pairings').replaceChildren(...demos.map((item, index) => button(item.label, () => {
    selected = index;
    return 'Changed the test-bench view only. Each composition keeps its own state and storage key.';
  }, index === selected)));
  element('state').replaceChildren(
    field('Composition', demo.label), field('Synthetic storage key', demo.id),
    field('Balance', `${demo.state.currency.balance} ${demo.currencyName}`),
    field('Learning progress', JSON.stringify(demo.state.learning)),
    field('Round', `${demo.results.length} / 5 solved; terminal: ${demo.terminal}`),
    field('Reward state', demo.reward), field('Goal or reward response', demo.goal),
    field('Any purchase affordable now?', demo.affordable ? 'Yes' : 'No'),
    field('Completed Round count', String(demo.state.completedRounds)),
    field('Latest save attempt', demo.writeFailed ? 'Failed; coherent state retained in memory' : 'No pending write failure'),
  );
  element('question').textContent = demo.title;
  element('results').textContent = demo.results.length
    ? demo.results.map(result => `${result.index}. ${result.outcome}${result.replay ? ' on replay' : ''}; misses ${result.misses}, help ${result.helped ? 'yes' : 'no'}`).join('\n')
    : 'No solved results in this Round.';
  element('show').textContent = demo.show;
  element('actions').replaceChildren(
    button('Start / replace Round', () => demo.start()),
    button('Correct answer', () => demo.answer(true)), button('Wrong answer', () => demo.answer(false)),
    button('Ask for help', () => demo.help()), button('Next problem', () => demo.next()),
    button('Complete Round', () => demo.finish()), button('Leave Round', () => demo.abandon()),
    button('Buy reward', () => demo.buy()), button('Repeat terminal notification', () => demo.repeat()),
    button('Re-show committed completion', () => demo.show), button('Try old answer action', () => demo.stale()),
    button('Reload this synthetic app', () => demo.reload()),
    button(rejectWrites ? 'Allow fake writes' : 'Block fake writes', () => {
      rejectWrites = !rejectWrites;
      return rejectWrites ? 'Fake writes blocked.' : 'Fake writes allowed.';
    }),
  );
  element('tabs').replaceChildren(...scenarios.map((item, index) => button(item.name, () => {
    demos.forEach(demo => demo.abandon());
    values.clear(); accesses.length = 0; rejectWrites = false;
    demos = compositions(); scenario = index; step = 0;
    selected = index === 0 ? 3 : index === 1 ? 2 : index === 3 ? 0 : 1;
    return 'Walkthrough reset to known synthetic state. No browser save was touched.';
  }, index === scenario)));
  const current = scenarios[scenario]!;
  element('scenario-description').textContent = current.description;
  element('steps').replaceChildren(...current.steps.map((item, index) => {
    const node = button(`${index + 1}. ${item.label}`, () => {
      const result = item.run(); step++; return result;
    });
    node.disabled = index !== step;
    return node;
  }));
  element('step-count').textContent = step === current.steps.length ? 'Walkthrough complete.' : `Step ${step + 1} of ${current.steps.length}.`;
  element('other-apps').replaceChildren(...demos.map(item => field(item.label,
    `${item.state.currency.balance} ${item.currencyName}; ${item.reward} Saved snapshot: ${item.saved ? 'present' : 'none'}.`)));
  element('saved').textContent = demo.saved ?? 'No stored snapshot for this app. Loading never writes.';
  element('aggregate').textContent = JSON.stringify(demo.state, null, 2);
  element('accesses').textContent = accesses.slice(-20).join('\n') || 'No fake storage accesses.';
}
render();
