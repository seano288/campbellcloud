// The six kinds of sight-word question, and meeting a new word. Each maker gets the word to ask about (chosen in
// src/sight-squad/mix.ts) and the words he knows; it returns null when it can't ask about that word yet (Build It can't
// spell "I", and a sentence needs every other word in it to be known).
//
// Wrong choices may be any word on the list, since they are only shown (or read aloud): at Level 1 a word that looks
// nothing like the right one, at Level 3 a look-alike (the same first letter, the same letters: was and saw).
import { int, pick, shuffle, type Rng } from '../../game/rng';
import { LETTERS, likeness, LOOKALIKE_LETTERS, NEVER_FITS, roleOf, soundsAlike, WORDS, type Word } from './list';
import { meetSentence, readable, type Sentence, type SentenceText, SENTENCES } from './sentences';

export type Level = 1 | 2 | 3;

export interface HearProblem { readonly target: Word; readonly choices: readonly Word[] }
export interface HuntCard { readonly word: Word; readonly shown: string }
export interface HuntProblem { readonly target: Word; readonly cards: readonly HuntCard[] }
export interface SpellProblem { readonly target: Word; readonly tiles: readonly string[]; readonly ghost: boolean }
export interface ReadProblem { readonly target: Word; readonly choices: readonly Word[] }
export interface SentenceProblem { readonly target: Word; readonly sentence: SentenceText }
export interface FillProblem { readonly target: Word; readonly sentence: SentenceText; readonly choices: readonly Word[] }
export interface MeetProblem { readonly target: Word; readonly sentence: SentenceText | null }

export const sentenceOf = (text: SentenceText): Sentence => SENTENCES.find(s => s.text === text)!;

/**
 * `n` wrong words to go with `target`, as alike as the Level asks: Level 1 the least alike (and never the same first
 * letter), Level 2 any, Level 3 the most alike. Words he knows come first where there's a choice.
 */
export function wrongWords(target: Word, n: number, level: Level, rng: Rng, known: readonly Word[], pool: readonly Word[] = WORDS): Word[] {
  const others = pool.filter(w => w.toLowerCase() !== target.toLowerCase() && !soundsAlike(w, target)); // he hears the word, so to and two can't both be offered
  const ranked = shuffle(rng, others).sort((a, b) => likeness(target, a) - likeness(target, b));
  let from: Word[];
  if (level === 1) from = ranked.filter(w => w[0]!.toLowerCase() !== target[0]!.toLowerCase()).slice(0, Math.max(n * 4, 12));
  else if (level === 3) from = ranked.slice(-Math.max(n * 2, 5));
  else from = ranked;
  const mine = shuffle(rng, from.filter(w => known.includes(w))), rest = shuffle(rng, from.filter(w => !known.includes(w)));
  const chosen = [...mine, ...rest].slice(0, n);
  return chosen.length < n ? [...chosen, ...shuffle(rng, others.filter(w => !chosen.includes(w))).slice(0, n - chosen.length)] : chosen;
}

// ---------- 👂 Find It: hear a word, tap it ----------

export function makeHear(level: Level, rng: Rng, target: Word, known: readonly Word[]): HearProblem {
  const n = level === 1 ? 1 : level === 2 ? 2 : 3;
  return { target, choices: shuffle(rng, [target, ...wrongWords(target, n, level, rng, known)]) };
}

// ---------- 🔎 Word Hunt: tap every copy ----------

const capital = (w: string) => w[0]!.toUpperCase() + w.slice(1);
export function makeHunt(level: Level, rng: Rng, target: Word, known: readonly Word[]): HuntProblem {
  const size = level === 1 ? 6 : level === 2 ? 9 : 12, hits = level === 1 ? 2 : level === 2 ? 3 : int(rng, 3, 4);
  const wrong = wrongWords(target, level === 3 ? 4 : 3, level, rng, known);
  const cards: HuntCard[] = [
    ...Array.from({ length: hits }, (_, i) => ({ word: target, shown: level === 3 && i === 0 && target !== 'I' ? capital(target) : target })),
    ...Array.from({ length: size - hits }, (_, i) => { const w = wrong[i % wrong.length]!; return { word: w, shown: w }; }),
  ];
  return { target, cards: shuffle(rng, cards) };
}
export const huntTargets = (p: HuntProblem) => p.cards.flatMap((c, i) => (c.word === p.target ? [i] : []));

// ---------- 🔤 Build It: tap the letters in order ----------

/** Build It spells words of two letters or more. */
export const canSpell = (w: Word) => w.length >= 2;
export function makeSpell(level: Level, rng: Rng, target: Word): SpellProblem | null {
  if (!canSpell(target)) return null;
  const letters = [...target.toLowerCase()];
  const spares: string[] = [];
  if (level === 2) spares.push(pick(rng, LETTERS.filter(c => !letters.includes(c))));
  if (level === 3) {
    const alike = [...new Set(letters.map(c => LOOKALIKE_LETTERS[c]).filter((c): c is string => !!c && !letters.includes(c)))];
    spares.push(...shuffle(rng, alike).slice(0, 2));
    while (spares.length < 2) spares.push(pick(rng, LETTERS.filter(c => !letters.includes(c) && !spares.includes(c))));
  }
  let tiles = shuffle(rng, [...letters, ...spares]);
  for (let k = 0; k < 5 && tiles.join('').startsWith(letters.join('')); k++) tiles = shuffle(rng, tiles); // not already in order
  return { target, tiles, ghost: level === 1 };
}

// ---------- 👀 Read It: read the word, pick the one you hear ----------

export function makeRead(level: Level, rng: Rng, target: Word, known: readonly Word[]): ReadProblem {
  return { target, choices: shuffle(rng, [target, ...wrongWords(target, level === 1 ? 1 : 2, level, rng, known)]) };
}

// ---------- 📜 Sentence Hunt: find the word in a sentence ----------

/** The sentences that could ask about `target` at this Level, from the ones he can read. */
function sentencesFor(level: Level, target: Word, known: readonly Word[]) {
  const all = readable(known).filter(s => s.words.includes(target));
  const starts = (s: Sentence) => s.tokens[0]!.word === target;
  const fits = level === 1 ? all.filter(s => s.tokens.length <= 4) : level === 2 ? all.filter(s => s.tokens.length <= 6) : all.filter(starts);
  return fits.length ? fits : all;
}
export function makeSentence(level: Level, rng: Rng, target: Word, known: readonly Word[]): SentenceProblem | null {
  const options = sentencesFor(level, target, known);
  return options.length ? { target, sentence: pick(rng, options).text } : null;
}
export const canSentence = (target: Word, known: readonly Word[]) => readable(known).some(s => s.words.includes(target));

// ---------- ✏️ Fill the Gap: which word is missing? ----------

export function makeFill(level: Level, rng: Rng, target: Word, known: readonly Word[]): FillProblem | null {
  const options = readable(known).filter(s => s.gap === target);
  if (!options.length) return null;
  const s = pick(rng, options), wrong = NEVER_FITS[roleOf(target)];
  const pool = WORDS.filter(w => wrong.includes(roleOf(w)) && !s.words.includes(w));
  return { target, sentence: s.text, choices: shuffle(rng, [target, ...wrongWords(target, level === 1 ? 1 : 2, level, rng, known, pool)]) };
}
export const canFill = (target: Word, known: readonly Word[]) => readable(known).some(s => s.gap === target);

// ---------- meeting a new word ----------

export const makeMeet = (target: Word, known: readonly Word[]): MeetProblem => ({ target, sentence: meetSentence(target, known)?.text ?? null });
