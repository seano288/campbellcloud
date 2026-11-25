// The questions on screen. Words sit on stone tablets in Andika, lowercase except I, names and a sentence's first word. The question is
// said once as it appears (🔊 says it again), and taps wait until it has been said; the answer buttons are not read out. A miss's lesson
// (teach.ts) plays on the question: the word's picture, the dragon doing or becoming the word, the plural, the calendar, the squeeze.
import { useEffect, useState } from 'preact/hooks';
import { sClink, sNope } from '../../audio/sfx';
import type { ProblemInstance } from '../../learning/round';
import { DragonCanvas } from '../art/DragonCanvas';
import { DRAGON_COLOURS, type DragonLook } from '../art/dragon';
import { player } from '../game';
import type { Asking, Meet } from '../mix';
import { lookOf, riding } from '../roost/roost';
import { CAT_PICS } from '../words/lexicon';
import { gapped, LOOK_COLOURS, type Look } from '../words/frames';
import { useVoice, type VoiceScope } from '../voice';
import { isNeeded, type Question } from './problems';
import { help, lessonFor, type Lesson, type Show } from './teach';
import { meeting, MEET_TITLES } from './meetings';

type Current = ProblemInstance<Asking, string>;
const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');
export const myDragon = (): DragonLook => lookOf(riding(player.state.peek().roost));

/** Says the question once; marks when it's done. */
function useAsked(current: { signal: AbortSignal }, q: Question) {
  const voice = useVoice();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    void (async () => {
      await voice.say(...q.ask);
      if (!current.signal.aborted) setReady(true);
    })();
  }, []);
  return ready;
}

/** One tap, one answer; wrong answers are remembered so they fade. Big Letters Level 3 keeps the first right word it is given. */
function useAnswer(current: Current, ready: boolean, waiting: boolean) {
  const q = current.problem.q;
  const [wrong, setWrong] = useState<string[]>([]), [done, setDone] = useState<string | null>(null), [found, setFound] = useState<number[]>([]);
  const can = ready && !waiting && !done;
  function tap(answer: string) {
    if (!can || current.actions.busy) return;
    if (wrong.includes(answer)) return;
    sClink();
    if (q.answer === 'done' && /^w\d+$/.test(answer)) {
      const i = Number(answer.slice(1));
      if (found.includes(i)) return;
      if (isNeeded(q, i)) {
        const next = [...found, i];
        setFound(next);
        if (q.stage.type === 'tap' && next.length === q.stage.need.length && current.actions.submit('done') === 'correct') setDone('done');
        return;
      }
    }
    const verdict = current.actions.submit(answer);
    if (verdict === 'correct') setDone(answer);
    if (verdict === 'incorrect') setWrong(w => [...w, answer]);
    if (verdict === 'not-an-answer') sNope();
  }
  return { tap, wrong, done, can, found };
}

// ---------- what the lesson shows ----------

function Card({ show }: { show: Show | null }) {
  if (!show) return null;
  switch (show.kind) {
    case 'pic': return <div class="dr-card" aria-live="polite">{show.pic && <span class="dr-card-pic" aria-hidden="true">{show.pic}</span>}<b class="tablet">{show.word}</b></div>;
    case 'dragon': return (
      <div class="dr-card dragon" aria-live="polite">
        <DragonCanvas look={myDragon()} opts={{ act: show.act, look: show.look, flap: 1.2 }} label={show.word} />
        <b class="tablet">{show.word}</b>
      </div>
    );
    case 'plural': {
      const lit = [...show.many].map((ch, i) => <span key={i} class={show.step && ch !== show.one[i] ? 'changed' : ''}>{ch}</span>);
      return (
        <div class="dr-card plural" aria-live="polite">
          <span class="dr-card-pic" aria-hidden="true">{show.pic}{show.step ? <span class="pop-in">{show.pic}</span> : null}</span>
          <b class="tablet">{show.step ? lit : show.one}</b>
        </div>
      );
    }
    case 'calendar': return (
      <div class="dr-card calendar" aria-live="polite">
        <span class={cls('dr-page', show.step > 0 && 'flip')} aria-hidden="true">{show.step ? (show.time === 'tomorrow' ? '➡️' : '⬅️') : '📅'}</span>
        <b class="tablet">{show.step ? show.then : show.now}</b>
      </div>
    );
    case 'squeeze': {
      const [a, b] = show.from.split(' ') as [string, string];
      const at = b.indexOf(show.gone), dropped = (i: number) => at >= 0 && i >= at && i < at + show.gone.length;
      return (
        <div class={cls('dr-card', 'squeeze', `s${show.step}`)} aria-live="polite">
          {show.step < 2
            ? <b class="tablet"><span>{a}</span> <span>{show.step ? [...b].map((ch, i) => <span key={i} class={dropped(i) ? 'drop' : ''}>{ch}</span>) : b}</span></b>
            : <b class="tablet">{[...show.word].map((ch, i) => <span key={i} class={ch === "'" ? 'apos' : ''}>{ch}</span>)}</b>}
        </div>
      );
    }
    case 'capital': return <div class="dr-card capital" aria-live="polite"><b class="tablet"><span class={cls('first', show.step > 0 && 'grow')}>{show.step ? show.word[0] : show.word[0]!.toLowerCase()}</span>{show.word.slice(1)}</b></div>;
    case 'rule': return <div class="dr-card rule" aria-live="polite"><b>{show.line}</b></div>;
  }
}

function Shell({ current, q, ready, lesson, children, controls }: { current: Current; q: Question; ready: boolean; lesson: Lesson; children: preact.ComponentChildren; controls?: preact.ComponentChildren }) {
  const voice = useVoice();
  return (
    <div class={cls('game', 'dr', `k-${q.kind}`, `lv-${q.level}`, `st-${q.stage.type}`)} data-ready={ready ? 'yes' : 'no'}>
      <div class="ask">
        <button class="say-btn" aria-label="Say it again" onClick={() => void sayAgain(voice, q)}>🔊</button>
        <h2>{q.text}</h2>
        <button class="help-btn" aria-label="Help" onClick={() => current.actions.help(signal => help(current.problem, signal))}>🔎</button>
      </div>
      <div class="dr-body">
        <div class="dr-stage">{children}<Card show={lesson.show.value} /></div>
        {controls && <div class="dr-controls">{controls}</div>}
      </div>
    </div>
  );
}
const sayAgain = (v: VoiceScope, q: Question) => v.say(...q.ask);

function Choices({ q, answer, lesson, wide }: { q: Question; answer: ReturnType<typeof useAnswer>; lesson: Lesson; wide?: boolean }) {
  const hint = lesson.hint.value;
  return (
    <div class={cls('choices', 'dr-choices', `n${q.choices!.length}`, wide && 'wide')}>
      {q.choices!.map(c => (
        <button key={c} class={cls('choice', 'dr-choice', 'tablet', answer.wrong.includes(c) && 'wrong', (answer.done === c || hint === c) && 'right')} aria-label={c} onClick={() => answer.tap(c)}>
          {q.stage.type === 'sort' && <span class="e" aria-hidden="true">{CAT_PICS[c as keyof typeof CAT_PICS]}</span>}
          <span class="nm">{c}</span>
        </button>
      ))}
    </div>
  );
}

/** A sentence of word tablets; in a tap question each is a button. */
function Sentence({ q, answer, lesson }: { q: Question; answer: ReturnType<typeof useAnswer>; lesson: Lesson }) {
  const st = q.stage;
  if (st.type !== 'tap') return null;
  const hint = lesson.hint.value;
  return (
    <div class="dr-sentence">
      {st.shown.map((w, i) => {
        const id = `w${i}`, got = answer.found.includes(i) || answer.done === id || (answer.done === 'done' && isNeeded(q, i));
        const text = got && q.kind === 'capital' ? w.text.charAt(0).toUpperCase() + w.text.slice(1) : w.text;
        return (
          <button key={i} class={cls('dr-word', 'tablet', answer.wrong.includes(id) && 'wrong', (got || hint === id) && 'right', lesson.said.value === id && 'said')}
            aria-label={text} onClick={() => answer.tap(id)}>{text}{i === st.shown.length - 1 && <span class="end">{st.s.end}</span>}</button>
        );
      })}
    </div>
  );
}

function Gap({ q, answer }: { q: Question; answer: ReturnType<typeof useAnswer> }) {
  const st = q.stage;
  if (st.type !== 'gap') return null;
  const [before, after] = gapped(st.f).split('___') as [string, string];
  return <div class="dr-sentence gap"><span class="tablet plain">{before.trim()}</span><span class={cls('dr-gap', answer.done && 'filled')}>{answer.done ?? '?'}</span><span class="tablet plain">{after.trim()}</span></div>;
}

function Looks({ q, answer }: { q: Question; answer: ReturnType<typeof useAnswer> }) {
  const st = q.stage;
  if (st.type !== 'looks') return null;
  const base = myDragon();
  const opts = (looks: readonly Look[]) => {
    const v = (d: Look['dim']) => looks.find(l => l.dim === d)!.value;
    const colour = DRAGON_COLOURS.indexOf(LOOK_COLOURS[v('colour')] as never);
    return {
      look: { ...base, colour: colour >= 0 ? colour : 0 },
      o: { mood: v('mood') === 'unhappy' ? 'unhappy' as const : 'happy' as const, muddy: v('mud') === 'muddy', wingSize: v('tail') === 'long' ? 1.35 : .6, paint: LOOK_COLOURS[v('colour')] },
      big: v('size') === 'big',
    };
  };
  return (
    <div class="dr-looks">
      {st.dragons.map((d, i) => { const x = opts(d); return (
        <div key={i} class={cls('dr-look', i === st.point && 'this', x.big ? 'big' : 'little', answer.done && i === st.point && 'right')}>
          {i === st.point && <span class="dr-arrow" aria-hidden="true">⬇️</span>}
          <DragonCanvas look={x.look} opts={{ ...x.o, flap: 1 }} label={i === st.point ? 'This dragon' : 'The other dragon'} />
        </div>
      ); })}
    </div>
  );
}

function Apostrophe({ q, answer, lesson }: { q: Question; answer: ReturnType<typeof useAnswer>; lesson: Lesson }) {
  const st = q.stage;
  if (st.type !== 'apostrophe') return null;
  const letters = [...st.letters], hint = lesson.hint.value;
  return (
    <div class="dr-apostrophe tablet">
      {letters.map((ch, i) => (
        <span key={i} class="dr-ap">
          {i > 0 && <button class={cls('dr-slot', answer.wrong.includes(`g${i}`) && 'wrong', (answer.done === `g${i}` || hint === `g${i}`) && 'right')} aria-label={`Gap ${i}`} onClick={() => answer.tap(`g${i}`)}>{answer.done === `g${i}` ? "'" : ''}</button>}
          <span class="dr-letter">{ch}</span>
        </span>
      ))}
    </div>
  );
}

export function QuestionView({ current, waiting }: { current: Current; waiting: boolean }) {
  const q = current.problem.q, st = q.stage;
  const ready = useAsked(current, q), lesson = lessonFor(current.signal), answer = useAnswer(current, ready, waiting);
  let stage: preact.ComponentChildren = null, controls: preact.ComponentChildren = null;
  switch (st.type) {
    case 'words': controls = <Choices q={q} answer={answer} lesson={lesson} />; stage = <DragonCanvas look={myDragon()} opts={{ flap: 1 }} class="dr-mascot" />; break;
    case 'tap': stage = <Sentence q={q} answer={answer} lesson={lesson} />; break;
    case 'sort': stage = <b class="tablet big">{st.word}</b>; controls = <Choices q={q} answer={answer} lesson={lesson} />; break;
    case 'gap': stage = <Gap q={q} answer={answer} />; controls = <Choices q={q} answer={answer} lesson={lesson} />; break;
    case 'looks': stage = <Looks q={q} answer={answer} />; controls = <Choices q={q} answer={answer} lesson={lesson} wide />; break;
    case 'plural': stage = <div class="dr-one"><span class="e" aria-hidden="true">{st.pic}</span><b class="tablet big">{st.one}</b></div>; controls = <Choices q={q} answer={answer} lesson={lesson} />; break;
    case 'squeeze': stage = <b class="tablet big">{st.show}</b>; controls = <Choices q={q} answer={answer} lesson={lesson} />; break;
    case 'apostrophe': stage = <Apostrophe q={q} answer={answer} lesson={lesson} />; break;
    case 'squeeze3': {
      const words = st.text.split(' ');
      stage = <div class="dr-sentence">{words.map((w, i) => <span key={i} class={cls('tablet', 'plain', (i === st.at || i === st.at + 1) && 'pair')}>{w}</span>)}</div>;
      controls = <Choices q={q} answer={answer} lesson={lesson} />;
      break;
    }
  }
  return <Shell current={current} q={q} ready={answer.can} lesson={lesson} controls={controls}>{stage}</Shell>;
}

// ---------- the Meetings ----------

export function MeetView({ current, waiting }: { current: ProblemInstance<Meet, string>; waiting: boolean }) {
  const voice = useVoice(), m = current.problem.meeting;
  const [ready, setReady] = useState(false), [show, setShow] = useState<Show | null>(null);
  useEffect(() => {
    void (async () => {
      for (const beat of meeting(m)) {
        if (!voice.active) return;
        setShow(beat.show);
        if (beat.say.length) await voice.say(...beat.say); else await voice.wait(700);
      }
      if (voice.active) { await voice.say('Tap Next!'); if (!current.signal.aborted) setReady(true); }
    })();
  }, []);
  const go = () => { if (ready && !waiting && !current.actions.busy) current.actions.submit('ok'); };
  return (
    <div class={cls('game', 'dr', 'meet', `k-${m}`)} data-ready={ready && !waiting ? 'yes' : 'no'}>
      <div class="ask"><h2>{MEET_TITLES[m]}</h2></div>
      <div class="dr-body">
        <div class="dr-stage dr-meet">{show ? <Card show={show} /> : <DragonCanvas look={myDragon()} opts={{ flap: 1.2, act: 'hop' }} class="dr-mascot" />}</div>
        <div class="dr-controls"><button class={cls('big-btn', 'go', 'go-btn', ready && 'pulse')} aria-label="Next" onClick={go}><span class="e">▶</span><span class="go-word">Next</span></button></div>
      </div>
    </div>
  );
}
