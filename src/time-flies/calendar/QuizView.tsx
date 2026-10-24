// A calendar question on screen: the question (read aloud, 🔊 says it again), three answers that light up as they're
// read, and, while it's taught, the week or the year as a strip of chips, or the Time Fact written out.
import { useState } from 'preact/hooks';
import type { ProblemInstance } from '../../learning/round';
import { Ask } from '../clock/views';
import { speaking, useVoice, type Item } from '../voice';
import { DAYS, MONTHS, type QuizProblem, type QuizWord } from './calendar';
import { helpQuiz, quizLessonFor } from './feedback';

export function QuizView({ current }: { current: ProblemInstance<QuizProblem, string> }) {
  const voice = useVoice(), p = current.problem, lesson = quizLessonFor(current.signal);
  const [wrong, setWrong] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const speech: Item[] = [p.ask, ...p.choices.map(c => ({ parts: [c], light: `q${c}` }))];
  function tap(c: QuizWord) {
    if (!voice.active || current.signal.aborted || done || wrong.includes(c)) return;
    const verdict = current.actions.submit(c);
    if (verdict === 'correct') setDone(true);
    if (verdict === 'incorrect') setWrong([...wrong, c]);
  }
  const strip = lesson.strip.value, lit = lesson.lit.value, fact = lesson.fact.value;
  return (
    <div class="game quiz">
      <Ask text={p.ask} speech={speech} />
      {strip && (
        <div class={`strip ${strip.kind}`}>
          {(strip.kind === 'week' ? DAYS : MONTHS).map((name, i) => (
            <span key={name} class={`chip ${lit === name ? 'lit' : ''}`}>
              {strip.kind === 'year' && strip.numbers && <b>{i + 1}</b>}
              {name.slice(0, 3)}
            </span>
          ))}
        </div>
      )}
      {fact && <div class="fact">{fact}</div>}
      <div class="choices words">
        {p.choices.map(c => (
          <button key={c} class={`choice ${wrong.includes(c) ? 'wrong' : ''} ${done && c === p.answer ? 'right' : ''} ${speaking.value === `q${c}` ? 'speaking' : ''} ${lit === c ? 'lit' : ''}`}
            disabled={wrong.includes(c)} onClick={() => tap(c)}>{c}</button>
        ))}
      </div>
      <div class="helpers"><button class="help-btn" onClick={() => current.actions.help(signal => helpQuiz(p, signal))}>🔎 Help</button></div>
    </div>
  );
}
