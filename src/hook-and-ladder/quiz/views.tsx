// The questions on screen. Every word he sees is in Andika (the school font) on a cream tile, and every word is also said: the
// prompt as it appears, then each choice in turn, lit while it's read (the skill here is meaning, not reading, so he never has to
// decode a choice alone). 🔊 says it all again; taps wait until it has been said. A miss is never marked with a red X: the round
// engine runs the lesson (quiz/teach.ts), which plays on the words and pictures themselves.
import { useEffect, useRef, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { sClink, sNope } from '../../audio/sfx';
import type { ProblemInstance } from '../../learning/round';
import type { Asking } from '../mix';
import { moreAsk, mostAsk, sortAsk, wordPhrase, type Phrase } from '../phrases';
import { speaking, useVoice, type Item } from '../voice';
import { FRAMES } from '../words/endings';
import { picOf } from '../words/pictures';
import { FACTS, GROUPS, type GroupId } from '../words/sorting';
import { SCALES } from '../words/strong';
import { compound, opposite, SEP, type EndQ, type JoinQ, type OppQ, type SortQ, type StrongQ } from './problems';
import { help, lessonFor } from './teach';

type Current = ProblemInstance<Asking, string>;
const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');
const w = wordPhrase;

// ---------- pieces ----------

/** A word's picture: its emoji, or for big and little the same thing drawn big or small, or `n` of a thing. */
function Pic({ word, n = 1, size }: { word: string; n?: number; size?: 'big' | 'small' }) {
  if (word === 'big' || word === 'little') return <span class={`pic emo ${word === 'big' ? 'pic-big' : 'pic-little'}`} aria-hidden="true">🐘</span>;
  const p = picOf(word);
  if (!p) return null;
  return <span class={cls('pic', 'emo', size && `pic-${size}`, n > 1 && `many n${n}`)} aria-hidden="true">{Array.from({ length: n }, (_, i) => <span key={i}>{p}</span>)}</span>;
}

/** A word on a tile, in the school font. */
const Word = ({ text, class: c }: { text: string; class?: string }) => <span class={cls('word', c)}>{text}</span>;

/** Says the prompt (and then reads the choices, each lit as it's said) once when the question appears. Marks when it's been said. */
function useAsked(current: { signal: AbortSignal }, speech: readonly Item[]) {
  const voice = useVoice();
  const [ready, setReady] = useState(false);
  useEffect(() => { void voice.say(...speech).then(() => { if (!current.signal.aborted) setReady(true); }); }, []);
  return ready;
}
/** The choices read out, each lighting its button. */
const readOut = (choices: readonly string[]): Item[] => choices.map(c => ({ parts: [w(c)], light: c }));
const isLit = (key: string) => speaking.value === key;

function Shell({ current, kind, text, speech, children, ready }: { current: Current; kind: string; text: ComponentChildren; speech: readonly Item[]; children: ComponentChildren; ready: boolean }) {
  const voice = useVoice();
  return (
    // the kind and form go on as q-join, q-pic: bare, they matched rules meant for other things (.pic, .sentence, and the shared .fact,
    // which turned the "Which animal can fly?" card yellow and boxed)
    <div class={cls('game', 'hl', ...kind.split(' ').map(k => `q-${k}`))} data-ready={ready ? 'yes' : 'no'}>
      <div class="ask">
        <button class="say-btn" aria-label="Say it again" onClick={() => void voice.say(...speech)}>🔊</button>
        <h2>{text}</h2>
        <button class="help-btn" aria-label="Help" onClick={() => current.actions.help(() => help(current.problem, current.signal))}>🔎</button>
      </div>
      <div class="hl-body">{children}</div>
    </div>
  );
}

/** A tap that counts: the answer goes in only when the question is ready and not waiting on a lesson. */
function useSubmit(current: Current, waiting: boolean, ready: boolean) {
  const [right, setRight] = useState<string | null>(null), [wrong, setWrong] = useState<string[]>([]);
  const can = ready && !waiting && !right && !current.actions.busy;
  function submit(answer: string) {
    if (!can) return null;
    const verdict = current.actions.submit(answer);
    if (verdict === 'correct') setRight(answer);
    else if (verdict === 'incorrect') setWrong(ws => [...ws, answer]);
    else if (verdict === 'not-an-answer') sNope();
    return verdict;
  }
  return { can, right, wrong, submit };
}

/** State whose newest value a tap can read even before the view has redrawn: two quick taps (or a tap on ✓ straight after a pick)
 *  on a busy iPad can both land on the same render, and building the next value from that render loses the first tap. */
function useLive<T>(initial: T): [T, () => T, (next: T) => void] {
  const [value, setValue] = useState(initial), live = useRef(value);
  return [value, () => live.current, next => { live.current = next; setValue(next); }];
}

/** A row of choices: words on tiles, or pictures with their words under them. */
function Choices({ choices, pics, onTap, right, wrong, glow, label = 'Answers' }: { choices: readonly string[]; pics?: boolean; onTap(c: string): void; right: string | null; wrong: readonly string[]; glow: string | null; label?: string }) {
  return (
    <div class={cls('hl-choices', pics && 'pics', `n${choices.length}`)} role="group" aria-label={label}>
      {choices.map(c => (
        <button key={c} class={cls('choice', 'hl-choice', pics && 'pic-choice', wrong.includes(c) && 'wrong', right === c && 'right', glow === c && 'hint', isLit(c) && 'speaking')}
          aria-label={c} data-key={c} onPointerUp={() => onTap(c)} onClick={e => e.preventDefault()}>
          {pics && <Pic word={c} />}
          <Word text={c} />
        </button>
      ))}
    </div>
  );
}

// ---------- Two Words, One Word ----------

function JoinView({ current, q, waiting }: { current: Current; q: JoinQ; waiting: boolean }) {
  const c = compound(q.word), lesson = lessonFor(current.signal), show = lesson.show.value, glow = lesson.glow.value;
  const speech: Item[] = q.form === 'pic' ? [w(c.a), w(c.b), 'What word do they make?', ...readOut(q.choices)]
    : q.form === 'split' ? ['Tap where it splits into two words!', w(q.word)]
    : [w(q.a), 'and what makes a real word?', ...readOut(q.choices)];
  const ready = useAsked(current, speech), { right, wrong, submit } = useSubmit(current, waiting, ready);
  const joined = (show?.kind === 'join' && show.joined) || !!right;
  const tried = show?.kind === 'join' ? show.tried : undefined;
  const ref = useRef<HTMLButtonElement>(null), [hover, setHover] = useState<number | null>(null);

  if (q.form === 'split') {
    const at = (x: number) => {
      const letters = ref.current?.querySelectorAll('.letter');
      if (!letters?.length) return null;
      // the gap nearest the finger
      let best = 1, d = Infinity;
      letters.forEach((el, i) => { if (i === 0) return; const r = el.getBoundingClientRect(), dd = Math.abs(r.left - x); if (dd < d) { d = dd; best = i; } });
      return best;
    };
    const split = right ? Number(right) : show?.kind === 'join' && show.joined ? c.a.length : null;
    return (
      <Shell current={current} kind="join split" text="Tap where it splits!" speech={speech} ready={ready && !waiting}>
        <button ref={ref} class={cls('split-word', split !== null && 'apart', glow && 'hint')} aria-label={`Split ${q.word}`} data-word={q.word}
          onPointerMove={e => setHover(at(e.clientX))} onPointerLeave={() => setHover(null)}
          onPointerUp={e => { const g = at(e.clientX); if (g !== null) { sClink(); submit(`${g}`); } }} onClick={e => e.preventDefault()}>
          {[...q.word].map((ch, i) => (
            <span key={i} class={cls('letter', i === split && 'cut', i === hover && split === null && 'hover', wrong.includes(`${i}`) && 'tried')}>{ch}</span>
          ))}
        </button>
        {split !== null && <div class="split-halves"><Word text={c.a} /><span class="plus">+</span><Word text={c.b} /></div>}
      </Shell>
    );
  }
  if (q.form === 'half') {
    const second = right ?? (joined ? c.b : tried ?? null);
    return (
      <Shell current={current} kind="join half" text={<><Word text={q.a} /> + ?</>} speech={speech} ready={ready && !waiting}>
        <div class={cls('join-eq', joined && 'joined')}>
          <Word text={q.a} class="half" /><span class="plus">+</span><Word text={second ?? '?'} class={cls('half', !second && 'blank', tried && !joined && 'tried')} />
          {joined && <><span class="eq">=</span><span class="made"><Pic word={c.word} /><Word text={c.word} /></span></>}
        </div>
        <Choices choices={q.choices} onTap={x => submit(x)} right={right} wrong={wrong} glow={glow} />
      </Shell>
    );
  }
  return (
    <Shell current={current} kind="join pic" text="What word do they make?" speech={speech} ready={ready && !waiting}>
      <div class={cls('join-eq', show?.kind === 'join' && 'sliding', joined && 'joined')}>
        <span class="half-card"><Pic word={c.a} /><Word text={c.a} /></span><span class="plus">+</span><span class="half-card"><Pic word={c.b} /><Word text={c.b} /></span>
        {joined && <><span class="eq">=</span><span class="made"><Pic word={c.word} /><Word text={c.word} /></span></>}
      </div>
      <Choices choices={q.choices} pics onTap={x => submit(x)} right={right} wrong={wrong} glow={glow} label="Pictures" />
    </Shell>
  );
}

// ---------- Opposites ----------

/** Level 3: "The towel is not wet. It is... Tap the opposite of wet." Without the last part soft, dirty or long would be true too. */
export const oppSentenceAsk = (say: Phrase, word: string, choices: readonly string[]): Item[] => [say, 'It is...', 'Tap the opposite of', w(word), ...readOut(choices)];

function OppView({ current, q, waiting }: { current: Current; q: OppQ; waiting: boolean }) {
  const o = opposite(q.word), lesson = lessonFor(current.signal), show = lesson.show.value, glow = lesson.glow.value;
  const say = 'say' in o ? o.say : undefined;
  const speech: Item[] = q.form === 'pic' ? ['Tap the opposite of', w(q.word), ...readOut(q.choices)]
    : q.form === 'say' ? ['What is the opposite of', w(q.word), ...readOut(q.choices)]
    : oppSentenceAsk(say as Phrase, q.word, q.choices);
  const ready = useAsked(current, speech), { right, wrong, submit } = useSubmit(current, waiting, ready);
  const pair = show?.kind === 'pair' || !!right;
  return (
    <Shell current={current} kind={`opp ${q.form}`} text={q.form === 'sentence' ? <><span class="sentence">{say} It is ___.</span></> : <>The opposite of <Word text={q.word} /></>} speech={speech} ready={ready && !waiting}>
      <div class={cls('opp-pair', pair && 'shown')}>
        <span class="opp-card">{q.form === 'pic' && <Pic word={q.word} />}<Word text={q.word} /></span>
        {pair && <><span class="vs" aria-hidden="true">↔</span><span class="opp-card other">{q.form !== 'sentence' && <Pic word={q.answer} />}<Word text={q.answer} /></span></>}
      </div>
      <Choices choices={q.choices} pics={q.form === 'pic'} onTap={x => submit(x)} right={right} wrong={wrong} glow={glow} label={q.form === 'pic' ? 'Pictures' : 'Answers'} />
    </Shell>
  );
}

// ---------- Sort It ----------

const groupName = (g: GroupId) => GROUPS[g].plural;

function SortView({ current, q, waiting }: { current: Current; q: SortQ; waiting: boolean }) {
  const lesson = lessonFor(current.signal), show = lesson.show.value, glow = lesson.glow.value;
  const speech: Item[] = q.form === 'all' ? [sortAsk(q.group), 'Then tap the check!']
    : q.form === 'odd' ? ['Which one does not belong?', ...readOut(q.items)]
    : q.form === 'name' ? [w(q.items[0]!), w(q.items[1]!), 'and', w(q.items[2]!), 'are all...', ...q.choices.map(g => ({ parts: [w(groupName(g))], light: g }))]
    : [FACTS[q.fact]!.ask as Phrase, ...readOut(q.choices)];
  const ready = useAsked(current, speech), { can, right, wrong, submit } = useSubmit(current, waiting, ready);
  const [picked, livePicked, setPicked] = useLive<string[]>([]);
  const box = show?.kind === 'box' ? show.items : null;
  useEffect(() => { if (waiting) setPicked([]); }, [waiting]);

  if (q.form === 'all') {
    const toggle = (x: string) => { if (!can) return; sClink(); const p = livePicked(); setPicked(p.includes(x) ? p.filter(y => y !== x) : [...p, x]); };
    return (
      <Shell current={current} kind="sort all" text={<>Tap all the {groupName(q.group)}!</>} speech={speech} ready={ready && !waiting}>
        {box && <div class="sort-box" aria-label={groupName(q.group)}>{box.map(x => <span key={x} class="boxed"><Pic word={x} /></span>)}</div>}
        <div class="hl-choices pics n6 grid3" role="group" aria-label="Pictures">
          {q.items.map(x => (
            <button key={x} class={cls('choice', 'hl-choice', 'pic-choice', picked.includes(x) && 'picked', box?.includes(x) && 'in-box', right && q.answer.split(SEP).includes(x) && 'right', glow && q.answer.split(SEP).includes(x) && 'hint')}
              aria-label={x} aria-pressed={picked.includes(x)} data-key={x} onPointerUp={() => toggle(x)} onClick={e => e.preventDefault()}>
              <Pic word={x} /><Word text={x} />
            </button>
          ))}
        </div>
        <button class={cls('big-btn', 'go', 'check-btn', picked.length > 0 && can && 'pulse')} aria-label="Check" disabled={!picked.length} onPointerUp={() => { const p = livePicked(); if (p.length) submit([...p].sort().join(SEP)); }} onClick={e => e.preventDefault()}>✓</button>
      </Shell>
    );
  }
  if (q.form === 'odd') {
    return (
      <Shell current={current} kind="sort odd" text="Which one does not belong?" speech={speech} ready={ready && !waiting}>
        {box && <div class="sort-box" aria-label={groupName(q.group)}>{box.map(x => <span key={x} class="boxed"><Pic word={x} /></span>)}</div>}
        <Choices choices={q.items} pics onTap={x => submit(x)} right={right} wrong={wrong} glow={glow} label="Pictures" />
      </Shell>
    );
  }
  if (q.form === 'name') {
    return (
      <Shell current={current} kind="sort name" text="They are all..." speech={speech} ready={ready && !waiting}>
        <div class={cls('sort-three', box && 'boxed-all')}>{q.items.map(x => <span key={x} class="three-card"><Pic word={x} /><Word text={x} /></span>)}</div>
        <div class="hl-choices n3" role="group" aria-label="Answers">
          {q.choices.map(g => (
            <button key={g} class={cls('choice', 'hl-choice', wrong.includes(g) && 'wrong', right === g && 'right', glow === g && 'hint', isLit(g) && 'speaking')} aria-label={groupName(g)} data-key={g}
              onPointerUp={() => submit(g)} onClick={e => e.preventDefault()}><Word text={groupName(g)} /></button>
          ))}
        </div>
      </Shell>
    );
  }
  return (
    <Shell current={current} kind="sort fact" text={FACTS[q.fact]!.ask} speech={speech} ready={ready && !waiting}>
      <Choices choices={q.choices} pics onTap={x => submit(x)} right={right} wrong={wrong} glow={glow} label="Pictures" />
    </Shell>
  );
}

// ---------- Endings ----------

function EndView({ current, q, waiting }: { current: Current; q: EndQ; waiting: boolean }) {
  const lesson = lessonFor(current.signal), show = lesson.show.value, glow = lesson.glow.value;
  const frame = q.form === 'frame' ? FRAMES[q.frame]! : null;
  const speech: Item[] = q.form === 'count' ? ['Tap the word that matches the picture!', ...readOut(q.choices)]
    : q.form === 'frame' ? [frame!.start, 'Which word fits?', ...readOut(q.choices)]
    : ['Which word is hiding in', w(q.shown), ...readOut(q.choices)];
  const ready = useAsked(current, speech), { right, wrong, submit } = useSubmit(current, waiting, ready);
  const ending = show?.kind === 'ending' ? show : null;
  const end = q.form === 'hide' ? q.ending : q.answer.slice(q.word.length);
  const tiles = ending && (
    <div class={cls('end-tiles', ending.on && 'on')} aria-label={q.form === 'hide' ? q.shown : q.answer}>
      <Word text={q.word} class="root" />{end && <Word text={`${end}`} class="end-tile" />}
      {ending.on && q.form === 'frame' && <span class="when" aria-hidden="true">{end === 'ed' ? '✅' : end === 'ing' ? '▶️' : '📅'}</span>}
    </div>
  );
  if (q.form === 'count') {
    return (
      <Shell current={current} kind="ending count" text="Which word matches?" speech={speech} ready={ready && !waiting}>
        <div class="count-pic"><Pic word={q.word} n={q.n} /></div>
        {tiles}
        <Choices choices={q.choices} onTap={x => submit(x)} right={right} wrong={wrong} glow={glow} />
      </Shell>
    );
  }
  if (q.form === 'frame') {
    return (
      <Shell current={current} kind="ending frame" text={<span class="sentence">{frame!.start} <span class="blank">{right ?? (ending?.on ? q.answer : '___')}</span>.</span>} speech={speech} ready={ready && !waiting}>
        {tiles}
        <Choices choices={q.choices} onTap={x => submit(x)} right={right} wrong={wrong} glow={glow} />
      </Shell>
    );
  }
  return (
    <Shell current={current} kind="ending hide" text={<>Which word is hiding in <Word text={q.shown} />?</>} speech={speech} ready={ready && !waiting}>
      <div class="hide-word">{ending?.on ? tiles : <Word text={q.shown} class="big" />}</div>
      <Choices choices={q.choices} onTap={x => submit(x)} right={right} wrong={wrong} glow={glow} />
    </Shell>
  );
}

// ---------- Strong Words ----------

function StrongView({ current, q, waiting }: { current: Current; q: StrongQ; waiting: boolean }) {
  const lesson = lessonFor(current.signal), show = lesson.show.value, glow = lesson.glow.value;
  const scale = q.form === 'pair' ? null : SCALES[q.scale]!;
  const speech: Item[] = q.form === 'pair' ? [moreAsk(q.more), ...readOut([q.words[0]!]), 'or', ...readOut([q.words[1]!])]
    : q.form === 'most' ? [mostAsk(scale!.most), ...readOut(q.words.slice(0, 2)), 'or', ...readOut(q.words.slice(2))]
    : [scale!.order as Phrase, ...readOut(q.words)];
  const ready = useAsked(current, speech), { can, right, wrong, submit } = useSubmit(current, waiting, ready);
  const [order, liveOrder, setOrder] = useLive<string[]>([]);
  useEffect(() => { if (waiting) setOrder([]); }, [waiting]);
  const barShow = show?.kind === 'bar' ? show : null;
  const barEl = barShow && (
    <div class="strong-bar" aria-label="From a little to a lot">
      <span class="bar-grow" aria-hidden="true" />
      {barShow.words.map((x, i) => <span key={x} class={cls('bar-word', i < barShow.n && 'on', `s${barShow.words.length === 2 ? i * 2 : i}`)}><Word text={x} /></span>)}
    </div>
  );
  if (q.form === 'order') {
    const place = (x: string) => {
      const now = liveOrder();
      if (!can || now.includes(x) || now.length >= q.words.length) return;
      sClink();
      const next = [...now, x];
      setOrder(next);
      if (next.length === q.words.length) submit(next.join(SEP));
    };
    return (
      <Shell current={current} kind="strong order" text="From a little to a lot!" speech={speech} ready={ready && !waiting}>
        {barEl}
        <div class="order-slots" aria-label="Your order">
          {q.words.map((_, i) => <span key={i} class={cls('slot', `s${i}`, order[i] && 'full', right && 'right')}>{order[i] ? <Word text={order[i]!} /> : <span class="slot-n">{i + 1}</span>}</span>)}
        </div>
        <div class="hl-choices n3" role="group" aria-label="Words">
          {q.words.map(x => (
            <button key={x} class={cls('choice', 'hl-choice', order.includes(x) && 'used', isLit(x) && 'speaking')} aria-label={x} data-key={x} disabled={order.includes(x)}
              onPointerUp={() => place(x)} onClick={e => e.preventDefault()}><Word text={x} /></button>
          ))}
        </div>
        {/* always laid out, only shown once there's something to undo: appearing under his finger, it moved the words, and the click
            from the very tap that placed the first word landed on it and took the word away again */}
        <button class={cls('undo-btn', !(order.length > 0 && !right && can) && 'off')} aria-label="Start again" disabled={!(order.length > 0 && !right && can)}
          onPointerUp={() => { if (liveOrder().length && can) setOrder([]); }} onClick={e => e.preventDefault()}>↺</button>
      </Shell>
    );
  }
  return (
    <Shell current={current} kind={`strong ${q.form}`} text={q.form === 'pair' ? <>Which is {q.more}?</> : <>Which is the {scale!.most}?</>} speech={speech} ready={ready && !waiting}>
      {barEl}
      <Choices choices={q.words} onTap={x => submit(x)} right={right} wrong={wrong} glow={glow} />
    </Shell>
  );
}

// ---------- the question ----------

export function QuestionView({ current, waiting }: { current: Current; waiting: boolean }) {
  const q = current.problem.q;
  if (q.kind === 'join') return <JoinView current={current} q={q} waiting={waiting} />;
  if (q.kind === 'opposite') return <OppView current={current} q={q} waiting={waiting} />;
  if (q.kind === 'sort') return <SortView current={current} q={q} waiting={waiting} />;
  if (q.kind === 'ending') return <EndView current={current} q={q} waiting={waiting} />;
  return <StrongView current={current} q={q} waiting={waiting} />;
}
