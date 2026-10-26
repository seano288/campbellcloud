// The six sight-word questions on screen, and meeting a new word. Every question is spoken as it appears (🔊 says it
// again), words are big lowercase cards in a school font (single-storey a and g), and 🔎 Help teaches the word. The word
// he's asked about is never written in the question itself: he hears it, and finds it.
import { useEffect, useState } from 'preact/hooks';
import { sClink } from '../../audio/sfx';
import type { ProblemInstance } from '../../learning/round';
import { findLine, huntLine, makeLine } from '../phrases';
import { speaking, useVoice, type Item } from '../voice';
import { infoOf, letterLine, type AnyWord, type Word } from './list';
import { sentenceOf, type FillProblem, type HearProblem, type HuntProblem, type MeetProblem, type ReadProblem, type SentenceProblem, type SpellProblem } from './problems';
import { fillAsk, fillHelp, hearHelp, helpWith, huntHelp, lessonFor, readHelp, sentenceHelp, spellHelp, teachMeet, type Lesson } from './teach';

/** The question, said as it appears (unless `quiet`) and again on 🔊. */
export function Ask({ text, speech, quiet = false }: { text: string; speech: Item[]; quiet?: boolean }) {
  const { say } = useVoice();
  useEffect(() => { if (!quiet) void say(...speech); }, []);
  return (
    <div class="ask">
      <button class="say-btn" aria-label="Say it again" onClick={() => void say(...speech)}>🔊</button>
      <h2>{text}</h2>
    </div>
  );
}

const Help = ({ run }: { run(): void }) => <button class="help-btn" aria-label="Help" onClick={run}>🔎</button>;

/** A word in the school font, letter by letter: one can be lit (it's being named), and a heart word's tricky letters get a heart. */
export function Letters({ word, shown = word, lit = null, heart = false }: { word: AnyWord; shown?: string; lit?: number | null; heart?: boolean }) {
  const hearts = heart ? infoOf(word as Word).heart : [];
  return (
    <span class="sw letters" aria-label={shown}>
      {[...shown].map((c, i) => (
        <span key={i} class={`ltr ${lit === i ? 'lit' : ''} ${hearts.includes(i) ? 'heart' : ''}`} aria-hidden="true">{c}</span>
      ))}
    </span>
  );
}

/** The big word being taught, spelled out over the question. */
function TeachPanel({ lesson }: { lesson: Lesson }) {
  const p = lesson.panel.value;
  if (!p) return null;
  return <div class="teach-panel" aria-live="polite"><Letters word={p.word} lit={p.letter} heart={p.heart} /></div>;
}

/** Answers tapped from several choices: which ones he got wrong, and whether he's done. */
function usePick(current: ProblemInstance<unknown, string>) {
  const voice = useVoice();
  const [wrong, setWrong] = useState<number[]>([]);
  const [done, setDone] = useState<number | null>(null);
  function tap(i: number) {
    if (!voice.active || current.signal.aborted || done !== null || wrong.includes(i)) return;
    const verdict = current.actions.submit(String(i));
    if (verdict === 'correct') setDone(i);
    if (verdict === 'incorrect') setWrong([...wrong, i]);
  }
  return { wrong, done, tap };
}
const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');

/** Meeting a new word: shown big, said, spelled letter by letter and used in a sentence; then he taps it. */
export function MeetView({ current }: { current: ProblemInstance<MeetProblem, string> }) {
  const voice = useVoice(), p = current.problem, lesson = lessonFor(current.signal);
  const [ready, setReady] = useState(false);
  const [tapped, setTapped] = useState(false);
  useEffect(() => {
    void (async () => {
      await teachMeet(p, lesson, lesson.run.start());
      if (current.signal.aborted) return;
      lesson.panel.value = null;
      setReady(true);
      await voice.say('Tap the word!');
    })();
  }, []);
  function tap() {
    if (!ready || !voice.active || current.signal.aborted || tapped) return;
    if (current.actions.submit('0') === 'correct') setTapped(true); // the Round says the word (src/sight-squad/round.ts)
  }
  const panel = lesson.panel.value, sentence = p.sentence && lesson.sentence.value ? sentenceOf(p.sentence) : null;
  return (
    <div class="game meet">
      <Ask text={ready ? 'Tap the word!' : 'A new word!'} speech={ready ? ['Tap the word!'] : []} quiet />
      <button class={cls('meet-word', ready && !tapped && 'pulse', tapped && 'right')} aria-label={p.target} onClick={tap}>
        <Letters word={p.target} lit={panel?.letter ?? null} heart={!!panel?.heart || ready} />
      </button>
      {sentence && (
        <div class="sentence">
          {sentence.tokens.map((t, i) => <span key={i} class={cls('tok', lesson.lit.value.includes(i) && 'lit')}><span class="sw">{t.shown}</span></span>)}
        </div>
      )}
      <div class="helpers" />
    </div>
  );
}

/** 👂 Find It: he hears a word and taps it. */
export function HearView({ current }: { current: ProblemInstance<HearProblem, string> }) {
  const p = current.problem, lesson = lessonFor(current.signal), { wrong, done, tap } = usePick(current);
  return (
    <div class="game hear">
      <Ask text="Find the word you hear" speech={[findLine(p.target)]} />
      <TeachPanel lesson={lesson} />
      <div class={`words n${p.choices.length}`}>
        {p.choices.map((w, i) => (
          <button key={w} class={cls('word-btn', wrong.includes(i) && 'wrong', done === i && 'right', lesson.lit.value.includes(i) && 'lit')}
            disabled={wrong.includes(i)} onClick={() => tap(i)}><span class="sw">{w}</span></button>
        ))}
      </div>
      <div class="helpers"><Help run={() => current.actions.help(signal => helpWith(hearHelp.target, hearHelp.right, hearHelp.ask)(p, signal))} /></div>
    </div>
  );
}

/** 👀 Read It: one word on screen, not said; three are read aloud while their buttons light up, and he taps the one it is. */
const READ_ICONS = ['🪖', '⭐', '🚩'];
export function ReadView({ current }: { current: ProblemInstance<ReadProblem, string> }) {
  const p = current.problem, lesson = lessonFor(current.signal), { wrong, done, tap } = usePick(current);
  const speech: Item[] = ['Which word is this?', ...p.choices.map((w, i) => ({ parts: [w], light: `r${i}` }))];
  const panel = lesson.panel.value;
  return (
    <div class="game read">
      <Ask text="Which word is this?" speech={speech} />
      <div class={cls('big-word', done !== null && 'right')}><Letters word={p.target} lit={panel?.letter ?? null} heart={!!panel?.heart} /></div>
      <div class="said">
        {p.choices.map((w, i) => (
          <button key={w} class={cls('said-btn', wrong.includes(i) && 'wrong', done === i && 'right', lesson.lit.value.includes(i) && 'lit', speaking.value === `r${i}` && 'speaking')}
            aria-label={`Choice ${i + 1}`} disabled={wrong.includes(i)} onClick={() => tap(i)}>
            <span class="e">{READ_ICONS[i]}</span>
            {(done === i || wrong.includes(i)) && <span class="sw said-word">{w}</span>}
          </button>
        ))}
      </div>
      <div class="helpers"><Help run={() => current.actions.help(signal => helpWith(readHelp.target, readHelp.right, readHelp.ask)(p, signal))} /></div>
    </div>
  );
}

/** 🔎 Word Hunt: a grid of words; he taps every one that says the word he hears. */
export function HuntView({ current }: { current: ProblemInstance<HuntProblem, string> }) {
  const voice = useVoice(), p = current.problem, lesson = lessonFor(current.signal);
  const [found, setFound] = useState<number[]>([]);
  const [wrong, setWrong] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  function tap(i: number) {
    if (!voice.active || current.signal.aborted || done || found.includes(i) || wrong.includes(i)) return;
    const verdict = current.actions.submit([...found, i].join(','));
    if (verdict === 'correct') { setFound([...found, i]); setDone(true); }
    else if (verdict === 'not-an-answer') { setFound([...found, i]); sClink(); void voice.say('You found one!'); }
    else if (verdict === 'incorrect') setWrong([...wrong, i]);
  }
  return (
    <div class="game hunt">
      <Ask text="Find every word you hear" speech={[huntLine(p.target)]} />
      <TeachPanel lesson={lesson} />
      <div class={`hunt-grid n${p.cards.length}`}>
        {p.cards.map((c, i) => (
          <button key={i} class={cls('word-btn', 'card-btn', found.includes(i) && 'found', wrong.includes(i) && 'wrong', lesson.lit.value.includes(i) && !found.includes(i) && 'lit')}
            disabled={wrong.includes(i) || found.includes(i)} onClick={() => tap(i)}>
            <span class="sw">{c.shown}</span>{found.includes(i) && <span class="stamp">✓</span>}
          </button>
        ))}
      </div>
      <div class="helpers"><Help run={() => current.actions.help(signal => helpWith(huntHelp.target, huntHelp.right, huntHelp.ask)(p, signal))} /></div>
    </div>
  );
}

/** 🔤 Build It: he taps the letters in order to make the word he hears (at Level 1 they're shown faintly in the slots). */
export function SpellView({ current }: { current: ProblemInstance<SpellProblem, string> }) {
  const voice = useVoice(), p = current.problem, lesson = lessonFor(current.signal), word = p.target.toLowerCase();
  const [typed, setTyped] = useState('');
  const [used, setUsed] = useState<number[]>([]);
  const [shake, setShake] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  function tap(i: number) {
    if (!voice.active || current.signal.aborted || done || used.includes(i) || current.actions.busy) return;
    const next = typed + p.tiles[i]!, verdict = current.actions.submit(next);
    if (verdict === 'correct' || verdict === 'not-an-answer') {
      setTyped(next); setUsed([...used, i]); sClink();
      if (verdict === 'correct') setDone(true); // the Round says the whole word (src/sight-squad/round.ts)
      else void voice.say(letterLine(p.tiles[i]!));
    } else if (verdict === 'incorrect') { setShake(i); setTimeout(() => setShake(null), 450); }
  }
  const panel = lesson.panel.value;
  return (
    <div class="game spell">
      <Ask text="Make the word you hear" speech={[makeLine(p.target)]} />
      <TeachPanel lesson={lesson} />
      <div class={cls('slots', done && 'right')} aria-label="The word so far">
        {[...word].map((c, i) => (
          <span key={i} class={cls('slot', i < typed.length && 'filled', panel?.letter === i && 'lit')}>
            <span class="sw">{i < typed.length ? typed[i] : p.ghost ? <span class="ghost">{c}</span> : ''}</span>
          </span>
        ))}
      </div>
      <div class="tiles">
        {p.tiles.map((c, i) => (
          <button key={i} class={cls('tile-btn', used.includes(i) && 'used', shake === i && 'wiggle')} aria-label={c} disabled={used.includes(i)} onClick={() => tap(i)}>
            <span class="sw">{c}</span>
          </button>
        ))}
      </div>
      <div class="helpers"><Help run={() => current.actions.help(signal => helpWith(spellHelp.target, spellHelp.right, spellHelp.ask)(p, signal))} /></div>
    </div>
  );
}

/** 📜 Sentence Hunt: a sentence is read to him, then he taps the word he hears in it. */
export function SentenceView({ current }: { current: ProblemInstance<SentenceProblem, string> }) {
  const p = current.problem, lesson = lessonFor(current.signal), { wrong, done, tap } = usePick(current), s = sentenceOf(p.sentence);
  return (
    <div class="game sentence-q">
      <Ask text="Find the word you hear" speech={['Listen.', p.sentence, findLine(p.target)]} />
      <TeachPanel lesson={lesson} />
      <div class="sentence big">
        {s.tokens.map((t, i) => (
          <button key={i} class={cls('tok', 'tok-btn', wrong.includes(i) && 'wrong', done === i && 'right', lesson.lit.value.includes(i) && 'lit')}
            disabled={wrong.includes(i)} onClick={() => tap(i)}><span class="sw">{t.shown}</span></button>
        ))}
      </div>
      <div class="helpers"><Help run={() => current.actions.help(signal => helpWith(sentenceHelp.target, sentenceHelp.right, sentenceHelp.ask)(p, signal))} /></div>
    </div>
  );
}

/** ✏️ Fill the Gap: a sentence with a word missing is read to him ("blank"), and he picks the written word that goes there. */
export function FillView({ current }: { current: ProblemInstance<FillProblem, string> }) {
  const p = current.problem, lesson = lessonFor(current.signal), { wrong, done, tap } = usePick(current), s = sentenceOf(p.sentence);
  const gapAt = s.tokens.findIndex(t => t.word === p.target);
  return (
    <div class="game fill">
      <Ask text="Which word is missing?" speech={fillAsk(p)} />
      <TeachPanel lesson={lesson} />
      <div class="sentence big">
        {s.tokens.map((t, i) => i === gapAt
          ? <span key={i} class={cls('tok', 'gap', done !== null && 'filled')}><span class="sw">{done !== null ? t.shown : ' '}</span></span>
          : <span key={i} class="tok"><span class="sw">{t.shown}</span></span>)}
      </div>
      <div class={`words n${p.choices.length}`}>
        {p.choices.map((w, i) => (
          <button key={w} class={cls('word-btn', wrong.includes(i) && 'wrong', done === i && 'right', lesson.lit.value.includes(i) && 'lit')}
            disabled={wrong.includes(i)} onClick={() => tap(i)}><span class="sw">{w}</span></button>
        ))}
      </div>
      <div class="helpers"><Help run={() => current.actions.help(signal => helpWith(fillHelp.target, fillHelp.right, fillHelp.ask)(p, signal))} /></div>
    </div>
  );
}
