import { useState } from 'preact/hooks';
import { MONEY, type MoneyKey } from '../../money/money';
import { Ask } from '../../round/Ask';
import { Money } from '../../ui/Money';
import { toast } from '../../ui/toast';
import { moneyIs, type Phrase } from '../../voice/phrases';
import { useVoice } from '../../voice/context';
import { speaking, type Item } from '../../voice/say';
import type { ModeViewProps } from '../mode';
import { checkLearn, dimeTip, type LearnProblem } from './learn';

const PROMPT = {
  name: 'What is this called?', value: 'How much is this worth?', more: 'Which is worth more?', less: 'Which is worth less?',
} as const;

export function LearnView({ problem: p, api }: ModeViewProps<LearnProblem>) {
  const voice = useVoice();
  const [wrong, setWrong] = useState<MoneyKey[]>([]);
  const [done, setDone] = useState(false);
  const [hint, setHint] = useState(false); // struggle help: show every name and value, and point at the answer

  const prompt: Phrase = p.kind === 'find' ? `Tap the ${MONEY[p.target].name}!` : PROMPT[p.kind];
  const heading = p.kind === 'more' ? 'Which is worth MORE?' : p.kind === 'less' ? 'Which is worth LESS?' : prompt;
  const choiceLine = (k: MoneyKey): Phrase => (p.kind === 'name' ? `${MONEY[k].name}?` : `${MONEY[k].value}?`);
  const speech: Item[] = [prompt, ...('choices' in p ? p.choices.map(k => ({ parts: [choiceLine(k)], light: k })) : [])];

  function tap(k: MoneyKey) {
    if (!voice.active || api.busy || done || wrong.includes(k)) return;
    if (checkLearn(p, k)) { voice.cancel(); setDone(true); return api.correct(); }
    setWrong([...wrong, k]);
    api.miss(teach => {
      if (teach) { api.helped(); setHint(true); }
      const t = MONEY[p.target], m = MONEY[k];
      if ('choices' in p) return toast(voice, 'Try again!', 'Try again!');
      if (p.kind === 'find') return toast(voice, `That's a ${m.name}. Find the ${t.name}!`, `That's a ${m.name}.`, `Find the ${t.name}!`);
      const lines: Phrase[] = [moneyIs(p.target), moneyIs(k)];
      if (dimeTip(k, p.target)) lines.push('The dime is small, but it is worth more!');
      return toast(voice, lines.join(' '), ...lines);
    });
  }

  const reveal = (k: MoneyKey) => done || hint || wrong.includes(k);
  const cls = (k: MoneyKey) => `${wrong.includes(k) ? 'nope' : ''} ${done && k === p.target ? 'right' : ''} ${hint && !done && k === p.target ? 'hint' : ''}`;

  return (
    <div class="game">
      <Ask text={heading} speech={speech} />
      {'choices' in p ? (
        <>
          <div class="pile learn"><Money k={p.target} caption={done || hint} scale={2} /></div>
          <div class="choices">
            {p.choices.map(k => (
              <button key={k} class={`choice ${wrong.includes(k) ? 'wrong' : ''} ${done && k === p.target ? 'right' : ''} ${hint && !done && k === p.target ? 'hint' : ''} ${speaking.value === k ? 'speaking' : ''}`}
                disabled={wrong.includes(k)} onClick={() => tap(k)}>
                {p.kind === 'name' ? MONEY[k].name : MONEY[k].value}
              </button>
            ))}
          </div>
        </>
      ) : (
        <div class="pile learn">
          {p.options.map(k => (
            <button key={k} class={`money-btn ${cls(k)}`} aria-label={MONEY[k].name} onClick={() => tap(k)}>
              <Money k={k} caption={reveal(k)} scale={p.kind === 'find' ? 1.6 : 1.9} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
