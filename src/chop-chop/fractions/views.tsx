// The six fraction questions on screen. Every question is spoken as it appears (🔊 says it again), pictures are what he
// taps wherever they can be, written answers read aloud while they light up, and 🔎 Help walks through the picture.
import { useEffect, useState } from 'preact/hooks';
import type { ProblemInstance } from '../../learning/round';
import { speaking, useVoice, type Item } from '../voice';
import {
  colorLine, cookiesAsk, findLine, fracWord, friendsShare, key, numberPhrase, same, unit, whichBigger, whichFair, type Frac,
} from './fraction';
import { cutInto } from './fraction';
import { equalPicture, Picture } from './Picture';
import { SAME, type BiggerProblem, type ColorProblem, type FairProblem, type FindProblem, type NameProblem, type ShareProblem } from './problems';
import {
  helpWith, lessonFor, teachBigger, teachColor, teachFair, teachFind, teachName, teachShare, type Lesson,
} from './teach';

export function Ask({ text, speech }: { text: string; speech: Item[] }) {
  const { say } = useVoice();
  useEffect(() => { void say(...speech); }, []);
  return (
    <div class="ask">
      <button class="say-btn" aria-label="Say it again" onClick={() => void say(...speech)}>🔊</button>
      <h2>{text}</h2>
    </div>
  );
}

const Help = ({ run }: { run(): void }) => <button class="help-btn" onClick={run}>🔎 Help</button>;
const all = (n: number) => Array.from({ length: n }, (_, i) => i);
const litFor = (lesson: Lesson, i: number) => (lesson.pick.value === i ? lesson.lit.value : []);
const labelsFor = (lesson: Lesson, i: number) => (lesson.pick.value === i ? lesson.labels.value ?? undefined : undefined);

/** Answers tapped from several pictures: which ones he got wrong, and whether he's done. */
function usePick(current: ProblemInstance<unknown, string>) {
  const voice = useVoice();
  const [wrong, setWrong] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  function tap(answer: string) {
    if (!voice.active || current.signal.aborted || done || wrong.includes(answer)) return;
    const verdict = current.actions.submit(answer);
    if (verdict === 'correct') setDone(true);
    if (verdict === 'incorrect') setWrong([...wrong, answer]);
  }
  return { wrong, done, tap };
}

/** Fair Shares: three of the same food, one cut into equal pieces. */
export function FairView({ current }: { current: ProblemInstance<FairProblem, string> }) {
  const p = current.problem, lesson = lessonFor(current.signal), { wrong, done, tap } = usePick(current);
  return (
    <div class="game">
      <Ask text={`Which ${p.food} is cut fairly?`} speech={[whichFair(p.food)]} />
      <div class="pictures">
        {p.pictures.map((pic, i) => (
          <button key={i} class={`pic-btn ${wrong.includes(String(i)) ? 'wrong' : ''} ${done && i === p.answer ? 'right' : ''} ${lesson.pick.value === i ? 'lit' : ''}`}
            aria-label={`Picture ${i + 1}`} disabled={wrong.includes(String(i))} onClick={() => tap(String(i))}>
            <Picture picture={pic} lit={litFor(lesson, i)} />
          </button>
        ))}
      </div>
      <div class="helpers"><Help run={() => current.actions.help(signal => helpWith(teachFair)(p, signal))} /></div>
    </div>
  );
}

/** Name the Piece: one food in equal pieces, one coloured; three names read aloud. */
export function NameView({ current }: { current: ProblemInstance<NameProblem, string> }) {
  const p = current.problem, lesson = lessonFor(current.signal), { wrong, done, tap } = usePick(current);
  const speech: Item[] = [cutInto(p.picture.food, p.d), 'What is one piece called?', ...p.choices.map(d => ({ parts: [fracWord(unit(d))], light: `n${d}` }))];
  return (
    <div class="game words-q">
      <Ask text="What is one piece called?" speech={speech} />
      <div class="big-picture"><Picture picture={p.picture} lit={lesson.lit.value} labels={lesson.labels.value ?? undefined} /></div>
      <div class="choices words">
        {p.choices.map(d => {
          const a = `1/${d}`;
          return (
            <button key={d} class={`choice ${wrong.includes(a) ? 'wrong' : ''} ${done && d === p.d ? 'right' : ''} ${speaking.value === `n${d}` ? 'speaking' : ''}`}
              disabled={wrong.includes(a)} onClick={() => tap(a)}>{fracWord(unit(d))}</button>
          );
        })}
      </div>
      <div class="helpers"><Help run={() => current.actions.help(signal => helpWith(teachName)(p, signal))} /></div>
    </div>
  );
}

/** Find the Part: three pictures with some pieces coloured; one shows the part he hears. */
export function FindView({ current }: { current: ProblemInstance<FindProblem, string> }) {
  const p = current.problem, lesson = lessonFor(current.signal), { wrong, done, tap } = usePick(current);
  return (
    <div class="game">
      <Ask text={`Find ${fracWord(p.target)}`} speech={[findLine(p.target)]} />
      <div class="pictures">
        {p.choices.map((c, i) => (
          <button key={key(c)} class={`pic-btn ${wrong.includes(key(c)) ? 'wrong' : ''} ${done && same(c, p.target) ? 'right' : ''} ${lesson.pick.value === i ? 'lit' : ''}`}
            aria-label={`Picture ${i + 1}`} data-part={key(c)} disabled={wrong.includes(key(c))} onClick={() => tap(key(c))}>
            <Picture picture={equalPicture(p.food, c.d, c.n)} lit={litFor(lesson, i)} labels={labelsFor(lesson, i)} />
          </button>
        ))}
      </div>
      <div class="helpers"><Help run={() => current.actions.help(signal => helpWith(teachFind)(p, signal))} /></div>
    </div>
  );
}

/** Color the Part: tap pieces to colour them in (tap again to rub one out), then ✓. */
export function ColorView({ current }: { current: ProblemInstance<ColorProblem, string> }) {
  const voice = useVoice(), p = current.problem, lesson = lessonFor(current.signal);
  const [colored, setColored] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const shown = lesson.show.value;
  useEffect(() => { if (shown !== null) setColored(all(shown)); }, [shown]); // teaching colours the right number in
  function tapPiece(i: number) {
    if (!voice.active || current.signal.aborted || done || current.actions.busy) return;
    setColored(colored.includes(i) ? colored.filter(x => x !== i) : [...colored, i]);
  }
  function check() {
    if (!voice.active || current.signal.aborted || done) return;
    if (!colored.length) { void voice.say('Color some pieces!', 'Tap the pieces to color them.'); return; }
    const verdict = current.actions.submit(`${colored.length}/${p.d}`);
    if (verdict === 'correct') setDone(true);
  }
  return (
    <div class="game set">
      <Ask text={`Color ${fracWord(p.target)}`} speech={[colorLine(p.target, p.food)]} />
      <div class={`big-picture ${done ? 'right' : ''}`}>
        <Picture picture={equalPicture(p.food, p.d)} colored={colored} labels={lesson.labels.value ?? undefined} onTap={tapPiece} />
      </div>
      <div class="helpers">
        <Help run={() => current.actions.help(signal => helpWith(teachColor)(p, signal))} />
        <button class="big-btn go check-btn" aria-label="Done" onClick={check}>✓</button>
      </div>
    </div>
  );
}

/** Bigger Piece: two pictures (or, at Level 3, two parts read aloud and "the same"). */
export function BiggerView({ current }: { current: ProblemInstance<BiggerProblem, string> }) {
  const p = current.problem, lesson = lessonFor(current.signal), { wrong, done, tap } = usePick(current);
  const parts: [Frac, string][] = [[p.a, key(p.a)], [p.b, key(p.b)]];
  const right = same(p.a, p.b) ? SAME : (p.a.n * p.b.d > p.b.n * p.a.d ? key(p.a) : key(p.b));
  const pictures = !p.words || lesson.reveal.value;
  const ask = whichBigger(p.a, p.b);
  const speech: Item[] = p.words ? [ask, ...parts.map(([f, k]) => ({ parts: [fracWord(f)], light: `b${k}` })), { parts: ['They are the same!'], light: 'bsame' }] : [ask];
  return (
    <div class="game">
      <Ask text="Which is bigger?" speech={speech} />
      {pictures && (
        <div class="pictures two">
          {parts.map(([f, k], i) => (
            <button key={k} class={`pic-btn ${wrong.includes(k) ? 'wrong' : ''} ${done && right === k ? 'right' : ''} ${lesson.pick.value === i ? 'lit' : ''}`}
              aria-label={fracWord(f)} disabled={p.words || wrong.includes(k)} onClick={() => tap(k)}>
              <Picture picture={equalPicture(p.food, f.d, f.n)} lit={litFor(lesson, i)} />
              <span class="pic-name">{fracWord(f)}</span>
            </button>
          ))}
        </div>
      )}
      {p.words && (
        <div class="choices words">
          {[...parts.map(([f, k]) => [fracWord(f), k] as const), ['the same', SAME] as const].map(([text, a]) => (
            <button key={a} class={`choice ${wrong.includes(a) ? 'wrong' : ''} ${done && right === a ? 'right' : ''} ${speaking.value === `b${a}` ? 'speaking' : ''}`}
              disabled={wrong.includes(a)} onClick={() => tap(a)}>{text}</button>
          ))}
        </div>
      )}
      <div class="helpers"><Help run={() => current.actions.help(signal => helpWith(teachBigger)(p, signal))} /></div>
    </div>
  );
}

/** Share It: friends around a food (how many pieces?), or a pile of cookies and plates (how many do you get?). */
export function ShareView({ current }: { current: ProblemInstance<ShareProblem, string> }) {
  const p = current.problem, lesson = lessonFor(current.signal), { wrong, done, tap } = usePick(current);
  const ask = 'friends' in p ? friendsShare(p.friends, p.food) : cookiesAsk(p.total, unit(p.d));
  const speech: Item[] = [ask, ...p.choices.map(n => ({ parts: [numberPhrase(n)], light: `s${n}` }))];
  const dealt = lesson.dealt.value;
  return (
    <div class="game share">
      <Ask text={'friends' in p ? `${p.friends} friends share a ${p.food}` : `${p.total} cookies: you get ${fracWord(unit(p.d))}`} speech={speech} />
      {'friends' in p ? (
        <div class="share-scene">
          <div class="friends">{all(p.friends).map(i => <span key={i} class={`friend ${lesson.lit.value.includes(i) ? 'lit' : ''}`}>{['🧒', '👧', '👦', '🧒🏽'][i % 4]}</span>)}</div>
          <div class="share-food">
            <Picture picture={equalPicture(p.food, lesson.reveal.value ? p.friends : 1)} lit={lesson.lit.value} labels={lesson.labels.value ?? undefined} />
          </div>
        </div>
      ) : (
        <div class="share-scene">
          <div class="pile">{all(p.total - dealt).map(i => <span key={i} class="cookie">🍪</span>)}</div>
          <div class="plates">
            {all(p.d).map(k => {
              const on = Math.floor(dealt / p.d) + (k < dealt % p.d ? 1 : 0);
              return <div key={k} class={`plate ${k === 0 ? 'mine' : ''} ${lesson.lit.value.includes(k) ? 'lit' : ''}`}>{all(on).map(i => <span key={i} class="cookie">🍪</span>)}{k === 0 && <span class="you">⭐</span>}</div>;
            })}
          </div>
        </div>
      )}
      <div class="choices numbers">
        {p.choices.map(n => (
          <button key={n} class={`choice ${wrong.includes(String(n)) ? 'wrong' : ''} ${done && n === p.answer ? 'right' : ''} ${speaking.value === `s${n}` ? 'speaking' : ''}`}
            disabled={wrong.includes(String(n))} onClick={() => tap(String(n))}>{n}</button>
        ))}
      </div>
      <div class="helpers"><Help run={() => current.actions.help(signal => helpWith(teachShare)(p, signal))} /></div>
    </div>
  );
}
