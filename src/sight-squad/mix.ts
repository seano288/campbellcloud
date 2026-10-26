// Every Round mixes all the kinds of question he has opened, as in Chop Chop: each question picks a kind (never the same one
// twice in a row, when there's a choice), then how hard: mostly at that kind's Level, which pushes him and counts toward
// Mastery, with about one in three from an easier Level for a quick win. Right after a miss the next one is always easier,
// and when he's been missing a lot help steps in after a single miss.
//
// Then a word: one he has met, the shaky and new ones more often than the ones he knows well, and not the last one asked.
// When the next word is due (src/sight-squad/learning.ts says when) he meets it first (words/teach.ts, teachMeet), and
// the question straight after asks about it.
import { int, pick, shuffle, type Rng } from '../game/rng';
import type { Check, LearningSession, Outcome } from '../learning/session';
import { struggling } from '../modes/progress';
import { MODE_IDS, strengthOf, verdict, wordsFor, type Explanation, type LearningState, type ModeId } from './learning';
import type { Word } from './words/list';
import {
  canFill, canSentence, canSpell, huntTargets, makeFill, makeHear, makeHunt, makeMeet, makeRead, makeSentence, makeSpell, sentenceOf,
  type FillProblem, type HearProblem, type HuntProblem, type Level, type MeetProblem, type ReadProblem, type SentenceProblem, type SpellProblem,
} from './words/problems';

/** About one question in three comes from an easier Level. */
export const EASY_SHARE = 1 / 3;

interface Base { readonly mode: ModeId; readonly push: boolean; readonly level: Level }
interface Shape { readonly level: Level; readonly push: boolean }
export type Problem =
  | Shape & { readonly mode: 'hear'; readonly q: HearProblem }
  | Shape & { readonly mode: 'hunt'; readonly q: HuntProblem }
  | Shape & { readonly mode: 'spell'; readonly q: SpellProblem }
  | Shape & { readonly mode: 'read'; readonly q: ReadProblem }
  | Shape & { readonly mode: 'sentence'; readonly q: SentenceProblem }
  | Shape & { readonly mode: 'fill'; readonly q: FillProblem }
  | Shape & { readonly mode: 'meet'; readonly q: MeetProblem };

/** The kind and Level of the next question. `last`: the kind just asked, and whether he missed it. */
export function pickNext(state: LearningState, rng: Rng, last?: { mode: ModeId; missed: boolean }, skip: readonly ModeId[] = []): Base {
  const open = MODE_IDS.filter(m => state.modes[m].opened && !skip.includes(m));
  const others = open.filter(m => m !== last?.mode);
  const mode = pick(rng, others.length ? others : open), top = state.modes[mode].level as Level;
  const easy = top > 1 && (last?.missed || rng() < EASY_SHARE);
  return easy ? { mode, level: int(rng, 1, top - 1) as Level, push: false } : { mode, level: top, push: true };
}

/** Could this kind of question ask about this word, with the words he knows? */
export function canAsk(mode: ModeId, w: Word, known: readonly Word[]) {
  if (mode === 'spell') return canSpell(w);
  if (mode === 'sentence') return canSentence(w, known);
  if (mode === 'fill') return canFill(w, known);
  return true;
}

/** How often a word comes up: the shaky and new ones far more than the ones he knows well. */
const WEIGHTS = [6, 5, 4, 2, 1.5, 1];
export function pickWord(state: Pick<LearningState, 'strength'>, rng: Rng, pool: readonly Word[], avoid?: Word): Word | null {
  const from = pool.length > 1 ? pool.filter(w => w !== avoid) : pool;
  if (!from.length) return null;
  const newest = from.at(-1)!, weight = (w: Word) => WEIGHTS[strengthOf(state, w)]! * (w === newest ? 2 : 1);
  let r = rng() * from.reduce((s, w) => s + weight(w), 0);
  for (const w of from) if ((r -= weight(w)) < 0) return w;
  return from.at(-1)!;
}

export interface Explainers {
  hear: Explanation<HearProblem>;
  hunt: Explanation<HuntProblem>;
  spell: Explanation<SpellProblem>;
  read: Explanation<ReadProblem>;
  sentence: Explanation<SentenceProblem>;
  fill: Explanation<FillProblem>;
}
const explainMeet: Explanation<MeetProblem> = async () => {}; // any tap is right

/** A question of this kind and Level about `word`; null when this kind can't ask about it yet. */
export function makeProblem(base: Base, rng: Rng, word: Word, known: readonly Word[]): Problem | null {
  const { level, push } = base;
  switch (base.mode) {
    case 'hear': return { level, push, mode: 'hear', q: makeHear(level, rng, word, known) };
    case 'hunt': return { level, push, mode: 'hunt', q: makeHunt(level, rng, word, known) };
    case 'read': return { level, push, mode: 'read', q: makeRead(level, rng, word, known) };
    case 'spell': { const q = makeSpell(level, rng, word); return q && { level, push, mode: 'spell', q }; }
    case 'sentence': { const q = makeSentence(level, rng, word, known); return q && { level, push, mode: 'sentence', q }; }
    case 'fill': { const q = makeFill(level, rng, word, known); return q && { level, push, mode: 'fill', q }; }
  }
}

/**
 * The next question: a kind he has open that can ask about some word he knows (Find It always can). `word`: the one it must
 * ask about (the word he just met).
 */
export function nextQuestion(state: LearningState, rng: Rng, known: readonly Word[], prev?: { mode: ModeId; missed: boolean; word: Word }, word?: Word): Problem {
  const skip: ModeId[] = [];
  for (;;) {
    const base = pickNext(state, rng, prev, skip);
    const pool = word ? [word] : known.filter(w => canAsk(base.mode, w, known));
    const w = pickWord(state, rng, pool, prev?.word);
    const p = w && makeProblem(base, rng, w, known);
    if (p) return p;
    skip.push(base.mode);
    if (skip.length >= MODE_IDS.length) return makeProblem({ mode: 'hear', level: 1, push: false }, rng, word ?? known.at(-1)!, known)!;
  }
}

/** Is this the right answer? `null`: not an answer at all; `more`: right so far (a Word Hunt or a word being built). */
export function isRight(p: Problem, answer: string): boolean | null | 'more' {
  const index = (n: number) => { const i = Number(answer); return Number.isInteger(i) && i >= 0 && i < n ? i : null; };
  switch (p.mode) {
    case 'hear': case 'read': case 'fill': { const i = index(p.q.choices.length); return i === null ? null : p.q.choices[i] === p.q.target; }
    case 'sentence': {
      const tokens = sentenceOf(p.q.sentence).tokens, i = index(tokens.length);
      return i === null ? null : tokens[i]!.word === p.q.target;
    }
    case 'hunt': {
      const taps = answer.split(',').map(Number), cards = p.q.cards;
      if (!taps.length || taps.some(i => !Number.isInteger(i) || i < 0 || i >= cards.length)) return null;
      if (cards[taps.at(-1)!]!.word !== p.q.target) return false;
      return huntTargets(p.q).every(i => taps.includes(i)) ? true : 'more';
    }
    case 'spell': {
      const want = p.q.target.toLowerCase();
      if (!answer || answer.length > want.length || !/^[a-z]+$/.test(answer)) return null;
      return answer === want ? true : want.startsWith(answer) ? 'more' : false;
    }
    case 'meet': return true;
  }
}

/** The Round's questions. `note` hears how each one went, so a miss is followed by an easier one. */
export function mixedSession(read: () => LearningState, explain: Explainers): LearningSession<Problem, string> & { note(outcome: Outcome): void } {
  let current: Problem | undefined, missed = false, newWord: Word | undefined;
  const met = new Set<Word>();
  return {
    makeProblem(rng) {
      const state = read(), known = [...new Set([...state.words, ...met])];
      const prev = current && current.mode !== 'meet' ? { mode: current.mode, missed, word: current.q.target } : undefined;
      const fresh = wordsFor({ ...state, words: known }).find(w => !known.includes(w));
      if (fresh && !newWord) { // meet the word, then ask about it
        met.add(fresh);
        newWord = fresh;
        return (current = { level: 1, push: false, mode: 'meet', q: makeMeet(fresh, known) });
      }
      const word = newWord;
      newWord = undefined;
      return (current = nextQuestion(state, rng, known, prev, word));
    },
    replay(p, rng) {
      // the same question again, its choices in a new order
      if (p.mode === 'hear' || p.mode === 'read' || p.mode === 'fill') return (current = { ...p, q: { ...p.q, choices: shuffle(rng, p.q.choices) } } as Problem);
      if (p.mode === 'hunt') return (current = { ...p, q: { ...p.q, cards: shuffle(rng, p.q.cards) } });
      if (p.mode === 'spell') return (current = { ...p, q: { ...p.q, tiles: shuffle(rng, p.q.tiles) } });
      return (current = p);
    },
    check(p, answer): Check {
      const right = isRight(p, answer);
      if (right === null || right === 'more') return { kind: 'not-an-answer' };
      const e = (p.mode === 'meet' ? explainMeet : explain[p.mode]) as Explanation<Problem['q']>;
      return verdict(right, p.q, answer, e);
    },
    needsEarlyHelp: () => !!current && current.mode !== 'meet' && struggling(read().modes[current.mode]),
    note(outcome) { missed = outcome !== 'clean'; },
  };
}
