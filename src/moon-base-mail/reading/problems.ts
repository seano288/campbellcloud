// A question made from a letter: which letter, which of its questions, and the choices in the order he sees them. Letters are picked so
// that one is not asked again until at least twenty others have been (LETTER_GAP), and never with the same question twice running.
import { pick, shuffle, type Rng } from '../../game/rng';
import { ORDER_SEP, passageById, passagesOf, type Kind, type Level, type Passage, type Question } from '../mail/index';
import { baseWordsIn } from '../mail/words';
import { picOf } from '../mail/pictures';

/** The head of every letter (not of a Fact File report): "Commander" is a base word, so he meets it before he sees it. */
export const LETTER_TO = 'To the Commander';
import { LETTER_GAP, type MeetingId } from '../learning';

export interface MailQ {
  readonly kind: Kind;
  readonly level: Level;
  /** The letter, and which of its questions. */
  readonly pid: string;
  readonly qi: number;
  /** The choices in the order shown (picture keys, words, part names, sentence numbers); for an order question, what he taps. */
  readonly choices: readonly string[];
  /** The sentences in the order shown: mixed up for What Came Next at Levels 2 and 3, else as written. */
  readonly shown: readonly number[];
}

export const letterOf = (q: Pick<MailQ, 'pid'>): Passage => passageById(q.pid)!;
export const questionOf = (q: Pick<MailQ, 'pid' | 'qi'>): Question => letterOf(q).qs[q.qi]!;

/** The letter to ask: not one of the last twenty asked (nor one already in this Round), or, if every one is, the one asked longest ago. */
export function pickLetter(pool: readonly Passage[], recent: readonly string[], rng: Rng, avoid: ReadonlySet<string> = new Set(), met?: readonly MeetingId[]): Passage {
  const blocked = new Set(recent.slice(-LETTER_GAP));
  const free = pool.filter(p => !blocked.has(p.id) && !avoid.has(p.id));
  // while he is still meeting the base words, a letter that needs at most one new group first, so a Round isn't all Meetings
  const easy = met ? free.filter(p => groupsOf(p).filter(g => !met.includes(g)).length <= 1) : [];
  if (easy.length) return pick(rng, easy);
  if (free.length) return pick(rng, free);
  const age = (id: string) => recent.lastIndexOf(id);
  return [...pool].filter(p => !avoid.has(p.id)).sort((a, b) => age(a.id) - age(b.id))[0] ?? pick(rng, pool);
}
/** Which of its questions: never the one it was asked last time. */
export function pickQuestion(p: Passage, last: number | undefined, rng: Rng): number {
  const all = p.qs.map((_, i) => i), others = all.filter(i => i !== last);
  return pick(rng, others.length ? others : all);
}

export function makeQuestion(kind: Kind, level: Level, rng: Rng, history: { recent: readonly string[]; lastQ: Readonly<Record<string, number>>; met?: readonly MeetingId[] }, avoid: ReadonlySet<string> = new Set()): MailQ {
  const p = pickLetter(passagesOf(kind, level), history.recent, rng, avoid, history.met);
  return questionFor(p, pickQuestion(p, history.lastQ[p.id], rng), rng);
}

export function questionFor(p: Passage, qi: number, rng: Rng): MailQ {
  const q = p.qs[qi]!, n = p.lines.length, inOrder = Array.from({ length: n }, (_, i) => i);
  let shown = inOrder;
  if (p.kind === 'order' && !p.pics) {
    // mixed up, and never by chance in the right order
    do shown = shuffle(rng, inOrder); while (shown.every((v, i) => v === i));
  }
  let choices: string[];
  if (q.form === 'order') {
    // the pictures to tap (Level 1, by their sentence number), or the sentences as shown
    let pics = inOrder;
    if (p.pics) do pics = shuffle(rng, inOrder); while (pics.every((v, i) => v === i));
    choices = (p.pics ? pics : shown).map(String);
  } else if (q.form === 'line') choices = shown.map(String).filter(i => [q.right, ...q.wrong].includes(i));
  else if (q.form === 'yn') choices = ['yes', 'no', 'not in the report'];
  else if (q.form === 'label') choices = [q.right, ...q.wrong];
  else choices = shuffle(rng, [q.right, ...q.wrong]);
  return { kind: p.kind, level: p.level, pid: p.id, qi, choices, shown };
}

/** The right answer, as the view gives it: an order question's answer is the sentence numbers in order. */
export const rightAnswer = (q: MailQ) => questionOf(q).right;
export function isAnswer(q: MailQ, answer: string): boolean {
  if (questionOf(q).form === 'order') return answer.split(ORDER_SEP).sort().join() === q.choices.map(String).sort().join();
  return q.choices.includes(answer);
}
export const isRightAnswer = (q: MailQ, answer: string) => answer === rightAnswer(q);

/** Everything he reads in this question, for its Meeting: the letter and who it is to and from ("To the Commander", "from Kit"), the
 *  written answers, labels and "Does the report say this?" choices ("not in the report"), the statement, and the names under pictures. */
export function textOf(q: MailQ): string[] {
  const p = letterOf(q), qq = questionOf(q);
  const written = qq.form === 'words' || qq.form === 'label' ? [qq.right, ...qq.wrong] : qq.form === 'yn' ? [...q.choices] : [];
  const named = qq.form === 'pic' ? [qq.right, ...qq.wrong].map(k => picOf(k).name ?? '') : p.pics ? p.pics.map(k => picOf(k).name ?? '') : [];
  return [...p.lines, ...(p.from === 'Base' ? [] : [p.from, LETTER_TO]), ...written, ...(qq.says ? [qq.says] : []), ...named];
}
/** The base-word groups this question needs met first. */
export const needs = (q: MailQ): MeetingId[] => [...new Set(textOf(q).flatMap(t => baseWordsIn(t).map(b => `g${b.group}` as MeetingId)))].sort();

/** The base-word groups a letter's own words need (its questions may add a few). */
export const groupsOf = (p: Passage): MeetingId[] =>
  [...new Set([...p.lines, ...(p.from === 'Base' ? [] : [p.from, LETTER_TO])].flatMap(t => baseWordsIn(t).map(b => `g${b.group}` as MeetingId)))];
