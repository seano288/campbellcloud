// The questions on screen. Every question is said as it appears (🔊 says it again) and taps wait until it has finished. Nothing here
// needs reading beyond numbers and a few short words (Yes, No, Odd, Even): the pictures are the City's own things, buses with people
// in their windows, building fronts with windows in rows, people pairing up for a ride, house numbers along a street, trucks
// sharing boxes. The lesson for a miss (math/teach.ts) draws on the same picture. Everything is a tap; there is no dragging.
import { useEffect, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { sClink, sNope } from '../audio/sfx';
import type { ProblemInstance } from '../learning/round';
import { addingSentence, timesCard, type ArrayQ, type CountQ, type Grid, type GroupsQ, type PairQ, type Question, type ShareQ, type TimesQ } from './math/problems';
import { help, lessonFor, STEP_LINE, type Lesson } from './math/teach';
import type { Asking, Meet } from './mix';
import { n, type Phrase } from './phrases';
import { useVoice, type Item } from './voice';

type Current = ProblemInstance<Asking, string>;
const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');

// ---------- what each question says ----------

type Part = Phrase | number;
interface Prompt { text: string; speech: Item[] }
const line = (...parts: Part[]): Prompt => ({
  text: parts.map(String).join(' ').replace(/ ([.?!])/g, '$1').replace(/\.(\S)/g, '. $1'),
  speech: parts.map(p => (typeof p === 'number' ? n(p) : p)),
});
export function promptOf(q: Question): Prompt {
  switch (q.kind) {
    case 'groups':
      switch (q.form) {
        case 'same': return line('Do all the buses have the same number of people?');
        case 'buses': return line('How many buses?');
        case 'each': return line('How many people on each bus?');
        case 'total': return line(q.groups, 'buses.', q.each, 'on each.', 'How many people?');
        case 'words': return { ...line(q.groups, 'groups of', q.each, 'How many in all?'), text: `${q.groups} groups of ${q.each}. How many in all?` };
        case 'pick': return { ...line('Which picture shows', q.groups, 'groups of', q.each), text: `Which picture shows ${q.groups} groups of ${q.each}?` };
      }
      break;
    case 'array':
      switch (q.form) {
        case 'rows': return line('How many rows?');
        case 'cols': return line('How many windows in each row?');
        case 'total': return line('How many windows?');
        case 'sentence': return line('Which adding sentence matches the building?');
        case 'turn': return { ...line('This building has', q.rows, 'rows of', q.cols, 'That one has', q.other.rows, 'rows of', q.other.cols, 'Do they have the same number of windows?'), text: `This building has ${q.rows} rows of ${q.cols}. That one has ${q.other.rows} rows of ${q.other.cols}. Do they have the same number of windows?` };
      }
      break;
    case 'pair':
      switch (q.form) {
        case 'partner': return line('Everyone pairs up for a ride.', 'Does everyone get a partner?');
        case 'oddEven': return q.picture ? line('Is it odd or even?') : line('Is', q.n, 'odd or even?');
        case 'which': return line(q.want === 'even' ? 'Which number is even?' : 'Which number is odd?');
        case 'double': return { ...line('Which double makes', q.n), text: `Which double makes ${q.n}?` };
        case 'half': return line(q.n, 'people make two equal teams.', 'How many on each team?');
      }
      break;
    case 'count': return line(STEP_LINE[q.step], q.form === 'next' ? 'What number comes next?' : 'What number is missing?');
    case 'share':
      if (q.form === 'deal') return line(q.total, 'boxes.', q.trucks, 'trucks.', 'Share them fairly.', 'Tap a truck to give it a box. Then tap the check.');
      if (q.form === 'each') return line(q.total, 'boxes.', q.trucks, 'trucks.', 'How many on each truck?');
      return line(q.total, 'boxes.', q.each, 'on each truck.', 'How many trucks?');
    case 'times':
      if (q.form === 'match') return { ...line('Which building shows', q.rows, 'rows of', q.cols), text: `Which building shows ${q.rows} rows of ${q.cols}?` };
      if (q.form === 'write') return line('Which one tells about this building?');
      if (q.form === 'fact') return { text: `${q.a} × ${q.b}. ${q.a} groups of ${q.b}. How many in all?`, speech: [n(q.a), 'times', n(q.b), n(q.a), 'groups of', n(q.b), 'How many in all?'] };
      return { text: `${q.a} × ${q.b}: ${q.a} rows of ${q.b}. Which is the same?`, speech: [n(q.a), 'times', n(q.b), n(q.a), 'rows of', n(q.b), 'is the same as which?'] };
  }
  return line('Try again!');
}
/** What the × sign question shows written ("3 × 4"), said "3 rows of 4" at Level 1. */
const timesText = (q: TimesQ) => (q.form === 'match' ? timesCard(q.rows, q.cols) : null);

/** Says the question once, and marks when it's done. */
function useAsked(current: { signal: AbortSignal }, speech: readonly Item[]) {
  const voice = useVoice();
  const [ready, setReady] = useState(false);
  useEffect(() => { void voice.say(...speech).then(() => { if (!current.signal.aborted) setReady(true); }); }, []);
  return ready;
}

/** `ready`: the question has been said and taps count (the browser tour waits on it, as he does). */
function Shell({ current, kind, prompt, stage, controls, ready }: { current: Current; kind: string; prompt: Prompt; stage: ComponentChildren; controls?: ComponentChildren; ready: boolean }) {
  const voice = useVoice();
  return (
    <div class={cls('game', 'sl', ...kind.split(' ').map(k => `k-${k}`))} data-ready={ready ? 'yes' : 'no'}>
      <div class="ask">
        <button class="say-btn" aria-label="Say it again" onClick={() => void voice.say(...prompt.speech)}>🔊</button>
        <h2>{prompt.text}</h2>
        <button class="help-btn" aria-label="Help" onClick={() => current.actions.help(signal => help(current.problem, signal))}>🔎</button>
      </div>
      <div class="sl-body">
        <div class="sl-stage">{stage}</div>
        {controls && <div class="sl-controls">{controls}</div>}
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
type Choice = ReturnType<typeof useChoice>;

function Choices({ values, labels, c, hint, kind = 'nums' }: { values: readonly string[]; labels?: readonly string[]; c: Choice; hint: string | null; kind?: string }) {
  return (
    <div class={`choices sl-choices ${kind}`}>
      {values.map((v, i) => (
        <button key={v} class={cls('choice', c.wrong.includes(v) && 'wrong', c.done === v && 'right', hint === v && 'hint')} aria-label={labels?.[i] ?? v} onClick={() => c.tap(v)}>{labels?.[i] ?? v}</button>
      ))}
    </div>
  );
}
const nums = (xs: readonly number[]) => xs.map(String);

// ---------- pictures ----------

const SEAT = 22;
/** A bus from the side with `people` in its windows (five to a row). */
function Bus({ people, lit, focus, count, onTap }: { people: number; lit: boolean; focus: boolean; count?: number | null; onTap?: () => void }) {
  const cols = 5, rows = Math.max(1, Math.ceil(people / cols)), w = cols * SEAT + 22, h = rows * SEAT + 30;
  const body = (
    <svg class={cls('sl-bus', lit && 'lit', focus && 'focus')} viewBox={`0 0 ${w} ${h + 12}`} aria-hidden="true">
      <rect x="2" y="2" width={w - 4} height={h} rx="10" class="bus-body" />
      <rect x={w - 16} y="8" width="10" height={h - 22} rx="3" class="bus-door" />
      {Array.from({ length: rows * cols }, (_, i) => {
        const x = 8 + (i % cols) * SEAT, y = 8 + Math.floor(i / cols) * SEAT, on = i < people;
        return <g key={i}><rect x={x} y={y} width={SEAT - 4} height={SEAT - 4} rx="3" class="bus-window" />{on && <><circle cx={x + 9} cy={y + 8} r="5" class="head" /><rect x={x + 3} y={y + 12} width="12" height="6" rx="3" class="shirt" style={{ fill: `hsl(${(i * 53) % 360} 70% 55%)` }} /></>}</g>;
      })}
      <circle cx="24" cy={h + 2} r="9" class="wheel" /><circle cx={w - 28} cy={h + 2} r="9" class="wheel" />
    </svg>
  );
  return (
    <span class="bus-wrap">
      {count != null && <span class="run-count">{count}</span>}
      {onTap ? <button class="bus-btn" aria-label="Bus" onClick={onTap}>{body}</button> : body}
    </span>
  );
}

/** How wide each bus is drawn, as CSS: as big as fits in its container (the stage, or a picture) for the best number of columns,
 *  allowing for the gaps and the count that sits on a bus's corner, and never wider than 440px. */
function busWidth(buses: readonly number[], gap: number): string {
  const rows = Math.max(1, ...buses.map(p => Math.ceil(p / 5))), ratio = ((5 * SEAT + 22) / (rows * SEAT + 42)).toFixed(3), n = buses.length;
  const fits: string[] = [];
  for (let c = 1; c <= Math.min(n, 4); c++) {
    const r = Math.ceil(n / c);
    fits.push(`min((100cqw - ${(c - 1) * gap + 4}px) / ${c}, (100cqh - ${(r - 1) * gap + 10}px) / ${r} * ${ratio})`);
  }
  return `min(440px, max(${fits.join(', ')}))`;
}

function Buses({ buses, lesson, onPick, pickedClass, tight }: { buses: readonly number[]; lesson: Lesson; onPick?: () => void; pickedClass?: string; tight?: boolean }) {
  const step = lesson.step.value, focus = lesson.focus.value, show = lesson.show.value, tapping = lesson.tapping.value;
  const same = buses.every(b => b === buses[0]);
  return (
    <div class={cls('sl-buses', `n${buses.length}`, pickedClass)} style={`--bw:${busWidth(buses, tight ? 6 : 14)}`} onClick={onPick}>
      {buses.map((p, i) => (
        <Bus key={i} people={p} lit={i < step && show !== 'one'} focus={focus === i}
          count={i < step && same && show !== 'one' ? (i + 1) * p : show === 'one' && i === 0 && step > 0 ? step : null}
          onTap={tapping ? () => lesson.tap() : undefined} />
      ))}
    </div>
  );
}

const WIN = 24, GAP = 8;
/** A building's front: `rows` rows going across, `cols` windows in each. Rows light from the top as they're counted. */
export function Building({ g, lesson, small, tipped, tap }: { g: Grid; lesson?: Lesson; small?: boolean; tipped?: boolean; tap?: boolean }) {
  const step = lesson?.step.value ?? 0, show = lesson?.show.value, tapping = !!lesson?.tapping.value && tap;
  const w = g.cols * (WIN + GAP) + GAP + 12, h = g.rows * (WIN + GAP) + GAP + 26, rowsLit = show === 'one' ? 0 : step;
  return (
    <div class={cls('sl-building', small && 'small', tipped && 'tipped')}>
      <svg viewBox={`-4 -18 ${w + 52} ${h + 22}`} role="img" aria-label={`${g.rows} rows of ${g.cols} windows`}>
        <rect x="0" y="-14" width={w} height="16" rx="3" class="roof" />
        <rect x="0" y="0" width={w} height={h} class="front" />
        {Array.from({ length: g.rows }, (_, r) => (
          <g key={r} class={cls('row', r < rowsLit && 'lit', show === 'one' && r === 0 && 'focus', show === 'cue' && 'cue')}>
            {tapping && <rect x="0" y={GAP + r * (WIN + GAP) - GAP / 2} width={w} height={WIN + GAP} class="row-hit" onClick={() => lesson!.tap()} />}
            {Array.from({ length: g.cols }, (_, c) => <rect key={c} x={6 + GAP + c * (WIN + GAP)} y={GAP + r * (WIN + GAP)} width={WIN} height={WIN} rx="3" class={cls('win', show === 'one' && r === 0 && c < step && 'on')} />)}
            {r < rowsLit && <text x={w + 8} y={GAP + r * (WIN + GAP) + WIN - 4} class="row-count">{(r + 1) * g.cols}</text>}
          </g>
        ))}
        {show === 'one' && step > 0 && <text x={w + 8} y={GAP + WIN - 4} class="row-count">{step}</text>}
        <rect x={w / 2 - 12} y={h - 22} width="24" height="22" class="door" />
      </svg>
      {tapping && <button class="row-tap" aria-label="Count a row" onClick={() => lesson!.tap()}>👆</button>}
    </div>
  );
}

/** People in two lines, so each pair stands one above the other: a ride seats two. */
function People({ count, lesson }: { count: number; lesson: Lesson }) {
  const pairs = lesson.show.value === 'pairs' ? lesson.step.value : 0, cols = Math.ceil(count / 2), W = 46, H = 56;
  const alone = lesson.show.value === 'pairs' && pairs >= Math.floor(count / 2) && count % 2 === 1;
  return (
    <svg class="sl-people" viewBox={`0 0 ${cols * W + 8} ${2 * H + 10}`} role="img" aria-label={`${count} people`}>
      {Array.from({ length: cols }, (_, c) => (
        <g key={c}>
          {c < pairs && <rect x={c * W + 4} y="2" width={W - 4} height={2 * H + 2} rx="12" class="ride" />}
          {[0, 1].map(r => {
            const i = c * 2 + r;
            if (i >= count) return null;
            const left = alone && i === count - 1;
            return <g key={r} class={cls('person', left && 'alone')} transform={`translate(${c * W + W / 2 + 2} ${r * H + 30})`}>
              <circle r="9" cy="-10" class="head" /><rect x="-10" y="0" width="20" height="18" rx="7" style={{ fill: `hsl(${(i * 47) % 360} 70% 55%)` }} class="shirt" />
            </g>;
          })}
        </g>
      ))}
    </svg>
  );
}

/** House numbers along a street; with `groups`, each house shows its windows in a group. */
function Street({ q, lesson }: { q: CountQ; lesson: Lesson }) {
  const show = lesson.show.value, step = lesson.step.value, all = q.shown.map(x => x ?? Number(q.answer));
  return (
    <div class="sl-street">
      <div class="houses">
        {q.shown.map((x, i) => (
          <div key={i} class={cls('house', show === 'line' && i < step && 'lit', x === null && 'gap')}>
            <span class="house-roof" />
            {q.groups && <span class="house-wins">{Array.from({ length: q.step }, (_, k) => <i key={k} />)}</span>}
            <span class="plate">{x ?? (show === 'line' && i < step ? all[i] : '?')}</span>
          </div>
        ))}
      </div>
      {show === 'line' && (
        <svg class="sl-line" viewBox={`0 0 ${all.length * 100 + 20} 84`} role="img" aria-label="Jumps on a number line">
          <line x1="10" x2={all.length * 100 + 10} y1="56" y2="56" class="axis" />
          {all.map((x, i) => (
            <g key={i}>
              <circle cx={60 + i * 100} cy="56" r="6" class={cls('dot', i < step && 'on')} />
              {i > 0 && i < step && <path d={`M${60 + (i - 1) * 100} 50 Q${10 + i * 100} 6 ${60 + i * 100} 50`} class="jump" />}
              {i > 0 && i < step && <text x={10 + i * 100} y="22" class="jump-label">+{q.step}</text>}
              <text x={60 + i * 100} y="82" class="tick">{i < step ? x : ''}</text>
            </g>
          ))}
        </svg>
      )}
    </div>
  );
}

function Truck({ boxes, lit, onTap, label }: { boxes: number; lit?: boolean; onTap?: () => void; label: string }) {
  const body = (
    <>
      <span class="cargo">{Array.from({ length: boxes }, (_, i) => <i key={i} class="box">📦</i>)}</span>
      <span class="cab">🚚</span>
      <span class="truck-count">{boxes}</span>
    </>
  );
  return onTap ? <button class={cls('sl-truck', lit && 'lit')} aria-label={label} onClick={onTap}>{body}</button> : <span class={cls('sl-truck', lit && 'lit')} aria-label={label}>{body}</span>;
}

// ---------- the kinds ----------

function GroupsView({ current, q, waiting }: { current: Current; q: GroupsQ; waiting: boolean }) {
  const prompt = promptOf(q), ready = useAsked(current, prompt.speech), lesson = lessonFor(current.signal), c = useChoice(current, ready, waiting);
  const hint = lesson.hint.value;
  if (q.form === 'same') {
    return <Shell current={current} ready={c.can} kind="groups form-same" prompt={prompt}
      stage={<Buses buses={q.buses} lesson={lesson} />}
      controls={<Choices values={['yes', 'no']} labels={['Yes', 'No']} c={c} hint={hint} kind="words" />} />;
  }
  if (q.form === 'pick') {
    return <Shell current={current} ready={c.can} kind="groups form-pick" prompt={prompt}
      stage={<div class="sl-pictures">{q.pictures.map((p, i) => (
        <button key={i} class={cls('picture', c.wrong.includes(String(i)) && 'wrong', c.done === String(i) && 'right', hint === String(i) && 'hint')} aria-label={`Picture ${i + 1}`} onClick={() => c.tap(String(i))}>
          <Buses buses={p} tight lesson={hint === String(i) ? lesson : lessonFor(new AbortController().signal)} />
        </button>
      ))}</div>} />;
  }
  const buses = Array.from({ length: q.groups }, () => q.each);
  const picture = q.form !== 'words' || !!lesson.show.value;
  return <Shell current={current} ready={c.can} kind={`groups form-${q.form}`} prompt={prompt}
    stage={picture ? <Buses buses={buses} lesson={lesson} /> : <div class="sl-words-card"><span>{q.groups} groups of {q.each}</span></div>}
    controls={<Choices values={nums(q.choices)} c={c} hint={hint} />} />;
}

function ArrayView({ current, q, waiting }: { current: Current; q: ArrayQ; waiting: boolean }) {
  const prompt = promptOf(q), ready = useAsked(current, prompt.speech), lesson = lessonFor(current.signal), c = useChoice(current, ready, waiting);
  const hint = lesson.hint.value;
  if (q.form === 'turn') {
    return <Shell current={current} ready={c.can} kind="array form-turn" prompt={prompt}
      stage={<div class="sl-pair-buildings"><Building g={q} lesson={lesson} small tipped={lesson.show.value === 'tip'} /><Building g={q.other} small /></div>}
      controls={<Choices values={['yes', 'no']} labels={['Yes', 'No']} c={c} hint={hint} kind="words" />} />;
  }
  if (q.form === 'sentence') {
    return <Shell current={current} ready={c.can} kind="array form-sentence" prompt={prompt}
      stage={<Building g={q} lesson={lesson} tap />}
      controls={<Choices values={q.sentences} c={c} hint={hint} kind="cards" />} />;
  }
  return <Shell current={current} ready={c.can} kind={`array form-${q.form}`} prompt={prompt}
    stage={<Building g={q} lesson={lesson} tap />}
    controls={<Choices values={nums(q.choices)} c={c} hint={hint} />} />;
}

function PairView({ current, q, waiting }: { current: Current; q: PairQ; waiting: boolean }) {
  const prompt = promptOf(q), ready = useAsked(current, prompt.speech), lesson = lessonFor(current.signal), c = useChoice(current, ready, waiting);
  const hint = lesson.hint.value, show = lesson.show.value;
  if (q.form === 'which') {
    return <Shell current={current} ready={c.can} kind="pair form-which" prompt={prompt}
      stage={show ? <People count={Number(q.answer)} lesson={lesson} /> : <div class="sl-big-nums">{q.nums.join('   ')}</div>}
      controls={<Choices values={nums(q.nums)} c={c} hint={hint} />} />;
  }
  if (q.form === 'double') {
    return <Shell current={current} ready={c.can} kind="pair form-double" prompt={prompt}
      stage={show ? <People count={q.n} lesson={lesson} /> : <div class="sl-big-nums">{q.n}</div>}
      controls={<Choices values={nums(q.halves)} labels={q.halves.map(h => `${h} + ${h}`)} c={c} hint={hint} kind="cards" />} />;
  }
  if (q.form === 'half') {
    return <Shell current={current} ready={c.can} kind="pair form-half" prompt={prompt}
      stage={<People count={q.n} lesson={lesson} />}
      controls={<Choices values={nums(q.choices)} c={c} hint={hint} />} />;
  }
  const picture = q.form === 'partner' || q.picture || !!show;
  return <Shell current={current} ready={c.can} kind={`pair form-${q.form}`} prompt={prompt}
    stage={picture ? <People count={q.n} lesson={lesson} /> : <div class="sl-big-nums">{q.n}</div>}
    controls={q.form === 'partner'
      ? <Choices values={['yes', 'no']} labels={['Yes', 'No']} c={c} hint={hint} kind="words" />
      : <Choices values={['odd', 'even']} labels={['Odd', 'Even']} c={c} hint={hint} kind="words" />} />;
}

function CountView({ current, q, waiting }: { current: Current; q: CountQ; waiting: boolean }) {
  const prompt = promptOf(q), ready = useAsked(current, prompt.speech), lesson = lessonFor(current.signal), c = useChoice(current, ready, waiting);
  return <Shell current={current} ready={c.can} kind={`count form-${q.form}`} prompt={prompt}
    stage={<Street q={q} lesson={lesson} />}
    controls={<Choices values={nums(q.choices)} c={c} hint={lesson.hint.value} />} />;
}

function ShareView({ current, q, waiting }: { current: Current; q: ShareQ; waiting: boolean }) {
  const prompt = promptOf(q), ready = useAsked(current, prompt.speech), lesson = lessonFor(current.signal), c = useChoice(current, ready, waiting);
  const voice = useVoice(), show = lesson.show.value, step = lesson.step.value, hint = lesson.hint.value;
  const trucks = q.form === 'trucks' ? q.total / q.each : q.trucks;
  const [loads, setLoads] = useState<number[]>(() => Array.from({ length: trucks }, () => 0)), [shared, setShared] = useState(false);
  // The lesson deals the boxes out on these same trucks. Once it is over (or he starts dealing during 🔎), the trucks are his again:
  // without this they stayed full after a miss and his taps went on the trucks unseen.
  const handBack = () => { if (q.form === 'deal' && lesson.show.peek() === 'deal') { lesson.task.cancel(); lesson.show.value = null; lesson.step.value = 0; } };
  useEffect(() => { if (!waiting) handBack(); }, [waiting]);
  // what the lesson shows: dealt one at a time, round and round (or whole trucks filled, for "how many trucks")
  const dealt = show === 'deal' ? Array.from({ length: trucks }, (_, t) => Math.floor(step / trucks) + (t < step % trucks ? 1 : 0)) : show === 'fill' && q.form === 'trucks' ? Array.from({ length: trucks }, (_, t) => (t < step ? q.each : 0)) : null;
  if (q.form === 'deal') {
    const pile = q.total - loads.reduce((a, b) => a + b, 0), ok = ready && !waiting && !shared;
    const give = (t: number) => { if (!ok || current.actions.busy) return; handBack(); if (pile <= 0) { sNope(); return; } sClink(); setLoads(ls => ls.map((x, i) => (i === t ? x + 1 : x))); };
    const back = () => { if (!ok) return; handBack(); if (pile < q.total) { sClink(); setLoads(Array.from({ length: trucks }, () => 0)); } };
    const check = () => {
      if (!ok || current.actions.busy) return;
      if (pile > 0) { sNope(); void voice.say('Share all the boxes.'); return; }
      const verdict = current.actions.submit(loads.join(','));
      if (verdict === 'correct') setShared(true);
      if (verdict === 'incorrect') setLoads(Array.from({ length: trucks }, () => 0)); // the lesson deals them out fairly, then he tries again
    };
    const shown = dealt ?? loads;
    return <Shell current={current} ready={ok} kind="share form-deal" prompt={prompt}
      stage={<div class="sl-share">
        <div class="pile" aria-label={`${dealt ? q.total - step : pile} boxes left`}>{Array.from({ length: dealt ? q.total - step : pile }, (_, i) => <i key={i}>📦</i>)}</div>
        <div class={cls('trucks', `n${trucks}`)}>{shown.map((b, t) => <Truck key={t} boxes={b} label={`Truck ${t + 1}`} onTap={() => give(t)} lit={!!dealt && shown.every(x => x === shown[0]) && step >= q.total} />)}</div>
      </div>}
      controls={<div class="share-pad">
        <button class="pad-btn back" aria-label="Start again" onClick={back}>↺</button>
        <button class={cls('pad-btn done', pile === 0 && ok && 'pulse')} aria-label="Done" onClick={check}>✓</button>
      </div>} />;
  }
  return <Shell current={current} ready={c.can} kind={`share form-${q.form}`} prompt={prompt}
    stage={<div class="sl-share">
      {!dealt || show === 'fill' ? <div class="pile">{Array.from({ length: dealt ? q.total - dealt.reduce((a, b) => a + b, 0) : q.total }, (_, i) => <i key={i}>📦</i>)}</div> : <div class="pile">{Array.from({ length: q.total - step }, (_, i) => <i key={i}>📦</i>)}</div>}
      {(q.form === 'each' || dealt) && <div class={cls('trucks', `n${trucks}`)}>{(dealt ?? Array.from({ length: trucks }, () => 0)).map((b, t) => <Truck key={t} boxes={b} label={`Truck ${t + 1}`} />)}</div>}
    </div>}
    controls={<Choices values={nums(q.choices)} c={c} hint={hint} />} />;
}

function TimesView({ current, q, waiting }: { current: Current; q: TimesQ; waiting: boolean }) {
  const prompt = promptOf(q), ready = useAsked(current, prompt.speech), lesson = lessonFor(current.signal), c = useChoice(current, ready, waiting);
  const hint = lesson.hint.value, show = lesson.show.value;
  if (q.form === 'match') {
    return <Shell current={current} ready={c.can} kind="times form-match" prompt={prompt}
      stage={<div class="sl-times-match"><span class="times-card">{timesText(q)}</span>
        <div class="sl-pictures">{q.pictures.map((g, i) => (
          <button key={i} class={cls('picture', c.wrong.includes(String(i)) && 'wrong', c.done === String(i) && 'right', hint === String(i) && 'hint')} aria-label={`Picture ${i + 1}`} onClick={() => c.tap(String(i))}>
            <Building g={g} small lesson={show === 'picture' && String(i) === q.answer ? lesson : undefined} />
          </button>
        ))}</div></div>} />;
  }
  if (q.form === 'write') {
    return <Shell current={current} ready={c.can} kind="times form-write" prompt={prompt}
      stage={<Building g={q} lesson={lesson} />}
      controls={<Choices values={q.cards} c={c} hint={hint} kind="cards" />} />;
  }
  if (q.form === 'turn') {
    return <Shell current={current} ready={c.can} kind="times form-turn" prompt={prompt}
      stage={<div class="sl-times-match"><span class="times-card">{timesCard(q.a, q.b)}</span><Building g={{ rows: q.a, cols: q.b }} lesson={lesson} small tipped={show === 'tip'} /></div>}
      controls={<Choices values={q.cards} c={c} hint={hint} kind="cards" />} />;
  }
  return <Shell current={current} ready={c.can} kind="times form-fact" prompt={prompt}
    stage={show ? <Building g={{ rows: q.a, cols: q.b }} lesson={lesson} tap /> : <span class="times-card big">{timesCard(q.a, q.b)}</span>}
    controls={<Choices values={nums(q.choices)} c={c} hint={hint} />} />;
}

export function QuestionView({ current, waiting }: { current: Current; waiting: boolean }) {
  const q = current.problem.q;
  switch (q.kind) {
    case 'groups': return <GroupsView current={current} q={q} waiting={waiting} />;
    case 'array': return <ArrayView current={current} q={q} waiting={waiting} />;
    case 'pair': return <PairView current={current} q={q} waiting={waiting} />;
    case 'count': return <CountView current={current} q={q} waiting={waiting} />;
    case 'share': return <ShareView current={current} q={q} waiting={waiting} />;
    case 'times': return <TimesView current={current} q={q} waiting={waiting} />;
  }
}

/** The first time a Times question comes, the × sign is shown and said ("rows of"); at Level 2, its name, "times". */
export function MeetView({ current, waiting }: { current: ProblemInstance<Meet, string>; waiting: boolean }) {
  const voice = useVoice(), meeting = current.problem.meeting;
  const [ready, setReady] = useState(false);
  const lesson = lessonFor(current.signal);
  useEffect(() => {
    void (async () => {
      if (meeting === 'sign') {
        await voice.say('Here is a new sign.', 'It is a short way to write rows of.');
        await voice.say(n(3), 'rows of', n(4));
        for (let i = 1; i <= 3 && voice.active; i++) { lesson.step.value = i; await voice.say(n(i * 4)); }
      } else {
        await voice.say('This sign has a name.', 'We say times.');
        await voice.say(n(3), 'times', n(4), n(3), 'groups of', n(4));
      }
      if (voice.active) { await voice.say('Tap Go!'); if (!current.signal.aborted) setReady(true); }
    })();
  }, []);
  const go = () => { if (ready && !waiting && !current.actions.busy) current.actions.submit('ok'); };
  return (
    <div class={cls('game', 'sl', 'meet', `meet-${meeting}`)} data-ready={ready && !waiting ? 'yes' : 'no'}>
      <div class="ask"><h2>{meeting === 'sign' ? '3 × 4 = 3 rows of 4' : '3 × 4: 3 times 4'}</h2></div>
      <div class="sl-body">
        <div class="sl-stage"><div class="sl-times-match"><span class="times-card big">3 × 4</span><Building g={{ rows: 3, cols: 4 }} lesson={lesson} small /></div></div>
        <div class="sl-controls"><button class={cls('big-btn', 'go', 'go-btn', ready && 'pulse')} aria-label="Go" onClick={go}><span class="e">▶</span><span class="go-word">Go</span></button></div>
      </div>
    </div>
  );
}
export { addingSentence };
