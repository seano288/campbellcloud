// The questions on screen. The letter comes on cream paper with a stamp, and is not read out: he reads it. A speaker beside each sentence
// reads that sentence (and counts as help, as in Sentence Express's What Happened). When he taps "I read it", the question is said and
// its answers appear; the letter stays on screen while he answers. Written answers each have their own speaker. Taps wait until the
// question has been said. A miss is never marked with a red X: the lesson lights the letter (reading/teach.ts).
import { useEffect, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { sClink, sNope } from '../audio/sfx';
import type { ProblemInstance } from '../learning/round';
import { Diagram } from './art/Diagram';
import { Pic, Shown, baseWordPic } from './art/pics';
import { heard } from './game';
import { MODE_NAMES } from './learning';
import { isDiagram } from './mail/diagrams';
import { ORDER_SEP, type Passage } from './mail/index';
import { BASE_WORDS } from './mail/words';
import type { Asking, Meet } from './mix';
import { said, type Phrase } from './phrases';
import { letterOf, questionOf } from './reading/problems';
import { lessonFor, markListened, type Lesson } from './reading/teach';
import { createVoiceScope, useVoice } from './voice';

type Current = ProblemInstance<Asking, string>;
const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');

/** What he is told to read first. */
function readLine(p: Passage): Phrase {
  if (p.kind === 'fact') return 'Read the report.';
  if (p.kind === 'order' && !p.pics) return 'Read the sentences.';
  return 'Read the letter.';
}

/** A speaker: it reads the line (and counts as help: he had it read to him). */
function SayButton({ current, text, what, label, disabled }: { current: Current; text: string; what: 'sentences' | 'choices'; label: string; disabled: boolean }) {
  return (
    <button class="mb-say" aria-label={label} disabled={disabled} onClick={e => {
      e.stopPropagation();
      if (disabled || current.signal.aborted) return;
      markListened(current.signal);
      heard(what);
      current.actions.help(async signal => { await createVoiceScope(signal).say(said(text)); });
    }}>🔊</button>
  );
}

/** A sentence, a word at a time, so a lesson can light a word or a clue in it. */
function Sentence({ text, line, lesson }: { text: string; line: number; lesson: Lesson }) {
  const word = lesson.word.value, clue = lesson.clue.value?.toLowerCase() ?? null;
  const parts = text.split(/(\s+)/);
  // which words a lit clue covers
  const lower = text.toLowerCase(), clueAt = clue ? lower.indexOf(clue) : -1;
  let pos = 0, w = -1;
  return (
    <span class="mb-text" lang="en">{parts.map((p, i) => {
      const start = pos; pos += p.length;
      if (/^\s+$/.test(p)) return p;
      w++;
      const inClue = clueAt >= 0 && start >= clueAt && start < clueAt + clue!.length && new RegExp(`\\b${clue!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(lower);
      const lit = (word?.line === line && word.at === w) || inClue;
      return <span key={i} class={cls('mb-w', lit && 'lit')}>{p}</span>;
    })}</span>
  );
}

/** The letter: paper, a stamp, who it is to and from, and a speaker beside each sentence. For What Came Next at Levels 2 and 3 the
 *  sentences are mixed up and are what he taps; for "Which one does not belong?" he taps a sentence too. */
function Letter({ current, p, shown, lesson, tapLine, numbers, canSay, tapping }: {
  current: Current; p: Passage; shown: readonly number[]; lesson: Lesson; tapLine?: (i: number) => void; numbers?: Record<number, number>; canSay: boolean; tapping: boolean;
}) {
  const lit = lesson.lit.value, ordered = lesson.ordered.value;
  const order = ordered !== null && p.kind === 'order' && !p.pics ? p.lines.map((_, i) => i) : shown;
  return (
    <div class={cls('mb-letter', p.kind === 'fact' && 'report', tapping && 'tapping')}>
      <div class="mb-letter-head"><span class="mb-to" lang="en">{p.kind === 'fact' ? 'Fact File' : 'To the Commander'}</span><span class="mb-stamp" aria-hidden="true">🌙</span></div>
      <ol class="mb-lines">
        {order.map(i => {
          const line = p.lines[i]!, n = numbers?.[i];
          const body = <Sentence text={line} line={i} lesson={lesson} />;
          return (
            <li key={i} class={cls('mb-line', lit.includes(i) && 'lit', ordered !== null && i >= ordered && p.kind === 'order' && 'dim', n !== undefined && 'picked')}>
              <SayButton current={current} text={line} what="sentences" label={`Read sentence ${shown.indexOf(i) + 1}`} disabled={!canSay} />
              {tapLine ? <button class="mb-line-btn" aria-label={`Sentence ${shown.indexOf(i) + 1}`} onClick={() => tapLine(i)}>{n !== undefined && <b class="mb-num">{n}</b>}{body}</button> : body}
            </li>
          );
        })}
      </ol>
      {p.from !== 'Base' && <div class="mb-from" lang="en">from {p.from}</div>}
    </div>
  );
}

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

export function QuestionView({ current, waiting }: { current: Current; waiting: boolean }) {
  const voice = useVoice(), q = current.problem.q, p = letterOf(q), qq = questionOf(q), lesson = lessonFor(current.signal);
  const [stage, setStage] = useState<'intro' | 'reading' | 'asking' | 'ready'>('intro');
  const c = useChoice(current, stage === 'ready', waiting);
  const [picked, setPicked] = useState<number[]>([]);
  const hint = lesson.hint.value;

  useEffect(() => {
    void voice.say(readLine(p), 'Then tap I read it.').then(() => { if (!current.signal.aborted) setStage(s => (s === 'intro' ? 'reading' : s)); });
  }, []);
  // after a miss the order taps come back, for him to try again
  useEffect(() => { if (waiting) setPicked([]); }, [waiting]);

  const read = () => {
    if (stage !== 'reading' && stage !== 'intro') return;
    voice.cancel();
    setStage('asking');
    void voice.say(said(qq.ask)).then(() => { if (!current.signal.aborted) setStage('ready'); });
  };
  const askAgain = () => { if (stage === 'ready' || stage === 'asking') void voice.say(said(qq.ask)); };

  const n = p.lines.length, ordering = qq.form === 'order';
  function tapOrder(i: number) {
    if (!c.can || current.actions.busy) return;
    if (picked.includes(i)) { if (picked.at(-1) === i) setPicked(picked.slice(0, -1)); else sNope(); return; }
    sClink();
    const next = [...picked, i];
    setPicked(next);
    if (next.length === n) {
      const verdict = current.actions.submit(next.join(ORDER_SEP));
      if (verdict === 'not-an-answer') setPicked([]);
    }
  }
  const numbers = Object.fromEntries(picked.map((i, k) => [i, k + 1]));
  const tappingLines = stage === 'ready' && (qq.form === 'line' || (ordering && !p.pics));
  const lineTap = tappingLines ? (i: number) => (ordering ? tapOrder(i) : c.tap(String(i))) : undefined;
  const canSay = !waiting && !c.done;

  let answers: ComponentChildren = null;
  if (stage === 'ready' || stage === 'asking') {
    const live = stage === 'ready';
    if (ordering && p.pics) answers = (
      <div class="mb-choices pics">{q.choices.map(k => {
        const i = Number(k), num = numbers[i];
        return <button key={k} class={cls('mb-choice', 'pic', num !== undefined && 'picked', hint && hint.split(ORDER_SEP)[(lesson.ordered.value ?? 0) - 1] === k && 'hint')} aria-label={`Picture ${q.choices.indexOf(k) + 1}`} onClick={() => tapOrder(i)}>
          <Pic k={p.pics![i]!} />{num !== undefined && <b class="mb-num">{num}</b>}</button>;
      })}</div>
    );
    else if (ordering) answers = <div class="mb-tip">{picked.length ? `${picked.length} of ${n}` : 'Tap the sentences in order.'}</div>;
    else if (qq.form === 'line') answers = <div class="mb-tip">Tap the sentence.</div>;
    else if (qq.form === 'pic') answers = (
      <div class="mb-choices pics">{q.choices.map((k, i) => (
        <button key={k} class={cls('mb-choice', 'pic', c.wrong.includes(k) && 'wrong', (c.done === k || hint === k) && 'hint')} aria-label={`Picture ${i + 1}`} onClick={() => c.tap(k)}><Pic k={k} /></button>
      ))}</div>
    );
    else if (qq.form === 'label' && isDiagram(p.diagram)) answers = <Diagram id={p.diagram} onTap={part => c.tap(part)} lit={c.done ?? hint} wrong={c.wrong} disabled={!live} />;
    else answers = (
      <div class="mb-choices words">
        {qq.form === 'yn' && <div class="mb-says"><SayButton current={current} text={qq.says!} what="choices" label="Read it" disabled={!canSay} /><span class="mb-text" lang="en">“{qq.says}”</span></div>}
        {q.choices.map((w, i) => (
          <div key={w} class={cls('mb-word-row', c.wrong.includes(w) && 'wrong', (c.done === w || hint === w) && 'hint')}>
            <SayButton current={current} text={w} what="choices" label={`Read answer ${i + 1}`} disabled={!canSay} />
            <button class="mb-choice word" lang="en" aria-label={w} onClick={() => c.tap(w)}>{w}</button>
          </div>
        ))}
      </div>
    );
  }

  const ready = stage === 'ready' && !waiting && !c.done;
  return (
    <div class={cls('game', 'mb', `k-${p.kind}`, `l-${p.level}`, `f-${qq.form}`)} data-ready={ready ? 'yes' : stage === 'reading' && !waiting ? 'read' : 'no'}>
      <div class="ask mb-ask-bar">
        <span class="mb-kind" aria-hidden="true">{MODE_NAMES[p.kind]}</span>
        {stage === 'ready' || stage === 'asking' ? <>
          <button class="say-btn" aria-label="Say it again" onClick={askAgain}>🔊</button>
          <h2 lang="en">{qq.ask}</h2>
        </> : <h2>{p.kind === 'fact' ? 'A report!' : 'You have mail!'}</h2>}
      </div>
      <div class="mb-body">
        <Letter current={current} p={p} shown={q.shown} lesson={lesson} tapLine={lineTap} numbers={ordering && !p.pics ? numbers : undefined} canSay={canSay} tapping={!!lineTap} />
        <div class="mb-side">
          {stage === 'intro' || stage === 'reading'
            ? <button class={cls('big-btn', 'go', 'mb-read-btn', stage === 'reading' && 'pulse')} aria-label="I read it" onClick={read}><span class="e">✅</span><span class="go-word">I read it</span></button>
            : answers}
        </div>
      </div>
    </div>
  );
}

// ---------- Meetings: a group of base words, met with their pictures and the voice ----------

export function MeetView({ current, waiting }: { current: ProblemInstance<Meet, string>; waiting: boolean }) {
  const voice = useVoice(), group = Number(current.problem.meeting.slice(1)), words = BASE_WORDS.filter(b => b.group === group);
  const [ready, setReady] = useState(false), [lit, setLit] = useState(-1);
  useEffect(() => {
    void (async () => {
      await voice.say('Here are some new words!');
      for (let i = 0; i < words.length && voice.active; i++) { setLit(i); await voice.say(said(words[i]!.word)); await voice.wait(250); }
      setLit(words.length);
      if (voice.active) { await voice.say('Tap Go!'); if (!current.signal.aborted) setReady(true); }
    })();
  }, []);
  const say = (w: string, i: number) => { if (!voice.active) return; setLit(i); void voice.say(said(w)); };
  const go = () => { if (ready && !waiting && !current.actions.busy) current.actions.submit('ok'); };
  return (
    <div class="game mb meet" data-ready={ready && !waiting ? 'yes' : 'no'}>
      <div class="ask"><h2>New words</h2></div>
      <div class="mb-meet">
        <div class="mb-meet-words">{words.map((b, i) => (
          <button key={b.word} class={cls('mb-meet-word', (lit === i || lit >= words.length) && 'lit')} aria-label={b.word} onClick={() => say(b.word, i)}>
            <Shown show={baseWordPic(b.word)} size={52} /><span lang="en">{b.word}</span>
          </button>
        ))}</div>
        <button class={cls('big-btn', 'go', 'go-btn', ready && 'pulse')} aria-label="Go" onClick={go}><span class="e">▶</span><span class="go-word">Go</span></button>
      </div>
    </div>
  );
}
