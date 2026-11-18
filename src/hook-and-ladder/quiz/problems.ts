// The five kinds of question, each at three Levels, made from the word tables in ../words. Every question has exactly one right answer
// (problems.test.ts checks every kind, Level and Stretch over many seeds). Every word is both shown and said: the skill is meaning,
// not decoding.
//
// - Two Words, One Word (join). L1: two words are shown and said; he taps the picture of the word they make. L2: a compound is shown;
//   he taps where it splits. L3: "rain and what makes a real word?": bow, or two silly halves.
// - Opposites (opposite). L1: "Tap the opposite of hot", two pictures. L2: three words, no pictures. L3: "The soup is not hot. It
//   is... Tap the opposite of hot.", three describing words. It must say "opposite": "The towel is not wet. It is..." alone would let
//   soft or dirty be true too.
// - Sort It (sort). L1: "Tap all the animals!" among six pictures, then ✓. L2: "Which one does not belong?" among four. L3: "A dog,
//   a cat and a cow are all...", three groups; or a question about one thing in a group ("Which animal can fly?").
// - Endings (ending). L1: a picture of one dog or more; "dog" or "dogs". L2: "Yesterday he...": jump, jumped or jumping. L3:
//   "Which word is hiding in jumping?"
// - Strong Words (strong). L1: "Which is bigger, big or huge?" L2: "Which is the loudest?" of three. L3: three in order, weakest
//   first.
import { int, pick, shuffle, type Rng } from '../../game/rng';
import type { Stretch } from '../../modes/progress';
import { ALSO_REAL, COMPOUNDS, SILLY_HALVES, type Compound } from '../words/compounds';
import { ACTIONS, FRAME_WRONGS, FRAMES, THINGS, withEnding, type Ending } from '../words/endings';
import { DESCRIBING, KIN, OPPOSITES, type Opposite } from '../words/opposites';
import { picOf } from '../words/pictures';
import { FACTS, GROUP_IDS, GROUPS, type GroupId } from '../words/sorting';
import { ALL_PAIRS, SCALES } from '../words/strong';

export type Kind = 'join' | 'opposite' | 'sort' | 'ending' | 'strong';
export type Level = 1 | 2 | 3;

export type JoinQ =
  | { kind: 'join'; form: 'pic'; word: string; choices: readonly string[]; answer: string }
  | { kind: 'join'; form: 'split'; word: string; answer: string }
  | { kind: 'join'; form: 'half'; word: string; a: string; choices: readonly string[]; answer: string };
export type OppQ = { kind: 'opposite'; form: 'pic' | 'say' | 'sentence'; word: string; choices: readonly string[]; answer: string };
export type SortQ =
  | { kind: 'sort'; form: 'all'; group: GroupId; items: readonly string[]; answer: string }
  | { kind: 'sort'; form: 'odd'; group: GroupId; items: readonly string[]; answer: string }
  | { kind: 'sort'; form: 'name'; group: GroupId; items: readonly string[]; choices: readonly GroupId[]; answer: string }
  | { kind: 'sort'; form: 'fact'; fact: number; choices: readonly string[]; answer: string };
export type EndQ =
  | { kind: 'ending'; form: 'count'; word: string; n: number; choices: readonly string[]; answer: string }
  | { kind: 'ending'; form: 'frame'; word: string; frame: number; choices: readonly string[]; answer: string }
  | { kind: 'ending'; form: 'hide'; word: string; shown: string; ending: '' | Ending; choices: readonly string[]; answer: string };
export type StrongQ =
  | { kind: 'strong'; form: 'pair'; words: readonly string[]; more: string; answer: string }
  | { kind: 'strong'; form: 'most'; scale: number; words: readonly string[]; answer: string }
  | { kind: 'strong'; form: 'order'; scale: number; words: readonly string[]; answer: string };
export type Question = JoinQ | OppQ | SortQ | EndQ | StrongQ;

/** Several picks are joined into one answer with this. */
export const SEP = '|';

// ---------- Two Words, One Word ----------

const joined = (c: Compound) => c.word.replace(' ', '');
/** Every real word the table knows of: its compounds, closed up, and the extra real words. */
export const REAL_JOINS = new Set([...COMPOUNDS.map(joined), ...ALSO_REAL]);
export const splitPool = COMPOUNDS.filter(c => !c.spaced && !c.noSplit);
export const halfPool = COMPOUNDS.filter(c => !c.spaced);
/** Silly halves that make nothing real with this first half, and aren't its own second half. */
export const sillyFor = (a: string) => SILLY_HALVES.filter(h => !REAL_JOINS.has(a + h) && !COMPOUNDS.some(c => c.a === a && (c.b as string) === h));

function makeJoin(level: Level, stretch: Stretch, rng: Rng): JoinQ {
  if (level === 1) {
    const pics = COMPOUNDS.filter(c => c.pic);
    const c = pick(rng, pics), n = stretch === 2 ? 3 : 2;
    // a wrong picture shares no half with the right one, so the two words point to one picture only
    const wrong = shuffle(rng, pics.filter(o => o !== c && o.a !== c.a && o.b !== c.b && o.a !== c.b && o.b !== c.a)).slice(0, n - 1);
    return { kind: 'join', form: 'pic', word: c.word, choices: shuffle(rng, [c, ...wrong].map(x => x.word)), answer: c.word };
  }
  if (level === 2) {
    const c = pick(rng, stretch === 0 ? splitPool.filter(x => x.word.length <= 8) : splitPool);
    return { kind: 'join', form: 'split', word: c.word, answer: `${c.a.length}` };
  }
  const c = pick(rng, halfPool);
  const wrong = shuffle(rng, sillyFor(c.a)).slice(0, 2);
  return { kind: 'join', form: 'half', word: c.word, a: c.a, choices: shuffle(rng, [c.b, ...wrong]), answer: c.b };
}
export const compound = (word: string) => COMPOUNDS.find(c => c.word === word)!;

// ---------- Opposites ----------

/** The group and every group it is kin to (a group can be in more than one KIN list: all of them count). */
export const kinOf = (g: string) => [...new Set([g, ...KIN.filter(k => k.includes(g)).flat()])];
/** Words that could be offered as a wrong opposite of this entry: from a group that isn't its own or its kin, never a fair one. */
export function oppWrongs(o: Opposite, describing = false): string[] {
  const kin = kinOf(o.group);
  const fair = new Set<string>([o.word, o.opp, ...(o.also ?? [])]);
  // a word in a kin group is kept out even when another group has it too (light: dark and light, heavy and light)
  for (const x of OPPOSITES) if (kin.includes(x.group)) { fair.add(x.word); fair.add(x.opp); }
  const words = OPPOSITES.filter(x => !kin.includes(x.group)).flatMap(x => [x.word, x.opp]);
  return [...new Set(words)].filter(w => !fair.has(w) && (!describing || DESCRIBING.has(w)));
}
const oppPics = OPPOSITES.filter(o => o.pic);
const hasPic = (w: string) => picOf(w) !== null || w === 'big' || w === 'little';

function makeOpposite(level: Level, stretch: Stretch, rng: Rng): OppQ {
  const pool = level === 1 ? oppPics : level === 3 ? OPPOSITES.filter(o => o.say) : OPPOSITES;
  const o = pick(rng, pool);
  const n = level === 1 ? (stretch === 2 ? 3 : 2) : 3;
  const wrongs = oppWrongs(o, level === 3).filter(w => level !== 1 || hasPic(w));
  const choices = shuffle(rng, [o.opp, ...shuffle(rng, wrongs).slice(0, n - 1)]);
  return { kind: 'opposite', form: level === 1 ? 'pic' : level === 2 ? 'say' : 'sentence', word: o.word, choices, answer: o.opp };
}
export const opposite = (word: string) => OPPOSITES.find(o => o.word === word)!;

// ---------- Sort It ----------

const groupOf = (thing: string): GroupId => GROUP_IDS.find(g => (GROUPS[g].things as readonly string[]).includes(thing))!;

function makeSort(level: Level, stretch: Stretch, rng: Rng): SortQ {
  if (level === 1) {
    const g = pick(rng, GROUP_IDS), right = int(rng, 2, stretch === 2 ? 4 : 3);
    const ins = shuffle(rng, GROUPS[g].things).slice(0, right);
    const outs = shuffle(rng, GROUP_IDS.filter(x => x !== g).flatMap(x => GROUPS[x].things)).slice(0, 6 - right);
    const items = shuffle(rng, [...ins, ...outs]);
    return { kind: 'sort', form: 'all', group: g, items, answer: [...ins].sort().join(SEP) };
  }
  if (level === 2) {
    const g = pick(rng, GROUP_IDS), other = pick(rng, GROUP_IDS.filter(x => x !== g));
    const odd = pick(rng, GROUPS[other].things);
    const items = shuffle(rng, [...shuffle(rng, GROUPS[g].things).slice(0, 3), odd]);
    return { kind: 'sort', form: 'odd', group: g, items, answer: odd };
  }
  if (rng() < 0.5) {
    const g = pick(rng, GROUP_IDS);
    const items = shuffle(rng, GROUPS[g].things).slice(0, 3);
    const choices = shuffle(rng, [g, ...shuffle(rng, GROUP_IDS.filter(x => x !== g)).slice(0, 2)]);
    return { kind: 'sort', form: 'name', group: g, items, choices, answer: g };
  }
  const i = int(rng, 0, FACTS.length - 1), f = FACTS[i]!;
  const yes = pick(rng, f.yes);
  return { kind: 'sort', form: 'fact', fact: i, choices: shuffle(rng, [yes, ...shuffle(rng, f.no).slice(0, 2)]), answer: yes };
}
export { groupOf };

// ---------- Endings ----------

const ROOTS: readonly string[] = [...THINGS, ...ACTIONS];

function makeEnding(level: Level, _stretch: Stretch, rng: Rng): EndQ {
  if (level === 1) {
    const w = pick(rng, THINGS), n = pick(rng, [1, 2, 2, 3]);
    return { kind: 'ending', form: 'count', word: w, n, choices: shuffle(rng, [w, w + 's']), answer: n === 1 ? w : w + 's' };
  }
  if (level === 2) {
    const w = pick(rng, ACTIONS), frame = int(rng, 0, FRAMES.length - 1), f = FRAMES[frame]!;
    const forms = [f.ending, ...FRAME_WRONGS[f.ending]].map(e => withEnding(w, e));
    return { kind: 'ending', form: 'frame', word: w, frame, choices: shuffle(rng, forms), answer: withEnding(w, f.ending) };
  }
  const thing = rng() < 0.3, w = thing ? pick(rng, THINGS) : pick(rng, ACTIONS);
  const ending: Ending = thing ? 's' : pick(rng, ['s', 'ed', 'ing'] as const), shown = withEnding(w, ending);
  // wrong roots: never hiding in the word too (no "lay" in "played"), the same first letter when there's one
  const others = ROOTS.filter(r => r !== w && !shown.includes(r));
  const same = shuffle(rng, others.filter(r => r[0] === w[0])), rest = shuffle(rng, others.filter(r => r[0] !== w[0]));
  return { kind: 'ending', form: 'hide', word: w, shown, ending, choices: shuffle(rng, [w, ...[...same, ...rest].slice(0, 2)]), answer: w };
}

// ---------- Strong Words ----------

function makeStrong(level: Level, _stretch: Stretch, rng: Rng): StrongQ {
  if (level === 1) {
    const p = pick(rng, ALL_PAIRS);
    return { kind: 'strong', form: 'pair', words: shuffle(rng, p.words), more: p.more, answer: p.words[1] };
  }
  const i = int(rng, 0, SCALES.length - 1), s = SCALES[i]!;
  const words = shuffle(rng, s.words);
  return level === 2 ? { kind: 'strong', form: 'most', scale: i, words, answer: s.words[2] } : { kind: 'strong', form: 'order', scale: i, words, answer: s.words.join(SEP) };
}

// ---------- every kind ----------

export function makeQuestion(kind: Kind, level: Level, stretch: Stretch, rng: Rng): Question {
  switch (kind) {
    case 'join': return makeJoin(level, stretch, rng);
    case 'opposite': return makeOpposite(level, stretch, rng);
    case 'sort': return makeSort(level, stretch, rng);
    case 'ending': return makeEnding(level, stretch, rng);
    case 'strong': return makeStrong(level, stretch, rng);
  }
}

/** The things he can pick, as answers: a choice, a gap in a word, or (Sort It) a set. */
export function answersOf(q: Question): string[] {
  if (q.kind === 'join' && q.form === 'split') return Array.from({ length: q.word.length - 1 }, (_, i) => `${i + 1}`);
  if (q.kind === 'sort' && (q.form === 'all' || q.form === 'odd')) return q.form === 'odd' ? [...q.items] : [];
  if (q.kind === 'strong') return q.form === 'order' ? [] : [...q.words];
  return [...q.choices];
}

/** Is this an answer to the question at all (rather than a stray tap)? */
export function isAnswer(q: Question, answer: string): boolean {
  if (q.kind === 'sort' && q.form === 'all') return answer.split(SEP).every(w => q.items.includes(w));
  if (q.kind === 'strong' && q.form === 'order') return [...answer.split(SEP)].sort().join() === [...q.words].sort().join();
  return answersOf(q).includes(answer);
}

export const isRightAnswer = (q: Question, answer: string) =>
  q.kind === 'sort' && q.form === 'all' ? [...answer.split(SEP)].filter(Boolean).sort().join(SEP) === q.answer : answer === q.answer;

/** What the question is about, so a Round doesn't ask about the same word twice. */
export function topicOf(q: Question): string {
  if (q.kind === 'join' || q.kind === 'opposite' || q.kind === 'ending') return `${q.kind}:${q.word}`;
  if (q.kind === 'sort') return q.form === 'fact' ? `fact:${q.fact}` : `sort:${q.form}:${q.group}`;
  return `strong:${q.form === 'pair' ? q.words.join() : q.scale}`;
}

/** Every word a question can show, so each has a clip (phrases.ts). */
export const ALL_WORDS: readonly string[] = [...new Set([
  ...COMPOUNDS.flatMap(c => [c.word, c.a, c.b]), ...SILLY_HALVES,
  ...OPPOSITES.flatMap(o => [o.word, o.opp]),
  ...GROUP_IDS.flatMap(g => GROUPS[g].things), ...FACTS.flatMap(f => [...f.yes, ...f.no]),
  ...THINGS.flatMap(t => [t, t + 's']), ...ACTIONS.flatMap(a => [a, a + 's', a + 'ed', a + 'ing']),
  ...SCALES.flatMap(s => s.words), ...ALL_PAIRS.flatMap(p => p.words),
])];
