// The five kinds of question, each made about one word from a Pattern he has met, and how an answer is checked. Every question has
// exactly one right answer, and every word in it (the choices, the silly word's Pattern, a sentence's words) comes from the Patterns he
// has met, plus the first Sight Squad words in a sentence.
//
//   read      Read It: a word is shown, never said; tap its picture. L1 two pictures of very different words, L2 three, L3 three whose
//             words are one sound apart where the list has them (cat / bat / hat).
//   hear      Hear It: hear a word; tap the written word. L1 two very different words, L2 three, L3 three one sound apart. Words the voice
//             says alike (pen / pin) are never offered together.
//   swap      Sound Swap: "This says cat. Make it say cot." Tap the sound to change, then pick the new one. L1 that sound glows, L2 he
//             finds it, L3 the change is two letters for one sound (sh, ck, ee, a_e, ar...).
//   real      Real or Silly: two words; tap the real one. L1 a silly word with nothing in common with it, L2 a silly word of the same
//             Pattern, L3 a silly word one letter off it (hat / hab).
//   sentence  Read and Find: a short sentence he reads; tap the picture that matches. L1 three words ("A big pig."), L2 four or five
//             ("A fox in a box."), L3 the other pictures each differ from it by one word (in / on, big / little, fox / box).
//
// Answers are strings: the word (read, hear, real), the box tapped and then "box=spelling" (swap), the scene's key (sentence).
import { pick, shuffle, type Rng } from '../../game/rng';
import { isVowelSound, sameSound, VOWELS, WORD_INFO, wordsIn, type PatternId, type Word, type WordInfo } from '../words/list';
import { diffBox, heardAlike, neighbours, oneSoundApart, shared, veryDifferent } from '../words/pairs';
import { CONTAINERS, hasPicture, IN_OR_ON, pictureClash, SUBJECTS, SURFACES } from '../words/pictures';
import { SILLY } from '../words/silly';

/** A word's sounds and Pattern, looked up once. */
const INFO = new Map<Word, WordInfo>(WORD_INFO.map(i => [i.word, i]));
const infoOf = (w: Word) => INFO.get(w)!;

export const KINDS = ['read', 'hear', 'swap', 'real', 'sentence'] as const;
export type Kind = (typeof KINDS)[number];
export type Level = 1 | 2 | 3;

export interface ReadQ { kind: 'read'; word: Word; choices: Word[] }
export interface HearQ { kind: 'hear'; word: Word; choices: Word[] }
/** `from` is shown and said; `word` is said and is what it should become; `box` is the sound that changes to `answer`. */
export interface SwapQ { kind: 'swap'; word: Word; from: Word; box: number; answer: string; choices: string[]; marked: boolean }
export interface RealQ { kind: 'real'; word: Word; silly: string; choices: string[] }
/** `word`: the sentence's word from the latest Pattern, whose Pattern the question counts for. */
export interface SentenceQ { kind: 'sentence'; word: Word; scene: Scene; choices: Scene[] }
/** Meeting a Pattern: three example words, the Pattern's sounds lit. Any tap goes on. */
export interface MeetQ { kind: 'meet'; pattern: PatternId; examples: readonly Word[] }
export type Question = ReadQ | HearQ | SwapQ | RealQ | SentenceQ;

/** The words he can be asked about, and offered: those in the Patterns he has met (short vowels before he has met any). */
const metCache = new Map<string, Word[]>();
export const metWords = (met: readonly PatternId[]): Word[] => {
  const key = met.join(',');
  let words = metCache.get(key);
  if (!words) metCache.set(key, words = (met.length ? met : (['cvc'] as PatternId[])).flatMap(p => wordsIn(p)));
  return words;
};

// ---------- the examples a Pattern is met with ----------

export const EXAMPLES: Record<PatternId, readonly Word[]> = {
  cvc: ['cat', 'pig', 'dog'], digraph: ['ship', 'fish', 'duck'], blend: ['frog', 'stop', 'nest'],
  'magic-e': ['cake', 'bike', 'bone'], team: ['tree', 'boat', 'snail'], r: ['car', 'corn', 'bird'],
};

// ---------- picking choices ----------

/** Up to `n` of these, best first, skipping any that clash with what's already picked. */
function take<T>(xs: readonly T[], n: number, clash: (a: T, b: T) => boolean, already: readonly T[]): T[] {
  const out: T[] = [];
  for (const x of xs) { if (out.length >= n) break; if (![...already, ...out].some(y => clash(x, y))) out.push(x); }
  return out;
}
const picClash = (a: Word, b: Word) => pictureClash(a, b);
const hearClash = (a: Word, b: Word) => a === b || heardAlike(a, b);

/** Wrong choices for Read It or Hear It. `pool`: the words it may offer (pictured ones for Read It). */
function wrongWords(level: Level, w: Word, pool: readonly Word[], rng: Rng, clash: (a: Word, b: Word) => boolean): Word[] {
  const others = shuffle(rng, pool.filter(x => x !== w && !clash(x, w)));
  if (level === 1) return take(others.filter(x => veryDifferent(x, w)), 1, clash, [w]);
  if (level === 2) return take(others.filter(x => !oneSoundApart(x, w)), 2, clash, [w]);
  // Level 3: one sound apart first, then the closest-looking words
  const near = others.filter(x => oneSoundApart(x, w));
  const close = others.filter(x => !near.includes(x)).sort((a, b) => shared(b, w) - shared(a, w));
  return take([...near, ...close], 2, clash, [w]);
}
/** Whether this kind of choice can be made about w at this Level from these words. */
function wordsFor(level: Level, w: Word, pool: readonly Word[], clash: (a: Word, b: Word) => boolean) {
  const others = pool.filter(x => x !== w && !clash(x, w));
  if (level === 1) return others.some(x => veryDifferent(x, w));
  if (level === 2) return take(others.filter(x => !oneSoundApart(x, w)), 2, clash, [w]).length === 2;
  return others.some(x => oneSoundApart(x, w)) && take(others, 2, clash, [w]).length === 2;
}

// ---------- Sound Swap ----------

const MULTI = (s: string) => s.length > 1;
/** The words he could be told to change into w at this Level: one sound apart, met, and (L3) a change with two letters for one sound. */
export function swapSources(level: Level, w: Word, met: readonly Word[]): Word[] {
  return neighbours(w).filter(f => {
    // "This says pen. Make it say pin." is no question when the two sound alike
    if (!met.includes(f) || heardAlike(f, w)) return false;
    const i = diffBox(f, w), a = infoOf(f).sounds[i]!, b = infoOf(w).sounds[i]!;
    return level === 3 ? MULTI(a) || MULTI(b) : !MULTI(a) && !MULTI(b);
  });
}
const CONSONANTS = ['b', 'c', 'd', 'f', 'g', 'h', 'j', 'l', 'm', 'n', 'p', 'r', 's', 't', 'v', 'w', 'z'];
const MULTI_POOL = ['sh', 'ch', 'th', 'ck', 'ng', 'ee', 'ai', 'oa', 'ar', 'or', 'ir', 'a_e', 'i_e', 'o_e', 'u_e'];
/** Tiles for the new sound: the right one, and others that say a different sound from it and from the old one. */
function swapTiles(level: Level, old: string, right: string, rng: Rng): string[] {
  const n = level === 1 ? 2 : 3;
  const family = isVowelSound(right)
    ? (level === 3 ? MULTI_POOL.filter(isVowelSound) : [...VOWELS])
    : level === 3 ? MULTI_POOL.filter(s => !isVowelSound(s)).concat(CONSONANTS) : CONSONANTS;
  const fine = (s: string) => !sameSound(right).includes(s) && !sameSound(old).includes(s) && s !== old;
  const wrong = shuffle(rng, family.filter(fine)).slice(0, n);
  return shuffle(rng, [right, ...wrong]);
}

// ---------- Real or Silly ----------

const sillyMet = (met: readonly PatternId[]) => (met.length ? met : (['cvc'] as PatternId[])).flatMap(p => SILLY[p].map(s => ({ s, p })));
const offByOne = (a: string, b: string) => a.length === b.length && [...a].filter((c, i) => c !== b[i]).length === 1;
const nothingAlike = (a: string, b: string) => a[0] !== b[0] && ![...a].some(c => b.includes(c) && /[aeiou]/.test(c));
export function sillyFor(level: Level, w: Word, met: readonly PatternId[]): string[] {
  const all = sillyMet(met), own = infoOf(w).pattern;
  if (level === 1) return all.filter(x => nothingAlike(x.s, w)).map(x => x.s);
  if (level === 2) return all.filter(x => x.p === own && x.s[0] !== w[0]).map(x => x.s);
  return all.filter(x => offByOne(x.s, w)).map(x => x.s);
}

// ---------- Read and Find ----------

export type Size = 'big' | 'little';
/** A picture: one thing (big, little or as it is), or two things side by side, one on the other, or one in the other. */
export interface Scene { a: Word; size?: Size; rel?: 'and' | 'on' | 'in'; b?: Word; see?: boolean }
export const sceneKey = (s: Scene) => [s.size ?? '', s.a, s.rel ?? '', s.b ?? ''].join(':');
/** The sentence a scene is read as. "A big pig." "I see a fox." "A cat on a bed." */
export function sentenceOf(s: Scene): string {
  const thing = `${s.size ? `${s.size} ` : ''}${s.a}`;
  if (s.see) return `I see a ${thing}.`;
  const start = `A ${thing}`;
  return s.rel ? `${start} ${s.rel} a ${s.b}.` : `${start}.`;
}
/** How many words a scene's sentence has. */
export const sentenceLength = (s: Scene) => sentenceOf(s).split(' ').length;
/** The words of a sentence that are on the list, for the met-Pattern rule. */
export const listWordsOf = (s: Scene): Word[] => [s.a, ...(s.b ? [s.b] : [])];

/** The words the sentence's scenes can use: pictured and met. */
const subjects = (met: readonly Word[]): Word[] => SUBJECTS.filter(w => met.includes(w));
const placesFor = (rel: 'on' | 'in', a: Word, met: readonly Word[]) => (rel === 'on' ? SURFACES : CONTAINERS).filter(w => met.includes(w) && w !== a && !pictureClash(w, a));
/** Two scenes that would look alike: the same, the same two things swapped side by side, or one thing swapped for a look-alike. */
function sceneClash(x: Scene, y: Scene) {
  if (sceneKey(x) === sceneKey(y)) return true;
  if (x.rel === 'and' && y.rel === 'and' && x.a === y.b && x.b === y.a) return true;
  if (x.rel !== y.rel || x.size !== y.size || !!x.see !== !!y.see) return false;
  return (x.a !== y.a && pictureClash(x.a, y.a)) || (!!x.b && !!y.b && x.b !== y.b && pictureClash(x.b, y.b));
}
/** How many words two sentences differ by, word for word. */
export function wordsApart(x: Scene, y: Scene): number {
  const a = sentenceOf(x).split(' '), b = sentenceOf(y).split(' ');
  if (a.length !== b.length) return Infinity;
  return a.filter((t, i) => t !== b[i]).length;
}

/** Every scene a sentence at this Level could be about, with w in it. */
export function scenesFor(level: Level, w: Word, met: readonly Word[]): Scene[] {
  const subs = subjects(met), out: Scene[] = [];
  if (level === 1) return subs.includes(w) ? [{ a: w, size: 'big' }, { a: w, size: 'little' }] : [];
  if (subs.includes(w)) {
    out.push({ a: w, see: true }, { a: w, see: true, size: 'big' }, { a: w, see: true, size: 'little' });
    for (const rel of ['on', 'in'] as const) for (const b of placesFor(rel, w, met)) out.push({ a: w, rel, b });
    for (const b of subs) if (b !== w && !pictureClash(b, w)) out.push({ a: w, rel: 'and', b });
  }
  for (const rel of ['on', 'in'] as const) {
    if (!(rel === 'on' ? SURFACES : CONTAINERS).includes(w) || !met.includes(w)) continue;
    for (const a of subs) if (a !== w && !pictureClash(a, w)) out.push({ a, rel, b: w });
  }
  return out;
}

/** Other scenes for the choices. L1: other things, very different. L2: other things, not one sound apart. L3: each one word off the
 *  sentence (big / little, on / in, or a thing swapped, one sound apart from it first). */
export function otherScenes(level: Level, s: Scene, met: readonly Word[], rng: Rng): Scene[] {
  const subs = subjects(met), out: Scene[] = [];
  const add = (c: Scene) => { if (out.length < 2 && ![s, ...out].some(o => sceneClash(o, c))) out.push(c); };
  if (level < 3) {
    for (const x of shuffle(rng, subs)) {
      if (x === s.a || x === s.b || pictureClash(x, s.a) || (s.b && pictureClash(x, s.b))) continue;
      if (level === 1 ? !veryDifferent(x, s.a) : oneSoundApart(x, s.a)) continue;
      add({ ...s, a: x });
    }
    return out;
  }
  const cands: Scene[] = [];
  if (s.size) cands.push({ ...s, size: s.size === 'big' ? 'little' : 'big' });
  if ((s.rel === 'on' || s.rel === 'in') && s.b && IN_OR_ON.includes(s.b)) cands.push({ ...s, rel: s.rel === 'on' ? 'in' : 'on' });
  const swaps = (w: Word, pool: readonly Word[]) =>
    shuffle(rng, pool.filter(x => x !== w && x !== s.a && x !== s.b)).sort((a, b) => Number(oneSoundApart(b, w)) - Number(oneSoundApart(a, w)) || shared(b, w) - shared(a, w));
  const aPool = s.rel === 'on' || s.rel === 'in' ? subs.filter(x => !pictureClash(x, s.b!)) : subs;
  const things = [...swaps(s.a, aPool).map(a => ({ ...s, a })), ...(s.b && s.rel ? swaps(s.b, s.rel === 'and' ? subs : placesFor(s.rel, s.a, met)).map(b => ({ ...s, b })) : [])];
  for (const c of [...shuffle(rng, cands), ...things]) if (wordsApart(c, s) === 1) add(c);
  return out;
}

// ---------- making a question ----------

/** A fixed order, so whether a question can be made doesn't depend on chance. */
const STEADY: Rng = () => 0.5;

/** Can this kind ask about w at this Level, with only the words he has met? (Worked out once for each, then remembered: a Round asks
 *  it of every word for every question.) */
const asked = new Map<string, boolean>();
export function canAsk(kind: Kind, level: Level, w: Word, met: readonly PatternId[]): boolean {
  const key = `${kind}|${level}|${w}|${met.join(',')}`;
  let can = asked.get(key);
  if (can === undefined) asked.set(key, can = canAskNow(kind, level, w, met));
  return can;
}
function canAskNow(kind: Kind, level: Level, w: Word, met: readonly PatternId[]): boolean {
  const words = metWords(met);
  if (!words.includes(w)) return false;
  switch (kind) {
    case 'read': return hasPicture(w) && wordsFor(level, w, words.filter(hasPicture), picClash);
    case 'hear': return wordsFor(level, w, words, hearClash);
    case 'swap': return swapSources(level, w, words).length > 0;
    case 'real': return sillyFor(level, w, met).length > 0;
    case 'sentence': return hasPicture(w) && scenesFor(level, w, words).some(sc => otherScenes(level, sc, words, STEADY).length === 2);
  }
}

/** A question of this kind and Level about w. canAsk(kind, level, w, met) must be true. */
export function makeQuestion(kind: Kind, level: Level, w: Word, met: readonly PatternId[], rng: Rng): Question {
  const words = metWords(met);
  switch (kind) {
    case 'read': return { kind, word: w, choices: shuffle(rng, [w, ...wrongWords(level, w, words.filter(hasPicture), rng, picClash)]) };
    case 'hear': return { kind, word: w, choices: shuffle(rng, [w, ...wrongWords(level, w, words, rng, hearClash)]) };
    case 'swap': {
      const from = pick(rng, swapSources(level, w, words)), box = diffBox(from, w);
      const old = infoOf(from).sounds[box]!, answer = infoOf(w).sounds[box]!;
      return { kind, word: w, from, box, answer, choices: swapTiles(level, old, answer, rng), marked: level === 1 };
    }
    case 'real': {
      const silly = pick(rng, sillyFor(level, w, met));
      return { kind, word: w, silly, choices: shuffle(rng, [w, silly]) };
    }
    case 'sentence': {
      // the first scene (in a random order) with two other pictures to offer; canAsk found one in the steady order, so try that last
      const all = scenesFor(level, w, words);
      for (const [order, r] of [[shuffle(rng, all), rng], [all, STEADY]] as const) {
        for (const sc of order) {
          const others = otherScenes(level, sc, words, r);
          if (others.length === 2) return { kind, word: latest(listWordsOf(sc)), scene: sc, choices: shuffle(rng, [sc, ...others]) };
        }
      }
      throw new Error(`Read and Find can't ask about ${w} at Level ${level}`);
    }
  }
}

const ORDER = ['cvc', 'digraph', 'blend', 'magic-e', 'team', 'r'];
/** The word from the latest Pattern. */
export const latest = (ws: readonly Word[]) => [...ws].sort((a, b) => ORDER.indexOf(infoOf(b).pattern) - ORDER.indexOf(infoOf(a).pattern))[0]!;

/** Is this the right answer? `more`: right so far (Sound Swap's sound to change). False: wrong. */
export function check(q: Question, answer: string): boolean | 'more' {
  switch (q.kind) {
    case 'read': case 'hear': case 'real': return answer === q.word;
    case 'swap': {
      const [box, tile] = answer.split('=');
      if (Number(box) !== q.box) return false;
      return tile === undefined ? 'more' : tile === q.answer;
    }
    case 'sentence': return answer === sceneKey(q.scene);
  }
}

/** The word a wrong answer was about, if it was a word on the list one sound from the right one: the lesson shows them stacked. */
export function nearMiss(q: Question, answer: string): Word | null {
  if (q.kind === 'swap') return answer.includes('=') || Number(answer) === q.box ? null : q.from;
  if (q.kind !== 'read' && q.kind !== 'hear') return null;
  const other = WORD_INFO.find(i => i.word === answer)?.word;
  return other && oneSoundApart(other, q.word) ? other : null;
}
