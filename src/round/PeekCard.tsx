// 👀 Show me all the money: every piece of the Level's money, each one tappable to hear its name and value.
import { useEffect } from 'preact/hooks';
import { MONEY, type MoneyKey } from '../money/money';
import { Money } from '../ui/Money';
import { moneyIs } from '../modes/phrases';
import { useVoiceScope } from '../voice/context';
import { speaking } from '../voice/say';

export function PeekCard({ money, onDone }: { money: readonly MoneyKey[]; onDone: () => void }) {
  const voice = useVoiceScope(), { say } = voice;
  useEffect(() => { void say('Tap a coin to hear its name.'); }, []);
  return (
    <div class="modal">
      <div class="modal-card">
        <div class="intro-money">
          {money.map(k => (
            <button key={k} class={`money-btn ${speaking.value === k ? 'speaking' : ''}`} aria-label={MONEY[k].name} onClick={() => void say({ parts: [moneyIs(k)], light: k })}>
              <Money k={k} />
            </button>
          ))}
        </div>
        <button class="big-btn go" aria-label="Done" onClick={() => { voice.cancel(); onDone(); }}><span class="e">👍</span></button>
      </div>
    </div>
  );
}
