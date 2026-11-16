// The sentences as the game uses them: each split into its cars (the words) and its caboose (the end mark), with what it can be
// used for. See list.ts for the rules.
import type { Mark } from './grammar';
import { SPECS, type AskAbout, type SentenceText } from './list';
import type { Meaning } from './scenes';
import { isName } from './words';

export interface Sentence {
  readonly id: number;
  readonly text: SentenceText;
  /** The words as written: the first with its capital, names and "I" with theirs, the rest lowercase. */
  readonly words: readonly string[];
  readonly mark: Mark;
  readonly m?: Meaning;
  readonly ask: readonly (readonly [q: string, about: AskAbout])[];
  /** Build the Train and Fix the Train may use it (the test checks it has exactly one order). */
  readonly order: boolean;
}

/** Words that can sit in more than one place, or join two things that could swap: never in Build the Train. */
export const FLOATING = ['now', 'too', 'then', 'and', 'but', 'so'] as const;

const split = (text: string) => {
  const mark = text.slice(-1) as Mark, words = text.slice(0, -1).split(' ');
  return { mark, words };
};

export const SENTENCES: readonly Sentence[] = SPECS.map((s, id) => {
  const { mark, words } = split(s.text);
  const floating = words.some(w => (FLOATING as readonly string[]).includes(w.toLowerCase()));
  return {
    id, text: s.text, words, mark, m: 'm' in s ? s.m as Meaning : undefined, ask: 'ask' in s ? s.ask : [],
    order: words.length >= 3 && words.length <= 6 && !floating && !('noOrder' in s),
  };
});
export const sentence = (id: number) => SENTENCES[id]!;

/** How a word is written in the middle of a sentence: lowercase, except "I" and names. */
export const midForm = (w: string) => (w === 'I' || isName(w) ? w : w.toLowerCase());
/** How the engine shows it: with its capital. */
export const capForm = (w: string) => w.charAt(0).toUpperCase() + w.slice(1);
/** The word as it's said alone (its clip): lowercase, except "I" and names. */
export const wordKey = midForm;

/** Build the Train's sentences at each Level: 3 words; 4 to 5 words; 5 to 6 words and the questions. */
export function orderPool(level: 1 | 2 | 3): readonly Sentence[] {
  return SENTENCES.filter(s => s.order && (level === 1 ? s.words.length === 3 && s.mark !== '?'
    : level === 2 ? s.words.length >= 4 && s.words.length <= 5 && s.mark !== '?'
      : (s.words.length >= 5 || s.mark === '?') && s.words.length >= 3));
}
/** Every word any sentence uses, as its clip says it. */
export const ALL_WORDS = [...new Set(SENTENCES.flatMap(s => s.words.map(wordKey)))];
