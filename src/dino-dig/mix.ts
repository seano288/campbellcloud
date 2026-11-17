// Every Round mixes the kinds he has opened, never the same kind twice running while there's another. Unstarred kinds are practised;
// a starred kind comes back as about one review question a Round. Each question then picks how hard, as in Math Bots: mostly at that
// kind's Level, which counts toward Mastery, about one in three easier, and always easier right after a miss.
//
// Then a word: from a Pattern he has met, the weak and new Patterns more often, and not one already asked this Round. When the next
// Pattern is due (learning.ts says when) he meets it first, and the question straight after asks about one of its words.
// A miss comes back later as a fresh question of the same kind and Level, about another word, with no Mastery credit.
import { int, pick, type Rng } from '../game/rng';
import type { Check, LearningSession, Outcome } from '../learning/session';
import { stretchOf, struggling, type Stretch } from '../modes/progress';
import { WORD_INFO, wordsIn, type PatternId, type Word, type WordInfo } from './words/list';

const INFO = new Map<Word, WordInfo>(WORD_INFO.map(i => [i.word, i]));
const infoOf = (w: Word) => INFO.get(w)!;
import { MODE_IDS, nextPattern, patternDue, strengthOf, verdict, type Explanation, type LearningState, type ModeId } from './learning';
import { canAsk, check, EXAMPLES, makeQuestion, type Level, type MeetQ, type Question } from './reading/problems';

export const EASY_SHARE = 1 / 3;

export type Asking = { readonly mode: ModeId; readonly level: Level; readonly push: boolean; readonly stretch: Stretch; readonly q: Question; readonly replay?: boolean };
export type Meeting = { readonly mode: 'meet'; readonly level: 1; readonly push: false; readonly stretch: 0; readonly q: MeetQ };
export type Problem = Asking | Meeting;

export const practised = (state: Pick<LearningState, 'modes'>) => MODE_IDS.filter(m => state.modes[m].opened && !state.modes[m].starred);
export const reviewKinds = (state: Pick<LearningState, 'modes'>) => MODE_IDS.filter(m => state.modes[m].opened && state.modes[m].starred);

interface Base { readonly mode: ModeId; readonly level: Level; readonly push: boolean; readonly stretch: Stretch }

/** How hard a question of this kind is. */
export function pitch(state: LearningState, mode: ModeId, rng: Rng, missed: boolean): Base {
  const m = state.modes[mode], top = m.level as Level;
  const easy = top > 1 && (missed || rng() < EASY_SHARE);
  return easy ? { mode, level: int(rng, 1, top - 1) as Level, push: false, stretch: 0 } : { mode, level: top, push: true, stretch: stretchOf(m) };
}

/** How often a Pattern's words come up: the shaky and new ones far more than the ones he knows well. */
const WEIGHTS = [6, 5, 4, 2, 1.5, 1];
export function pickWord(state: Pick<LearningState, 'strength' | 'patterns'>, rng: Rng, pool: readonly Word[]): Word | null {
  if (!pool.length) return null;
  const newest = state.patterns.at(-1), weight = (w: Word) => { const p = infoOf(w).pattern; return WEIGHTS[strengthOf(state, p)]! * (p === newest ? 2 : 1); };
  let r = rng() * pool.reduce((s, w) => s + weight(w), 0);
  for (const w of pool) if ((r -= weight(w)) < 0) return w;
  return pool.at(-1)!;
}

/** Is this the right answer? `more`: right so far. */
export function isRight(p: Problem, answer: string): boolean | 'more' {
  if (p.mode === 'meet') return true;
  return check(p.q, answer);
}

export const meeting = (pattern: PatternId): Meeting => ({ mode: 'meet', level: 1, push: false, stretch: 0, q: { kind: 'meet', pattern, examples: EXAMPLES[pattern] } });

/** A Round's questions. `note` hears how each went, so a miss is followed by an easier one. */
export function mixedSession(read: () => LearningState, explain: Explanation<Asking>, rng: Rng = Math.random): LearningSession<Problem, string> & { note(outcome: Outcome): void } {
  let current: Problem | undefined, lastMode: ModeId | undefined, missed = false, asked = 0, newPattern: PatternId | undefined;
  const reviewAt = int(rng, 0, 4), seen = new Set<Word>(), met = new Set<PatternId>();
  const notLast = (kinds: readonly ModeId[]) => { const others = kinds.filter(m => m !== lastMode); return others.length ? others : [...kinds]; };

  function nextBase(state: LearningState, r: Rng, skip: readonly ModeId[]): Base {
    const review = reviewKinds(state).filter(m => !skip.includes(m)), set = practised(state).filter(m => !skip.includes(m));
    if (asked === reviewAt && review.some(m => m !== lastMode)) return { ...pitch(state, pick(r, notLast(review)), r, false), push: false };
    if (!set.length) return pitch(state, pick(r, review.length ? notLast(review) : ['hear']), r, missed);
    return pitch(state, pick(r, notLast(set)), r, missed);
  }

  /** A word this kind can ask at this Level, from the Patterns he has met (or `only`), not one already asked this Round if another will do. */
  function wordFor(state: LearningState, b: Base, r: Rng, only?: PatternId): Word | null {
    const met = state.patterns.length ? state.patterns : (['cvc'] as PatternId[]);
    const patterns = only ? [only] : met;
    const all = patterns.flatMap(p => wordsIn(p)).filter(w => canAsk(b.mode, b.level, w, met));
    const fresh = all.filter(w => !seen.has(w));
    return pickWord(state, r, fresh.length ? fresh : all);
  }

  function question(state: LearningState, base: Base, w: Word, r: Rng): Asking {
    const q = makeQuestion(base.mode, base.level, w, state.patterns.length ? state.patterns : ['cvc'], r);
    if (q.kind === 'sentence') seen.add(q.word);
    return { ...base, q };
  }

  function ask(state: LearningState, r: Rng, only?: PatternId): Asking {
    const skip: ModeId[] = [];
    for (;;) {
      const base = skip.length >= MODE_IDS.length ? { mode: 'hear' as const, level: 1 as Level, push: false, stretch: 0 as Stretch } : nextBase(state, r, skip);
      const w = wordFor(state, base, r, only) ?? (only ? wordFor(state, base, r) : null);
      if (w) { seen.add(w); return question(state, base, w, r); }
      skip.push(base.mode); // this kind can't ask anything yet at this Level (Sound Swap's two-letter sounds before he has met them): it sits out
    }
  }

  return {
    makeProblem(r) {
      const saved = read(), state = { ...saved, patterns: [...new Set([...saved.patterns, ...met])] };
      const due = patternDue(state) ? nextPattern(state) : undefined;
      if (due && !met.has(due) && !newPattern) {
        met.add(due);
        newPattern = due;
        return (current = meeting(due));
      }
      const only = newPattern;
      newPattern = undefined;
      const p = ask(state, r, only);
      asked++;
      lastMode = p.mode;
      return (current = p);
    },
    replay(p, r) {
      if (p.mode === 'meet') return (current = p);
      lastMode = p.mode;
      const state = read(), base = { mode: p.mode, level: p.level, push: false, stretch: p.stretch };
      const w = wordFor(state, base, r) ?? p.q.word;
      seen.add(w);
      return (current = { ...question(state, base, w, r), replay: true });
    },
    check(p, answer): Check {
      const right = isRight(p, answer);
      if (right === 'more') return { kind: 'not-an-answer' };
      if (p.mode === 'meet') return { kind: 'correct' };
      return verdict(right, p, answer, explain);
    },
    needsEarlyHelp: () => !!current && current.mode !== 'meet' && struggling(read().modes[current.mode]),
    note(outcome) { missed = outcome !== 'clean'; },
  };
}
