// What Word Wreckers needs to know about a word from the shared list (src/dino-dig/words/list.ts, read only): its sound boxes and
// the letters in each, which Patterns it uses, how it splits into chunks, and the wrong spellings a first grader might write.
//
// A wrong spelling is only ever shown if it is not a real word (REAL_WORDS, checked against a dictionary when the list was made, and
// by a test wherever a dictionary is installed) and nothing rude can be read in it (RUDE). So "Which looks right?" never offers a real
// word as a wrong answer, and Fix It never shows one as the mistake.
import { DIGRAPHS, infoOf, isVowelSound, R_VOWELS, sameSound, spell, TEAMS, WORD_INFO, type PatternId, type Word, type WordInfo } from '../../dino-dig/words/list';
import { REAL_WORDS } from './real';

export { spell };

/** A sound box: its spelling, and which letters of the written word it fills (a magic-e box fills its vowel and the final e). */
export interface SoundBox { readonly spelling: string; readonly letters: readonly number[] }

/** The word's sound boxes, in order. */
export function boxesOf(sounds: readonly string[]): SoundBox[] {
  const total = spell(sounds).length;
  let at = 0;
  return sounds.map(s => {
    if (s.endsWith('_e')) { const v = s.length - 2, letters = [...Array.from({ length: v }, (_, i) => at + i), total - 1]; at += v; return { spelling: s, letters }; }
    const letters = Array.from({ length: s.length }, (_, i) => at + i);
    at += s.length;
    return { spelling: s, letters };
  });
}

/** The letters a box shows: "a_e" shows "a" (its e sits at the end of the word). */
export const shown = (spelling: string) => (spelling.endsWith('_e') ? spelling.slice(0, -2) : spelling);
/** How a spelling is written on a chunk tile: "a_e" as "a‿e". */
export const tileText = (spelling: string) => (spelling.endsWith('_e') ? `${spelling.slice(0, -2)}_e` : spelling);

// ---------- which Patterns a word uses ----------

/** Every Pattern the word uses. Its own Pattern on the list must be the latest of these. */
export function patternsIn(sounds: readonly string[]): PatternId[] {
  const out = new Set<PatternId>(['cvc']);
  const consonant = (s: string) => !isVowelSound(s);
  sounds.forEach((s, i) => {
    if ((DIGRAPHS as readonly string[]).includes(s)) out.add('digraph');
    if (s.endsWith('_e')) out.add('magic-e');
    if ((TEAMS as readonly string[]).includes(s)) out.add('team');
    if ((R_VOWELS as readonly string[]).includes(s)) out.add('r');
    if (i > 0 && consonant(s) && consonant(sounds[i - 1]!)) out.add('blend');
  });
  return [...out];
}

// ---------- chunks ----------

/** The word in two chunks: everything before the vowel, and the vowel and the rest (sh + ip, tr + ain, c + ake). Null with no onset. */
export function onsetRime(info: Pick<WordInfo, 'sounds'>): [string, string] | null {
  const v = info.sounds.findIndex(isVowelSound);
  if (v <= 0) return null;
  return [info.sounds.slice(0, v).join(''), spell(info.sounds.slice(v))];
}
/** Has a sound spelled with more than one letter (sh, ck, ee, a_e, ar): what Chunks is about. */
export const hasChunk = (info: Pick<WordInfo, 'sounds'>) => info.sounds.some(s => s.length > 1);

// ---------- wrong spellings ----------

/** Short letter runs that must never show up in a wrong spelling, so nothing rude can be read in one. */
export const RUDE: readonly string[] = ['fuk', 'fuc', 'phuk', 'shit', 'sht', 'dik', 'dic', 'cok', 'coc', 'kok', 'ass', 'tit', 'cum', 'fag', 'gay', 'sex', 'poo', 'pee', 'pis', 'piss', 'butt', 'bum', 'crap', 'damn', 'hell', 'nob', 'pube', 'turd', 'slut', 'whor', 'hore'];
export const isRude = (s: string) => RUDE.some(r => s.includes(r));
/** Fine to show as a wrong spelling: not a real word, nothing rude in it, and not a word on the list. */
export const showable = (s: string, right: string) => s !== right && !REAL_WORDS.has(s) && !isRude(s) && !(WORD_INFO.some(i => i.word === s));

const SHORT = /^[aeiou]$/;
/** The other ways to spell this sound at this place in the word, the way a child sounding it out might. */
function respellings(sounds: readonly string[], i: number): string[] {
  const s = sounds[i]!, last = i === sounds.length - 1, w = spell(sounds), end = boxesOf(sounds)[i]!.letters.at(-1)!;
  // the letter written after this sound (cake's k is followed by its magic e), and whether this sound is the word's last letter
  const after = s.endsWith('_e') ? '' : w[end + 1] ?? '', lastLetter = !s.endsWith('_e') && end === w.length - 1;
  const prevShort = i > 0 && SHORT.test(sounds[i - 1]!);
  let alts = sameSound(s).filter(a => a !== s);
  // the k sound: k for c anywhere (kat, krab); c for k only where c still says k (not before e, i or y); ck only at the end (milck)
  if (s === 'c') alts = ['k'];
  if (s === 'k') alts = [...(/[eiy]/.test(after) ? [] : ['c']), ...(lastLetter ? ['ck'] : [])];
  if (s === 'ck') alts = ['k', 'c'];
  if (['l', 's', 'f', 'll', 'ss', 'ff'].includes(s) && !last) alts = [];
  if (['l', 's', 'f'].includes(s) && !prevShort) alts = [];
  if (s === 'w') alts = []; // "whet" for "wet" isn't how a child spells it
  if (last) alts = alts.filter(a => !a.endsWith('_e'));
  const extra: Record<string, string[]> = { i_e: ['y_e'], u_e: ['oo', 'ew'], ch: prevShort ? ['tch'] : [], x: ['ks', 'cks'], ee: last ? [] : ['e_e'], ea: last ? [] : ['e_e'] };
  return [...alts, ...(extra[s] ?? [])];
}

export type Mistake =
  /** One sound spelled another way (kat for cat, rane for rain), or with a letter that looks or sounds alike (bog for dog). */
  | { kind: 'swap'; box: number; wrong: string; right: string; text: string; sameSound: boolean }
  /** A letter left out (bik for bike, jup for jump): `at` is where it goes in the wrong spelling. */
  | { kind: 'drop'; at: number; letter: string; text: string }
  /** A letter too many (catt, froge): `at` is the extra letter in the wrong spelling. */
  | { kind: 'add'; at: number; text: string };

/** Letters a child mixes up, by look or by sound, for a one-letter mistake of the other kind. */
export const LOOKALIKE: Readonly<Record<string, readonly string[]>> = { b: ['d'], d: ['b'], m: ['n'], n: ['m'], e: ['i'], i: ['e'], a: ['u'], u: ['a'], o: ['u'], c: ['k'], k: ['c'], p: ['b'], g: ['j'] };

const withBox = (sounds: readonly string[], i: number, spelling: string) => spell(sounds.map((s, j) => (j === i ? spelling : s)));

/** Spellings that sound right but aren't the way it's written (kat, rane, rayn, byke): the best wrong answers. */
export function respelled(w: Word): Extract<Mistake, { kind: 'swap' }>[] {
  const { sounds } = infoOf(w), out: Extract<Mistake, { kind: 'swap' }>[] = [];
  sounds.forEach((s, i) => { for (const a of respellings(sounds, i)) out.push({ kind: 'swap', box: i, wrong: a, right: s, text: withBox(sounds, i, a), sameSound: true }); });
  return dedupe(out.filter(m => showable(m.text, w)));
}

/** One letter swapped for one that looks or sounds alike (dig for big is a real word, so not that; pog for pig). */
export function confused(w: Word): Extract<Mistake, { kind: 'swap' }>[] {
  const { sounds } = infoOf(w), out: Extract<Mistake, { kind: 'swap' }>[] = [];
  sounds.forEach((s, i) => { for (const a of LOOKALIKE[s] ?? []) if (!sameSound(s).includes(a)) out.push({ kind: 'swap', box: i, wrong: a, right: s, text: withBox(sounds, i, a), sameSound: false }); });
  return dedupe(out.filter(m => showable(m.text, w)));
}

/** A letter left out: the magic e, a letter of a blend, a team or a digraph. Only if what's left still has a vowel. */
export function dropped(w: Word): Extract<Mistake, { kind: 'drop' }>[] {
  const out: Extract<Mistake, { kind: 'drop' }>[] = [];
  for (let j = 0; j < w.length; j++) {
    const text = w.slice(0, j) + w.slice(j + 1);
    if (/[aeiouy]/.test(text)) out.push({ kind: 'drop', at: j, letter: w[j]!, text });
  }
  return dedupe(out.filter(m => showable(m.text, w)));
}

/** A letter too many: the last consonant doubled (catt, shipp), or an e tacked on the end of a word without a magic e (frogge is not one). */
export function added(w: Word): Extract<Mistake, { kind: 'add' }>[] {
  const { sounds } = infoOf(w), out: Extract<Mistake, { kind: 'add' }>[] = [];
  const last = w.at(-1)!, magic = sounds.some(s => s.endsWith('_e'));
  if (!/[aeiouy]/.test(last) && !magic && !/(.)\1$/.test(w) && !w.endsWith('ck') && !w.endsWith('x')) out.push({ kind: 'add', at: w.length, text: w + last });
  if (!magic && !/[aeiouy]/.test(last)) out.push({ kind: 'add', at: w.length, text: `${w}e` });
  return dedupe(out.filter(m => showable(m.text, w)));
}

function dedupe<M extends Mistake>(ms: M[]): M[] {
  const seen = new Set<string>();
  return ms.filter(m => (seen.has(m.text) ? false : (seen.add(m.text), true)));
}

/** Wrong spellings for "Which looks right?", best first: ones that sound right, then a missing magic e, then a doubled last letter. */
export function pickWrongs(w: Word): string[] {
  const magicDrop = dropped(w).filter(m => m.letter === 'e' && m.at === w.length - 1 && infoOf(w).sounds.some(s => s.endsWith('_e')));
  return [...new Set([...respelled(w).map(m => m.text), ...magicDrop.map(m => m.text), ...added(w).filter(m => m.text.at(-1) !== 'e').map(m => m.text)])];
}

/** Every wrong spelling the game could ever show, for the tests and the dictionary check. */
export const allWrongSpellings = (w: Word) => [...new Set([...respelled(w), ...confused(w), ...dropped(w), ...added(w)].map(m => m.text).concat(pickWrongs(w)))];
