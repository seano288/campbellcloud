// The five kinds of question, each at three Levels, made from the curated sentences. Every question has exactly one right answer
// (problems.test.ts checks every kind, Level and Stretch over many seeds).
//
// - Build the Train (order): the sentence is said; its cars wait in the yard, shuffled; he couples them in order. The engine shows
//   its capital and the caboose its mark: honest clues.
// - Engine and Caboose (marks): the train is missing one piece. Level 1: the engine (the capital one, not the lowercase one).
//   Level 2: the caboose, . or ?. Level 3: the caboose with ! too, or the capital on "I" or a name in the middle.
// - What Happened (mean): he reads the sentence himself (🔊 counts as help) and taps its picture.
// - Who, What, Where (ask): a sentence is said, then a question about it; he taps the picture that answers it. Level 3: two
//   sentences, the answer in one of them.
// - Fix the Train (fix): one mistake; he taps the bad car, then fixes it.
import { int, pick, shuffle, type Rng } from '../../game/rng';
import type { Stretch } from '../../modes/progress';
import { makesSense } from '../sentences/grammar';
import { capForm, midForm, orderPool, SENTENCES, sentence, type Sentence } from '../sentences/index';
import type { AskAbout } from '../sentences/list';
import { ANIMALS, COLOURED, groupOf, matches, oneWordChanges, PEOPLE, sameScene, THINGS, wrongPictures, type Attr, type Scene, type Who } from '../sentences/scenes';
import { isName } from '../sentences/words';

export type Kind = 'order' | 'marks' | 'mean' | 'ask' | 'fix';
export type Level = 1 | 2 | 3;

/** A picture choice: its answer key, what it shows, and (for a wrong one) what it changed. */
export interface PicChoice { readonly key: string; readonly scene: Scene; readonly attr: Attr | null }

export type OrderQ = { kind: 'order'; s: number; yard: readonly string[] };
export type MarksQ = { kind: 'marks'; s: number; form: 'engine' | 'caboose' | 'capital'; slot: number; choices: readonly string[]; answer: string };
export type MeanQ = { kind: 'mean'; s: number; choices: readonly PicChoice[]; answer: string };
export type AskQ = { kind: 'ask'; s: number; other: number | null; otherFirst: boolean; q: string; about: AskAbout; choices: readonly PicChoice[]; answer: string };
export type Mistake = 'capital' | 'mark' | 'swap' | 'extra';
/** `cars` and `caboose` are the broken train as shown; `bad` the car(s) that are wrong (the caboose is index cars.length). */
export type FixQ = { kind: 'fix'; s: number; mistake: Mistake; cars: readonly string[]; caboose: string; bad: readonly number[]; fixes: readonly string[]; answer: string };
export type Question = OrderQ | MarksQ | MeanQ | AskQ | FixQ;

export const sKey = (s: Scene) => JSON.stringify([s.who, s.n ?? 1, s.size ?? '', s.color ?? '', s.act ?? '', s.rel ?? '', s.at ?? '', s.has ?? '', s.hasColor ?? '']);

// ---------- the train's pieces ----------

/** The pieces of a sentence's train: the engine with its capital, the cars, the caboose with its mark. */
export const piecesOf = (s: Sentence): string[] => [capForm(s.words[0]!), ...s.words.slice(1).map(midForm), s.mark];
export const ORDER_SEP = '|';
export const trainKey = (pieces: readonly string[]) => pieces.join(ORDER_SEP);

// ---------- Build the Train ----------

function makeOrder(level: Level, stretch: Stretch, rng: Rng): OrderQ {
  let pool = orderPool(level);
  // Stretch: the longer sentences of the Level
  if (level === 2) pool = pool.filter(s => (stretch === 0 ? s.words.length === 4 : stretch === 2 ? s.words.length === 5 : true));
  if (level === 3 && stretch === 0) pool = pool.filter(s => s.words.length <= 5);
  if (!pool.length) pool = orderPool(level);
  const s = pick(rng, pool), pieces = piecesOf(s);
  let yard = shuffle(rng, pieces);
  for (let t = 0; t < 6 && trainKey(yard) === trainKey(pieces); t++) yard = shuffle(rng, pieces);
  return { kind: 'order', s: s.id, yard };
}

// ---------- Engine and Caboose ----------

/** The caboose choices: a question only ever takes ?, so it's offered . and ! too; a telling sentence . or ?; a big feeling ! or ?. */
export function markChoices(s: Sentence, level: Level): string[] {
  if (s.mark === '?') return level >= 3 ? ['?', '.', '!'] : ['?', '.'];
  return s.mark === '.' ? ['.', '?'] : ['!', '?'];
}
/** Words in the middle that always have a capital: "I" and names. */
export const midCapitals = (s: Sentence) => s.words.map((w, i) => (i > 0 && (w === 'I' || isName(w)) ? i : -1)).filter(i => i > 0);
const lowerFirst = (w: string) => w.charAt(0).toLowerCase() + w.slice(1);

function makeMarks(level: Level, stretch: Stretch, rng: Rng): MarksQ {
  if (level === 1) {
    // short sentences while he's starting out
    const s = pick(rng, SENTENCES.filter(x => x.words.length <= 4)), first = s.words[0]!;
    const others = s.words.slice(1).filter(w => w !== 'I' && !isName(w) && w.toLowerCase() !== first.toLowerCase());
    const choices = [capForm(first), lowerFirst(first)];
    if (stretch > 0 && others.length) choices.push(capForm(pick(rng, others)));
    return { kind: 'marks', s: s.id, form: 'engine', slot: 0, choices: shuffle(rng, [...new Set(choices)]), answer: capForm(first) };
  }
  const caps = level === 3 ? SENTENCES.filter(x => midCapitals(x).length) : [];
  if (caps.length && rng() < .45) {
    const s = pick(rng, caps), slot = pick(rng, midCapitals(s)), w = s.words[slot]!;
    return { kind: 'marks', s: s.id, form: 'capital', slot, choices: shuffle(rng, [w, w.toLowerCase()]), answer: w };
  }
  const pool = SENTENCES.filter(x => (level === 2 ? x.mark !== '!' : true));
  // Level 3 leans on the questions and big feelings, where the third mark comes in
  const s = level === 3 && rng() < .6 ? pick(rng, pool.filter(x => x.mark !== '.')) : pick(rng, pool);
  return { kind: 'marks', s: s.id, form: 'caboose', slot: s.words.length, choices: shuffle(rng, markChoices(s, level)), answer: s.mark };
}

// ---------- What Happened ----------

const drawn = () => SENTENCES.filter(s => s.m);

function makeMean(level: Level, _stretch: Stretch, rng: Rng): MeanQ {
  const pool = level === 3 ? drawn().filter(s => oneWordChanges(s.m!).some(c => c.attr !== 'who')) : drawn();
  const s = pick(rng, pool), wrong = wrongPictures(s.m!, level, rng);
  const choices = shuffle(rng, [{ key: sKey(s.m!), scene: s.m!, attr: null }, ...wrong.map(w => ({ key: sKey(w.scene), scene: w.scene, attr: w.attr }))]);
  return { kind: 'mean', s: s.id, choices, answer: sKey(s.m!) };
}

// ---------- Who, What, Where ----------

const asks = (s: Sentence, about: (a: AskAbout) => boolean) => s.ask.filter(([, a]) => about(a));
/** The picture that answers a question about this sentence. */
export function answerScene(s: Sentence, about: AskAbout): Scene {
  const m = s.m!;
  if (about === 'who') return { who: m.who };
  if (about === 'what') return { who: m.has!, color: m.hasColor };
  if (about === 'where') return { who: m.who, rel: m.rel, at: m.at };
  return { who: m.who, act: m.act };
}
/** Wrong answers of the same sort: other animals or people; other places; other things; other doings. */
function wrongAnswers(s: Sentence, about: AskAbout, avoid: readonly Who[], rng: Rng): Scene[] {
  const m = s.m!, right = answerScene(s, about);
  if (about === 'who') {
    const group = groupOf(m.who), same = (group === 'person' ? PEOPLE : group === 'animal' ? ANIMALS : THINGS) as readonly Who[];
    return shuffle(rng, same.filter(w => w !== m.who && !avoid.includes(w))).map(w => ({ who: w }));
  }
  if (about === 'what') {
    return shuffle(rng, THINGS.filter(t => t !== m.has && !avoid.includes(t))).map(t => ({ who: t, color: m.hasColor && COLOURED.includes(t) ? m.hasColor : undefined }));
  }
  const changes = oneWordChanges({ who: m.who, ...(about === 'where' ? { rel: m.rel, at: m.at } : { act: m.act }) }).filter(c => c.attr !== 'who');
  return shuffle(rng, changes.map(c => c.scene)).filter(c => !sameScene(c, right));
}

function makeAsk(level: Level, stretch: Stretch, rng: Rng): AskQ {
  const ok = (a: AskAbout) => (level === 1 ? a === 'who' : level === 2 ? a !== 'who' : true);
  const pool = SENTENCES.filter(s => asks(s, ok).length);
  const s = pick(rng, pool), [q, about] = pick(rng, asks(s, ok));
  const right = answerScene(s, about), n = level === 1 && stretch === 0 ? 2 : 3;
  let other: Sentence | null = null;
  const wrong: Scene[] = [];
  if (level === 3) {
    // a second sentence about someone else, that doesn't also answer the question
    const m = s.m!;
    const fine = SENTENCES.filter(o => o.m && o.id !== s.id && o.m.who !== m.who && groupOf(o.m.who) !== 'thing'
      && (about !== 'who' || !matches({ ...m, who: o.m.who }, o.m)) && (about !== 'what' || o.m.has !== m.has));
    other = fine.length ? pick(rng, fine) : null;
    if (other) {
      // what the other sentence says is a tempting wrong answer
      const tempt = about === 'who' ? { who: other.m!.who } : about === 'what' && other.m!.has ? { who: other.m!.has, color: other.m!.hasColor && COLOURED.includes(other.m!.has) ? other.m!.hasColor : undefined }
        : about === 'where' && other.m!.rel && other.m!.at ? { who: s.m!.who, rel: other.m!.rel, at: other.m!.at } : null;
      if (tempt && !sameScene(tempt, right) && (about !== 'what' || THINGS.includes(tempt.who as never))) wrong.push(tempt);
    }
  }
  const avoid = [s.m!.who, ...(other ? [other.m!.who] : []), ...(s.m!.has ? [s.m!.has] : [])];
  for (const w of wrongAnswers(s, about, avoid, rng)) if (wrong.length < n - 1 && !wrong.some(x => sameScene(x, w))) wrong.push(w);
  const choices = shuffle(rng, [{ key: sKey(right), scene: right, attr: null }, ...wrong.map(w => ({ key: sKey(w), scene: w, attr: null }))]);
  return { kind: 'ask', s: s.id, other: other?.id ?? null, otherFirst: rng() < .5, q, about, choices, answer: sKey(right) };
}

// ---------- Fix the Train ----------

/** Words that can be slipped into a train where they don't belong. */
export const EXTRA_WORDS = ['cake', 'sun', 'hat', 'jump', 'red', 'big', 'is', 'can', 'the', 'up', 'run', 'in'] as const;

/** The mark a wrong caboose shows: a question with a period, anything else with a question mark. */
const wrongMark = (s: Sentence) => (s.mark === '?' ? '.' : '?');

/** What he can do to the bad car once he has found it: give it its capital, take it off, pick its mark, or (for a swap) tap a car. */
export function fixChoices(s: Sentence, mistake: Mistake, cars: number): string[] {
  if (mistake === 'capital') return ['cap'];
  if (mistake === 'extra') return ['off'];
  if (mistake === 'mark') return markChoices(s, 2);
  return Array.from({ length: cars }, (_, i) => `${i}`).slice(1);
}

function brokenTrain(s: Sentence, mistake: Mistake, rng: Rng): Omit<FixQ, 'kind' | 's' | 'fixes' | 'answer' | 'mistake'> | null {
  const cars = [capForm(s.words[0]!), ...s.words.slice(1).map(midForm)], n = cars.length;
  if (mistake === 'capital') {
    const mid = midCapitals(s);
    const slot = mid.length && rng() < .4 ? pick(rng, mid) : 0;
    cars[slot] = slot === 0 ? lowerFirst(cars[0]!) : cars[slot]!.toLowerCase();
    return { cars, caboose: s.mark, bad: [slot] };
  }
  if (mistake === 'mark') return { cars, caboose: rng() < .5 ? '' : wrongMark(s), bad: [n] };
  if (mistake === 'swap') {
    const pairs: [number, number][] = [];
    for (let i = 1; i < n; i++) for (let j = i + 1; j < n; j++) {
      if (cars[i]!.toLowerCase() === cars[j]!.toLowerCase()) continue;
      const t = [...s.words]; [t[i], t[j]] = [t[j]!, t[i]!];
      if (!makesSense(t, s.mark)) pairs.push([i, j]);
    }
    if (!pairs.length) return null;
    const [i, j] = pick(rng, pairs);
    [cars[i], cars[j]] = [cars[j]!, cars[i]!];
    return { cars, caboose: s.mark, bad: [i, j] };
  }
  // a word that doesn't belong: slipped in after the engine, where taking it off is the only fix that makes the sentence again
  for (let t = 0; t < 12; t++) {
    const w = pick(rng, EXTRA_WORDS), at = int(rng, 1, n);
    const words = [...s.words.slice(0, at), w, ...s.words.slice(at)];
    if (makesSense(words, s.mark)) continue;
    if (words.some((_, k) => k !== at && k > 0 && makesSense(words.filter((__, x) => x !== k), s.mark))) continue;
    return { cars: [...cars.slice(0, at), w, ...cars.slice(at)], caboose: s.mark, bad: [at] };
  }
  return null;
}

export const fixAnswer = (mistake: Mistake, s: Sentence, bad: readonly number[]) =>
  mistake === 'swap' ? `${bad[0]}:${bad[1]}` : `${bad[0]}:${mistake === 'capital' ? 'cap' : mistake === 'extra' ? 'off' : s.mark}`;

function makeFix(level: Level, stretch: Stretch, rng: Rng): FixQ {
  const kinds: Mistake[] = level === 1 ? ['capital', 'mark'] : level === 2 ? ['swap'] : ['capital', 'mark', 'swap', 'extra'];
  const pool = level === 1 ? orderPool(1).concat(orderPool(2).filter(() => stretch > 0)) : level === 2 ? orderPool(2) : SENTENCES.filter(s => s.order);
  for (;;) {
    const s = pick(rng, pool), mistake = pick(rng, kinds), broken = brokenTrain(s, mistake, rng);
    if (!broken) continue;
    const fixes = fixChoices(s, mistake, broken.cars.length);
    return { kind: 'fix', s: s.id, mistake, ...broken, fixes, answer: fixAnswer(mistake, s, broken.bad) };
  }
}

/** What a fixed train reads: the bad car fixed, as he'd see it. */
export function applyFix(q: FixQ, answer: string): { cars: string[]; caboose: string } | null {
  const [a, b] = answer.split(':'), i = Number(a);
  if (!Number.isInteger(i) || b === undefined) return null;
  const cars = [...q.cars];
  if (q.mistake === 'swap') { const j = Number(b); if (!Number.isInteger(j) || !cars[i] || !cars[j]) return null; [cars[i], cars[j]] = [cars[j]!, cars[i]!]; return { cars, caboose: q.caboose }; }
  if (b === 'cap') { if (!cars[i]) return null; cars[i] = capForm(cars[i]!); return { cars, caboose: q.caboose }; }
  if (b === 'off') { if (!cars[i]) return null; cars.splice(i, 1); return { cars, caboose: q.caboose }; }
  if (i !== cars.length) return null;
  return { cars, caboose: b };
}

// ---------- every kind ----------

export function makeQuestion(kind: Kind, level: Level, stretch: Stretch, rng: Rng): Question {
  switch (kind) {
    case 'order': return makeOrder(level, stretch, rng);
    case 'marks': return makeMarks(level, stretch, rng);
    case 'mean': return makeMean(level, stretch, rng);
    case 'ask': return makeAsk(level, stretch, rng);
    case 'fix': return makeFix(level, stretch, rng);
  }
}

export function rightAnswer(q: Question): string {
  if (q.kind === 'order') return trainKey(piecesOf(sentence(q.s)));
  return q.answer;
}

/** Is this an answer to the question at all (rather than a stray tap)? */
export function isAnswer(q: Question, answer: string): boolean {
  if (q.kind === 'order') return [...answer.split(ORDER_SEP)].sort().join() === [...q.yard].sort().join();
  if (q.kind === 'marks') return q.choices.includes(answer);
  if (q.kind === 'mean' || q.kind === 'ask') return q.choices.some(c => c.key === answer);
  const [a, b] = answer.split(':'), i = Number(a);
  if (!Number.isInteger(i) || i < 0 || i > q.cars.length) return false;
  return b === undefined || applyFix(q, answer) !== null || q.fixes.includes(b);
}

/** Is it right? A swap can be fixed from either end. */
export function isRightAnswer(q: Question, answer: string): boolean {
  if (q.kind === 'fix' && q.mistake === 'swap') {
    const [a, b] = answer.split(':').map(Number);
    return b !== undefined && [a, b].sort().join() === [...q.bad].sort().join();
  }
  return answer === rightAnswer(q);
}

/** What the question is about, so a Round doesn't ask about the same sentence twice. */
export const topicOf = (q: Question) => `${q.s}`;
