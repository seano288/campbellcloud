// The questions on screen. Every letter is drawn from its stroke data (art/Glyph.tsx), the same ball-and-stick shapes he writes, on
// the three writing lines. The question is always said; 🔊 says it again with no penalty, and 🔎 runs the fuller lesson (it counts as
// help). A miss is never marked with a red X: a wrong choice greys and wobbles, and the lesson plays on the letter itself
// (writing/teach.ts); in the writing kinds the little plane flies the stroke.
import { useEffect, useMemo, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { sClink, sNope } from '../audio/sfx';
import type { ProblemInstance } from '../learning/round';
import { Glyph, LetterStrokes, Lines, rowLayout } from './art/Glyph';
import type { Look } from './art/plane';
import { flight } from './airfield/state';
import { player } from './game';
import { glyphKey } from './letters/glyphs';
import { TUNING } from './letters/check';
import { FAMILIES, letter, startOf } from './letters/strokes';
import type { Asking, Problem } from './mix';
import { chatter } from './art/loop';
import { FAMILY_LINES, nameOf, type Phrase } from './phrases';
import { askLine } from './writing/ask';
import { boxesOf, strokeAt, type FlipQ, type MeetQ, type SizeQ, type StartQ, type TraceQ, type WordQ, type WriteQ } from './writing/problems';
import { help, lessonFor, type Lesson } from './writing/teach';
import { WritePad, type Guide } from './writing/WritePad';
import { useVoice, type Item } from './voice';

type Current<P = Problem> = ProblemInstance<P, string>;
const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');
void flight;

/** Says the question, then marks that it has been said (taps wait for it). */
function useAsked(current: { signal: AbortSignal }, speech: readonly Item[]) {
  const voice = useVoice();
  const [ready, setReady] = useState(false);
  useEffect(() => { void voice.say(...speech).then(() => { if (!current.signal.aborted) setReady(true); }); }, []);
  return ready;
}

/** b and d (or p and q) side by side in a lesson, the one being said lit. */
function PairPanel({ lesson }: { lesson: Lesson }) {
  const p = lesson.pair.value;
  if (!p) return null;
  return (
    <div class="sw-pair" aria-live="polite">
      {p.chars.map((ch, i) => <div key={ch} class={cls('sw-pair-one', p.lit === i && 'on')}><Glyph parts={[{ ch }]} lit={p.lit === i ? { at: 0, strokes: [0] } : null} /><span class="sw-name">{ch}</span></div>)}
    </div>
  );
}

function Shell({ current, kind, text, speech, children, ready }: {
  current: Current<Asking>; kind: string; text: ComponentChildren; speech: readonly Item[]; children: ComponentChildren; ready: boolean;
}) {
  const voice = useVoice(), lesson = lessonFor(current.signal);
  return (
    <div class={cls('game', 'sw', ...kind.split(' ').map(k => `k-${k}`))} data-ready={ready ? 'yes' : 'no'}>
      <div class="ask">
        <button class="say-btn" aria-label="Say it again" onClick={() => void voice.say(...speech)}>🔊</button>
        <h2>{text}</h2>
        <button class="help-btn say-btn" aria-label="Help" onClick={() => current.actions.help(() => help(current.problem, current.signal))}>🔎</button>
      </div>
      <PairPanel lesson={lesson} />
      <div class="sw-work">{children}</div>
    </div>
  );
}

const canTap = (current: Current<Asking>, waiting: boolean, ready: boolean) => ready && !waiting && !current.actions.busy;

/** Wrong choices he has tapped (they grey out and wobble), and the right one once it's his. */
function useChoices(current: Current<Asking>, waiting: boolean, ready: boolean) {
  const lesson = lessonFor(current.signal);
  const [wrong, setWrong] = useState<string[]>([]), [right, setRight] = useState<string | null>(null), [shake, setShake] = useState<string | null>(null);
  function tap(key: string) {
    if (!canTap(current, waiting, ready) || wrong.includes(key) || right) return;
    const verdict = current.actions.submit(key);
    if (verdict === 'correct') { setRight(key); lesson.glow.value = null; sClink(); }
    else if (verdict === 'incorrect') { setWrong(x => [...x, key]); setShake(key); setTimeout(() => setShake(null), 500); }
  }
  const state = (key: string) => cls(wrong.includes(key) && 'wrong', right === key && 'right', lesson.glow.value === key && 'hint', shake === key && 'wobble');
  return { tap, state, right };
}

/** A letter written big in the question title, in the reading font. */
const Big = ({ t }: { t: string }) => <span class="sw-ch">{t}</span>;

// ---------- writing: Trace It, Write It, Write a Word ----------

function WriteView({ current, q, waiting }: { current: Current<Asking>; q: TraceQ | WriteQ | WordQ; waiting: boolean }) {
  const voice = useVoice(), lesson = lessonFor(current.signal), level = current.problem.level, chars = boxesOf(q);
  // a hint after a rub-out is dropped while the voice is still talking, so rubbing out again and again never queues up a string of them
  const hint = useMemo(() => chatter((line: Phrase) => voice.sayMore(line)), [voice]);
  const speech: Item[] = askLine(q);
  const ready = useAsked(current, speech);
  const [showWord, setShowWord] = useState(q.kind === 'word' && q.show !== 'said');
  useEffect(() => { if (q.kind === 'word' && q.show === 'flash') { const t = setTimeout(() => setShowWord(false), 2600); return () => clearTimeout(t); } }, []);
  const guide: Guide = q.kind === 'trace' ? (level === 1 ? 'arrow' : level === 2 ? 'dots' : 'faint') : 'none';
  const tuning = q.kind === 'trace' ? TUNING[level] : TUNING.write;
  const a = player.state.value.airfield, look: Look = { plane: a.fitted.plane, paint: a.fitted.paint, prop: a.fitted.prop, pilot: a.fitted.pilot };
  const smoke = ({ white: '#ffffff' } as Record<string, string>)[a.fitted.smoke] ?? smokeColor(a.fitted.smoke);
  const text = q.kind === 'trace' ? <>Trace <Big t={q.ch} /></> : q.kind === 'write' ? <>Write <Big t={q.text} /></> : <>Write the word</>;
  const active = canTap(current, waiting, ready);
  return (
    <Shell current={current} kind={`write ${q.kind}`} text={text} speech={speech} ready={ready && !waiting}>
      {q.kind === 'word' && <div class={cls('sw-word', !showWord && 'hidden')} aria-label={showWord ? q.word : 'The word is hidden'}>{showWord ? q.word : '???'}</div>}
      <div class="sw-pad-wrap">
        <WritePad chars={chars} tuning={tuning} guide={guide} signal={current.signal} active={active} flash={q.kind === 'write' && q.flash} smoke={smoke} look={look}
          on={{
            stroke: done => { current.actions.submit(done ? 'done' : 'more'); },
            miss: (why, stroke, box) => { current.actions.submit(`miss:${why}:${stroke}:${box}`); },
            rub: why => {
              if (!voice.active || lesson.fly.peek()) return;
              if ((why === 'tap' || why === 'away') && (guide === 'arrow' || guide === 'dots')) hint('Start at the green dot!');
              else if (why === 'lane' && q.kind === 'trace') hint('Stay on the path!');
              else if (why === 'lift') hint('Keep going!');
            },
          }} />
      </div>
    </Shell>
  );
}
const SMOKE_COLORS: Record<string, string> = {
  red: '#ff5a4f', blue: '#3f8cff', yellow: '#ffd23f', green: '#3fd16a', orange: '#ff9a2e', purple: '#a46bff', pink: '#ff8ac4', black: '#33343a',
  sky: '#9fe0ff', silver: '#d6dde6', gold: '#f2c53a', glow: 'glow', rainbow: 'rainbow',
};
const smokeColor = (id: string) => SMOKE_COLORS[id] ?? '#ffffff';

// ---------- Where to Start ----------

/** What part of the lines a framed letter shows: all of them, or (`crop`) just around the letter, so a small letter's dots are big
 *  enough to tap apart on a sideways phone. */
function frame(ch: string, crop = false) {
  const L = letter(ch), PAD = 0.6, ys = L.strokes.flatMap(s => s.pts.map(p => p[1]));
  const y0 = crop ? Math.max(-PAD, Math.min(...ys) - 0.55) : -PAD, y1 = crop ? Math.min(3 + PAD, Math.max(...ys) + 0.55) : 3 + PAD;
  return { x0: -PAD, y0, w: L.width + PAD * 2, h: y1 - y0 };
}
/** A letter on its lines in a box the same shape as the drawing, so things can be placed over it in percent. */
function Framed({ ch, children, lit, over, onTap, crop }: { ch: string; children?: ComponentChildren; lit?: readonly number[]; over?: ComponentChildren; onTap?(p: [number, number]): void; crop?: boolean }) {
  const L = letter(ch), f = frame(ch, crop);
  return (
    <div class={cls('sw-framed', crop && 'crop')} style={{ aspectRatio: `${f.w} / ${f.h}` }}>
      <svg viewBox={`${f.x0} ${f.y0} ${f.w} ${f.h}`} class="sw-glyph" role="img" aria-label={`The letter ${ch}`}
        onClick={onTap ? (e => { const svg = e.currentTarget as SVGSVGElement, m = svg.getScreenCTM(); if (!m) return; const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse()); onTap([p.x, p.y]); }) : undefined}>
        <Lines x0={f.x0} x1={L.width - f.x0} />
        <LetterStrokes ch={ch} lit={lit} />
        {children}
      </svg>
      {over}
    </div>
  );
}
const pct = (ch: string, [x, y]: readonly [number, number], crop = false) => { const f = frame(ch, crop); return { left: `${((x - f.x0) / f.w) * 100}%`, top: `${((y - f.y0) / f.h) * 100}%` }; };

function StartView({ current, q, waiting }: { current: Current<Asking>; q: StartQ; waiting: boolean }) {
  const lesson = lessonFor(current.signal);
  const speech: Item[] = askLine(q), ready = useAsked(current, speech), c = useChoices(current, waiting, ready);
  const title = q.step === 'dot' ? <>Where does <Big t={q.ch} /> start?</> : q.step === 'way' ? <>Which way does <Big t={q.ch} /> go first?</> : <>Which line comes second?</>;
  const L = letter(q.ch), lit = lesson.lit.value, [tapped, setTapped] = useState<number | null>(null);
  if (q.step === 'dot') return (
    <Shell current={current} kind="start" text={title} speech={speech} ready={ready && !waiting}>
      <Framed ch={q.ch} lit={lit} crop over={q.dots!.map((d, i) => (
        <button key={i} class={cls('sw-dotbtn', c.state(String(i)))} style={pct(q.ch, d, true)} aria-label={`Dot ${i + 1}`} data-key={String(i)} onClick={() => c.tap(String(i))}><span /></button>
      ))} />
    </Shell>
  );
  if (q.step === 'way') {
    const s0 = startOf(L.strokes[0]!);
    return (
      <Shell current={current} kind="start" text={title} speech={speech} ready={ready && !waiting}>
        <Framed ch={q.ch} lit={lit}><circle cx={s0[0]} cy={s0[1]} r={0.17} class="sw-startdot" /></Framed>
        <div class="sw-arrows" role="group" aria-label="Arrows">
          {q.arrows!.map((a, i) => (
            <button key={i} class={cls('sw-arrow', c.state(String(i)))} aria-label={`Arrow ${i + 1}`} data-key={String(i)} onClick={() => c.tap(String(i))}>
              <span style={{ transform: `rotate(${Math.atan2(a[1], a[0])}rad)` }}>➜</span>
            </button>
          ))}
        </div>
      </Shell>
    );
  }
  // which stroke comes second: tap it on the letter
  const hint = lesson.glow.value === q.answer ? [1] : [];
  return (
    <Shell current={current} kind="start second" text={title} speech={speech} ready={ready && !waiting}>
      <Framed ch={q.ch} crop lit={[...lit, ...hint, ...(tapped !== null ? [tapped] : [])]} onTap={p => { const k = strokeAt(L, p, 0.7); if (k === null) return; setTapped(k); c.tap(String(k)); }}>
        {L.strokes.map((s, k) => s.dot
          ? <circle key={k} cx={s.pts[0]![0]} cy={s.pts[0]![1]} r={0.35} class="sw-hit" data-stroke={k} />
          : <path key={k} d={s.pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join('')} class="sw-hit" data-stroke={k} />)}
      </Framed>
      {c.right && <p class="sw-said">✓</p>}
    </Shell>
  );
}

// ---------- Which Way ----------

function FlipView({ current, q, waiting }: { current: Current<Asking>; q: FlipQ; waiting: boolean }) {
  const speech: Item[] = askLine(q);
  const ready = useAsked(current, speech), c = useChoices(current, waiting, ready);
  if (q.step === 'word') {
    const parts = [...q.word!].map((ch, i) => ({ ch, turn: i === q.at ? ('m' as const) : ('id' as const) }));
    return (
      <Shell current={current} kind="flip word" text="Which letter is backwards?" speech={speech} ready={ready && !waiting}>
        <Row parts={parts} c={c} />
      </Shell>
    );
  }
  return (
    <Shell current={current} kind={`flip ${q.step}`} text={<>Tap <Big t={q.ch} /></>} speech={speech} ready={ready && !waiting}>
      <div class={cls('sw-choices', `n${q.glyphs!.length}`)} role="group" aria-label="Letters">
        {q.glyphs!.map((g, i) => {
          const k = glyphKey(g);
          return <button key={k} class={cls('sw-choice', c.state(k))} aria-label={`Letter ${i + 1}`} data-key={k} onClick={() => c.tap(k)}><Glyph parts={[{ ch: g.ch, turn: g.turn }]} /></button>;
        })}
      </div>
    </Shell>
  );
}

/** A word on its lines, each letter a button. */
function Row({ parts, c }: { parts: readonly { ch: string; dy?: number; turn?: 'id' | 'm' }[]; c: ReturnType<typeof useChoices> }) {
  const { at, width } = rowLayout(parts), PAD = 0.35, W = width + PAD * 2;
  return (
    <div class="sw-row" style={{ aspectRatio: `${W} / ${3 + PAD * 2}` }}>
      <Glyph parts={parts} />
      {parts.map((_, i) => (
        <button key={i} class={cls('sw-letterbtn', c.state(String(i)))} aria-label={`Letter ${i + 1}`} data-key={String(i)} onClick={() => c.tap(String(i))}
          style={{ left: `${((at[i]!.x - 0.2 + PAD) / W) * 100}%`, width: `${((at[i]!.w + 0.4) / W) * 100}%` }} />
      ))}
    </div>
  );
}

// ---------- Tall, Small, Tail ----------

const SIZE_ICONS = { tall: '⬆️', small: '⏺️', tail: '⬇️' } as const;
function SizeView({ current, q, waiting }: { current: Current<Asking>; q: SizeQ; waiting: boolean }) {
  const speech: Item[] = askLine(q);
  const ready = useAsked(current, speech), c = useChoices(current, waiting, ready);
  if (q.step === 'sort') return (
    <Shell current={current} kind="size sort" text={<>Is <Big t={q.ch} /> tall, small, or a tail?</>} speech={speech} ready={ready && !waiting}>
      <Framed ch={q.ch} />
      <div class="sw-choices n3 words" role="group" aria-label="Sizes">
        {(['tall', 'small', 'tail'] as const).map(k => (
          <button key={k} class={cls('sw-choice sw-sizebtn', c.state(k))} aria-label={k === 'tall' ? 'Tall' : k === 'small' ? 'Small' : 'Tail'} data-key={k} onClick={() => c.tap(k)}>
            <span class="ico">{SIZE_ICONS[k]}</span><span class="nm">{k === 'tall' ? 'Tall' : k === 'small' ? 'Small' : 'Tail'}</span>
          </button>
        ))}
      </div>
    </Shell>
  );
  if (q.step === 'line') return (
    <Shell current={current} kind="size line" text="Which one sits on the line?" speech={speech} ready={ready && !waiting}>
      <div class="sw-choices n3 rows" role="group" aria-label="Writings">
        {q.rows!.map((r, i) => <button key={i} class={cls('sw-choice sw-rowbtn', c.state(String(i)))} aria-label={`Writing ${i + 1}`} data-key={String(i)} onClick={() => c.tap(String(i))}><Glyph parts={r} /></button>)}
      </div>
    </Shell>
  );
  return (
    <Shell current={current} kind="size odd" text="Which letter floats or sinks?" speech={speech} ready={ready && !waiting}>
      <Row parts={q.rows![0]!} c={c} />
    </Shell>
  );
}

// ---------- meeting a Family ----------

/** A new Family: what its letters share, said; then each letter written in smoke while it's named. Then Go. */
export function MeetView({ current }: { current: Current }) {
  const q = current.problem.q as MeetQ, voice = useVoice(), chars = FAMILIES[q.family];
  const [count, setCount] = useState(0), [ready, setReady] = useState(false);
  const fast = chars.length > 6;
  useEffect(() => {
    void (async () => {
      await voice.say('A new letter family!', FAMILY_LINES[q.family]);
      for (let i = 0; i < chars.length && voice.active; i++) { setCount(i + 1); await Promise.all([voice.say(nameOf(chars[i]!)), voice.wait(fast ? 500 : 900)]); }
      if (voice.active) { setReady(true); void voice.say('Tap Go when you are ready!'); }
    })();
  }, []);
  return (
    <div class="game sw k-meet" data-ready={ready ? 'yes' : 'no'}>
      <div class="ask">
        <button class="say-btn" aria-label="Say it again" onClick={() => void voice.say(FAMILY_LINES[q.family])}>🔊</button>
        <h2>A new letter family!</h2>
      </div>
      <div class={cls('sw-family', fast && 'many')}>
        {chars.map((ch, k) => (
          <button key={ch} class={cls('sw-famletter', k < count && 'shown')} aria-label={ch} onClick={() => { if (k < count) void voice.say(nameOf(ch)); }}>
            {k < count && <Glyph parts={[{ ch }]} cls="drawn" />}
          </button>
        ))}
      </div>
      <button class={cls('big-btn', 'go', 'meet-go', ready && 'pulse')} aria-label="Go" onClick={() => { if (ready) current.actions.submit('go'); else sNope(); }}>Go ▶</button>
    </div>
  );
}

// ---------- the question ----------

export function QuestionView({ current, waiting }: { current: Current; waiting: boolean }) {
  const p = current.problem;
  if (p.mode === 'meet') return <MeetView current={current} />;
  const c = current as Current<Asking>, q = p.q;
  if (q.kind === 'trace' || q.kind === 'write' || q.kind === 'word') return <WriteView current={c} q={q} waiting={waiting} />;
  if (q.kind === 'start') return <StartView current={c} q={q} waiting={waiting} />;
  if (q.kind === 'flip') return <FlipView current={c} q={q} waiting={waiting} />;
  return <SizeView current={c} q={q} waiting={waiting} />;
}
