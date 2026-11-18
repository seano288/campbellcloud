// The questions on screen. Every question is said as it appears (🔊 says it again) and taps wait until it has finished. Nothing here
// needs reading beyond numbers and prices; the pictures are emoji, the money is drawn as coins and bills, and the lesson for a miss
// (econ/teach.ts) draws on the same picture. Choices are taps; a sort is a tap on a picture and then a tap on its shelf.
import { useEffect, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { sClink } from '../audio/sfx';
import type { ProblemInstance } from '../learning/round';
import { Bill, Coin, CoinRows, Money, PriceTag } from './art/Money';
import { help, lessonFor, n, type Lesson } from './econ/teach';
import { readSort, sortAnswer, type Question, type EnoughProblem, type GoodsProblem, type JobProblem, type NeedProblem, type SaveProblem, type Shelf, type TotalProblem, type Worker } from './econ/problems';
import { ALL_PRICED, BUY_NEEDS, GOODS, jobOf, MADE, NEEDS, SERVICES, WANTS, workerEmoji, type Look } from './econ/things';
import type { Asking, Meet } from './mix';
import { thingName } from './econ/teach';
import { toolQ, userQ, type Phrase } from './phrases';
import { useVoice, type Item } from './voice';

type Current = ProblemInstance<Asking, string>;

/** Everything a question says aloud, in one place so the tests can check it: the question and its givens, never the choices. */
export function questionSpeech(q: Question): Item[] {
  const $ = (x: number, end: 'dollar.' | 'dollars.' = 'dollars.'): Item[] => [n(x), x === 1 ? 'dollar.' : end];
  switch (q.form) {
    case 'pick': {
      const line: Phrase = q.kind === 'need' ? (q.ask === 'need' ? 'Tap the one you need.' : 'A want is nice to have. Tap the want.') : q.ask === 'good' ? 'A good is a thing you can hold. Tap the good.' : 'A service is a job someone does for you. Tap the service.';
      return [line];
    }
    case 'sort': {
      const line: Phrase = q.kind === 'need' ? 'Put the needs on the heart shelf and the wants on the star shelf.' : 'Put the goods in the basket and the services by the helping hands.';
      return [line];
    }
    case 'first': return ['You have', ...$(q.have), 'You need', thingName(q.need), 'and you want', thingName(q.want), 'Which do you buy first?'];
    case 'who': return [q.kind === 'goods' ? (q.ask === 'service' ? 'Who gives a service?' : 'Who makes a good?') : jobOf(q.asked).ask];
    case 'tool': return [toolQ(jobOf(q.asked))];
    case 'user': return [userQ(jobOf(q.asked))];
    case 'role': { const m = MADE.find(x => x.id === q.good)!; return [q.ask === 'made' ? m.ask : m.bought]; }
    case 'sum': return [q.order.length === 3 ? 'How much for all three?' : 'How much for both?'];
    case 'which': return ['You have', ...$(q.have), 'Which one can you buy?'];
    case 'yesno': case 'left': return ['You have', ...$(q.have), priced(q.item).costs as Phrase, ...$(q.price), q.form === 'yesno' ? 'Do you have enough?' : 'How much is left?'];
    case 'more': return [priced(q.item).costs as Phrase, ...$(q.price), 'You have', ...$(q.have), 'How many more do you need?'];
    case 'days': return [...(q.start ? ['You have' as const, ...$(q.start)] : []), 'You earn', n(q.perDay), q.perDay === 1 ? 'dollar a day.' : 'dollars a day.', 'How many days until you have', n(q.goal), 'dollars?'];
    case 'both': return ['You have', ...$(q.have), priced(q.a.id).costs as Phrase, ...$(q.a.price), priced(q.b.id).costs as Phrase, ...$(q.b.price), 'Can you buy both?'];
  }
}
const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');
const priced = (id: string) => ALL_PRICED.find(p => p.id === id)!;

/** Says the question once, and marks when it's done. */
function useAsked(current: { signal: AbortSignal }, speech: readonly Item[]) {
  const voice = useVoice();
  const [ready, setReady] = useState(false);
  useEffect(() => { void voice.say(...speech).then(() => { if (!current.signal.aborted) setReady(true); }); }, []);
  return ready;
}

/** `ready`: the question has been said and taps count (the browser tour waits on it, as he does). */
function Shell({ current, kind, text, speech, stage, controls, ready }: {
  current: Current; kind: string; text: string; speech: readonly Item[]; stage: ComponentChildren; controls?: ComponentChildren; ready: boolean;
}) {
  const voice = useVoice();
  return (
    <div class={cls('game', 'ft', ...kind.split(' ').map(k => `k-${k}`))} data-ready={ready ? 'yes' : 'no'}>
      <div class="ask">
        <button class="say-btn" aria-label="Say it again" onClick={() => void voice.say(...speech)}>🔊</button>
        <h2>{text}</h2>
        <button class="help-btn" aria-label="Help" onClick={() => current.actions.help(() => help(current.problem, current.signal))}>🔎</button>
      </div>
      <div class="ft-body">
        <div class="ft-stage">{stage}</div>
        {controls && <div class="ft-controls">{controls}</div>}
      </div>
    </div>
  );
}

/** Taps for a choice-style question: one tap, one answer, the wrong ones fade. */
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
const state = (id: string, c: { wrong: string[]; done: string | null }, l: Lesson) =>
  cls(c.wrong.includes(id) && 'wrong', c.done === id && 'right', l.hint.value === id && 'hint', l.focus.value === id && 'focus');

/** Number choices, written as dollars ("$7") or plain (days). Not read out: he reads numbers. */
function NumberChoices({ choices, money = true, onTap, c, l }: { choices: readonly number[]; money?: boolean; onTap(a: string): void; c: { wrong: string[]; done: string | null }; l: Lesson }) {
  return (
    <div class="choices nums">
      {choices.map(x => <button key={x} class={cls('choice', state(String(x), c, l))} aria-label={money ? `${x} dollars` : String(x)} onClick={() => onTap(String(x))}>{money ? `$${x}` : x}</button>)}
    </div>
  );
}
function YesNo({ onTap, c, l }: { onTap(a: string): void; c: { wrong: string[]; done: string | null }; l: Lesson }) {
  return (
    <div class="choices yesno">
      <button class={cls('choice', 'thumb', state('yes', c, l))} aria-label="Yes" onClick={() => onTap('yes')}>👍</button>
      <button class={cls('choice', 'thumb', state('no', c, l))} aria-label="No" onClick={() => onTap('no')}>👎</button>
    </div>
  );
}

// ---------- pictures ----------

const emojiOf = (id: string) => ([...BUY_NEEDS, ...NEEDS, ...WANTS, ...GOODS] as readonly { id: string; emoji: string }[]).find(t => t.id === id)?.emoji;
/** A thing, or a service being done: the worker at work on something. */
export function Pic({ id, look, show }: { id: string; look?: Look; show?: string | null }) {
  const service = SERVICES.find(s => s.id === id);
  if (service) {
    const who = workerEmoji(service.who as never, look ?? { gender: 'person', tone: 2 });
    return <span class={cls('ft-pic', 'service', show === 'doing' && 'doing')} aria-hidden="true"><span class="who">{who}</span><span class="on">{service.on}</span></span>;
  }
  return <span class={cls('ft-pic', show === 'carry' && 'carry')} aria-hidden="true">{emojiOf(id) ?? priced(id)?.emoji}{show === 'carry' && <span class="hands">🤲</span>}</span>;
}
export function WorkerPic({ w, tool }: { w: Worker; tool: boolean }) {
  const j = jobOf(w.job);
  return <span class={cls('ft-worker', tool && 'with-tool')} aria-hidden="true"><span class="who">{workerEmoji(w.job, w.look)}</span>{tool && <span class="tool">{j.tool}</span>}</span>;
}
const jobLabel = (w: Worker) => jobOf(w.job).name.replace(/^the /, '');

// ---------- Need or Want, Goods and Services: tap one, or sort four ----------

/** Need or Want's lesson: the need slides onto the heart shelf, the want onto the star shelf. */
function LessonShelves({ need, want }: { need: string; want: string }) {
  return (
    <div class="ft-shelves lesson" aria-hidden="true">
      <div class="ft-shelf s-need lit"><span class="shelf-icon">❤️</span><span class="shelf-row"><span class="ft-pic slide-in">{emojiOf(need)}</span></span></div>
      <div class="ft-shelf s-want"><span class="shelf-icon">⭐</span><span class="shelf-row"><span class="ft-pic slide-in">{emojiOf(want)}</span></span></div>
    </div>
  );
}

const SHELVES: Record<'need' | 'goods', readonly [Shelf, string, string][]> = {
  need: [['need', '❤️', 'Need'], ['want', '⭐', 'Want']],
  goods: [['good', '🧺', 'Goods'], ['service', '🤝', 'Services']],
};

function PickView({ current, q, waiting }: { current: Current; q: Extract<NeedProblem | GoodsProblem, { form: 'pick' }>; waiting: boolean }) {
  const line = questionSpeech(q)[0] as Phrase;
  const speech = questionSpeech(q), ready = useAsked(current, speech), l = lessonFor(current.signal), c = useChoice(current, ready, waiting);
  const looks = q.kind === 'goods' ? q.looks : {};
  const shelves = q.kind === 'need' && l.show.value === 'shelves';
  const need = q.things.find(id => NEEDS.some(t => t.id === id))!, want = q.things.find(id => id !== need)!;
  return (
    <Shell current={current} ready={c.can} kind={`${q.kind} form-pick`} text={line} speech={speech}
      stage={<div class="ft-lesson-col">
        <div class="ft-pair">
          {q.things.map(id => (
            <button key={id} class={cls('ft-card', state(id, c, l))} aria-label={thingName(id)} onClick={() => c.tap(id)}>
              <Pic id={id} look={looks[id]} show={l.focus.value === id ? l.show.value : null} />
              {shelves && <span class="shelf-tag" aria-hidden="true">{id === need ? '❤️' : '⭐'}</span>}
            </button>
          ))}
        </div>
        {shelves && <LessonShelves need={need} want={want} />}
      </div>} />
  );
}

function SortView({ current, q, waiting }: { current: Current; q: Extract<NeedProblem | GoodsProblem, { form: 'sort' }>; waiting: boolean }) {
  const speech = questionSpeech(q), line = speech[0] as Phrase, ready = useAsked(current, speech), l = lessonFor(current.signal);
  const [placed, setPlaced] = useState<[string, Shelf][]>([]), [picked, setPicked] = useState<string | null>(null), [bounced, setBounced] = useState<string | null>(null), [done, setDone] = useState(false);
  const left = q.things.filter(id => !placed.some(([p]) => p === id)), sel = picked && left.includes(picked) ? picked : left[0] ?? null;
  const can = ready && !waiting && !done;
  const looks = q.kind === 'goods' ? q.looks : {};
  function pick(id: string) { if (can && left.includes(id)) { sClink(); setPicked(id); } }
  function shelve(s: Shelf) {
    if (!can || !sel || current.actions.busy) return;
    sClink();
    const verdict = current.actions.submit(sortAnswer([...placed, [sel, s]]));
    if (verdict === 'incorrect') { setBounced(sel); setTimeout(() => setBounced(null), 700); return; }
    if (verdict === 'ignored') return;
    setPlaced(p => [...p, [sel, s]]);
    setPicked(null);
    if (verdict === 'correct') setDone(true);
  }
  void readSort;
  return (
    <Shell current={current} ready={can} kind={`${q.kind} form-sort`} text={line} speech={speech}
      stage={<div class="ft-sort">
        <div class="ft-counter">
          {left.map(id => (
            <button key={id} class={cls('ft-card', 'small', id === sel && 'picked', bounced === id && 'bounced', l.focus.value === id && 'focus')} aria-label={thingName(id)} aria-pressed={id === sel} onClick={() => pick(id)}>
              <Pic id={id} look={looks[id]} show={l.focus.value === id ? l.show.value : null} />
            </button>
          ))}
        </div>
        <div class="ft-shelves">
          {SHELVES[q.kind === 'need' ? 'need' : 'goods'].map(([s, icon, name]) => (
            <button key={s} class={cls('ft-shelf', `s-${s}`, l.hint.value === s && 'hint', done && 'right')} aria-label={name} onClick={() => shelve(s)}>
              <span class="shelf-icon" aria-hidden="true">{icon}</span>
              <span class="shelf-row">{placed.filter(([, p]) => p === s).map(([id]) => <Pic key={id} id={id} look={looks[id]} />)}</span>
            </button>
          ))}
        </div>
      </div>} />
  );
}

function FirstView({ current, q, waiting }: { current: Current; q: Extract<NeedProblem, { form: 'first' }>; waiting: boolean }) {
  const speech = questionSpeech(q);
  const ready = useAsked(current, speech), l = lessonFor(current.signal), c = useChoice(current, ready, waiting);
  const need = BUY_NEEDS.find(t => t.id === q.need)!, want = WANTS.find(t => t.id === q.want)!;
  return (
    <Shell current={current} ready={c.can} kind="need form-first" text="Which do you buy first?" speech={speech}
      stage={<div class="ft-shop">
        <Money amount={q.have} />
        <div class="ft-pair">
          {[[need.id, need.emoji, q.needPrice] as const, [want.id, want.emoji, q.wantPrice] as const].map(([id, e, price]) => (
            <button key={id} class={cls('ft-card', state(id, c, l))} aria-label={thingName(id)} onClick={() => c.tap(id)}>
              <span class="ft-pic" aria-hidden="true">{e}</span><PriceTag price={price} />
              {l.show.value === 'shelves' && <span class="shelf-tag" aria-hidden="true">{id === need.id ? '❤️' : '⭐'}</span>}
            </button>
          ))}
        </div>
        {l.show.value === 'shelves' && <LessonShelves need={need.id} want={want.id} />}
      </div>} />
  );
}

function WhoView({ current, q, waiting }: { current: Current; q: Extract<GoodsProblem, { form: 'who' }>; waiting: boolean }) {
  const speech = questionSpeech(q), line = speech[0] as Phrase, ready = useAsked(current, speech), l = lessonFor(current.signal), c = useChoice(current, ready, waiting);
  return (
    <Shell current={current} ready={c.can} kind="goods form-who" text={line} speech={speech}
      stage={<div class="ft-workers n3">{q.workers.map(w => (
        <button key={w.job} class={cls('ft-card', state(w.job, c, l))} aria-label={jobLabel(w)} onClick={() => c.tap(w.job)}>
          <WorkerPic w={w} tool={l.show.value === 'tool' && l.focus.value === w.job} />
        </button>
      ))}</div>} />
  );
}

// ---------- Jobs ----------

function JobView({ current, q, waiting }: { current: Current; q: JobProblem; waiting: boolean }) {
  const l = lessonFor(current.signal);
  if (q.form === 'role') return <RoleView current={current} q={q} waiting={waiting} />;
  const j = jobOf(q.asked);
  const speech = questionSpeech(q), line = speech[0] as Phrase, ready = useAsked(current, speech), c = useChoice(current, ready, waiting);
  const tool = l.show.value === 'tool';
  if (q.form === 'tool') {
    return (
      <Shell current={current} ready={c.can} kind="job form-tool" text={line} speech={speech}
        stage={<div class="ft-tool-q"><span class="ft-card big"><WorkerPic w={q.worker} tool={tool} /></span></div>}
        controls={<div class="choices tools">{q.tools.map(t => (
          <button key={t} class={cls('choice', 'tool-choice', state(t, c, l))} aria-label={jobOf(t).toolName} onClick={() => c.tap(t)}>{jobOf(t).tool}</button>
        ))}</div>} />
    );
  }
  return (
    <Shell current={current} ready={c.can} kind={`job form-${q.form}`} text={line} speech={speech}
      stage={<div class="ft-tool-q">
        {q.form === 'user' && <span class="ft-big-tool" aria-hidden="true">{j.tool}</span>}
        <div class={cls('ft-workers', `n${q.workers.length}`)}>{q.workers.map(w => (
          <button key={w.job} class={cls('ft-card', state(w.job, c, l))} aria-label={jobLabel(w)} onClick={() => c.tap(w.job)}>
            <WorkerPic w={w} tool={tool && (l.focus.value === w.job || l.hint.value === w.job)} />
          </button>
        ))}</div>
      </div>} />
  );
}

function RoleView({ current, q, waiting }: { current: Current; q: Extract<JobProblem, { form: 'role' }>; waiting: boolean }) {
  const m = MADE.find(x => x.id === q.good)!, speech = questionSpeech(q), line = speech[0] as Phrase;
  const ready = useAsked(current, speech), l = lessonFor(current.signal), c = useChoice(current, ready, waiting);
  const maker = (
    <button key="maker" class={cls('ft-card', 'role', state('maker', c, l))} aria-label="maker" onClick={() => c.tap('maker')}>
      <WorkerPic w={q.maker} tool={l.show.value === 'tool' && l.focus.value === 'maker'} /><span class="ft-apron" aria-hidden="true">{m.emoji}</span>
    </button>
  );
  const buyer = (
    <button key="buyer" class={cls('ft-card', 'role', state('buyer', c, l))} aria-label="shopper" onClick={() => c.tap('buyer')}>
      <span class="ft-worker" aria-hidden="true"><span class="who">{workerEmoji('shopper', q.buyer)}</span><span class="tool">🛍️</span></span><span class="ft-pay" aria-hidden="true"><Coin /><Coin /></span>
    </button>
  );
  return (
    <Shell current={current} ready={c.can} kind="job form-role" text={line} speech={speech}
      stage={<div class="ft-market">
        {q.makerLeft ? maker : buyer}
        <span class="ft-stall" aria-hidden="true"><span class="good">{m.emoji}</span><span class="arrow">{q.makerLeft ? '➡️' : '⬅️'}</span></span>
        {q.makerLeft ? buyer : maker}
      </div>} />
  );
}

// ---------- money ----------

function LessonRows({ l }: { l: Lesson }) {
  const rows = l.rows.value;
  return rows && rows.length ? <CoinRows rows={rows} /> : null;
}

function TotalView({ current, q, waiting }: { current: Current; q: TotalProblem; waiting: boolean }) {
  const speech = questionSpeech(q), line = speech[0] as Phrase, ready = useAsked(current, speech), l = lessonFor(current.signal), c = useChoice(current, ready, waiting);
  return (
    <Shell current={current} ready={c.can} kind="total" text={line} speech={speech}
      stage={<div class="ft-menu-wrap">
        <div class="ft-menu" role="img" aria-label="The menu">
          <div class="menu-head">MENU</div>
          {q.menu.map(m => <div key={m.id} class={cls('menu-line', q.order.includes(m.id) && 'ordered')}><span class="e">{priced(m.id).emoji}</span><span class="dots" /><span class="p">${m.price}</span></div>)}
        </div>
        <LessonRows l={l} />
      </div>}
      controls={<NumberChoices choices={q.choices} onTap={c.tap} c={c} l={l} />} />
  );
}

function ItemPrice({ id, price, lit }: { id: string; price: number; lit?: boolean }) {
  return <span class={cls('ft-item', lit && 'lit')}><span class="ft-pic" aria-hidden="true">{priced(id).emoji}</span><PriceTag price={price} /></span>;
}

function EnoughView({ current, q, waiting }: { current: Current; q: EnoughProblem; waiting: boolean }) {
  const speech = questionSpeech(q);
  const text = q.form === 'which' ? 'Which one can you buy?' : q.form === 'yesno' ? 'Do you have enough?' : 'How much is left?';
  const ready = useAsked(current, speech), l = lessonFor(current.signal), c = useChoice(current, ready, waiting);
  if (q.form === 'which') {
    return (
      <Shell current={current} ready={c.can} kind="enough form-which" text={text} speech={speech}
        stage={<div class="ft-shop"><Money amount={q.have} /><LessonRows l={l} /></div>}
        controls={<div class="choices items">{q.items.map(i => (
          <button key={i.id} class={cls('choice', 'item-choice', state(i.id, c, l))} aria-label={`${i.id}, ${i.price} dollars`} onClick={() => c.tap(i.id)}><ItemPrice id={i.id} price={i.price} /></button>
        ))}</div>} />
    );
  }
  return (
    <Shell current={current} ready={c.can} kind={`enough form-${q.form}`} text={text} speech={speech}
      stage={<div class="ft-shop"><Money amount={q.have} /><ItemPrice id={q.item} price={q.price} /><LessonRows l={l} /></div>}
      controls={q.form === 'yesno' ? <YesNo onTap={c.tap} c={c} l={l} /> : <NumberChoices choices={q.choices} onTap={c.tap} c={c} l={l} />} />
  );
}

function SaveView({ current, q, waiting }: { current: Current; q: SaveProblem; waiting: boolean }) {
  const speech = questionSpeech(q);
  const text = q.form === 'more' ? 'How many more do you need?' : q.form === 'days' ? `You earn $${q.perDay} a day. How many days until you have $${q.goal}?` : 'Can you buy both?';
  const ready = useAsked(current, speech), l = lessonFor(current.signal), c = useChoice(current, ready, waiting);
  if (q.form === 'days') {
    return (
      <Shell current={current} ready={c.can} kind="save form-days" text={text} speech={speech}
        stage={<div class="ft-shop">
          {q.start > 0 && <Money amount={q.start} />}
          <div class="ft-earn" aria-hidden="true"><span class="day">📅</span><span>+${q.perDay}</span><span class="goal">🎯 ${q.goal}</span></div>
          <LessonRows l={l} />
        </div>}
        controls={<NumberChoices choices={q.choices} money={false} onTap={c.tap} c={c} l={l} />} />
    );
  }
  return (
    <Shell current={current} ready={c.can} kind={`save form-${q.form}`} text={text} speech={speech}
      stage={<div class="ft-shop">
        <Money amount={q.have} />
        {q.form === 'more' ? <ItemPrice id={q.item} price={q.price} /> : <div class="ft-pair items"><ItemPrice id={q.a.id} price={q.a.price} /><span class="plus" aria-hidden="true">+</span><ItemPrice id={q.b.id} price={q.b.price} /></div>}
        <LessonRows l={l} />
      </div>}
      controls={q.form === 'more' ? <NumberChoices choices={q.choices} onTap={c.tap} c={c} l={l} /> : <YesNo onTap={c.tap} c={c} l={l} />} />
  );
}

// ---------- the question, and Meetings ----------

export function QuestionView({ current, waiting }: { current: Current; waiting: boolean }) {
  const q = current.problem.q;
  if (q.form === 'pick') return <PickView current={current} q={q} waiting={waiting} />;
  if (q.form === 'sort') return <SortView current={current} q={q} waiting={waiting} />;
  if (q.form === 'first') return <FirstView current={current} q={q} waiting={waiting} />;
  if (q.kind === 'goods') return <WhoView current={current} q={q} waiting={waiting} />;
  if (q.kind === 'job') return <JobView current={current} q={q} waiting={waiting} />;
  if (q.kind === 'total') return <TotalView current={current} q={q} waiting={waiting} />;
  if (q.kind === 'enough') return <EnoughView current={current} q={q} waiting={waiting} />;
  return <SaveView current={current} q={q as SaveProblem} waiting={waiting} />;
}

/** The first time a question needs an idea (needs and wants, goods and services, the money), it's shown and said, and he taps Go. */
export function MeetView({ current, waiting }: { current: ProblemInstance<Meet, string>; waiting: boolean }) {
  const voice = useVoice(), meeting = current.problem.meeting;
  const [ready, setReady] = useState(false), [lit, setLit] = useState(0);
  useEffect(() => {
    void (async () => {
      if (meeting === 'needs') {
        setLit(1); await voice.say('Needs are things you must have to live.');
        setLit(2); await voice.say('Wants are things that are nice to have.');
      } else if (meeting === 'goods') {
        setLit(1); await voice.say('Goods are things you can hold.');
        setLit(2); await voice.say('Services are jobs people do for you.');
      } else {
        setLit(1); await voice.say('This is a one-dollar coin.');
        setLit(2); await voice.say('This is a five-dollar bill.');
        setLit(3); await voice.say('This is a ten-dollar bill.');
      }
      if (voice.active) { await voice.say('Tap Go!'); if (!current.signal.aborted) setReady(true); }
    })();
  }, []);
  const go = () => { if (ready && !waiting && !current.actions.busy) current.actions.submit('ok'); };
  const title = meeting === 'needs' ? 'Needs and wants' : meeting === 'goods' ? 'Goods and services' : 'Money';
  return (
    <div class={cls('game', 'ft', 'meet', `meet-${meeting}`)} data-ready={ready && !waiting ? 'yes' : 'no'}>
      <div class="ask"><h2>{title}</h2></div>
      <div class="ft-body">
        <div class="ft-stage">
          {meeting === 'money'
            ? <div class="ft-meet-money">
                <span class={cls('meet-item', lit === 1 && 'lit')}><Coin size={2} /><b>$1</b></span>
                <span class={cls('meet-item', lit === 2 && 'lit')}><Bill value={5} /><b>$5</b></span>
                <span class={cls('meet-item', lit === 3 && 'lit')}><Bill value={10} /><b>$10</b></span>
              </div>
            : <div class="ft-shelves meet">
                {(meeting === 'needs' ? [['❤️', ['💧', '🍞', '🧥']], ['⭐', ['🧸', '🍭', '🪁']]] as const : [['🧺', ['🍎', '⚽', '📕']], ['🤝', ['💇🏽', '🧑🏿‍🔧🚗', '🧑🏻‍🚒🔥']]] as const).map(([icon, items], i) => (
                  <div key={icon} class={cls('ft-shelf', lit === i + 1 && 'lit')}><span class="shelf-icon">{icon}</span><span class="shelf-row">{items.map(e => <span key={e} class="ft-pic">{e}</span>)}</span></div>
                ))}
              </div>}
        </div>
        <div class="ft-controls"><button class={cls('big-btn', 'go', 'go-btn', ready && 'pulse')} aria-label="Go" onClick={go}><span class="e">▶</span><span class="go-word">Go</span></button></div>
      </div>
    </div>
  );
}

/** For the tests: the number choices with nothing chosen, to show they speak no part of themselves. */
export const NumberChoicesForTest = ({ choices, onTap }: { choices: readonly number[]; onTap(a: string): void }) =>
  NumberChoices({ choices, onTap, c: { wrong: [], done: null }, l: lessonFor(new AbortController().signal) });
