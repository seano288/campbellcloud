import { LEVEL_MONEY, type MoneyKey } from '../../money/money';
import type { ProblemViewProps } from '../../learning/session';
import { Ask } from '../../round/Ask';
import type { Item } from '../../voice/say';
import type { Level } from '../ids';
import type { PayProblem } from './pay';
import { PayCounter } from './PayCounter';

export function PayView({ problem: p, level, actions, signal }: ProblemViewProps<PayProblem, readonly MoneyKey[]> & { level: Level }) {
  const buy = `Buy the ${p.item.name}!` as const;
  const speech: Item[] = [buy, 'It costs', { cents: p.price }, ...(p.fewest ? ['Use as few coins as you can!'] as const : [])];
  return (
    <div class="game">
      <Ask text={buy} speech={speech} />
      {p.fewest && <div class="fewest">Use as few coins as you can!</div>}
      <PayCounter price={p.price} bank={p.bank} icon={p.item.icon} peekMoney={LEVEL_MONEY[level]} speech={speech} actions={actions} signal={signal} />
    </div>
  );
}
