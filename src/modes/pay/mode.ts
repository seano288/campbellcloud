import { LEVEL_MONEY } from '../../money/money';
import { PAY_PHRASES } from '../phrases';
import { OPENS_AFTER } from '../chain';
import type { GameMode } from '../mode';
import { makePay, type PayProblem } from './pay';
import { checkPay } from '../../money/payment';
import { PayView } from './PayView';

export const payMode: GameMode<PayProblem, Parameters<typeof checkPay>[1]> = {
  id: 'pay',
  name: 'Pay the Shop',
  icon: '🛒',
  opensAfter: OPENS_AFTER.pay,
  lockedHint: 'Count more cash to open this!',
  levels: LEVEL_MONEY,
  introMoney: { 2: ['q'], 3: ['b1'] }, // no $5 bill: no price needs one
  phrases: PAY_PHRASES,
  makeProblem: makePay,
  replay: p => p, // the same thing at the same price, with an empty tray
  checkAnswer: (p, tray) => checkPay(p, tray).kind === 'paid',
  View: PayView,
};
