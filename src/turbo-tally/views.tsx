// The questions on screen. Every question is said as it appears (🔊 says it again) and taps wait until it has finished. Nothing here
// needs reading beyond numbers: cars are told apart by colour and a roof symbol, places are written "1st", "2nd", and the lesson for a
// miss (tally/teach.ts) draws on the same picture. Everything is a tap; there is no dragging.
import { useEffect, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { sClink, sNope } from '../audio/sfx';
import type { ProblemInstance } from '../learning/round';
import { QuizCar } from './art/Art';
import type { Asking, Meet } from './mix';
import { howManyMoreLine, howManyWonLine, passedLine, passesLine, tapPlaceLine, whichPlaceLine, type Phrase } from './phrases';
import { bundlesOf, CHART_TOP, placeText, TALLY_MOST, type ChartProblem, type MoreProblem, type OrderProblem, type PlaceProblem, type Sign, type TallyProblem } from './tally/problems';
import { help, lessonFor, type Lesson } from './tally/teach';
import { useVoice, type Item } from './voice';

type Current = ProblemInstance<Asking, string>;
const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');

/** Says the question once, and marks when it's done. */
function useAsked(current: { signal: AbortSignal }, speech: readonly Item[]) {
  const voice = useVoice();
  const [ready, setReady] = useState(false);
  useEffect(() => { void voice.say(...speech).then(() => { if (!current.signal.aborted) setReady(true); }); }, []);
  return ready;
}

/** `ready`: the question has been said and taps count (the browser tour waits on it, as he does). */
function Shell({ current, kind, text, speech, stage, controls, ready }: {
  current: Current; kind: string; text: string; speech: readonly Item[]; stage: ComponentChildren; controls?: ComponentChildren; ready: boolean;
}) {
  const voice = useVoice();
  return (
    <div class={cls('game', 'tt', ...kind.split(' ').map(k => `k-${k}`))} data-ready={ready ? 'yes' : 'no'}>
      <div class="ask">
        <button class="say-btn" aria-label="Say it again" onClick={() => void voice.say(...speech)}>🔊</button>
        <h2>{text}</h2>
        <button class="help-btn" aria-label="Help" onClick={() => current.actions.help(() => help(current.problem, current.signal))}>🔎</button>
      </div>
      <div class="tt-body">
        <div class="tt-stage">{stage}</div>
        {controls && <div class="tt-controls">{controls}</div>}
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

function NumberChoices({ choices, label, onTap, wrong, done, hint, text = String }: { choices: readonly number[]; label?: (n: number) => string; onTap(a: string): void; wrong: string[]; done: string | null; hint: string | null; text?: (n: number) => string }) {
  return (
    <div class="choices nums">
      {choices.map(c => (
        <button key={c} class={cls('choice', wrong.includes(String(c)) && 'wrong', done === String(c) && 'right', hint === String(c) && 'hint')} aria-label={label ? label(c) : text(c)} onClick={() => onTap(String(c))}>{text(c)}</button>
      ))}
    </div>
  );
}

// ---------- Podium ----------

/** Where each car is shown, front first, once a lesson has moved one past another. */
function shownOrder(q: PlaceProblem, moved: boolean) {
  const cars = [...q.cars], i = q.place - 1;
  if (!moved) return cars;
  if (q.form === 'passes' && i > 0) [cars[i - 1], cars[i]] = [cars[i]!, cars[i - 1]!];
  if (q.form === 'passed' && i < cars.length - 1) [cars[i + 1], cars[i]] = [cars[i]!, cars[i + 1]!];
  return cars;
}

export function Road({ q, lesson, onTap, wrong, done }: { q: PlaceProblem; lesson: Lesson; onTap?: (c: string) => void; wrong: string[]; done: string | null }) {
  const order = shownOrder(q, lesson.show.value === 'moved'), step = lesson.step.value, hint = lesson.hint.value;
  const n = order.length, pointer = q.form !== 'tap';
  return (
    <div class={cls('tt-road', `n${n}`, lesson.show.value === 'finish' && 'show-finish')} role="group" aria-label="Cars racing to the finish line">
      <div class="lane">
        {[...order].reverse().map(colour => {
          const at = order.indexOf(colour) + 1, counted = at <= step, target = pointer && colour === q.target;
          const body = (
            <>
              {counted && <span class={cls('place-tag', at === step && 'now')}>{placeText(at)}</span>}
              {target && <span class="pointer" aria-hidden="true">▼</span>}
              <QuizCar colour={colour} />
            </>
          );
          return onTap
            ? <button key={colour} class={cls('road-car', counted && 'lit', wrong.includes(colour) && 'wrong', done === colour && 'right', hint === colour && 'hint')} aria-label={`${colour} car`} onClick={() => onTap(colour)}>{body}</button>
            : <span key={colour} class={cls('road-car', counted && 'lit', target && 'target')}>{body}</span>;
        })}
        <span class="finish" aria-hidden="true"><span class="flag">🏁</span></span>
      </div>
      <div class="way" aria-hidden="true"><svg viewBox="0 0 140 40"><path d="M6 20 H104 M90 6 L118 20 L90 34" fill="none" stroke="#000" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" /><path d="M6 20 H104 M90 6 L118 20 L90 34" fill="none" stroke="#ffd23f" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" /></svg></div>
    </div>
  );
}

function PlaceView({ current, q, waiting }: { current: Current; q: PlaceProblem; waiting: boolean }) {
  const line: Phrase = q.form === 'tap' ? tapPlaceLine(q.place) : q.form === 'which' ? whichPlaceLine(q.target) : q.form === 'passes' ? passesLine(q.target) : passedLine(q.target);
  const speech = [line], ready = useAsked(current, speech), lesson = lessonFor(current.signal), { tap, wrong, done, can } = useChoice(current, ready, waiting);
  return (
    <Shell current={current} ready={can} kind={`place form-${q.form}`} text={line} speech={speech}
      stage={<Road q={q} lesson={lesson} onTap={q.form === 'tap' ? tap : undefined} wrong={wrong} done={done} />}
      controls={q.form === 'tap' ? null : <NumberChoices choices={q.choices} text={placeText} label={placeText} onTap={tap} wrong={wrong} done={done} hint={lesson.hint.value} />} />
  );
}

// ---------- Faster Car ----------

/** A number as tens rods and ones cubes. */
function Rods({ n, lit }: { n: number; lit: boolean }) {
  const tens = Math.floor(n / 10), ones = n % 10;
  return (
    <svg class={cls('rods', lit && 'lit')} viewBox={`0 0 ${Math.max(1, tens) * 16 + 12 + Math.ceil(ones / 5) * 16} 104`} aria-hidden="true">
      {Array.from({ length: tens }, (_, i) => <g key={i}>{Array.from({ length: 10 }, (_, j) => <rect key={j} x={i * 16} y={j * 10 + 2} width="12" height="10" class="unit ten" />)}</g>)}
      {Array.from({ length: ones }, (_, i) => <rect key={i} x={Math.max(1, tens) * 16 + 12 + Math.floor(i / 5) * 16} y={92 - (i % 5) * 12} width="12" height="10" class="unit one" />)}
    </svg>
  );
}

function SpeedSign({ n, rods, lit }: { n: number; rods: boolean; lit: boolean }) {
  return <span class={cls('speed', lit && 'lit')}><span class="speed-num">{n}</span>{rods && <Rods n={n} lit={lit} />}</span>;
}

const SIGN_LABEL: Record<Sign, string> = { '<': 'Less than', '=': 'Same as', '>': 'More than' };
function MoreView({ current, q, waiting }: { current: Current; q: MoreProblem; waiting: boolean }) {
  const line: Phrase = q.form === 'sign' ? 'Which sign goes in the middle?' : q.form === 'faster' ? 'Tap the faster car.' : 'Tap the slower car.';
  const speech = [line], ready = useAsked(current, speech), lesson = lessonFor(current.signal), { tap, wrong, done, can } = useChoice(current, ready, waiting);
  const rods = lesson.show.value === 'rods', focus = lesson.focus.value, hint = lesson.hint.value;
  if (q.form === 'sign') {
    const shown = done ?? (hint && lesson.show.value ? hint : null);
    return (
      <Shell current={current} ready={can} kind="more form-sign" text={line} speech={speech}
        stage={<div class="compare"><SpeedSign n={q.a} rods={rods} lit={focus === 0} /><span class={cls('sign-slot', shown && 'filled')}>{shown ?? '?'}</span><SpeedSign n={q.b} rods={rods} lit={focus === 1} /></div>}
        controls={<div class="choices signs">{(['<', '=', '>'] as const).map(s => (
          <button key={s} class={cls('choice', wrong.includes(s) && 'wrong', done === s && 'right', hint === s && 'hint')} aria-label={SIGN_LABEL[s]} onClick={() => tap(s)}>{s}</button>
        ))}</div>} />
    );
  }
  return (
    <Shell current={current} ready={can} kind={`more form-${q.form}`} text={line} speech={speech}
      stage={<div class="duel">{(['a', 'b'] as const).map((k, i) => {
        const n = k === 'a' ? q.a : q.b;
        return (
          <button key={k} class={cls('duel-car', wrong.includes(k) && 'wrong', done === k && 'right', hint === k && 'hint')} aria-label={`Speed ${n}`} onClick={() => tap(k)}>
            <SpeedSign n={n} rods={rods} lit={focus === i} /><QuizCar colour={i ? 'blue' : 'orange'} />
          </button>
        );
      })}</div>} />
  );
}

// ---------- Tally Board ----------

/** Tally marks: bundles of five (four up, the fifth across), then the loose marks. Marks up to `lit` glow. */
export function TallyMarks({ n, lit = 0, class: c = '' }: { n: number; lit?: number; class?: string }) {
  const { fives, ones } = bundlesOf(n), groups = fives + (ones ? 1 : 0), perRow = 3, rows = Math.max(1, Math.ceil(groups / perRow));
  const W = 80, H = 70, marks: preact.JSX.Element[] = [];
  for (let g = 0; g < groups; g++) {
    const x0 = (g % perRow) * W + 10, y0 = Math.floor(g / perRow) * H + 8, count = g < fives ? 5 : ones;
    for (let m = 0; m < Math.min(4, count); m++) {
      const k = g * 5 + m + 1;
      marks.push(<line key={`${g}-${m}`} x1={x0 + m * 13 + 6} y1={y0} x2={x0 + m * 13 + 4} y2={y0 + 52} class={cls('mark', k <= lit && 'on')} />);
    }
    if (count === 5) { const k = g * 5 + 5; marks.push(<line key={`${g}-x`} x1={x0 - 4} y1={y0 + 40} x2={x0 + 52} y2={y0 + 10} class={cls('mark', 'across', k <= lit && 'on')} />); }
  }
  return <svg class={cls('tally-marks', c)} viewBox={`0 0 ${Math.min(groups || 1, perRow) * W + 8} ${rows * H + 4}`} role="img" aria-label="Tally marks">{marks}</svg>;
}

function Board({ children, class: c = '' }: { children: ComponentChildren; class?: string }) {
  return <div class={cls('pit-board', c)}>{children}</div>;
}

function TallyView({ current, q, waiting }: { current: Current; q: TallyProblem; waiting: boolean }) {
  const lesson = lessonFor(current.signal), voice = useVoice();
  const speech: Item[] = q.form === 'read' ? ['How many tally marks?'] : q.form === 'make' ? ['Make a tally that shows', `${q.n}` as Phrase, 'Tap plus to add a mark. Then tap the check.'] : ['Which tally shows', `${q.n}` as Phrase];
  const text = q.form === 'read' ? 'How many tally marks?' : q.form === 'make' ? `Make a tally that shows ${q.n}.` : `Which tally shows ${q.n}?`;
  const ready = useAsked(current, speech), { tap, wrong, done, can } = useChoice(current, ready, waiting);
  // no running count on his board while he makes it, or he'd tap ＋ until the digit matched and never read a tally; the lesson counts it
  const [made, setMade] = useState(0), [madeDone, setMadeDone] = useState(false);
  const step = lesson.step.value;
  if (q.form === 'make') {
    const ok = ready && !waiting && !madeDone;
    const add = () => { if (!ok) return; if (made >= TALLY_MOST) { sNope(); return; } sClink(); setMade(made + 1); };
    const back = () => { if (ok && made > 0) { sClink(); setMade(made - 1); } };
    const check = () => {
      if (!ok || current.actions.busy) return;
      if (!made) { sNope(); void voice.say('Tap plus to add a mark. Then tap the check.'); return; }
      const verdict = current.actions.submit(String(made));
      if (verdict === 'correct') setMadeDone(true);
      // a miss keeps his marks on the board: the lesson counts them, and he fixes them with ＋ and ⌫
    };
    const model = lesson.show.value === 'model';
    return (
      <Shell current={current} ready={ok} kind="tally form-make" text={text} speech={speech}
        stage={<div class="boards">
          <Board class={madeDone ? 'right' : ''}>{made ? <TallyMarks n={made} lit={model ? 0 : step} /> : <span class="board-empty">?</span>}<span class="board-count" aria-hidden="true">{!model && step > 0 ? step : ''}</span></Board>
          {model && <Board class="model"><TallyMarks n={q.n} lit={step} /></Board>}
        </div>}
        controls={<div class="make-pad">
          <button class="pad-btn back" aria-label="Take away a mark" onClick={back}>⌫</button>
          <button class={cls('pad-btn add', !made && ok && 'pulse')} aria-label="Add a mark" onClick={add}>＋</button>
          <button class={cls('pad-btn done', made > 0 && ok && 'pulse', lesson.hint.value && 'hint')} aria-label="Done" onClick={check}>✓</button>
        </div>} />
    );
  }
  if (q.form === 'pick') {
    return (
      <Shell current={current} ready={can} kind="tally form-pick" text={text} speech={speech}
        stage={<div class="boards pick">{q.choices.map((c, k) => (
          <button key={k} class={cls('pit-board', 'pick-board', wrong.includes(String(c)) && 'wrong', done === String(c) && 'right', lesson.hint.value === String(c) && 'hint')} aria-label={`Tally ${k + 1}`} onClick={() => tap(String(c))}>
            <TallyMarks n={c} lit={lesson.focus.value === k ? step : 0} />
          </button>
        ))}</div>} />
    );
  }
  return (
    <Shell current={current} ready={can} kind="tally form-read" text={text} speech={speech}
      stage={<Board><TallyMarks n={q.n} lit={step} />{step > 0 && <span class="board-count">{step}</span>}</Board>}
      controls={<NumberChoices choices={q.choices} onTap={tap} wrong={wrong} done={done} hint={lesson.hint.value} />} />
  );
}

// ---------- Race Chart ----------

function Chart({ q, lesson, onCar, wrong, done }: { q: ChartProblem; lesson: Lesson; onCar?: (c: string) => void; wrong: string[]; done: string | null }) {
  const focus = lesson.focus.value, step = lesson.step.value, show = lesson.show.value, hint = lesson.hint.value;
  const big = q.form === 'more' ? q.rows.findIndex(r => r.car === q.car) : -1, small = q.form === 'more' ? q.rows.findIndex(r => r.car === q.other) : -1;
  const pairTop = small >= 0 ? q.rows[small]!.wins : 0;
  const top = q.graph === 'picture' ? 8 : CHART_TOP, U = 26, colW = 90, left = q.graph === 'bar' ? 40 : 10, base = top * U + 14;
  const unitLit = (k: number, u: number) => {
    if (show === 'pairs') return (k === big || k === small) && u <= pairTop;
    if (show === 'left') return k === big && u > pairTop && u <= step;
    if (show === 'total') return focus !== null && (k < focus || (k === focus && u <= step));
    return k === focus && u <= step;
  };
  return (
    <div class={cls('chart', q.graph)}>
      <svg class="chart-svg" viewBox={`0 0 ${left + colW * 3 + 10} ${base + 6}`} role="img" aria-label={q.graph === 'bar' ? 'A bar graph of races won' : 'A picture graph of races won'}>
        {q.graph === 'bar' && Array.from({ length: top + 1 }, (_, v) => (
          <g key={v}><line x1={left} x2={left + colW * 3} y1={base - v * U} y2={base - v * U} class={cls('grid', v === 0 && 'axis')} />
            <text x={left - 8} y={base - v * U + 6} class="tick">{v}</text></g>
        ))}
        {q.rows.map((r, k) => {
          const x = left + k * colW + 14, w = colW - 28;
          return (
            <g key={r.car} class={cls('col', `c-${r.car}`, focus === k && 'focus')}>
              {Array.from({ length: r.wins }, (_, i) => {
                const u = i + 1, y = base - u * U;
                return q.graph === 'picture'
                  ? <g key={u} class={cls('trophy', unitLit(k, u) && 'on')} transform={`translate(${x + w / 2} ${y + U / 2})`}><path d="M-9 -10 H9 V-4 Q9 4 0 5 Q-9 4 -9 -4 Z M-3 5 H3 V8 H6 V11 H-6 V8 H-3 Z" /></g>
                  : <rect key={u} x={x} y={y} width={w} height={U} class={cls('bar-unit', unitLit(k, u) && 'on')} />;
              })}
              {show === 'pairs' && k === small && Array.from({ length: pairTop }, (_, i) => (
                <line key={i} class="pair" x1={x + w} y1={base - (i + .5) * U} x2={left + big * colW + 14} y2={base - (i + .5) * U} />
              ))}
              {(show === 'top' && k === focus) && <line class="top-line" x1={left} x2={x + w} y1={base - r.wins * U} y2={base - r.wins * U} />}
            </g>
          );
        })}
      </svg>
      <div class="chart-cars">
        {q.rows.map(r => onCar
          ? <button key={r.car} class={cls('chart-car', wrong.includes(r.car) && 'wrong', done === r.car && 'right', hint === r.car && 'hint')} aria-label={`${r.car} car`} onClick={() => onCar(r.car)}><QuizCar colour={r.car} /></button>
          : <span key={r.car} class={cls('chart-car', (r.car === q.car || r.car === q.other) && 'asked')}><QuizCar colour={r.car} /></span>)}
      </div>
    </div>
  );
}

function ChartView({ current, q, waiting }: { current: Current; q: ChartProblem; waiting: boolean }) {
  const line: Phrase = q.form === 'most' ? 'Which car won the most races?' : q.form === 'fewest' ? 'Which car won the fewest races?' : q.form === 'each' ? howManyWonLine(q.car!) : q.form === 'more' ? howManyMoreLine(q.car!, q.other!) : 'How many races did they win in all?';
  const speech = [line], ready = useAsked(current, speech), lesson = lessonFor(current.signal), { tap, wrong, done, can } = useChoice(current, ready, waiting);
  const pickCar = q.form === 'most' || q.form === 'fewest';
  return (
    <Shell current={current} ready={can} kind={`chart form-${q.form}`} text={line} speech={speech}
      stage={<Chart q={q} lesson={lesson} onCar={pickCar ? tap : undefined} wrong={wrong} done={done} />}
      controls={pickCar ? null : <NumberChoices choices={q.choices} onTap={tap} wrong={wrong} done={done} hint={lesson.hint.value} />} />
  );
}

// ---------- Line Up ----------

/** A number line with some numbers dropped on it. Up to 20 it counts in ones; past that, in tens. */
export function NumberLine({ nums, focus, marks = [] }: { nums: readonly number[]; focus: number | null; marks?: readonly number[] }) {
  const all = [...nums, ...marks], small = Math.max(...all) <= 20, lo = small ? 0 : Math.floor(Math.min(...all) / 10) * 10, hi = small ? 20 : Math.ceil((Math.max(...all) + 1) / 10) * 10;
  const W = 600, x = (v: number) => 20 + ((v - lo) / (hi - lo)) * (W - 40);
  const ticks = Array.from({ length: (hi - lo) / (small ? 1 : 2) + 1 }, (_, i) => lo + i * (small ? 1 : 2));
  // Numbers close together (38 and 39, or 31 and 33 on a line to 100) would print over each other: a label that would touch the one
  // before it on its row goes up a row.
  const AXIS = 100, ROWS = [70, 34, -2], GAP = 38, rowOf = new Map<number, number>(), ends: number[] = ROWS.map(() => -Infinity);
  for (const v of [...new Set(all)].sort((a, b) => a - b)) {
    const r = Math.max(0, ends.findIndex(e => x(v) - e >= GAP));
    rowOf.set(v, r); ends[r] = x(v);
  }
  const label = (v: number) => <text x={x(v)} y={ROWS[rowOf.get(v) ?? 0]}>{v}</text>;
  const top = ROWS[Math.max(0, ...rowOf.values())]! - 26; // only as tall as the rows it uses
  return (
    <svg class="number-line" viewBox={`0 ${top} ${W} ${140 - top}`} role="img" aria-label="A number line">
      <line x1="10" x2={W - 10} y1={AXIS} y2={AXIS} class="nl-axis" />
      {ticks.map(t => <g key={t}><line x1={x(t)} x2={x(t)} y1={t % 10 === 0 || (small && t % 5 === 0) ? AXIS - 12 : AXIS - 6} y2={AXIS + 6} class="nl-tick" />{(t % 10 === 0 || (small && t % 5 === 0)) && <text x={x(t)} y={AXIS + 30} class="nl-label">{t}</text>}</g>)}
      {[...rowOf].filter(([, r]) => r > 0).map(([v, r]) => <line key={`s${v}`} x1={x(v)} x2={x(v)} y1={ROWS[r]! + 6} y2={AXIS - 10} class="nl-stalk" />)}
      {marks.map(m => <g key={`m${m}`} class="nl-mark"><circle cx={x(m)} cy={AXIS} r="9" />{label(m)}</g>)}
      {nums.map(v => <g key={v} class={cls('nl-num', focus === v && 'on')}><circle cx={x(v)} cy={AXIS} r="11" />{label(v)}</g>)}
    </svg>
  );
}

function NumberCar({ n, colour }: { n: number; colour: 'red' | 'blue' | 'green' }) {
  return <><span class="num-sign">{n}</span><QuizCar colour={colour} /></>;
}
const LINE_COLOURS = ['red', 'blue', 'green'] as const;

function OrderView({ current, q, waiting }: { current: Current; q: OrderProblem; waiting: boolean }) {
  const lesson = lessonFor(current.signal);
  const speech: Item[] = q.form === 'between' ? ['Which number goes between', `${q.lo}` as Phrase, 'and', `${q.hi}` as Phrase] : [q.form === 'up' ? 'Tap the cars from smallest to biggest.' : 'Tap the cars from biggest to smallest.'];
  const text = q.form === 'between' ? `Which number goes between ${q.lo} and ${q.hi}?` : q.form === 'up' ? 'Tap the cars from smallest to biggest.' : 'Tap the cars from biggest to smallest.';
  const ready = useAsked(current, speech), { tap, wrong, done, can } = useChoice(current, ready, waiting);
  const [picked, setPicked] = useState<number[]>([]), [finished, setFinished] = useState(false);
  const line = lesson.show.value === 'line', hint = lesson.hint.value;
  if (q.form === 'between') {
    return (
      <Shell current={current} ready={can} kind="order form-between" text={text} speech={speech}
        stage={<div class="between">
          <div class="gap-row"><span class="num-sign">{q.lo}</span><span class={cls('num-sign', 'blank', done && 'filled')}>{done ?? '?'}</span><span class="num-sign">{q.hi}</span></div>
          {line && <NumberLine nums={[...q.nums]} focus={lesson.focus.value} marks={[q.lo, q.hi]} />}
        </div>}
        controls={<div class="line-cars">{q.nums.map((n, k) => (
          <button key={n} class={cls('line-car', wrong.includes(String(n)) && 'wrong', done === String(n) && 'right', hint === String(n) && 'hint')} aria-label={`Number ${n}`} onClick={() => tap(String(n))}><NumberCar n={n} colour={LINE_COLOURS[k]!} /></button>
        ))}</div>} />
    );
  }
  const ok = ready && !waiting && !finished;
  function pickCar(n: number) {
    if (!ok || current.actions.busy || picked.includes(n)) return;
    sClink();
    let next = [...picked, n];
    if (next.length === 2) next = [...next, q.nums.find(x => !next.includes(x))!]; // the last one goes in by itself
    setPicked(next);
    if (next.length < 3) return;
    const verdict = current.actions.submit(next.join(','));
    if (verdict === 'correct') setFinished(true);
    if (verdict === 'incorrect') setTimeout(() => setPicked([]), 900);
  }
  return (
    <Shell current={current} ready={ok} kind={`order form-${q.form}`} text={text} speech={speech}
      stage={<div class="lineup">
        <div class="line-cars">{q.nums.map((n, k) => (
          <button key={n} class={cls('line-car', picked.includes(n) && 'gone', hint === String(n) && !picked.includes(n) && 'hint')} aria-label={`Number ${n}`} onClick={() => pickCar(n)}><NumberCar n={n} colour={LINE_COLOURS[k]!} /></button>
        ))}</div>
        <div class={cls('tt-slots', finished && 'right')} aria-label={q.form === 'up' ? 'Smallest to biggest' : 'Biggest to smallest'}>
          {[0, 1, 2].map(i => <span key={i} class={cls('tt-slot', picked[i] !== undefined && 'full')}>{picked[i] ?? ''}</span>)}
          <span class="tt-slot-way" aria-hidden="true">{q.form === 'up' ? 'small ➜ big' : 'big ➜ small'}</span>
        </div>
        {line && <NumberLine nums={[...q.nums]} focus={lesson.focus.value} />}
      </div>} />
  );
}

// ---------- the question, and Meetings ----------

export function QuestionView({ current, waiting }: { current: Current; waiting: boolean }) {
  const q = current.problem.q;
  if (q.kind === 'place') return <PlaceView current={current} q={q} waiting={waiting} />;
  if (q.kind === 'more') return <MoreView current={current} q={q} waiting={waiting} />;
  if (q.kind === 'tally') return <TallyView current={current} q={q} waiting={waiting} />;
  if (q.kind === 'chart') return <ChartView current={current} q={q} waiting={waiting} />;
  return <OrderView current={current} q={q} waiting={waiting} />;
}

/** The first time a question needs tally marks, or the signs, they're shown and said, and he taps Go. */
export function MeetView({ current, waiting }: { current: ProblemInstance<Meet, string>; waiting: boolean }) {
  const voice = useVoice(), meeting = current.problem.meeting;
  const [ready, setReady] = useState(false), [lit, setLit] = useState(0), [stage, setStage] = useState(0);
  useEffect(() => {
    void (async () => {
      if (meeting === 'tally') {
        await voice.say('These are tally marks.');
        await voice.say('Each mark is one.');
        for (let i = 1; i <= 5 && voice.active; i++) { setLit(i); await voice.say(`${i}` as Phrase); }
        await voice.say('The fifth mark goes across.', 'That makes a bundle of five.');
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
  return (
    <div class={cls('game', 'tt', 'meet', `meet-${meeting}`)} data-ready={ready && !waiting ? 'yes' : 'no'}>
      <div class="ask"><h2>{meeting === 'tally' ? 'Tally marks' : 'Signs'}</h2></div>
      <div class="tt-body">
        <div class="tt-stage">
          {meeting === 'tally'
            ? <div class="pit-board"><TallyMarks n={5} lit={lit} /></div>
            : <div class="sign-meet">{([[3, '<', 8], [8, '>', 3], [5, '=', 5]] as const).map(([a, s, b], i) => (
                <div key={s} class={cls('sign-row', stage === i + 1 && 'lit', stage > 0 && stage < i + 1 && 'dim')}><span class="num-sign">{a}</span><span class="sign-slot filled">{s}</span><span class="num-sign">{b}</span></div>
              ))}</div>}
        </div>
        <div class="tt-controls"><button class={cls('big-btn', 'go', 'go-btn', ready && 'pulse')} aria-label="Go" onClick={go}><span class="e">▶</span><span class="go-word">Go</span></button></div>
      </div>
    </div>
  );
}
