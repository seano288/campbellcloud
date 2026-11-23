// What Skyline asks: six kinds, three Levels each, from equal groups as pictures to the × sign as a short way to write them
// (.scratch/skyline/research/second-grade-groups.md). Every question has exactly one right answer, and every wrong choice is a
// real mistake, named in `why`: the two numbers added, one group too many or too few, the count of groups given for the total.
//
// The brief's rules, which the tests check on thousands of questions:
// - every array is a full rectangle and rows are the lines that go across; a building of 3 rows of 4 never sits beside a choice of
//   4 rows of 3 unless the question is the turn-around one;
// - totals stay at 50 or less, and no group or row is bigger than 10;
// - Share It always comes out even;
// - Odd or Even never asks about zero.
import { int, pick, shuffle, type Rng } from '../../game/rng';
import type { Stretch } from '../../modes/progress';

export type Kind = 'groups' | 'array' | 'pair' | 'count' | 'share' | 'times';
export type Level = 1 | 2 | 3;
export const MOST_TOTAL = 50, MOST_GROUP = 10;

/** Why a wrong choice is there: the mistake it stands for. */
export type Why =
  | 'added' | 'extra-group' | 'missing-group' | 'group-count' | 'each-count' | 'total' | 'miscount' | 'other-way'
  | 'by-ones' | 'jumped-twice' | 'wrong-step' | 'stayed' | 'whole' | 'near-double' | 'unequal';
export interface Wrong { readonly value: string; readonly why: Why }

/** An array: `rows` lines going across, `cols` in each row. */
export interface Grid { readonly rows: number; readonly cols: number }

export type GroupsQ = { readonly kind: 'groups' } & (
  | { readonly form: 'same'; readonly buses: readonly number[]; readonly answer: 'yes' | 'no' }
  | { readonly form: 'buses' | 'each' | 'total' | 'words'; readonly groups: number; readonly each: number; readonly choices: readonly number[]; readonly wrong: readonly Wrong[]; readonly answer: string }
  | { readonly form: 'pick'; readonly groups: number; readonly each: number; readonly pictures: readonly (readonly number[])[]; readonly wrong: readonly Wrong[]; readonly answer: string }
);
export type ArrayQ = { readonly kind: 'array' } & Grid & (
  | { readonly form: 'rows' | 'cols' | 'total'; readonly choices: readonly number[]; readonly wrong: readonly Wrong[]; readonly answer: string }
  | { readonly form: 'sentence'; readonly sentences: readonly string[]; readonly wrong: readonly Wrong[]; readonly answer: string }
  | { readonly form: 'turn'; readonly other: Grid; readonly answer: 'yes' | 'no' }
);
export type PairQ = { readonly kind: 'pair' } & (
  | { readonly form: 'partner'; readonly n: number; readonly answer: 'yes' | 'no' }
  | { readonly form: 'oddEven'; readonly n: number; readonly picture: boolean; readonly answer: 'odd' | 'even' }
  | { readonly form: 'which'; readonly want: 'odd' | 'even'; readonly nums: readonly number[]; readonly answer: string }
  | { readonly form: 'double'; readonly n: number; readonly halves: readonly number[]; readonly wrong: readonly Wrong[]; readonly answer: string }
  | { readonly form: 'half'; readonly n: number; readonly choices: readonly number[]; readonly wrong: readonly Wrong[]; readonly answer: string }
);
export type CountQ = {
  readonly kind: 'count'; readonly form: 'next' | 'middle'; readonly step: 100 | 10 | 5 | 4 | 3;
  /** The house numbers along the street, the one he finds as null. */
  readonly shown: readonly (number | null)[];
  /** Threes and fours: each house shows its group of windows. */
  readonly groups: boolean;
  readonly choices: readonly number[]; readonly wrong: readonly Wrong[]; readonly answer: string;
};
export type ShareQ = { readonly kind: 'share' } & (
  | { readonly form: 'deal'; readonly total: number; readonly trucks: number; readonly answer: string }
  | { readonly form: 'each'; readonly total: number; readonly trucks: number; readonly choices: readonly number[]; readonly wrong: readonly Wrong[]; readonly answer: string }
  | { readonly form: 'trucks'; readonly total: number; readonly each: number; readonly choices: readonly number[]; readonly wrong: readonly Wrong[]; readonly answer: string }
);
export type TimesQ = { readonly kind: 'times' } & (
  | { readonly form: 'match'; readonly rows: number; readonly cols: number; readonly pictures: readonly Grid[]; readonly wrong: readonly Wrong[]; readonly answer: string }
  | { readonly form: 'write'; readonly rows: number; readonly cols: number; readonly cards: readonly string[]; readonly wrong: readonly Wrong[]; readonly answer: string }
  | { readonly form: 'fact'; readonly a: number; readonly b: number; readonly choices: readonly number[]; readonly wrong: readonly Wrong[]; readonly answer: string }
  | { readonly form: 'turn'; readonly a: number; readonly b: number; readonly cards: readonly string[]; readonly wrong: readonly Wrong[]; readonly answer: string }
);
export type Question = GroupsQ | ArrayQ | PairQ | CountQ | ShareQ | TimesQ;

// ---------- choices ----------

/** The right answer and two real mistakes, in a shuffled order (sorted near-misses would put the answer in the middle every time). */
function numberChoices(rng: Rng, answer: number, mistakes: readonly (readonly [number, Why])[], count = 3): { choices: number[]; wrong: Wrong[] } {
  const wrong: Wrong[] = [], seen = new Set([answer]);
  for (const [value, why] of mistakes) {
    if (wrong.length >= count - 1) break;
    if (!Number.isInteger(value) || value < 1 || seen.has(value)) continue;
    seen.add(value); wrong.push({ value: String(value), why });
  }
  // always three to choose from: a miscount next to the answer if the mistakes ran out
  for (let d = 1; wrong.length < count - 1; d++) for (const v of [answer + d, answer - d]) if (wrong.length < count - 1 && v >= 1 && !seen.has(v)) { seen.add(v); wrong.push({ value: String(v), why: 'miscount' }); }
  return { choices: shuffle(rng, [answer, ...wrong.map(w => Number(w.value))]), wrong };
}
const coin = (rng: Rng) => rng() < .5;
const shuffled = <T,>(rng: Rng, first: readonly [T, ...T[]]) => shuffle(rng, first);

/** "4 + 4 + 4": a row of `cols`, `rows` times. */
export const addingSentence = (rows: number, cols: number) => Array.from({ length: rows }, () => String(cols)).join(' + ');
export const timesCard = (a: number, b: number) => `${a} × ${b}`;
export const plusCard = (a: number, b: number) => `${a} + ${b}`;

// ---------- Equal Groups: buses with people on them ----------

function makeGroups(level: Level, stretch: Stretch, rng: Rng): GroupsQ {
  if (level === 1) {
    const form = stretch === 0 ? pick(rng, ['same', 'buses'] as const) : pick(rng, ['same', 'buses', 'each'] as const);
    if (form === 'same') {
      const n = int(rng, 2, stretch === 2 ? 4 : 3), each = int(rng, 2, 5), equal = coin(rng);
      const buses = Array.from({ length: n }, () => each);
      if (!equal) { const i = int(rng, 0, n - 1), d = pick(rng, each > 2 ? [-1, 1, 2] : [1, 2]); buses[i] = each + d; }
      return { kind: 'groups', form, buses, answer: equal ? 'yes' : 'no' };
    }
    const groups = int(rng, 2, 5), each = int(rng, 2, 5);
    const answer = form === 'buses' ? groups : each;
    const { choices, wrong } = numberChoices(rng, answer, form === 'buses'
      ? [[each, 'each-count'], [groups * each, 'total'], [groups + 1, 'miscount']]
      : [[groups, 'group-count'], [groups * each, 'total'], [each + 1, 'miscount']]);
    return { kind: 'groups', form, groups, each, choices, wrong, answer: String(answer) };
  }
  if (level === 2) {
    const [gTop, eTop] = ([[3, 4], [4, 5], [5, 6]] as const)[stretch];
    const groups = int(rng, 2, gTop), each = int(rng, 2, eTop), total = groups * each;
    const { choices, wrong } = numberChoices(rng, total, totalMistakes(groups, each, rng));
    return { kind: 'groups', form: 'total', groups, each, choices, wrong, answer: String(total) };
  }
  if (stretch > 0 && coin(rng)) {
    // pick the picture: the right one, one with a bus that has a different number, and one a bus short or a person more on each
    const groups = int(rng, 2, 5), each = int(rng, 2, 6), right = Array.from({ length: groups }, () => each);
    const unequal = [...right]; unequal[int(rng, 0, groups - 1)] = each + 1;
    const other = groups > 2 && coin(rng) ? Array.from({ length: groups - 1 }, () => each) : Array.from({ length: groups }, () => Math.min(MOST_GROUP, each + 1));
    const otherWhy: Why = other.length < groups ? 'missing-group' : 'miscount';
    const pictures = shuffle(rng, [right, unequal, other]);
    return {
      kind: 'groups', form: 'pick', groups, each, pictures,
      wrong: [{ value: String(pictures.indexOf(unequal)), why: 'unequal' }, { value: String(pictures.indexOf(other)), why: otherWhy }], answer: String(pictures.indexOf(right)),
    };
  }
  let groups: number, each: number;
  do { groups = int(rng, 2, 5); each = int(rng, 2, MOST_GROUP); } while (groups * each > MOST_TOTAL);
  const total = groups * each;
  const { choices, wrong } = numberChoices(rng, total, totalMistakes(groups, each, rng));
  return { kind: 'groups', form: 'words', groups, each, choices, wrong, answer: String(total) };
}
/** The mistakes for "how many in all": the two numbers added first (the commonest), then a group too many or too few. */
function totalMistakes(groups: number, each: number, rng: Rng): [number, Why][] {
  const total = groups * each;
  const near: [number, Why][] = coin(rng) ? [[total + each, 'extra-group'], [total - each, 'missing-group']] : [[total - each, 'missing-group'], [total + each, 'extra-group']];
  return [[groups + each, 'added'], ...near, [groups, 'group-count']];
}

// ---------- Windows: a building's front, windows in rows ----------

function makeArray(level: Level, stretch: Stretch, rng: Rng): ArrayQ {
  if (level === 1) {
    let rows: number, cols: number;
    do { rows = int(rng, 2, 5); cols = int(rng, 2, 5); } while (stretch === 0 && rows === cols);
    const form = coin(rng) ? 'rows' as const : 'cols' as const, answer = form === 'rows' ? rows : cols;
    const { choices, wrong } = numberChoices(rng, answer, [[form === 'rows' ? cols : rows, 'other-way'], [answer + 1, 'miscount'], [rows * cols, 'total']]);
    return { kind: 'array', form, rows, cols, choices, wrong, answer: String(answer) };
  }
  if (level === 2) {
    const [rTop, cTop] = ([[3, 4], [5, 5], [5, 10]] as const)[stretch];
    let rows: number, cols: number;
    do { rows = int(rng, 2, rTop); cols = int(rng, 2, cTop); } while (rows * cols > MOST_TOTAL);
    const total = rows * cols;
    const { choices, wrong } = numberChoices(rng, total, [[rows + cols, 'added'], ...(coin(rng) ? [[total + cols, 'extra-group'], [total - cols, 'missing-group']] as [number, Why][] : [[total - cols, 'missing-group'], [total + cols, 'extra-group']] as [number, Why][]), [rows, 'group-count']]);
    return { kind: 'array', form: 'total', rows, cols, choices, wrong, answer: String(total) };
  }
  const rows = int(rng, 2, 5);
  let cols = int(rng, 2, 6);
  if (stretch > 0 && coin(rng)) {
    // the turn-around: tip it on its side, is it the same? (the only question that shows 3 rows of 4 beside 4 rows of 3)
    while (cols === rows) cols = int(rng, 2, 6);
    const same = coin(rng), other: Grid = same ? { rows: cols, cols: rows } : coin(rng) ? { rows: cols, cols: rows + 1 } : { rows: cols + 1 > 6 ? cols - 1 : cols + 1, cols: rows };
    return { kind: 'array', form: 'turn', rows, cols, other, answer: same || other.rows * other.cols === rows * cols ? 'yes' : 'no' };
  }
  const right = addingSentence(rows, cols);
  const options: [string, Why][] = [[addingSentence(rows - 1, cols), 'missing-group'], [addingSentence(rows + 1, cols), 'extra-group'], [plusCard(rows, cols), 'added']];
  const seen = new Set([right, String(cols)]);
  const picked = shuffle(rng, options.filter(([s]) => (seen.has(s) ? false : (seen.add(s), true)))).slice(0, 2);
  return { kind: 'array', form: 'sentence', rows, cols, sentences: shuffle(rng, [right, ...picked.map(([s]) => s)]), wrong: picked.map(([value, why]) => ({ value, why })), answer: right };
}

// ---------- Odd or Even: people pairing up for a ride ----------

function makePair(level: Level, stretch: Stretch, rng: Rng): PairQ {
  if (level === 1) {
    const n = int(rng, 1, 10);
    if (stretch > 0 && coin(rng)) return { kind: 'pair', form: 'oddEven', n, picture: true, answer: n % 2 ? 'odd' : 'even' };
    return { kind: 'pair', form: 'partner', n, answer: n % 2 ? 'no' : 'yes' };
  }
  if (level === 2) {
    if (stretch > 0 && coin(rng)) {
      const want = coin(rng) ? 'even' as const : 'odd' as const, isWant = (x: number) => (x % 2 === 0) === (want === 'even');
      const nums = new Set<number>();
      let right = int(rng, 1, 20); while (!isWant(right)) right = int(rng, 1, 20);
      nums.add(right);
      while (nums.size < 3) { const x = int(rng, 1, 20); if (!isWant(x)) nums.add(x); }
      return { kind: 'pair', form: 'which', want, nums: shuffle(rng, [...nums]), answer: String(right) };
    }
    const n = int(rng, 1, 20);
    return { kind: 'pair', form: 'oddEven', n, picture: false, answer: n % 2 ? 'odd' : 'even' };
  }
  const h = int(rng, 2, 10), n = h * 2;
  if (stretch > 0 && coin(rng)) {
    const { choices, wrong } = numberChoices(rng, h, [[n, 'whole'], [h + 1, 'near-double'], [h - 1, 'near-double']]);
    return { kind: 'pair', form: 'half', n, choices, wrong, answer: String(h) };
  }
  const near = [h - 1, h + 1].filter(x => x >= 1 && x <= MOST_GROUP && x !== h);
  const others = shuffle(rng, near).slice(0, 2);
  if (others.length < 2) others.push(h - 2);
  return { kind: 'pair', form: 'double', n, halves: shuffle(rng, [h, ...others]), wrong: others.map(x => ({ value: String(x), why: 'near-double' as const })), answer: String(h) };
}

// ---------- Count By: house numbers along a street ----------

/** House numbers the voice can say: every number to 200, and the hundreds to 1,000. */
export const COUNT_SAID_TO = 200, HUNDREDS_TO = 1000;
function makeCount(level: Level, stretch: Stretch, rng: Rng): CountQ {
  let step: CountQ['step'], start: number, groups = false;
  if (level === 1) {
    const hundreds = stretch === 0 || coin(rng);
    if (hundreds) { step = 100; start = 100 * int(rng, 1, 6); }
    else { step = 10; start = int(rng, 101, 159); if (start % 10 === 0) start += int(rng, 1, 9); }
  } else if (level === 2) { step = 5; start = 100 + 5 * int(rng, 0, 12); }
  else { step = coin(rng) ? 3 : 4; start = step; groups = true; }
  const top = step === 100 ? HUNDREDS_TO : level === 3 ? step * MOST_GROUP : COUNT_SAID_TO;
  const length = level === 3 ? int(rng, 4, Math.min(6, Math.floor(top / step))) : 4;
  // the run of houses, and which one is missing: the last, or (Stretch 1 and up, from Level 2) one in the middle
  const run = Array.from({ length }, (_, i) => start + i * step).filter(x => x <= top);
  const middle = level >= 2 && stretch > 0 && coin(rng) && run.length >= 4;
  const gap = middle ? int(rng, 1, run.length - 2) : run.length - 1;
  const answer = run[gap]!, before = run[gap - 1]!;
  const other = step === 3 ? 4 : step === 4 ? 3 : step === 5 ? 10 : step === 10 ? 100 : 10;
  const { choices, wrong } = numberChoices(rng, answer, [[before + 1, 'by-ones'], [answer + step, 'jumped-twice'], [before + other, 'wrong-step'], [before, 'stayed']]);
  return { kind: 'count', form: middle ? 'middle' : 'next', step, shown: run.map((x, i) => (i === gap ? null : x)), groups, choices, wrong, answer: String(answer) };
}

// ---------- Share It: boxes shared fairly between trucks ----------

function makeShare(level: Level, stretch: Stretch, rng: Rng): ShareQ {
  if (level === 3) {
    let each: number, trucks: number;
    do { each = int(rng, 2, 5); trucks = int(rng, 2, 6); } while (each === trucks);
    const total = each * trucks;
    const { choices, wrong } = numberChoices(rng, trucks, [[each, 'each-count'], [total, 'total'], [trucks + 1, 'miscount']]);
    return { kind: 'share', form: 'trucks', total, each, choices, wrong, answer: String(trucks) };
  }
  const trucks = level === 1 ? 2 : int(rng, 3, 4);
  if (stretch > 0 && coin(rng)) {
    // Level 1 shares 6 to 12 between two trucks (the brief), Level 2 more between three or four
    const share = level === 1 ? int(rng, 3, 6) : int(rng, 2, Math.min(MOST_GROUP, Math.floor(MOST_TOTAL / trucks))), total = share * trucks;
    const { choices, wrong } = numberChoices(rng, share, [[total, 'whole'], [trucks, 'group-count'], [share + 1, 'miscount']]);
    return { kind: 'share', form: 'each', total, trucks, choices, wrong, answer: String(share) };
  }
  // he moves the boxes himself: few enough to tap one at a time
  const each = level === 1 ? int(rng, 3, 6) : int(rng, 2, trucks === 3 ? 5 : 4);
  return { kind: 'share', form: 'deal', total: each * trucks, trucks, answer: String(each) };
}

// ---------- Times: the × sign ----------

function makeTimes(level: Level, stretch: Stretch, rng: Rng): TimesQ {
  if (level === 1) {
    let rows = int(rng, 2, 5), cols = int(rng, 2, 5);
    if (rows === cols && coin(rng)) cols = cols === 5 ? 4 : cols + 1;
    if (stretch > 0 && coin(rng)) {
      if (rows + cols === rows * cols) cols++; // 2 × 2 and 2 + 2 would both make 4
      const right = timesCard(rows, cols), wrongs: [string, Why][] = [[plusCard(rows, cols), 'added'], [timesCard(rows, cols + 1 > 6 ? cols - 1 : cols + 1), 'miscount']];
      return { kind: 'times', form: 'write', rows, cols, cards: shuffle(rng, [right, ...wrongs.map(([c]) => c)]), wrong: wrongs.map(([value, why]) => ({ value, why })), answer: right };
    }
    // the right building, one a row short (or long), one a window short (or long) on each row; never its turn-around
    const rowsOff = rows > 2 && coin(rng) ? rows - 1 : rows + 1, colsOff = cols > 2 && coin(rng) ? cols - 1 : cols + 1;
    const pics: Grid[] = shuffled(rng, [{ rows, cols }, { rows: rowsOff, cols }, { rows, cols: colsOff }]);
    const at = (g: Grid) => String(pics.indexOf(g));
    return {
      kind: 'times', form: 'match', rows, cols, pictures: pics,
      wrong: [{ value: at(pics.find(p => p.rows !== rows)!), why: rowsOff < rows ? 'missing-group' : 'extra-group' }, { value: at(pics.find(p => p.cols !== cols)!), why: 'miscount' }],
      answer: at(pics.find(p => p.rows === rows && p.cols === cols)!),
    };
  }
  const b = level === 2 ? pick(rng, [2, 5, 10] as const) : pick(rng, [3, 4] as const);
  const a = int(rng, 2, Math.min(MOST_GROUP, Math.floor(MOST_TOTAL / b)));
  if (level === 3 && stretch > 0 && a !== b && coin(rng)) {
    const right = timesCard(b, a), wrongs: [string, Why][] = [[timesCard(a, a), 'miscount'], [timesCard(b, b), 'miscount']];
    return { kind: 'times', form: 'turn', a, b, cards: shuffle(rng, [right, ...wrongs.map(([c]) => c)]), wrong: wrongs.map(([value, why]) => ({ value, why })), answer: right };
  }
  const total = a * b;
  const { choices, wrong } = numberChoices(rng, total, [[a + b, 'added'], ...(coin(rng) ? [[total + b, 'extra-group'], [total - b, 'missing-group']] as [number, Why][] : [[total - b, 'missing-group'], [total + b, 'extra-group']] as [number, Why][])]);
  return { kind: 'times', form: 'fact', a, b, choices, wrong, answer: String(total) };
}

export function makeQuestion(kind: Kind, level: Level, stretch: Stretch, rng: Rng): Question {
  switch (kind) {
    case 'groups': return makeGroups(level, stretch, rng);
    case 'array': return makeArray(level, stretch, rng);
    case 'pair': return makePair(level, stretch, rng);
    case 'count': return makeCount(level, stretch, rng);
    case 'share': return makeShare(level, stretch, rng);
    case 'times': return makeTimes(level, stretch, rng);
  }
}

/** The answers a choice question offers, as the view names them. */
export function offersOf(q: Exclude<Question, { form: 'deal' }>): string[] {
  switch (q.kind) {
    case 'groups': return q.form === 'same' ? ['yes', 'no'] : q.form === 'pick' ? q.pictures.map((_, i) => String(i)) : q.choices.map(String);
    case 'array': return q.form === 'turn' ? ['yes', 'no'] : q.form === 'sentence' ? [...q.sentences] : q.choices.map(String);
    case 'pair': return q.form === 'partner' ? ['yes', 'no'] : q.form === 'oddEven' ? ['odd', 'even'] : q.form === 'which' ? q.nums.map(String) : q.form === 'double' ? q.halves.map(String) : q.choices.map(String);
    case 'count': case 'share': return q.choices.map(String);
    case 'times': return q.form === 'fact' ? q.choices.map(String) : q.form === 'match' ? q.pictures.map((_, i) => String(i)) : [...q.cards];
  }
}

/** Is this the right answer? Share It's deal is right when every truck has the same and every box is shared ("3,3"). Something it
 *  doesn't offer isn't an answer at all (null). */
export function isRightAnswer(q: Question, answer: string): boolean | null {
  if (q.kind === 'share' && q.form === 'deal') {
    const counts = answer.split(',').map(Number);
    if (counts.length !== q.trucks || counts.some(x => !Number.isInteger(x) || x < 0)) return null;
    if (counts.reduce((a, b) => a + b, 0) !== q.total) return null; // boxes still on the pile: not an answer yet
    return counts.every(x => x === q.total / q.trucks);
  }
  if (!offersOf(q).includes(answer)) return null;
  return answer === q.answer;
}

/** The biggest number a question shows as a total of groups, for the "50 or less" rule. */
export function totalOf(q: Question): number {
  switch (q.kind) {
    case 'groups': return q.form === 'same' ? Math.max(...q.buses) * q.buses.length : q.form === 'pick' ? Math.max(...q.pictures.map(p => p.reduce((a, b) => a + b, 0))) : q.groups * q.each;
    case 'array': return q.form === 'turn' ? Math.max(q.rows * q.cols, q.other.rows * q.other.cols) : q.rows * q.cols;
    case 'pair': return q.form === 'which' ? Math.max(...q.nums) : q.n;
    case 'count': return q.groups ? Math.max(...q.shown.map(x => x ?? 0), Number(q.answer)) : 0;
    case 'share': return q.total;
    case 'times': return q.form === 'match' ? Math.max(...q.pictures.map(p => p.rows * p.cols)) : q.form === 'write' ? q.rows * (q.cols + 1) : q.a * q.b;
  }
}
