import { render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { createLegendaryCheckout, moneyLegendaryPolicy, type LegendaryCheckout } from '../../src/app/checkout';
import { screenVoice } from '../../src/app/nav';
import { loadGame, player } from '../../src/game/store';
import { Checkout } from '../../src/garage/Checkout';
import { explainPay, promptPay } from '../../src/modes/pay/feedback';
import { createPaymentChallenge } from '../../src/modes/pay/payment';
import { Toast } from '../../src/ui/toast';
import { VoiceContext } from '../../src/voice/context';

const failure = new URL(location.href).searchParams.get('failure');
let release!: () => void;
const pending = new Promise<void>(resolve => { release = resolve; });
const checkouts = createLegendaryCheckout(player, {
  ...moneyLegendaryPolicy,
  payment: (p, signal, accept) => createPaymentChallenge(p, signal, accept, {
    prompt: promptPay,
    explain(...args) {
      document.getElementById('explanation-failure')!.textContent = failure;
      if (failure === 'throw') throw new Error('Checkout explanation failed');
      if (failure === 'reject') return Promise.reject(new Error('Checkout explanation failed'));
      return pending.then(() => {
        if (failure === 'late-reject') throw new Error('Late checkout explanation failed');
        return explainPay(...args);
      });
    },
  }),
});

function CheckoutFixture() {
  const [checkout, setCheckout] = useState<LegendaryCheckout | null>(null);
  function open() {
    const opened = checkouts.open('tires:4', screenVoice.value.signal, () => {
      document.getElementById('checkout-paid')!.textContent = 'completed';
      setCheckout(null);
    });
    if (opened.kind === 'ready') setCheckout(opened.checkout);
  }
  useEffect(open, []);
  return (
    <>
      <button onClick={open}>Replace checkout</button>
      <button onClick={release}>Release teaching</button>
      <button onClick={() => player.commit(state => ({
        ...state, learning: { ...state.learning, modes: { ...state.learning.modes, pay: { ...state.learning.modes.pay, level: 3 } } },
      }))}>Use context 3</button>
      {checkout && <Checkout key={checkout.id} checkout={checkout} onClose={() => setCheckout(null)} />}
      <Toast />
    </>
  );
}

void loadGame().then(() => render(
  <VoiceContext.Provider value={screenVoice.value}><CheckoutFixture /></VoiceContext.Provider>,
  document.getElementById('fixture')!,
));
