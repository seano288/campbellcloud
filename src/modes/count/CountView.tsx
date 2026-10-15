import { useState } from 'preact/hooks';
import type { ProblemViewProps } from '../../learning/session';
import { fmt, LEVEL_MONEY, MONEY } from '../../money/money';
import { Ask } from '../../round/Ask';
import { PeekCard } from '../../round/PeekCard';
import { Money } from '../../ui/Money';
import { useVoice } from '../../voice/context';
import { speaking, type Item } from '../../voice/say';
import type { Level } from '../ids';
import type { CountProblem } from './count';
import { counting, helpCount } from './feedback';

export function CountView({ problem: p, level, actions, signal }: ProblemViewProps<CountProblem, number> & { level: Level }) {
  const voice = useVoice(), { say } = voice;
  const [wrong, setWrong] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const { counted } = counting(signal); // how many pieces Help me count has lit
  const [peek, setPeek] = useState(false);
  const run = counting(signal).run; // bumped to stop a Help me count in progress

  const speech: Item[] = ['How much money is this?', ...p.choices.map(c => ({ parts: [{ cents: c }], light: `c${c}` }))];

  function tap(c: number) {
    if (!voice.active || signal.aborted || done || wrong.includes(c)) return;
    const verdict = actions.submit(c);
    if (verdict === 'correct') setDone(true);
    if (verdict === 'incorrect') setWrong([...wrong, c]);
  }

  const running = (i: number) => p.pile.slice(0, i + 1).reduce((s, k) => s + MONEY[k].cents, 0);

  return (
    <div class="game">
      <Ask text="How much money is this?" speech={speech} />
      <div class="pile">
        {p.pile.map((k, i) => (
          <div key={i} class={`slot ${i < counted.value ? 'lit' : ''}`}>
            <Money k={k} />
            <div class="run">{i < counted.value ? fmt(running(i)) : ''}</div>
          </div>
        ))}
      </div>
      <div class="choices">
        {p.choices.map(c => (
          <button key={c} class={`choice ${wrong.includes(c) ? 'wrong' : ''} ${done && c === p.total ? 'right' : ''} ${speaking.value === `c${c}` ? 'speaking' : ''}`}
            disabled={wrong.includes(c)} onClick={() => tap(c)}>{fmt(c)}</button>
        ))}
      </div>
      <div class="helpers">
        <button class="help-btn" onClick={() => actions.help(signal => helpCount(p, signal))}>🔎 Help me count</button>
        <button class="help-btn" aria-label="Show me all the money" onClick={() => actions.help(async () => { run.cancel(); setPeek(true); })}>👀</button>
        <button class="help-btn" aria-label="Start again" onClick={() => { if (voice.active && !signal.aborted && !done) { run.cancel(); counted.value = 0; } }}>↩</button>
      </div>
      {peek && <PeekCard money={LEVEL_MONEY[level]} onDone={() => { if (voice.active && !signal.aborted) { setPeek(false); void say(...speech); } }} />}
    </div>
  );
}
