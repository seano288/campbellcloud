import { signal, type Signal } from '@preact/signals';
import { sCount } from '../../audio/sfx';
import { fmt, MONEY } from '../../money/money';
import { toast } from '../../ui/toast';
import { createVoiceTask, type VoiceScope } from '../../voice/say';
import type { CountProblem } from './count';

const feedback = new WeakMap<AbortSignal, { counted: Signal<number>; run: ReturnType<typeof createVoiceTask> }>();

export function counting(lifetime: AbortSignal) {
  let state = feedback.get(lifetime);
  if (!state) {
    state = { counted: signal(0), run: createVoiceTask(lifetime) };
    feedback.set(lifetime, state);
  }
  return state;
}

async function countAlong(p: CountProblem, lifetime: AbortSignal, task: VoiceScope) {
  if (!task.active) return;
  const state = counting(lifetime);
  state.counted.value = 0;
  let sum = 0;
  for (let i = 0; i < p.pile.length; i++) {
    if (!task.active) return;
    sum += MONEY[p.pile[i]!].cents;
    state.counted.value = i + 1;
    sCount(i);
    await task.say({ cents: sum });
    await task.wait(250);
  }
}

export const helpCount = (p: CountProblem, lifetime: AbortSignal) => countAlong(p, lifetime, counting(lifetime).run.start());

export async function explainCount(p: CountProblem, _answer: number, teach: boolean, lifetime: AbortSignal) {
  const task = counting(lifetime).run.start();
  await toast(task, teach ? "Not quite! Let's count together." : 'Not quite!', 'Not quite!', ...(teach ? ["Let's count together." as const] : []));
  if (teach && task.active) await countAlong(p, lifetime, task);
  // change: what he paid (just counted), take away the price, is what comes back
  if (teach && p.change && task.active) {
    await task.wait(300);
    if (task.active) await toast(task, `It costs ${fmt(p.change.price)}. Your change is ${fmt(p.total)}.`, 'It costs', { cents: p.change.price }, 'Your change is', { cents: p.total });
  }
}
