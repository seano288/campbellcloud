// Buying a Legendary: Pay the Shop's counter with the Mod as the shop item. He taps money into the tray until it
// adds up to the price; short and over get the same replies as in Pay the Shop, and after two misses Help me pay
// steps in by itself. Paying exactly buys it. The price and the money are his Pay the Shop Level's, set when it opens;
// unlike Pay the Shop, Level 3 keeps the $5 bill, since Legendaries there cost up to $8.80.
import { useLayoutEffect } from 'preact/hooks';
import type { LegendaryCheckout } from '../app/checkout';
import { PayCounter } from '../modes/pay/PayCounter';
import { fmt } from '../money/money';
import { Ask } from '../round/Ask';
import { useVoiceScope, VoiceContext } from '../voice/context';
import type { Item } from '../voice/say';
import { LEGENDARY, parseMod, slotById } from './catalog';
import { PartIcon } from './icons';

export function Checkout({ checkout, onClose }: { checkout: LegendaryCheckout; onClose: () => void }) {
  const voice = useVoiceScope(checkout.signal);
  useLayoutEffect(() => checkout.close, [checkout]);
  const { slot } = parseMod(checkout.item), { cents, bank, actions, signal } = checkout;
  const name = slotById(slot).mods[LEGENDARY];
  const speech: Item[] = [`${name} costs`, { cents }];
  return (
    <VoiceContext.Provider value={voice}>
      <div class="modal checkout">
        <div class="modal-card checkout-card">
          <button class="x" aria-label="Close" onClick={() => { checkout.close(); onClose(); }}>✕</button>
          <div class="game">
            <Ask text={`${name} costs ${fmt(cents)}`} speech={speech} />
            <PayCounter price={cents} bank={bank} icon={<PartIcon slot={slot} rung={LEGENDARY} />} peekMoney={bank} speech={speech} actions={actions} signal={signal} />
          </div>
        </div>
      </div>
    </VoiceContext.Provider>
  );
}
