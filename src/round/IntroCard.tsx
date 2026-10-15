// "Look! New money!" before the first Round at a new Level.
import { useEffect } from 'preact/hooks';
import { MONEY, type MoneyKey } from '../money/money';
import { Money } from '../ui/Money';
import { moneyIs } from '../voice/phrases';
import { useVoiceScope } from '../voice/context';
import { speaking } from '../voice/say';

export function IntroCard({ money, onGo, signal }: { money: readonly MoneyKey[]; onGo: () => void; signal?: AbortSignal }) {
  const voice = useVoiceScope(signal), { say } = voice;
  useEffect(() => {
    void say('Look!', 'New money!', ...money.map(k => ({ parts: [`This is a ${MONEY[k].name}.`, `It is worth ${MONEY[k].value}.`] as const, light: k })));
  }, []);
  return (
    <div class="modal">
      <div class="modal-card">
        <h2>New money!</h2>
        <div class="intro-money">
          {money.map(k => (
            <button key={k} class={`money-btn ${speaking.value === k ? 'speaking' : ''}`} aria-label={MONEY[k].name}
              onClick={() => void say({ parts: [moneyIs(k)], light: k })}>
              <Money k={k} scale={2} />
            </button>
          ))}
        </div>
        <button class="big-btn go" aria-label="Play" onClick={() => { if (voice.active) { voice.cancel(); onGo(); } }}><span class="e">▶</span></button>
      </div>
    </div>
  );
}
