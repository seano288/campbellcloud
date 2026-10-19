// "Look! New money!" before the first Round at a new Level, or what's new to do at Levels 4 and 5.
import { useEffect } from 'preact/hooks';
import { MONEY, type MoneyKey } from '../money/money';
import { Money } from '../ui/Money';
import { moneyIs } from '../money/phrases';
import { useVoiceScope } from '../voice/context';
import { speaking } from '../voice/say';
import type { Phrase } from '../voice/phrases';

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

/** Levels 4 and 5 bring no new money: the card says what's new to do instead. */
export function LevelCard({ icon, level, line, onGo, signal }: { icon: string; level: number; line: Phrase; onGo: () => void; signal?: AbortSignal }) {
  const voice = useVoiceScope(signal), { say } = voice;
  useEffect(() => { void say('Level up!', line); }, []);
  return (
    <div class="modal">
      <div class="modal-card">
        <h2>Level {level}!</h2>
        <div class="intro-money"><button class="money-btn level-icon" aria-label="Say it again" onClick={() => void say(line)}>{icon}</button></div>
        <p class="level-line">{line}</p>
        <button class="big-btn go" aria-label="Play" onClick={() => { if (voice.active) { voice.cancel(); onGo(); } }}><span class="e">▶</span></button>
      </div>
    </div>
  );
}
