// Which words on the list are one sound apart (ship / shop / chip), and which must never be offered together when he only hears
// the word. Plain data and the small helpers that read it, no game code.
import { sameSound, WORD_INFO, type Word, type WordInfo } from './list';

/** A word's sounds, looked up once (list.ts's infoOf searches the whole list each time). */
const INFO = new Map<Word, WordInfo>(WORD_INFO.map(i => [i.word, i]));
const infoOf = (w: Word) => INFO.get(w)!;

/** The one box where two words of the same number of sounds differ, if they differ in exactly one, and say a different sound there
 *  (cat / coat yes; c / k would be the same sound, so never). -1 otherwise. */
export function diffBox(a: Word, b: Word): number {
  const x = infoOf(a).sounds, y = infoOf(b).sounds;
  if (a === b || x.length !== y.length) return -1;
  const at = x.flatMap((s, i) => (s === y[i] ? [] : [i]));
  return at.length === 1 && !sameSound(x[at[0]!]!).includes(y[at[0]!]!) ? at[0]! : -1;
}
export const oneSoundApart = (a: Word, b: Word) => NEAR.get(a)?.has(b) ?? false;

const NEIGHBOURS = new Map<Word, readonly Word[]>(WORD_INFO.map(a => [a.word, WORD_INFO.filter(b => diffBox(a.word, b.word) >= 0).map(b => b.word)]));
const NEAR = new Map<Word, ReadonlySet<Word>>([...NEIGHBOURS].map(([w, n]) => [w, new Set(n)]));
/** Every word on the list one sound away from this one. */
export const neighbours = (w: Word): readonly Word[] => NEIGHBOURS.get(w) ?? [];

/** How many sounds two words share in the same place: how alike they look and sound. */
export function shared(a: Word, b: Word): number {
  const x = infoOf(a).sounds, y = infoOf(b).sounds;
  return x.reduce((n, s, i) => n + (y[i] === s ? 1 : 0), 0) + (x.at(-1) === y.at(-1) && x.length !== y.length ? 1 : 0);
}
/** Nothing in common: a different first sound, a different vowel and no sound in the same place. Level 1's "very different". */
export function veryDifferent(a: Word, b: Word): boolean {
  const x = infoOf(a).sounds, y = infoOf(b).sounds;
  return shared(a, b) === 0 && !x.some(s => y.includes(s) && /[aeiou]/.test(s));
}

/**
 * Pairs a listener can't reliably tell apart in the recorded voice, so Hear It never offers them together: e and i before n (pen / pin
 * is one sound in much of the South), and every pair the speech-to-text check heard as each other when the clips were made (a word
 * transcribed as another word on the list). See .scratch/dino-dig/spec.md, "The voice test".
 */
export const HEARD_ALIKE: readonly (readonly [Word, Word])[] = [
  ['pen', 'pin'],
  // speech-to-text heard the first as the second (slowly, or in Word Wreckers' clips of the same words), or as a word next to it
  ['shop', 'sharp'], ['mop', 'map'], ['hut', 'hat'],
];
export const heardAlike = (a: Word, b: Word) => HEARD_ALIKE.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
