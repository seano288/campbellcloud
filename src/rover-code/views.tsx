// The questions on screen. Every question is said as it appears (🔊 says it again) and taps wait until it has finished. Nothing here
// needs reading beyond a few short words: programs are arrows, counts are numbers, patterns are pictures. A program he builds always
// runs when he taps Go, right or wrong, so he sees what it did before anyone says anything; then the round engine either cheers or
// runs the lesson (code/teach.ts), which draws on the same grid. Everything is a tap: there is no dragging.
import { useEffect, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { sClink, sNope } from '../audio/sfx';
import type { ProblemInstance } from '../learning/round';
import { Arrow, GridView } from './code/GridView';
import { DIRS, encodeBlocks, encodeProgram, expand, type Block, type Dir, type Grid } from './code/grid';
import { COUNTS, fixesAt, type BugProblem, type DriveProblem, type LoopProblem, type PatternProblem, type Token } from './code/problems';
import { clear, drive, help, lessonFor, whyLine, type Lesson } from './code/teach';
import type { Asking, Meet } from './mix';
import { DIR_SAID, type Phrase } from './phrases';
import { useVoice, type Item } from './voice';

type Current = ProblemInstance<Asking, string>;
const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');
const THING_ART: Record<string, string> = { star: '⭐', moon: '🌙', planet: '🪐', rocket: '🚀', alien: '👽', sun: '☀️' };

/** Says the question once, and marks when it's done. */
function useAsked(current: { signal: AbortSignal }, speech: readonly Item[], after?: () => Promise<void>) {
  const voice = useVoice();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    void voice.say(...speech).then(async () => {
      if (current.signal.aborted) return;
      if (after) await after();
      if (!current.signal.aborted) setReady(true);
    });
  }, []);
  return ready;
}

/** `ready`: the question has been said and taps count (the browser tour waits on it, as he does). */
function Shell({ current, kind, text, speech, stage, controls, ready, helpable = true }: {
  current: Current; kind: string; text: string; speech: readonly Item[]; stage: ComponentChildren; controls: ComponentChildren; ready: boolean; helpable?: boolean;
}) {
  const voice = useVoice(), lesson = lessonFor(current.signal);
  return (
    <div class={cls('game', 'rc', kind)} data-ready={ready ? 'yes' : 'no'}>
      <div class="ask">
        <button class="say-btn" aria-label="Say it again" onClick={() => void voice.say(...speech)}>🔊</button>
        <h2>{text}</h2>
        {helpable && <button class="help-btn" aria-label="Help" onClick={() => current.actions.help(() => help(current.problem, current.signal))}>🔎</button>}
      </div>
      <div class="rc-body">
        <div class="rc-stage">{stage}{lesson.caption.value && <div class="caption" aria-live="polite">{lesson.caption.value}</div>}</div>
        <div class="rc-controls">{controls}</div>
      </div>
    </div>
  );
}

// ---------- the program bar and the arrow pad ----------

function ProgramBar({ program, slots, lit, hint, onTap, label }: { program: readonly Dir[]; slots: number; lit: number | null; hint?: number | null; onTap?: (i: number) => void; label: string }) {
  return (
    <div class={cls('program', slots > 5 && 'two-rows')} role="group" aria-label={label}>
      {Array.from({ length: slots }, (_, i) => {
        const d = program[i];
        return d
          ? <button key={i} class={cls('step', i === lit && 'lit', i === hint && 'hint')} aria-label={`Step ${i + 1}, ${DIR_SAID[d].slice(0, -1)}`} onClick={() => onTap?.(i)}><Arrow dir={d} /></button>
          : <span key={i} class="step empty" aria-hidden="true" />;
      })}
    </div>
  );
}

function Pad({ onArrow, onBack, hint, disabled }: { onArrow(d: Dir): void; onBack?: () => void; hint?: string | null; disabled?: boolean }) {
  return (
    <div class={cls('pad-cross', disabled && 'waiting')}>
      {DIRS.map(d => <button key={d} class={cls('pad-arrow', `p${d}`, hint === d && 'hint')} aria-label={DIR_SAID[d].slice(0, -1)} onClick={() => onArrow(d)}><Arrow dir={d} /></button>)}
      {onBack && <button class="pad-back" aria-label="Take back a step" onClick={onBack}>⌫</button>}
    </div>
  );
}

function GoButton({ onGo, pulse, label = 'Go' }: { onGo(): void; pulse?: boolean; label?: string }) {
  return <button class={cls('big-btn', 'go', 'go-btn', pulse && 'pulse')} aria-label={label} onClick={onGo}><span class="e">▶</span><span class="go-word">Go</span></button>;
}

/** He taps Go: the rover drives his program, then it's checked. Taps wait while it drives. */
function useRunner(current: Current, grid: Grid) {
  const voice = useVoice(), lesson = lessonFor(current.signal);
  const [running, setRunning] = useState(false);
  async function run(program: readonly Dir[], answer: string, opts: Parameters<typeof drive>[4] = {}) {
    if (running || current.actions.busy || !voice.active) return null;
    setRunning(true);
    lesson.hint.value = null;
    lesson.trail.value = null;
    clear(lesson);
    const scope = lesson.task.start();
    await drive(grid, program, lesson, scope, opts);
    if (current.signal.aborted) return null;
    setRunning(false);
    const verdict = current.actions.submit(answer);
    return verdict;
  }
  return { run, running };
}

// ---------- Drive It ----------

function DriveView({ current, q, waiting }: { current: Current; q: DriveProblem; waiting: boolean }) {
  const speech: Phrase[] = ['Drive the rover to the flag.'], ready = useAsked(current, speech), voice = useVoice(), lesson = lessonFor(current.signal);
  const [program, setProgram] = useState<Dir[]>([]), { run, running } = useRunner(current, q.grid);
  const can = ready && !running && !waiting;
  function add(d: Dir) {
    if (!can) return;
    if (program.length >= q.slots) { sNope(); return; }
    sClink();
    setProgram([...program, d]);
  }
  const back = () => { if (can && program.length) { sClink(); setProgram(program.slice(0, -1)); } };
  const remove = (i: number) => { if (can) { sClink(); setProgram(program.filter((_, j) => j !== i)); } };
  function go() {
    if (!can) return;
    if (!program.length) { sNope(); void voice.say('Tap the arrows to tell it where to go.'); return; }
    void run(program, encodeProgram(program));
  }
  return (
    <Shell current={current} ready={can} kind="drive" text="Drive the rover to the flag." speech={speech}
      stage={<GridView grid={q.grid} lesson={lesson} face={q.path[0]} label="The rover, the rocks and the flag" />}
      controls={<>
        <ProgramBar program={program} slots={q.slots} lit={lesson.lit.value} onTap={remove} label="Your program" />
        <div class="pad-row"><Pad onArrow={add} onBack={back} disabled={!can} /><GoButton onGo={go} pulse={can && program.length > 0} /></div>
      </>} />
  );
}

// ---------- Bug Hunt ----------

function BugView({ current, q, waiting }: { current: Current; q: BugProblem; waiting: boolean }) {
  const voice = useVoice(), lesson = lessonFor(current.signal);
  const speech: Phrase[] = ['This program has a bug.', ...(q.preview ? ['Watch it go.' as const] : ['Tap the step that is wrong.' as const])];
  async function watch() {
    const scope = lesson.task.start();
    const ran = await drive(q.grid, q.program, lesson, scope);
    if (!scope.active) return;
    await scope.say(whyLine(ran));
    clear(lesson);
    if (scope.active) await scope.say('Tap the step that is wrong.');
  }
  const ready = useAsked(current, speech, q.preview ? watch : undefined);
  const [fixing, setFixing] = useState<number | null>(null), [shown, setShown] = useState<readonly Dir[]>(q.program), [wrong, setWrong] = useState<number[]>([]);
  const { run, running } = useRunner(current, q.grid);
  const can = ready && !running && !waiting;
  async function tapStep(i: number) {
    if (!can || wrong.includes(i)) return;
    sClink();
    const fixes = fixesAt(q.grid, q.program, i);
    if (!q.choose && fixes.length) { // Level 1: finding it is enough, so the fix goes in and it drives home
      const fixed = q.program.map((s, j) => (j === i ? fixes[0]! : s));
      setShown(fixed);
      await run(fixed, `step:${i}`);
      return;
    }
    const verdict = current.actions.submit(`step:${i}`);
    if (verdict === 'not-an-answer') { setFixing(i); lesson.lit.value = i; void voice.say('Which way should it go?'); }
    if (verdict === 'incorrect') setWrong(w => [...w, i]);
  }
  async function fix(d: Dir) {
    if (!can || fixing === null) return;
    sClink();
    const fixed = q.program.map((s, j) => (j === fixing ? d : s));
    setShown(fixed);
    const verdict = await run(fixed, `fix:${fixing}:${d}`, { light: i => (i === fixing ? i : null) });
    if (verdict === 'incorrect') setShown(q.program);
  }
  const hint = lesson.hint.value, hintStep = hint?.startsWith('step:') ? Number(hint.slice(5)) : null;
  return (
    <Shell current={current} ready={can} kind="bug" text={fixing === null ? 'Tap the step that is wrong.' : 'Which way should it go?'} speech={speech}
      stage={<GridView grid={q.grid} lesson={lesson} face={q.program[0]} label="The rover, the rocks and the flag" />}
      controls={<>
        <ProgramBar program={shown} slots={shown.length} lit={lesson.lit.value ?? fixing} hint={hintStep} onTap={i => void tapStep(i)} label="The program with a bug" />
        {fixing !== null
          ? <div class="pad-row"><Pad onArrow={d => void fix(d)} hint={hint && !hint.startsWith('step:') ? hint : null} disabled={!can} /></div>
          : q.preview && <button class="watch-btn" aria-label="Watch it go" onClick={() => { if (can) void watch(); }}>👀</button>}
      </>} />
  );
}

// ---------- Patterns ----------

function TokenArt({ t }: { t: Token }) {
  return t.length === 1 ? <Arrow dir={t as Dir} class="tok-arrow" /> : <span class="tok-thing">{THING_ART[t]}</span>;
}

function PatternView({ current, q, waiting }: { current: Current; q: PatternProblem; waiting: boolean }) {
  const speech: Phrase[] = [q.form === 'next' ? 'What comes next?' : 'What is missing?'], ready = useAsked(current, speech), lesson = lessonFor(current.signal);
  const [wrong, setWrong] = useState<Token[]>([]), [done, setDone] = useState<Token | null>(null);
  function tap(t: Token) {
    if (!ready || waiting || current.actions.busy || done || wrong.includes(t)) return;
    const verdict = current.actions.submit(t);
    if (verdict === 'correct') setDone(t);
    if (verdict === 'incorrect') setWrong(w => [...w, t]);
  }
  const bands = lesson.bands.value, lit = lesson.litItem.value, filled = done ?? lesson.filled.value;
  return (
    <Shell current={current} ready={ready && !waiting} kind="pattern" text={q.form === 'next' ? 'What comes next?' : 'What is missing?'} speech={speech}
      stage={
        <div class={cls('pattern-row', q.items.length > 7 && 'long')} role="img" aria-label="A pattern with a gap">
          {q.items.map((t, i) => (
            <span key={i} class={cls('tok', bands && `band${Math.floor(i / q.unit) % 2}`, bands && i % q.unit === 0 && 'unit-start', i === lit && 'lit', t === null && 'gap', t === null && filled && 'filled')}>
              {t ? <TokenArt t={t} /> : filled ? <TokenArt t={filled} /> : <span class="q-mark">?</span>}
            </span>
          ))}
        </div>
      }
      controls={
        <div class="choices tokens">
          {q.choices.map(t => (
            <button key={t} class={cls('choice', wrong.includes(t) && 'wrong', done === t && 'right', lesson.hint.value === t && 'hint')} aria-label={t.length === 1 ? DIR_SAID[t as Dir].slice(0, -1) : t} onClick={() => tap(t)}>
              <TokenArt t={t} />
            </button>
          ))}
        </div>
      } />
  );
}

// ---------- Loops ----------

function BlockView({ block, lit, children }: { block?: Block; lit?: boolean; children?: ComponentChildren }) {
  return (
    <span class={cls('loop-block', lit && 'lit')}>
      <span class="lb-icon" aria-hidden="true">🔁</span>
      {children ?? <>{block!.steps.map((d, i) => <span key={i} class="lb-step"><Arrow dir={d} /></span>)}<span class="lb-times">×{block!.times}</span></>}
    </span>
  );
}

type Slot = { dir: Dir | null; times: number | null };
type Focus = { block: number; part: 'dir' | 'times' } | null;
const firstEmpty = (slots: readonly Slot[], given: LoopProblem['given']): Focus => {
  for (let b = 0; b < slots.length; b++) {
    if (slots[b]!.dir === null && given[b]!.dir === null) return { block: b, part: 'dir' };
    if (slots[b]!.times === null && given[b]!.times === null) return { block: b, part: 'times' };
  }
  return null;
};

function LoopView({ current, q, waiting }: { current: Current; q: LoopProblem; waiting: boolean }) {
  const text = q.form === 'count' ? 'How many times?' : q.form === 'build' ? 'Fill in the loops.' : 'Which program gets to the flag?';
  const speech: Phrase[] = [text as Phrase], ready = useAsked(current, speech), lesson = lessonFor(current.signal), voice = useVoice();
  const [slots, setSlots] = useState<Slot[]>(q.given.map(g => ({ ...g }))), [focus, setFocus] = useState<Focus>(firstEmpty(q.given, q.given));
  const [wrong, setWrong] = useState<number[]>([]), [picked, setPicked] = useState<number | null>(null);
  const { run, running } = useRunner(current, q.grid);
  const can = ready && !running && !waiting;
  const blockOf = (blocks: readonly Block[]) => (i: number) => { let n = 0; for (let b = 0; b < blocks.length; b++) { n += blocks[b]!.steps.length * blocks[b]!.times; if (i < n) return b; } return null; };
  const sayCount = (blocks: readonly Block[]) => (i: number) => { let n = 0; for (const b of blocks) { const len = b.steps.length * b.times; if (i < n + len) return `${Math.floor((i - n) / b.steps.length) + 1}` as Phrase; n += len; } return null; };

  if (q.form === 'pick') {
    async function choose(k: number) {
      if (!can || wrong.includes(k)) return;
      sClink();
      setPicked(k);
      const option = q.options[k]!;
      const verdict = await run(expand(option), encodeBlocks(option), { light: () => k });
      if (verdict === 'incorrect') setWrong(w => [...w, k]);
    }
    return (
      <Shell current={current} ready={can} kind="loop form-pick" text={text} speech={speech}
        stage={<GridView grid={q.grid} lesson={lesson} face={q.path[0]} label="The rover, the rocks and the flag" />}
        controls={
          <div class="options">
            {q.options.map((o, k) => (
              <button key={k} class={cls('option', wrong.includes(k) && 'wrong', (lesson.lit.value === k || picked === k) && 'lit', lesson.hint.value === String(k) && 'hint')} aria-label={`Program ${k + 1}`} onClick={() => void choose(k)}>
                {o.map((b, i) => <BlockView key={i} block={b} />)}
              </button>
            ))}
          </div>
        } />
    );
  }

  const filled = slots.map((s, b) => ({ dir: s.dir ?? q.given[b]!.dir, times: s.times ?? q.given[b]!.times }));
  const complete = filled.every(s => s.dir && s.times);
  function set(value: Dir | number) {
    if (!can || !focus) return;
    sClink();
    const next = slots.map((s, b) => (b === focus.block ? { ...s, [focus.part]: value } : s));
    setSlots(next);
    setFocus(firstEmpty(next, q.given) ?? focus);
  }
  function go() {
    if (!can) return;
    if (!complete) { sNope(); void voice.say(text as Phrase); return; }
    const blocks = filled.map(s => ({ steps: [s.dir!], times: s.times! }));
    void run(expand(blocks), encodeBlocks(blocks), { light: blockOf(blocks), say: sayCount(blocks) });
  }
  const hint = lesson.hint.value;
  return (
    <Shell current={current} ready={can} kind={`loop form-${q.form}`} text={text} speech={speech}
      stage={<GridView grid={q.grid} lesson={lesson} face={q.path[0]} label="The rover, the rocks and the flag" />}
      controls={<>
        <div class="loops">
          {filled.map((s, b) => (
            <BlockView key={b} lit={lesson.lit.value === b}>
              {q.given[b]!.dir
                ? <span class="lb-step"><Arrow dir={q.given[b]!.dir!} /></span>
                : <button class={cls('lb-slot', focus?.block === b && focus.part === 'dir' && 'focus')} aria-label="Which way" onClick={() => { if (can) setFocus({ block: b, part: 'dir' }); }}>{s.dir ? <Arrow dir={s.dir} /> : '?'}</button>}
              {q.given[b]!.times
                ? <span class="lb-times">×{q.given[b]!.times}</span>
                : <button class={cls('lb-slot', 'times', focus?.block === b && focus.part === 'times' && 'focus')} aria-label="How many times" onClick={() => { if (can) setFocus({ block: b, part: 'times' }); }}>×{s.times ?? '?'}</button>}
            </BlockView>
          ))}
        </div>
        <div class="pad-row">
          {focus?.part === 'dir'
            ? <Pad onArrow={set} disabled={!can} />
            : <div class={cls('counts', !can && 'waiting')}>{COUNTS.map(n => <button key={n} class={cls('count', hint === String(n) && 'hint')} aria-label={`${n}`} onClick={() => set(n)}>{n}</button>)}</div>}
          <GoButton onGo={go} pulse={can && complete} />
        </div>
      </>} />
  );
}

// ---------- the question, and Meetings ----------

export function QuestionView({ current, waiting }: { current: Current; waiting: boolean }) {
  const q = current.problem.q;
  if (q.kind === 'drive') return <DriveView current={current} q={q} waiting={waiting} />;
  if (q.kind === 'bug') return <BugView current={current} q={q} waiting={waiting} />;
  if (q.kind === 'pattern') return <PatternView current={current} q={q} waiting={waiting} />;
  return <LoopView current={current} q={q} waiting={waiting} />;
}

const MEET_GRIDS: Record<Meet['meeting'], { grid: Grid; blocks: Block[]; lines: Phrase[] }> = {
  program: { grid: { w: 3, h: 1, start: { x: 0, y: 0 }, goal: { x: 2, y: 0 }, rocks: [] }, blocks: [{ steps: ['R'], times: 1 }, { steps: ['R'], times: 1 }], lines: ['This is your rover.', 'Tap the arrows to tell it where to go.', 'Then tap Go!'] },
  loop: { grid: { w: 4, h: 1, start: { x: 0, y: 0 }, goal: { x: 3, y: 0 }, rocks: [] }, blocks: [{ steps: ['R'], times: 3 }], lines: ['This is a loop.', 'It does the same step again and again.', 'Tap Go!'] },
};

/** The first time a question needs the program bar or a loop, it's shown and said, and he taps Go to see it work. */
export function MeetView({ current, waiting }: { current: ProblemInstance<Meet, string>; waiting: boolean }) {
  const m = MEET_GRIDS[current.problem.meeting], lesson = lessonFor(current.signal);
  const ready = useAsked(current, m.lines);
  const [running, setRunning] = useState(false);
  const program = expand(m.blocks);
  async function go() {
    if (!ready || running || waiting || current.actions.busy) return;
    setRunning(true);
    const scope = lesson.task.start(), loop = current.problem.meeting === 'loop';
    await drive(m.grid, program, lesson, scope, loop ? { light: () => 0, say: i => `${i + 1}` as Phrase } : {});
    if (!current.signal.aborted) current.actions.submit('ok');
  }
  return (
    <div class={cls('game', 'rc', 'meet', current.problem.meeting)} data-ready={ready && !running && !waiting ? 'yes' : 'no'}>
      <div class="ask"><h2>{m.lines[0]}</h2></div>
      <div class="rc-body">
        <div class="rc-stage"><GridView grid={m.grid} lesson={lesson} label="The rover and the flag" /></div>
        <div class="rc-controls">
          {current.problem.meeting === 'loop'
            ? <div class="loops"><BlockView block={m.blocks[0]!} lit={lesson.lit.value === 0} /></div>
            : <ProgramBar program={program} slots={program.length} lit={lesson.lit.value} label="A program" />}
          <div class="pad-row">{current.problem.meeting === 'program' && <Pad onArrow={() => {}} disabled />}<GoButton onGo={() => void go()} pulse={ready && !running} /></div>
        </div>
      </div>
    </div>
  );
}

export type { Lesson };
