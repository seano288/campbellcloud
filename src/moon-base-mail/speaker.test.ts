// The speaker rule (Sentence Express's): hearing a sentence or a written answer read aloud makes that answer "helped": it earns no
// Mastery credit and no first-try Bolt, and the save counts it. Played through the shared Round engine with this game's questions, as
// the speaker buttons in views.tsx do it (actions.help, and the lifetime marked as listened to).
import { describe, expect, it } from 'vitest';
import { createRound } from '../learning/round';
import type { SolvedProblem } from '../learning/session';
import { seeded } from '../game/rng';
import { boltsFor } from '../round/rules';
import { freshLearning, MEETINGS, recordSolved, type LearningState } from './learning';
import { mixedSession, type Asking } from './mix';
import { rightAnswer } from './reading/problems';
import { listened, markListened } from './reading/teach';

function oneAnswer(listen: boolean) {
  let state: LearningState = { ...freshLearning(), met: [...MEETINGS], tuneUp: { ask: { asked: 3, clean: 0, misses: 0 }, order: { asked: 3, clean: 0, misses: 0 } } };
  const session = mixedSession(() => state, async () => {}, seeded(4));
  const facts: SolvedProblem[] = [];
  const round = createRound<ReturnType<typeof session.makeProblem>, string>({
    roundId: 'r', session, rng: seeded(4), interrupt: () => {}, terminal: () => {},
    solved: (_id, fact) => {
      const cur = round.display.peek().current, p = cur.problem as Asking;
      facts.push(fact);
      state = recordSolved(state, { mode: p.mode, push: p.push, letter: p.q.pid, qi: p.q.qi, listened: listened(cur.signal) }, fact).state;
    },
  });
  const cur = round.display.peek().current, p = cur.problem as Asking;
  if (listen) { markListened(cur.signal); cur.actions.help(async () => {}); }
  expect(cur.actions.submit(rightAnswer(p.q))).toBe('correct');
  round.leave();
  return { fact: facts[0]!, state };
}

describe('the speaker', () => {
  it('an answer he had read to him is helped: no Mastery credit, no first-try Bolt, and counted for the parent', () => {
    const heard = oneAnswer(true), read = oneAnswer(false);
    expect(heard.fact.outcome).toBe('helped');
    expect(read.fact.outcome).toBe('clean');
    expect(boltsFor([heard.fact.outcome])).toBe(boltsFor([]) + 0);
    expect(boltsFor([read.fact.outcome])).toBe(boltsFor([]) + 1);
    const mode = (s: LearningState) => Object.values(s.modes).find(m => m.window.length)!;
    expect(mode(heard.state).window).toEqual(['helped']);
    expect(mode(read.state).window).toEqual(['clean']);
    expect(heard.state.heard).toMatchObject({ answered: 1, helped: 1 });
    expect(read.state.heard).toMatchObject({ answered: 1, helped: 0 });
  });
});
