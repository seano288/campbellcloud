// The questions on screen. Every question is said as it appears (🔊 says it again) and taps wait until it has finished. The map is the
// thing he answers on: he taps a thing, a square, a row of the map key, or one of a few choices. A miss is never marked with a red X:
// the round engine runs the lesson (map/teach.ts), which draws on the same map, and the thing he tapped just fades a little.
import { useEffect, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { sChime, sClink, sNope } from '../audio/sfx';
import type { ProblemInstance } from '../learning/round';
import { Rose, SideThing, SymbolIcon } from './map/art';
import { CARDINAL_OF, cellId, letterOf, numberOf, same, type Cardinal, type Cell, type IsleMap, type KeySym, type Thing } from './map/map';
import { LETTER_COLOURS, MapView, S } from './map/MapView';
import { at, keyAnswer, numAnswer, pickAnswer, type AboveProblem, type ClueProblem, type GridProblem, type KeyProblem, type WhereProblem } from './map/problems';
import { clear, cluesSaid, help, lessonFor, type Lesson } from './map/teach';
import type { Asking, Meet } from './mix';
import {
  betweenQ, countQ, DIR_LINE, findQ, furthestQ, letterSaid, riverQ, shortName, sideQ, symbolQ, whichQ, type Phrase,
} from './phrases';
import { useVoice, type Item } from './voice';

type Current = ProblemInstance<Asking, string>;
const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');
const WORD: Record<KeySym, string> = { palm: 'palm tree', hut: 'hut', cave: 'cave', hill: 'hill', rock: 'rock', dock: 'dock', bridge: 'bridge', river: 'river' };

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
function Shell({ current, kind, text, speech, stage, controls, ready }: {
  current: Current; kind: string; text: ComponentChildren; speech: readonly Item[]; stage: ComponentChildren; controls?: ComponentChildren; ready: boolean;
}) {
  const voice = useVoice();
  return (
    <div class={cls('game', 'tf', kind)} data-ready={ready ? 'yes' : 'no'}>
      <div class="ask">
        <button class="say-btn" aria-label="Say it again" onClick={() => void voice.say(...speech)}>🔊</button>
        <h2>{text}</h2>
        <button class="help-btn" aria-label="Help" onClick={() => current.actions.help(() => help(current.problem, current.signal))}>🔎</button>
      </div>
      <div class="tf-body">
        <div class="tf-stage">{stage}</div>
        {controls && <div class="tf-controls">{controls}</div>}
      </div>
    </div>
  );
}

/** Taps he made that weren't it (faded, never crossed out), and the one that was. */
function useTaps(current: Current, waiting: boolean, ready: boolean) {
  const [wrong, setWrong] = useState<string[]>([]), [right, setRight] = useState<string | null>(null);
  const can = ready && !waiting && !right;
  function submit(answer: string, id = answer) {
    if (!can || current.actions.busy || wrong.includes(id)) return;
    const verdict = current.actions.submit(answer);
    if (verdict === 'correct') { setRight(id); lessonFor(current.signal).hint.value = null; }
    else if (verdict === 'incorrect') setWrong(w => [...w, id]);
    else if (verdict === 'not-an-answer') sNope();
  }
  return { wrong, right, can, submit };
}

/** The rose in the corner of the stage, when the question shows one: the lesson can grow it and light a point. */
function StageRose({ lesson, lit }: { lesson: Lesson; lit: Cardinal | null }) {
  const r = lesson.rose.value;
  return <div class={cls('stage-rose', r?.big && 'big')}><Rose lit={r ? r.lit : lit} big={!!r?.big} /></div>;
}

// ---------- Where Is It ----------

function whereSpeech(q: WhereProblem): Phrase {
  if (q.form === 'side') return sideQ(q.rel, q.ref.sym);
  if (q.form === 'between') return betweenQ(q.a.sym, q.b.sym);
  return furthestQ(q.dir);
}

function WhereView({ current, q, waiting }: { current: Current; q: WhereProblem; waiting: boolean }) {
  const text = whereSpeech(q), speech: Phrase[] = [text], ready = useAsked(current, speech), lesson = lessonFor(current.signal);
  const { wrong, right, can, submit } = useTaps(current, waiting, ready);
  const lit = q.rose === 'lit' && q.form === 'side' ? CARDINAL_OF[q.rel] : null;
  return (
    <Shell current={current} ready={can} kind="where" text={text} speech={speech}
      stage={<>
        <MapView map={q.map} lesson={lesson} tap="things" onTap={c => submit(at(c), cellId(c))} wrong={wrong} right={right} label="The island map" />
        {q.rose !== 'none' && <StageRose lesson={lesson} lit={lit} />}
      </>} />
  );
}

// ---------- Map Key ----------

function keySpeech(q: KeyProblem): Phrase {
  if (q.form === 'symbol') return symbolQ(q.ask);
  if (q.form === 'find') return findQ(q.ask);
  if (q.form === 'count') return countQ(q.ask);
  return riverQ(q.dir);
}

/** The map key: each symbol with its word. In "Tap the symbol for…" its rows are the answers. */
export function KeyPanel({ keys, lesson, onTap, wrong = [], right = null }: { keys: readonly KeySym[]; lesson: Lesson | null; onTap?: (s: KeySym) => void; wrong?: readonly string[]; right?: string | null }) {
  const lit = lesson?.keyLit.value ?? null, hint = lesson?.hint.value ?? null;
  return (
    <div class={cls('map-key', onTap && 'tappable')} role="group" aria-label="Map key">
      <div class="key-title">Key</div>
      {keys.map(s => {
        const body = <><SymbolIcon sym={s} /><span class="key-word">{WORD[s]}</span></>;
        const state = cls('key-row', lit === s && 'lit', hint === `key:${s}` && 'hint', wrong.includes(`key:${s}`) && 'wrong', right === `key:${s}` && 'right');
        return onTap
          ? <button key={s} class={state} aria-label={WORD[s]} onClick={() => onTap(s)}>{body}</button>
          : <div key={s} class={state}>{body}</div>;
      })}
    </div>
  );
}

function KeyView({ current, q, waiting }: { current: Current; q: KeyProblem; waiting: boolean }) {
  const text = keySpeech(q), speech: Phrase[] = [text], ready = useAsked(current, speech), lesson = lessonFor(current.signal);
  const { wrong, right, can, submit } = useTaps(current, waiting, ready);
  const onMap = q.form === 'find' || q.form === 'river';
  return (
    <Shell current={current} ready={can} kind={`key form-${q.form}`} text={text} speech={speech}
      stage={<>
        <MapView map={q.map} lesson={lesson} tap={onMap ? 'things' : null} onTap={c => submit(at(c), cellId(c))} wrong={wrong} right={right} label="The island map" />
        {q.rose !== 'none' && <StageRose lesson={lesson} lit={null} />}
      </>}
      controls={<>
        <KeyPanel keys={q.key} lesson={lesson} onTap={q.form === 'symbol' ? s => submit(keyAnswer(s)) : undefined} wrong={wrong} right={right} />
        {q.form === 'count' && (
          <div class="choices nums">
            {q.choices.map(c => (
              <button key={c} class={cls('choice', wrong.includes(numAnswer(c)) && 'wrong', right === numAnswer(c) && 'right', lesson.hint.value === numAnswer(c) && 'hint')} aria-label={`${c}`} onClick={() => submit(numAnswer(c))}>{c}</button>
            ))}
          </div>
        )}
      </>} />
  );
}

// ---------- Grid Square ----------

/** A square's name with its letter in its column's colour. */
export function SquareName({ c, h }: { c: Cell; h: number }) {
  return <span class="sq-name"><b style={{ color: LETTER_COLOURS[c.x] }}>{letterOf(c.x)}</b>{numberOf(h, c.y)}</span>;
}

function GridView({ current, q, waiting }: { current: Current; q: GridProblem; waiting: boolean }) {
  const target = q.form === 'tap' ? q.target : null;
  const speech: Phrase[] = target ? ['Tap', letterSaid(letterOf(target.x)), `${numberOf(q.map.h, target.y)}` as Phrase] : [whichQ((q as Extract<GridProblem, { form: 'which' }>).thing.sym)];
  const ready = useAsked(current, speech), lesson = lessonFor(current.signal);
  const { wrong, right, can, submit } = useTaps(current, waiting, ready);
  if (q.form === 'tap') {
    return (
      <Shell current={current} ready={can} kind={`grid size-${q.map.w}`} text={<>Tap <SquareName c={q.target} h={q.map.h} /></>} speech={speech}
        stage={<MapView map={q.map} lesson={lesson} labels tap="cells" onTap={c => submit(at(c), cellId(c))} wrong={wrong} right={right} label="The map in squares" />} />
    );
  }
  return (
    <Shell current={current} ready={can} kind="grid form-which" text={speech[0] as string} speech={speech}
      stage={<MapView map={q.map} lesson={lesson} labels label="The map in squares" />}
      controls={
        <div class="choices squares">
          {q.choices.map((c, i) => (
            <button key={i} class={cls('choice', wrong.includes(pickAnswer(i)) && 'wrong', right === pickAnswer(i) && 'right', lesson.hint.value === pickAnswer(i) && 'hint')} aria-label={`${letterOf(c.x)}${numberOf(q.map.h, c.y)}`} onClick={() => submit(pickAnswer(i))}>
              <SquareName c={c} h={q.map.h} />
            </button>
          ))}
        </div>
      } />
  );
}

// ---------- Follow the Clues ----------

const ARROW_ANGLE: Record<Cardinal, number> = { north: 0, east: 90, south: 180, west: 270 };
function ClueChip({ q, i, lit }: { q: ClueProblem; i: number; lit: boolean }) {
  const c = q.clues[i]!;
  return (
    <div class={cls('clue-chip', lit && 'lit')}>
      <svg viewBox="-50 -50 100 100" class="clue-arrow" aria-hidden="true"><path transform={`rotate(${ARROW_ANGLE[c.dir]})`} d="M-13 36 V-6 H-32 L0 -40 L32 -6 H13 V36 Z" fill="#ffd23f" stroke="#2a1a0e" stroke-width="7" stroke-linejoin="round" /></svg>
      <span class="clue-dir">{c.dir[0]!.toUpperCase()}</span>
      {'to' in c ? <SymbolIcon sym={c.to.sym} /> : <span class="clue-n">{c.n}</span>}
    </div>
  );
}

function ClueView({ current, q, waiting }: { current: Current; q: ClueProblem; waiting: boolean }) {
  const speech: Phrase[] = ['Start at the star.', ...cluesSaid(q), 'Tap where the treasure is!'], ready = useAsked(current, speech), lesson = lessonFor(current.signal);
  const { wrong, right, can, submit } = useTaps(current, waiting, ready);
  const lit = lesson.rose.value?.lit ?? null;
  return (
    <Shell current={current} ready={can} kind="clue" text="Follow the clues. Tap where the treasure is." speech={speech}
      stage={<>
        <MapView map={q.map} lesson={lesson} squares start={q.start} tap="cells" onTap={c => submit(at(c), cellId(c))} wrong={wrong} right={right} label="The island map in squares, with a star to start from" />
        <StageRose lesson={lesson} lit={null} />
      </>}
      controls={<div class="clues" role="list" aria-label="The clues">{q.clues.map((c, i) => <ClueChip key={i} q={q} i={i} lit={lit === c.dir && !!lesson.path.value} />)}</div>} />
  );
}

// ---------- From Above ----------

/** The scene from the side: the things standing on the beach, left to right, where they are across the map. */
function Scene({ things, lit }: { things: readonly Thing[]; lit: number | null }) {
  const order = [...things].sort((a, b) => a.x - b.x);
  return (
    <svg class="scene" viewBox={`0 -130 ${5 * S} 170`} role="img" aria-label={`A beach with ${order.map(t => WORD[t.sym]).join(', ')}`}>
      <rect x="0" y="-130" width={5 * S} height="130" class="scene-sky" />
      <circle cx={5 * S - 40} cy="-100" r="18" fill="#ffd23f" stroke="#2a1a0e" stroke-width="4" />
      <path d={`M0 0 H${5 * S} V40 H0 Z`} class="scene-sand" />
      {order.map((t, i) => (
        <g key={i} transform={`translate(${t.x * S + S / 2} 0) scale(.64)`} class={cls('scene-thing', lit === i && 'lit')}>
          {lit === i && <ellipse cy="-60" rx="80" ry="90" class="scene-halo" />}
          <SideThing sym={t.sym} />
        </g>
      ))}
    </svg>
  );
}

function AboveView({ current, q, waiting }: { current: Current; q: AboveProblem; waiting: boolean }) {
  const speech: Phrase[] = ['Which map shows this from above?'], ready = useAsked(current, speech), lesson = lessonFor(current.signal);
  const { wrong, right, can, submit } = useTaps(current, waiting, ready);
  return (
    <Shell current={current} ready={can} kind="above" text="Which map shows this from above?" speech={speech}
      stage={<Scene things={q.scene} lit={lesson.sceneLit.value} />}
      controls={
        <div class={cls('choices', 'maps', `n${q.options.length}`)}>
          {q.options.map((m, i) => (
            <button key={i} class={cls('choice', 'map-choice', wrong.includes(pickAnswer(i)) && 'wrong', right === pickAnswer(i) && 'right', lesson.hint.value === pickAnswer(i) && 'hint')} aria-label={`Map ${i + 1}`} onClick={() => submit(pickAnswer(i))}>
              <MapThumb map={m} />
            </button>
          ))}
        </div>
      } />
  );
}

/** A small map from above, for the choices. */
function MapThumb({ map }: { map: IsleMap }) {
  return <MapView map={map} class="thumb" label="A map from above" />;
}

// ---------- the question ----------

export function QuestionView({ current, waiting }: { current: Current; waiting: boolean }) {
  const q = current.problem.q;
  if (q.kind === 'where') return <WhereView current={current} q={q} waiting={waiting} />;
  if (q.kind === 'key') return <KeyView current={current} q={q} waiting={waiting} />;
  if (q.kind === 'grid') return <GridView current={current} q={q} waiting={waiting} />;
  if (q.kind === 'clue') return <ClueView current={current} q={q} waiting={waiting} />;
  return <AboveView current={current} q={q} waiting={waiting} />;
}

// ---------- Meetings: the compass rose, the map key, grid squares ----------

const MEET_KEY_MAP: IsleMap = { w: 4, h: 3, river: null, things: [{ x: 0, y: 0, sym: 'palm' }, { x: 2, y: 1, sym: 'hut' }, { x: 3, y: 2, sym: 'cave' }, { x: 1, y: 2, sym: 'palm' }] };
const MEET_GRID_MAP: IsleMap = { w: 3, h: 3, river: null, things: [{ x: 0, y: 0, sym: 'palm' }, { x: 2, y: 2, sym: 'rock' }] };
const MEET_GRID_TARGET = { x: 1, y: 1 };

type MeetProps = { current: ProblemInstance<Meet, string>; waiting: boolean };

/** The compass rose, once, before the first question that needs it: each point lit and said, the rhyme round it, then "Tap north!". */
function MeetCompass({ current, waiting }: MeetProps) {
  const voice = useVoice(), lesson = lessonFor(current.signal);
  const [lit, setLit] = useState<Cardinal | null>(null);
  const ready = useAsked(current, ['This is a compass rose.', 'It shows the way on a map.'], async () => {
    for (const d of ['north', 'east', 'south', 'west'] as const) { if (current.signal.aborted) return; setLit(d); await voice.say(DIR_LINE[d]); }
    setLit(null);
    const rhyme = voice.say('Never Eat Soggy Waffles!');
    for (const d of ['north', 'east', 'south', 'west'] as const) { if (current.signal.aborted) return; setLit(d); await voice.wait(420); }
    await rhyme;
    setLit(null);
    await voice.say('Tap north!');
  });
  const can = ready && !waiting && !current.actions.busy;
  function tap(d: Cardinal) {
    if (!can) return;
    if (d !== 'north') { sNope(); setLit(d); void voice.say(DIR_LINE[d], 'Tap north!'); return; }
    sChime(); setLit('north'); current.actions.submit('ok');
  }
  void lesson;
  return (
    <div class="game tf meet compass" data-ready={can ? 'yes' : 'no'}>
      <div class="ask"><h2>North, east, south, west</h2></div>
      <div class="meet-rose"><Rose lit={lit} big onTap={tap} label="Compass rose: tap north" /></div>
    </div>
  );
}

/** The map key, once: each symbol in the key lights with the same symbols on the map. */
function MeetKey({ current, waiting }: MeetProps) {
  const voice = useVoice(), lesson = lessonFor(current.signal), keys: KeySym[] = ['palm', 'hut', 'cave'];
  const ready = useAsked(current, ['This is the map key.', 'Each symbol stands for a real thing.'], async () => {
    for (const s of keys) {
      if (current.signal.aborted) return;
      lesson.keyLit.value = s;
      lesson.pulse.value = MEET_KEY_MAP.things.filter(t => t.sym === s).map(cellId);
      await voice.say(shortName(s));
      await voice.wait(250);
    }
    clear(lesson);
    await voice.say('Tap the arrow to go on!');
  });
  const can = ready && !waiting && !current.actions.busy;
  return (
    <div class="game tf meet key" data-ready={can ? 'yes' : 'no'}>
      <div class="ask"><h2>The map key</h2></div>
      <div class="tf-body">
        <div class="tf-stage"><MapView map={MEET_KEY_MAP} lesson={lesson} label="An island map" /></div>
        <div class="tf-controls">
          <KeyPanel keys={keys} lesson={lesson} />
          <button class={cls('big-btn', 'go', 'on-btn', can && 'pulse')} aria-label="Go on" onClick={() => { if (can) { sClink(); current.actions.submit('ok'); } }}><span class="e">▶</span></button>
        </div>
      </div>
    </div>
  );
}

/** Grid squares, once: letters along the bottom, numbers up the side, the letter said first, and where they meet. */
function MeetGrid({ current, waiting }: MeetProps) {
  const voice = useVoice(), lesson = lessonFor(current.signal);
  const ready = useAsked(current, ['These are grid squares.', 'Letters go along the bottom.', 'Numbers go up the side.', 'Say the letter first.'], async () => {
    lesson.col.value = MEET_GRID_TARGET.x;
    await voice.say(letterSaid('B'));
    lesson.row.value = MEET_GRID_TARGET.y;
    await voice.say('2');
    lesson.glow.value = [cellId(MEET_GRID_TARGET)];
    await voice.say('Here they meet.', 'Tap the square!');
  });
  const can = ready && !waiting && !current.actions.busy;
  function tap(c: Cell) {
    if (!can) return;
    if (!same(c, MEET_GRID_TARGET)) { sNope(); void voice.say('Tap the square!'); return; }
    sChime(); current.actions.submit('ok');
  }
  return (
    <div class="game tf meet grid" data-ready={can ? 'yes' : 'no'}>
      <div class="ask"><h2>Tap <SquareName c={MEET_GRID_TARGET} h={3} /></h2></div>
      <div class="tf-body"><div class="tf-stage"><MapView map={MEET_GRID_MAP} lesson={lesson} labels tap="cells" onTap={tap} label="A map in squares" /></div></div>
    </div>
  );
}

export function MeetView(props: MeetProps) {
  const m = props.current.problem.meeting;
  if (m === 'compass') return <MeetCompass {...props} />;
  if (m === 'key') return <MeetKey {...props} />;
  return <MeetGrid {...props} />;
}

