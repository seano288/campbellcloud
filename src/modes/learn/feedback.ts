import { signal, type Signal } from '@preact/signals';
import { MONEY, type MoneyKey } from '../../money/money';
import { toast } from '../../ui/toast';
import { moneyIs } from '../phrases';
import type { Phrase } from '../../voice/phrases';
import { createVoiceScope } from '../../voice/say';
import { dimeTip, type LearnProblem } from './learn';

const hints = new WeakMap<AbortSignal, Signal<boolean>>();

export function learnHint(lifetime: AbortSignal) {
  let hint = hints.get(lifetime);
  if (!hint) { hint = signal(false); hints.set(lifetime, hint); }
  return hint;
}

export async function explainLearn(p: LearnProblem, answer: MoneyKey, teach: boolean, signal: AbortSignal) {
  if (signal.aborted) return;
  if (teach) learnHint(signal).value = true;
  const voice = createVoiceScope(signal), t = MONEY[p.target], m = MONEY[answer];
  if ('choices' in p) return toast(voice, 'Try again!', 'Try again!');
  if (p.kind === 'find') return toast(voice, `That's a ${m.name}. Find the ${t.name}!`, `That's a ${m.name}.`, `Find the ${t.name}!`);
  const lines: Phrase[] = [moneyIs(p.target), moneyIs(answer)];
  if (dimeTip(answer, p.target)) lines.push('The dime is small, but it is worth more!');
  await toast(voice, lines.join(' '), ...lines);
}
