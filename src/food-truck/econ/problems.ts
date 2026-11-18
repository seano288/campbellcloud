// What Food Truck asks: six kinds, three Levels each, with Stretch inside a Level. Every generated question has exactly one right
// answer (problems.test.ts tries every choice of thousands of them). Money is whole dollars only, never over 20.
//
// - Need or Want (`need`): tap the need (or the want); sort four onto the Need shelf (❤️) and the Want shelf (⭐); "You have $5. You need
//   lunch and you want a kite. Which do you buy first?"
// - Goods and Services (`goods`): tap the good (or the service); sort four into Goods (🤲) and Services (🤝); who gives a service, who
//   makes a good, from three workers.
// - Jobs (`job`): who does this job, from two workers; which tool a worker uses (or who uses a tool), from three; in one picture of a
//   maker and a buyer, who made it and who bought it.
// - Add It Up (`total`): the order circled on the menu board; how much for both (to $10, then to $20), then for all three (to $20).
// - Enough? (`enough`): his money and a price; is it enough (👍 / 👎); which of three can he buy (exactly one); what is left.
// - Save Up (`save`): how many more he needs; how many days of earning; can he buy both. Only what the numbers decide, never an opinion.
//
// Number choices come from real mistakes and near misses; where the right one sits among the sorted choices is picked first.
import { int, pick, shuffle, type Rng } from '../../game/rng';
import type { Stretch } from '../../modes/progress';
import { BUY_NEEDS, GENDERS, GOODS, JOBS, MADE, MENU, NEEDS, SERVICES, TOYS, WANTS, type JobId, type Look, type MadeId, type Tone } from './things';

export type Level = 1 | 2 | 3;
export const KINDS = ['need', 'goods', 'job', 'total', 'enough', 'save'] as const;
export type Kind = (typeof KINDS)[number];
/** The most money in any question: totals, what's left and goals all stay within 20. */
export const MONEY_TOP = 20;

const uniq = (xs: readonly number[]) => [...new Set(xs)];
/** `wrong` wrong numbers from the traps, topped up with near misses, all in [lo, hi]; the right one's place among them is random. */
export function numberChoices(rng: Rng, target: number, traps: readonly number[], wrong: number, lo: number, hi: number): number[] {
  const usable = traps.filter(t => t !== target && t >= lo && t <= hi);
  const near = (side: 1 | -1) => [1, 2, 3, 4, 5].map(d => target + side * d).filter(x => x >= lo && x <= hi);
  const below = uniq([...shuffle(rng, usable.filter(t => t < target)), ...near(-1)]);
  const above = uniq([...shuffle(rng, usable.filter(t => t > target)), ...near(1)]);
  let under = int(rng, 0, wrong);
  if (below.length < under) under = below.length;
  if (above.length < wrong - under) under = wrong - above.length;
  return [...below.slice(0, under), target, ...above.slice(0, wrong - under)].sort((a, b) => a - b);
}

/** A look picked at random, never from the job: any gender, any skin tone. */
export const randomLook = (rng: Rng): Look => ({ gender: pick(rng, GENDERS), tone: int(rng, 0, 4) as Tone });
export interface Worker { readonly job: JobId; readonly look: Look }
const worker = (rng: Rng, job: JobId): Worker => ({ job, look: randomLook(rng) });

// ---------- sorting (Need or Want Level 2, Goods and Services Level 2) ----------

export type Shelf = 'need' | 'want' | 'good' | 'service';
/** A sort's answer so far: "water:need,kite:want". */
export const sortAnswer = (placed: readonly (readonly [string, Shelf])[]) => placed.map(([id, s]) => `${id}:${s}`).join(',');
export const readSort = (answer: string): [string, Shelf][] => (answer ? answer.split(',').map(p => p.split(':') as [string, Shelf]) : []);

// ---------- Need or Want ----------

export type NeedProblem =
  | { readonly kind: 'need'; readonly form: 'pick'; readonly ask: 'need' | 'want'; readonly things: readonly string[]; readonly answer: string }
  | { readonly kind: 'need'; readonly form: 'sort'; readonly things: readonly string[]; readonly shelves: Readonly<Record<string, 'need' | 'want'>>; readonly answer: string }
  | { readonly kind: 'need'; readonly form: 'first'; readonly have: number; readonly need: string; readonly needPrice: number; readonly want: string; readonly wantPrice: number; readonly answer: string };

export function makeNeed(level: Level, stretch: Stretch, rng: Rng): NeedProblem {
  if (level === 1) {
    const n = pick(rng, NEEDS), w = pick(rng, WANTS), ask = stretch > 0 && rng() < 1 / 3 ? 'want' : 'need';
    return { kind: 'need', form: 'pick', ask, things: shuffle(rng, [n.id, w.id]), answer: ask === 'need' ? n.id : w.id };
  }
  if (level === 2) {
    const needs = stretch === 2 ? int(rng, 1, 3) : 2;
    const ns = shuffle(rng, NEEDS).slice(0, needs), ws = shuffle(rng, WANTS).slice(0, 4 - needs);
    const shelves = Object.fromEntries([...ns.map(t => [t.id, 'need'] as const), ...ws.map(t => [t.id, 'want'] as const)]);
    const things = shuffle(rng, [...ns, ...ws].map(t => t.id));
    return { kind: 'need', form: 'sort', things, shelves, answer: sortAnswer(things.map(id => [id, shelves[id]!] as const)) };
  }
  // both are within his money, but not together: he has to choose, and the need comes first
  const have = int(rng, stretch === 0 ? 5 : 6, stretch === 2 ? 15 : 10);
  const needPrice = int(rng, 2, have - 1), wantPrice = int(rng, Math.max(1, have - needPrice + 1), have);
  const need = pick(rng, BUY_NEEDS), want = pick(rng, WANTS);
  return { kind: 'need', form: 'first', have, need: need.id, needPrice, want: want.id, wantPrice, answer: need.id };
}

// ---------- Goods and Services ----------

export type GoodsProblem =
  | { readonly kind: 'goods'; readonly form: 'pick'; readonly ask: 'good' | 'service'; readonly things: readonly string[]; readonly looks: Readonly<Record<string, Look>>; readonly answer: string }
  | { readonly kind: 'goods'; readonly form: 'sort'; readonly things: readonly string[]; readonly looks: Readonly<Record<string, Look>>; readonly shelves: Readonly<Record<string, 'good' | 'service'>>; readonly answer: string }
  | { readonly kind: 'goods'; readonly form: 'who'; readonly ask: 'service' | 'good'; readonly workers: readonly Worker[]; readonly answer: string };

export const isService = (id: string) => SERVICES.some(s => s.id === id);
const looksFor = (rng: Rng, ids: readonly string[]) => Object.fromEntries(ids.filter(isService).map(id => [id, randomLook(rng)]));

export function makeGoods(level: Level, stretch: Stretch, rng: Rng): GoodsProblem {
  if (level === 1) {
    const g = pick(rng, GOODS), s = pick(rng, SERVICES), ask = stretch > 0 && rng() < 1 / 3 ? 'service' : 'good';
    const things = shuffle(rng, [g.id, s.id]);
    return { kind: 'goods', form: 'pick', ask, things, looks: looksFor(rng, things), answer: ask === 'good' ? g.id : s.id };
  }
  if (level === 2) {
    const goods = stretch === 2 ? int(rng, 1, 3) : 2;
    // a service picture is a worker at work: two drawn by the same job (the doctor's two check-ups) never come together
    const gs = shuffle(rng, GOODS).slice(0, goods), ss: (typeof SERVICES)[number][] = [];
    for (const s of shuffle(rng, SERVICES)) if (ss.length < 4 - goods && !ss.some(x => x.who === s.who)) ss.push(s);
    const shelves = Object.fromEntries([...gs.map(t => [t.id, 'good'] as const), ...ss.map(t => [t.id, 'service'] as const)]);
    const things = shuffle(rng, [...gs, ...ss].map(t => t.id));
    return { kind: 'goods', form: 'sort', things, looks: looksFor(rng, things), shelves, answer: sortAnswer(things.map(id => [id, shelves[id]!] as const)) };
  }
  const ask = rng() < .5 ? 'service' : 'good';
  const givers = JOBS.filter(j => j.role === 'service'), makers = JOBS.filter(j => j.role === 'good');
  const [right, others] = ask === 'service' ? [pick(rng, givers), shuffle(rng, makers).slice(0, 2)] : [pick(rng, makers), shuffle(rng, givers).slice(0, 2)];
  return { kind: 'goods', form: 'who', ask, workers: shuffle(rng, [right, ...others]).map(j => worker(rng, j.id)), answer: right.id };
}

// ---------- Jobs ----------

export type JobProblem =
  | { readonly kind: 'job'; readonly form: 'who'; readonly asked: JobId; readonly workers: readonly Worker[]; readonly answer: string }
  | { readonly kind: 'job'; readonly form: 'tool'; readonly asked: JobId; readonly worker: Worker; readonly tools: readonly JobId[]; readonly answer: string }
  | { readonly kind: 'job'; readonly form: 'user'; readonly asked: JobId; readonly workers: readonly Worker[]; readonly answer: string }
  | { readonly kind: 'job'; readonly form: 'role'; readonly ask: 'made' | 'bought'; readonly good: MadeId; readonly maker: Worker; readonly buyer: Look; readonly makerLeft: boolean; readonly answer: 'maker' | 'buyer' };

export function makeJob(level: Level, stretch: Stretch, rng: Rng): JobProblem {
  const ids = JOBS.map(j => j.id);
  if (level === 1) {
    const [a, b] = shuffle(rng, ids);
    return { kind: 'job', form: 'who', asked: a!, workers: shuffle(rng, [a!, b!]).map(j => worker(rng, j)), answer: a! };
  }
  if (level === 2) {
    const three = shuffle(rng, ids).slice(0, 3), asked = three[0]!;
    // tools are named by whose they are: each job has its own, so exactly one fits
    if (stretch > 0 && rng() < .5) return { kind: 'job', form: 'user', asked, workers: shuffle(rng, three).map(j => worker(rng, j)), answer: asked };
    return { kind: 'job', form: 'tool', asked, worker: worker(rng, asked), tools: shuffle(rng, three), answer: asked };
  }
  const good = pick(rng, MADE), ask = rng() < .5 ? 'made' : 'bought';
  return { kind: 'job', form: 'role', ask, good: good.id, maker: worker(rng, good.maker), buyer: randomLook(rng), makerLeft: rng() < .5, answer: ask === 'made' ? 'maker' : 'buyer' };
}

// ---------- Add It Up ----------

export interface MenuLine { readonly id: string; readonly price: number }
export interface TotalProblem {
  readonly kind: 'total';
  readonly form: 'sum';
  /** The whole menu board, and which of it is the order. */
  readonly menu: readonly MenuLine[];
  readonly order: readonly string[];
  readonly choices: readonly number[];
  readonly answer: string;
}
export function makeTotal(level: Level, stretch: Stretch, rng: Rng): TotalProblem {
  const n = level === 3 ? 3 : 2, top = level === 1 ? 10 : MONEY_TOP;
  let prices: number[];
  for (;;) {
    prices = Array.from({ length: n }, () => int(rng, 1, level === 1 ? 7 : 12));
    const sum = prices.reduce((a, b) => a + b, 0);
    // Level 2 crosses ten; Level 1 stays within it; small sums first at Stretch 0
    if (sum > top || sum < n + 1) continue;
    if (level === 2 && sum <= 10) continue;
    if (stretch === 0 && level === 1 && sum > 8) continue;
    break;
  }
  const items = shuffle(rng, MENU).slice(0, 4);
  const menu = items.map((m, i) => ({ id: m.id, price: i < n ? prices[i]! : int(rng, 1, 9) }));
  const order = menu.slice(0, n).map(m => m.id), sum = prices.reduce((a, b) => a + b, 0);
  const traps = [Math.max(...prices), sum - 1, sum + 1, n === 3 ? prices[0]! + prices[1]! : sum + 2];
  return { kind: 'total', form: 'sum', menu: shuffle(rng, menu), order, choices: numberChoices(rng, sum, traps, 2, 1, MONEY_TOP), answer: String(sum) };
}

// ---------- Enough? ----------

export type EnoughProblem =
  | { readonly kind: 'enough'; readonly form: 'yesno'; readonly have: number; readonly item: string; readonly price: number; readonly answer: 'yes' | 'no' }
  | { readonly kind: 'enough'; readonly form: 'which'; readonly have: number; readonly items: readonly MenuLine[]; readonly answer: string }
  | { readonly kind: 'enough'; readonly form: 'left'; readonly have: number; readonly item: string; readonly price: number; readonly choices: readonly number[]; readonly answer: string };

export function makeEnough(level: Level, stretch: Stretch, rng: Rng): EnoughProblem {
  const things = [...MENU, ...TOYS];
  if (level === 1) {
    const top = stretch === 2 ? MONEY_TOP - 1 : 10, have = int(rng, 2, top), yes = rng() < .5;
    // about one "yes" in four is exactly enough
    const price = yes ? (rng() < .25 ? have : int(rng, 1, have - 1)) : int(rng, have + 1, Math.min(MONEY_TOP, have + (stretch === 0 ? 6 : 3)));
    return { kind: 'enough', form: 'yesno', have, item: pick(rng, things).id, price, answer: price <= have ? 'yes' : 'no' };
  }
  if (level === 2) {
    const have = int(rng, 3, stretch === 2 ? 15 : 10);
    const three = shuffle(rng, things).slice(0, 3);
    const close = stretch > 0;
    const prices = [int(rng, close ? Math.max(1, have - 2) : 1, have), int(rng, have + 1, Math.min(MONEY_TOP, have + (close ? 3 : 8))), int(rng, have + 1, MONEY_TOP)];
    const items = three.map((t, i) => ({ id: t.id, price: prices[i]! }));
    return { kind: 'enough', form: 'which', have, items: shuffle(rng, items), answer: items[0]!.id };
  }
  const have = int(rng, stretch === 0 ? 5 : 8, stretch === 0 ? 12 : MONEY_TOP), price = int(rng, 1, have - 1), left = have - price;
  return { kind: 'enough', form: 'left', have, item: pick(rng, things).id, price, choices: numberChoices(rng, left, [price, have, left + 1, left - 1], 2, 1, MONEY_TOP), answer: String(left) };
}

// ---------- Save Up ----------

export type SaveProblem =
  | { readonly kind: 'save'; readonly form: 'more'; readonly item: string; readonly price: number; readonly have: number; readonly choices: readonly number[]; readonly answer: string }
  | { readonly kind: 'save'; readonly form: 'days'; readonly perDay: number; readonly start: number; readonly goal: number; readonly choices: readonly number[]; readonly answer: string }
  | { readonly kind: 'save'; readonly form: 'both'; readonly have: number; readonly a: MenuLine; readonly b: MenuLine; readonly answer: 'yes' | 'no' };

export function makeSave(level: Level, stretch: Stretch, rng: Rng): SaveProblem {
  if (level === 1) {
    const price = int(rng, 4, stretch === 0 ? 10 : MONEY_TOP), have = int(rng, 1, price - 1), more = price - have;
    return { kind: 'save', form: 'more', item: pick(rng, TOYS).id, price, have, choices: numberChoices(rng, more, [have, price, more + 1, more - 1], 2, 1, MONEY_TOP), answer: String(more) };
  }
  if (level === 2) {
    for (;;) {
      const perDay = int(rng, stretch === 0 ? 2 : 1, 5), days = int(rng, 2, stretch === 0 ? 5 : 10), start = stretch === 2 && rng() < .5 ? int(rng, 1, 6) : 0;
      const goal = start + perDay * days;
      if (goal > MONEY_TOP) continue;
      return { kind: 'save', form: 'days', perDay, start, goal, choices: numberChoices(rng, days, [perDay, goal - start, days + 1, days - 1], 2, 1, MONEY_TOP), answer: String(days) };
    }
  }
  // at most 18, so two prices he could each afford can still come to more than he has without going over 20
  const have = int(rng, stretch === 0 ? 5 : 8, stretch === 0 ? 12 : MONEY_TOP - 2), yes = rng() < .5;
  for (;;) {
    const a = int(rng, 1, have - 1), b = int(rng, 1, have);
    if (a + b > MONEY_TOP || (a + b <= have) !== yes) continue;
    const [x, y] = shuffle(rng, TOYS).slice(0, 2);
    return { kind: 'save', form: 'both', have, a: { id: x!.id, price: a }, b: { id: y!.id, price: b }, answer: yes ? 'yes' : 'no' };
  }
}

// ---------- every kind ----------

export type Question = NeedProblem | GoodsProblem | JobProblem | TotalProblem | EnoughProblem | SaveProblem;
export type NeedForm = NeedProblem['form'];

export function makeQuestion(kind: Kind, level: Level, stretch: Stretch, rng: Rng): Question {
  if (kind === 'need') return makeNeed(level, stretch, rng);
  if (kind === 'goods') return makeGoods(level, stretch, rng);
  if (kind === 'job') return makeJob(level, stretch, rng);
  if (kind === 'total') return makeTotal(level, stretch, rng);
  if (kind === 'enough') return makeEnough(level, stretch, rng);
  return makeSave(level, stretch, rng);
}

/** True, false, or null when it's only part of an answer (a sort with things still to place). A sort is wrong as soon as one thing
 *  is on the wrong shelf; the ones he placed right stay. */
export function isRightAnswer(q: Question, answer: string): boolean | null {
  if (q.form === 'sort') {
    const placed = readSort(answer);
    if (placed.some(([id, s]) => q.shelves[id] !== s)) return false;
    return new Set(placed.map(([id]) => id)).size === q.things.length ? true : null;
  }
  return answer === q.answer;
}

/** Every answer he could give, for the tests: each choice, or for a sort every shelf for each thing. */
export function possibleAnswers(q: Question): string[] {
  switch (q.form) {
    case 'pick': return [...q.things];
    case 'sort': return q.things.flatMap(id => (q.kind === 'need' ? ['need', 'want'] : ['good', 'service']).map(s => `${id}:${s}`));
    case 'first': return [q.need, q.want];
    case 'who': return q.workers.map(w => w.job);
    case 'tool': return [...q.tools];
    case 'user': return q.workers.map(w => w.job);
    case 'role': return ['maker', 'buyer'];
    case 'yesno': case 'both': return ['yes', 'no'];
    case 'which': return q.items.map(i => i.id);
    default: return q.choices.map(String);
  }
}
