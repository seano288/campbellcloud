// The questions on screen. A story is said one sentence at a time, each sentence (and its numbers) appearing on the story card as it is
// said; 🔊 says it all again, as often as he likes. Taps wait until the story has been said once (the brief's risk: he taps before the
// story ends). Number buttons and number sentences are not read out, since he reads numbers. Deck Log, How Many More, Two Steps and the
// Mission Board are answered on two number wheels; Which Sum by tapping a number sentence. The lesson for a miss (stories/teach.ts) draws
// on the same screen, and its fuller walk-through waits on the big arrow.
import { useEffect, useRef, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { sClink, sNope } from '../audio/sfx';
import type { ProblemInstance } from '../learning/round';
import { MODE_NAMES } from './learning';
import type { Asking, Meet } from './mix';
import { said, SQUAD_NAMES, type Phrase } from './phrases';
import { BarGraph, BarPicture, Deck, EqCard, NOUN_ICON, PairRows, StoryCard } from './stories/pictures';
import { SQUADS, type BoardProblem, type CompareProblem, type OneProblem, type PickProblem, type Sentence, type Squad, type TwoProblem } from './stories/problems';
import { help, lessonFor, parseEq, speechOf, type Lesson } from './stories/teach';
import { useVoice, type Item } from './voice';

type Current = ProblemInstance<Asking, string>;
const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');
const squadName = (s: Squad) => SQUAD_NAMES[SQUADS.indexOf(s)]!;
export const MODE_ICONS = { one: '📓', pick: '🧮', compare: '⚖️', two: '👣', board: '📊' } as const;

/** Tells a story one sentence at a time: `shown` sentences are on the card, `lit` is being said. `ready` once it has all been said. */
function useStory(current: { signal: AbortSignal }, sentences: readonly Sentence[], after: readonly Item[] = []) {
  const voice = useVoice();
  const [shown, setShown] = useState(0), [lit, setLit] = useState<number | null>(null), [ready, setReady] = useState(false);
  const telling = useRef(0);
  async function tell() {
    const id = ++telling.current;
    for (let i = 0; i < sentences.length; i++) {
      if (!voice.active || telling.current !== id) return;
      setShown(s => Math.max(s, i + 1)); setLit(i);
      await voice.say(...speechOf(sentences[i]!));
    }
    if (after.length && voice.active && telling.current === id) await voice.say(...after);
    if (telling.current === id) { setLit(null); if (!current.signal.aborted) setReady(true); }
  }
  useEffect(() => { void tell(); }, []);
  // hush, not cancel: cancel ends this question's voice for good, so a 🔊 tapped mid-story left it silent and never ready (pass 2)
  return { shown, lit, ready, again: () => { voice.hush(); void tell(); } };
}

/** The big arrow the fuller lesson waits on: he taps it to go to the next step. */
function NextArrow({ lesson }: { lesson: Lesson }) {
  if (!lesson.waiting.value) return null;
  return <button class="cd-next pulse" aria-label="Next step" onClick={() => lesson.advance()}>➜</button>;
}

/** `ready`: the story has been said and taps count (the browser tour waits on it, as he does). */
function Shell({ current, kind, title, onSay, stage, controls, ready, lesson }: {
  current: Current; kind: string; title: ComponentChildren; onSay(): void; stage: ComponentChildren; controls?: ComponentChildren; ready: boolean; lesson: Lesson;
}) {
  return (
    <div class={cls('game', 'cd', ...kind.split(' ').map(k => `k-${k}`))} data-ready={ready ? 'yes' : 'no'} data-lesson={lesson.waiting.value ? 'next' : 'no'}>
      <div class="ask">
        <button class="say-btn" aria-label="Say it again" onClick={onSay}>🔊</button>
        <h2>{title}</h2>
        <button class="help-btn" aria-label="Help" onClick={() => current.actions.help(() => help(current.problem, current.signal))}>🔎</button>
      </div>
      <div class="cd-body">
        <div class="cd-stage">{stage}<NextArrow lesson={lesson} /></div>
        {controls && <div class="cd-controls">{controls}</div>}
      </div>
    </div>
  );
}
const Title = ({ mode }: { mode: Asking['mode'] }) => <><span class="cd-kind-icon" aria-hidden="true">{MODE_ICONS[mode]}</span>{MODE_NAMES[mode]}</>;

// ---------- the wheels: one for each digit ----------

const WHEEL_NAMES = ['tens', 'ones'] as const;
/** Two wheels, each turning 0 to 9, then ✓. He builds the answer digit by digit. After a miss his number stays, to fix. */
function Wheels({ value, onTurn, onDone, ok, hint }: { value: number; onTurn(v: number): void; onDone(): void; ok: boolean; hint: boolean }) {
  const digits = [Math.floor(value / 10) % 10, value % 10], place = [10, 1];
  function turn(i: number, dir: 1 | -1) {
    if (!ok) { sNope(); return; } // held while the story is said (or a lesson runs): a soft no, so the tap isn't simply lost
    sClink();
    const now = digits[i]!, next = (now + dir + 10) % 10;
    onTurn(value + (next - now) * place[i]!);
  }
  return (
    <div class="cd-wheels">
      <div class="numwheels">
        {digits.map((dg, i) => (
          <div key={WHEEL_NAMES[i]} class={cls('numwheel', `wheel-${WHEEL_NAMES[i]}`)}>
            <button aria-label={`${WHEEL_NAMES[i]} up`} onClick={() => turn(i, 1)}>▲</button>
            <div class="digit">{dg}</div>
            <button aria-label={`${WHEEL_NAMES[i]} down`} onClick={() => turn(i, -1)}>▼</button>
          </div>
        ))}
      </div>
      <button class={cls('choice', 'done-btn', hint && 'hint')} aria-label="Done" onClick={onDone}>✓</button>
    </div>
  );
}
/** The wheels and their check. `submit` returns the verdict; a wrong number stays on the wheels for him to fix. */
function useWheels(current: Current, ready: boolean, waiting: boolean) {
  const voice = useVoice();
  const [value, setValue] = useState(0), [turned, setTurned] = useState(false), [done, setDone] = useState(false);
  const ok = ready && !waiting && !done;
  function check(submit: (v: number) => string | undefined) {
    if (!ok || current.actions.busy) { if (!done) sNope(); return; }
    if (!turned) { sNope(); void voice.say('Turn the wheels to make the number. Then tap the check.'); return; }
    const verdict = submit(value);
    if (verdict === 'correct') setDone(true);
  }
  return { value, setValue: (v: number) => { setValue(v); setTurned(true); }, reset: () => { setValue(0); setTurned(false); }, ok, done, check };
}

/** Something a lesson draws is on screen: a sideways phone then puts the story card beside it rather than above it (pass 2 found the
 *  bar picture and the number sentence cut off under the card at 844×390). */
const drawing = (l: Lesson) => !!(l.deck.value || l.bars.value || l.eq.value || l.sum.value || l.rows.value);
/** What a lesson draws, over the story card: the deck, the bar picture, the rows, the number sentence. */
function LessonPicture({ lesson }: { lesson: Lesson }) {
  const deck = lesson.deck.value, bars = lesson.bars.value, eq = lesson.eq.value, sum = lesson.sum.value;
  if (!deck && !bars && !eq && !sum) return null;
  return (
    <div class="cd-lesson">
      {deck && <Deck scene={deck} />}
      {bars && <BarPicture bars={bars} />}
      {eq && <EqCard eq={eq.eq} lit={eq.lit ?? null} filled={eq.filled ?? null} />}
      {sum && <div class="cd-eq cd-sum">{sum}</div>}
    </div>
  );
}

// ---------- Deck Log and How Many More ----------

function StoryWheels({ current, q, waiting }: { current: Current; q: OneProblem | CompareProblem; waiting: boolean }) {
  const s = q.story, story = useStory(current, s.sentences), lesson = lessonFor(current.signal);
  const w = useWheels(current, story.ready, waiting);
  const rows = lesson.rows.value ?? (q.kind === 'compare' && q.bars ? { big: s.nums['#big']!, small: s.nums['#small']!, bigLabel: '', smallLabel: '', paired: false, glow: false } : null);
  // the bar picture takes the rows' place in the fuller lesson, so the two never crowd the card together
  const showRows = q.kind === 'compare' && rows && (lesson.rows.value || (q.story.ask === '#d' && story.shown >= 2 && !lesson.bars.value));
  return (
    <Shell current={current} lesson={lesson} ready={w.ok} kind={`${q.kind} wheels`} title={<Title mode={current.problem.mode} />} onSay={story.again}
      stage={<div class={cls('cd-picture', drawing(lesson) && 'lesson-on')}>
        <div class="cd-noun" aria-hidden="true">{NOUN_ICON[s.noun]}</div>
        <StoryCard sentences={s.sentences} shown={story.shown} lit={lesson.lit.value ?? story.lit} />
        {showRows && <PairRows rows={rows!} noun={s.noun} />}
        <LessonPicture lesson={lesson} />
      </div>}
      controls={<Wheels value={w.value} ok={w.ok} hint={lesson.hint.value === q.answer} onTurn={w.setValue} onDone={() => w.check(v => current.actions.submit(String(v)))} />} />
  );
}

// ---------- Two Steps ----------

function TwoView({ current, q, waiting }: { current: Current; q: TwoProblem; waiting: boolean }) {
  const s = q.story, voice = useVoice(), lesson = lessonFor(current.signal);
  // stepped: the first two sentences, then the middle question; he answers it, then the rest of the story
  const firstPart = q.stepped ? s.sentences.slice(0, 2) : s.sentences;
  const story = useStory(current, firstPart, q.stepped ? speechOf(s.middleQuestion) : []);
  const [middle, setMiddle] = useState<number | null>(null), [rest, setRest] = useState(false);
  const w = useWheels(current, story.ready && (!q.stepped || middle === null || rest), waiting);
  const sentences = q.stepped ? (middle === null ? [...firstPart, s.middleQuestion] : [...firstPart, s.middleQuestion, ...s.sentences.slice(2)]) : s.sentences;
  // one telling at a time: a 🔊 during the rest of the story takes over from it, rather than the two cutting each other off sentence by sentence
  const telling = useRef(0);
  async function tellRest(from = 2) {
    const id = ++telling.current;
    for (const sen of s.sentences.slice(from)) { if (telling.current !== id) return; await voice.say(...speechOf(sen)); }
    if (telling.current === id && !current.signal.aborted) setRest(true);
  }
  function submit(v: number) {
    if (!q.stepped) return current.actions.submit(String(v));
    if (middle === null) {
      if (v === s.middle) { sClink(); setMiddle(v); w.reset(); void tellRest(); return undefined; }
      return current.actions.submit(`${v},`); // a wrong middle is a miss: the lesson shows the first step
    }
    return current.actions.submit(`${middle},${v}`);
  }
  const shownAll = q.stepped && middle !== null ? sentences.length : story.shown + (q.stepped && story.ready ? 1 : 0);
  return (
    <Shell current={current} lesson={lesson} ready={w.ok} kind={`two wheels ${q.stepped ? `step-${middle === null ? 1 : 2}` : ''}`} title={<Title mode="two" />}
      onSay={() => { if (middle === null) story.again(); else void tellRest(0); }}
      stage={<div class={cls('cd-picture', drawing(lesson) && 'lesson-on')}>
        <div class="cd-noun" aria-hidden="true">{NOUN_ICON[s.noun]}</div>
        <StoryCard sentences={sentences} shown={shownAll} lit={lesson.lit.value ?? story.lit} />
        {middle !== null && <div class="cd-middle">✓ <b class="cd-num">{middle}</b></div>}
        <LessonPicture lesson={lesson} />
      </div>}
      controls={<Wheels value={w.value} ok={w.ok} hint={!!lesson.hint.value} onTurn={w.setValue} onDone={() => w.check(submit)} />} />
  );
}

// ---------- Which Sum ----------

function PickView({ current, q, waiting }: { current: Current; q: PickProblem; waiting: boolean }) {
  const s = q.story, story = useStory(current, s.sentences, ['Which number sentence fits the story?']), lesson = lessonFor(current.signal);
  const [wrong, setWrong] = useState<string[]>([]), [done, setDone] = useState<string | null>(null);
  const can = story.ready && !waiting && !done;
  function tap(c: string) {
    if (!can && !done) { sNope(); return; }
    if (!can || current.actions.busy || wrong.includes(c)) return;
    sClink();
    const verdict = current.actions.submit(c);
    if (verdict === 'correct') setDone(c);
    if (verdict === 'incorrect') setWrong(x => [...x, c]);
  }
  return (
    <Shell current={current} lesson={lesson} ready={can} kind="pick" title={<Title mode="pick" />} onSay={story.again}
      stage={<div class={cls('cd-picture', drawing(lesson) && 'lesson-on')}>
        <div class="cd-noun" aria-hidden="true">{NOUN_ICON[s.noun]}</div>
        <StoryCard sentences={s.sentences} shown={story.shown} lit={lesson.lit.value ?? story.lit} extraAt={null} />
        <LessonPicture lesson={lesson} />
      </div>}
      controls={<div class={cls('choices', 'cd-sentences', `n${q.choices.length}`)}>{q.choices.map(c => (
        <button key={c} class={cls('choice', 'cd-sentence', wrong.includes(c) && 'wrong', done === c && 'right', lesson.hint.value === c && 'hint')} aria-label={c} onClick={() => tap(c)}>
          <EqCard eq={parseEq(c)} />
        </button>
      ))}</div>} />
  );
}

// ---------- Mission Board ----------

/** The question about the graph, as said: "How many crates did Red Squadron carry?" and the others. */
export function boardSpeech(q: BoardProblem): Item[] {
  const names = q.asked.map(i => squadName(q.squads[i]!));
  if (q.form === 'read') return ['How many crates did', names[0]!, 'carry?'];
  if (q.form === 'more') return ['How many more crates did', names[0]!, 'carry than', names[1]!];
  return ['How many crates did', ...names.flatMap((n, i) => (i === names.length - 1 ? ['and', n] : [n])), 'carry in all?'] as Item[];
}
export function boardText(q: BoardProblem): string {
  const names = q.asked.map(i => `${q.squads[i]} Squadron`);
  if (q.form === 'read') return `How many crates did ${names[0]} carry?`;
  if (q.form === 'more') return `How many more crates did ${names[0]} carry than ${names[1]}?`;
  return `How many crates did ${names.slice(0, -1).join(', ')} and ${names.at(-1)} carry in all?`;
}
function BoardView({ current, q, waiting }: { current: Current; q: BoardProblem; waiting: boolean }) {
  const voice = useVoice(), speech = boardSpeech(q), lesson = lessonFor(current.signal);
  const [ready, setReady] = useState(false);
  useEffect(() => { void voice.say(...speech).then(() => { if (!current.signal.aborted) setReady(true); }); }, []);
  const w = useWheels(current, ready, waiting);
  return (
    <Shell current={current} lesson={lesson} ready={w.ok} kind={`board form-${q.form} step-${q.step}`} title={<Title mode="board" />} onSay={() => void voice.say(...speech)}
      stage={<div class="cd-picture board">
        <p class="cd-board-q">{boardText(q)}</p>
        <div class="cd-graph-wrap"><BarGraph q={q} marks={lesson.graph.value ?? {}} /></div>
        <LessonPicture lesson={lesson} />
      </div>}
      controls={<Wheels value={w.value} ok={w.ok} hint={lesson.hint.value === q.answer} onTurn={w.setValue} onDone={() => w.check(v => current.actions.submit(String(v)))} />} />
  );
}

// ---------- the question, and Meetings ----------

export function QuestionView({ current, waiting }: { current: Current; waiting: boolean }) {
  const q = current.problem.q;
  if (q.kind === 'pick') return <PickView current={current} q={q} waiting={waiting} />;
  if (q.kind === 'two') return <TwoView current={current} q={q} waiting={waiting} />;
  if (q.kind === 'board') return <BoardView current={current} q={q} waiting={waiting} />;
  return <StoryWheels current={current} q={q} waiting={waiting} />;
}

/** A sample graph for the Meeting: four squadrons, a scale of ones. */
const SAMPLE: BoardProblem = { kind: 'board', form: 'read', squads: ['Red', 'Blue', 'Green', 'Gold'], bars: [4, 7, 2, 5], step: 1, top: 8, asked: [1], answer: '7' };
const SCALES = [2, 5, 10] as const;
/** The first Mission Board question meets the bar graph; the first that counts by twos, fives or tens meets the scale. Shown and said,
 *  and he taps Go. */
export function MeetView({ current, waiting }: { current: ProblemInstance<Meet, string>; waiting: boolean }) {
  const voice = useVoice(), meeting = current.problem.meeting;
  const [ready, setReady] = useState(false), [stage, setStage] = useState(0);
  useEffect(() => {
    void (async () => {
      if (meeting === 'graph') {
        setStage(1); await voice.say('This is a bar graph.');
        setStage(2); await voice.say('Each bar is a squadron.', 'The bar shows how many crates it carried.');
        setStage(3); await voice.say('Go from the top of the bar across to the numbers.');
        setStage(4); await voice.say(said(7));
      } else {
        for (const [i, step] of SCALES.entries()) {
          setStage(i + 1);
          await voice.say('These numbers count by', (['twos.', 'fives.', 'tens.'] as const)[i]!, ...[1, 2, 3, 4].map(k => said(k * step)) as Phrase[]);
        }
      }
      if (voice.active) { await voice.say('Tap Go!'); if (!current.signal.aborted) setReady(true); }
    })();
  }, []);
  const go = () => { if (ready && !waiting && !current.actions.busy) current.actions.submit('ok'); };
  return (
    <div class={cls('game', 'cd', 'meet', `meet-${meeting}`)} data-ready={ready && !waiting ? 'yes' : 'no'}>
      <div class="ask"><h2>{meeting === 'graph' ? 'Bar graph' : 'Counting by'}</h2></div>
      <div class="cd-body">
        <div class="cd-stage">
          {meeting === 'graph'
            ? <div class="cd-graph-wrap"><BarGraph q={SAMPLE} marks={stage >= 3 ? { across: 1, counted: stage >= 4 ? 7 : 0 } : { lit: stage >= 2 ? [0, 1, 2, 3] : [] }} /></div>
            : <div class="cd-scales">{SCALES.map((step, i) => (
                <div key={step} class={cls('cd-scale', stage === i + 1 && 'lit')}>{[5, 4, 3, 2, 1, 0].map(k => <span key={k}>{k * step}</span>)}</div>
              ))}</div>}
        </div>
        <div class="cd-controls"><button class={cls('big-btn', 'go', 'go-btn', ready && 'pulse')} aria-label="Go" onClick={go}><span class="e">▶</span><span class="go-word">Go</span></button></div>
      </div>
    </div>
  );
}
