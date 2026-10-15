import { useState } from 'preact/hooks';
import { sCount } from '../../audio/sfx';
import { fmt, LEVEL_MONEY, MONEY } from '../../money/money';
import { Ask } from '../../round/Ask';
import { PeekCard } from '../../round/PeekCard';
import { Money } from '../../ui/Money';
import { toast } from '../../ui/toast';
import { useVoice, useVoiceTask } from '../../voice/context';
import { speaking, type Item } from '../../voice/say';
import type { ModeViewProps } from '../mode';
import { checkCount, type CountProblem } from './count';

export function CountView({ problem: p, level, api }: ModeViewProps<CountProblem>) {
  const voice = useVoice(), { say } = voice;
  const [wrong, setWrong] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const [counted, setCounted] = useState(0); // how many pieces Help me count has lit
  const [peek, setPeek] = useState(false);
  const run = useVoiceTask(); // bumped to stop a Help me count in progress

  const speech: Item[] = ['How much money is this?', ...p.choices.map(c => ({ parts: [{ cents: c }], light: `c${c}` }))];

  async function helpCount(task = run.start()) {
    if (!task.active) return;
    api.helped();
    setCounted(0);
    let sum = 0;
    for (let i = 0; i < p.pile.length; i++) {
      if (!task.active) return;
      sum += MONEY[p.pile[i]!].cents;
      setCounted(i + 1);
      sCount(i);
      await task.say({ cents: sum });
      await task.wait(250);
    }
  }

  function tap(c: number) {
    if (!voice.active || api.busy || done || wrong.includes(c)) return;
    if (checkCount(p, c)) { run.cancel(); voice.cancel(); setDone(true); return api.correct(); }
    setWrong([...wrong, c]);
    api.miss(async teach => {
      const task = run.start();
      await toast(task, teach ? "Not quite! Let's count together." : 'Not quite!', 'Not quite!', ...(teach ? ["Let's count together." as const] : []));
      if (teach && task.active) await helpCount(task);
    });
  }

  const running = (i: number) => p.pile.slice(0, i + 1).reduce((s, k) => s + MONEY[k].cents, 0);

  return (
    <div class="game">
      <Ask text="How much money is this?" speech={speech} />
      <div class="pile">
        {p.pile.map((k, i) => (
          <div key={i} class={`slot ${i < counted ? 'lit' : ''}`}>
            <Money k={k} />
            <div class="run">{i < counted ? fmt(running(i)) : ''}</div>
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
        <button class="help-btn" onClick={() => void helpCount()}>🔎 Help me count</button>
        <button class="help-btn" aria-label="Show me all the money" onClick={() => { run.cancel(); api.helped(); setPeek(true); }}>👀</button>
        <button class="help-btn" aria-label="Start again" onClick={() => { run.cancel(); setCounted(0); }}>↩</button>
      </div>
      {peek && <PeekCard money={LEVEL_MONEY[level]} onDone={() => { setPeek(false); void say(...speech); }} />}
    </div>
  );
}
