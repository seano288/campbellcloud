// The sight words, in the order he meets them: 100 of the most common words (Dolch pre-primer and primer, Fry's first
// hundred) in 20 sets of 5, so that look-alikes (was/saw, on/no, the/then, of/for, here/where, to/two, run/ran) never sit
// in the same set. Research: .scratch/sight-squad/research/teaching-sight-words.md.
//
// A heart word's tricky letters are in [brackets]: they don't say what they usually say (the "ai" in said), so they get a
// heart when the word is taught and are learned "by heart". The rest of the word, and every regular word, is read the usual way.

const SPECS = [
  'I', '[a]', 'see', 'go', 'up',
  'th[e]', 'can', 'run', 'm[y]', 'look',
  'i[s]', 'we', 'jump', 'down', 'and',
  'it', 'y[ou]', 'me', 'play', 'c[o]me',
  't[o]', 'in', 'big', 'little', 's[ai]d',
  'here', 'not', 'stop', 'help', 'yes',
  'he', 'like', 'ar[e]', 'on', '[a]ll',
  'w[as]', 'at', 'th[ey]', 'hav[e]', 'good',
  'wh[a]t', 'd[o]', 'this', 'get', 'no',
  'she', 'so', 'but', 'int[o]', 'with',
  '[one]', '[two]', 'three', 'red', 'blue',
  'for', '[who]', 'did', 'eat', 'ride',
  'make', 'f[i]nd', 'wh[ere]', '[a]way', 'funny',
  'yellow', 'green', 'black', 'white', 'brown',
  'her', 'him', 'then', 'out', 'will',
  'th[ere]', 'went', 'now', 'ran', 'b[y]',
  '[of]', 'fr[o]m', 'our', 'them', 'ha[s]',
  'hi[s]', 'w[a]nt', 'when', 'how', 'y[our]',
  's[o]me', 'saw', 'new', 'under', 'please',
  'had', 'c[oul]d', 'w[al]k', 'fl[y]', 'after',
] as const;

type Strip<S extends string> = S extends `${infer A}[${infer B}]${infer C}` ? Strip<`${A}${B}${C}`> : S;
export type Word = Strip<(typeof SPECS)[number]>;

export interface WordInfo {
  readonly word: Word;
  /** Which letters are the heart part (indexes into the word); empty for a regular word. */
  readonly heart: readonly number[];
  /** Which set of 5 it's in, from 0. */
  readonly set: number;
}

function parse(spec: string, i: number): WordInfo {
  const heart: number[] = [];
  let word = '', inHeart = false;
  for (const ch of spec) {
    if (ch === '[') inHeart = true;
    else if (ch === ']') inHeart = false;
    else { if (inHeart) heart.push(word.length); word += ch; }
  }
  return { word: word as Word, heart, set: Math.floor(i / 5) };
}

export const WORD_INFO: readonly WordInfo[] = SPECS.map(parse);
/** Every sight word, in the order he meets them. */
export const WORDS: readonly Word[] = WORD_INFO.map(w => w.word);
export const SET_SIZE = 5;
export const isWord = (x: unknown): x is Word => (WORDS as readonly unknown[]).includes(x);
export const infoOf = (w: Word): WordInfo => WORD_INFO[WORDS.indexOf(w)]!;
export const isHeart = (w: Word) => infoOf(w).heart.length > 0;

/**
 * Picture words: short, regular nouns the sentences need ("I see a dog."). They are never asked about, but they are read
 * aloud like any other word when he taps one by mistake.
 */
export const NOUNS = [
  'dog', 'dogs', 'cat', 'cats', 'sun', 'bus', 'hat', 'box', 'ball', 'tank', 'bug', 'duck', 'frog', 'frogs', 'fish', 'bed',
  'car', 'cup', 'cake', 'Mom', 'Dad', 'sky', 'boat',
] as const;
export type Noun = (typeof NOUNS)[number];
/** Anything that can be shown as a word card: a sight word or a picture word. */
export type AnyWord = Word | Noun;
export const isNoun = (x: string): x is Noun => (NOUNS as readonly string[]).includes(x);

/**
 * What job each word does in a sentence, roughly. Fill the Gap's wrong choices come from a different job than the right
 * one, so only one choice makes sense: "I can ___" offers "run" with "big" and "down", never "run" with "jump".
 */
export type Role = 'who' | 'which' | 'do' | 'helper' | 'like' | 'where' | 'join' | 'say';
const ROLE_WORDS: Record<Role, readonly Word[]> = {
  who: ['I', 'we', 'you', 'me', 'he', 'she', 'they', 'it', 'him', 'them', 'this', 'what', 'who'],
  which: ['a', 'the', 'my', 'our', 'your', 'his', 'her', 'some', 'all', 'one', 'two', 'three'],
  do: ['see', 'go', 'run', 'look', 'jump', 'play', 'come', 'help', 'stop', 'like', 'have', 'get', 'eat', 'ride', 'make', 'find', 'went', 'ran', 'saw', 'want', 'walk', 'fly', 'said'],
  helper: ['can', 'is', 'are', 'was', 'will', 'could', 'did', 'has', 'had', 'do'],
  like: ['big', 'little', 'good', 'funny', 'new', 'red', 'blue', 'yellow', 'green', 'black', 'white', 'brown'],
  where: ['up', 'down', 'in', 'on', 'at', 'to', 'into', 'with', 'for', 'by', 'of', 'from', 'under', 'out', 'away', 'here', 'there', 'where', 'now', 'then', 'when', 'how', 'so', 'not', 'after'],
  join: ['and', 'but'],
  say: ['yes', 'no', 'please'],
};
export const roleOf = (w: Word): Role => (Object.keys(ROLE_WORDS) as Role[]).find(r => ROLE_WORDS[r].includes(w))!;
/**
 * The jobs whose words never fit where a word of this job goes, so Fill the Gap only offers those as the wrong choices. Jobs
 * that can stand in for each other are kept apart: "Here is my hat" and "This is my hat", "She had a hat" and "She saw a
 * hat", "Go up!" and "Go play!", "We play, then we eat" and "We play, and we eat", "Come here now!" and "Come here, please!".
 */
export const NEVER_FITS: Record<Role, readonly Role[]> = {
  who: ['do', 'helper', 'like', 'join'],
  which: ['do', 'helper', 'join', 'say'],
  do: ['which', 'like', 'join', 'say'],
  helper: ['which', 'like', 'join', 'say'],
  like: ['do', 'helper', 'join', 'say'],
  where: ['which', 'helper'],
  join: ['which', 'helper', 'like'],
  say: ['which', 'helper', 'like'],
};
/** Words that sound the same, so they're never offered together when he has to tell them apart by ear. */
export const SOUND_ALIKE: readonly (readonly Word[])[] = [['to', 'two']];
export const soundsAlike = (a: Word, b: Word) => SOUND_ALIKE.some(group => group.includes(a) && group.includes(b));
export const ROLELESS = () => WORDS.filter(w => !(Object.values(ROLE_WORDS) as Word[][]).some(ws => ws.includes(w)));

// ---------- look-alikes ----------

export const LETTERS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'] as const;
export type Letter = (typeof LETTERS)[number];
/** Letters that are easy to mix up, for Build It's spare tiles at Level 3. */
export const LOOKALIKE_LETTERS: Readonly<Record<string, string>> = {
  b: 'd', d: 'b', p: 'q', q: 'p', m: 'n', n: 'm', u: 'n', h: 'n', w: 'v', v: 'w', i: 'l', l: 'i', t: 'f', f: 't', e: 'a', a: 'e', o: 'a', s: 'z', y: 'v', r: 'n', c: 'e', g: 'q', k: 'h', j: 'i',
};

/** How alike two words look (higher is more alike): the same first letter, the same last letter, the same letters, the same length. */
export function likeness(a: string, b: string) {
  a = a.toLowerCase(); b = b.toLowerCase();
  if (a === b) return Infinity;
  const sorted = (s: string) => [...s].sort().join('');
  let score = 0;
  if (a[0] === b[0]) score += 3;
  if (a.at(-1) === b.at(-1)) score += 2;
  if (sorted(a) === sorted(b)) score += 4; // was / saw, on / no
  if (a.length === b.length) score += 1;
  const shared = [...new Set(a)].filter(c => b.includes(c)).length;
  score += shared;
  return score;
}

/** Spelling a word aloud, letter by letter: "S", "A", "I", "D". */
export const letterLine = (c: string) => `Letter ${c.toUpperCase()}` as LetterPhrase;
export type LetterPhrase = `Letter ${Uppercase<Letter>}`;
export const LETTER_PHRASES = LETTERS.map(letterLine);
