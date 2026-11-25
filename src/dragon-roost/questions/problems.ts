// Every question Dragon Roost asks, made from the word tables (words/). Each has exactly one right answer (problems.test.ts makes
// thousands and checks), shows only words he can read, and is about one word or one sentence: its topic, which is not asked again until
// twenty others have been (`recent`).
//
// | Kind     | Level 1                              | Level 2                                  | Level 3                                         |
// | Nouns    | which word names something           | tap the noun in a sentence               | person, animal, place or thing                  |
// | Verbs    | which word is something you do       | tap the verb in a sentence               | the doing word that fits who does it            |
// | Adjectives | which word tells what it is like   | tap the adjective in a sentence          | two dragons: which sentence tells about this one |
// | More Than One | which word means more than one X | one or more than one, in a sentence      | the words that don't change, mixed in           |
// | Yesterday | Yesterday: jumped, jump or jumps    | the ones that change (ran, flew, ate)    | yesterday or tomorrow picks the form            |
// | Squeeze  | which two words made don't           | the short way to say is not; where the apostrophe goes | won't, I'll, we're in a sentence  |
// | Big Letters | a name to fix                      | a day or a month to fix                  | two to fix, one a place                         |
import { int, pick, shuffle, type Rng } from '../../game/rng';
import type { ModeId } from '../learning';
import { CATS, oneJob, SORTABLE, type Cat } from '../words/lexicon';
import { forAdj, forCapital, forNoun, forVerb, isNoun, SENTENCES, toFix, type Role, type Sentence } from '../words/sentences';
import {
  apostropheAt, CHANGING, gapped, LOOKS, PAST_FRAMES_1, PAST_FRAMES_2, PLURAL_FRAMES, PLURAL_FRAMES_3, SQUEEZE_SENTENCES, SQUEEZES, TIME_FRAMES, VERB_FRAMES,
  type Frame, type Look,
} from '../words/frames';
import { TERMS } from '../words/terms';

export type Kind = ModeId;
export type Level = 1 | 2 | 3;

export const ASK = {
  noun1: 'Which word names something?', verb1: 'Which word is something you do?', adj1: 'Which word tells what something is like?',
  sort: 'Is it a person, an animal, a place or a thing?', fits: 'Which word fits?', looks: 'Which one tells about this dragon?',
  apostrophe: 'Where does the apostrophe go? Tap the gap.', squeeze3: 'Squeeze the two words. Which word is it?',
  capital: 'Which word needs a big letter?', capital2: 'Two words need a big letter. Tap them both!',
} as const;
export const pluralAsk = (one: string) => `Which word means more than one ${one}?` as const;
export const squeezeAsk = (word: string) => `Which two words made ${word}?` as const;
export const shortAsk = (from: string) => `Which is the short way to say ${from}?` as const;

/** A word in a sentence on screen: its text as shown (a name to fix is shown small), and its job. */
export interface Shown { readonly text: string; readonly role: Role }
export type Stage =
  | { readonly type: 'words'; readonly job: 'noun' | 'verb' | 'adj' }
  | { readonly type: 'tap'; readonly s: Sentence; readonly shown: readonly Shown[]; readonly need: readonly number[] }
  | { readonly type: 'sort'; readonly word: string }
  | { readonly type: 'gap'; readonly f: Frame }
  | { readonly type: 'looks'; readonly dragons: readonly [readonly Look[], readonly Look[]]; readonly point: 0 | 1 }
  | { readonly type: 'plural'; readonly one: string; readonly pic: string }
  | { readonly type: 'squeeze'; readonly show: string }
  | { readonly type: 'apostrophe'; readonly word: string; readonly letters: string }
  | { readonly type: 'squeeze3'; readonly text: string; readonly at: number };

export interface Question {
  readonly kind: Kind;
  readonly level: Level;
  /** What it is about, for "not again until twenty others". */
  readonly topic: string;
  /** What is said, in order (each a clip). */
  readonly ask: readonly string[];
  /** The heading on screen. */
  readonly text: string;
  readonly stage: Stage;
  /** Buttons to choose from, when the answer is one of them. */
  readonly choices?: readonly string[];
  readonly answer: string;
}

// ---------- choosing something not asked lately ----------

/** One of `pool` whose topic isn't in `avoid`; if every one is, the one asked longest ago. */
export function fresh<T>(pool: readonly T[], topic: (x: T) => string, rng: Rng, avoid: readonly string[]): T {
  const free = pool.filter(x => !avoid.includes(topic(x)));
  if (free.length) return pick(rng, free);
  return [...pool].sort((a, b) => avoid.lastIndexOf(topic(a)) - avoid.lastIndexOf(topic(b)))[0]!;
}

const capitalise = (w: string) => w.charAt(0).toUpperCase() + w.slice(1);
const lowerFirst = (w: string) => w.charAt(0).toLowerCase() + w.slice(1);

// ---------- each kind ----------

function words(kind: 'noun' | 'verb' | 'adj', rng: Rng, avoid: readonly string[]): Question {
  const right = fresh(oneJob(kind), l => `w:${l.w}`, rng, avoid);
  const others = (['noun', 'verb', 'adj'] as const).filter(j => j !== kind).map(j => pick(rng, oneJob(j)).w);
  const ask = kind === 'noun' ? ASK.noun1 : kind === 'verb' ? ASK.verb1 : ASK.adj1;
  return { kind, level: 1, topic: `w:${right.w}`, ask: [ask], text: ask, stage: { type: 'words', job: kind }, choices: shuffle(rng, [right.w, ...others]), answer: right.w };
}

function tap(kind: 'noun' | 'verb' | 'adj', rng: Rng, avoid: readonly string[]): Question {
  const fit = kind === 'noun' ? forNoun : kind === 'verb' ? forVerb : forAdj;
  const want = (r: Role) => (kind === 'noun' ? isNoun(r) : kind === 'verb' ? r === 'v' : r === 'a');
  const s = fresh(SENTENCES.filter(fit), x => x.text, rng, avoid);
  const i = s.words.findIndex(w => want(w.role));
  return {
    kind, level: 2, topic: s.text, ask: [TERMS[kind].tap, s.text], text: TERMS[kind].tap,
    stage: { type: 'tap', s, shown: s.words.map(w => ({ text: w.text, role: w.role })), need: [i] }, answer: `w${i}`,
  };
}

function sort(rng: Rng, avoid: readonly string[]): Question {
  const l = fresh(SORTABLE, x => `w:${x.w}`, rng, avoid);
  return { kind: 'noun', level: 3, topic: `w:${l.w}`, ask: [ASK.sort, l.w], text: ASK.sort, stage: { type: 'sort', word: l.w }, choices: CATS, answer: l.cat as Cat };
}

function gap(kind: Kind, level: Level, table: readonly Frame[], rng: Rng, avoid: readonly string[]): Question {
  const f = fresh(table, x => x.spec, rng, avoid);
  return { kind, level, topic: f.spec, ask: [ASK.fits, gapped(f)], text: ASK.fits, stage: { type: 'gap', f }, choices: shuffle(rng, [f.right, ...f.wrong]), answer: f.right };
}

/** Two dragons the same but for one look; an arrow points at one; the two sentences are one about each. */
function looks(rng: Rng, avoid: readonly string[]): Question {
  const mine = fresh(LOOKS, l => `look:${l.value}`, rng, avoid);
  const other = pick(rng, LOOKS.filter(l => l.dim === mine.dim && l.value !== mine.value));
  const dims = [...new Set(LOOKS.map(l => l.dim))];
  const a = dims.map(d => (d === mine.dim ? mine : pick(rng, LOOKS.filter(l => l.dim === d)))), b = a.map(l => (l.dim === mine.dim ? other : l));
  const point = int(rng, 0, 1) as 0 | 1;
  return {
    kind: 'adj', level: 3, topic: `look:${mine.value}`, ask: [ASK.looks], text: ASK.looks,
    stage: { type: 'looks', dragons: point === 0 ? [a, b] : [b, a], point }, choices: shuffle(rng, [mine.text, other.text]), answer: mine.text,
  };
}

function plural1(rng: Rng, avoid: readonly string[]): Question {
  const p = fresh(CHANGING, x => `pl:${x.one}`, rng, avoid);
  const others = shuffle(rng, CHANGING.filter(x => x !== p)).slice(0, 2).map(x => x.many);
  const ask = pluralAsk(p.one);
  return { kind: 'plural', level: 1, topic: `pl:${p.one}`, ask: [ask], text: ask, stage: { type: 'plural', one: p.one, pic: p.pic }, choices: shuffle(rng, [p.many, ...others]), answer: p.many };
}

function squeeze(level: Level, rng: Rng, avoid: readonly string[]): Question {
  const first = SQUEEZES.filter(s => s.level === 1);
  if (level === 1) {
    const s = fresh(first, x => `sq:${x.word}`, rng, avoid), ask = squeezeAsk(s.word);
    const others = shuffle(rng, first.filter(x => x !== s)).slice(0, 2).map(x => x.from);
    return { kind: 'squeeze', level, topic: `sq:${s.word}`, ask: [ask], text: ask, stage: { type: 'squeeze', show: s.word }, choices: shuffle(rng, [s.from, ...others]), answer: s.from };
  }
  if (level === 2) {
    if (rng() < .5) {
      const s = fresh(first, x => `sq2:${x.word}`, rng, avoid), ask = shortAsk(s.from);
      const others = shuffle(rng, first.filter(x => x !== s)).slice(0, 2).map(x => x.word);
      return { kind: 'squeeze', level, topic: `sq2:${s.word}`, ask: [ask], text: ask, stage: { type: 'squeeze', show: s.from }, choices: shuffle(rng, [s.word, ...others]), answer: s.word };
    }
    const s = fresh(SQUEEZES, x => `ap:${x.word}`, rng, avoid);
    return {
      kind: 'squeeze', level, topic: `ap:${s.word}`, ask: [ASK.apostrophe, s.word], text: ASK.apostrophe,
      stage: { type: 'apostrophe', word: s.word, letters: s.word.replace("'", '') }, answer: `g${apostropheAt(s.word)}`,
    };
  }
  const s = fresh(SQUEEZE_SENTENCES, x => x.text, rng, avoid);
  return {
    kind: 'squeeze', level, topic: s.text, ask: [s.text, ASK.squeeze3], text: ASK.squeeze3, stage: { type: 'squeeze3', text: s.text, at: s.at },
    choices: shuffle(rng, [s.word, ...s.wrong]), answer: s.word,
  };
}

function capital(level: Level, rng: Rng, avoid: readonly string[]): Question {
  const s = fresh(SENTENCES.filter(x => forCapital(x, level)), x => x.text, rng, avoid), need = toFix(s);
  const shown = s.words.map((w, i) => ({ text: need.includes(i) ? lowerFirst(w.text) : w.text, role: w.role }));
  const ask = level === 3 ? ASK.capital2 : ASK.capital;
  return { kind: 'capital', level, topic: s.text, ask: [ask, s.text], text: ask, stage: { type: 'tap', s, shown, need }, answer: level === 3 ? 'done' : `w${need[0]}` };
}

export function makeQuestion(kind: Kind, level: Level, rng: Rng, avoid: readonly string[] = []): Question {
  switch (kind) {
    case 'noun': return level === 1 ? words('noun', rng, avoid) : level === 2 ? tap('noun', rng, avoid) : sort(rng, avoid);
    case 'verb': return level === 1 ? words('verb', rng, avoid) : level === 2 ? tap('verb', rng, avoid) : gap('verb', 3, VERB_FRAMES, rng, avoid);
    case 'adj': return level === 1 ? words('adj', rng, avoid) : level === 2 ? tap('adj', rng, avoid) : looks(rng, avoid);
    case 'plural': return level === 1 ? plural1(rng, avoid) : gap('plural', level, level === 2 ? PLURAL_FRAMES : PLURAL_FRAMES_3, rng, avoid);
    case 'past': return gap('past', level, level === 1 ? PAST_FRAMES_1 : level === 2 ? PAST_FRAMES_2 : TIME_FRAMES, rng, avoid);
    case 'squeeze': return squeeze(level, rng, avoid);
    case 'capital': return capital(level, rng, avoid);
  }
}

/** Is this the answer? A tap in a sentence is `w<index>`; a Big Letters Level 3 is 'done' once both are found (the view keeps the first). */
export const isRightAnswer = (q: Question, answer: string) => answer === q.answer;
/** Every answer the view can give: a choice, a word of the sentence, a gap of the word. */
export function possibleAnswers(q: Question): string[] {
  if (q.choices) return [...q.choices];
  if (q.stage.type === 'tap') return [...q.stage.shown.map((_, i) => `w${i}`), ...(q.answer === 'done' ? ['done'] : [])];
  if (q.stage.type === 'apostrophe') return Array.from({ length: q.stage.letters.length - 1 }, (_, i) => `g${i + 1}`);
  return [q.answer];
}
/** For a capital Level 3: is tapping this word one of the two? */
export const isNeeded = (q: Question, i: number) => q.stage.type === 'tap' && q.stage.need.includes(i);
export { capitalise };
