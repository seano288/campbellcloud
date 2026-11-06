// What each question says and shows. A prompt is a chain: recorded pieces with numbers between them, so "8 in all." is two
// clips and one short line of text. The numerals go on screen with every number said, because fourteen and forty sound
// alike: no question ever depends on hearing the difference (say.test.ts checks that).
import type { Phrase } from '../phrases';
import { BOARD_ROWS, valueOf, type BoardProblem, type ChartOp, type Equation, type JumpProblem, type Question, type Side, type Level } from './problems';
export { BOARD_ROWS };

/** A piece of a line: a recorded phrase, a number, or punctuation that only shows. */
export type Part = Phrase | number | '?' | '.';
export interface Prompt { readonly text: string; readonly speech: readonly Phrase[] }
export type AnyQuestion = Question | BoardProblem;

export const NUMBER_TOP = 200;
export const said = (n: number) => `${n}` as Phrase;
export const speech = (parts: readonly Part[]): Phrase[] => parts.filter((p): p is Phrase | number => p !== '?' && p !== '.').map(p => (typeof p === 'number' ? said(p) : p));
export const textOf = (parts: readonly Part[]) => parts.map(String).join(' ').replace(/ ([?.])/g, '$1');
export const line = (...parts: Part[]): Prompt => ({ text: textOf(parts), speech: speech(parts) });

const sideParts = (s: Side): Part[] => ('n' in s ? [s.n] : [s.a, s.op === '+' ? 'plus' : 'take away', s.b]);
export const sideText = (s: Side) => ('n' in s ? String(s.n) : `${s.a} ${s.op === '+' ? '+' : '−'} ${s.b}`);
export { valueOf };

export const jumpSum = (q: Pick<JumpProblem, 'a' | 'b' | 'op'>) => `${q.a} ${q.op === 'add' ? '+' : '−'} ${q.b}`;
/** 3 + 5 = ?, or with the sum on the left so = doesn't come to mean "the answer is next". */
export function equationText(e: Equation) {
  const sum = e.op === 'add' ? `${e.a} + ${e.b}` : `${e.c} − ${e.b}`;
  return e.flip ? `? = ${sum}` : `${sum} = ?`;
}

/** A sentence of a story as a chain, split round its numbers. */
export const storyParts = (sentence: string): Part[] => sentence.split(/(\d+)/).flatMap((p): Part[] => {
  if (/^\d+$/.test(p)) return [Number(p)];
  const bit = p.replace(/^[\s,]+/, '').replace(/\s+$/, '');
  return bit === '' ? [] : bit === '.' ? ['.'] : bit === '?' ? ['?'] : [bit as Phrase];
});
const CHART_WORDS = { '+10': 'Ten more than', '-10': 'Ten less than', '+1': 'One more than', '-1': 'One less than' } as const satisfies Record<ChartOp, Phrase>;
export const chartWords = (op: ChartOp) => CHART_WORDS[op];
const boardLine = (q: BoardProblem): Phrase => (q.form === 'total' ? 'How many hits in all?'
  : q.form === 'each' ? `How many did the ${q.row} get?`
    : `How many more did the ${q.row} get than the ${q.other}?` as Phrase);

export const tensWord = (n: number): Part => (n === 1 ? 'ten and' : 'tens and');
export const onesWord = (n: number): Part => (n === 1 ? 'one.' : 'ones.');

export function promptOf(q: AnyQuestion, level: Level): Prompt {
  switch (q.kind) {
    case 'ten':
      if (q.form === 'look') return line('How many?');
      if (q.form === 'partners') return line('How many more to make ten?');
      return line(q.whole, 'in all.', q.part, q.part === 1 ? 'is here.' : 'are here.', 'How many are hiding?');
    case 'on':
      if (q.form === 'box') return line(q.a, 'in the box.', q.b, 'more.', 'How many in all?');
      if (q.form === 'biggerFirst') return line(q.a, 'plus', q.b, '.', 'Tap the number to start from.');
      return line('Start at', q.from, '.', 'Count up to', q.to, '.', 'How many hops?');
    case 'facts': {
      const { a, b, c, op, flip } = q.eq, sum: Part[] = op === 'add' ? [a, 'plus', b] : [c, 'take away', b];
      if (flip) return line('What number is the same as', ...sum, '?');
      if (op === 'sub' && level === 2) return line(b, 'and what make', c, '?');
      return line(...sum, 'is the same as what?');
    }
    case 'over':
      if (q.form === 'fill') return line(q.a, 'plus', q.b, '.', 'Fill the ten.');
      return q.form === 'plain' ? line(q.a, 'plus', q.b, 'is the same as what?') : line(q.c, 'take away', q.b, 'is the same as what?');
    case 'part':
      switch (q.form) {
        case 'bond': return line(q.whole, 'in all.', q.here, 'here.', 'How many under the plate?');
        case 'addTo': return line(q.a, 'and how many make', q.c, '?');
        case 'takeFrom': return line(q.c, 'take away what number is the same as', q.a, '?');
        case 'firstAdd': return line('What number and', q.b, 'make', q.c, '?');
        case 'flipTake': return line(q.a, 'is the same as what number take away', q.b, '?');
      }
      break;
    case 'scale':
      if (q.form === 'same') return line('One side is', ...sideParts(q.eq.left), '.', 'The other side is', ...sideParts(q.eq.right), '.', 'Is it the same on both sides?');
      if (q.form === 'cards') return line('Tap the true one.');
      return q.blankFirst
        ? line(q.a, 'plus', q.b, 'is the same as what number plus', q.c, '?')
        : line(q.a, 'plus', q.b, 'is the same as', q.c, 'plus what number?');
    case 'story': return line(...q.lines.flatMap(storyParts));
    case 'board': return line(boardLine(q));
    case 'tens':
      switch (q.form) {
        case 'read': return line(q.rods, tensWord(q.rods), q.cubes, onesWord(q.cubes), 'What number?');
        case 'make': return q.n < 20 ? line('Make', q.n, '.', 'Ten and', q.n - 10, '.') : line('Make', q.n, '.');
        case 'howManyTens': return line('How many tens in', q.n, '?');
        case 'compare': return line(q.a, 'and', q.b, '.', 'Tap the sign.');
      }
      break;
    case 'skip':
      if (q.form === 'groups') return line(q.groups, 'groups of', q.step, '.', 'Count by', q.step, '.', 'How many?');
      if (q.form === 'next') return line('Count by', q.step, '.', ...q.shown, 'What comes next?');
      return line('Count by', q.step, '.', ...q.shown.map(n => n ?? 'what number?'));
    case 'chart':
      if (q.form === 'tap') return line('Tap', q.n, '.');
      return q.form === 'next' ? line(...q.shown, 'What comes next?') : line(chartWords(q.op), q.n, '.');
    case 'jump': {
      const sum: Part[] = [q.a, q.op === 'add' ? 'plus' : 'take away', q.b];
      return q.flip ? line('What number is the same as', ...sum, '?') : line(...sum, 'is the same as what?');
    }
    case 'measure':
      switch (q.form) {
        case 'order': return line(`Tap the ${q.want}.`);
        case 'rope': return line('The rope is as long as the top bar.', 'Which bar is longer?');
        case 'lay': return line('Lay wrenches to the end.', 'How many wrenches long?');
        case 'count': return line('How many wrenches long?');
        case 'right': return line('Which one is measured right?');
        case 'fewer': return line('Big wrenches or small wrenches?', `Which takes ${q.want}?`);
      }
      break;
    case 'shape':
      switch (q.form) {
        case 'every': return line(`Tap every ${q.name}.`);
        case 'notA': return line(`Which one is not a ${q.name}?`);
        case 'rule': return line('Tap the shape with', q.sides, 'sides, all joined.');
        case 'sides': return line('How many sides?');
        case 'fill': return line('Fill the shape.', 'Tap the pieces that fit.');
      }
  }
}

/** One sentence of a story, for its own 🔊. */
export const sentenceOf = (sentence: string) => line(...storyParts(sentence));
export const SIGN_WORDS = { '<': 'is less than', '=': 'is the same as', '>': 'is more than' } as const satisfies Record<string, Phrase>;
