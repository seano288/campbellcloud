// The questions on screen. Every question is said as it appears (🔊 says it again) and taps wait until it has finished, so
// guessing fast gets nothing. The answer buttons are never read out: he reads numbers fine, and hearing them only held him up. While a lesson runs its Stage takes the place of the picture, and stays there so he can answer
// looking at it. Everything is tapped: a counter you'd drag moves with a tap.
import { useEffect, useRef, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { sClink, sCount } from '../audio/sfx';
import type { ProblemInstance } from '../learning/round';
import { MEETING_SCRIPTS, lessonFor, playSteps, type Stage } from './numbers/teach';
import { markAsked, teachIn } from './numbers/run';
import { equationText, jumpSum, promptOf, said, sentenceOf, sideText, type Prompt } from './numbers/say';
import { FILLS, type Piece } from './numbers/shapes';
import { STRIP_UNITS, chartKeeps, hiddenCell, valueOf, type BoardProblem, type ChartProblem, type JumpProblem, type MeasureProblem, type RowId, type ShapeProblem, type FactsProblem, type OnProblem, type OverProblem, type PartProblem, type ScaleProblem, type SkipProblem, type StoryProblem, type TenProblem, type TensProblem, type Level } from './numbers/problems';
import type { Asking, Meet } from './mix';
import { speaking, useVoice, type Item } from './voice';
import { Board, Bond, cls, Dot, Equation, Frame, Frames, Groups, Mat, Path, Scale, StageView } from './visuals/Pictures';
import { Choices, Strip, Wheels, type Tapped } from './visuals/Inputs';
import { BarRow, Chart, FillArt, Laid, PIECE_NAMES, PieceArt, Rope, ShapeArt, Units } from './visuals/NewPictures';
import type { Stretch } from '../modes/progress';

type Current = ProblemInstance<Asking, string>;

/** Says the question once, and marks when it's done. */
function useAsked(current: Current, speech: readonly Item[]) {
  const voice = useVoice();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    void voice.say(...speech).then(() => {
      if (current.signal.aborted) return;
      setReady(true);
      markAsked(current.signal);
    });
  }, []);
  return ready;
}

function useTaps(current: Current, ready: boolean) {
  const voice = useVoice();
  const [wrong, setWrong] = useState<string[]>([]), [done, setDone] = useState<string | null>(null);
  function tap(value: string) {
    if (!ready || !voice.active || current.signal.aborted || done !== null || wrong.includes(value)) return 'ignored' as const;
    const verdict = current.actions.submit(value);
    if (verdict === 'correct') setDone(value);
    if (verdict === 'incorrect') setWrong(w => [...w, value]);
    return verdict;
  }
  return { wrong, done, tap, ready } satisfies Tapped & Record<string, unknown>;
}

function AskBar({ prompt, speech, text }: { prompt: Prompt; speech: readonly Item[]; text?: string }) {
  const voice = useVoice();
  return (
    <div class="ask">
      <button class="say-btn" aria-label="Say it again" onClick={() => void voice.say(...speech)}>🔊</button>
      <h2>{text ?? prompt.text}</h2>
    </div>
  );
}

/** The frame of every question: the ask, the picture (or the lesson's Stage), how he answers, and 🔎. */
function Shell({ current, kind, prompt, speech, text, input, children, wide }: {
  current: Current; kind: string; prompt: Prompt; speech: readonly Item[]; text?: string; input: ComponentChildren; children: ComponentChildren; wide?: boolean;
}) {
  const p = current.problem, lesson = lessonFor(current.signal), stage = lesson.stage.value, caption = lesson.caption.value;
  return (
    <div class={cls('game', 'math', kind, wide && 'wide')}>
      <AskBar prompt={prompt} speech={speech} {...(text !== undefined && { text })} />
      <div class="q-body">
        <div class={cls('q-pic', stage && 'teaching')}>
          {stage ? <StageView stage={stage} /> : children}
          {caption && <div class="caption" aria-live="polite">{caption}</div>}
        </div>
        <div class="q-in">{input}</div>
      </div>
      <div class="helpers"><button class="help-btn" aria-label="Help" onClick={() => current.actions.help(() => teachIn(p, lesson, lesson.run.start()))}>🔎</button></div>
    </div>
  );
}

function Answer({ q, on }: { q: { input: string; choices?: readonly number[] }; on: Tapped }) {
  if (q.input === 'choices') return <Choices choices={q.choices!} on={on} />;
  if (q.input === 'wheels') return <Wheels on={on} />;
  return <Strip on={on} />;
}

// ---------- Make Ten ----------
/** How long the Quick Look stays up once "How many?" has been said. Tapping the cover brings it back, as often as he likes. */
const SHOW_MS = 3000;
function TenView({ current, q, level }: { current: Current; q: TenProblem; level: Level }) {
  const prompt = promptOf(q, level), ready = useAsked(current, prompt.speech), on = useTaps(current, ready);
  const [covered, setCovered] = useState(false), timer = useRef(0);
  function show() {
    setCovered(false);
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCovered(true), SHOW_MS);
  }
  useEffect(() => { if (q.form === 'look' && ready) show(); return () => clearTimeout(timer.current); }, [ready]); // the clock waits for the voice: a slow clip must not use up his look
  return (
    <Shell current={current} kind="ten" prompt={prompt} speech={prompt.speech} input={<Answer q={q} on={on} />}>
      {q.form === 'look' ? <Frames a={q.n} /> : q.form === 'partners' ? <Frame a={q.n} /> : <Frame a={q.part} hideFrom={q.part} />}
      {q.form === 'look' && covered && <button class="cover" aria-label="Look again" onClick={show}>👀</button>}
    </Shell>
  );
}

// ---------- Count On ----------
function OnView({ current, q, level, stretch }: { current: Current; q: OnProblem; level: Level; stretch: Stretch }) {
  const voice = useVoice(), prompt = promptOf(q, level), speech = prompt.speech;
  const ready = useAsked(current, speech), on = useTaps(current, ready);
  const [chosen, setChosen] = useState<number | null>(q.form === 'box' ? q.a : null), [hopped, setHopped] = useState(0);
  const start = q.form === 'countUp' ? q.from : chosen, more = q.form === 'countUp' ? q.to - q.from : q.form === 'box' ? q.b : chosen === q.a ? q.b : q.a;
  function hop() {
    if (start === null || hopped >= more) return;
    const next = hopped + 1;
    setHopped(next);
    sCount(next);
    if (q.form !== 'countUp') void voice.say(said(start + next)); // at Level 3 the count stays silent: saying it gives the answer
  }
  if (q.form === 'countUp') {
    const faded = stretch === 2, cells = Array.from({ length: more + 1 }, (_, i) => (faded && i > 0 && i < more ? null : q.from + i));
    return (
      <Shell current={current} kind="on" prompt={prompt} speech={speech} input={<Answer q={q} on={on} />}>
        <Path cells={cells} at={faded ? null : q.from + hopped} start={q.from} />
        {!faded && <button class="big-tap" aria-label="Hop" onClick={hop}>➡️</button>}
      </Shell>
    );
  }
  const from = start === null ? 0 : Math.max(0, start - 1), to = start === null ? 0 : Math.min(start + more + 1, 21);
  return (
    <Shell current={current} kind="on" prompt={prompt} speech={speech} input={<Answer q={q} on={on} />}>
      {q.form === 'biggerFirst' && chosen === null
        ? <div class="start-pick">{[q.a, q.b].map((n, i) => <button key={i} class="box tap" onClick={() => { setChosen(n); sClink(); void voice.say(said(n)); }}>{n}</button>)}</div>
        : <>
          <div class="on-row">
            <span class="box">{start}</span>
            <span class="plus">+</span>
            <span class="loose">{Array.from({ length: more }, (_, i) => (i < hopped ? <Dot key={i} ghost /> : <Dot key={i} b onClick={hop} label="Hop one" />))}</span>
          </div>
          <Path cells={Array.from({ length: to - from + 1 }, (_, i) => from + i)} at={start! + hopped} start={start!} />
        </>}
    </Shell>
  );
}

// ---------- Facts ----------
function FactsView({ current, q, level }: { current: Current; q: FactsProblem; level: Level }) {
  const prompt = promptOf(q, level), speech = prompt.speech;
  const ready = useAsked(current, speech), on = useTaps(current, ready);
  return <Shell current={current} kind="facts" prompt={prompt} speech={speech} input={<Answer q={q} on={on} />}><Equation text={equationText(q.eq)} /></Shell>;
}

// ---------- Over Ten ----------
function OverView({ current, q, level }: { current: Current; q: OverProblem; level: Level }) {
  if (q.form === 'fill') return <OverFill current={current} q={q} level={level} />;
  const prompt = promptOf(q, level), ready = useAsked(current, prompt.speech), on = useTaps(current, ready);
  const text = q.form === 'plain' ? `${q.a} + ${q.b} = ?` : `${q.c} − ${q.b} = ?`;
  return <Shell current={current} kind="over" prompt={prompt} speech={prompt.speech} input={<Strip on={on} />}><Equation text={text} /></Shell>;
}

/** Tap counters up to fill the top frame; at Level 2 pick the step that matches; then the total. */
function OverFill({ current, q, level }: { current: Current; q: Extract<OverProblem, { form: 'fill' }>; level: Level }) {
  const voice = useVoice(), prompt = promptOf(q, level), ready = useAsked(current, prompt.speech);
  const [moved, setMoved] = useState(0), [phase, setPhase] = useState<'fill' | 'step' | 'total'>('fill'), [settled, setSettled] = useState(true);
  const on = useTaps(current, ready && settled);
  function total() {
    setPhase('total');
    setSettled(false);
    void voice.say('Ten and', said(q.left), 'How many in all?').then(() => { if (!current.signal.aborted) setSettled(true); });
  }
  function move() {
    if (!ready || moved >= q.moved) return;
    const next = moved + 1;
    setMoved(next);
    sCount(next);
    void voice.say(said(q.a + next));
    if (next < q.moved) return;
    if (q.steps) { setPhase('step'); void voice.sayMore('Which one matches?'); } else total();
  }
  const text = phase === 'fill' ? undefined : phase === 'step' ? 'Which one matches?' : `Ten and ${q.left}. How many in all?`;
  return (
    <Shell current={current} kind="over" prompt={prompt} speech={prompt.speech} {...(text !== undefined && { text })}
      input={phase === 'total' ? <Strip on={on} /> : phase === 'step'
        ? <div class="choices three">{q.steps!.map(x => <button key={x} class={cls('choice', on.wrong.includes(`step:${x}`) && 'wrong')} disabled={on.wrong.includes(`step:${x}`)} onClick={() => { if (on.tap(`step:${x}`) === 'not-an-answer') total(); }}>10 + {x}</button>)}</div>
        : null}>
      <Equation text={`${q.a} + ${q.b}`} />
      <div class="frames"><Frame a={q.a} b={moved} /><Frame a={0} b={q.b - moved} tapB={move} /></div>
    </Shell>
  );
}

// ---------- Missing Part ----------
function PartView({ current, q, level }: { current: Current; q: PartProblem; level: Level }) {
  const prompt = promptOf(q, level), ready = useAsked(current, prompt.speech), on = useTaps(current, ready);
  return (
    <Shell current={current} kind="part" prompt={prompt} speech={prompt.speech} input={<Strip on={on} />}>
      {q.form === 'bond' ? <Bond whole={q.whole} left={q.here} right="?" plate="right" />
        : q.form === 'addTo' ? <div class="side-by-side"><div><Equation text={`${q.a} + ? = ${q.c}`} /><Bond whole={q.c} left={q.a} right="?" /></div><Frames a={q.a} /></div>
          : q.form === 'takeFrom' ? <Equation text={`${q.c} − ? = ${q.a}`} />
            : q.form === 'firstAdd' ? <Equation text={`? + ${q.b} = ${q.c}`} />
              : <Equation text={`${q.a} = ? − ${q.b}`} />}
    </Shell>
  );
}

// ---------- Weigh-In ----------
function ScaleView({ current, q, level }: { current: Current; q: ScaleProblem; level: Level }) {
  const voice = useVoice(), prompt = promptOf(q, level);
  const speech = prompt.speech, ready = useAsked(current, speech), on = useTaps(current, ready);
  const [fix, setFix] = useState<{ left: number; right: number } | null>(null);
  if (q.form === 'cards') {
    return (
      <Shell current={current} kind="scale" prompt={prompt} speech={speech} input={
        <div class="cards">{q.cards.map((c, i) => (
          <button key={i} class={cls('choice', 'card-eq', on.wrong.includes(String(i)) && 'wrong', on.done === String(i) && 'right')}
            disabled={on.wrong.includes(String(i))} onClick={() => on.tap(String(i))}>{sideText(c.left)} = {sideText(c.right)}</button>
        ))}</div>}>{null}</Shell>
    );
  }
  if (q.form === 'balance') {
    const eq = q.blankFirst ? `${q.a} + ${q.b} = ? + ${q.c}` : `${q.a} + ${q.b} = ${q.c} + ?`;
    return <Shell current={current} kind="scale" prompt={prompt} speech={speech} input={<Strip on={on} />}><Equation text={eq} /><Scale left={q.a + q.b} right={q.c} covered leftText="" rightText="" /></Shell>;
  }
  const left = valueOf(q.eq.left), right = valueOf(q.eq.right), even = (l: number, r: number) => { if (l === r) window.setTimeout(() => { on.tap('not'); }, 500); };
  const nudge = (l: number, r: number) => { sClink(); setFix({ left: l, right: r }); void voice.say(said(l), said(r)); even(l, r); };
  const pick = (value: string) => { if (on.tap(value) === 'not-an-answer') { setFix({ left, right }); void voice.say('Fix it! Make both sides the same.'); } };
  return (
    <Shell current={current} kind="scale" prompt={prompt} speech={speech} {...(fix && { text: 'Fix it! Make both sides the same.' })} input={fix ? null : (
      <div class="choices two">
        <button class={cls('choice', on.wrong.includes('same') && 'wrong')} aria-label="Same" disabled={on.wrong.includes('same')} onClick={() => pick('same')}>✓ same</button>
        <button class={cls('choice', on.wrong.includes('pick:not') && 'wrong')} aria-label="Not the same" disabled={on.wrong.includes('pick:not')} onClick={() => pick('pick:not')}>✗ not same</button>
      </div>)}>
      <Equation text={`${sideText(q.eq.left)} = ${sideText(q.eq.right)}`} />
      {fix
        ? <Scale left={fix.left} right={fix.right}
          {...(fix.left > fix.right ? { onLeft: () => nudge(fix.left - 1, fix.right), addRight: () => nudge(fix.left, fix.right + 1) } : fix.right > fix.left ? { onRight: () => nudge(fix.left, fix.right - 1), addLeft: () => nudge(fix.left + 1, fix.right) } : {})} />
        : <Scale left={left} right={right} covered leftText="" rightText="" />}
    </Shell>
  );
}

// ---------- Bot Stories ----------
function StoryView({ current, q, level }: { current: Current; q: StoryProblem; level: Level }) {
  const voice = useVoice(), prompt = promptOf(q, level), sentences = q.lines.map(sentenceOf);
  const [reached, setReached] = useState(-1), [ready, setReady] = useState(false), [bench, setBench] = useState(0), on = useTaps(current, ready);
  const speech: Item[] = sentences.map((s, i) => ({ parts: s.speech, light: `l${i}` }));
  useEffect(() => {
    void (async () => {
      for (let i = 0; i < sentences.length && voice.active; i++) { setReached(i); await voice.say(speech[i]!); }
      if (!current.signal.aborted) { setReady(true); markAsked(current.signal); }
    })();
  }, []);
  return (
    <Shell current={current} kind="story" wide prompt={prompt} speech={speech} text="Bot story" input={<Strip on={on} />}>
      <div class="story-lines">
        {sentences.map((s, i) => {
          const numbers = [...s.text.matchAll(/\d+/g)].map(m => Number(m[0]));
          return (
            <div key={i} class={cls('story-line', i > reached && 'later', speaking.value === `l${i}` && 'reading')}>
              <button class="line-say" aria-label="Say this line" onClick={() => void voice.say(speech[i]!)}>🔊</button>
              <span class="line-text">{s.text}</span>
              {numbers.map((n, k) => <span key={k} class="line-dots">{Array.from({ length: n }, (_, d) => <Dot key={d} b={k % 2 === 1} />)}</span>)}
            </div>
          );
        })}
      </div>
      <div class="bench" role="group" aria-label="Bench">
        <button class="bench-add" aria-label="Put a counter on the bench" onClick={() => { if (bench < 20) { setBench(bench + 1); sClink(); } }}>＋</button>
        <span class="bench-dots">{Array.from({ length: bench }, (_, i) => <Dot key={i} onClick={() => setBench(b => b - 1)} label="Take this counter off" />)}</span>
      </div>
    </Shell>
  );
}
function BoardView({ current, q, level }: { current: Current; q: BoardProblem; level: Level }) {
  const prompt = promptOf(q, level), ready = useAsked(current, prompt.speech), on = useTaps(current, ready);
  return <Shell current={current} kind="story" prompt={prompt} speech={prompt.speech} input={<Strip on={on} />}><Board q={q} /></Shell>;
}

// ---------- Tens and Ones ----------
function TensView({ current, q, level }: { current: Current; q: TensProblem; level: Level }) {
  const voice = useVoice(), prompt = promptOf(q, level), speech = prompt.speech;
  const ready = useAsked(current, speech), on = useTaps(current, ready);
  const [rods, setRods] = useState(0), [cubes, setCubes] = useState(0);
  if (q.form === 'compare') {
    return (
      <Shell current={current} kind="tens" prompt={prompt} speech={speech} input={
        <div class="choices three signs">{(['<', '=', '>'] as const).map(sign => (
          <button key={sign} class={cls('choice', on.wrong.includes(sign) && 'wrong', on.done === sign && 'right')} disabled={on.wrong.includes(sign)} aria-label={{ '<': 'is less than', '=': 'is the same as', '>': 'is more than' }[sign]} onClick={() => on.tap(sign)}>{sign}</button>
        ))}</div>}>
        <div class="compare"><span class="box">{q.a}</span><span class="sign-gap">?</span><span class="box">{q.b}</span></div>
      </Shell>
    );
  }
  if (q.form === 'make') {
    const addCube = () => { sCount(cubes + 1); if (cubes === 9) { setCubes(0); setRods(r => Math.min(r + 1, 9)); sClink(); } else setCubes(cubes + 1); void voice.say(said(rods * 10 + cubes + 1)); };
    const addRod = () => { if (rods < 9) { setRods(rods + 1); sClink(); void voice.say(said((rods + 1) * 10 + cubes)); } };
    return (
      <Shell current={current} kind="tens" prompt={prompt} speech={speech} input={
        <div class="builder">
          <button class="choice" aria-label="Add a ten" onClick={addRod}>＋ ten</button>
          <button class="choice" aria-label="Add a one" onClick={addCube}>＋ one</button>
          <button class="choice done-btn" aria-label="Done" onClick={() => on.tap(String(rods * 10 + cubes))}>✓</button>
        </div>}>
        <Equation text={String(q.n)} />
        <Mat rods={rods} cubes={cubes} onRod={() => setRods(r => r - 1)} onCube={() => setCubes(c => c - 1)} />
      </Shell>
    );
  }
  return (
    <Shell current={current} kind="tens" prompt={prompt} speech={speech} input={<Answer q={q} on={on} />}>
      {q.form === 'read' ? <Mat rods={q.rods} cubes={q.cubes} /> : <Equation text={`${q.n} = ? tens`} />}
    </Shell>
  );
}

// ---------- Skip Count ----------
function SkipView({ current, q, level }: { current: Current; q: SkipProblem; level: Level }) {
  const prompt = promptOf(q, level), speech = prompt.speech;
  const ready = useAsked(current, speech), on = useTaps(current, ready);
  const cells: readonly (number | null)[] = q.form === 'next' ? [...q.shown, null] : q.form === 'middle' ? q.shown : [];
  return (
    <Shell current={current} kind="skip" prompt={prompt} speech={speech} input={<Answer q={q} on={on} />}>
      {q.form === 'groups' ? <Groups groups={q.groups} step={q.step} /> : <Path cells={cells} ask />}
    </Shell>
  );
}

// ---------- Number Chart ----------
function ChartView({ current, q, level }: { current: Current; q: ChartProblem; level: Level }) {
  const prompt = promptOf(q, level), speech = prompt.speech;
  const ready = useAsked(current, speech), on = useTaps(current, ready);
  const tapping = q.input === 'chart';
  return (
    <Shell current={current} kind="chart" prompt={prompt} speech={speech} input={tapping ? null : <Answer q={q} on={on} />}>
      <Chart to={q.to} keep={chartKeeps(q)} hide={c => hiddenCell(q, c)} {...(q.form === 'more' && { from: q.n })} {...(q.form === 'next' && { lit: q.shown })}
        {...(tapping && { onTap: (n: number) => { on.tap(String(n)); }, wrong: on.wrong })} room={tapping ? 190 : 330} />
    </Shell>
  );
}

// ---------- Big Jumps ----------
function JumpView({ current, q, level }: { current: Current; q: JumpProblem; level: Level }) {
  const prompt = promptOf(q, level), ready = useAsked(current, prompt.speech), on = useTaps(current, ready);
  return (
    <Shell current={current} kind="jump" prompt={prompt} speech={prompt.speech} input={<Wheels on={on} />}>
      <Equation text={q.flip ? `? = ${jumpSum(q)}` : `${jumpSum(q)} = ?`} />
      {q.rods && (q.op === 'sub'
        ? <Mat rods={q.a / 10} cubes={0} leaving={q.b / 10} /> // one pile, some of it going: two piles side by side would read as adding
        : <div class="pair-mats">
          <Mat rods={Math.floor(q.a / 10)} cubes={q.a % 10} />
          <Mat rods={Math.floor(q.b / 10)} cubes={q.b % 10} />
        </div>)}
    </Shell>
  );
}

// ---------- Measure It ----------
/** A row he picks by tapping anywhere along it. */
const RowPick = ({ id, on, children, label }: { id: RowId; on: ReturnType<typeof useTaps>; children: ComponentChildren; label: string }) => (
  <button class={cls('m-pick', on.wrong.includes(id) && 'wrong', on.done === id && 'right')} aria-label={label} disabled={on.wrong.includes(id)} onClick={() => on.tap(id)}>{children}</button>
);
function MeasureView({ current, q, level }: { current: Current; q: MeasureProblem; level: Level }) {
  const voice = useVoice(), prompt = promptOf(q, level), ready = useAsked(current, prompt.speech), on = useTaps(current, ready);
  const [laid, setLaid] = useState(0);
  const shell = (input: ComponentChildren, picture: ComponentChildren) => <Shell current={current} kind="measure" prompt={prompt} speech={prompt.speech} input={input}>{picture}</Shell>;
  switch (q.form) {
    case 'order': return shell(null, <div class="m-picks">{q.bars.map(b => <RowPick key={b.id} id={b.id} on={on} label={`Bar ${b.id}`}><BarRow start={b.start} len={b.len} /></RowPick>)}</div>);
    case 'rope': return shell(null, <div class="m-picks">{q.bars.map(b => <RowPick key={b.id} id={b.id} on={on} label={b.id === 'a' ? 'The top bar' : 'The bottom bar'}><BarRow start={b.start} len={b.len}><Rope start={b.start} len={q.rope} /></BarRow></RowPick>)}</div>);
    case 'right': return shell(null, <div class="m-picks">{q.rows.map(r => <RowPick key={r.id} id={r.id} on={on} label={`Row ${r.id}`}><Units len={q.len} laying={r.laying} /></RowPick>)}</div>);
    case 'count': return shell(<Strip on={on} />, <Units len={q.len} />);
    case 'fewer': return shell(
      <div class="choices two">{(['big', 'small'] as const).map(w => <button key={w} class={cls('choice', on.wrong.includes(w) && 'wrong', on.done === w && 'right')} disabled={on.wrong.includes(w)} aria-label={w === 'big' ? 'Big wrenches' : 'Small wrenches'} onClick={() => on.tap(w)}>{w}</button>)}</div>,
      <div class="m-picks"><Units len={q.len} shown={1} size={2} /><Units len={q.len} shown={1} /></div>,
    );
    case 'lay': {
      const lay = (by: 1 | -1) => { const next = Math.max(0, Math.min(STRIP_UNITS, laid + by)); if (next === laid || !ready) return; setLaid(next); sCount(next); void voice.say(said(next)); };
      return shell(
        <div class="builder">
          <button class="choice" aria-label="Lay a wrench" onClick={() => lay(1)}>＋</button>
          <button class="choice" aria-label="Take one off" onClick={() => lay(-1)}>－</button>
          <button class="choice done-btn" aria-label="Done" disabled={on.wrong.includes(String(laid))} onClick={() => on.tap(String(laid))}>✓</button>
        </div>,
        <Laid len={q.len} count={laid} />,
      );
    }
  }
}

// ---------- Shapes ----------
function ShapeView({ current, q, level }: { current: Current; q: ShapeProblem; level: Level }) {
  if (q.form === 'fill') return <ShapeFill current={current} q={q} level={level} />;
  const prompt = promptOf(q, level), ready = useAsked(current, prompt.speech), on = useTaps(current, ready);
  const [found, setFound] = useState<number[]>([]);
  if (q.form === 'sides') return <Shell current={current} kind="shape" prompt={prompt} speech={prompt.speech} input={<Strip on={on} />}><div class="shape-stage"><ShapeArt tile={q.tile} /></div></Shell>;
  function tap(i: number) {
    if (q.form !== 'every') { on.tap(`tile:${i}`); return; }
    if (found.includes(i)) return;
    const next = [...found, i], all = q.targets.every(t => next.includes(t)), verdict = on.tap(q.targets.includes(i) && all ? 'all' : `tile:${i}`);
    if (verdict === 'not-an-answer' || verdict === 'correct') { setFound(next); sCount(next.length); }
  }
  return (
    <Shell current={current} kind="shape" prompt={prompt} speech={prompt.speech} input={null}>
      <div class={cls('shape-tiles', `n${q.tiles.length}`)}>
        {q.tiles.map((t, i) => (
          <button key={i} class={cls('shape-tile', (found.includes(i) || on.done === `tile:${i}`) && 'found', on.wrong.includes(`tile:${i}`) && 'wrong')} aria-label={`Shape ${i + 1}`} disabled={on.wrong.includes(`tile:${i}`)} onClick={() => tap(i)}><ShapeArt tile={t} /></button>
        ))}
      </div>
    </Shell>
  );
}
/** He taps the piece that fits; it turns itself and drops into the next gap. */
function ShapeFill({ current, q, level }: { current: Current; q: Extract<ShapeProblem, { form: 'fill' }>; level: Level }) {
  const voice = useVoice(), prompt = promptOf(q, level), ready = useAsked(current, prompt.speech), on = useTaps(current, ready);
  const [order, setOrder] = useState<number[]>([]), parts = FILLS[q.fill].parts;
  function tap(piece: Piece) {
    const gap = parts.findIndex((p, i) => p.piece === piece && !order.includes(i));
    if (gap < 0) { on.tap(`piece:${piece}`); return; }
    const next = [...order, gap];
    if (next.length < parts.length) { if (!ready || current.signal.aborted || !voice.active) return; setOrder(next); sClink(); void voice.say(PIECE_NAMES[piece]); return; }
    if (on.tap('all') === 'correct') { setOrder(next); sClink(); }
  }
  // parts are drawn in the order he filled them, so a mixed outline fills whichever gap the piece belongs in
  const shown = [...order, ...parts.map((_, i) => i).filter(i => !order.includes(i))];
  return (
    <Shell current={current} kind="shape" prompt={prompt} speech={prompt.speech} input={
      <div class="choices three pieces">{q.bank.map(p => <button key={p} class={cls('choice', on.wrong.includes(`piece:${p}`) && 'wrong')} aria-label={PIECE_NAMES[p]} disabled={on.wrong.includes(`piece:${p}`)} onClick={() => tap(p)}><PieceArt piece={p} /></button>)}</div>
    }>
      <FillArt fill={q.fill} placed={order.length} order={shown} />
    </Shell>
  );
}

export function QuestionView({ current }: { current: Current }) {
  const { q, level, stretch } = current.problem;
  switch (q.kind) {
    case 'ten': return <TenView current={current} q={q} level={level} />;
    case 'on': return <OnView current={current} q={q} level={level} stretch={stretch} />;
    case 'facts': return <FactsView current={current} q={q} level={level} />;
    case 'over': return <OverView current={current} q={q} level={level} />;
    case 'part': return <PartView current={current} q={q} level={level} />;
    case 'scale': return <ScaleView current={current} q={q} level={level} />;
    case 'story': return <StoryView current={current} q={q} level={level} />;
    case 'board': return <BoardView current={current} q={q} level={level} />;
    case 'tens': return <TensView current={current} q={q} level={level} />;
    case 'skip': return <SkipView current={current} q={q} level={level} />;
    case 'chart': return <ChartView current={current} q={q} level={level} />;
    case 'jump': return <JumpView current={current} q={q} level={level} />;
    case 'measure': return <MeasureView current={current} q={q} level={level} />;
    case 'shape': return <ShapeView current={current} q={q} level={level} />;
  }
}

// ---------- Meetings ----------

/** A picture the first time a question needs it: shown, said, and then he taps it. */
export function MeetView({ current }: { current: ProblemInstance<Meet, string> }) {
  const voice = useVoice(), script = MEETING_SCRIPTS[current.problem.meeting], lesson = lessonFor(current.signal);
  const [ready, setReady] = useState(false), [taps, setTaps] = useState(0);
  useEffect(() => {
    void (async () => {
      await playSteps(script.steps, lesson, lesson.run.start());
      if (current.signal.aborted) return;
      lesson.stage.value = script.end;
      setReady(true);
      await voice.say(script.tap);
    })();
  }, []);
  function tap() {
    if (!ready || !voice.active || current.signal.aborted) return;
    const next = taps + 1;
    setTaps(next);
    sCount(next);
    if (script.end.view === 'path') { lesson.stage.value = { ...script.end, at: next }; void voice.say(said(next)); }
    if (next >= script.taps) current.actions.submit('0');
  }
  const stage: Stage | null = lesson.stage.value;
  return (
    <div class="game math meet">
      <div class="ask"><h2>{ready ? script.tap : lesson.caption.value ?? ''}</h2></div>
      <button class={cls('meet-stage', ready && 'pulse')} aria-label={script.tap} onClick={tap}>{stage && <StageView stage={stage} />}</button>
      <div class="helpers" />
    </div>
  );
}
