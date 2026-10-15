import { player, loadGame } from '../game/store';
import { countSession, learnSession, paySession } from '../modes/session';
import { countAnswer } from '../trophies/rules';
import { createLegendaryCheckout, moneyLegendaryPolicy } from './checkout';
import { createPractice, moneyEarnings } from './practice';
import { completeTrophies } from './trophies';

export const moneyApp = {
  store: player,
  load: loadGame,
  subject: { learn: learnSession, count: countSession, pay: paySession },
  practice: createPractice(player, {
    earnings: moneyEarnings,
    trophies: completeTrophies,
    streak: countAnswer,
  }),
  checkout: createLegendaryCheckout(player, moneyLegendaryPolicy),
};
