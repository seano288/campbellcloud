// The questions on screen. What he must understand is said once as it appears (🔊 says it again), and taps wait until it has been said.
// Written words are in Andika and lowercase; answer buttons are not read out, and Read It never says its word before he answers.
// Containers are the same shape everywhere (art/BoxView.tsx). A miss's lesson (reading/teach.ts) draws a row of containers on the stage;
// in the fuller lesson the container to tap next pulses, and tapping it says its syllable.
import { useEffect, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { sClink, sNope } from '../audio/sfx';
import type { ProblemInstance } from '../learning/round';
import { BoxView } from './art/BoxView';
import type { Asking, Meet } from './mix';
import { syl, type Phrase } from './phrases';
import type { AddCompareQ, AddHideQ, AddMeansQ, AddPicQ, BuildQ, CountQ, GapQ, ReadQ, SplitQ } from './reading/problems';
import { askedFor } from './reading/asked';
import { help, lessonFor, type Lesson } from './reading/teach';
import { useVoice, type Item, type VoiceScope } from './voice';
import { wordOf } from './words/words';

type Current = ProblemInstance<Asking, string>;
const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');
const word = (w: string) => w as Phrase;
type Speech = readonly Item[] | ((v: VoiceScope) => Promise<void>);
const speak = (v: VoiceScope, s: Speech) => (typeof s === 'function' ? s(v) : v.say(...s));
/** The question's lines (reading/asked.ts): said in one go, or slowly a syllable at a time. */
function speechOf(q: Asking['q']): Speech {
  const a = askedFor(q);
  if (a.kind === 'lines') return a.lines;
  return async v => { await v.say(...a.before); for (const s of a.syls) { await v.say(s); await v.wait(420); } await v.say(...a.after); };
}

/** Says the question once, and marks when it's done. */
function useAsked(current: { signal: AbortSignal }, speech: Speech) {
  const voice = useVoice();
  const [ready, setReady] = useState(false);
  useEffect(() => { void speak(voice, speech).then(() => { if (!current.signal.aborted) setReady(true); }); }, []);
  return ready;
}

/** The lesson's row of containers. In the fuller lesson the next one to tap pulses. */
function LessonRow({ lesson }: { lesson: Lesson }) {
  const row = lesson.row.value, next = lesson.tapNext.value;
  if (!row) return null;
  return (
    <div class="cw-lesson-row" aria-label="Lesson">
      {row.map((b, i) => (
        <BoxView key={i} text={b.text} lit={b.lit} pulse={next === i} faded={b.off} class={b.gap && i === 1 ? 'bolted' : ''}
          label={next === i ? `Tap ${b.text}` : b.text} onClick={next === i ? () => lesson.tapped(i) : undefined} />
      ))}
    </div>
  );
}

/** `ready`: the question has been said and taps count (the browser tour waits on it, as he does). */
function Shell({ current, kind, text, speech, stage, controls, ready, lesson }: {
  current: Current; kind: string; text: ComponentChildren; speech: Speech; stage: ComponentChildren; controls?: ComponentChildren; ready: boolean; lesson: Lesson;
}) {
  const voice = useVoice();
  return (
    <div class={cls('game', 'cw', ...kind.split(' ').map(k => `k-${k}`))} data-ready={ready ? 'yes' : 'no'} data-lesson={lesson.tapNext.value !== null ? 'tap' : 'no'}>
      <div class="ask">
        <button class="say-btn" aria-label="Say it again" onClick={() => void speak(voice, speech)}>🔊</button>
        <h2>{text}</h2>
        <button class="help-btn" aria-label="Help" onClick={() => current.actions.help(() => help(current.problem, current.signal))}>🔎</button>
      </div>
      <div class="cw-body">
        <div class="cw-stage">{stage}<LessonRow lesson={lesson} /></div>
        {controls && <div class="cw-controls">{controls}</div>}
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
const choiceCls = (v: string, c: { wrong: string[]; done: string | null }, hint: string | null) => cls('choice', c.wrong.includes(v) && 'wrong', c.done === v && 'right', hint === v && 'hint');

/** A written word, big, in Andika. */
const Written = ({ w, class: k = '' }: { w: string; class?: string }) => <div class={cls('cw-word', k)} lang="en">{w}</div>;

// ---------- How Many Containers ----------

function CountView({ current, q, waiting }: { current: Current; q: CountQ; waiting: boolean }) {
  const speech = speechOf(q);
  const ready = useAsked(current, speech), lesson = lessonFor(current.signal), c = useChoice(current, ready, waiting), hint = lesson.hint.value;
  const pic = wordOf(q.word)?.pic;
  const stage = q.show === 'read' ? <Written w={q.word} /> : q.show === 'pic' && pic ? <div class="cw-pic big" aria-hidden="true">{pic}</div> : <div class="cw-ear" aria-hidden="true">👂</div>;
  return (
    <Shell current={current} lesson={lesson} ready={c.can} kind={`count show-${q.show}`} text={q.show === 'read' ? 'How many beats?' : 'How many beats?'} speech={speech}
      stage={lesson.row.value ? null : stage}
      controls={<div class="choices cw-stacks">{q.choices.map(n => {
        const v = String(n);
        return (
          <button key={n} class={cls(choiceCls(v, c, hint), 'cw-stack-btn')} aria-label={`${n}`} onClick={() => c.tap(v)}>
            <span class="cw-mini-row" aria-hidden="true">{Array.from({ length: n }, (_, i) => <i key={i} />)}</span><b>{n}</b>
          </button>
        );
      })}</div>} />
  );
}

// ---------- Load the Ship (and Bossy R's Level 3) ----------

/** The ship's hull under the deck in Load the Ship: the same navy hull, white trim and red below the water as the Crane's container ship. */
function Hull() {
  return (
    <svg class="cw-hull" viewBox="0 0 200 40" preserveAspectRatio="none" aria-hidden="true">
      <defs><clipPath id="cw-hull-shape"><path d="M2 3 H176 L199 0 Q188 20 178 38 H16 Q2 34 2 3 Z" /></clipPath></defs>
      <g clip-path="url(#cw-hull-shape)">
        <rect width="200" height="40" fill="#1d3a6e" /><rect width="200" height="7" fill="#ffffff" /><rect y="24" width="200" height="3" fill="#1b1b1b" /><rect y="27" width="200" height="13" fill="#a3322a" />
      </g>
      <path d="M2 3 H176 L199 0 Q188 20 178 38 H16 Q2 34 2 3 Z" fill="none" stroke="#000" stroke-width="4" vector-effect="non-scaling-stroke" stroke-linejoin="round" />
    </svg>
  );
}

function BuildView({ current, q, waiting }: { current: Current; q: BuildQ; waiting: boolean }) {
  const speech = speechOf(q as Asking['q']);
  const ready = useAsked(current, speech), lesson = lessonFor(current.signal), voice = useVoice();
  const [loaded, setLoaded] = useState<number[]>([]), [done, setDone] = useState(false);
  const can = ready && !waiting && !done, n = q.syls.length, hint = lesson.hint.value;
  // after a miss the containers come back off the ship, for him to try again
  useEffect(() => { if (waiting && !done) setLoaded([]); }, [waiting]);
  function tapBox(i: number) {
    if (!can || current.actions.busy || loaded.includes(i)) return;
    sClink();
    const next = [...loaded, i];
    setLoaded(next);
    if (next.length < n) return;
    const verdict = current.actions.submit(next.map(k => q.boxes[k]).join('|'));
    if (verdict === 'correct') setDone(true);
    else if (verdict === 'not-an-answer') setLoaded([]);
  }
  function tapSlot(k: number) {
    if (!can || k !== loaded.length - 1) { if (!can) return; sNope(); void voice.say('Tap the containers in order.'); return; }
    setLoaded(loaded.slice(0, -1));
  }
  return (
    <Shell current={current} lesson={lesson} ready={can} kind={`build n${n}${q.spare ? ' spare' : ''}`} text="Load the ship!" speech={speech}
      stage={<div class="cw-ship-load">
        <div class="cw-ship">
          <div class="cw-ship-top">
            <div class="cw-deck">{Array.from({ length: n }, (_, k) => {
              const i = loaded[k];
              return i === undefined ? <span key={k} class="cw-slot" /> : <BoxView key={k} text={q.boxes[i]!} onClick={() => tapSlot(k)} label={`Take ${q.boxes[i]} off`} class={done ? 'loaded' : ''} />;
            })}</div>
            <span class="cw-bridge" aria-hidden="true"><i /></span>
          </div>
          <Hull />
        </div>
      </div>}
      controls={<div class="cw-quay-row">{q.boxes.map((b, i) => (
        <BoxView key={`${b}-${i}`} text={b} faded={loaded.includes(i)} lit={hint === b && !loaded.includes(i)} onClick={() => tapBox(i)} label={b} />
      ))}</div>} />
  );
}

// ---------- Split It ----------

function SplitView({ current, q, waiting }: { current: Current; q: SplitQ; waiting: boolean }) {
  const speech = speechOf(q);
  const ready = useAsked(current, speech), lesson = lessonFor(current.signal), c = useChoice(current, ready, waiting), hint = lesson.hint.value;
  const letters = [...q.word], apart = lesson.apart.value || c.done !== null;
  return (
    <Shell current={current} lesson={lesson} ready={c.can} kind={`split${q.slow ? ' slow' : ''}`} text="Where does it split?" speech={speech}
      stage={lesson.row.value ? null : <div class={cls('cw-split', apart && 'apart')} style={{ '--n': letters.length } as Record<string, string | number>}>
        {letters.map((ch, i) => (
          <span key={i} class={cls('cw-letter', apart && i >= q.at && 'right-half')}>{ch}
            {i < letters.length - 1 && <button class={cls('cw-cut', c.wrong.includes(String(i + 1)) && 'wrong', (c.done === String(i + 1) || hint === String(i + 1)) && 'hint')}
              aria-label={`Split after ${letters.slice(0, i + 1).join('')}`} onClick={() => c.tap(String(i + 1))} />}
          </span>
        ))}
      </div>} />
  );
}

// ---------- Read It (and Bossy R's Level 2) ----------

function ReadView({ current, q, waiting }: { current: Current; q: ReadQ; waiting: boolean }) {
  const speech = speechOf(q as Asking['q']);
  const ready = useAsked(current, speech), lesson = lessonFor(current.signal), c = useChoice(current, ready, waiting), hint = lesson.hint.value;
  return (
    <Shell current={current} lesson={lesson} ready={c.can} kind={`read n${q.choices.length}`} text="Tap its picture." speech={speech}
      stage={lesson.row.value ? null : <Written w={q.word} />}
      controls={<div class={cls('choices', 'cw-pics', `n${q.choices.length}`)}>{q.choices.map(w => (
        <button key={w} class={cls(choiceCls(w, c, hint), 'cw-pic-btn')} aria-label={`Picture ${q.choices.indexOf(w) + 1}`} onClick={() => c.tap(w)}><span class="cw-pic">{wordOf(w).pic}</span></button>
      ))}</div>} />
  );
}

// ---------- Bossy R's Level 1: fill the gap ----------

function GapView({ current, q, waiting }: { current: Current; q: GapQ; waiting: boolean }) {
  const speech = speechOf(q);
  const ready = useAsked(current, speech), lesson = lessonFor(current.signal), c = useChoice(current, ready, waiting), hint = lesson.hint.value;
  const shown = c.done ?? null;
  return (
    <Shell current={current} lesson={lesson} ready={c.can} kind="r form-gap" text="Which bossy r goes in the gap?" speech={speech}
      stage={lesson.row.value ? null : <div class="cw-gap-row">{q.syls.map((s, i) => {
        if (i !== q.gap) return <BoxView key={i} text={s} />;
        const at = s.indexOf(q.right);
        return <BoxView key={i} text={`${s.slice(0, at)}${shown ?? '__'}${s.slice(at + 2)}`} lit={!!shown} class="cw-gap-box" />;
      })}</div>}
      controls={<div class="choices cw-rs">{q.choices.map(r => (
        <button key={r} class={cls(choiceCls(r, c, hint), 'cw-r-btn')} aria-label={r} onClick={() => c.tap(r)}><BoxView text={r} small /></button>
      ))}</div>} />
  );
}

// ---------- Add-Ons ----------

function AddPicView({ current, q, waiting }: { current: Current; q: AddPicQ; waiting: boolean }) {
  const [a, b] = q.syls;
  const speech = speechOf(q);
  const ready = useAsked(current, speech), lesson = lessonFor(current.signal), c = useChoice(current, ready, waiting), hint = lesson.hint.value;
  return (
    <Shell current={current} lesson={lesson} ready={c.can} kind="addon form-pic" text={<>Which picture shows <b class="cw-inline">{q.word}</b>?</>} speech={speech}
      stage={lesson.row.value ? null : <div class="cw-bolted"><BoxView text={a!} /><span class="cw-bolt" aria-hidden="true">🔩</span><BoxView text={b!} /></div>}
      controls={<div class="choices cw-pics n3">{q.choices.map((p, i) => (
        <button key={p} class={cls(choiceCls(p, c, hint), 'cw-pic-btn')} aria-label={`Picture ${i + 1}`} onClick={() => c.tap(p)}><span class="cw-pic">{p}</span></button>
      ))}</div>} />
  );
}

function WordChoices({ choices, c, hint }: { choices: readonly string[]; c: ReturnType<typeof useChoice>; hint: string | null }) {
  return <div class="choices cw-words">{choices.map(w => <button key={w} class={cls(choiceCls(w, c, hint), 'cw-word-btn')} aria-label={w} onClick={() => c.tap(w)}>{w}</button>)}</div>;
}

function AddMeansView({ current, q, waiting }: { current: Current; q: AddMeansQ; waiting: boolean }) {
  const speech = speechOf(q);
  const ready = useAsked(current, speech), lesson = lessonFor(current.signal), c = useChoice(current, ready, waiting);
  return (
    <Shell current={current} lesson={lesson} ready={c.can} kind="addon form-means" text={<>Which word means “{q.add.means}”?</>} speech={speech}
      stage={lesson.row.value ? null : <div class="cw-ear" aria-hidden="true">🔩</div>}
      controls={<WordChoices choices={q.choices} c={c} hint={lesson.hint.value} />} />
  );
}

function AddHideView({ current, q, waiting }: { current: Current; q: AddHideQ; waiting: boolean }) {
  const speech = speechOf(q);
  const ready = useAsked(current, speech), lesson = lessonFor(current.signal), c = useChoice(current, ready, waiting);
  return (
    <Shell current={current} lesson={lesson} ready={c.can} kind="addon form-hide" text={<>Which word is hiding in <b class="cw-inline">{q.word}</b>?</>} speech={speech}
      stage={lesson.row.value ? null : <Written w={q.word} />}
      controls={<WordChoices choices={q.choices} c={c} hint={lesson.hint.value} />} />
  );
}

const COMPARE_NOUN = { long: 'ship', short: 'ship', dark: 'container', thick: 'rope' } as const;
function CompareThing({ base, size }: { base: AddCompareQ['base']; size: number }) {
  if (base === 'long' || base === 'short') return <span class="cw-cmp-ship" style={{ width: `${30 + size * 22}%` }} aria-hidden="true"><i /></span>;
  if (base === 'dark') return <span class="cw-cmp-box" style={{ background: `hsl(205 70% ${72 - size * 18}%)` }} aria-hidden="true" />;
  return <span class="cw-cmp-rope" style={{ height: `${4 + size * 7}px` }} aria-hidden="true" />;
}
function AddCompareView({ current, q, waiting }: { current: Current; q: AddCompareQ; waiting: boolean }) {
  const speech = speechOf(q);
  const ready = useAsked(current, speech), lesson = lessonFor(current.signal), c = useChoice(current, ready, waiting), hint = lesson.hint.value;
  return (
    <Shell current={current} lesson={lesson} ready={c.can} kind={`addon form-compare n${q.sizes.length}`} text="Read it. Tap the one it tells you." speech={speech}
      stage={lesson.row.value ? null : <Written w={`the ${q.word} ${COMPARE_NOUN[q.base]}`} class="phrase" />}
      controls={<div class={cls('choices', 'cw-compare', `b-${q.base}`)}>{q.sizes.map((s, i) => (
        <button key={i} class={cls(choiceCls(String(i), c, hint), 'cw-cmp-btn')} aria-label={`Choice ${i + 1}`} onClick={() => c.tap(String(i))}><CompareThing base={q.base} size={s} /></button>
      ))}</div>} />
  );
}

// ---------- the question, and Meetings ----------

export function QuestionView({ current, waiting }: { current: Current; waiting: boolean }) {
  const q = current.problem.q;
  switch (q.kind) {
    case 'count': return <CountView current={current} q={q} waiting={waiting} />;
    case 'build': return <BuildView current={current} q={q} waiting={waiting} />;
    case 'split': return <SplitView current={current} q={q} waiting={waiting} />;
    case 'read': return <ReadView current={current} q={q} waiting={waiting} />;
    case 'r': return q.form === 'gap' ? <GapView current={current} q={q} waiting={waiting} /> : q.form === 'read' ? <ReadView current={current} q={q} waiting={waiting} /> : <BuildView current={current} q={q} waiting={waiting} />;
    case 'addon':
      return q.form === 'pic' ? <AddPicView current={current} q={q} waiting={waiting} /> : q.form === 'means' ? <AddMeansView current={current} q={q} waiting={waiting} />
        : q.form === 'hide' ? <AddHideView current={current} q={q} waiting={waiting} /> : <AddCompareView current={current} q={q} waiting={waiting} />;
  }
}

const MEET = {
  open: { line: 'This container ends with its vowel. The vowel says its name.', example: 'tiger', title: 'Open containers' },
  le: { line: 'A letter and l e at the end go together.', example: 'turtle', title: 'Containers with l e' },
  y: { line: 'A y at the end of a long word says ee.', example: 'happy', title: 'Y at the end' },
} as const satisfies Record<Meet['meeting'], { line: Phrase; example: string; title: string }>;

/** A new kind of syllable, met before the first question that needs it: its container, the rule, and an example word said one
 *  syllable at a time. He taps Go. */
export function MeetView({ current, waiting }: { current: ProblemInstance<Meet, string>; waiting: boolean }) {
  const voice = useVoice(), m = MEET[current.problem.meeting], w = wordOf(m.example);
  const [ready, setReady] = useState(false), [lit, setLit] = useState(-1);
  useEffect(() => {
    void (async () => {
      await voice.say('Here is a new kind of container!', m.line);
      for (let i = 0; i < w.syls.length && voice.active; i++) { setLit(i); await voice.say(syl(w.syls[i]!)); await voice.wait(200); }
      setLit(w.syls.length);
      if (voice.active) await voice.say(word(w.word));
      if (voice.active) { await voice.say('Tap Go!'); if (!current.signal.aborted) setReady(true); }
    })();
  }, []);
  const go = () => { if (ready && !waiting && !current.actions.busy) current.actions.submit('ok'); };
  return (
    <div class={cls('game', 'cw', 'meet', `meet-${current.problem.meeting}`)} data-ready={ready && !waiting ? 'yes' : 'no'}>
      <div class="ask"><h2>{m.title}</h2></div>
      <div class="cw-body">
        <div class="cw-stage cw-meet-stage"><div class="cw-lesson-row static">{w.syls.map((s, i) => <BoxView key={i} text={s} lit={lit === i || lit >= w.syls.length} />)}</div>
          {w.pic && <div class="cw-pic big" aria-hidden="true">{w.pic}</div>}</div>
        <div class="cw-controls"><button class={cls('big-btn', 'go', 'go-btn', ready && 'pulse')} aria-label="Go" onClick={go}><span class="e">▶</span><span class="go-word">Go</span></button></div>
      </div>
    </div>
  );
}
