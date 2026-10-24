// The three clock questions on screen. Every question is spoken as it appears (🔊 says it again), every answer button reads
// aloud while it lights up, and 🔎 Help walks through the clock with the hands lit up.
import { useEffect, useState } from 'preact/hooks';
import type { ProblemInstance } from '../../learning/round';
import type { ChoiceProblem, SetProblem } from '../learning';
import { speaking, useVoice, type Item } from '../voice';
import { ClockFace } from './ClockFace';
import { timePhrase } from './speech';
import { helpTime, lessonFor } from './teach';
import { digital, fromMinutes, minutesOf, sameTime, snap, STEP, type ClockTime, type Level } from './time';

export function Ask({ text, speech }: { text: string; speech: Item[] }) {
  const { say } = useVoice();
  useEffect(() => { void say(...speech); }, []);
  return (
    <div class="ask">
      <button class="say-btn" aria-label="Say it again" onClick={() => void say(...speech)}>🔊</button>
      <h2>{text}</h2>
    </div>
  );
}

function Help({ current, target }: { current: ProblemInstance<unknown, unknown>; target: ClockTime }) {
  return <button class="help-btn" onClick={() => current.actions.help(signal => helpTime(target, signal))}>🔎 Help</button>;
}

/** Find the Clock: three clocks, one shows the time he hears. */
export function FindView({ current, level }: { current: ProblemInstance<ChoiceProblem, string>; level: Level }) {
  const voice = useVoice(), p = current.problem, lesson = lessonFor(current.signal);
  const [wrong, setWrong] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const right = p.choices.findIndex(c => sameTime(c, p.target));
  function tap(i: number) {
    if (!voice.active || current.signal.aborted || done || wrong.includes(i)) return;
    const verdict = current.actions.submit(digital(p.choices[i]!));
    if (verdict === 'correct') setDone(true);
    if (verdict === 'incorrect') setWrong([...wrong, i]);
  }
  const picked = lesson.pick.value;
  return (
    <div class="game">
      <Ask text={`Find ${digital(p.target)}`} speech={['Find this time!', timePhrase(p.target)]} />
      <div class="clocks"><div class="clocks-in">
        {p.choices.map((c, i) => (
          <button key={digital(c)} class={`clock-btn ${wrong.includes(i) ? 'wrong' : ''} ${done && i === right ? 'right' : ''} ${picked === i ? 'lit' : ''}`}
            aria-label={`Clock ${i + 1}`} data-time={digital(c)} disabled={wrong.includes(i)} onClick={() => tap(i)}>
            <ClockFace minutes={minutesOf(c)} lesson={picked === i ? lesson : undefined} minuteLabels={level === 3 && picked === i && lesson.fives.value > 0} />
          </button>
        ))}
      </div></div>
      <div class="helpers"><Help current={current} target={p.target} /></div>
    </div>
  );
}

/** Read the Clock: one clock, three written times read aloud. */
export function ReadView({ current }: { current: ProblemInstance<ChoiceProblem, string> }) {
  const voice = useVoice(), p = current.problem, lesson = lessonFor(current.signal);
  const [wrong, setWrong] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const speech: Item[] = ['What time is it?', ...p.choices.map(c => ({ parts: [timePhrase(c)], light: `t${digital(c)}` }))];
  function tap(c: ClockTime) {
    const key = digital(c);
    if (!voice.active || current.signal.aborted || done || wrong.includes(key)) return;
    const verdict = current.actions.submit(key);
    if (verdict === 'correct') setDone(true);
    if (verdict === 'incorrect') setWrong([...wrong, key]);
  }
  return (
    <div class="game read">
      <Ask text="What time is it?" speech={speech} />
      <div class="big-clock"><ClockFace minutes={minutesOf(p.target)} lesson={lesson} /></div>
      <div class="choices times">
        {p.choices.map(c => {
          const key = digital(c);
          return (
            <button key={key} class={`choice ${wrong.includes(key) ? 'wrong' : ''} ${done && sameTime(c, p.target) ? 'right' : ''} ${speaking.value === `t${key}` ? 'speaking' : ''}`}
              disabled={wrong.includes(key)} onClick={() => tap(c)}>{key}</button>
          );
        })}
      </div>
      <div class="helpers"><Help current={current} target={p.target} /></div>
    </div>
  );
}

/** Set the Clock: drag the hands to the time he hears, then ✓. */
export function SetView({ current, level }: { current: ProblemInstance<SetProblem, string>; level: Level }) {
  const voice = useVoice(), p = current.problem, lesson = lessonFor(current.signal);
  const [minutes, setMinutes] = useState(minutesOf(p.start));
  const [moved, setMoved] = useState(false);
  const [done, setDone] = useState(false);
  const shown = lesson.show.value;
  // teaching moves the hands forward to the right time (the nearest way round, never backwards past 12)
  useEffect(() => {
    if (!shown) return;
    const want = minutesOf(shown), now = snap(minutes, level);
    setMinutes(now + ((((want - now) % 720) + 720) % 720));
  }, [shown]);
  function turn(m: number, end: boolean) {
    if (!voice.active || current.signal.aborted || done || current.actions.busy) return;
    setMoved(true);
    setMinutes(end ? snap(m, level) : m);
  }
  function check() {
    if (!voice.active || current.signal.aborted || done) return;
    if (!moved && !shown) { void voice.say('Move the hands!'); return; }
    const verdict = current.actions.submit(digital(fromMinutes(snap(minutes, level))));
    if (verdict === 'correct') setDone(true);
  }
  return (
    <div class="game set">
      <Ask text={`Make ${digital(p.target)}`} speech={['Make the clock say', timePhrase(p.target)]} />
      <div class={`big-clock ${done ? 'right' : ''}`}>
        <ClockFace minutes={minutes} lesson={lesson} onTurn={turn} step={STEP[level]} />
      </div>
      <div class="helpers">
        <Help current={current} target={p.target} />
        <button class="big-btn go check-btn" aria-label="Done" onClick={check}>✓</button>
      </div>
    </div>
  );
}
