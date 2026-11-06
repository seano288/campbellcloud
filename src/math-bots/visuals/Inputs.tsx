// How he answers, always by tapping: three number buttons, the 0 to 20 strip, two wheels, or a pair of words. The strip never
// changes shape, and every tap says the number.
import { useState } from 'preact/hooks';
import { digits, turnWheel, type Wheel } from '../../garage/doorNumber';
import { said } from '../numbers/say';
import { useVoice } from '../voice';
import { cls } from './Pictures';

export const STRIP = Array.from({ length: 21 }, (_, n) => n);

export interface Tapped { wrong: readonly string[]; done: string | null; tap(value: string): void; ready: boolean }

export function Choices({ choices, on }: { choices: readonly number[]; on: Tapped }) {
  return (
    <div class="choices three">
      {choices.map(n => (
        <button key={n} class={cls('choice', on.wrong.includes(String(n)) && 'wrong', on.done === String(n) && 'right')}
          disabled={on.wrong.includes(String(n))} onClick={() => on.tap(String(n))}>{n}</button>
      ))}
    </div>
  );
}

export function Strip({ on, lit }: { on: Tapped; lit?: number | null }) {
  return (
    <div class={cls('strip', !on.ready && 'waiting')} role="group" aria-label="Number strip">
      {STRIP.map(n => (
        <button key={n} class={cls('num', on.wrong.includes(String(n)) && 'wrong', on.done === String(n) && 'right', lit === n && 'lit')}
          aria-label={String(n)} onClick={() => on.tap(String(n))}>{n}</button>
      ))}
    </div>
  );
}

/** Two wheels, tens and ones, then ✓. Each turn says the number. */
export function Wheels({ on }: { on: Tapped }) {
  const voice = useVoice();
  const [n, setN] = useState(0), [tens, ones] = digits(n);
  function turn(w: Wheel, dir: 1 | -1) {
    const next = turnWheel(n, w, dir);
    setN(next);
    void voice.say(said(next));
  }
  return (
    <div class="wheels">
      <div class="numwheels">
        {([['tens', tens], ['ones', ones]] as const).map(([w, d]) => (
          <div key={w} class="numwheel">
            <button aria-label={`${w} up`} onClick={() => turn(w, 1)}>▲</button>
            <div class="digit">{d}</div>
            <button aria-label={`${w} down`} onClick={() => turn(w, -1)}>▼</button>
          </div>
        ))}
      </div>
      <button class="choice done-btn" aria-label="Done" onClick={() => on.tap(String(n))}>✓</button>
    </div>
  );
}
