// The questions on screen. Every question is said as it appears (🔊 says it again), and then every choice that is a word or a
// sentence is read once in order, lighting as it's said (he can't read "Grassland" or "To keep warm." yet), each with its own 🔊.
// Taps wait until all that has been said. A miss is never marked with a red X: what he tapped just fades a little, and the round
// engine runs the lesson (science/teach.ts), which plays on the question's own picture.
import { useEffect, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { sClink, sNope } from '../audio/sfx';
import type { ProblemInstance } from '../learning/round';
import { AnimalPic, artOf, DayNight, HabitatArt, NeedScene, Pic, SeasonTree, SunSky, WearScene, WeatherPic } from './art/Pics';
import { Diagram } from './art/Diagram';
import { animal, type AnimalId } from './facts/animals';
import { BABIES, SAME_DIFFERENT, SENTENCE_ICONS } from './facts/babies';
import { habitat, type HabitatId } from './facts/habitats';
import { LIVING, NEED_ASKS, NEEDS, NOT_LIVING, SCENES, type NeedId } from './facts/living';
import { ALSO_USES, DIAGRAMS, JOBS, WHYS, type JobId } from './facts/parts';
import { AFTER_Q, BEFORE, CLOTHES, DAY_NIGHT, NOON_Q, SEASON_Q, SEASONS, SUN_TIMES, SUN_WHEN, WEAR_Q, WEATHER, type SeasonId, type SunSpot } from './facts/sky';
import type { Asking } from './mix';
import { alsoQ, habitatSaid, whereQ, type Phrase } from './phrases';
import { needsAnswer, type AliveQ, type BabyQ, type HomeQ, type PartsQ, type SkyQ } from './science/problems';
import { help, lessonFor, type Lesson } from './science/teach';
import { useVoice, type Item } from './voice';

type Current = ProblemInstance<Asking, string>;
const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');

/** A choice: its answer key, its picture, and (for words and sentences) what is written and said. */
export interface Choice { key: string; pic: ComponentChildren; text?: string; said?: Phrase }

/** Says the question, then reads the spoken choices in order, lighting each. Marks when it's all been said. */
function useAsked(current: { signal: AbortSignal }, speech: readonly Item[], choices: readonly Choice[], lesson: Lesson) {
  const voice = useVoice();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    void (async () => {
      await voice.say(...speech);
      for (const c of choices) {
        if (!c.said || current.signal.aborted || !voice.active) continue;
        lesson.lit.value = c.key;
        await voice.say(c.said);
      }
      lesson.lit.value = null;
      if (!current.signal.aborted) setReady(true);
    })();
  }, []);
  return ready;
}

/** Taps he made that weren't it (faded, never crossed out), and the one that was. */
function useTaps(current: Current, waiting: boolean, ready: boolean, lesson: Lesson) {
  const [wrong, setWrong] = useState<string[]>([]), [right, setRight] = useState<string | null>(null);
  const can = ready && !waiting && !right;
  function submit(answer: string) {
    if (!can || current.actions.busy || wrong.includes(answer)) return;
    const verdict = current.actions.submit(answer);
    if (verdict === 'correct') { setRight(answer); lesson.glow.value = null; lesson.show.value = null; }
    else if (verdict === 'incorrect') setWrong(w => [...w, answer]);
    else if (verdict === 'not-an-answer') sNope();
  }
  return { wrong, right, can, submit };
}

function Shell({ current, kind, text, speech, stage, choices, ready, extra }: {
  current: Current; kind: string; text: string; speech: readonly Item[]; stage?: ComponentChildren; choices: ComponentChildren; ready: boolean; extra?: ComponentChildren;
}) {
  const voice = useVoice();
  return (
    <div class={cls('game', 'wr', kind)} data-ready={ready ? 'yes' : 'no'}>
      <div class="ask">
        <button class="say-btn" aria-label="Say it again" onClick={() => void voice.say(...speech)}>🔊</button>
        <h2>{text}</h2>
        <button class="help-btn" aria-label="Help" onClick={() => current.actions.help(() => help(current.problem, current.signal))}>🔎</button>
      </div>
      <div class={cls('wr-body', !stage && 'no-stage')}>
        {stage && <div class="wr-stage">{stage}</div>}
        <div class="wr-choices">{choices}{extra}</div>
      </div>
    </div>
  );
}

/** The choice cards: a picture, and for words a line of text and its own 🔊. */
function Choices({ choices, lesson, wrong, right, onTap, picked, kind }: {
  choices: readonly Choice[]; lesson: Lesson; wrong: readonly string[]; right: string | null; onTap(key: string): void; picked?: readonly string[]; kind: string;
}) {
  const voice = useVoice(), lit = lesson.lit.value, glow = lesson.glow.value;
  const glowing = (k: string) => glow === k || (glow?.includes('+') && glow.split('+').includes(k));
  return (
    <div class={cls('choices-grid', kind, `n${choices.length}`)} role="group" aria-label="Answers">
      {choices.map(c => (
        <div key={c.key} class={cls('choice-card', c.text && 'worded', lit === c.key && 'speaking', wrong.includes(c.key) && 'wrong', right === c.key && 'right', glowing(c.key) && 'hint', picked?.includes(c.key) && 'picked')}>
          <button class="choice-main" aria-label={c.text ?? c.key} aria-pressed={picked ? picked.includes(c.key) : undefined} data-key={c.key} onClick={() => onTap(c.key)}>
            <span class="choice-pic">{c.pic}</span>
            {c.text && <span class="choice-text">{c.text}</span>}
          </button>
          {c.said && <button class="choice-say" aria-label={`Say ${c.text ?? c.key}`} onClick={() => void voice.say(c.said!)}>🔊</button>}
        </div>
      ))}
    </div>
  );
}

/** The usual question: a picture, then cards. */
function Standard({ current, waiting, kind, text, speech, stage, choices }: { current: Current; waiting: boolean; kind: string; text: string; speech: readonly Item[]; stage?: ComponentChildren; choices: Choice[] }) {
  const lesson = lessonFor(current.signal), ready = useAsked(current, speech, choices, lesson);
  const { wrong, right, can, submit } = useTaps(current, waiting, ready, lesson);
  return <Shell current={current} kind={kind} text={text} speech={speech} ready={can} stage={stage}
    choices={<Choices choices={choices} lesson={lesson} wrong={wrong} right={right} onTap={submit} kind={kind} />} />;
}

const emoji = (e: string, label?: string) => <Pic art={{ emoji: e }} label={label} />;
const animalChoice = (id: AnimalId): Choice => ({ key: id, pic: <AnimalPic id={id} label={animal(id).name} /> });

// ---------- Where It Lives ----------

/** The animal on its own, or (in a lesson) hopping into a habitat. */
function HomeStage({ q, lesson }: { q: HomeQ; lesson: Lesson }) {
  const show = lesson.show.value;
  if (show?.kind === 'home') return <div class="home-scene moving"><HabitatArt id={show.habitat} /><AnimalPic id={show.animal} class="hopper" /></div>;
  if (q.form === 'also') {
    return (
      <div class="home-scene">
        <HabitatArt id={q.habitat} />
        <AnimalPic id={q.subject} class="resident" label={animal(q.subject).name} />
        {show?.kind === 'pop' && <AnimalPic id={show.animal} class="popped" />}
      </div>
    );
  }
  return <div class="portrait"><AnimalPic id={q.animal} class="big" label={animal(q.animal).name} /></div>;
}

function HomeView({ current, q, waiting }: { current: Current; q: HomeQ; waiting: boolean }) {
  const lesson = lessonFor(current.signal);
  if (q.form === 'where') {
    const a = animal(q.animal), text = whereQ(a);
    const choices: Choice[] = q.choices.map(h => ({ key: h, pic: <HabitatArt id={h} />, text: habitat(h).name, said: habitatSaid(habitat(h).name) }));
    return <Standard current={current} waiting={waiting} kind="home where" text={text} speech={[text]} stage={<HomeStage q={q} lesson={lesson} />} choices={choices} />;
  }
  const h = habitat(q.habitat), text = alsoQ(h.lives);
  return <Standard current={current} waiting={waiting} kind="home also" text={text} speech={[`${animal(q.subject).a} ${animal(q.subject).name} lives ${h.lives}.` as Phrase, text]} stage={<HomeStage q={q} lesson={lesson} />} choices={q.choices.map(animalChoice)} />;
}

// ---------- Animal Parts ----------

function PartsTap({ current, q, waiting }: { current: Current; q: Extract<PartsQ, { form: 'tap' }>; waiting: boolean }) {
  const d = DIAGRAMS[q.diagram]!, ask = d.asks[q.ask]!, lesson = lessonFor(current.signal);
  const ready = useAsked(current, [ask.q], [], lesson), { wrong, right, can, submit } = useTaps(current, waiting, ready, lesson);
  const show = lesson.show.value, lit = show?.kind === 'part' ? show.part : lesson.glow.value;
  return (
    <Shell current={current} kind="parts tap" text={ask.q} speech={[ask.q]} ready={can}
      stage={<Diagram animal={d.animal} onTap={submit} lit={lit} wrong={wrong} right={right} label={`A ${animal(d.animal).name}: tap a part`} />} choices={null} />
  );
}

function PartsStage({ shown, lesson }: { shown: AnimalId; lesson: Lesson }) {
  const show = lesson.show.value;
  return (
    <div class={cls('portrait', show && 'lesson')}>
      <AnimalPic id={shown} class="big" label={animal(shown).name} />
      {show?.kind === 'job' && <span class="job-pop" aria-hidden="true">{JOBS[show.job].icon}</span>}
      {show?.kind === 'pop' && <AnimalPic id={show.animal} class="popped" />}
    </div>
  );
}

function PartsView({ current, q, waiting }: { current: Current; q: PartsQ; waiting: boolean }) {
  const lesson = lessonFor(current.signal);
  if (q.form === 'tap') return <PartsTap current={current} q={q} waiting={waiting} />;
  if (q.form === 'why') {
    const w = WHYS[q.why]!;
    const choices: Choice[] = q.choices.map((j: JobId) => ({ key: j, pic: emoji(JOBS[j].icon), text: JOBS[j].said, said: JOBS[j].said }));
    return <Standard current={current} waiting={waiting} kind="parts why sentences" text={w.q} speech={[w.q]} stage={<PartsStage shown={w.animal} lesson={lesson} />} choices={choices} />;
  }
  const u = ALSO_USES[q.item]!;
  return <Standard current={current} waiting={waiting} kind="parts also" text={u.q} speech={[u.q]} stage={<PartsStage shown={u.shown} lesson={lesson} />} choices={q.choices.map(animalChoice)} />;
}

// ---------- Alive or Not ----------

const thing = (id: string) => (LIVING.find(t => t.id === id) ?? NOT_LIVING.find(t => t.id === id))!;

function NeedsView({ current, q, waiting }: { current: Current; q: Extract<AliveQ, { form: 'needs' }>; waiting: boolean }) {
  const lesson = lessonFor(current.signal), ask = NEED_ASKS[q.subject];
  const choices: Choice[] = q.choices.map(n => ({ key: n, pic: emoji(NEEDS[n].icon), text: NEEDS[n].said.replace('.', ''), said: NEEDS[n].said }));
  const speech: Item[] = [ask.q, 'Tap all the ones it needs. Then tap Done.'];
  const ready = useAsked(current, speech, choices, lesson), { wrong, right, can, submit } = useTaps(current, waiting, ready, lesson);
  const [picked, setPicked] = useState<NeedId[]>([]);
  // after a miss the round engine wants a fresh try: what he picked stays, so he only fixes it
  const lit = lesson.show.value?.kind === 'needs' ? lesson.show.value.lit : [];
  function toggle(k: string) {
    if (!can) return;
    sClink();
    setPicked(p => (p.includes(k as NeedId) ? p.filter(x => x !== k) : [...p, k as NeedId]));
  }
  const done = () => { if (picked.length) submit(needsAnswer(picked)); else sNope(); };
  return (
    <Shell current={current} kind="alive needs" text={ask.q} speech={speech} ready={can}
      stage={<div class="portrait">{emoji(ask.icon, q.subject === 'plant' ? 'A plant' : 'An animal')}</div>}
      choices={<Choices choices={choices} lesson={lesson} wrong={[]} right={null} onTap={toggle} picked={[...picked, ...lit.filter(n => !picked.includes(n))]} kind={cls('needs', right && 'solved', wrong.length > 0 && 'tried')} />}
      extra={<button class={cls('big-btn', 'go', 'done-btn', picked.length > 0 && can && 'pulse')} aria-label="Done" onClick={done}>Done ✓</button>} />
  );
}

function AliveView({ current, q, waiting }: { current: Current; q: AliveQ; waiting: boolean }) {
  const lesson = lessonFor(current.signal);
  if (q.form === 'living') {
    const choices: Choice[] = q.choices.map(id => ({ key: id, pic: emoji(thing(id).icon, id) }));
    return <Standard current={current} waiting={waiting} kind="alive living" text="Tap the living thing!" speech={['Tap the living thing!']} choices={choices} />;
  }
  if (q.form === 'needs') return <NeedsView current={current} q={q} waiting={waiting} />;
  const s = SCENES[q.scene]!;
  const choices: Choice[] = q.choices.map(n => ({ key: n, pic: emoji(NEEDS[n].icon), text: NEEDS[n].said.replace('.', ''), said: NEEDS[n].said }));
  return <Standard current={current} waiting={waiting} kind="alive missing" text={s.q} speech={[s.q]} stage={<SceneStage scene={q.scene} lesson={lesson} />} choices={choices} />;
}

function SceneStage({ scene, lesson }: { scene: number; lesson: Lesson }) {
  return <div class="scene-box"><NeedScene scene={SCENES[scene]!.id} fixed={lesson.show.value?.kind === 'fixed'} /></div>;
}

// ---------- Babies ----------

/** The baby, or in a lesson the baby growing into its parent in three steps. */
function GrowStage({ baby, lesson, withParent }: { baby: number; lesson: Lesson; withParent: boolean }) {
  const b = BABIES[baby]!, show = lesson.show.value, step = show?.kind === 'grow' ? show.step : null;
  const parentArt = animal(b.parent).art;
  const babyPic = 'art' in b ? <Pic art={artOf(b.art)} class="baby-pic" label={b.baby} /> : <Pic art={parentArt} class="baby-pic small" label={b.baby} />;
  if (step !== null) {
    const pic = step === 0 ? babyPic : step === 1 ? ('middle' in b ? <Pic art={artOf(b.middle)} class="baby-pic" /> : <Pic art={parentArt} class="baby-pic middle" />) : <Pic art={parentArt} class="baby-pic grown" />;
    return <div class="grow-stage"><div class={`grow-step s${step}`} key={step}>{pic}</div><div class="grow-dots" aria-hidden="true">{[0, 1, 2].map(i => <i key={i} class={i <= step ? 'on' : ''} />)}</div></div>;
  }
  return <div class="grow-stage">{babyPic}{withParent && <Pic art={parentArt} class="baby-pic grown" label={animal(b.parent).name} />}</div>;
}

function BabyView({ current, q, waiting }: { current: Current; q: BabyQ; waiting: boolean }) {
  const lesson = lessonFor(current.signal);
  if (q.form === 'grow') {
    const b = BABIES[q.baby]!;
    return <Standard current={current} waiting={waiting} kind="baby grow" text={b.q} speech={[b.q]} stage={<GrowStage baby={q.baby} lesson={lesson} withParent={false} />} choices={q.choices.map(animalChoice)} />;
  }
  const p = SAME_DIFFERENT[q.pair]!, text = q.form === 'same' ? p.same : p.different, baby = BABIES.findIndex(b => b.baby === p.baby);
  const choices: Choice[] = q.choices.map(s => ({ key: s, pic: emoji(SENTENCE_ICONS[s] ?? '🐾'), text: s, said: s as Phrase }));
  return <Standard current={current} waiting={waiting} kind="baby compare sentences" text={text} speech={[text]} stage={<GrowStage baby={baby} lesson={lesson} withParent />} choices={choices} />;
}

// ---------- Sky and Seasons ----------

function SkyStage({ q, lesson }: { q: SkyQ; lesson: Lesson }) {
  const show = lesson.show.value;
  if (show?.kind === 'sun') return <div class="scene-box"><SunSky spot={show.spot} /></div>;
  if (show?.kind === 'season') return <div class="scene-box"><SeasonTree season={show.season} /></div>;
  if (q.form === 'daynight') return <div class="scene-box"><DayNight time={q.answer} /></div>;
  if (q.form === 'season') return <div class="scene-box"><SeasonTree season={q.answer} /></div>;
  if (q.form === 'after') return <div class="scene-box"><SeasonTree season={BEFORE[q.answer]} /></div>;
  if (q.form === 'wear') return <div class="scene-box"><WearScene day={q.day} /></div>;
  if (q.form === 'sunwhen') return <div class="scene-box"><SunSky spot={q.which === 'up' ? 'up' : 'down'} /></div>;
  return null;
}

const seasonChoice = (s: SeasonId): Choice => ({ key: s, pic: emoji(SEASONS[s].icon), text: SEASONS[s].said.replace('.', ''), said: SEASONS[s].said });

function SkyView({ current, q, waiting }: { current: Current; q: SkyQ; waiting: boolean }) {
  const lesson = lessonFor(current.signal), stage = <SkyStage q={q} lesson={lesson} />;
  if (q.form === 'daynight') {
    const choices: Choice[] = q.choices.map(t => ({ key: t, pic: emoji(DAY_NIGHT[t].icon), text: DAY_NIGHT[t].said.replace('.', ''), said: DAY_NIGHT[t].said }));
    return <Standard current={current} waiting={waiting} kind="sky daynight" text={DAY_NIGHT.q} speech={[DAY_NIGHT.q]} stage={stage} choices={choices} />;
  }
  if (q.form === 'weather') {
    const text = WEATHER[q.answer].q!;
    const choices: Choice[] = q.choices.map(w => ({ key: w, pic: <WeatherPic w={w} /> }));
    return <Standard current={current} waiting={waiting} kind="sky weather pictures" text={text} speech={[text]} choices={choices} />;
  }
  if (q.form === 'season') return <Standard current={current} waiting={waiting} kind="sky season" text={SEASON_Q} speech={[SEASON_Q]} stage={stage} choices={q.choices.map(seasonChoice)} />;
  if (q.form === 'after') { const t = AFTER_Q[q.answer]; return <Standard current={current} waiting={waiting} kind="sky after" text={t} speech={[t]} stage={stage} choices={q.choices.map(seasonChoice)} />; }
  if (q.form === 'wear') {
    const choices: Choice[] = q.choices.map(c => ({ key: c, pic: emoji(CLOTHES[c].icon), text: CLOTHES[c].said, said: CLOTHES[c].said }));
    return <Standard current={current} waiting={waiting} kind="sky wear" text={WEAR_Q} speech={[WEAR_Q]} stage={stage} choices={choices} />;
  }
  if (q.form === 'noon') {
    const choices: Choice[] = q.choices.map((s: SunSpot) => ({ key: s, pic: <SunSky spot={s} /> }));
    return <Standard current={current} waiting={waiting} kind="sky noon pictures" text={NOON_Q} speech={[NOON_Q]} choices={choices} />;
  }
  const w = SUN_WHEN[q.which];
  const choices: Choice[] = q.choices.map(t => ({ key: t, pic: emoji(SUN_TIMES[t].icon), text: SUN_TIMES[t].said, said: SUN_TIMES[t].said }));
  return <Standard current={current} waiting={waiting} kind="sky sunwhen" text={w.q} speech={[w.q]} stage={stage} choices={choices} />;
}

// ---------- the question ----------

export function QuestionView({ current, waiting }: { current: Current; waiting: boolean }) {
  const q = current.problem.q;
  if (q.kind === 'home') return <HomeView current={current} q={q} waiting={waiting} />;
  if (q.kind === 'parts') return <PartsView current={current} q={q} waiting={waiting} />;
  if (q.kind === 'alive') return <AliveView current={current} q={q} waiting={waiting} />;
  if (q.kind === 'baby') return <BabyView current={current} q={q} waiting={waiting} />;
  return <SkyView current={current} q={q} waiting={waiting} />;
}
export type { HabitatId };
