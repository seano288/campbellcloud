// The questions, one maker per kind and Level. A question only uses letters from Families he has met (the letter, every choice, every
// letter of a word). The tap kinds (Where to Start, Which Way, Tall Small Tail) always have exactly one right choice; the writing kinds
// (Trace It, Write It, Write a Word) are answered by the stroke checker (letters/check.ts), one stroke at a time.
//
//   Trace It        L1 dotted letter, start dot and arrow, a wide lane; L2 dotted letter and start dot, a narrower lane; L3 the lines
//                   and a faint letter that fades as he starts, the narrowest lane.
//   Where to Start  L1 three dots on the letter: tap where it starts; L2 the start dot and three arrows: which way does it go first?;
//                   L3 every stroke of the letter: tap the one that comes second.
//   Which Way       L1 hear a letter, tap it or its mirror image; L2 from four (b d p q, or the letter turned four ways); L3 a short word with
//                   one letter backwards: tap it.
//   Tall Small Tail L1 one letter: tall, small or tail?; L2 which of three writings of a word sits on the line the right way?; L3 tap the
//                   letter that floats or sinks.
//   Write It        L1 hear a lowercase letter, see it for a second, write it on empty lines; L2 no flash; L3 capitals and numbers too,
//                   and numbers 10 to 20 in two boxes.
//   Write a Word    a three-letter word, one box per letter: L1 shown above; L2 shown, then hidden; L3 only said.
import { int, pick, shuffle, type Rng } from '../../game/rng';
import { wordsIn } from '../../dino-dig/words/list';
import type { ModeId } from '../learning';
import { BDPQ, distinctTurns, FLIP_MAKES_A_WORD, glyphKey, isBdpq, mirrorDiffers, turnedBdpq, type Glyph } from '../letters/glyphs';
import { endOf, FAMILIES, FAMILY_IDS, firstWay, letter, metLetters, startOf, type FamilyId, type Letter, type Pt, type Size, type Stroke } from '../letters/strokes';

export type Level = 1 | 2 | 3;
export type Kind = ModeId;

export interface TraceQ { readonly kind: 'trace'; readonly ch: string }
export interface StartQ {
  readonly kind: 'start'; readonly ch: string; readonly step: 'dot' | 'way' | 'second';
  /** Level 1: the dots on the letter; Level 2: the arrows' directions (unit vectors, y down). */
  readonly dots?: readonly Pt[]; readonly arrows?: readonly Pt[];
  readonly choices: readonly string[]; readonly answer: string;
}
export interface FlipQ {
  readonly kind: 'flip'; readonly ch: string; readonly step: 'two' | 'four' | 'word';
  readonly glyphs?: readonly Glyph[]; readonly word?: string; readonly at?: number;
  readonly choices: readonly string[]; readonly answer: string;
}
/** One letter of a word as drawn on the lines: moved up (negative) or down by dy. */
export interface Placed { readonly ch: string; readonly dy: number }
export interface SizeQ {
  readonly kind: 'size'; readonly ch: string; readonly step: 'sort' | 'line' | 'odd';
  readonly word?: string; readonly rows?: readonly (readonly Placed[])[];
  readonly choices: readonly string[]; readonly answer: string;
}
export interface WriteQ { readonly kind: 'write'; readonly ch: string; readonly text: string; readonly flash: boolean }
export interface WordQ { readonly kind: 'word'; readonly ch: string; readonly word: string; readonly show: 'shown' | 'flash' | 'said' }
export interface MeetQ { readonly kind: 'meet'; readonly family: FamilyId }
export type Question = TraceQ | StartQ | FlipQ | SizeQ | WriteQ | WordQ;

/** What a writing question is written as: one box per character. */
export const boxesOf = (q: TraceQ | WriteQ | WordQ): string[] => [...(q.kind === 'trace' ? q.ch : q.kind === 'write' ? q.text : q.word)];
export const isWriting = (q: Question): q is TraceQ | WriteQ | WordQ => q.kind === 'trace' || q.kind === 'write' || q.kind === 'word';

/** The Family a question is about (its strength goes up or down): a word's newest letter's. */
export function familyOf(q: Question): FamilyId {
  const chars = q.kind === 'word' ? [...q.word] : q.kind === 'flip' && q.word ? [...q.word] : q.kind === 'size' && q.word ? [...q.word] : q.kind === 'write' ? [...q.text] : [q.ch];
  return chars.map(c => letter(c).family).sort((a, b) => FAMILY_IDS.indexOf(b) - FAMILY_IDS.indexOf(a))[0]!;
}

// ---------- what can be asked ----------

/** Three-letter short-vowel words: Dino Dig's short-vowel (cvc) words, written out here so each can be a recorded phrase
 *  (problems.test.ts checks they are exactly that list). */
export const WORDS = [
  'cat', 'bat', 'hat', 'map', 'van', 'cap', 'can', 'pan', 'rat', 'bag', 'ram', 'bed', 'hen', 'pen', 'ten', 'net', 'web', 'leg', 'jet', 'pig', 'lip', 'pin',
  'dig', 'kid', 'big', 'sit', 'dog', 'fox', 'box', 'pot', 'mop', 'log', 'fog', 'bug', 'cup', 'bus', 'mud', 'hug', 'nut', 'tub', 'cub', 'run', 'hut',
] as const;
export type ShortWord = (typeof WORDS)[number];
export const DINO_SHORT_WORDS = (): string[] => wordsIn('cvc');
const isMet = (ch: string, met: readonly string[]) => met.includes(ch);
export const wordsMet = (met: readonly string[]): string[] => WORDS.filter(w => [...w].every(c => isMet(c, met)));

const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);
/** Dots for Where to Start that are plainly not where any stroke starts: stroke ends, middles and turning points. */
export function wrongDots(L: Letter): Pt[] {
  const starts = L.strokes.map(startOf), out: Pt[] = [];
  const candidates = L.strokes.filter(s => !s.dot).flatMap(s => [endOf(s), s.pts[Math.floor(s.pts.length / 2)]!, s.pts[Math.floor(s.pts.length / 4)]!, s.pts[Math.floor((s.pts.length * 3) / 4)]!]);
  for (const c of candidates) if (starts.every(s => dist(s, c) >= 0.6) && out.every(o => dist(o, c) >= 0.55)) out.push(c);
  return out;
}
/** Can each stroke be told apart by a tap (a piece of it well away from the others)? */
export function tappable(L: Letter): boolean {
  if (L.strokes.length < 2) return false;
  return L.strokes.every((s, k) => s.pts.some(p => L.strokes.every((o, j) => j === k || o.pts.every(q => dist(p, q) >= 0.25))));
}
/** Which stroke a tap at this point (in letter units) means, or null. */
export function strokeAt(L: Letter, p: Pt, reach = 0.6): number | null {
  let best: { k: number; d: number } | null = null;
  for (const [k, s] of L.strokes.entries()) for (const q of s.pts) { const d = dist(p, q); if (!best || d < best.d) best = { k, d }; }
  return best && best.d <= reach ? best.k : null;
}
/** Where to Start's arrows for a letter: the way it goes first, and the opposite way and a quarter turn, which are plainly not. */
export function arrowsFor(L: Letter): Pt[] {
  const [x, y] = firstWay(L.strokes[0]!);
  return [[x, y], [-x, -y], [-y, x], [y, -x]];
}
/** A flipped letter in a word that would read as another real word. */
const flipMakesWord = (word: string, at: number) => FLIP_MAKES_A_WORD.includes(`${word}:${at}`);
/** The places in a word where a letter can be shown backwards. */
export const flipSpots = (word: string, met?: readonly string[]) => [...word].map((_, i) => i).filter(i => mirrorDiffers(word[i]!) && !flipMakesWord(word, i) && partnerMet(word[i]!, met));
/** b mirrored is d: so b is only shown backwards once he has met d (and so on). */
const partnerMet = (ch: string, met?: readonly string[]) => !met || !isBdpq(ch) || met.includes(turnedBdpq(ch, 'm'));
/** Letters Which Way can ask from four. */
const fourWays = (ch: string, met: readonly string[]) => (isBdpq(ch) ? BDPQ.every(c => isMet(c, met)) : distinctTurns(ch).length >= 3);

/** The letters a kind can ask at a Level, from the Families he has met. */
export function poolFor(kind: Kind, level: Level, families: readonly FamilyId[]): string[] {
  const met = metLetters(families), lower = met.filter(c => letter(c).kind === 'lower');
  switch (kind) {
    case 'trace': return met;
    case 'start': return level === 1 ? met.filter(c => wrongDots(letter(c)).length >= 2) : level === 2 ? met : met.filter(c => tappable(letter(c)));
    case 'flip': return level === 1 ? met.filter(c => mirrorDiffers(c) && partnerMet(c, met)) : level === 2 ? met.filter(c => fourWays(c, met)) : wordsMet(met).filter(w => flipSpots(w, met).length).map(w => w[0]!);
    case 'size': return level === 1 ? lower.filter(c => c !== 't') : lower.length >= 3 ? lower : [];
    case 'write': return level < 3 ? (lower.length ? lower : met) : met;
    case 'word': return wordsMet(met).map(w => w[0]!);
  }
}
export const canAsk = (kind: Kind, level: Level, families: readonly FamilyId[]) => poolFor(kind, level, families).length > 0;

// ---------- making a question ----------

/** `ch`: a letter from poolFor (for word kinds the pick is redone here among the words he can read). */
export function makeQuestion(kind: Kind, level: Level, ch: string, families: readonly FamilyId[], rng: Rng): Question {
  const met = metLetters(families), L = letter(ch);
  switch (kind) {
    case 'trace': return { kind, ch };
    case 'start': {
      if (level === 1) {
        const dots = shuffle(rng, [startOf(L.strokes[0]!), ...shuffle(rng, wrongDots(L)).slice(0, 2)]);
        const answer = String(dots.findIndex(d => d === startOf(L.strokes[0]!)));
        return { kind, ch, step: 'dot', dots, choices: dots.map((_, i) => String(i)), answer };
      }
      if (level === 2) {
        const all = arrowsFor(L), arrows = shuffle(rng, [all[0]!, all[1]!, all[int(rng, 2, 3)]!]);
        return { kind, ch, step: 'way', arrows, choices: arrows.map((_, i) => String(i)), answer: String(arrows.indexOf(all[0]!)) };
      }
      return { kind, ch, step: 'second', choices: L.strokes.map((_, i) => String(i)), answer: '1' };
    }
    case 'flip': {
      if (level === 3) {
        const ws = wordsMet(met).filter(w => flipSpots(w, met).length), mine = ws.filter(w => w[0] === ch);
        const word = pick(rng, mine.length ? mine : ws), at = pick(rng, flipSpots(word, met));
        return { kind, ch: word[at]!, step: 'word', word, at, choices: [...word].map((_, i) => String(i)), answer: String(at) };
      }
      const glyphs: Glyph[] = isBdpq(ch)
        ? (level === 1 ? [{ ch, turn: 'id' }, { ch: turnedBdpq(ch, 'm'), turn: 'id' }] : BDPQ.map(c => ({ ch: c, turn: 'id' as const })))
        : level === 1 ? [{ ch, turn: 'id' }, { ch, turn: 'm' }] : distinctTurns(ch).slice(0, 4).map(turn => ({ ch, turn }));
      const shown = shuffle(rng, glyphs);
      return { kind, ch, step: level === 1 ? 'two' : 'four', glyphs: shown, choices: shown.map(glyphKey), answer: glyphKey({ ch, turn: 'id' }) };
    }
    case 'size': {
      if (level === 1) return { kind, ch, step: 'sort', choices: ['tall', 'small', 'tail'], answer: L.size! };
      const words = wordsMet(met), lower = met.filter(c => letter(c).kind === 'lower');
      const word = words.length ? pick(rng, words) : shuffle(rng, lower).slice(0, 3).join('');
      const placed = (moved: number, dy: number): Placed[] => [...word].map((c, i) => ({ ch: c, dy: i === moved ? dy : 0 }));
      if (level === 2) {
        const [a, b] = shuffle(rng, [0, 1, 2]) as [number, number];
        const rows = shuffle(rng, [placed(-1, 0), placed(a, -0.55), placed(b, 0.5)]);
        return { kind, ch: word[0]!, step: 'line', word, rows, choices: ['0', '1', '2'], answer: String(rows.findIndex(r => r.every(p => p.dy === 0))) };
      }
      const at = int(rng, 0, word.length - 1), row = placed(at, rng() < 0.5 ? -0.55 : 0.5);
      return { kind, ch: word[at]!, step: 'odd', word, rows: [row], choices: [...word].map((_, i) => String(i)), answer: String(at) };
    }
    case 'write': {
      if (level === 3 && met.includes('9') && rng() < 0.25) { const n = int(rng, 10, 20); return { kind, ch: String(n)[0]!, text: String(n), flash: false }; }
      return { kind, ch, text: ch, flash: level === 1 };
    }
    case 'word': {
      const ws = wordsMet(met), mine = ws.filter(w => w[0] === ch), word = pick(rng, mine.length ? mine : ws);
      return { kind, ch: word[0]!, word, show: level === 1 ? 'shown' : level === 2 ? 'flash' : 'said' };
    }
  }
}

// ---------- answers ----------

/** Writing questions report "done" when the last stroke of the last box is drawn, "more" for each stroke before, "miss:..." for a
 *  wrong start or way. Tap questions report the choice. */
export function check(q: Question, answer: string): boolean | 'more' {
  if (isWriting(q)) return answer === 'done' ? true : answer === 'more' ? 'more' : false;
  return answer === q.answer;
}

/** The size words. */
export const SIZE_NAMES: Record<Size, string> = { tall: 'Tall', small: 'Small', tail: 'Tail' };
export type { Stroke };
export { FAMILIES };
