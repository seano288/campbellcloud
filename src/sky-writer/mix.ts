// Every Round mixes the kinds he has opened, never the same kind twice running while there's another. Unstarred kinds are practised;
// a starred kind comes back as about one review question a Round. Each question then picks how hard, as in Math Bots: mostly at that
// kind's Level, which counts toward Mastery, about one in three easier, and always easier right after a miss.
//
// Then a letter: from a Family he has met, the weak and new Families more often, and not one already asked this Round. When the next
// Family is due (learning.ts says when) he meets it first, and the question straight after asks about one of its letters.
// A miss comes back later as a fresh question of the same kind and Level, about another letter, with no Mastery credit.
import { int, pick, type Rng } from '../game/rng';
import type { Check, LearningSession, Outcome } from '../learning/session';
import { stretchOf, struggling, type Stretch } from '../modes/progress';
import { familyDue, MODE_IDS, nextFamily, strengthOf, verdict, type Explanation, type LearningState, type ModeId } from './learning';
import { letter, type FamilyId } from './letters/strokes';
import { canAsk, check, makeQuestion, poolFor, type Level, type MeetQ, type Question } from './writing/problems';

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

/** How often a Family's letters come up: the shaky and new ones far more than the ones he knows well. */
const WEIGHTS = [6, 5, 4, 2, 1.5, 1];
export function pickLetter(state: Pick<LearningState, 'strength' | 'families'>, rng: Rng, pool: readonly string[]): string | null {
  if (!pool.length) return null;
  const newest = state.families.at(-1), weight = (c: string) => { const f = letter(c).family; return (WEIGHTS[strengthOf(state, f)] ?? 1) * (f === newest ? 2 : 1); };
  let r = rng() * pool.reduce((s, c) => s + weight(c), 0);
  for (const c of pool) if ((r -= weight(c)) < 0) return c;
  return pool.at(-1)!;
}

export const meeting = (family: FamilyId): Meeting => ({ mode: 'meet', level: 1, push: false, stretch: 0, q: { kind: 'meet', family } });

/** A Round's questions. `note` hears how each went, so a miss is followed by an easier one. */
export function mixedSession(read: () => LearningState, explain: Explanation<Asking>, rng: Rng = Math.random): LearningSession<Problem, string> & { note(outcome: Outcome): void } {
  let current: Problem | undefined, lastMode: ModeId | undefined, missed = false, asked = 0, newFamily: FamilyId | undefined;
  const reviewAt = int(rng, 0, 4), seen = new Set<string>(), met = new Set<FamilyId>();
  const notLast = (kinds: readonly ModeId[]) => { const others = kinds.filter(m => m !== lastMode); return others.length ? others : [...kinds]; };
  const familiesOf = (state: LearningState): FamilyId[] => (state.families.length ? state.families : ['lines']);

  function nextBase(state: LearningState, r: Rng, skip: readonly ModeId[]): Base {
    const review = reviewKinds(state).filter(m => !skip.includes(m)), set = practised(state).filter(m => !skip.includes(m));
    if (asked === reviewAt && review.some(m => m !== lastMode)) return { ...pitch(state, pick(r, notLast(review)), r, false), push: false };
    if (!set.length) return pitch(state, pick(r, review.length ? notLast(review) : ['trace']), r, missed);
    return pitch(state, pick(r, notLast(set)), r, missed);
  }

  /** A letter this kind can ask at this Level, from the Families he has met (or `only`), not one already asked this Round if another will do. */
  function letterFor(state: LearningState, b: Base, r: Rng, only?: FamilyId): string | null {
    const all = poolFor(b.mode, b.level, familiesOf(state)).filter(c => !only || letter(c).family === only);
    const fresh = all.filter(c => !seen.has(c));
    return pickLetter(state, r, fresh.length ? fresh : all);
  }

  function ask(state: LearningState, r: Rng, only?: FamilyId): Asking {
    const skip: ModeId[] = [];
    for (;;) {
      const base = skip.length >= MODE_IDS.length ? { mode: 'trace' as const, level: 1 as Level, push: false, stretch: 0 as Stretch } : nextBase(state, r, skip);
      if (canAsk(base.mode, base.level, familiesOf(state))) {
        const c = letterFor(state, base, r, only) ?? (only ? letterFor(state, base, r) : null);
        if (c) { seen.add(c); return { ...base, q: makeQuestion(base.mode, base.level, c, familiesOf(state), r) }; }
      }
      skip.push(base.mode); // this kind can't ask anything yet at this Level (Write a Word before he has met enough letters): it sits out
    }
  }

  return {
    makeProblem(r) {
      const saved = read(), state = { ...saved, families: [...new Set([...saved.families, ...met])] };
      const due = familyDue(state) ? nextFamily(state) : undefined;
      if (due && !met.has(due) && !newFamily) {
        met.add(due);
        newFamily = due;
        return (current = meeting(due));
      }
      const only = newFamily;
      newFamily = undefined;
      const p = ask(state, r, only);
      asked++;
      lastMode = p.mode;
      return (current = p);
    },
    replay(p, r) {
      if (p.mode === 'meet') return (current = p);
      lastMode = p.mode;
      const state = read(), base = { mode: p.mode, level: p.level, push: false, stretch: p.stretch };
      const c = letterFor(state, base, r) ?? p.q.ch;
      seen.add(c);
      return (current = { ...base, q: makeQuestion(p.mode, p.level, c, familiesOf(state), r), replay: true });
    },
    check(p, answer): Check {
      if (p.mode === 'meet') return { kind: 'correct' };
      const right = check(p.q, answer);
      if (right === 'more') return { kind: 'not-an-answer' };
      return verdict(right, p, answer, explain);
    },
    needsEarlyHelp: () => !!current && current.mode !== 'meet' && struggling(read().modes[current.mode]),
    note(outcome) { missed = outcome !== 'clean'; },
  };
}
