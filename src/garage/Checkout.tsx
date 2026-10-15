// Buying a Legendary: Pay the Shop's counter with the Mod as the shop item. He taps money into the tray until it
// adds up to the price; short and over get the same replies as in Pay the Shop, and after two misses Help me pay
// steps in by itself. Paying exactly buys it. The price and the money are his Pay the Shop Level's, set when it opens;
// unlike Pay the Shop, Level 3 keeps the $5 bill, since Legendaries there cost up to $8.80.
import { useState } from 'preact/hooks';
import { sBad } from '../audio/sfx';
import type { RoundApi } from '../modes/mode';
import { CheckoutCounter } from '../modes/pay/PayCounter';
import type { Level } from '../modes/ids';
import { fmt, LEVEL_MONEY } from '../money/money';
import { Ask } from '../round/Ask';
import { TEACH_ON_MISS } from '../round/rules';
import { useVoiceScope, VoiceContext } from '../voice/context';
import { LEGENDARY, modName, type SlotId } from './catalog';
import { costLines, legendaryPrice } from './garage';
import { PartIcon } from './icons';

/** onPaid gets the tray's total and the Level it was priced at, which unlock() checks against the price. */
export function Checkout({ slot, level, onPaid, onClose }: { slot: SlotId; level: Level; onPaid: (cents: number, level: Level) => void; onClose: () => void }) {
  const voice = useVoiceScope();
  const [misses, setMisses] = useState(0);
  const cents = legendaryPrice(slot, level), speech = costLines(slot, level), bank = LEVEL_MONEY[level];
  const api: RoundApi = {
    correct: () => {},
    miss: explain => { sBad(); setMisses(n => n + 1); void explain(misses + 1 >= TEACH_ON_MISS); },
    helped: () => {},
    busy: false,
  };
  return (
    <VoiceContext.Provider value={voice}>
      <div class="modal checkout">
        <div class="modal-card checkout-card">
          <button class="x" aria-label="Close" onClick={() => { voice.cancel(); onClose(); }}>✕</button>
          <div class="game">
            <Ask text={`${modName(slot, LEGENDARY)} costs ${fmt(cents)}`} speech={speech} />
            <CheckoutCounter price={cents} bank={bank} icon={<PartIcon slot={slot} rung={LEGENDARY} />} peekMoney={bank} speech={speech} api={api} onPaid={c => { voice.cancel(); onPaid(c, level); }} />
          </div>
        </div>
      </div>
    </VoiceContext.Provider>
  );
}
