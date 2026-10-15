import { LEVEL_MONEY } from '../../money/money';
import { LEARN_PHRASES } from '../phrases';
import { OPENS_AFTER } from '../chain';
import type { GameMode } from '../mode';
import { checkLearn, makeLearn, replayLearn, type LearnProblem } from './learn';
import { LearnView } from './LearnView';

export const learnMode: GameMode<LearnProblem, Parameters<typeof checkLearn>[1]> = {
  id: 'learn',
  name: 'Learn the Coins',
  icon: '🪙',
  opensAfter: OPENS_AFTER.learn,
  lockedHint: null,
  levels: LEVEL_MONEY,
  introMoney: { 2: ['q'], 3: ['b1', 'b5'] },
  phrases: LEARN_PHRASES,
  makeProblem: makeLearn,
  replay: replayLearn,
  checkAnswer: checkLearn,
  View: LearnView,
};
