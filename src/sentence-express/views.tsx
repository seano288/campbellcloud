// The questions on screen. A sentence is a train: the engine carries the first word and its capital, each car a word, the caboose
// the end mark. The engine and the caboose are drawn from his own train (his engine, his paint), so the word cars and his toy are
// the same train. Every prompt is said as it appears (🔊 says it again); taps wait until it has been said. A miss is never marked
// with a red X: the round engine runs the lesson (reading/teach.ts), which plays on the train or the picture itself.
//
// Taps are pointer events on big buttons (pointerup, so a finger that lands and lifts on the iPad always counts); a car in the yard
// can also be dragged up onto the train.
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { ComponentChildren, JSX } from 'preact';
import { sClink, sNope, tone } from '../audio/sfx';
import type { ProblemInstance } from '../learning/round';
import { ScenePic, WhoPic, type Lit } from './art/Scene';
import { carSvg, engineOf, engineSvg, markCabooseSvg, paintOf, pieceSvg, pieceWidth } from './art/train';
import { player } from './game';
import type { Asking } from './mix';
import { wordPhrase, type Phrase } from './phrases';
import { piecesOf, trainKey, type AskQ, type FixQ, type MarksQ, type MeanQ, type OrderQ, type PicChoice } from './reading/problems';
import { help, lessonFor, type Lesson } from './reading/teach';
import { capForm, midForm, sentence, type Sentence } from './sentences/index';
import { useVoice, type Item } from './voice';

type Current = ProblemInstance<Asking, string>;
const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');

// ---------- the train's pieces ----------

export type Role = 'engine' | 'car' | 'caboose';
/** One piece of a sentence's train: his engine with a word, a word car, or the caboose with a mark. Empty: a dashed gap. */
export function PieceArt({ role, text, empty, dim }: { role: Role; text: string; empty?: boolean; dim?: boolean }) {
  const t = player.state.peek().trains, paint = paintOf(t.paint), w = pieceWidth(role, text);
  const svg = useMemo(() => {
    if (empty) return pieceSvg(`<rect x="2" y="12" width="${w - 4}" height="70" rx="12" fill="#ffffff66" stroke="#1d1d1f" stroke-width="4" stroke-dasharray="10 8"/>`, w);
    const inner = role === 'engine' ? engineSvg(engineOf(t.engine), paint, w, text, dim) : role === 'caboose' ? markCabooseSvg(paint, w, text || null, dim) : carSvg({ shape: 'flat' }, paint, w, text, dim);
    return pieceSvg(inner, w);
  }, [role, text, empty, dim, t.engine, t.paint]);
  return <span class="piece-art" style={{ '--pw': `${w + 28}` } as JSX.CSSProperties} dangerouslySetInnerHTML={{ __html: svg }} />;
}

/** A piece he can tap. Fires on pointerup inside it, so a light touch on the iPad counts. */
function PieceButton({ role, text, onTap, label, class: c, empty, dim, drag, idx }: {
  role: Role; text: string; onTap?(): void; label: string; class?: string; empty?: boolean; dim?: boolean; drag?: { onDrop(): void; target: () => DOMRect | null }; idx?: number;
}) {
  const ref = useRef<HTMLButtonElement>(null), start = useRef<{ x: number; y: number; id: number } | null>(null), [off, setOff] = useState<{ x: number; y: number } | null>(null);
  const down = (e: PointerEvent) => { if (!onTap) return; start.current = { x: e.clientX, y: e.clientY, id: e.pointerId }; ref.current?.setPointerCapture?.(e.pointerId); };
  const move = (e: PointerEvent) => {
    const s = start.current;
    if (!s || !drag || s.id !== e.pointerId) return;
    const dx = e.clientX - s.x, dy = e.clientY - s.y;
    if (off || Math.hypot(dx, dy) > 14) setOff({ x: dx, y: dy });
  };
  const up = (e: PointerEvent) => {
    const s = start.current;
    start.current = null;
    if (!s || !onTap) return;
    if (off && drag) {
      setOff(null);
      const box = drag.target();
      // dragged up onto the train (or anywhere above the yard): it couples on; dropped back in the yard, it stays
      if (box && e.clientY < box.bottom + 20) drag.onDrop();
      return;
    }
    const r = ref.current?.getBoundingClientRect();
    if (!r || (e.clientX >= r.left - 8 && e.clientX <= r.right + 8 && e.clientY >= r.top - 8 && e.clientY <= r.bottom + 8)) onTap();
  };
  const cancel = () => { start.current = null; setOff(null); };
  return (
    <button ref={ref} class={cls('piece', role, c, off && 'dragging')} aria-label={label} data-piece={text} data-idx={idx} disabled={!onTap && !c?.includes('show')}
      style={off ? { transform: `translate(${off.x}px, ${off.y}px) scale(1.06)`, zIndex: 5 } : undefined}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={cancel} onClick={e => e.preventDefault()}>
      <PieceArt role={role} text={text} empty={empty} dim={dim} />
    </button>
  );
}

/** The roles of a train's pieces in order: the engine, the cars, the caboose. */
const roleAt = (i: number, n: number): Role => (i === 0 ? 'engine' : i === n - 1 ? 'caboose' : 'car');
/** How wide the widest of these trains is, in piece units (each piece's width plus its share of the coupling), so the CSS can make
 *  the pieces as big as the card allows with each train on one row. (Build the Train adds room for the gaps between the yard's cars,
 *  so the yard fits on a row too.) */
const fitOf = (...rows: readonly (readonly string[])[]) => Math.max(...rows.map(r => r.reduce((sum, p, i) => sum + pieceWidth(roleAt(i, r.length), p) + 10, 0)));
const pieceLabel = (role: Role, text: string) => (role === 'caboose' ? (text ? `Caboose ${text === '.' ? 'period' : text === '?' ? 'question mark' : 'exclamation mark'}` : 'Empty caboose') : role === 'engine' ? `Engine ${text}` : `Car ${text}`);

/** A sentence's train as it reads, not tappable (or each word tappable to hear it). */
function SentenceTrain({ s, lit, onWord, glowIdx }: { s: Sentence; lit?: readonly number[]; onWord?(i: number): void; glowIdx?: number | null }) {
  const pieces = piecesOf(s), n = pieces.length;
  return (
    <div class="se-train" role="group" aria-label={s.text}>
      {pieces.map((p, i) => <PieceButton key={i} role={roleAt(i, n)} text={p} label={pieceLabel(roleAt(i, n), p)} class={cls('show', lit?.includes(i) && 'lit', glowIdx === i && 'glow')} onTap={onWord && i < n - 1 ? () => onWord(i) : undefined} />)}
    </div>
  );
}

// ---------- the shell ----------

/** Says the prompt once when the question appears. Marks when it's been said. */
function useAsked(current: { signal: AbortSignal }, speech: readonly Item[]) {
  const voice = useVoice();
  const [ready, setReady] = useState(false);
  useEffect(() => { void voice.say(...speech).then(() => { if (!current.signal.aborted) setReady(true); }); }, []);
  return ready;
}

function Shell({ current, kind, text, speech, children, ready, onSay, fit }: { current: Current; kind: string; text: string; speech: readonly Item[]; children: ComponentChildren; ready: boolean; onSay?(): void; fit: number }) {
  const voice = useVoice();
  return (
    <div class={cls('game', 'se', kind)} data-ready={ready ? 'yes' : 'no'} style={{ '--fit': `${Math.round(fit)}` } as JSX.CSSProperties}>
      <div class="ask">
        <button class="say-btn" aria-label="Say it again" onClick={() => (onSay ? onSay() : void voice.say(...speech))}>🔊</button>
        <h2>{text}</h2>
        <button class="help-btn" aria-label="Help" onClick={() => current.actions.help(() => help(current.problem, current.signal))}>🔎</button>
      </div>
      <div class="se-body">{children}</div>
    </div>
  );
}

/** A tap that counts: the answer goes in only when the question is ready and not waiting on a lesson. */
function useSubmit(current: Current, waiting: boolean, ready: boolean) {
  const [right, setRight] = useState<string | null>(null);
  const can = ready && !waiting && !right && !current.actions.busy;
  function submit(answer: string) {
    if (!can) return null;
    const verdict = current.actions.submit(answer);
    if (verdict === 'correct') setRight(answer);
    else if (verdict === 'not-an-answer') sNope();
    return verdict;
  }
  return { can, right, submit };
}

const whistle = () => { tone(880, .18, 'square', 0, .06); tone(1175, .32, 'square', .16, .05); };

// ---------- Build the Train ----------

function OrderView({ current, q, waiting }: { current: Current; q: OrderQ; waiting: boolean }) {
  const s = sentence(q.s), voice = useVoice(), lesson = lessonFor(current.signal), right = piecesOf(s);
  const first = player.state.peek().learning.modes.order.level === 1 && player.state.peek().learning.pushed.order < 3;
  const speech: Item[] = ['Build the train!', s.text, ...(first ? ['Tap the cars in order.' as const] : [])];
  const ready = useAsked(current, speech), { can, right: done, submit } = useSubmit(current, waiting, ready);
  // his train: indexes into the yard, in the order he coupled them
  const [train, setTrain] = useState<number[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);
  const show = lesson.show.value, firstWrong = lesson.firstWrong.value, glow = lesson.glow.value;
  const mine = train.map(i => q.yard[i]!);
  // a fuller lesson lights the piece he needs next: the first wrong one on his train, or the next one in the yard
  const wrongAt = mine.findIndex((p, i) => p !== right[i]);
  const hintYard = glow !== null && wrongAt < 0 ? q.yard.findIndex((p, i) => p === right[train.length] && !train.includes(i)) : -1;
  const hintTrain = glow !== null && wrongAt >= 0 ? wrongAt : firstWrong;

  function couple(i: number) {
    if (!can || train.includes(i)) return;
    sClink();
    const next = [...train, i];
    setTrain(next);
    lesson.firstWrong.value = null;
    const p = q.yard[i]!;
    if (p.length > 1 || /[A-Za-z]/.test(p)) void voice.say(wordPhrase(p));
    if (next.length === q.yard.length) {
      const verdict = submit(trainKey(next.map(k => q.yard[k]!)));
      if (verdict === 'correct') whistle();
    }
  }
  function uncouple(at: number) {
    if (!can) return;
    sClink();
    setTrain(train.slice(0, at));
    lesson.firstWrong.value = null;
  }
  return (
    <Shell current={current} kind="order" text="Build the train!" speech={speech} ready={can} fit={fitOf(right) + right.length * 32}>
      {show?.kind === 'couple' && (
        <div class="se-train demo" aria-label="The right train">
          {right.slice(0, show.n).map((p, i) => <PieceButton key={i} role={roleAt(i, right.length)} text={p} label={p} class="show demo-piece" />)}
        </div>
      )}
      <div class={cls('se-track', done && 'chug')} ref={trackRef} role="group" aria-label="Your train">
        {right.map((_, k) => {
          const i = train[k], role = roleAt(k, right.length);
          if (i === undefined) return <span key={`gap${k}`} class={cls('piece', role, 'gap')} aria-hidden="true"><PieceArt role={role} text={right[k]!} empty /></span>;
          const p = q.yard[i]!;
          return <PieceButton key={`t${k}`} role={p === right[0] ? 'engine' : /^[.?!]$/.test(p) ? 'caboose' : 'car'} text={p} label={pieceLabel('car', p)} class={cls('on-train', hintTrain === k && 'lit')} idx={k} onTap={() => uncouple(k)} />;
        })}
      </div>
      <div class="se-yard" role="group" aria-label="The yard">
        {q.yard.map((p, i) => train.includes(i) ? <span key={i} class="piece spent" aria-hidden="true" /> : (
          <PieceButton key={i} role={p === capForm(s.words[0]!) && i === q.yard.indexOf(p) ? 'engine' : /^[.?!]$/.test(p) ? 'caboose' : 'car'} text={p} label={pieceLabel(/^[.?!]$/.test(p) ? 'caboose' : 'car', p)}
            class={cls('in-yard', hintYard === i && 'glow')} idx={i} onTap={() => couple(i)} drag={{ onDrop: () => couple(i), target: () => trackRef.current?.getBoundingClientRect() ?? null }} />
        ))}
      </div>
    </Shell>
  );
}

// ---------- Engine and Caboose ----------

function MarksView({ current, q, waiting }: { current: Current; q: MarksQ; waiting: boolean }) {
  const s = sentence(q.s), lesson = lessonFor(current.signal);
  const prompt: Phrase = q.form === 'engine' ? 'Which engine starts the sentence?' : q.form === 'caboose' ? 'Which caboose ends it?' : 'Which car goes here?';
  const speech: Item[] = q.form === 'engine' ? [prompt, s.text] : [s.text, prompt];
  const ready = useAsked(current, speech), { can, right, submit } = useSubmit(current, waiting, ready);
  const [wrong, setWrong] = useState<string[]>([]);
  const pieces = piecesOf(s), n = pieces.length, show = lesson.show.value, glow = lesson.glow.value;
  const tap = (c: string) => { if (wrong.includes(c)) return; const v = submit(c); if (v === 'incorrect') setWrong(w => [...w, c]); if (v === 'correct') whistle(); };
  const role: Role = q.form === 'engine' ? 'engine' : q.form === 'caboose' ? 'caboose' : 'car';
  return (
    <Shell current={current} kind="marks" text={prompt} speech={speech} ready={can} fit={fitOf(pieces)}>
      <div class={cls('se-train', right && 'chug')} role="group" aria-label="The train">
        {pieces.map((p, i) => {
          const r = roleAt(i, n), slot = i === q.slot;
          const fixed = slot && (right ?? (show?.kind === 'piece' ? show.fixed : undefined));
          if (slot && !fixed) return <span key={i} class={cls('piece', r, 'gap')} aria-label="Missing piece"><PieceArt role={r} text={p} empty /></span>;
          return <PieceButton key={i} role={r} text={fixed || (i === 0 && q.form !== 'engine' ? capForm(p) : p)} label={p} class={cls('show', slot && 'glow')} />;
        })}
      </div>
      <div class="se-choices pieces" role="group" aria-label="Answers">
        {q.choices.map(c => (
          <PieceButton key={c} role={role} text={c} label={pieceLabel(role, c)} onTap={() => tap(c)}
            class={cls('choice', wrong.includes(c) && 'wrong', right === c && 'right', glow === c && 'glow')} />
        ))}
      </div>
    </Shell>
  );
}

// ---------- What Happened and Who, What, Where ----------

/** The picture cards. */
function Pictures({ choices, onTap, wrong, right, glow, lit }: { choices: readonly PicChoice[]; onTap(k: string): void; wrong: readonly string[]; right: string | null; glow: string | null; lit: Lit; }) {
  return (
    <div class={cls('se-pics', `n${choices.length}`)} role="group" aria-label="Pictures">
      {choices.map((c, i) => {
        const isWho = !c.scene.rel && !c.scene.act && !c.scene.has && !c.scene.n && !c.scene.size;
        return (
          <button key={c.key} class={cls('pic-card', wrong.includes(c.key) && 'wrong', right === c.key && 'right', glow === c.key && 'hint')} aria-label={`Picture ${i + 1}`} data-key={c.key}
            onPointerUp={() => onTap(c.key)} onClick={e => e.preventDefault()}>
            {isWho ? <WhoPic who={c.scene.who} color={c.scene.color} /> : <ScenePic scene={c.scene} lit={glow === c.key || right === c.key ? lit : null} />}
          </button>
        );
      })}
    </div>
  );
}

function MeanView({ current, q, waiting }: { current: Current; q: MeanQ; waiting: boolean }) {
  const s = sentence(q.s), voice = useVoice(), lesson = lessonFor(current.signal);
  const speech: Item[] = ['Read it. Then tap its picture!'];
  const ready = useAsked(current, speech), { can, right, submit } = useSubmit(current, waiting, ready);
  const [wrong, setWrong] = useState<string[]>([]);
  const show = lesson.show.value, words = show?.kind === 'words' ? show : null;
  // this is the one kind he reads alone: hearing the sentence, or a word of it, counts as help
  const hear = (what: Phrase) => current.actions.help(async () => { await voice.say(what); });
  const tap = (k: string) => { if (wrong.includes(k)) return; const v = submit(k); if (v === 'incorrect') setWrong(w => [...w, k]); if (v === 'correct') whistle(); };
  return (
    <Shell current={current} kind="mean" text="Read it. Then tap its picture!" speech={speech} ready={can} onSay={() => hear(s.text)} fit={fitOf(piecesOf(s))}>
      <SentenceTrain s={s} lit={words?.idx} onWord={i => hear(wordPhrase(s.words[i]!))} />
      <Pictures choices={q.choices} onTap={tap} wrong={wrong} right={right} glow={lesson.glow.value ?? (words ? q.answer : null)} lit={words?.lit ?? 'all'} />
    </Shell>
  );
}

function AskView({ current, q, waiting }: { current: Current; q: AskQ; waiting: boolean }) {
  const s = sentence(q.s), o = q.other !== null ? sentence(q.other) : null, lesson = lessonFor(current.signal), voice = useVoice();
  const both = o ? (q.otherFirst ? [o, s] : [s, o]) : [s];
  const speech: Item[] = [...both.map(x => x.text), q.q as Phrase];
  const ready = useAsked(current, speech), { can, right, submit } = useSubmit(current, waiting, ready);
  const [wrong, setWrong] = useState<string[]>([]);
  const show = lesson.show.value, words = show?.kind === 'words' ? show : null;
  const tap = (k: string) => { if (wrong.includes(k)) return; const v = submit(k); if (v === 'incorrect') setWrong(w => [...w, k]); if (v === 'correct') whistle(); };
  return (
    <Shell current={current} kind="ask" text={q.q} speech={speech} ready={can} fit={fitOf(...both.map(piecesOf))}>
      <div class="se-sentences">
        {both.map(x => <SentenceTrain key={x.id} s={x} lit={words && words.s === x.id ? words.idx : undefined} onWord={i => void voice.say(wordPhrase(x.words[i]!))} />)}
      </div>
      <Pictures choices={q.choices} onTap={tap} wrong={wrong} right={right} glow={lesson.glow.value ?? (words ? q.answer : null)} lit={words?.lit ?? 'all'} />
    </Shell>
  );
}

// ---------- Fix the Train ----------

function FixView({ current, q, waiting }: { current: Current; q: FixQ; waiting: boolean }) {
  const s = sentence(q.s), lesson = lessonFor(current.signal);
  const speech: Item[] = ['Find the mistake! Tap the car that is wrong.', s.text];
  const ready = useAsked(current, speech), { can, right, submit } = useSubmit(current, waiting, ready);
  const voice = useVoice();
  const [found, setFound] = useState<number | null>(null), [after, setAfter] = useState<{ cars: string[]; caboose: string } | null>(null);
  const n = q.cars.length, show = lesson.show.value, glow = lesson.glow.value;
  const litIdx = show?.kind === 'piece' ? show.idx : glow !== null ? Number(glow) : null;
  useEffect(() => { if (waiting) setFound(null); }, [waiting]);

  function finish(answer: string, fixed: { cars: string[]; caboose: string } | null) {
    const v = submit(answer);
    if (v === 'correct') { whistle(); setAfter(fixed); }
    setFound(null);
  }
  function tapCar(i: number) {
    if (!can) return;
    if (found !== null && q.mistake === 'swap') {
      if (i === found) { setFound(null); return; }
      const cars = [...q.cars]; [cars[found], cars[i]] = [cars[i]!, cars[found]!];
      finish(`${found}:${i}`, { cars, caboose: q.caboose });
      return;
    }
    if (!q.bad.includes(i)) { submit(`${i}`); return; }
    // he found it: now the fix
    sClink();
    setFound(i);
    void voice.say(q.mistake === 'capital' ? 'Tap to give it a capital!' : q.mistake === 'mark' ? 'Which caboose goes here?' : q.mistake === 'swap' ? 'Now tap where it goes!' : 'Tap to take it off!');
  }
  const cars = after?.cars ?? q.cars, caboose = after?.caboose ?? q.caboose;
  return (
    <Shell current={current} kind="fix" text="Find the mistake!" speech={speech} ready={can} fit={fitOf([...q.cars, q.caboose])}>
      <div class={cls('se-train', right && 'chug')} role="group" aria-label="The train">
        {cars.map((c, i) => (
          <PieceButton key={`${i}${c}`} role={i === 0 ? 'engine' : 'car'} text={c} label={pieceLabel(i === 0 ? 'engine' : 'car', c)} idx={i} onTap={() => tapCar(i)}
            class={cls('fixable', found === i && 'found', litIdx === i && 'lit', found !== null && q.mistake === 'swap' && found !== i && 'target')} />
        ))}
        <PieceButton role="caboose" text={caboose} label={pieceLabel('caboose', caboose)} idx={n} onTap={() => tapCar(n)} class={cls('fixable', found === n && 'found', litIdx === n && 'lit')} />
      </div>
      {found !== null && q.mistake === 'capital' && (
        <div class="se-fix"><button class="big-btn go fix-btn pulse" aria-label="Give it a capital" onPointerUp={() => { const fixed = [...q.cars]; fixed[found] = capForm(fixed[found]!); finish(`${found}:cap`, { cars: fixed, caboose: q.caboose }); }}>
          <span class="cap-a">{midForm(q.cars[found]!).charAt(0).toLowerCase()}</span><span aria-hidden="true">→</span><span class="cap-b">{q.cars[found]!.charAt(0).toUpperCase()}</span>
        </button></div>
      )}
      {found !== null && q.mistake === 'extra' && (
        <div class="se-fix"><button class="big-btn go fix-btn pulse" aria-label="Take it off" onPointerUp={() => { const fixed = q.cars.filter((_, k) => k !== found); finish(`${found}:off`, { cars: fixed, caboose: q.caboose }); }}>✋ Take it off</button></div>
      )}
      {found !== null && q.mistake === 'mark' && (
        <div class="se-choices pieces" role="group" aria-label="Cabooses">
          {q.fixes.map(m => <PieceButton key={m} role="caboose" text={m} label={pieceLabel('caboose', m)} class="choice" onTap={() => finish(`${n}:${m}`, { cars: [...q.cars], caboose: m })} />)}
        </div>
      )}
    </Shell>
  );
}

// ---------- the question ----------

export function QuestionView({ current, waiting }: { current: Current; waiting: boolean }) {
  const q = current.problem.q;
  if (q.kind === 'order') return <OrderView current={current} q={q} waiting={waiting} />;
  if (q.kind === 'marks') return <MarksView current={current} q={q} waiting={waiting} />;
  if (q.kind === 'mean') return <MeanView current={current} q={q} waiting={waiting} />;
  if (q.kind === 'ask') return <AskView current={current} q={q} waiting={waiting} />;
  return <FixView current={current} q={q} waiting={waiting} />;
}
export type { Lesson };
