import { signal, type Signal } from '@preact/signals';
import { sClink } from '../../audio/sfx';
import { fmt, total, type MoneyKey } from '../../money/money';
import { toast } from '../../ui/toast';
import { createVoiceScope, createVoiceTask, type VoiceScope } from '../../voice/say';
import { helpPayCoins, type PayCheck, type PayProblem } from './pay';

const feedback = new WeakMap<AbortSignal, { tray: Signal<MoneyKey[]>; run: ReturnType<typeof createVoiceTask> }>();

export function payment(lifetime: AbortSignal) {
  let state = feedback.get(lifetime);
  if (!state) {
    state = { tray: signal<MoneyKey[]>([]), run: createVoiceTask(lifetime) };
    feedback.set(lifetime, state);
  }
  return state;
}

async function fill(p: Pick<PayProblem, 'price' | 'bank'>, lifetime: AbortSignal, task: VoiceScope) {
  if (!task.active) return;
  const state = payment(lifetime);
  state.tray.value = [];
  const tray: MoneyKey[] = [];
  for (const k of helpPayCoins(p.price, p.bank)) {
    if (!task.active) return;
    tray.push(k);
    state.tray.value = [...tray];
    sClink();
    await task.say({ cents: total(tray) });
    await task.wait(250);
  }
}

export const helpPay = (p: Pick<PayProblem, 'price' | 'bank'>, lifetime: AbortSignal) => fill(p, lifetime, payment(lifetime).run.start());

export async function explainPay(p: Pick<PayProblem, 'price' | 'bank'>, result: Extract<PayCheck, { kind: 'short' | 'over' }>, teach: boolean, lifetime: AbortSignal) {
  const task = payment(lifetime).run.start();
  await (result.kind === 'short'
    ? toast(task, `Almost! You need ${fmt(result.by)} more.`, 'Almost!', 'You need', { cents: result.by }, 'more')
    : toast(task, `Too much! Take back ${fmt(result.by)}.`, 'Too much!', 'Take back', { cents: result.by }));
  if (teach && task.active) await fill(p, lifetime, task);
}

export const promptPay = (lifetime: AbortSignal) => toast(createVoiceScope(lifetime), 'Tap some money first!', 'Tap some money first!');
