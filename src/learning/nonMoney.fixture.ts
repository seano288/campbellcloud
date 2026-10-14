import type { LearningSession, Progression } from './session';

type ClockProblem = { hour: 3; minute: 0 };

export const nonMoneySession = (): LearningSession<ClockProblem, string> => ({
  makeProblem: () => ({ hour: 3, minute: 0 }),
  replay: problem => ({ ...problem }),
  check: (_problem, answer) => !answer ? { kind: 'not-an-answer' }
    : answer === '3:00' ? { kind: 'correct' }
    : { kind: 'incorrect', explain: async () => {} },
  needsEarlyHelp: () => false,
});

export const progressNonMoney: Progression<{ solved: number }, undefined, 'first-clock'> = (state, _context, _result) =>
  ({ state: { solved: state.solved + 1 }, changes: state.solved === 0 ? ['first-clock'] : [] });
