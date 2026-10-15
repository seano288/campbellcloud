// The Pay the Shop counter: a price tag, the bank of money, the tray he taps it into, ✅ to pay, and
// "Help me pay". Pay the Shop Rounds use it, and so does buying a Legendary Mod in the Garage.
import type { ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';
import { sClink } from '../../audio/sfx';
import type { ProblemActions } from '../../learning/session';
import { biggestFirst, fmt, MONEY, total, type MoneyKey } from '../../money/money';
import { PeekCard } from '../../round/PeekCard';
import { Money } from '../../ui/Money';
import { useVoice, useVoiceScope } from '../../voice/context';
import type { Item } from '../../voice/say';
import type { RoundApi } from '../mode';
import { checkPayInput } from '../session';
import { explainPay, helpPay, payment, promptPay } from './feedback';

const MAX_TRAY = 12; // Help me pay needs at most 8

export interface PayCounterProps {
  price: number;
  bank: readonly MoneyKey[];
  /** What's being bought, on the price tag. */
  icon: ComponentChildren;
  /** The money 👀 shows, and what's said again after it. */
  peekMoney: readonly MoneyKey[];
  speech: Item[];
  actions: ProblemActions<readonly MoneyKey[]>;
  signal: AbortSignal;
}

export interface CheckoutCounterProps extends Omit<PayCounterProps, 'actions' | 'signal'> {
  api: RoundApi;
  /** Told what was in the tray when he paid exactly, before api.correct(). */
  onPaid?: (cents: number) => void;
}

export function CheckoutCounter({ api, onPaid, ...props }: CheckoutCounterProps) {
  const voice = useVoiceScope();
  const actions: ProblemActions<readonly MoneyKey[]> = {
    get busy() { return api.busy || !voice.active; },
    submit(tray) {
      if (actions.busy) return 'ignored';
      const verdict = checkPayInput(props, tray, (result, teach, signal) => explainPay(props, result, teach, signal), promptPay);
      if (verdict.kind === 'correct') { onPaid?.(total(tray)); api.correct(); }
      if (verdict.kind === 'incorrect') api.miss(teach => verdict.explain(teach, voice.signal));
      if (verdict.kind === 'not-an-answer') void verdict.prompt?.(voice.signal);
      return verdict.kind;
    },
    help(run) { if (voice.active) { api.helped(); void run(voice.signal); } },
  };
  return <PayCounter {...props} actions={actions} signal={voice.signal} />;
}

export function PayCounter({ price, bank, icon, peekMoney, speech, actions, signal }: PayCounterProps) {
  const voice = useVoice(), { say } = voice;
  const { tray } = payment(signal); // in the order he tapped them in
  const [peek, setPeek] = useState(false);
  const [done, setDone] = useState(false);
  const run = payment(signal).run; // bumped to stop a Help me pay in progress

  const paid = total(tray.value);
  const sayTotal = (t: MoneyKey[]) => (t.length ? say({ cents: total(t) }) : Promise.resolve());

  function put(k: MoneyKey) {
    if (!voice.active || signal.aborted || actions.busy || done || tray.value.length >= MAX_TRAY) return;
    run.cancel();
    const t = [...tray.value, k];
    tray.value = t;
    sClink();
    void sayTotal(t);
  }
  function takeBack(i = tray.value.length - 1) {
    if (!voice.active || signal.aborted || actions.busy || done || i < 0) return;
    run.cancel();
    const t = tray.value.filter((_, j) => j !== i);
    tray.value = t;
    void sayTotal(t);
  }

  function check() {
    if (!voice.active || signal.aborted || done) return;
    const verdict = actions.submit([...tray.value]);
    if (verdict === 'correct') setDone(true);
    if (verdict === 'not-an-answer') return; // not an answer, so not a miss
  }

  const shown = tray.value.map((k, i) => ({ k, i })).sort((a, b) => biggestFirst(a.k, b.k));

  return (
    <>
      <div class="price-tag"><span class="e">{icon}</span><span class="price">{fmt(price)}</span></div>
      <div class="bank">
        {bank.map(k => <button key={k} class="money-btn" aria-label={MONEY[k].name} onClick={() => put(k)}><Money k={k} /></button>)}
      </div>
      <div class="tray">
        {shown.length ? shown.map(({ k, i }) => (
          <button key={i} class="money-btn" aria-label={`Take back ${MONEY[k].name}`} onClick={() => takeBack(i)}><Money k={k} caption={false} scale={shown.length > 6 ? 0.55 : 0.8} /></button>
        )) : <span class="empty">👇 🪙</span>}
      </div>
      <div class="paidrow">
        <span>🪙 <b>{fmt(paid)}</b></span>
        <button class={`big-btn go ${done ? 'right' : ''}`} aria-label="Pay" onClick={check}><span class="e">✅</span></button>
      </div>
      <div class="helpers">
        <button class="help-btn" onClick={() => actions.help(signal => helpPay({ price, bank }, signal))}>🔎 Help me pay</button>
        <button class="help-btn" aria-label="Take one back" onClick={() => takeBack()}>↩</button>
        <button class="help-btn" aria-label="Show me all the money" onClick={() => actions.help(async () => { run.cancel(); setPeek(true); })}>👀</button>
      </div>
      {peek && <PeekCard money={peekMoney} onDone={() => { if (voice.active && !signal.aborted) { setPeek(false); void say(...speech); } }} />}
    </>
  );
}
