// The questions on screen. The word is said as the question appears (🔊, or tapping the picture, says it again, as often as he likes,
// with no penalty), and taps wait until it has been said. The word is never written until he has built it: what's on screen is its
// sound boxes, one per sound, with a magic e's box linked to its vowel's. Tiles are lowercase Andika and only ever slide, never turn
// or flip, so a b is never a d. A miss is never marked with a red X: a wrong tile wobbles back to the rack, and the lesson
// (spelling/teach.ts) plays on the boxes themselves.
import { useEffect, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { sClink, sNope } from '../audio/sfx';
import type { ProblemInstance } from '../learning/round';
import { DIGRAPHS, infoOf, isVowelSound, PICTURES, R_VOWELS, TEAMS, type Word } from '../dino-dig/words/list';
import type { Asking, Problem } from './mix';
import { PATTERN_LINES, slowly, type Phrase } from './phrases';
import { inPhrase, type BuildQ, type ChunkQ, type FixQ, type GapQ, type MeetQ, type PickQ } from './spelling/problems';
import { help, lessonFor, sweep, type Lesson } from './spelling/teach';
import { boxesOf, shown, tileText } from './spelling/words';
import { useVoice, type Item } from './voice';

type Current<P = Problem> = ProblemInstance<P, string>;
const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');

// ---------- the sound boxes ----------

/** One box: its letter cells (null: empty), and whether it's a magic-e vowel (its e sits in the linked box at the end). */
export interface FrameBox { cells: (string | null)[]; magic?: boolean; class?: string; key?: string }

/** A word's sound boxes. `eCell`: the magic e's own little box at the end (undefined: the word has none). */
export function Frame({ boxes, eCell, lit, onTap, label, size }: {
  boxes: readonly FrameBox[]; eCell?: string | null; lit?: number | null; onTap?(i: number): void; label: string; size?: string;
}) {
  const magicAt = boxes.findIndex(b => b.magic);
  const box = (b: FrameBox, i: number) => {
    const inner = b.cells.map((c, j) => <span key={j} class={cls('cell', c === null && 'empty')}><span class="ch">{c ?? ''}</span></span>);
    const c = cls('sbox', b.magic && 'magic', lit === i && 'lit', b.cells.every(x => x !== null) && 'full', b.class);
    return onTap
      ? <button key={b.key ?? i} class={c} aria-label={`Box ${i + 1}${b.cells.every(x => x !== null) ? `: ${b.cells.join('')}` : ''}`} onClick={() => onTap(i)}>{inner}</button>
      : <span key={b.key ?? i} class={c}>{inner}</span>;
  };
  return (
    <div class={cls('frame', size)} role="group" aria-label={label}>
      {boxes.map(box)}
      {eCell !== undefined && (
        <span class={cls('sbox', 'magic', 'ebox', lit === magicAt && 'lit', eCell !== null && 'full')} aria-label="The magic e">
          <span class="spark" aria-hidden="true">✨</span>
          <span class={cls('cell', eCell === null && 'empty')}><span class="ch">{eCell ?? ''}</span></span>
        </span>
      )}
    </div>
  );
}

/** The boxes for a word with these letters placed so far (Build It), or all of it (`full`). */
export function letterBoxes(w: Word, placed: readonly string[]): { boxes: FrameBox[]; eCell?: string | null } {
  const { sounds } = infoOf(w), bx = boxesOf(sounds), magic = sounds.some(s => s.endsWith('_e'));
  const at = (i: number) => placed[i] ?? null;
  return {
    boxes: bx.map(b => ({ cells: (b.spelling.endsWith('_e') ? b.letters.slice(0, -1) : b.letters).map(at), magic: b.spelling.endsWith('_e') })),
    eCell: magic ? at(w.length - 1) : undefined,
  };
}
/** The boxes for these parts (Chunks, Fix It), with what's in each (null: empty). */
export function partBoxes(parts: readonly string[], content: readonly (string | null)[]): { boxes: FrameBox[]; eCell?: string | null } {
  const magicAt = parts.findIndex(p => p.endsWith('_e'));
  return {
    boxes: parts.map((p, i) => { const c = content[i]; return { cells: c === null || c === undefined ? [...shown(p)].map(() => null) : [...shown(c)], magic: p.endsWith('_e') }; }),
    eCell: magicAt < 0 ? undefined : content[magicAt] ? 'e' : null,
  };
}

/** The right word in its boxes, under a wrong spelling, while a lesson shows it. */
function RightWord({ w, lesson }: { w: Word; lesson: Lesson }) {
  if (!lesson.right.value) return null;
  return <div class="right-word"><Frame {...letterBoxes(w, [...w])} lit={lesson.lit.value} label={`It is spelled ${w}`} size="small" /></div>;
}

// ---------- tiles ----------

/** A row of tiles to tap. A wrong one wobbles (sideways only); a used one leaves a gap. */
function Rack({ tiles, used = [], wrong = [], glow, shake, onTap, kind }: {
  tiles: readonly string[]; used?: readonly number[]; wrong?: readonly number[]; glow?: string | null; shake?: number | null; onTap(i: number): void; kind: string;
}) {
  return (
    <div class={cls('rack', kind)} role="group" aria-label="Tiles">
      {tiles.map((t, i) => (
        <button key={i} class={cls('ltile', t.length > 1 && 'wide', used.includes(i) && 'used', wrong.includes(i) && 'wrong', glow === t && !used.includes(i) && 'hint', shake === i && 'wobble')}
          aria-label={tileText(t)} data-tile={t} disabled={used.includes(i)} onClick={() => onTap(i)}>
          <span class="ch">{tileText(t).replace('_', '‿')}</span>
        </button>
      ))}
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

function Shell({ current, kind, text, speech, word, stage, children, ready }: {
  current: Current<Asking>; kind: string; text: string; speech: readonly Item[]; word: Word; stage?: ComponentChildren; children: ComponentChildren; ready: boolean;
}) {
  const voice = useVoice(), pic = PICTURES[word];
  return (
    <div class={cls('game', 'ww', kind)} data-ready={ready ? 'yes' : 'no'}>
      <div class="ask">
        <button class="say-btn" aria-label="Say it again" onClick={() => void voice.say(...speech)}>🔊</button>
        <h2>{text}</h2>
        <button class="help-btn" aria-label="Help" onClick={() => current.actions.help(() => help(current.problem, current.signal))}>🔎</button>
      </div>
      <div class="ww-body">
        <div class="ww-stage">
          {stage ?? (
            <button class={cls('hear', pic ? 'pic' : 'ear')} aria-label={`Hear the word again`} onClick={() => void voice.say(word)}>
              <span class="hear-art" aria-hidden="true">{pic ?? '👂'}</span><span class="hear-say" aria-hidden="true">🔊</span>
            </button>
          )}
        </div>
        <div class="ww-work">{children}</div>
      </div>
    </div>
  );
}

const done = (current: Current<Asking>, waiting: boolean, ready: boolean) => ready && !waiting && !current.actions.busy;

// ---------- Build It ----------

function BuildView({ current, q, waiting }: { current: Current<Asking>; q: BuildQ; waiting: boolean }) {
  const lesson = lessonFor(current.signal), w = q.word, speech: Item[] = ['Build the word', w];
  const ready = useAsked(current, speech), [shake, setShake] = useState<number | null>(null);
  const placed = lesson.placed.value, used = lesson.used.value;
  function tap(i: number) {
    if (!done(current, waiting, ready) || used.includes(i)) return;
    const next = [...placed, q.tiles[i]!].join(''), verdict = current.actions.submit(next);
    if (verdict === 'correct' || verdict === 'not-an-answer') {
      lesson.placed.value = [...placed, q.tiles[i]!]; lesson.used.value = [...used, i]; lesson.glow.value = null; sClink();
    } else if (verdict === 'incorrect') { setShake(i); setTimeout(() => setShake(null), 500); }
  }
  return (
    <Shell current={current} kind="build" text="Build the word" speech={speech} word={w} ready={ready && !waiting}>
      <Frame {...letterBoxes(w, placed)} lit={lesson.lit.value} label="The word's sound boxes" />
      <Rack tiles={q.tiles} used={used} glow={lesson.glow.value} shake={shake} onTap={tap} kind="letters" />
    </Shell>
  );
}

// ---------- Chunks ----------

function ChunkView({ current, q, waiting }: { current: Current<Asking>; q: ChunkQ; waiting: boolean }) {
  const lesson = lessonFor(current.signal), w = q.word, speech: Item[] = ['Use the chunks to build', w];
  const ready = useAsked(current, speech), [shake, setShake] = useState<number | null>(null);
  const placed = lesson.placed.value, used = lesson.used.value;
  function tap(i: number) {
    if (!done(current, waiting, ready) || used.includes(i)) return;
    const verdict = current.actions.submit([...placed, q.tiles[i]!].join('|'));
    if (verdict === 'correct' || verdict === 'not-an-answer') {
      lesson.placed.value = [...placed, q.tiles[i]!]; lesson.used.value = [...used, i]; lesson.glow.value = null; sClink();
    } else if (verdict === 'incorrect') { setShake(i); setTimeout(() => setShake(null), 500); }
  }
  return (
    <Shell current={current} kind="chunk" text="Use the chunks" speech={speech} word={w} ready={ready && !waiting}>
      <Frame {...partBoxes(q.parts, q.parts.map((_, k) => placed[k] ?? null))} lit={lesson.lit.value} label="The word's chunk boxes" />
      <Rack tiles={q.tiles} used={used} glow={lesson.glow.value} shake={shake} onTap={tap} kind="chunks" />
    </Shell>
  );
}

// ---------- Missing Sound ----------

function GapView({ current, q, waiting }: { current: Current<Asking>; q: GapQ; waiting: boolean }) {
  const lesson = lessonFor(current.signal), w = q.word, { sounds } = infoOf(w), speech: Item[] = [w, 'Which sound is missing?'];
  const ready = useAsked(current, speech), [wrong, setWrong] = useState<number[]>([]), [right, setRight] = useState(false), [shake, setShake] = useState<number | null>(null);
  function tap(i: number) {
    if (!done(current, waiting, ready) || wrong.includes(i) || right) return;
    const verdict = current.actions.submit(q.choices[i]!);
    if (verdict === 'correct') { setRight(true); lesson.glow.value = null; sClink(); }
    else if (verdict === 'incorrect') { setWrong(x => [...x, i]); setShake(i); setTimeout(() => setShake(null), 500); }
  }
  const content = sounds.map((s, i) => (i !== q.box ? s : right ? q.answer : lesson.peek.value));
  const frame = partBoxes(sounds, content);
  frame.boxes[q.box] = { ...frame.boxes[q.box]!, cells: content[q.box] ? frame.boxes[q.box]!.cells : [null], class: cls('gapbox', !content[q.box] && 'open') };
  if (frame.eCell === null && sounds[q.box]!.endsWith('_e')) frame.eCell = content[q.box] ? 'e' : null;
  return (
    <Shell current={current} kind="gap" text="Which sound is missing?" speech={speech} word={w} ready={ready && !waiting}>
      <Frame {...frame} lit={lesson.lit.value} label="The word with one box empty" />
      <Rack tiles={q.choices} wrong={wrong} glow={lesson.glow.value} shake={shake} onTap={tap} kind="choices" />
    </Shell>
  );
}

// ---------- Fix It ----------

function FixView({ current, q, waiting }: { current: Current<Asking>; q: FixQ; waiting: boolean }) {
  const lesson = lessonFor(current.signal), w = q.word, m = q.mistake;
  const speech: Item[] = ['This should say', w, m.kind === 'swap' ? (q.marked ? 'Tap the glowing mistake!' : 'Find the mistake!') : 'Is a letter missing, or is there one too many?'];
  const ready = useAsked(current, speech);
  const [at, setAt] = useState<string | null>(null), [fixed, setFixed] = useState<string | null>(null), [wrongPick, setWrongPick] = useState<number[]>([]), [shake, setShake] = useState<string | null>(null);
  const voice = useVoice(), can = done(current, waiting, ready) && !fixed;
  const wobble = (k: string) => { setShake(k); setTimeout(() => setShake(null), 500); };
  function find(key: string) {
    if (!can || at) return;
    const verdict = current.actions.submit(key);
    if (verdict === 'not-an-answer') { setAt(key); lesson.mark.value = null; sClink(); void voice.say('Now pick the right one!'); }
    else if (verdict === 'correct') { setFixed(key); lesson.mark.value = null; sClink(); }
    else if (verdict === 'incorrect') wobble(key);
  }
  function put(i: number) {
    if (!can || !at || wrongPick.includes(i)) return;
    const verdict = current.actions.submit(`${at}=${q.choices[i]}`);
    if (verdict === 'correct') { setFixed(q.choices[i]!); lesson.glow.value = null; sClink(); }
    else if (verdict === 'incorrect') { setWrongPick(x => [...x, i]); wobble(`c${i}`); }
  }
  const mark = lesson.mark.value;
  let row: ComponentChildren;
  if (m.kind === 'swap') {
    const parts = infoOf(w).sounds, box = Number(at ?? -1);
    // the wrong spelling in boxes (kat, rane), the box he picked opened up; once fixed, the right word's boxes
    const frame = fixed ? partBoxes(parts, parts) : partBoxes(q.shown, q.shown.map((s, i) => (i === box ? null : s)));
    frame.boxes = frame.boxes.map((b, i) => ({ ...b, class: cls(q.marked && i === m.box && !at && 'marked', mark === `${i}` && 'marked', shake === `${i}` && 'wobble', i === box && !fixed && 'open') }));
    row = <Frame {...frame} onTap={i => find(`${i}`)} label="The spelling to fix: tap the mistake" />;
  } else {
    const letters = q.shown, n = letters.length;
    const shownLetters = fixed && m.kind === 'add' ? letters.filter((_, i) => `-${i}` !== fixed) : fixed && m.kind === 'drop' ? [...letters.slice(0, m.at), fixed, ...letters.slice(m.at)] : letters;
    row = (
      <div class="fixgrid" style={{ '--cols': (fixed ? shownLetters.length : n) * 2 + 1 }}>
        {shownLetters.map((l, i) => (
          <button key={`l${i}`} class={cls('ltile', 'fixl', mark === `${i}` && 'marked', shake === `-${i}` && 'wobble')} style={{ gridColumn: i * 2 + 2 }} aria-label={`Letter ${l}`} data-at={i} onClick={() => find(`-${i}`)}><span class="ch">{l}</span></button>
        ))}
        {!fixed && Array.from({ length: n + 1 }, (_, g) => (
          <button key={`g${g}`} class={cls('gapbtn', at === `+${g}` && 'open', mark === `+${g}` && 'marked', shake === `+${g}` && 'wobble')} style={{ gridColumn: g * 2 + 1 }} aria-label={`A letter missing here, ${g + 1}`} data-gap={g} onClick={() => find(`+${g}`)}>⌃</button>
        ))}
      </div>
    );
  }
  return (
    <Shell current={current} kind={cls('fix', m.kind)} text="Fix the mistake" speech={speech} word={w} ready={ready && !waiting}>
      {row}
      <RightWord w={w} lesson={lesson} />
      {at && !fixed && q.choices.length > 0 && <Rack tiles={q.choices} wrong={wrongPick} glow={lesson.glow.value} shake={shake?.startsWith('c') ? Number(shake.slice(1)) : null} onTap={put} kind="choices" />}
    </Shell>
  );
}

// ---------- Which Looks Right ----------

function PickView({ current, q, waiting }: { current: Current<Asking>; q: PickQ; waiting: boolean }) {
  const lesson = lessonFor(current.signal), w = q.word;
  const speech: Item[] = q.phrase ? ['Which one says', q.phrase as Phrase] : ['Which one spells', w];
  const ready = useAsked(current, speech), [wrong, setWrong] = useState<string[]>([]), [right, setRight] = useState<string | null>(null);
  function tap(c: string) {
    if (!done(current, waiting, ready) || wrong.includes(c) || right) return;
    const verdict = current.actions.submit(c);
    if (verdict === 'correct') { setRight(c); lesson.glow.value = null; sClink(); }
    else if (verdict === 'incorrect') setWrong(x => [...x, c]);
  }
  const text = (c: string) => (q.phrase ? inPhrase(q.phrase, w, c) : c);
  return (
    <Shell current={current} kind={cls('pick', q.phrase && 'phrase')} text={q.phrase ? 'Which one is right?' : 'Which one looks right?'} speech={speech} word={w} ready={ready && !waiting}>
      <div class={cls('spellings', `n${q.choices.length}`)} role="group" aria-label="Spellings">
        {q.choices.map(c => (
          <button key={c} class={cls('spelling', wrong.includes(c) && 'wrong', right === c && 'right', lesson.glow.value === text(c) && 'hint')} aria-label={text(c)} data-key={c} onClick={() => tap(c)}>
            <span class="ch">{text(c)}</span>
          </button>
        ))}
      </div>
      <RightWord w={w} lesson={lesson} />
    </Shell>
  );
}

// ---------- meeting a Pattern ----------

/** A new Pattern: what's new, said; then its three example words in their boxes, the new sounds lit, each said. Then Go. */
export function MeetView({ current }: { current: Current }) {
  const q = current.problem.q as MeetQ, voice = useVoice(), lesson = lessonFor(current.signal);
  const [shown, setShown] = useState(0), [ready, setReady] = useState(false);
  useEffect(() => {
    void (async () => {
      await voice.say('A new sound pattern!', PATTERN_LINES[q.pattern]);
      for (let i = 0; i < q.examples.length && voice.active; i++) { setShown(i + 1); await sweep(voice, lesson, q.examples[i]!, infoOf(q.examples[i]!).sounds.length); }
      if (voice.active) { setReady(true); void voice.say('Tap Go when you are ready!'); }
    })();
  }, []);
  const cons = (x: string | undefined) => x !== undefined && !isVowelSound(x);
  /** The sounds this Pattern is about, lit in its example words: every box for the first, then sh, the blend's sounds, a_e, ee, ar. */
  const isNew = (sounds: readonly string[], i: number) => {
    const s = sounds[i]!;
    switch (q.pattern) {
      case 'cvc': return true;
      case 'digraph': return (DIGRAPHS as readonly string[]).includes(s);
      case 'blend': return cons(s) && (cons(sounds[i - 1]) || cons(sounds[i + 1]));
      case 'magic-e': return s.endsWith('_e');
      case 'team': return (TEAMS as readonly string[]).includes(s);
      case 'r': return (R_VOWELS as readonly string[]).includes(s);
    }
  };
  return (
    <div class="game ww meet" data-ready={ready ? 'yes' : 'no'}>
      <div class="ask">
        <button class="say-btn" aria-label="Say it again" onClick={() => void voice.say(PATTERN_LINES[q.pattern])}>🔊</button>
        <h2>A new sound pattern!</h2>
      </div>
      <div class="meet-words">
        {q.examples.slice(0, shown).map((w, k) => {
          const { sounds } = infoOf(w), f = letterBoxes(w, [...w]);
          f.boxes = f.boxes.map((b, i) => ({ ...b, class: cls(isNew(sounds, i) && 'new') }));
          return (
            <button key={w} class="meet-word" aria-label={w} onClick={() => void voice.say(slowly(w), w)}>
              <span class="meet-pic" aria-hidden="true">{PICTURES[w] ?? '🔊'}</span>
              <Frame {...f} lit={k === shown - 1 ? lesson.lit.value : null} label={w} size="small" />
            </button>
          );
        })}
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
  if (q.kind === 'build') return <BuildView current={c} q={q} waiting={waiting} />;
  if (q.kind === 'chunk') return <ChunkView current={c} q={q} waiting={waiting} />;
  if (q.kind === 'gap') return <GapView current={c} q={q} waiting={waiting} />;
  if (q.kind === 'fix') return <FixView current={c} q={q} waiting={waiting} />;
  return <PickView current={c} q={q} waiting={waiting} />;
}
