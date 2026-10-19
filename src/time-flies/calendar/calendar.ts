// The calendar questions: Days of the Week, Months of the Year and Time Facts (how many seconds in a minute...). Each is
// a question read aloud with three spoken answers to tap. Every question and answer is a whole recorded phrase, so the
// voice never has to stitch a day into the middle of a sentence.
import { int, pick, shuffle, type Rng } from '../../game/rng';
import type { Level } from '../clock/time';

export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
export type Day = (typeof DAYS)[number];
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] as const;
export type Month = (typeof MONTHS)[number];
const ORDINALS = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth'] as const;

/** Days, Level by Level: tomorrow, then yesterday, then two days on. */
const dayAsks = {
  1: (d: Day) => `If today is ${d}, what day is tomorrow?` as const,
  2: (d: Day) => `If today is ${d}, what day was yesterday?` as const,
  3: (d: Day) => `What day is two days after ${d}?` as const,
};
/** Months, Level by Level: the one after, the one before, then which one is the third (or ninth...). */
const monthAsks = {
  1: (m: Month) => `What month comes after ${m}?` as const,
  2: (m: Month) => `What month comes before ${m}?` as const,
  3: (n: number) => `What is the ${ORDINALS[n]!} month of the year?` as const,
};

/** Time Facts. `wrong` are the mix-ups worth telling apart from the answer; `tell` is said when he's taught it. */
export const FACTS = [
  { level: 1, ask: 'How many seconds are in a minute?', answer: 60, wrong: [100, 10, 30], tell: 'There are 60 seconds in a minute.' },
  { level: 1, ask: 'How many minutes are in an hour?', answer: 60, wrong: [100, 24, 30], tell: 'There are 60 minutes in an hour.' },
  { level: 1, ask: 'How many hours are in a day?', answer: 24, wrong: [12, 60, 10], tell: 'There are 24 hours in a day.' },
  { level: 1, ask: 'How many days are in a week?', answer: 7, wrong: [5, 10, 12], tell: 'There are 7 days in a week.' },
  { level: 1, ask: 'How many months are in a year?', answer: 12, wrong: [10, 7, 52], tell: 'There are 12 months in a year.' },
  { level: 2, ask: 'How many days are in a weekend?', answer: 2, wrong: [5, 7, 3], tell: 'There are 2 days in a weekend, Saturday and Sunday.' },
  { level: 2, ask: 'How many days are in a year?', answer: 365, wrong: [100, 52, 12], tell: 'There are 365 days in a year.' },
  { level: 2, ask: 'How many weeks are in a year?', answer: 52, wrong: [12, 365, 7], tell: 'There are 52 weeks in a year.' },
  { level: 2, ask: 'How many minutes are in half an hour?', answer: 30, wrong: [50, 60, 15], tell: 'There are 30 minutes in half an hour.' },
  { level: 2, ask: 'How many minutes are in a quarter of an hour?', answer: 15, wrong: [25, 30, 4], tell: 'There are 15 minutes in a quarter of an hour.' },
  { level: 3, ask: 'How many days are in two weeks?', answer: 14, wrong: [7, 12, 21], tell: 'There are 14 days in two weeks.' },
  { level: 3, ask: 'How many hours are in half a day?', answer: 12, wrong: [24, 6, 30], tell: 'There are 12 hours in half a day.' },
  { level: 3, ask: 'How many seconds are in half a minute?', answer: 30, wrong: [50, 60, 15], tell: 'There are 30 seconds in half a minute.' },
  { level: 3, ask: 'How many minutes are in two hours?', answer: 120, wrong: [60, 200, 100], tell: 'There are 120 minutes in two hours.' },
  { level: 3, ask: 'How many hours are in two days?', answer: 48, wrong: [24, 36, 12], tell: 'There are 48 hours in two days.' },
] as const;
type Fact = (typeof FACTS)[number];
export type FactNumber = `${Fact['answer'] | Fact['wrong'][number]}`;

export type QuizAsk = ReturnType<(typeof dayAsks)[Level]> | ReturnType<(typeof monthAsks)[Level]> | Fact['ask'];
export type QuizWord = Day | Month | FactNumber;
export type FactLine = Fact['tell'];

/**
 * One calendar question. `teach` says how the lesson goes: chanting the week or the year along a strip of chips (with
 * month numbers when the question is about them), or telling the fact.
 */
export interface QuizProblem {
  readonly ask: QuizAsk;
  readonly answer: QuizWord;
  readonly choices: readonly QuizWord[];
  readonly teach: { kind: 'week' } | { kind: 'year'; numbers: boolean } | { kind: 'fact'; line: FactLine };
}

export type QuizKind = 'days' | 'months' | 'units';

const around = <T>(xs: readonly T[], i: number) => xs[((i % xs.length) + xs.length) % xs.length]!;

/** The answer and two of its mix-ups, in a random order. */
function choicesFor<T>(answer: T, wrong: readonly T[], rng: Rng): T[] {
  const others = shuffle(rng, [...new Set(wrong)].filter(w => w !== answer)).slice(0, 2);
  return shuffle(rng, [answer, ...others]);
}

export function makeQuiz(kind: QuizKind, level: Level, rng: Rng, avoid?: QuizAsk): QuizProblem {
  for (;;) {
    const p = draw(kind, level, rng);
    if (p.ask !== avoid) return p;
  }
}

function draw(kind: QuizKind, level: Level, rng: Rng): QuizProblem {
  if (kind === 'days') {
    const i = int(rng, 0, 6), d = DAYS[i]!, at = (k: number) => around(DAYS, i + k);
    const [answer, wrong] = level === 1 ? [at(1), [at(-1), d, at(2)]] : level === 2 ? [at(-1), [at(1), d, at(-2)]] : [at(2), [at(1), at(3), at(-2)]];
    return { ask: dayAsks[level](d), answer, choices: choicesFor(answer, wrong, rng), teach: { kind: 'week' } };
  }
  if (kind === 'months') {
    const i = int(rng, 0, 11), at = (k: number) => around(MONTHS, i + k);
    if (level === 3) { // the third month: its neighbours are the easy slip, so never wrap past December
      const near = i === 0 ? [at(1), at(2)] : i === 11 ? [at(-1), at(-2)] : [at(-1), at(1)];
      return { ask: monthAsks[3](i), answer: at(0), choices: choicesFor(at(0), near, rng), teach: { kind: 'year', numbers: true } };
    }
    const [answer, wrong] = level === 1 ? [at(1), [at(-1), at(2)]] : [at(-1), [at(1), at(-2)]];
    return { ask: monthAsks[level](at(0)), answer, choices: choicesFor(answer, wrong, rng), teach: { kind: 'year', numbers: false } };
  }
  const fact = pick(rng, FACTS.filter(f => f.level === level));
  const word = (n: number) => String(n) as FactNumber;
  return { ask: fact.ask, answer: word(fact.answer), choices: choicesFor(word(fact.answer), fact.wrong.map(word), rng), teach: { kind: 'fact', line: fact.tell } };
}

/** Everything the calendar questions say. */
export const CALENDAR_LINES = ["Let's say the days of the week.", "Let's say the months of the year."] as const;
export const CALENDAR_PHRASES = [
  ...CALENDAR_LINES, ...DAYS, ...MONTHS,
  ...([1, 2, 3] as const).flatMap(l => DAYS.map(dayAsks[l])),
  ...([1, 2] as const).flatMap(l => MONTHS.map(monthAsks[l])), ...MONTHS.map((_, i) => monthAsks[3](i)),
  ...FACTS.map(f => f.ask), ...FACTS.map(f => f.tell),
  ...[...new Set(FACTS.flatMap(f => [f.answer, ...f.wrong]))].map(n => String(n) as FactNumber),
] as const;
export type CalendarPhrase = (typeof CALENDAR_LINES)[number] | QuizAsk | QuizWord | FactLine;
