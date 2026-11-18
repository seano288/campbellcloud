// The questions on screen. Every question is said as it appears (🔊 says it again); choices that are words or sentences, or pictures
// whose name he needs ("wax paper", "a horn"), are then read once in order, each lighting as it's said. Taps wait until all that has
// been said. A miss is never marked with a red X: what he tapped just fades a little, and the round engine runs the lesson
// (science/teach.ts), which plays on the question's own picture. In a fuller lesson the stage becomes his to try (switch on the lamp,
// drag the lamp, turn the mirror, pluck the string).
import { useEffect, useRef, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { sClink, sNope } from '../../audio/sfx';
import type { ProblemInstance } from '../../learning/round';
import type { Asking } from '../mix';
import { SAID_NAMES, type Phrase } from '../phrases';
import { beep, hum, loudness } from '../sounds';
import { speaking, useVoice, type Item } from '../voice';
import { BeamScene, BounceScene, Cave, FlashMarks, Lighthouse, LabView, MaterialPic, MirrorPic, ShadowPic, ShadowScene, ShakerPic, SoundPic, StringPic, SunMoon, ThingPic, WallPic } from './art';
import { withMirrors, type Turn } from './optics';
import { setAnswer, sortAnswer, STAGE, type MirrorQ, type Question, type SeeQ, type ShadowQ, type SignalQ, type SoundQ, type ThroughQ } from './problems';
import { help, lessonFor, type Lesson } from './teach';
import {
  CAVE_ANIMALS, COPY_Q, HELLO, KEY, KEY_Q, lightThing, LOUD_Q, material, MIRROR_Q, MOON, OWN_ASK, PASS_SAID, SEE_Q, SHADOW_Q, shadowThing, SHAKE_Q, SHAKERS,
  SIGNAL_ITEMS, SORT_ASK, sound, SOUND3_ICONS, SOUND_Q3, SUN_MOON_Q, THROUGH_Q, WALL_Q, WALL_SAID, WHY_CHOICES, WHY_Q, type MaterialId,
} from './things';

type Current = ProblemInstance<Asking, string>;
const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');
const isLit = (key: string) => speaking.value === key;
/** A choice read out, lighting its button. */
const read = (key: string, said: Phrase): Item => ({ parts: [said], light: key });

// ---------- pieces ----------

/** Says the prompt (and reads the choices, each lit as it's said) once when the question appears, then `after` (a lighthouse
 *  flashing). Marks when it's all been said. */
function useAsked(current: { signal: AbortSignal }, speech: readonly Item[], after?: () => Promise<void>) {
  const voice = useVoice();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    void (async () => {
      await voice.say(...speech);
      if (after && !current.signal.aborted) await after();
      if (!current.signal.aborted) setReady(true);
    })();
  }, []);
  return ready;
}

/** A tap that counts: the answer goes in only when the question is ready and not waiting on a lesson. */
function useSubmit(current: Current, waiting: boolean, ready: boolean) {
  const [right, setRight] = useState<string | null>(null), [wrong, setWrong] = useState<string[]>([]);
  const can = ready && !waiting && !right && !current.actions.busy;
  function submit(answer: string) {
    if (!can) return null;
    const verdict = current.actions.submit(answer);
    if (verdict === 'correct') setRight(answer);
    else if (verdict === 'incorrect') setWrong(ws => [...ws, answer]);
    else if (verdict === 'not-an-answer') sNope();
    return verdict;
  }
  return { can, right, wrong, submit };
}

/** State whose newest value a tap can read even before the view has redrawn (two quick taps on a busy iPad can land on one render). */
function useLive<T>(initial: T): [T, () => T, (next: T) => void] {
  const [value, setValue] = useState(initial), live = useRef(value);
  return [value, () => live.current, next => { live.current = next; setValue(next); }];
}

function Shell({ current, kind, text, speech, stage, children, ready, tryIt }: {
  current: Current; kind: string; text: string; speech: readonly Item[]; stage?: ComponentChildren; children?: ComponentChildren; ready: boolean; tryIt?: ComponentChildren;
}) {
  const voice = useVoice();
  return (
    // the kind and form go on as q-see, q-cave: bare, they could match rules meant for other things on the page
    <div class={cls('game', 'dl', ...kind.split(' ').map(k => `q-${k}`))} data-ready={ready ? 'yes' : 'no'}>
      <div class="ask">
        <button class="say-btn" aria-label="Say it again" onClick={() => void voice.say(...speech)}>🔊</button>
        <h2>{text}</h2>
        <button class="help-btn" aria-label="Help" onClick={() => current.actions.help(() => help(current.problem, current.signal))}>🔎</button>
      </div>
      <div class={cls('dl-body', !stage && 'no-stage')}>
        {stage && <div class="dl-stage">{stage}{tryIt}</div>}
        {children}
      </div>
    </div>
  );
}

interface ChoiceDef { key: string; pic: ComponentChildren; text?: string }
function Choices({ choices, onTap, right, wrong, glow, picked, label = 'Answers', kind }: {
  choices: readonly ChoiceDef[]; onTap(k: string): void; right: string | null; wrong: readonly string[]; glow?: string | null; picked?: readonly string[]; label?: string; kind?: string;
}) {
  const glows = (k: string) => !!glow && (glow === k || glow.split('+').includes(k));
  return (
    <div class={cls('dl-choices', kind, `n${choices.length}`)} role="group" aria-label={label}>
      {choices.map(c => (
        <button key={c.key} class={cls('choice', 'dl-choice', c.text && 'worded', wrong.includes(c.key) && 'wrong', right === c.key && 'right', glows(c.key) && 'hint', isLit(c.key) && 'speaking', picked?.includes(c.key) && 'picked')}
          aria-label={c.text ?? c.key} aria-pressed={picked ? picked.includes(c.key) : undefined} data-key={c.key} onPointerUp={() => onTap(c.key)} onClick={e => e.preventDefault()}>
          <span class="choice-pic">{c.pic}</span>
          {c.text && <span class="choice-text">{c.text}</span>}
        </button>
      ))}
    </div>
  );
}

/** The big ✓ for a question he builds up (picks, mirrors, flashes). */
function Check({ on, onTap, pulse }: { on: boolean; onTap(): void; pulse: boolean }) {
  return <button class={cls('big-btn', 'go', 'check-btn', pulse && 'pulse')} aria-label="Check" disabled={!on} onPointerUp={onTap} onClick={e => e.preventDefault()}>✓</button>;
}

/** A button on the stage that a fuller lesson hands him: switch it on, pluck it, flash it. */
function TryButton({ lesson, kind, icon, label, onTap }: { lesson: Lesson; kind: string; icon: string; label: string; onTap(): void }) {
  if (lesson.tryIt.value !== kind) return null;
  return <button class="big-btn try-btn pulse" aria-label={label} onPointerUp={() => { onTap(); lesson.did(); }} onClick={e => e.preventDefault()}>{icon}</button>;
}

/** The usual question: a prompt, maybe a picture, and choices to tap once. */
function Standard({ current, waiting, kind, text, speech, stage, choices, tryIt, after }: {
  current: Current; waiting: boolean; kind: string; text: string; speech: readonly Item[]; stage?: ComponentChildren; choices: ChoiceDef[]; tryIt?: ComponentChildren; after?: () => Promise<void>;
}) {
  const lesson = lessonFor(current.signal), ready = useAsked(current, speech, after);
  const { right, wrong, submit } = useSubmit(current, waiting, ready);
  return (
    <Shell current={current} kind={kind} text={text} speech={speech} ready={ready && !waiting} stage={stage} tryIt={tryIt}>
      <Choices choices={choices} onTap={k => submit(k)} right={right} wrong={wrong} glow={lesson.glow.value} />
    </Shell>
  );
}

// ---------- Light to See ----------

const caveIcon = (id: string) => CAVE_ANIMALS.find(a => a.id === id)!.icon;

function SeeView({ current, q, waiting }: { current: Current; q: SeeQ; waiting: boolean }) {
  const lesson = lessonFor(current.signal), show = lesson.show.value, [lampOn, setLampOn] = useState(false);
  if (q.form === 'cave') {
    const text = SEE_Q[q.animal], on = show?.kind === 'cave' && show.on;
    const choices: ChoiceDef[] = q.choices.map(c => ({ key: c, pic: <Cave animal={caveIcon(q.animal)} lit={c === 'lit' || (on && c === 'dark') || (lampOn && c === 'dark')} label={c === 'lit' ? 'A cave with a lamp on' : 'A dark cave'} /> }));
    return <Standard current={current} waiting={waiting} kind="see cave" text={text} speech={[text]} choices={choices}
      tryIt={null} stage={lesson.tryIt.value === 'lamp' ? <TryButton lesson={lesson} kind="lamp" icon="💡" label="Switch on the lamp" onTap={() => { sClink(); setLampOn(true); }} /> : undefined} />;
  }
  if (q.form === 'why') {
    const text = WHY_Q[q.animal], on = (show?.kind === 'cave' && show.on) || lampOn;
    const choices: ChoiceDef[] = q.choices.map(c => { const w = WHY_CHOICES.find(x => x.id === c)!; return { key: c, pic: <span class="emo">{w.icon}</span>, text: w.said }; });
    return <Standard current={current} waiting={waiting} kind="see why sentences" text={text} speech={[text, ...choices.map(c => read(c.key, c.text as Phrase))]} choices={choices}
      stage={<Cave animal={caveIcon(q.animal)} lit={on} />}
      tryIt={<TryButton lesson={lesson} kind="lamp" icon="💡" label="Switch on the lamp" onTap={() => { sClink(); setLampOn(true); }} />} />;
  }
  if (q.form === 'sunmoon') {
    const choices: ChoiceDef[] = q.choices.map(c => ({ key: c, pic: <span class="emo big">{c === 'sun' ? '☀️' : MOON.icon}</span>, text: c === 'sun' ? 'the sun' : 'the moon' }));
    const step = show?.kind === 'moon' ? show.step : lampOn ? 2 : null;
    return <Standard current={current} waiting={waiting} kind="see sunmoon" text={SUN_MOON_Q} speech={[SUN_MOON_Q, read(q.choices[0]!, lightThing(q.choices[0]!).name as Phrase), read(q.choices[1]!, lightThing(q.choices[1]!).name as Phrase)]}
      stage={step !== null ? <SunMoon step={step} /> : undefined} choices={choices}
      tryIt={<TryButton lesson={lesson} kind="lamp" icon="☀️" label="Shine the sun" onTap={() => setLampOn(true)} />} />;
  }
  return <OwnView current={current} q={q} waiting={waiting} />;
}

/** Tap everything that makes its own light, then ✓. What he picked stays after a miss, so he only fixes it. */
function OwnView({ current, q, waiting }: { current: Current; q: Extract<SeeQ, { form: 'own' }>; waiting: boolean }) {
  const voice = useVoice(), lesson = lessonFor(current.signal), show = lesson.show.value;
  const ready = useAsked(current, [OWN_ASK]), { can, right, wrong, submit } = useSubmit(current, waiting, ready);
  const [picked, getPicked, setPicked] = useLive<string[]>([]);
  const glowing = show?.kind === 'glow' ? show.ids : [];
  const moonStep = show?.kind === 'moon' ? show.step : null;
  function toggle(id: string) {
    if (!can) return;
    sClink();
    const p = getPicked();
    setPicked(p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
    void voice.say(lightThing(id).name as Phrase);
  }
  const answer = setAnswer(picked);
  const choices: ChoiceDef[] = q.items.map(id => ({ key: id, pic: <span class={cls('own-pic', glowing.includes(id) && 'glowing')}><ThingPic icon={lightThing(id).icon} /></span> }));
  return (
    <Shell current={current} kind="see own" text={OWN_ASK} speech={[OWN_ASK]} ready={ready && !waiting} stage={moonStep !== null ? <SunMoon step={moonStep} /> : undefined}>
      <Choices choices={choices} onTap={toggle} right={null} wrong={[]} picked={right ? right.split('+') : picked} glow={lesson.glow.value} kind={cls('own', `n${q.items.length}`)} />
      <Check on={can && !wrong.includes(answer)} pulse={picked.length > 0 && can} onTap={() => { if (can && !wrong.includes(answer)) submit(answer); else sNope(); }} />
    </Shell>
  );
}

// ---------- Through or Not ----------

const matName = (id: string) => material(id).name as Phrase;

function ThroughView({ current, q, waiting }: { current: Current; q: ThroughQ; waiting: boolean }) {
  const lesson = lessonFor(current.signal), show = lesson.show.value, [tryRun, setTryRun] = useState<number | null>(null);
  const beamStage = (fallback: MaterialId | null, run: number) => {
    const item = show?.kind === 'beam' ? (show.item as MaterialId) : fallback;
    return <BeamScene item={item} beam={item ? (show?.kind === 'beam' ? Math.max(show.run, tryRun ?? 0) : tryRun ?? run) : 0} />;
  };
  const tryIt = <TryButton lesson={lesson} kind="beam" icon="🔦" label="Shine the light" onTap={() => { let r = 0; const tick = () => { r = Math.min(1, r + 0.08); setTryRun(r); if (r < 1) setTimeout(tick, 40); }; tick(); }} />;
  if (q.form === 'pick') {
    const text = THROUGH_Q[q.ask];
    const choices: ChoiceDef[] = q.choices.map(c => ({ key: c, pic: <MaterialPic id={c} />, text: material(c).name }));
    return <Standard current={current} waiting={waiting} kind="through pick" text={text} speech={[text, ...q.choices.map(c => read(c, matName(c)))]} choices={choices}
      stage={show?.kind === 'beam' || lesson.tryIt.value ? beamStage(q.choices[0]!, 0) : undefined} tryIt={tryIt} />;
  }
  if (q.form === 'wall') {
    const choices: ChoiceDef[] = q.choices.map(c => ({ key: c, pic: <WallPic look={c as 'bright'} />, text: WALL_SAID[c as 'bright'].replace('.', '') }));
    return <Standard current={current} waiting={waiting} kind="through wall" text={WALL_Q} speech={[matName(q.item), WALL_Q, ...q.choices.map(c => read(c, WALL_SAID[c as 'bright']))]}
      stage={beamStage(q.item, 0.5)} choices={choices} tryIt={tryIt} />;
  }
  return <SortView current={current} q={q} waiting={waiting} stage={beamStage(null, 0)} tryIt={tryIt} />;
}

/** Sort three things: tap a thing, then the bin it goes in. ✓ when all three are in. */
function SortView({ current, q, waiting, stage, tryIt }: { current: Current; q: Extract<ThroughQ, { form: 'sort' }>; waiting: boolean; stage: ComponentChildren; tryIt: ComponentChildren }) {
  const voice = useVoice(), lesson = lessonFor(current.signal);
  const speech: Item[] = [SORT_ASK, ...(['all', 'some', 'none'] as const).map(b => read(`bin-${b}`, PASS_SAID[b]))];
  const ready = useAsked(current, speech), { can, wrong, submit, right } = useSubmit(current, waiting, ready);
  const [bins, getBins, setBins] = useLive<Record<string, string>>({}), [held, setHeld] = useState<string | null>(null);
  const answer = sortAnswer(q.items, q.items.map(i => bins[i] ?? ''));
  const full = q.items.every(i => bins[i]);
  function tapThing(id: string) { if (!can) return; sClink(); setHeld(id); void voice.say(matName(id)); }
  function tapBin(b: string) {
    if (!can) return;
    if (!held) { sNope(); return; }
    sClink(); setBins({ ...getBins(), [held]: b }); setHeld(q.items.find(i => i !== held && !getBins()[i]) ?? null);
  }
  const glowBins = lesson.glow.value ? Object.fromEntries(lesson.glow.value.split(',').map(p => p.split(':') as [string, string])) : {};
  return (
    <Shell current={current} kind="through sort" text={SORT_ASK} speech={speech} ready={ready && !waiting} stage={stage} tryIt={tryIt}>
      <div class="sort-pad">
      <div class="sort-things" role="group" aria-label="Things">
        {q.items.map(id => (
          <button key={id} class={cls('choice', 'dl-choice', 'sort-thing', held === id && 'held', bins[id] && 'placed')} aria-label={material(id).name} data-key={id} onPointerUp={() => tapThing(id)} onClick={e => e.preventDefault()}>
            <span class="choice-pic"><MaterialPic id={id} /></span><span class="choice-text">{material(id).name}</span>
            {bins[id] && <span class="in-bin" aria-hidden="true">{BIN_ICON[bins[id]!]}</span>}
          </button>
        ))}
      </div>
      <div class="sort-bins" role="group" aria-label="Bins">
        {(['all', 'some', 'none'] as const).map(b => (
          <button key={b} class={cls('choice', 'dl-choice', 'bin', isLit(`bin-${b}`) && 'speaking', Object.values(glowBins).includes(b) && 'hint')} aria-label={PASS_SAID[b]} data-key={`bin-${b}`} onPointerUp={() => tapBin(b)} onClick={e => e.preventDefault()}>
            <span class="bin-icon" aria-hidden="true">{BIN_ICON[b]}</span><span class="choice-text">{PASS_SAID[b].replace('.', '')}</span>
          </button>
        ))}
      </div>
      <Check on={full && can && !wrong.includes(answer) && !right} pulse={full && can} onTap={() => { if (full && can && !wrong.includes(answer)) submit(answer); else sNope(); }} />
      </div>
    </Shell>
  );
}
const BIN_ICON: Record<string, string> = { all: '☀️', some: '⛅', none: '🌑' };

// ---------- Shadows ----------

function ShadowView({ current, q, waiting }: { current: Current; q: ShadowQ; waiting: boolean }) {
  const lesson = lessonFor(current.signal), show = lesson.show.value, thing = shadowThing(q.thing);
  const [drag, setDrag] = useState<number | null>(null), svgRef = useRef<HTMLDivElement>(null);
  if (q.form === 'match') {
    const choices: ChoiceDef[] = q.choices.map(c => ({ key: c, pic: <ShadowPic icon={shadowThing(c).icon} /> }));
    return <Standard current={current} waiting={waiting} kind="shadow match" text={SHADOW_Q.match} speech={[thing.name as Phrase, SHADOW_Q.match]} choices={choices}
      stage={<div class="match-stage"><ThingPic icon={thing.icon} class="big" label={thing.name} />{show?.kind === 'match' && <ShadowPic icon={thing.icon} />}</div>} />;
  }
  // in a fuller lesson he drags the lamp: the shadow follows
  const dragging = lesson.tryIt.value === 'drag';
  const lampAt = drag !== null && dragging ? { x: drag, y: 40 } : show?.kind === 'lamp' ? { x: show.x, y: show.y } : null;
  const move = (e: PointerEvent) => {
    if (!dragging || !svgRef.current) return;
    const r = svgRef.current.getBoundingClientRect(), x = ((e.clientX - r.left) / r.width) * 100;
    setDrag(Math.max(6, Math.min(94, x)));
    if (Math.abs(x - 50) > 30) lesson.did();
  };
  const holder = (scene: ComponentChildren) => <div ref={svgRef} class={cls('shadow-holder', dragging && 'drag')} onPointerDown={move} onPointerMove={e => { if (e.buttons || e.pointerType === 'touch') move(e); }}>{scene}</div>;
  if (q.form === 'where') {
    const ready = useAsked(current, [SHADOW_Q.where]), { right, wrong, submit } = useSubmit(current, waiting, ready);
    const lamp = lampAt ?? STAGE.lamps[q.lamp];
    return (
      <Shell current={current} kind="shadow where" text={SHADOW_Q.where} speech={[SHADOW_Q.where]} ready={ready && !waiting}
        stage={holder(<ShadowScene icon={thing.icon} lamp={lamp} shadow={!!lampAt || !!right} spots={lampAt ? undefined : q.choices as ('left' | 'right')[]} onSpot={s => { if (!wrong.includes(s)) submit(s); }} picked={right ?? wrong.at(-1) ?? null} hint={lesson.glow.value} dragging={dragging} />)} />
    );
  }
  const ready = useAsked(current, [SHADOW_Q.lamp]), { right, wrong, submit } = useSubmit(current, waiting, ready);
  const lamps = (['left', 'top', 'right'] as const).map(id => ({ id, at: STAGE.lamps[id] }));
  return (
    <Shell current={current} kind="shadow lamp" text={SHADOW_Q.lamp} speech={[SHADOW_Q.lamp]} ready={ready && !waiting}
      stage={holder(lampAt
        ? <ShadowScene icon={thing.icon} lamp={lampAt} shadow dragging={dragging} />
        : <ShadowScene icon={thing.icon} lamp={null} cast={STAGE.lamps[q.answer as 'left']} shadow lamps={lamps} onLamp={id => { if (!wrong.includes(id)) submit(id); }} picked={right ?? wrong.at(-1) ?? null} hint={lesson.glow.value} />)} />
  );
}

// ---------- Mirrors ----------

function MirrorView({ current, q, waiting }: { current: Current; q: MirrorQ; waiting: boolean }) {
  const lesson = lessonFor(current.signal), show = lesson.show.value;
  const [tryBeam, setTryBeam] = useState(false);
  if (q.form === 'which') {
    const choices: ChoiceDef[] = q.choices.map(c => ({ key: c, pic: c === 'mirror' ? <MirrorPic /> : <MaterialPic id={c as MaterialId} />, text: c === 'mirror' ? SAID_NAMES.mirror : material(c).name }));
    const item = show?.kind === 'bounce' ? show.item : null;
    return <Standard current={current} waiting={waiting} kind="mirror which" text={MIRROR_Q.which} speech={[MIRROR_Q.which, ...q.choices.map(c => read(c, c === 'mirror' ? SAID_NAMES.mirror : matName(c)))]}
      stage={item || lesson.tryIt.value ? <BounceScene item={tryBeam ? 'mirror' : item ?? 'mirror'} beam={!!item || tryBeam} /> : undefined} choices={choices}
      tryIt={<TryButton lesson={lesson} kind="beam" icon="🔦" label="Shine the light" onTap={() => setTryBeam(true)} />} />;
  }
  if (q.form === 'spot') return <SpotView current={current} q={q} waiting={waiting} />;
  return <TurnView current={current} q={q} waiting={waiting} />;
}

/** Turn the mirror (or both mirrors) until the beam lights the gem: the beam follows every turn, traced by the ray code. ✓ to answer. */
function TurnView({ current, q, waiting }: { current: Current; q: Extract<MirrorQ, { form: 'turn' | 'two' }>; waiting: boolean }) {
  const lesson = lessonFor(current.signal), show = lesson.show.value, text = q.form === 'turn' ? MIRROR_Q.turn : MIRROR_Q.two;
  const ready = useAsked(current, [text]), { can, right, wrong, submit } = useSubmit(current, waiting, ready);
  const [turns, getTurns, setTurns] = useLive<Turn[]>(q.lab.mirrors.map(m => m.turn));
  const shown = show?.kind === 'lab' ? show.turns : right ? right.split(',').map(Number) as Turn[] : turns;
  const lab = withMirrors(q.lab, q.lab.mirrors.map((m, i) => ({ ...m, turn: shown[i] ?? m.turn })));
  const answer = turns.join(',');
  function turn(i: number) {
    if (!can) return;
    sClink();
    const t = [...getTurns()]; t[i] = ((t[i]! + 1) % 4) as Turn; setTurns(t);
  }
  return (
    <Shell current={current} kind={`mirror ${q.form}`} text={text} speech={[text]} ready={ready && !waiting} stage={<LabView lab={lab} beam onMirror={turn} />}>
      <Check on={can && !wrong.includes(answer)} pulse={can && !wrong.includes(answer)} onTap={() => { if (can && !wrong.includes(answer)) submit(answer); else sNope(); }} />
    </Shell>
  );
}

/** Which spot should the mirror go in? Tapping a spot puts the mirror there, and the beam shows where it goes. */
function SpotView({ current, q, waiting }: { current: Current; q: Extract<MirrorQ, { form: 'spot' }>; waiting: boolean }) {
  const lesson = lessonFor(current.signal), show = lesson.show.value;
  const ready = useAsked(current, [MIRROR_Q.spot]), { right, wrong, submit } = useSubmit(current, waiting, ready);
  const at = show?.kind === 'lab' && show.spot !== undefined ? show.spot : right !== null ? Number(right) : null;
  const lab = at !== null ? { ...q.lab, mirrors: [{ ...q.spots[at]!, turn: q.turn }] } : q.lab;
  return (
    <Shell current={current} kind="mirror spot" text={MIRROR_Q.spot} speech={[MIRROR_Q.spot]} ready={ready && !waiting}
      stage={<LabView lab={lab} beam={at !== null} spots={q.spots} onSpot={i => { if (!wrong.includes(`${i}`)) submit(`${i}`); }} picked={at} hint={lesson.glow.value ? Number(lesson.glow.value) : null} />}
      tryIt={<div class="mirror-key" aria-hidden="true"><span class="key-mirror" style={{ transform: `rotate(${q.turn === 1 ? 45 : -45}deg)` }} /></div>} />
  );
}

// ---------- Shake and Sound ----------

function SoundView({ current, q, waiting }: { current: Current; q: SoundQ; waiting: boolean }) {
  const lesson = lessonFor(current.signal), show = lesson.show.value, [plucked, setPlucked] = useState(false), stop = useRef<() => void>(() => {});
  useEffect(() => () => stop.current(), []);
  const pluckTry = <TryButton lesson={lesson} kind="pluck" icon="👆" label="Pluck the string" onTap={() => { if (plucked) { stop.current(); setPlucked(false); } else { stop.current = hum(3); setPlucked(true); } }} />;
  if (q.form === 'loud') {
    const text = LOUD_Q[q.ask], pulse = show?.kind === 'rings' ? show.id : null;
    const choices: ChoiceDef[] = q.choices.map(c => ({ key: c, pic: <SoundPic id={c} pulse={pulse === c} />, text: sound(c).name }));
    return <Standard current={current} waiting={waiting} kind="sound loud" text={text} speech={[text, ...q.choices.map(c => read(c, sound(c).name as Phrase))]} choices={choices}
      after={async () => { for (const c of q.choices) { loudness(sound(c).loud); await new Promise(r => setTimeout(r, 500)); } }} />;
  }
  if (q.form === 'shake') {
    const pulse = show?.kind === 'rings' ? show.id : null;
    const choices: ChoiceDef[] = q.choices.map(c => ({ key: c, pic: <ShakerPic id={c} shaking={c === q.answer || pulse === c} />, text: SHAKERS.find(s => s.id === c)!.name }));
    const str = show?.kind === 'string' || lesson.tryIt.value === 'pluck';
    return <Standard current={current} waiting={waiting} kind="sound shake" text={SHAKE_Q} speech={[SHAKE_Q, ...q.choices.map(c => read(c, SHAKERS.find(s => s.id === c)!.name as Phrase))]} choices={choices}
      stage={str ? <StringPic shaking={plucked || (show?.kind === 'string' && show.shaking)} /> : undefined} tryIt={pluckTry} />;
  }
  const f = SOUND_Q3[q.which], shaking = (show?.kind === 'string' && show.shaking) || plucked;
  const choices: ChoiceDef[] = q.choices.map(c => ({ key: c, pic: <span class="emo">{SOUND3_ICONS[c]}</span>, text: c }));
  const scene = q.which === 'stop' ? <StringPic shaking={shaking} />
    : q.which === 'harder' ? <ShakerPic id="drum" shaking={shaking} />
    : <span class={cls('paper-scene', shaking && 'shaking')}><span class="emo">🔊</span>{shaking && <span class="rings" aria-hidden="true"><i /><i style={{ animationDelay: '.35s' }} /></span>}<span class="emo paper">📄</span></span>;
  return <Standard current={current} waiting={waiting} kind="sound why sentences" text={f.q} speech={[f.q, ...q.choices.map(c => read(c, c as Phrase))]} choices={choices} stage={scene} tryIt={pluckTry} />;
}

// ---------- Signals ----------

/** The scene for "how do you say hello": you, the sea (dark, or a big rock between), your friend far away. */
function HelloScene({ scene, lit }: { scene: 'dark' | 'rock'; lit: boolean }) {
  return (
    <svg class={cls('hello-scene', scene)} viewBox="0 0 200 90" role="img" aria-label={scene === 'dark' ? 'You and your friend far away in the dark' : 'You and your friend far away, with a big rock between'}>
      <rect width="200" height="90" rx="12" fill={scene === 'dark' ? '#040a1a' : '#5aa8d8'} />
      {scene === 'dark' && <g fill="#fff">{[[30, 12], [80, 20], [150, 10], [178, 26], [110, 8]].map(([x, y]) => <circle cx={x} cy={y} r="1.2" />)}</g>}
      {scene === 'rock' && <path d="M78 74 Q86 22 104 20 Q124 18 128 74 Z" fill="#7a7a84" stroke="#141414" stroke-width="3" />}
      {lit && scene === 'dark' && <path d="M34 54 L168 40 L168 66 Z" fill="#fff2b0" opacity=".55" />}
      {lit && scene === 'rock' && <g fill="none" stroke="#fff" stroke-width="2.5" opacity=".9">{[18, 34, 52].map(r => <path d={`M${30 + r} ${56 - r * 0.9} Q${30 + r * 1.6} 56 ${30 + r} ${56 + r * 0.5}`} />)}<path d="M100 14 Q140 4 160 40" stroke-dasharray="4 4" /></g>}
      <rect x="0" y="74" width="200" height="16" fill={scene === 'dark' ? '#0a1430' : '#2a6bd8'} />
      <text x="26" y="72" font-size="22" text-anchor="middle">🧒</text>
      <text x="174" y="72" font-size="18" text-anchor="middle" opacity={scene === 'dark' && !lit ? 0.25 : 1}>🧒</text>
    </svg>
  );
}

function SignalView({ current, q, waiting }: { current: Current; q: SignalQ; waiting: boolean }) {
  const lesson = lessonFor(current.signal), show = lesson.show.value, [tried, setTried] = useState(false);
  if (q.form === 'hello') {
    const h = HELLO[q.scene];
    const choices: ChoiceDef[] = q.choices.map(c => { const it = SIGNAL_ITEMS.find(s => s.id === c)!; return { key: c, pic: <span class="emo">{it.icon}</span>, text: it.said.replace('.', '') }; });
    return <Standard current={current} waiting={waiting} kind="signal hello" text={h.q} speech={[h.q, ...q.choices.map(c => read(c, SIGNAL_ITEMS.find(s => s.id === c)!.said))]}
      stage={<HelloScene scene={q.scene} lit={show?.kind === 'hello' || tried} />} choices={choices}
      tryIt={<TryButton lesson={lesson} kind="flash" icon="🔦" label="Shine the flashlight" onTap={() => setTried(true)} />} />;
  }
  if (q.form === 'copy') return <CopyView current={current} q={q} waiting={waiting} />;
  return <KeyView current={current} q={q} waiting={waiting} />;
}

/** The key: count the lighthouse's flashes, and say what it means. */
function KeyView({ current, q, waiting }: { current: Current; q: Extract<SignalQ, { form: 'key' }>; waiting: boolean }) {
  const lesson = lessonFor(current.signal), show = lesson.show.value, voice = useVoice();
  const [on, setOn] = useState(false), lit = show?.kind === 'flash' ? show.on : on;
  async function play() { for (let i = 0; i < q.n && voice.active; i++) { setOn(true); beep(0.25); await voice.wait(450); setOn(false); await voice.wait(450); } }
  const choices: ChoiceDef[] = KEY.map(k => ({ key: `${k.n}`, pic: <span class="key-pic"><span class="emo">{k.icon}</span><FlashMarks pattern={'s'.repeat(k.n)} /></span>, text: k.said }));
  return <Standard current={current} waiting={waiting} kind="signal key" text={KEY_Q} speech={[KEY_Q, ...KEY.map(k => read(`${k.n}`, k.said))]} choices={choices} after={play}
    stage={<div class="lighthouse-stage"><Lighthouse on={lit} /><button class="icon-btn watch-btn" aria-label="Watch again" onClick={() => void play()}>👀</button></div>} />;
}

/** Copy the lighthouse: it flashes a pattern of short and long; he taps • and — to make the same, then ✓. */
function CopyView({ current, q, waiting }: { current: Current; q: Extract<SignalQ, { form: 'copy' }>; waiting: boolean }) {
  const voice = useVoice(), lesson = lessonFor(current.signal), show = lesson.show.value;
  const [on, setOn] = useState(false), [mine, getMine, setMine] = useLive(''), [mineOn, setMineOn] = useState(false);
  async function play() {
    for (const f of q.pattern) { if (!voice.active) return; setOn(true); beep(f === 'l' ? 0.6 : 0.18); await voice.wait(f === 'l' ? 750 : 260); setOn(false); await voice.wait(380); }
  }
  const ready = useAsked(current, [COPY_Q], play), { can, right, wrong, submit } = useSubmit(current, waiting, ready);
  function add(f: 's' | 'l') {
    if (!can || getMine().length >= q.pattern.length) { sNope(); return; }
    setMine(getMine() + f); setMineOn(true); beep(f === 'l' ? 0.6 : 0.18);
    setTimeout(() => setMineOn(false), f === 'l' ? 600 : 200);
  }
  const lit = show?.kind === 'flash' ? show.on : on;
  return (
    <Shell current={current} kind="signal copy" text={COPY_Q} speech={[COPY_Q]} ready={ready && !waiting}
      stage={<div class="lighthouse-stage"><Lighthouse on={lit} /><FlashMarks pattern={show?.kind === 'flash' ? q.pattern.slice(0, show.n) : ''} lit={show?.kind === 'flash' && show.on ? (show.i ?? -1) : -1} /><button class="icon-btn watch-btn" aria-label="Watch again" onClick={() => void play()}>👀</button></div>}>
      <div class="copy-pad">
      <div class={cls('my-flashes', mineOn && 'on')}><span class="my-lamp" aria-hidden="true">💡</span><FlashMarks pattern={right ?? mine} empty={Math.max(0, q.pattern.length - (right ?? mine).length)} /></div>
      <div class="flash-btns" role="group" aria-label="Flashes">
        <button class="big-btn flash-btn" aria-label="Short" data-key="s" onPointerUp={() => add('s')} onClick={e => e.preventDefault()}><i class="short" /></button>
        <button class="big-btn flash-btn" aria-label="Long" data-key="l" onPointerUp={() => add('l')} onClick={e => e.preventDefault()}><i class="long" /></button>
        <button class="icon-btn undo-btn" aria-label="Undo" onPointerUp={() => { if (can) setMine(getMine().slice(0, -1)); }} onClick={e => e.preventDefault()}>⌫</button>
        <Check on={can && mine.length === q.pattern.length && !wrong.includes(mine)} pulse={can && mine.length === q.pattern.length}
          onTap={() => { if (can && mine.length === q.pattern.length && !wrong.includes(mine)) { if (submit(mine) === 'incorrect') setMine(''); } else sNope(); }} />
      </div>
      </div>
    </Shell>
  );
}

// ---------- the question ----------

export function QuestionView({ current, waiting }: { current: Current; waiting: boolean }) {
  const q: Question = current.problem.q;
  if (q.kind === 'see') return <SeeView current={current} q={q} waiting={waiting} />;
  if (q.kind === 'through') return <ThroughView current={current} q={q} waiting={waiting} />;
  if (q.kind === 'shadow') return <ShadowView current={current} q={q} waiting={waiting} />;
  if (q.kind === 'mirror') return <MirrorView current={current} q={q} waiting={waiting} />;
  if (q.kind === 'sound') return <SoundView current={current} q={q} waiting={waiting} />;
  return <SignalView current={current} q={q} waiting={waiting} />;
}
