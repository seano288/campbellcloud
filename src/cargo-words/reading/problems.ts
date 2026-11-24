// The questions: six kinds, three Levels each, built from the word tables (words/). Each question has exactly one right answer (tested),
// and names the new syllable types its words use, so a question waits for that type's Meeting (mix.ts).
//
// - How Many Containers (count): how many beats. L1 a heard word of one or two beats, with its picture; L2 a heard word of one to three;
//   L3 a written word that is not spoken, one to four.
// - Load the Ship (build): hear a word, load its syllable containers in order. L1 two containers, exactly the ones needed; L2 three, and
//   one spare from another word; L3 two or three, with a spare that looks or sounds close (gar-den with gra).
// - Split It (split): a written two-beat word, tap where it breaks. L1 two small words joined, or twin letters (sun|set, rab|bit); L2 two
//   different letters in the middle (nap|kin); L3 one letter in the middle (ti|ger, cab|in), always said slowly so he hears the break.
// - Read It (read): a written long word, never spoken before he answers; tap its picture. L1 two beats, two pictures; L2 two beats with
//   vowel teams and bossy r, three pictures; L3 three beats or more, three pictures. The other pictures start with the same letter where
//   the table has one, so the first letter alone doesn't tell him.
// - Bossy R (r): Dino Dig already teaches ar, or, er, ir and ur in short words (its sixth Pattern), so the brief's Level 1 (card or cord)
//   is dropped and the rest move down. L1 hear a long word and fill its r container (g _ _ den: ar, or or er); L2 read a long word with a
//   bossy r and tap its picture; L3 hear a three-beat r word and load it, with a spare whose r says another sound (der and dar).
// - Add-Ons (addon): L1 un or re and a word are shown and said, tap the picture of the whole word; L2 "Which word means not happy?" with
//   three written words; L3 "Which word is hiding in careful?", then -er and -est read and matched to a picture (the longest ship).
import { int, pick, shuffle, type Rng } from '../../game/rng';
import type { Stretch } from '../../modes/progress';
import { ADD_ON_WORDS, COMPARE_BASES, partsOf, type AddOnWord, type CompareBase } from '../words/addons';
import { NEW_HERE, rSoundOf, rSpellingOf, typeOf, typesOf, type NewType } from '../words/sounds';
import { pictureClash, WORDS, wordOf, type LongWord } from '../words/words';

export const KINDS = ['count', 'build', 'split', 'read', 'r', 'addon'] as const;
export type Kind = (typeof KINDS)[number];
export type Level = 1 | 2 | 3;

interface Base { readonly kind: Kind; readonly level: Level; readonly word: string; readonly syls: readonly string[]; readonly needs: readonly NewType[] }
export interface CountQ extends Base { readonly kind: 'count'; readonly show: 'pic' | 'hear' | 'read'; readonly choices: readonly number[] }
export interface BuildQ extends Base { readonly kind: 'build' | 'r'; readonly form: 'build'; readonly boxes: readonly string[]; readonly spare: string | null }
export interface SplitQ extends Base { readonly kind: 'split'; readonly slow: boolean; readonly at: number; readonly why: SplitWhy }
export interface ReadQ extends Base { readonly kind: 'read' | 'r'; readonly form: 'read'; readonly choices: readonly string[] }
export interface GapQ extends Base { readonly kind: 'r'; readonly form: 'gap'; readonly gap: number; readonly choices: readonly string[]; readonly right: string }
export interface AddPicQ extends Base { readonly kind: 'addon'; readonly form: 'pic'; readonly add: AddOnWord; readonly choices: readonly string[] }
export interface AddMeansQ extends Base { readonly kind: 'addon'; readonly form: 'means'; readonly add: AddOnWord; readonly choices: readonly string[] }
export interface AddHideQ extends Base { readonly kind: 'addon'; readonly form: 'hide'; readonly add: AddOnWord; readonly choices: readonly string[] }
export interface AddCompareQ extends Base { readonly kind: 'addon'; readonly form: 'compare'; readonly add: AddOnWord; readonly base: CompareBase; readonly sizes: readonly number[]; readonly right: number }
export type Question = CountQ | (BuildQ & { kind: 'build' }) | SplitQ | (ReadQ & { kind: 'read' }) | (BuildQ & { kind: 'r' }) | (ReadQ & { kind: 'r' }) | GapQ | AddPicQ | AddMeansQ | AddHideQ | AddCompareQ;

/** Why a word breaks where it does: the short line the Split It lesson says. */
export type SplitWhy = 'compound' | 'twin' | 'two' | 'open' | 'closed' | 'vowels' | 'le';

// ---------- what the words use ----------

const isNew = (t: string | null): t is NewType => (NEW_HERE as readonly string[]).includes(t ?? '');
/** The new syllable types a word uses (open, le, y). */
export const needsOf = (syls: readonly string[]): NewType[] => [...new Set(typesOf(syls).filter(isNew))];
/** How far into the sounds a word goes: 1 closed and magic e only, 2 with vowel teams and bossy r, 3 with an open, -le or final y syllable. */
export function stageOf(w: LongWord): 1 | 2 | 3 {
  const t = typesOf(w.syls);
  if (t.some(isNew)) return 3;
  return t.some(x => x === 'team' || x === 'r') ? 2 : 1;
}
/** An add-on word's sounds: its base (as on the table, or as one syllable) and the add-on. */
export function addOnSyls(a: AddOnWord): string[] {
  const base = WORDS.find(w => w.word === a.base)?.syls ?? [a.base];
  return a.add === 'un' || a.add === 're' ? [a.add, ...base] : [...base, a.add];
}

// ---------- Split It: where a word breaks, and why ----------

/** How many letters come before the break. */
export const breakAt = (w: LongWord) => w.syls[0]!.length;
export function splitWhy(w: LongWord): SplitWhy {
  if (w.compound) return 'compound';
  const [a, b] = [w.syls[0]!, w.syls[1]!], x = a.at(-1)!, y = b[0]!;
  const vowel = (ch: string) => 'aeiou'.includes(ch);
  if (/^[bcdfgkpstz]le$/.test(b) && !vowel(x)) return x === y ? 'twin' : 'le';
  if (x === y) return 'twin';
  if (vowel(x) && vowel(y)) return 'vowels';
  if (vowel(x)) return 'open';
  if (vowel(y)) return 'closed';
  return 'two';
}
/** The longest word Split It asks. */
export const SPLIT_MOST = 7;
/** The Level a word is split at: twin letters and joined words first, then two different letters, then one letter (said slowly). */
export function splitLevel(w: LongWord): Level | null {
  // each letter is at least 44px wide so its cut is a whole tap target: seven letters fit a phone upright
  if (w.syls.length !== 2 || w.word.length > SPLIT_MOST) return null;
  const why = splitWhy(w);
  return why === 'compound' || why === 'twin' ? 1 : why === 'two' || why === 'le' ? 2 : 3;
}

// ---------- pools ----------

const two = WORDS.filter(w => w.syls.length === 2), three = WORDS.filter(w => w.syls.length === 3);
const pictured = WORDS.filter(w => w.pic && w.syls.length >= 2);
const rWords = WORDS.filter(w => w.syls.length >= 2 && w.syls.some(s => rSoundOf(s)) && !w.compound);
const atStage = (ws: readonly LongWord[], most: number) => ws.filter(w => stageOf(w) <= most);

// ---------- making a question ----------

export function makeQuestion(kind: Kind, level: Level, stretch: Stretch, rng: Rng): Question {
  switch (kind) {
    case 'count': return makeCount(level, stretch, rng);
    case 'build': return makeBuild(level, stretch, rng);
    case 'split': return makeSplit(level, stretch, rng);
    case 'read': return makeRead(level, stretch, rng);
    case 'r': return makeR(level, stretch, rng);
    case 'addon': return makeAddOn(level, stretch, rng);
  }
}

const base = (kind: Kind, level: Level, w: LongWord) => ({ kind, level, word: w.word, syls: w.syls, needs: needsOf(w.syls) });

function makeCount(level: Level, stretch: Stretch, rng: Rng): CountQ {
  const most = level === 1 ? 2 : level === 2 ? 3 : 4;
  // pick how many beats first, so short and long words come about as often as each other
  const beats = int(rng, 1, level === 3 && stretch === 0 ? 3 : most);
  // heard words up to Level 2's first stretch use sounds from Dino Dig only, so a new syllable type's Meeting doesn't come first thing
  const pool = WORDS.filter(w => w.syls.length === beats && (level !== 1 || w.pic) && (level === 3 || stageOf(w) <= (level === 1 || stretch === 0 ? 2 : 3)));
  const w = pick(rng, pool);
  return { ...base('count', level, w), kind: 'count', show: level === 1 ? 'pic' : level === 2 ? 'hear' : 'read', choices: level === 1 ? [1, 2, 3] : [1, 2, 3, 4] };
}

function makeBuild(level: Level, stretch: Stretch, rng: Rng): BuildQ & { kind: 'build' } {
  const pool = level === 1 ? atStage(two, stretch === 0 ? 1 : 2) : level === 2 ? atStage(three, stretch === 0 ? 2 : 3) : (stretch === 0 ? atStage(two, 3) : [...two, ...three]);
  const w = pick(rng, pool);
  const spare = level === 1 ? null : level === 2 ? otherSyllable(w, rng) : closeSpare(w, rng);
  return { ...base('build', level, w), kind: 'build', form: 'build', spare, boxes: shuffleNotInOrder(rng, [...w.syls, ...(spare ? [spare] : [])], w.syls) };
}

/** A syllable from another word that doesn't look like any of this word's. */
function otherSyllable(w: LongWord, rng: Rng): string {
  for (;;) {
    const o = pick(rng, pick(rng, two).syls);
    if (!w.syls.includes(o) && !w.syls.some(s => s[0] === o[0]) && !isRude(o)) return o;
  }
}

/** A spare that looks or sounds close to one of the word's syllables: two letters swapped (gar, gra), another vowel (den, din), b for d,
 *  or a bossy r that says another sound (der, dar). Never one of the word's own, never a whole word that would fit, never rude. */
export function closeSpare(w: LongWord, rng: Rng, rOnly = false): string {
  const options = new Set<string>();
  for (const s of w.syls) {
    const r = rSpellingOf(s);
    if (r && rSoundOf(s)) {
      const sound = rSoundOf(s)!;
      for (const other of ['ar', 'or', 'er'] as const) if (other !== sound) options.add(s.replace(r, other));
      continue;
    }
    if (rOnly) continue;
    // swap two letters next to each other around the vowel: gar -> gra, den -> dne is out (not sayable), so only before a vowel
    const v = s.search(/[aeiou]/);
    if (v > 0 && v < s.length - 1 && !'aeiou'.includes(s[v + 1]!)) options.add(s.slice(0, v) + s[v + 1] + s[v] + s.slice(v + 2));
    if (v >= 0 && v === s.length - 1 && v >= 2) options.add(s.slice(0, v - 1) + s[v] + s[v - 1]);
    // another short vowel
    if (v >= 0 && typeOf(s, false) === 'closed') for (const o of 'aeiou') if (o !== s[v]) options.add(s.slice(0, v) + o + s.slice(v + 1));
    // b and d, p and q look alike
    if (s.includes('b')) options.add(s.replace('b', 'd'));
    if (s.includes('d')) options.add(s.replace('d', 'b'));
  }
  const fine = [...options].filter(o => !w.syls.includes(o) && !isRude(o) && /[aeiou]/.test(o) && !wouldFit(w, o));
  return fine.length ? pick(rng, fine) : otherSyllable(w, rng);
}
/** The spare would make another word on the table if it took a syllable's place. */
function wouldFit(w: LongWord, spare: string) {
  return w.syls.some((_, i) => { const made = w.syls.map((s, j) => (j === i ? spare : s)).join(''); return WORDS.some(x => x.word === made); });
}

/** Shuffled, but never already in the right order (he has to load them). */
function shuffleNotInOrder(rng: Rng, boxes: readonly string[], right: readonly string[]): string[] {
  for (let k = 0; k < 20; k++) {
    const s = shuffle(rng, boxes);
    if (s.filter(b => right.includes(b)).join('|') !== right.join('|')) return s;
  }
  return [...boxes].reverse();
}

function makeSplit(level: Level, stretch: Stretch, rng: Rng): SplitQ {
  const pool = two.filter(w => splitLevel(w) === level && (level === 3 || stageOf(w) <= (stretch === 0 ? 2 : 3)));
  const w = pick(rng, pool);
  return { ...base('split', level, w), kind: 'split', slow: level === 3, at: breakAt(w), why: splitWhy(w) };
}

/** Pictured words to offer beside this one: never one that looks like it, and starting with the same letter where the table has one. */
export function picturesBeside(w: LongWord, n: number, rng: Rng, pool: readonly LongWord[] = pictured): string[] {
  const others = shuffle(rng, pool.filter(o => o.word !== w.word && o.pic && !pictureClash(o.word, w.word)));
  const out: string[] = [];
  const add = (o: LongWord) => { if (out.length < n && !out.includes(o.word) && !out.some(x => pictureClash(x, o.word))) out.push(o.word); };
  others.filter(o => o.word[0] === w.word[0]).forEach(add);
  others.forEach(add);
  return out;
}

function makeRead(level: Level, stretch: Stretch, rng: Rng): ReadQ & { kind: 'read' } {
  const pool = level === 1 ? atStage(pictured.filter(w => w.syls.length === 2), 1) : level === 2 ? atStage(pictured.filter(w => w.syls.length === 2), 2).filter(w => stretch === 0 || stageOf(w) === 2) : pictured.filter(w => w.syls.length >= 3);
  const w = pick(rng, pool);
  const n = level === 1 ? 1 : 2;
  return { ...base('read', level, w), kind: 'read', form: 'read', choices: shuffle(rng, [w.word, ...picturesBeside(w, n, rng, level === 3 ? pictured : pictured.filter(o => o.syls.length === 2))]) };
}

function makeR(level: Level, stretch: Stretch, rng: Rng): GapQ | (ReadQ & { kind: 'r' }) | (BuildQ & { kind: 'r' }) {
  if (level === 1) {
    const w = pick(rng, rWords.filter(x => x.syls.length === 2 && (stretch > 0 || stageOf(x) <= 2)));
    const gaps = w.syls.map((s, i) => (rSoundOf(s) ? i : -1)).filter(i => i >= 0);
    const gap = pick(rng, gaps), syl = w.syls[gap]!, right = rSpellingOf(syl)!, sound = rSoundOf(syl)!;
    // the three sounds, each spelt once: er, ir or ur only as the word spells it, since all three say the same
    const choices = (['ar', 'or', 'er'] as const).map(s => (s === sound ? right : s === 'er' ? 'er' : s));
    return { ...base('r', level, w), kind: 'r', form: 'gap', gap, right, choices };
  }
  if (level === 2) {
    const pool = rWords.filter(x => x.pic);
    const w = pick(rng, pool);
    return { ...base('r', level, w), kind: 'r', form: 'read', choices: shuffle(rng, [w.word, ...picturesBeside(w, 2, rng)]) };
  }
  const w = pick(rng, rWords.filter(x => x.syls.length >= (stretch === 0 ? 2 : 3)).filter(x => x.syls.length >= 3 || stretch === 0));
  const spare = closeSpare(w, rng, true);
  return { ...base('r', level, w), kind: 'r', form: 'build', spare, boxes: shuffleNotInOrder(rng, [...w.syls, spare], w.syls) };
}

function makeAddOn(level: Level, stretch: Stretch, rng: Rng): AddPicQ | AddMeansQ | AddHideQ | AddCompareQ {
  const at = (a: AddOnWord) => ({ kind: 'addon' as const, level, word: a.word, syls: partsOf(a), needs: needsOf(addOnSyls(a)), add: a });
  if (level === 1) {
    const a = pick(rng, ADD_ON_WORDS.filter(x => x.pic));
    const others = shuffle(rng, ADD_ON_WORDS.filter(x => x.pic && x !== a).flatMap(x => [x.pic!, ...(x.basePic ? [x.basePic] : [])]))
      .filter(p => p !== a.basePic && !PIC_ALIKE.some(g => g.includes(p) && g.includes(a.pic!)));
    const choices = [a.pic!, ...(a.basePic ? [a.basePic] : []), ...others].slice(0, 3);
    return { ...at(a), form: 'pic', choices: shuffle(rng, choices) };
  }
  if (level === 2) {
    const a = pick(rng, ADD_ON_WORDS.filter(x => stretch > 0 || x.add === 'un' || x.add === 're'));
    const sameBase = ADD_ON_WORDS.filter(x => x.base === a.base && x.word !== a.word && x.means !== a.means).map(x => x.word);
    const other = shuffle(rng, ADD_ON_WORDS.filter(x => x.base !== a.base && x.add !== a.add).map(x => x.word));
    const choices = [a.word, a.base, sameBase[0] ?? other[0]!];
    return { ...at(a), form: 'means', choices: shuffle(rng, choices) };
  }
  if (stretch === 0 || rng() < 0.4) {
    const a = pick(rng, ADD_ON_WORDS);
    return { ...at(a), form: 'hide', choices: shuffle(rng, [a.base, ...a.near]) };
  }
  const cmp = pick(rng, COMPARE_BASES), est = rng() < 0.5;
  const a = ADD_ON_WORDS.find(x => x.base === cmp && x.add === (est ? 'est' : 'er'))!;
  const n = est ? 3 : 2, sizes = shuffle(rng, [1, 2, 3].slice(0, n).map(s => (n === 2 ? s * 1.5 : s)));
  const small = cmp === 'short';
  const want = small ? Math.min(...sizes) : Math.max(...sizes);
  return { ...at(a), form: 'compare', base: cmp, sizes, right: sizes.indexOf(want) };
}
/** Pictures that look alike among the Add-Ons' (🔁 and 🔄): never side by side. (A locked and an open padlock are offered together on
 *  purpose: the base word's picture beside the whole word's.) */
export const PIC_ALIKE: readonly (readonly string[])[] = [['🔁', '🔄']];

// ---------- the right answer ----------

/** The answer as the view sends it: a number of beats, the syllables joined with bars, the letters before the break, a word, an r spelling,
 *  a picture or a choice's index. */
export function rightAnswer(q: Question): string {
  switch (q.kind) {
    case 'count': return String(q.syls.length);
    case 'build': return q.syls.join('|');
    case 'split': return String(q.at);
    case 'read': return q.word;
    case 'r': return q.form === 'gap' ? q.right : q.form === 'read' ? q.word : q.syls.join('|');
    case 'addon': return q.form === 'pic' ? q.add.pic! : q.form === 'means' ? q.word : q.form === 'hide' ? q.add.base : String(q.right);
  }
}
export const isRightAnswer = (q: Question, answer: string) => answer === rightAnswer(q);

/** Every answer the view could send, for the "exactly one right" test. */
export function allAnswers(q: Question): string[] {
  switch (q.kind) {
    case 'count': return q.choices.map(String);
    case 'split': return Array.from({ length: q.word.length - 1 }, (_, i) => String(i + 1));
    case 'build': return orders(q.boxes, q.syls.length);
    case 'read': return [...q.choices];
    case 'r': return q.form === 'build' ? orders(q.boxes, q.syls.length) : [...q.choices];
    case 'addon': return q.form === 'compare' ? q.sizes.map((_, i) => String(i)) : [...q.choices];
  }
}
/** Every way to load n of these containers in a row. */
function orders(boxes: readonly string[], n: number): string[] {
  const out: string[] = [];
  const go = (left: string[], got: string[]) => {
    if (got.length === n) { out.push(got.join('|')); return; }
    left.forEach((b, i) => go(left.filter((_, j) => j !== i), [...got, b]));
  };
  go([...boxes], []);
  return [...new Set(out)];
}

// ---------- kept clean ----------

/** Never on a container, alone or as a spare: rude, frightening or unkind. */
export const RUDE: readonly string[] = ['ass', 'butt', 'bum', 'poo', 'pee', 'wee', 'fart', 'crap', 'damn', 'hell', 'sex', 'tit', 'cock', 'dick', 'nob', 'pis', 'piss', 'die', 'dead', 'kill', 'gun', 'dum', 'dumb', 'gay', 'hoe', 'jap', 'wop', 'fag', 'cum', 'puke', 'barf', 'snot', 'turd', 'fatso', 'stab', 'war'];
/** Never inside a word or a container (grass and butter are fine, so "ass" and "butt" are only checked whole). */
export const RUDE_INSIDE: readonly string[] = ['fart', 'crap', 'damn', 'sex', 'piss', 'dick', 'cock', 'turd', 'fag', 'kill', 'dead', 'poo'];
export const isRude = (s: string) => RUDE.includes(s) || RUDE_INSIDE.some(r => s.includes(r));

export const wordInfo = (w: string) => wordOf(w);
