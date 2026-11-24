// The questions on screen. What he must understand is said once as it appears (🔊 says it again), and taps wait until it has been said.
// Name buttons (continents, oceans, North and South) light up as each name is said; landform cards and lit continents are never named,
// since that would give the answer away. A tap on the map or the globe that lands somewhere that doesn't count (the sea when a continent
// is asked, a coast, an arguable border) only blips: it neither counts nor misses. A miss's lesson (questions/teach.ts) plays on the
// Earth itself.
import { useEffect, useRef, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { sClink, sNope } from '../audio/sfx';
import type { ProblemInstance } from '../learning/round';
import { drawShape } from './art/earth';
import { LandformArt, SceneArt } from './art/Landform';
import { EarthView } from './EarthView';
import type { Asking, Meet } from './mix';
import type { Phrase } from './phrases';
import { judgeTap, nameOf, possibleAnswers, type Question } from './questions/problems';
import { help, lessonFor, type Lesson } from './questions/teach';
import { useVoice, type VoiceScope } from './voice';
import { continent, CONTINENT_IDS, type ContinentId } from './world/continents';
import { landform, type LandformId } from './world/land';
import type { LonLat } from './map/geo';
import type { Mark } from './art/earth';

type Current = ProblemInstance<Asking, string>;
const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');
const say = (x: string) => x as Phrase;
const isName = (q: Question) => !!q.choices && q.kind !== 'globe';

/** Says the question once, then (for name buttons) each name as its button lights; marks when it's done. */
function useAsked(current: { signal: AbortSignal }, q: Question, setLit: (id: string | null) => void) {
  const voice = useVoice();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    void (async () => {
      await voice.say(...q.ask.map(say));
      if (q.choices) for (const c of q.choices) { if (!voice.active) break; setLit(c); await voice.say(say(isName(q) ? nameOf(c) : CHOICE_SAID[c] ?? nameOf(c))); }
      setLit(null);
      if (!current.signal.aborted) setReady(true);
    })();
  }, []);
  return ready;
}
const CHOICE_SAID: Record<string, string> = { land: 'Land', water: 'Water', north: 'North', south: 'South' };
async function sayAgain(v: VoiceScope, q: Question, setLit: (id: string | null) => void) {
  await v.say(...q.ask.map(say));
  if (q.choices) for (const c of q.choices) { if (!v.active) break; setLit(c); await v.say(say(isName(q) ? nameOf(c) : CHOICE_SAID[c] ?? nameOf(c))); }
  setLit(null);
}

/** One tap, one answer; wrong answers are remembered so they fade. */
function useAnswer(current: Current, ready: boolean, waiting: boolean) {
  const [wrong, setWrong] = useState<string[]>([]), [done, setDone] = useState<string | null>(null);
  const can = ready && !waiting && !done;
  function tap(answer: string | null) {
    if (!can || current.actions.busy) return;
    if (answer === null) { sNope(); return; }
    if (wrong.includes(answer)) return;
    sClink();
    const verdict = current.actions.submit(answer);
    if (verdict === 'correct') setDone(answer);
    if (verdict === 'incorrect') setWrong(w => [...w, answer]);
  }
  return { tap, wrong, done, can };
}

function Shell({ current, q, ready, lesson, setLit, stage, controls }: {
  current: Current; q: Question; ready: boolean; lesson: Lesson; setLit: (id: string | null) => void; stage: ComponentChildren; controls?: ComponentChildren;
}) {
  const voice = useVoice();
  return (
    <div class={cls('game', 'gh', `k-${q.kind}`, `lv-${q.level}`, `st-${q.stage.type}`)} data-ready={ready ? 'yes' : 'no'}>
      <div class="ask">
        <button class="say-btn" aria-label="Say it again" onClick={() => void sayAgain(voice, q, setLit)}>🔊</button>
        <h2>{q.text}</h2>
        <button class="help-btn" aria-label="Help" onClick={() => current.actions.help(() => help(current.problem, current.signal))}>🔎</button>
      </div>
      <div class="gh-body">
        <div class="gh-stage">{stage}<Popup lesson={lesson} /></div>
        {controls && <div class="gh-controls">{controls}</div>}
      </div>
    </div>
  );
}

function Popup({ lesson }: { lesson: Lesson }) {
  const p = lesson.popup.value, card = lesson.card.value;
  if (card) return (
    <div class="gh-popup lesson-card" aria-live="polite">
      <LandformArt id={card} style="side" /><LandformArt id={card} style="above" />
      <b>{landform(card).name}</b>
    </div>
  );
  if (!p) return null;
  return <div class="gh-popup" aria-live="polite"><span class="e">{p.emoji}</span><b>{p.name}</b></div>;
}

/** The Earth stage of a question, with the lesson drawn on it. */
function EarthStage({ q, lesson, answer, lit: litChoice }: { q: Question; lesson: Lesson; answer: ReturnType<typeof useAnswer>; lit: string | null }) {
  const st = q.stage;
  if (st.type !== 'earth' && st.type !== 'scene') return null;
  const hint = lesson.hint.value;
  const pins = (st.pins ?? []).map((p): Mark => ({
    at: p.at, kind: p.look === 'ring' ? 'ring' : 'pin', label: p.label,
    colour: answer.wrong.includes(p.id) ? '#9aa3ad' : hint === p.id || answer.done === p.id ? '#7CFC6A' : undefined,
  }));
  const litC = st.type === 'earth' && st.lit ? st.lit.filter(c => !answer.wrong.includes(c)) : undefined;
  const look = {
    lit: lesson.glow.value && litC ? [...litC, lesson.glow.value] : litC,
    glow: lesson.glow.value ?? (hint && (CONTINENT_IDS as readonly string[]).includes(hint) ? hint as ContinentId : null) ?? (answer.done && (CONTINENT_IDS as readonly string[]).includes(answer.done) ? answer.done as ContinentId : null),
    ocean: lesson.ocean.value ?? (q.kind === 'ocean' && answer.done ? answer.done as never : null),
    belt: (st.type === 'earth' && st.belt) || lesson.belt.value, poles: lesson.poles.value, marks: pins,
    names: lesson.land.value,
  };
  // on a narrow screen the map zooms in on Europe only when Europe is the answer (every other target stays in view)
  const europe = q.answer === 'europe' && !(st.type === 'earth' && st.pins?.length);
  const onTap = (at: LonLat | null) => answer.tap(judgeTap(st, at));
  const earth = <EarthView surface={st.surface} look={look} face={lesson.face.value} rays={lesson.rays.value} europe={europe} rim={st.type === 'earth' && st.tap?.by === 'poles'} onTap={onTap} label={q.text} />;
  if (st.type === 'scene') return <div class="gh-scene-row"><SceneArt scene={st.scene} />{earth}</div>;
  void litChoice;
  return earth;
}

function ShapeStage({ id }: { id: ContinentId }) {
  const c = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = c.current!, b = el.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
    el.width = b.width * dpr; el.height = b.height * dpr;
    const ctx = el.getContext('2d')!; ctx.scale(dpr, dpr);
    drawShape(ctx, id, b.width, b.height, '#f6f8fb');
  }, [id]);
  return <canvas ref={c} class="gh-shape" aria-label="A continent's shape" role="img" />;
}

function Cards({ q, answer, lesson }: { q: Question; answer: ReturnType<typeof useAnswer>; lesson: Lesson }) {
  const st = q.stage as Extract<Question['stage'], { type: 'cards' }>, hint = lesson.hint.value;
  return (
    <div class={cls('gh-cards', `n${st.cards.length}`)}>
      {st.cards.map((id, i) => (
        <button key={id} class={cls('gh-card', answer.wrong.includes(id) && 'wrong', (answer.done === id || hint === id) && 'right')} aria-label={`Picture ${i + 1}`} onClick={() => answer.tap(id)}>
          <LandformArt id={id as LandformId} style={st.style} />
        </button>
      ))}
    </div>
  );
}

function Choices({ q, answer, lesson, lit }: { q: Question; answer: ReturnType<typeof useAnswer>; lesson: Lesson; lit: string | null }) {
  const hint = lesson.hint.value;
  return (
    <div class={cls('choices', 'gh-choices', `n${q.choices!.length}`)}>
      {q.choices!.map(c => {
        const colour = (CONTINENT_IDS as readonly string[]).includes(c) ? continent(c as ContinentId).colour : undefined;
        return (
          <button key={c} class={cls('choice', 'gh-choice', answer.wrong.includes(c) && 'wrong', (answer.done === c || hint === c) && 'right', lit === c && 'lit')}
            style={colour ? { '--chip': colour } as Record<string, string> : undefined} aria-label={nameOf(c)} onClick={() => answer.tap(c)}>
            {colour && <i class="chip" aria-hidden="true" />}{CHOICE_ICON[c] && <span class="e" aria-hidden="true">{CHOICE_ICON[c]}</span>}<span class="nm">{nameOf(c)}</span>
          </button>
        );
      })}
    </div>
  );
}
const CHOICE_ICON: Record<string, string> = { land: '🏔️', water: '🌊', north: '⬆️', south: '⬇️' };

/** `waiting`: taps don't count right now (a lesson is running, or it's been answered). */
export function QuestionView({ current, waiting }: { current: Current; waiting: boolean }) {
  const q = current.problem.q;
  const [lit, setLit] = useState<string | null>(null);
  const ready = useAsked(current, q, setLit), lesson = lessonFor(current.signal), answer = useAnswer(current, ready, waiting);
  void possibleAnswers;
  const st = q.stage;
  // a shape by itself has no Earth to turn: its lesson brings a globe up beside it, turned to the continent and glowing
  const shapeGlobe = st.type === 'shape' && lesson.face.value
    ? <div class="gh-shape-globe"><EarthView surface={{ s: 'globe', lon: lesson.face.value.lon - 60, lat: lesson.face.value.lat }} face={lesson.face.value} look={{ glow: lesson.glow.value }} label={nameOf(q.answer)} /></div>
    : null;
  const stage = st.type === 'shape' ? <><ShapeStage id={st.continent} />{shapeGlobe}</> : st.type === 'cards' ? <Cards q={q} answer={answer} lesson={lesson} /> : <EarthStage q={q} lesson={lesson} answer={answer} lit={lit} />;
  return <Shell current={current} q={q} ready={answer.can} lesson={lesson} setLit={setLit} stage={stage} controls={q.choices ? <Choices q={q} answer={answer} lesson={lesson} lit={lit} /> : undefined} />;
}

/** Meeting a continent: the globe turned to it beside the flat map, both glowing, its name and its line said. */
export function MeetView({ current, waiting }: { current: ProblemInstance<Meet, string>; waiting: boolean }) {
  const voice = useVoice(), c = continent(current.problem.meeting);
  const [ready, setReady] = useState(false), [step, setStep] = useState(0);
  useEffect(() => {
    void (async () => {
      await voice.say('Here is a new continent!', 'This is', say(c.name));
      setStep(1);
      if (voice.active) await voice.say('Here it is on the globe. And here it is on the map.');
      setStep(2);
      if (voice.active) await voice.say(say(c.line));
      if (voice.active) { await voice.say('Tap Next!'); if (!current.signal.aborted) setReady(true); }
    })();
  }, []);
  const go = () => { if (ready && !waiting && !current.actions.busy) current.actions.submit('ok'); };
  return (
    <div class={cls('game', 'gh', 'meet')} data-ready={ready && !waiting ? 'yes' : 'no'}>
      <div class="ask"><h2>{c.name}</h2></div>
      <div class="gh-body">
        <div class="gh-stage gh-meet">
          <div class="gh-meet-globe"><EarthView surface={{ s: 'globe', lon: c.face.lon - 70, lat: c.face.lat }} face={c.face} look={{ glow: c.id, lit: step >= 1 ? undefined : [c.id] }} label={`${c.name} on the globe`} /></div>
          <div class="gh-meet-map"><EarthView surface={{ s: 'map' }} look={{ glow: step >= 1 ? c.id : null, lit: [c.id] }} europe={c.id === 'europe'} label={`${c.name} on the map`} /></div>
        </div>
        <div class="gh-controls"><button class={cls('big-btn', 'go', 'go-btn', ready && 'pulse')} aria-label="Next" onClick={go}><span class="e">▶</span><span class="go-word">Next</span></button></div>
      </div>
    </div>
  );
}
