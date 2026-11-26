// The questions on screen. Each question is said once as it appears (🔊 says it again); numbers on the buttons and the pad are not read out,
// since he reads numbers. Taps wait until the question has been said. Ruler and How Much Longer are answered on a number pad (he reads the
// ruler, not three numbers to pick from); Jump Line Levels 1 and 2 by a tap on the tape; the rest by two or three choices.
// The lesson for a miss (questions/teach.ts) moves the same picture, and its fuller walk-through waits on the big arrow.
import { useEffect, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { sClink, sNope } from '../audio/sfx';
import type { ProblemInstance } from '../learning/round';
import type { Asking, Meet } from './mix';
import { lengthLine, sayN, unitSaid, unitWord, type Phrase } from './phrases';
import { JumpBars, RulerPic, ScalePic, StoryBars, Tape, ThingCard, UnitsPic, type Laid } from './questions/pictures';
import { storyPicture, storySaid, thingOf, type GuessQ, type LineQ, type LongerQ, type RulerQ, type StoryQ, type UnitsQ, type Unit } from './questions/problems';
import { help, lessonFor, type Lesson } from './questions/teach';
import { useVoice, type Item } from './voice';

type Current = ProblemInstance<Asking, string>;
const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');
const L = (n: number, u: Unit): Phrase[] => unitSaid(n, u);
const SHORT: Record<Unit, string> = { in: 'in', ft: 'ft', cm: 'cm' };

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
  return <button class="ba-next pulse" aria-label="Next step" onClick={() => lesson.advance()}>➜</button>;
}

/** `ready`: the question has been said and taps count (the browser tour waits on it, as he does). */
function Shell({ current, kind, text, speech, stage, controls, ready, lesson }: {
  current: Current; kind: string; text: ComponentChildren; speech: readonly Item[]; stage: ComponentChildren; controls?: ComponentChildren; ready: boolean; lesson: Lesson;
}) {
  const voice = useVoice();
  return (
    <div class={cls('game', 'ba', ...kind.split(' ').map(k => `k-${k}`))} data-ready={ready ? 'yes' : 'no'} data-lesson={lesson.waiting.value ? 'next' : 'no'}>
      <div class="ask">
        <button class="say-btn" aria-label="Say it again" onClick={() => void voice.say(...speech)}>🔊</button>
        <h2>{text}</h2>
        <button class="help-btn" aria-label="Help" onClick={() => current.actions.help(() => help(current.problem, current.signal))}>🔎</button>
      </div>
      <div class="ba-body">
        <div class="ba-stage">{stage}</div>
        {controls && <div class="ba-controls">{controls}</div>}
      </div>
      <NextArrow lesson={lesson} />
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
function Choices({ choices, label, onTap, wrong, done, hint, kind }: {
  choices: readonly string[]; label(c: string): ComponentChildren; onTap(a: string): void; wrong: string[]; done: string | null; hint: string | null; kind?: string;
}) {
  return (
    <div class={cls('choices', kind)}>
      {choices.map(c => (
        <button key={c} class={cls('choice', wrong.includes(c) && 'wrong', done === c && 'right', hint === c && 'hint')} aria-label={typeof label(c) === 'string' ? label(c) as string : c} onClick={() => onTap(c)}>{label(c)}</button>
      ))}
    </div>
  );
}

// ---------- the number pad ----------

/** Ten digit keys, ⌫ and ✓, and the number he has typed (two digits at most). After a miss his number stays, to fix. */
function Pad({ value, unit, onType, onDone, ok, hint }: { value: string; unit: Unit; onType(v: string): void; onDone(): void; ok: boolean; hint: string | null }) {
  const key = (d: string) => { if (!ok) return; sClink(); onType(value.length >= 2 ? value : value === '0' ? d : value + d); };
  return (
    <div class="ba-pad">
      <div class={cls('pad-show', hint && 'hint')} aria-live="polite"><b>{value || '?'}</b><small>{unitWord(unit, value ? Number(value) : 2)}</small></div>
      <div class="pad-keys">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map(d => <button key={d} class="pad-key" aria-label={d} onClick={() => key(d)}>{d}</button>)}
        <button class="pad-key erase" aria-label="Erase" onClick={() => { if (ok) { sClink(); onType(value.slice(0, -1)); } }}>⌫</button>
        <button class={cls('pad-key', 'done-btn', hint && 'hint')} aria-label="Done" onClick={onDone}>✓</button>
      </div>
    </div>
  );
}
function usePad(current: Current, ready: boolean, waiting: boolean) {
  const voice = useVoice();
  const [value, setValue] = useState(''), [done, setDone] = useState(false);
  const ok = ready && !waiting && !done;
  function check() {
    if (!ok || current.actions.busy) return;
    if (!value) { sNope(); void voice.say('Tap the numbers. Then tap the check.'); return; }
    const verdict = current.actions.submit(String(Number(value)));
    if (verdict === 'correct') setDone(true);
  }
  return { value, setValue, ok, check, done };
}

// ---------- Ruler ----------

const BAR_COLOURS = ['#ff7a00', '#2f8fe8', '#2fa84f', '#e63946', '#7b4bd1'];
function RulerView({ current, q, waiting }: { current: Current; q: RulerQ; waiting: boolean }) {
  const unit = q.ruler.unit, line: Phrase = unit === 'in' ? 'How many inches long is it?' : 'How many centimetres long is it?';
  const speech = [line], ready = useAsked(current, speech), lesson = lessonFor(current.signal), pad = usePad(current, ready, waiting);
  const show = lesson.show.value, slide = show?.k === 'ruler' ? show.slide : 0, hops = show?.k === 'ruler' ? show.hops : 0;
  const laid: Laid[] = [{ bar: q.bar, colour: BAR_COLOURS[(q.bar.len + q.bar.start) % BAR_COLOURS.length]!, shape: q.shape, slide }];
  return (
    <Shell current={current} lesson={lesson} ready={pad.ok} kind={`ruler u-${unit}${q.ruler.other ? ' two-sided' : ''}`} speech={speech}
      text={<>How many <b>{unitWord(unit)}</b> long?</>}
      stage={<div class="ba-picture"><RulerPic ruler={q.ruler} laid={laid} hops={hops} /></div>}
      controls={<Pad value={pad.done ? q.answer : pad.value} unit={unit} ok={pad.ok} hint={lesson.hint.value} onType={pad.setValue} onDone={pad.check} />} />
  );
}

// ---------- How Much Longer ----------

function LongerView({ current, q, waiting }: { current: Current; q: LongerQ; waiting: boolean }) {
  const speech: Item[] = q.form === 'jumps'
    ? ['The red jump went', ...L(q.a, 'ft'), 'The blue jump went', ...L(q.b, 'ft'), 'How much longer was the red jump?']
    : ['How much longer is the red one than the blue one?'];
  const ready = useAsked(current, speech), lesson = lessonFor(current.signal), pad = usePad(current, ready, waiting);
  const show = lesson.show.value, laid = show?.k === 'longer' && show.laid, count = show?.k === 'longer' ? show.count : 0;
  const unit: Unit = q.form === 'jumps' ? 'ft' : q.ruler.unit;
  const stage = q.form === 'jumps'
    ? <JumpBars a={q.a} b={q.b} laid={laid} count={count} />
    : <RulerPic ruler={q.ruler} laid={[{ bar: q.a, colour: '#e63946', shape: 'stick' }, { bar: q.b, colour: '#2f8fe8', shape: 'stick' }]} overlay={laid ? { count } : undefined} />;
  return (
    <Shell current={current} lesson={lesson} ready={pad.ok} kind={`longer form-${q.form}`} speech={speech}
      text={q.form === 'jumps' ? <>How much longer was the <b class="red">red</b> jump?</> : <>How much longer is <b class="red">red</b> than <b class="blue">blue</b>?</>}
      stage={<div class="ba-picture">{stage}</div>}
      controls={<Pad value={pad.done ? q.answer : pad.value} unit={unit} ok={pad.ok} hint={lesson.hint.value} onType={pad.setValue} onDone={pad.check} />} />
  );
}

// ---------- Jump Line ----------

function LineView({ current, q, waiting }: { current: Current; q: LineQ; waiting: boolean }) {
  const lesson = lessonFor(current.signal), show = lesson.show.value, fill = show?.k === 'fill' ? { from: show.from, to: show.to } : null;
  if (q.form === 'hops') {
    const speech: Item[] = ['The truck jumped', ...L(q.a, 'ft'), 'Then it went', ...L(q.b, 'ft'), 'more.', 'Where did it land?'];
    const ready = useAsked(current, speech), { tap, wrong, done, can } = useChoice(current, ready, waiting);
    const hops = [{ from: 0, to: q.a, text: `${q.a}` }, ...(done ? [{ from: q.a, to: q.a + q.b, text: `+${q.b}` }] : [])];
    return (
      <Shell current={current} lesson={lesson} ready={can} kind="line form-hops" speech={speech}
        text={<><b class="num">{q.a} ft</b> and <b class="num">{q.b} ft</b> more</>}
        stage={<div class="ba-picture"><Tape lo={0} hi={100} step={10} labels={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]} hops={hops} fill={fill} mark={done ? q.a + q.b : null} label="The tape, 0 to 100 feet" /></div>}
        controls={<Choices choices={q.choices} label={c => c} onTap={tap} wrong={wrong} done={done} hint={lesson.hint.value} kind="nums" />} />
    );
  }
  const speech: Item[] = ['Tap', ...L(q.n, 'ft'), 'on the tape.'];
  const ready = useAsked(current, speech);
  const [wrong, setWrong] = useState<number[]>([]), [done, setDone] = useState<number | null>(null);
  const can = ready && !waiting && done === null;
  function tapAt(n: number) {
    if (!can || current.actions.busy) return;
    sClink();
    const verdict = current.actions.submit(String(n));
    if (verdict === 'correct') setDone(n);
    if (verdict === 'incorrect') setWrong(w => [...w, n]);
  }
  const hint = lesson.hint.value ? Number(lesson.hint.value) : null;
  const lo = q.form === 'ones' ? q.lo : 0, hi = q.form === 'ones' ? q.lo + 10 : 100;
  return (
    <Shell current={current} lesson={lesson} ready={can} kind={`line form-${q.form}`} speech={speech}
      text={<>Tap <b class="num">{q.n} feet</b></>}
      stage={<div class="ba-picture">
        <Tape lo={lo} hi={hi} step={q.form === 'ones' ? 5 : 10} ones={q.form === 'ones'} labels={q.labels} fill={fill} mark={done ?? hint ?? (wrong.length ? wrong[wrong.length - 1] : null)}
          onTap={tapAt} label={`The tape from ${lo} to ${hi} feet`} />
      </div>} />
  );
}

// ---------- Best Guess ----------

function GuessView({ current, q, waiting }: { current: Current; q: GuessQ; waiting: boolean }) {
  const lesson = lessonFor(current.signal), scaled = lesson.show.value?.k === 'scale';
  if (q.form === 'longer') {
    const a = thingOf(q.a), b = thingOf(q.b);
    const speech: Item[] = ['Which is longer in real life?', a.name as Phrase, 'or', b.name as Phrase];
    const ready = useAsked(current, speech), { tap, wrong, done, can } = useChoice(current, ready, waiting);
    return (
      <Shell current={current} lesson={lesson} ready={can} kind="guess form-longer" speech={speech} text={<>Which is <b>longer</b> in real life?</>}
        stage={scaled ? <div class="ba-picture"><ScalePic things={[a, b]} /></div> : <div class="thing-pair">{q.choices.map(c => (
          <button key={c} class={cls('thing-btn', wrong.includes(c) && 'wrong', done === c && 'right', lesson.hint.value === c && 'hint')} aria-label={thingOf(c).name} onClick={() => tap(c)}><ThingCard id={c} /></button>
        ))}</div>}
        controls={scaled ? <Choices choices={q.choices} label={c => thingOf(c).name} onTap={tap} wrong={wrong} done={done} hint={lesson.hint.value} kind="words" /> : undefined} />
    );
  }
  const th = thingOf(q.thing);
  if (q.form === 'about') {
    const [c1, c2] = q.choices as [string, string];
    const speech: Item[] = ['About how long is', th.name as Phrase, lengthLine(Number(c1), q.unit), 'or', lengthLine(Number(c2), q.unit)];
    const ready = useAsked(current, speech), { tap, wrong, done, can } = useChoice(current, ready, waiting);
    return (
      <Shell current={current} lesson={lesson} ready={can} kind="guess form-about" speech={speech} text={<>About how long is it?</>}
        stage={<div class="ba-picture">{scaled ? <ScalePic things={[th]} /> : <ThingCard id={q.thing} />}</div>}
        controls={<Choices choices={q.choices} label={c => `${c} ${unitWord(q.unit, Number(c))}`} onTap={tap} wrong={wrong} done={done} hint={lesson.hint.value} kind="words" />} />
    );
  }
  const speech: Item[] = ['Would you measure', th.name as Phrase, 'in inches or in feet?'];
  const ready = useAsked(current, speech), { tap, wrong, done, can } = useChoice(current, ready, waiting);
  return (
    <Shell current={current} lesson={lesson} ready={can} kind="guess form-unit" speech={speech} text={<>Inches or feet?</>}
      stage={<div class="ba-picture">{scaled ? <ScalePic things={[th]} /> : <ThingCard id={q.thing} />}</div>}
      controls={<Choices choices={q.choices} label={c => (c === 'in' ? 'inches' : 'feet')} onTap={tap} wrong={wrong} done={done} hint={lesson.hint.value} kind="words" />} />
  );
}

// ---------- Length Stories ----------

function StoryView({ current, q, waiting }: { current: Current; q: StoryQ; waiting: boolean }) {
  const speech = storySaid(q, n => lengthLine(n, 'ft')) as Item[];
  const ready = useAsked(current, speech), lesson = lessonFor(current.signal), { tap, wrong, done, can } = useChoice(current, ready, waiting);
  const show = lesson.show.value, step = done ? 3 : show?.k === 'bars' ? show.step : 2;
  return (
    <Shell current={current} lesson={lesson} ready={can} kind={`story form-${q.form}`} speech={speech}
      text={<>{storyText(q)}</>}
      stage={<div class="ba-picture"><StoryBars pic={storyPicture(q)} step={step} /></div>}
      controls={<Choices choices={q.choices} label={c => `${c} ft`} onTap={tap} wrong={wrong} done={done} hint={lesson.hint.value} kind="nums" />} />
  );
}
/** The story, short and written, with its numbers. */
function storyText(q: StoryQ) {
  const x = <b class="num">{q.x} ft</b>, y = <b class="num">{q.y} ft</b>;
  switch (q.form) {
    case 'add-piece': return <>Ramp {x}, add {y}. How long now?</>;
    case 'end-to-end': return <>Cars {x}, buses {y}. End to end?</>;
    case 'cut': return <>Rope {x}, cut off {y}. How long now?</>;
    case 'shorter': return <>Red {x}, blue {y}. How much shorter is blue?</>;
    case 'shorter-than': return <>Blue is {y} shorter. Red went {x}. Blue?</>;
    case 'longer-than': return <>Red is {y} longer. Blue went {x}. Red?</>;
    case 'start-add': return <>Added {y}, now {x}. Before?</>;
    case 'start-cut': return <>Cut {y}, now {x}. Before?</>;
  }
}

// ---------- Two Units ----------

function UnitsView({ current, q, waiting }: { current: Current; q: UnitsQ; waiting: boolean }) {
  const lesson = lessonFor(current.signal), show = lesson.show.value;
  if (q.form === 'which') {
    const speech: Item[] = ['It was measured in inches and in centimetres.', q.want === 'bigger' ? 'Which number is bigger?' : 'Which number is smaller?'];
    const ready = useAsked(current, speech), { tap, wrong, done, can } = useChoice(current, ready, waiting);
    const laid: Laid[] = [{ bar: { start: 0, len: q.inches }, colour: '#ff7a00', shape: q.shape }];
    return (
      <Shell current={current} lesson={lesson} ready={can} kind="units form-which" speech={speech} text={<>Which number is <b>{q.want}</b>?</>}
        stage={<div class="ba-picture">{show?.k === 'units'
          ? <UnitsPic big={q.inches} small={q.cm} bigUnit="in" smallUnit="cm" laidBig={show.big} laidSmall={show.small} shape={q.shape} />
          : <RulerPic ruler={{ unit: 'in', top: 8, other: 'cm' }} laid={laid} />}</div>}
        controls={<Choices choices={q.choices} label={c => (c === 'in' ? `${q.inches} inches` : `${q.cm} centimetres`)} onTap={tap} wrong={wrong} done={done} hint={lesson.hint.value} kind="words" />} />
    );
  }
  if (q.form === 'more') {
    const ask: Phrase = q.to === 'in' ? 'Would it be more inches or fewer inches?' : q.to === 'ft' ? 'Would it be more feet or fewer feet?' : 'Would it be more centimetres or fewer centimetres?';
    const speech: Item[] = ['It is', ...L(q.n, q.unit), 'long.', ask];
    const ready = useAsked(current, speech), { tap, wrong, done, can } = useChoice(current, ready, waiting);
    const smallU = q.unit === 'ft' || (q.unit === 'in' && q.to === 'cm') ? q.to : q.unit, bigU = smallU === q.to ? q.unit : q.to;
    return (
      <Shell current={current} lesson={lesson} ready={can} kind="units form-more" speech={speech}
        text={<><b class="num">{q.n} {unitWord(q.unit, q.n)}</b>. More or fewer {unitWord(q.to)}?</>}
        stage={<div class="ba-picture"><UnitsPic big={3} small={bigU === 'ft' ? 36 : 8} bigUnit={bigU} smallUnit={smallU} laidBig={show?.k === 'units' ? show.big : 0} laidSmall={show?.k === 'units' && show.small ? (bigU === 'ft' ? 36 : 8) : 0} /></div>}
        controls={<Choices choices={q.choices} label={c => `${c === 'more' ? 'More' : 'Fewer'} ${unitWord(q.to)}`} onTap={tap} wrong={wrong} done={done} hint={lesson.hint.value} kind="words" />} />
    );
  }
  const ask: Phrase = q.ask === 'ft' ? 'Which number is the feet?' : q.ask === 'in' ? 'Which number is the inches?' : 'Which number is the centimetres?';
  const speech: Item[] = [q.big.unit === 'ft' ? 'The same jump was measured in feet and in inches.' : 'The same toy was measured in inches and in centimetres.', ask];
  const ready = useAsked(current, speech), { tap, wrong, done, can } = useChoice(current, ready, waiting);
  const small = q.small.n <= 40 ? q.small.n : 12;
  return (
    <Shell current={current} lesson={lesson} ready={can} kind="units form-match" speech={speech} text={<>Which number is the <b>{unitWord(q.ask)}</b>?</>}
      stage={<div class="ba-picture"><UnitsPic big={q.big.unit === 'ft' ? 3 : q.big.n} small={q.big.unit === 'ft' ? 36 : small} bigUnit={q.big.unit} smallUnit={q.small.unit}
        laidBig={show?.k === 'units' ? (q.big.unit === 'ft' ? 3 : q.big.n) : 0} laidSmall={show?.k === 'units' && show.small ? (q.big.unit === 'ft' ? 36 : small) : 0} /></div>}
      controls={<Choices choices={q.choices} label={c => c} onTap={tap} wrong={wrong} done={done} hint={lesson.hint.value} kind="nums" />} />
  );
}

// ---------- the question, and Meetings ----------

export function QuestionView({ current, waiting }: { current: Current; waiting: boolean }) {
  const q = current.problem.q;
  switch (q.kind) {
    case 'ruler': return <RulerView current={current} q={q} waiting={waiting} />;
    case 'longer': return <LongerView current={current} q={q} waiting={waiting} />;
    case 'line': return <LineView current={current} q={q} waiting={waiting} />;
    case 'guess': return <GuessView current={current} q={q} waiting={waiting} />;
    case 'story': return <StoryView current={current} q={q} waiting={waiting} />;
    case 'units': return <UnitsView current={current} q={q} waiting={waiting} />;
  }
}

/** Before the first ruler, the first centimetre and the first foot: shown and said, and he taps Go. */
export function MeetView({ current, waiting }: { current: ProblemInstance<Meet, string>; waiting: boolean }) {
  const voice = useVoice(), meeting = current.problem.meeting;
  const [ready, setReady] = useState(false), [stage, setStage] = useState(0);
  useEffect(() => {
    void (async () => {
      if (meeting === 'ruler') {
        setStage(1); await voice.say('This is a ruler.');
        setStage(2); await voice.say('Each space is one inch.');
        setStage(3); await voice.say('Start at zero. Count the spaces.');
        for (let i = 1; i <= 3 && voice.active; i++) { setStage(3 + i); await voice.say(...sayN(i)); }
      } else if (meeting === 'cm') {
        setStage(1); await voice.say('This is a centimetre.');
        setStage(2); await voice.say('A centimetre is smaller than an inch.');
      } else {
        setStage(1); await voice.say('This is a foot.');
        setStage(2); await voice.say('Twelve inches make a foot.');
        setStage(3); await voice.say('Jumps are measured in feet.');
      }
      if (voice.active) { await voice.say('Tap Go!'); if (!current.signal.aborted) setReady(true); }
    })();
  }, []);
  const go = () => { if (ready && !waiting && !current.actions.busy) current.actions.submit('ok'); };
  const picture = meeting === 'ruler'
    ? <RulerPic ruler={{ unit: 'in', top: 6 }} laid={stage >= 3 ? [{ bar: { start: 0, len: 3 }, colour: '#ff7a00', shape: 'crayon' }] : []} hops={Math.max(0, stage - 3)} />
    : meeting === 'cm'
      ? <RulerPic ruler={{ unit: 'cm', top: 10, ...(stage >= 2 && { other: 'in' as const }) }} laid={[{ bar: { start: 0, len: 1 }, colour: '#2fa84f', shape: 'stick' }]} />
      : <RulerPic ruler={{ unit: 'in', top: 12 }} laid={[{ bar: { start: 0, len: 12 }, colour: '#ffd23f', shape: 'stick' }]} hops={stage >= 2 ? 12 : 0} />;
  return (
    <div class={cls('game', 'ba', 'meet', `meet-${meeting}`)} data-ready={ready && !waiting ? 'yes' : 'no'}>
      <div class="ask"><h2>{meeting === 'ruler' ? 'The ruler' : meeting === 'cm' ? '1 centimetre' : '1 foot = 12 inches'}</h2></div>
      <div class="ba-body">
        <div class="ba-stage"><div class="ba-picture">{picture}</div></div>
        <div class="ba-controls"><button class={cls('big-btn', 'go', 'go-btn', ready && 'pulse')} aria-label="Go" onClick={go}><span class="e">▶</span><span class="go-word">Go</span></button></div>
      </div>
    </div>
  );
}
export { SHORT };
