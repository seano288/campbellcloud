// The questions on screen. The short story that frames a sum is said once as it appears (🔊 says it again); the numbers in the sum and
// on the buttons are not read out, since he reads numbers (the parent's call for Math Bots). Taps wait until the story has been said.
// Sums are written across, never stacked. Boarding, Unload and Missing Bags are answered on number wheels; Jumbo and Ten Hops by a tap.
// The lesson for a miss (sums/teach.ts) draws on the same picture, and its fuller walk-through waits on the big arrow.
import { useEffect, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { sClink, sNope } from '../audio/sfx';
import type { ProblemInstance } from '../learning/round';
import type { Asking, Meet } from './mix';
import { sayNum, type Phrase } from './phrases';
import { MatView, RunwayLine } from './sums/pictures';
import { digitsOf, sumText, type HopProblem, type HundredsProblem, type Sign, type WheelProblem } from './sums/problems';
import { help, hopLine, lessonFor, matOf, type Lesson } from './sums/teach';
import { useVoice, type Item } from './voice';

type Current = ProblemInstance<Asking, string>;
const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');
const n = (x: number) => sayNum(x);

/** Says the question once, and marks when it's done. */
function useAsked(current: { signal: AbortSignal }, speech: readonly Item[]) {
  const voice = useVoice();
  const [ready, setReady] = useState(false);
  useEffect(() => { void voice.say(...speech).then(() => { if (!current.signal.aborted) setReady(true); }); }, []);
  return ready;
}

/** The big arrow the fuller lesson waits on: he taps it to go to the next step. */
function NextArrow({ lesson }: { lesson: Lesson }) {
  if (!lesson.waiting.value) return null;
  return <button class="jw-next pulse" aria-label="Next step" onClick={() => lesson.advance()}>➜</button>;
}

/** `ready`: the question has been said and taps count (the browser tour waits on it, as he does). */
function Shell({ current, kind, text, speech, stage, controls, ready, lesson }: {
  current: Current; kind: string; text: ComponentChildren; speech: readonly Item[]; stage: ComponentChildren; controls?: ComponentChildren; ready: boolean; lesson: Lesson;
}) {
  const voice = useVoice();
  return (
    <div class={cls('game', 'jw', ...kind.split(' ').map(k => `k-${k}`))} data-ready={ready ? 'yes' : 'no'} data-lesson={lesson.waiting.value ? 'next' : 'no'}>
      <div class="ask">
        <button class="say-btn" aria-label="Say it again" onClick={() => void voice.say(...speech)}>🔊</button>
        <h2>{text}</h2>
        <button class="help-btn" aria-label="Help" onClick={() => current.actions.help(() => help(current.problem, current.signal))}>🔎</button>
      </div>
      <div class="jw-body">
        <div class="jw-stage">{stage}<NextArrow lesson={lesson} /></div>
        {controls && <div class="jw-controls">{controls}</div>}
      </div>
    </div>
  );
}

/** Taps for a choice-style question: one tap, one answer, the wrong ones fade. */
function useChoice(current: Current, ready: boolean, waiting: boolean) {
  const [wrong, setWrong] = useState<string[]>([]), [done, setDone] = useState<string | null>(null);
  const can = ready && !waiting && !done;
  function tap(answer: string) {
    if (!can || current.actions.busy || wrong.includes(answer)) return;
    sClink();
    const verdict = current.actions.submit(answer);
    if (verdict === 'correct') setDone(answer);
    if (verdict === 'incorrect') setWrong(w => [...w, answer]);
  }
  return { tap, wrong, done, can };
}

function NumberChoices({ choices, onTap, wrong, done, hint }: { choices: readonly number[]; onTap(a: string): void; wrong: string[]; done: string | null; hint: string | null }) {
  return (
    <div class="choices nums">
      {choices.map(c => (
        <button key={c} class={cls('choice', wrong.includes(String(c)) && 'wrong', done === String(c) && 'right', hint === String(c) && 'hint')} aria-label={String(c)} onClick={() => onTap(String(c))}>{c}</button>
      ))}
    </div>
  );
}

// ---------- the wheels: one for each digit ----------

const WHEEL_NAMES = ['hundreds', 'tens', 'ones'] as const;
/** Two or three wheels, each turning 0 to 9, then ✓. He builds the answer digit by digit. After a miss his number stays, to fix. */
function Wheels({ count, value, onTurn, onDone, ok, hint }: { count: 2 | 3; value: number; onTurn(v: number): void; onDone(): void; ok: boolean; hint: boolean }) {
  const d = digitsOf(value), digits = count === 3 ? [d.h, d.t, d.o] : [d.t, d.o], names = count === 3 ? WHEEL_NAMES : WHEEL_NAMES.slice(1);
  const place = count === 3 ? [100, 10, 1] : [10, 1];
  function turn(i: number, dir: 1 | -1) {
    if (!ok) return;
    sClink();
    const now = digits[i]!, next = (now + dir + 10) % 10;
    onTurn(value + (next - now) * place[i]!);
  }
  return (
    <div class={cls('jw-wheels', `w${count}`)}>
      <div class="numwheels">
        {digits.map((dg, i) => (
          <div key={names[i]} class={cls('numwheel', `wheel-${names[i]}`)}>
            <button aria-label={`${names[i]} up`} onClick={() => turn(i, 1)}>▲</button>
            <div class="digit">{dg}</div>
            <button aria-label={`${names[i]} down`} onClick={() => turn(i, -1)}>▼</button>
          </div>
        ))}
      </div>
      <button class={cls('choice', 'done-btn', hint && 'hint')} aria-label="Done" onClick={onDone}>✓</button>
    </div>
  );
}

/** The sum, written across, with the answer's place shown as a box (and his answer in it once it's right). */
function SumCard({ q, shown }: { q: WheelProblem; shown: string }) {
  const parts = sumText(q, '\u0000').split('\u0000');
  return <div class="sum-card" aria-label={sumText(q)}>{parts[0]}<span class={cls('blank', shown !== '?' && 'filled')}>{shown}</span>{parts[1]}</div>;
}

/** A plane with its people (or bags) in two groups, the picture a story is about. */
function StoryArt({ q }: { q: WheelProblem }) {
  if (q.kind === 'gap') return <div class="story-art"><span class="belt">🧳 {q.a}</span><span class="cart">🛒 {q.target}</span></div>;
  if (q.kind === 'add') return <div class="story-art"><span class="grp a">🧍 {q.a}</span><span class="plane">✈️</span><span class="grp b">🧍 {q.b}</span></div>;
  return <div class="story-art"><span class="plane">✈️</span><span class="grp a">🧳 {q.a}</span><span class="grp b">➜ {q.b}</span></div>;
}

function storyOf(q: WheelProblem): Item[] {
  if (q.kind === 'add') return [...n(q.a), 'people are on the plane.', ...n(q.b), 'more get on.', 'How many are on the plane now?'];
  if (q.kind === 'take') return [...n(q.a), 'bags are on the plane.', ...n(q.b), 'bags come off.', 'How many are left?'];
  return [...n(q.a), 'bags are on the belt.', 'The cart holds', ...n(q.target), 'How many more bags fill it?'];
}

function WheelView({ current, q, waiting }: { current: Current; q: WheelProblem; waiting: boolean }) {
  const voice = useVoice(), speech = storyOf(q), ready = useAsked(current, speech), lesson = lessonFor(current.signal);
  const [value, setValue] = useState(0), [turned, setTurned] = useState(false), [done, setDone] = useState(false);
  const ok = ready && !waiting && !done;
  function check() {
    if (!ok || current.actions.busy) return;
    if (!turned) { sNope(); void voice.say('Turn the wheels to make the number. Then tap the check.'); return; }
    const verdict = current.actions.submit(String(value));
    if (verdict === 'correct') setDone(true);
  }
  const mat = lesson.mat.value, line = lesson.line.value;
  const picture = mat ? <MatView mat={mat} /> : line ? <RunwayLine line={line} /> : <StoryArt q={q} />;
  return (
    <Shell current={current} lesson={lesson} ready={ok} kind={`${q.kind} sum w${q.wheels}`} text={<SumCard q={q} shown={done ? String(value) : '?'} />} speech={speech}
      stage={<div class="jw-picture">{picture}</div>}
      controls={<Wheels count={q.wheels} value={value} ok={ok} hint={!!lesson.hint.value} onTurn={v => { setValue(v); setTurned(true); }} onDone={check} />} />
  );
}

// ---------- Jumbo ----------

const SIGN_LABEL: Record<Sign, string> = { '<': 'Less than', '=': 'Same as', '>': 'More than' };
function PlaneCard({ x, lit }: { x: number; lit: boolean }) {
  return <span class={cls('seat-sign', lit && 'lit')}><span class="seat-num">{x}</span><span class="seat-plane" aria-hidden="true">✈️</span></span>;
}
/** A number with each digit in its column, the asked column lit. */
function DigitRow({ x, col }: { x: number; col: 'h' | 't' | 'o' | null }) {
  const d = digitsOf(x);
  return <span class="digit-row">{(['h', 't', 'o'] as const).map(c => <span key={c} class={cls('dg', col === c && 'lit')}>{d[c]}</span>)}</span>;
}

function HundredsView({ current, q, waiting }: { current: Current; q: HundredsProblem; waiting: boolean }) {
  const line: Phrase = q.form === 'read' ? 'Which number do the seats show?' : q.form === 'expanded' ? 'Which number is this?' : q.form === 'digit'
    ? (q.place === 'hundreds' ? 'Which digit is in the hundreds place?' : q.place === 'tens' ? 'Which digit is in the tens place?' : 'Which digit is in the ones place?')
    : q.form === 'more' ? (q.fewer ? 'Which plane holds fewer?' : 'Which plane holds more?') : 'Which sign goes in the middle?';
  const speech = [line], ready = useAsked(current, speech), lesson = lessonFor(current.signal), { tap, wrong, done, can } = useChoice(current, ready, waiting);
  const hint = lesson.hint.value, col = lesson.col.value;
  if (q.form === 'read' || q.form === 'expanded') {
    const mat = lesson.mat.value ?? (q.form === 'read' ? matOf(q.n, 'a', true) : null);
    const d = digitsOf(q.n);
    const stage = mat
      ? <div class="jw-picture"><MatView mat={mat} jumbled={q.form === 'read' && q.jumbled && !lesson.mat.value} /></div>
      : <div class="expanded">{d.h * 100} + {d.t * 10} + {d.o}</div>;
    return (
      <Shell current={current} lesson={lesson} ready={can} kind={`hundreds form-${q.form}${q.form === 'read' && q.jumbled ? ' jumbled' : ''}`} text={line} speech={speech}
        stage={stage} controls={<NumberChoices choices={q.choices} onTap={tap} wrong={wrong} done={done} hint={hint} />} />
    );
  }
  if (q.form === 'digit') {
    const d = digitsOf(q.n), mat = lesson.mat.value;
    return (
      <Shell current={current} lesson={lesson} ready={can} kind="hundreds form-digit" text={line} speech={speech}
        stage={mat ? <div class="jw-picture"><MatView mat={mat} /></div> : <div class="place-words" aria-hidden="true"><span>hundreds</span><span>tens</span><span>ones</span></div>}
        controls={<div class="choices digits">{(['h', 't', 'o'] as const).map(c => {
          const v = String(d[c]);
          return <button key={c} class={cls('choice', 'digit-btn', col === c && 'lit', wrong.includes(v) && 'wrong', done === v && 'right', hint === v && 'hint')} aria-label={`Digit ${v}`} onClick={() => tap(v)}>{v}</button>;
        })}</div>} />
    );
  }
  if (q.form === 'more') {
    return (
      <Shell current={current} lesson={lesson} ready={can} kind="hundreds form-more" text={line} speech={speech}
        stage={<div class="duel">{(['a', 'b'] as const).map((k, i) => {
          const x = k === 'a' ? q.a : q.b;
          return (
            <button key={k} class={cls('duel-plane', wrong.includes(k) && 'wrong', done === k && 'right', hint === k && 'hint')} aria-label={`Plane with ${x} seats`} onClick={() => tap(k)}>
              <PlaneCard x={x} lit={lesson.focus.value === i} /><DigitRow x={x} col={col} />
            </button>
          );
        })}</div>} />
    );
  }
  const shown = done ?? hint;
  return (
    <Shell current={current} lesson={lesson} ready={can} kind="hundreds form-sign" text={line} speech={speech}
      stage={<div class="compare"><DigitRow x={q.a} col={col} /><span class={cls('sign-slot', shown && 'filled')}>{shown ?? '?'}</span><DigitRow x={q.b} col={col} /></div>}
      controls={<div class="choices signs">{(['<', '=', '>'] as const).map(s => (
        <button key={s} class={cls('choice', wrong.includes(s) && 'wrong', done === s && 'right', hint === s && 'hint')} aria-label={SIGN_LABEL[s]} onClick={() => tap(s)}>{s}</button>
      ))}</div>} />
  );
}

// ---------- Ten Hops ----------

function stepLine(q: HopProblem & { form: 'step' }): Phrase {
  return q.step === 10 ? 'What is ten more than' : q.step === -10 ? 'What is ten less than' : q.step === 100 ? 'What is a hundred more than' : 'What is a hundred less than';
}
function HopView({ current, q, waiting }: { current: Current; q: HopProblem; waiting: boolean }) {
  const lesson = lessonFor(current.signal);
  if (q.form === 'step') {
    const speech: Item[] = [stepLine(q), ...n(q.n)], ready = useAsked(current, speech), { tap, wrong, done, can } = useChoice(current, ready, waiting);
    const word = q.step === 10 ? 'ten more than' : q.step === -10 ? 'ten less than' : q.step === 100 ? 'a hundred more than' : 'a hundred less than';
    return (
      <Shell current={current} lesson={lesson} ready={can} kind="hop form-step" text={<>What is {word} <b class="num">{q.n}</b>?</>} speech={speech}
        stage={<div class="jw-picture"><RunwayLine line={lesson.line.value ?? hopLine(q)} /></div>}
        controls={<NumberChoices choices={q.choices} onTap={tap} wrong={wrong} done={done} hint={lesson.hint.value} />} />
    );
  }
  return <TwoHops current={current} q={q} waiting={waiting} lesson={lesson} />;
}

function TwoHops({ current, q, waiting, lesson }: { current: Current; q: HopProblem & { form: 'two' }; waiting: boolean; lesson: Lesson }) {
  const voice = useVoice(), t = Math.floor(q.b / 10) * 10, o = q.b % 10, back = q.op === '-';
  const speech: Item[] = [...n(q.a), back ? 'take away' : 'plus', ...n(q.b), 'in two hops.', back ? 'First jump back' : 'First jump', ...n(t), 'Where does it land?'];
  const ready = useAsked(current, speech);
  const [first, setFirst] = useState<number | null>(null), [wrong, setWrong] = useState<string[]>([]), [done, setDone] = useState(false);
  const can = ready && !waiting && !done;
  function tap(x: number) {
    if (!can || current.actions.busy) return;
    sClink();
    if (first === null) {
      if (x === q.first) { setFirst(x); setWrong([]); void voice.say(back ? 'Now jump back' : 'Now jump', ...n(o), 'Where does it land?'); return; }
      // a wrong first landing is a miss: the lesson shows both hops, and he starts again from the first
      setWrong(w => [...w, `1:${x}`]);
      current.actions.submit(`${x},`);
      return;
    }
    const verdict = current.actions.submit(`${first},${x}`);
    if (verdict === 'correct') setDone(true);
    if (verdict === 'incorrect') setWrong(w => [...w, `2:${x}`]);
  }
  const stage = first === null ? 1 : 2, choices = stage === 1 ? q.firstChoices : q.secondChoices;
  const sign = back ? '−' : '+';
  const line = lesson.line.value ?? hopLine(q, first === null ? [] : [{ from: q.a, to: first, label: `${sign}${t}` }, ...(done ? [{ from: first, to: q.second, label: `${sign}${o}` }] : [])], done ? q.second : first ?? q.a);
  const hint = lesson.hint.value ? String(stage === 1 ? q.first : q.second) : null;
  return (
    <Shell current={current} lesson={lesson} ready={can} kind={`hop form-two hop-${stage}`} speech={speech}
      text={<><b class="num">{q.a} {sign} {q.b}</b> in two hops: {sign}{stage === 1 ? t : o}</>}
      stage={<div class="jw-picture"><RunwayLine line={line} /></div>}
      controls={<div class="choices nums">{choices.map(c => (
        <button key={`${stage}-${c}`} class={cls('choice', wrong.includes(`${stage}:${c}`) && 'wrong', done && c === q.second && 'right', hint === String(c) && 'hint')} aria-label={String(c)} onClick={() => tap(c)}>{c}</button>
      ))}</div>} />
  );
}

// ---------- the question, and Meetings ----------

export function QuestionView({ current, waiting }: { current: Current; waiting: boolean }) {
  const q = current.problem.q;
  if (q.kind === 'hundreds') return <HundredsView current={current} q={q} waiting={waiting} />;
  if (q.kind === 'hop') return <HopView current={current} q={q} waiting={waiting} />;
  return <WheelView current={current} q={q} waiting={waiting} />;
}

/** The first Jumbo question meets the seat blocks; the first sign question meets the signs. Shown and said, and he taps Go. */
export function MeetView({ current, waiting }: { current: ProblemInstance<Meet, string>; waiting: boolean }) {
  const voice = useVoice(), meeting = current.problem.meeting;
  const [ready, setReady] = useState(false), [stage, setStage] = useState(0);
  useEffect(() => {
    void (async () => {
      if (meeting === 'blocks') {
        setStage(1); await voice.say('This is one seat.');
        setStage(2); await voice.say('Ten seats make a row of ten.');
        setStage(3); await voice.say('Ten rows make a block of a hundred.');
      } else {
        await voice.say('Signs compare two numbers.', 'The open side faces the bigger number.');
        setStage(1); await voice.say('This one means less than.');
        setStage(2); await voice.say('This one means more than.');
        setStage(3); await voice.say('This one means the same.');
      }
      if (voice.active) { await voice.say('Tap Go!'); if (!current.signal.aborted) setReady(true); }
    })();
  }, []);
  const go = () => { if (ready && !waiting && !current.actions.busy) current.actions.submit('ok'); };
  const mats = [matOf(1, 'a', true), { ...matOf(10, 'a', true), o: [] }, { ...matOf(100, 'a', true) }];
  return (
    <div class={cls('game', 'jw', 'meet', `meet-${meeting}`)} data-ready={ready && !waiting ? 'yes' : 'no'}>
      <div class="ask"><h2>{meeting === 'blocks' ? 'Seats' : 'Signs'}</h2></div>
      <div class="jw-body">
        <div class="jw-stage">
          {meeting === 'blocks'
            ? <div class="jw-picture"><MatView mat={mats[Math.max(0, stage - 1)]!} /></div>
            : <div class="sign-meet">{([[300, '<', 800], [800, '>', 300], [500, '=', 500]] as const).map(([a, s, b], i) => (
                <div key={s} class={cls('sign-row', stage === i + 1 && 'lit', stage > 0 && stage < i + 1 && 'dim')}><span class="num-sign">{a}</span><span class="sign-slot filled">{s}</span><span class="num-sign">{b}</span></div>
              ))}</div>}
        </div>
        <div class="jw-controls"><button class={cls('big-btn', 'go', 'go-btn', ready && 'pulse')} aria-label="Go" onClick={go}><span class="e">▶</span><span class="go-word">Go</span></button></div>
      </div>
    </div>
  );
}

