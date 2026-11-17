// The questions on screen. Every word he reads is lowercase Andika (a sentence starts with a capital, as sentences do). Read It and
// Read and Find never say the word or sentence before he answers: he reads it. Hear It says the word as it appears, and 🔊 or the ear
// says it again as often as he likes, with no penalty. A miss is never marked with a red X: a wrong choice greys and wobbles, and the
// lesson (reading/teach.ts) plays in the panel above the choices, on the word's own sound boxes.
import { useEffect, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { sClink, sNope } from '../audio/sfx';
import type { ProblemInstance } from '../learning/round';
import type { Asking, Problem } from './mix';
import { PATTERN_LINES, slowly, type Phrase } from './phrases';
import { sceneKey, sentenceOf, type HearQ, type MeetQ, type ReadQ, type RealQ, type Scene, type SentenceQ, type SwapQ } from './reading/problems';
import { help, lessonFor, patternSounds, sweep, type Lesson } from './reading/teach';
import { infoOf, type Word } from './words/list';
import { pictureOf } from './words/pictures';
import { useVoice, type Item } from './voice';

type Current<P = Problem> = ProblemInstance<P, string>;
const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');

// ---------- the sound boxes ----------

/** A sound's letters as shown in its box: "a_e" shows "a" (its e sits at the end of the word, in its own linked box). */
export const shown = (spelling: string) => (spelling.endsWith('_e') ? spelling.slice(0, -2) : spelling);
/** How a spelling is written on a tile: "a_e" as "a‿e". */
export const tileText = (spelling: string) => (spelling.endsWith('_e') ? `${spelling.slice(0, -2)}‿e` : spelling);

/** A word in its sound boxes, one per sound; a magic e in its own little box at the end, linked to its vowel's by colour. */
export function Boxes({ word, sounds: given, lit, marks, onTap, label, size, wobble, open, glow }: {
  word?: Word; sounds?: readonly string[]; lit?: number | null; marks?: readonly boolean[]; onTap?(i: number): void; label: string; size?: string;
  wobble?: number | null; open?: number | null; glow?: number | null;
}) {
  const sounds = given ?? infoOf(word!).sounds, magicAt = sounds.findIndex(s => s.endsWith('_e'));
  const n = sounds.reduce((k, s) => k + shown(s).length, 0) + (magicAt >= 0 ? 1 : 0), b = sounds.length + (magicAt >= 0 ? 1 : 0);
  return (
    <div class={cls('dd-frame', size)} role="group" aria-label={label} style={{ '--n': n, '--b': b }}>
      {sounds.map((s, i) => {
        const c = cls('dd-box', s.endsWith('_e') && 'magic', lit === i && 'lit', marks?.[i] && 'new', wobble === i && 'wobble', open === i && 'open', glow === i && 'marked');
        const inner = [...shown(s)].map((ch, j) => <span key={j} class="cell"><span class="ch">{open === i ? '' : ch}</span></span>);
        return onTap
          ? <button key={i} class={c} aria-label={`Sound ${i + 1}: ${shown(s)}`} data-box={i} onClick={() => onTap(i)}>{inner}</button>
          : <span key={i} class={c}>{inner}</span>;
      })}
      {magicAt >= 0 && (
        <span class={cls('dd-box', 'magic', 'ebox', lit === magicAt && 'lit', marks?.[magicAt] && 'new')} aria-label="The magic e">
          <span class="spark" aria-hidden="true">✨</span><span class="cell"><span class="ch">e</span></span>
        </span>
      )}
    </div>
  );
}

/** The lesson panel: the right word in its boxes, lit sound by sound; another one sound away under it; or the Pattern's introduction. */
function LessonPanel({ lesson }: { lesson: Lesson }) {
  const p = lesson.panel.value;
  if (!p) return null;
  const marks = p.pattern ? patternSounds(p.pattern, infoOf(p.top).sounds) : undefined;
  const diff = p.diff !== undefined ? infoOf(p.top).sounds.map((_, i) => i === p.diff) : undefined;
  return (
    <div class={cls('dd-lesson', p.bottom && 'pair')} aria-live="polite">
      {p.pattern && <p class="dd-rule">{PATTERN_LINES[p.pattern]}</p>}
      <Boxes word={p.top} lit={lesson.lit.value} marks={marks ?? diff} label={`The word ${p.top}`} size="lesson" />
      {p.bottom && <Boxes word={p.bottom} lit={lesson.litBottom.value} marks={diff} label={`The word ${p.bottom}`} size="lesson" />}
    </div>
  );
}

// ---------- the question around them ----------

/** Says the question, then marks that it has been said (taps wait for it). */
function useAsked(current: { signal: AbortSignal }, speech: readonly Item[]) {
  const voice = useVoice();
  const [ready, setReady] = useState(false);
  useEffect(() => { void voice.say(...speech).then(() => { if (!current.signal.aborted) setReady(true); }); }, []);
  return ready;
}

function Shell({ current, kind, text, speech, children, ready }: {
  current: Current<Asking>; kind: string; text: string; speech: readonly Item[]; children: ComponentChildren; ready: boolean;
}) {
  const voice = useVoice(), lesson = lessonFor(current.signal);
  return (
    <div class={cls('game', 'dd', kind)} data-ready={ready ? 'yes' : 'no'}>
      <div class="ask">
        <button class="say-btn" aria-label="Say it again" onClick={() => void voice.say(...speech)}>🔊</button>
        <h2>{text}</h2>
        <button class="help-btn say-btn" aria-label="Help" onClick={() => current.actions.help(() => help(current.problem, current.signal))}>🔎</button>
      </div>
      <LessonPanel lesson={lesson} />
      <div class="dd-work">{children}</div>
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
  return { tap, state };
}

// ---------- Read It ----------

function ReadView({ current, q, waiting }: { current: Current<Asking>; q: ReadQ; waiting: boolean }) {
  const speech: Item[] = ['Read the word. Tap its picture!'], ready = useAsked(current, speech), c = useChoices(current, waiting, ready);
  return (
    <Shell current={current} kind="read" text="Read the word. Tap its picture!" speech={speech} ready={ready && !waiting}>
      <div class="dd-word" aria-label={`The word: ${q.word}`}>{q.word}</div>
      <div class={cls('dd-pics', `n${q.choices.length}`)} role="group" aria-label="Pictures">
        {q.choices.map(w => (
          <button key={w} class={cls('dd-pic', c.state(w))} aria-label={`Picture ${q.choices.indexOf(w) + 1}`} data-key={w} onClick={() => c.tap(w)}>
            <span class="emo">{pictureOf(w)}</span>
          </button>
        ))}
      </div>
    </Shell>
  );
}

// ---------- Hear It ----------

function HearView({ current, q, waiting }: { current: Current<Asking>; q: HearQ; waiting: boolean }) {
  const voice = useVoice(), speech: Item[] = ['Tap the word', q.word], ready = useAsked(current, speech), c = useChoices(current, waiting, ready);
  return (
    <Shell current={current} kind="hear" text="Tap the word you hear!" speech={speech} ready={ready && !waiting}>
      <button class="dd-ear" aria-label="Hear the word again" onClick={() => void voice.say(q.word)}><span aria-hidden="true">👂</span><span class="dd-ear-say" aria-hidden="true">🔊</span></button>
      <div class={cls('dd-words', `n${q.choices.length}`)} role="group" aria-label="Words">
        {q.choices.map(w => <button key={w} class={cls('dd-wordbtn', c.state(w))} aria-label={w} data-key={w} onClick={() => c.tap(w)}><span class="ch">{w}</span></button>)}
      </div>
    </Shell>
  );
}

// ---------- Real or Silly ----------

function RealView({ current, q, waiting }: { current: Current<Asking>; q: RealQ; waiting: boolean }) {
  const speech: Item[] = ['Which one is a real word?'], ready = useAsked(current, speech), c = useChoices(current, waiting, ready);
  return (
    <Shell current={current} kind="real" text="Which one is a real word?" speech={speech} ready={ready && !waiting}>
      <div class="dd-words n2 real" role="group" aria-label="Words">
        {q.choices.map(w => <button key={w} class={cls('dd-wordbtn', c.state(w))} aria-label={w} data-key={w} onClick={() => c.tap(w)}><span class="ch">{w}</span></button>)}
      </div>
    </Shell>
  );
}

// ---------- Read and Find ----------

const SIZE = { big: 1, little: .42 } as const;
/** A picture built from emoji: one thing (big or little), two side by side, one on the other, or one in the other (peeking out). */
export function SceneArt({ s }: { s: Scene }) {
  const a = pictureOf(s.a), b = s.b ? pictureOf(s.b) : null;
  if (!s.rel) return <span class="dd-scene one"><span class="emo" style={{ '--k': s.size ? SIZE[s.size] : .75 }}>{a}</span></span>;
  if (s.rel === 'and') return <span class="dd-scene and"><span class="emo">{a}</span><span class="emo">{b}</span></span>;
  if (s.rel === 'on') return <span class="dd-scene on"><span class="emo top">{a}</span><span class="emo base">{b}</span></span>;
  return <span class="dd-scene in"><span class="emo base">{b}</span><span class="emo inside">{a}</span><span class="emo base front" aria-hidden="true">{b}</span></span>;
}

function SentenceView({ current, q, waiting }: { current: Current<Asking>; q: SentenceQ; waiting: boolean }) {
  const lesson = lessonFor(current.signal), speech: Item[] = ['Read it. Tap the picture!'], ready = useAsked(current, speech), c = useChoices(current, waiting, ready);
  const words = sentenceOf(q.scene).split(' '), lit = lesson.words.value;
  return (
    <Shell current={current} kind="sentence" text="Read it. Tap the picture!" speech={speech} ready={ready && !waiting}>
      <p class="dd-sentence" aria-label={sentenceOf(q.scene)}>{words.map((t, i) => <span key={i} class={cls(lit.includes(i) && 'lit')}>{t}</span>)}</p>
      <div class="dd-pics n3 scenes" role="group" aria-label="Pictures">
        {q.choices.map((s, i) => {
          const k = sceneKey(s);
          return <button key={k} class={cls('dd-pic', c.state(k))} aria-label={`Picture ${i + 1}`} data-key={k} onClick={() => c.tap(k)}><SceneArt s={s} /></button>;
        })}
      </div>
    </Shell>
  );
}

// ---------- Sound Swap ----------

function SwapView({ current, q, waiting }: { current: Current<Asking>; q: SwapQ; waiting: boolean }) {
  const lesson = lessonFor(current.signal), voice = useVoice();
  const speech: Item[] = ['This says', q.from, 'Make it say', q.word, q.marked ? 'Tap the glowing sound!' : 'Tap the sound to change.'];
  const ready = useAsked(current, speech);
  const [at, setAt] = useState<number | null>(null), [done, setDone] = useState(false), [wrongTiles, setWrongTiles] = useState<string[]>([]), [shake, setShake] = useState<string | null>(null);
  const can = canTap(current, waiting, ready) && !done;
  const wobble = (k: string) => { setShake(k); setTimeout(() => setShake(null), 500); };
  function pickBox(i: number) {
    if (!can || at !== null) return;
    const verdict = current.actions.submit(`${i}`);
    if (verdict === 'not-an-answer') { setAt(i); lesson.mark.value = null; sClink(); void voice.say('Now pick the new sound!'); }
    else if (verdict === 'incorrect') wobble(`b${i}`);
  }
  function pickTile(t: string) {
    if (!can || at === null || wrongTiles.includes(t)) return;
    const verdict = current.actions.submit(`${at}=${t}`);
    if (verdict === 'correct') { setDone(true); lesson.glow.value = null; sClink(); }
    else if (verdict === 'incorrect') { setWrongTiles(x => [...x, t]); wobble(`t${t}`); }
  }
  const sounds = done ? infoOf(q.word).sounds : infoOf(q.from).sounds;
  const marked = (q.marked && at === null) || lesson.mark.value === q.box;
  return (
    <Shell current={current} kind="swap" text={`Make it say a new word!`} speech={speech} ready={ready && !waiting}>
      <div class="dd-swap">
        <Boxes sounds={sounds} glow={marked ? q.box : null} onTap={done ? undefined : pickBox} open={at !== null && !done ? at : null}
          wobble={shake?.startsWith('b') ? Number(shake.slice(1)) : null} label={done ? `It says ${q.word}` : 'The word: tap the sound to change'} />
      </div>
      {at !== null && !done && (
        <div class="dd-tiles" role="group" aria-label="New sounds">
          {q.choices.map(t => (
            <button key={t} class={cls('dd-tile', t.length > 1 && 'wide', wrongTiles.includes(t) && 'wrong', lesson.glow.value === t && 'hint', shake === `t${t}` && 'wobble')}
              aria-label={tileText(t)} data-tile={t} onClick={() => pickTile(t)}><span class="ch">{tileText(t)}</span></button>
          ))}
        </div>
      )}
    </Shell>
  );
}

// ---------- meeting a Pattern ----------

/** A new Pattern: what's new, said; then its three example words in their boxes, the new sounds marked, each said. Then Go. */
export function MeetView({ current }: { current: Current }) {
  const q = current.problem.q as MeetQ, voice = useVoice(), lesson = lessonFor(current.signal);
  const [count, setCount] = useState(0), [ready, setReady] = useState(false);
  useEffect(() => {
    void (async () => {
      await voice.say('A new sound pattern!', PATTERN_LINES[q.pattern]);
      for (let i = 0; i < q.examples.length && voice.active; i++) { setCount(i + 1); await sweep(voice, lesson.lit, q.examples[i]!); }
      if (voice.active) { setReady(true); void voice.say('Tap Go when you are ready!'); }
    })();
  }, []);
  return (
    <div class="game dd meet" data-ready={ready ? 'yes' : 'no'}>
      <div class="ask">
        <button class="say-btn" aria-label="Say it again" onClick={() => void voice.say(PATTERN_LINES[q.pattern])}>🔊</button>
        <h2>A new sound pattern!</h2>
      </div>
      <p class="dd-rule">{PATTERN_LINES[q.pattern]}</p>
      <div class="dd-meet-words">
        {q.examples.slice(0, count).map((w, k) => (
          <button key={w} class="dd-meet-word" aria-label={w} onClick={() => void voice.say(slowly(w) as Phrase, w)}>
            <span class="emo" aria-hidden="true">{pictureOf(w) ?? '🦴'}</span>
            <Boxes word={w} lit={k === count - 1 ? lesson.lit.value : null} marks={patternSounds(q.pattern, infoOf(w).sounds)} label={w} size="small" />
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
  if (q.kind === 'read') return <ReadView current={c} q={q} waiting={waiting} />;
  if (q.kind === 'hear') return <HearView current={c} q={q} waiting={waiting} />;
  if (q.kind === 'swap') return <SwapView current={c} q={q} waiting={waiting} />;
  if (q.kind === 'real') return <RealView current={c} q={q} waiting={waiting} />;
  return <SentenceView current={c} q={q} waiting={waiting} />;
}
