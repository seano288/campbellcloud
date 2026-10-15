import { LEVEL_MONEY } from '../../money/money';
import { COUNT_PHRASES } from '../phrases';
import { OPENS_AFTER } from '../chain';
import type { GameMode } from '../mode';
import { checkCount, makeCount, replayCount, type CountProblem } from './count';
import { CountView } from './CountView';

export const countMode: GameMode<CountProblem, number> = {
  id: 'count',
  name: 'Count the Cash',
  icon: '💰',
  opensAfter: OPENS_AFTER.count,
  lockedHint: 'Learn more coins to open this!',
  levels: LEVEL_MONEY,
  introMoney: { 2: ['q'], 3: ['b1', 'b5'] },
  phrases: COUNT_PHRASES,
  makeProblem: makeCount,
  replay: replayCount,
  checkAnswer: checkCount,
  View: CountView,
};
