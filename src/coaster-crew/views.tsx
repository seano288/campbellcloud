// The questions on screen: the scene, drawn and ready to move, and two or three choices under it (beside it on a wide screen). What he must
// understand is said once as it appears (🔊 says it again), and taps wait until it has been said. Word, ground and thing buttons light up
// as their names are said; cart and arrow pictures are not read out. A right answer plays the scene first, so he sees what happens, then
// counts. A miss's lesson (questions/teach.ts) plays on the scene itself.
import { useEffect, useRef, useState } from 'preact/hooks';
import { sClink } from '../audio/sfx';
import type { ProblemInstance } from '../learning/round';
import { drawScene, laneAt } from './art/scene';
import { drawCart, drawThing } from './art/draw';
import type { Asking } from './mix';
import type { Phrase } from './phrases';
import { arrowAngle, choiceName, type Question } from './questions/problems';
import { help, playerFor, type Player } from './questions/teach';
import { laneDuration, lanesOf } from './questions/scenes';
import { cartColour, groundOf, type GroundId } from './questions/tables';
import { useVoice, type VoiceScope } from './voice';

type Current = ProblemInstance<Asking, string>;
const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');
const say = (x: string) => x as Phrase;
const named = (q: Question) => q.choiceKind === 'word' || q.choiceKind === 'ground' || q.choiceKind === 'thing';

async function askIt(v: VoiceScope, q: Question, setLit: (id: string | null) => void) {
  await v.say(...q.ask.map(say));
  if (named(q)) for (const c of q.choices) { if (!v.active) break; setLit(c); await v.say(say(choiceName(q.choiceKind, c)!)); }
  setLit(null);
}

/** The scene: drawn every frame from the lanes' clocks; a tap on a lane plays it while the hands-on lesson waits for one. */
export function SceneCanvas({ q, player, label }: { q: Question; player: Player; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!, ctx = c.getContext('2d')!;
    let raf = 0;
    const t0 = performance.now();
    const draw = () => {
      raf = requestAnimationFrame(draw);
      const r = c.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
      if (!r.width || !r.height) return;
      if (c.width !== Math.round(r.width * dpr) || c.height !== Math.round(r.height * dpr)) { c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const marks = { ...player.marks.peek(), tap: player.waiting.peek() };
      drawScene(ctx, q.scene, r.width, r.height, { clocks: player.clocks(), marks, idle: (performance.now() - t0) / 1000 });
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [q, player]);
  const tap = (e: PointerEvent) => {
    const b = ref.current!.getBoundingClientRect();
    player.tap(lanesOf(q.scene) > 1 ? laneAt(q.scene, b.height, e.clientY - b.top) : 0);
  };
  return <canvas ref={ref} class={cls('cc-scene', `n${lanesOf(q.scene)}`, `sc-${q.scene.type}`)} data-waiting={player.waiting.value.join(',')} role="img" aria-label={label} onPointerDown={tap} />;
}

/** A choice's picture: a cart in its colour, an arrow, a patch of ground, a thing. */
function ChoicePic({ q, id }: { q: Question; id: string }) {
  if (q.choiceKind === 'cart') return <MiniCanvas draw={(ctx, w, h) => drawCart(ctx, w / 2, h * .9, 0, cartColour(id), Math.min(w * .8, h * 1.6))} />;
  if (q.choiceKind === 'thing') return <MiniCanvas draw={(ctx, w, h) => drawThing(ctx, id, w / 2, h / 2, Math.min(w, h) * .9)} />;
  if (q.choiceKind === 'ground') return <span class={cls('cc-ground-swatch', `g-${id}`)} style={{ background: groundOf(id as GroundId).colour }} aria-hidden="true" />;
  if (q.choiceKind === 'arrow') {
    // Bump's first Level: what the still ball does (rolls on the way the other was going, stays, or comes back)
    const sc = q.scene;
    if (id === 'on' || id === 'stay' || id === 'back') {
      const dir = sc.type === 'bump' && sc.v.x < 0 ? 180 : 0, a = id === 'on' ? dir : (dir + 180) % 360;
      return (
        <svg viewBox="24 8 72 44" class="cc-arrow-pic wide" aria-hidden="true">
          <circle cx="50" cy="30" r="14" fill="#fff" stroke="#14161b" stroke-width="4" /><circle cx="50" cy="30" r="6" fill="#2f80ed" />
          {id !== 'stay' && <g transform={`rotate(${a} 50 30)`}><path d="M68 30 H86 M78 21 L88 30 L78 39" fill="none" stroke="#14161b" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" /><path d="M68 30 H86 M78 21 L88 30 L78 39" fill="none" stroke="#2fa84f" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" /></g>}
          {id === 'stay' && <path d="M30 52 H70" stroke="#14161b" stroke-width="4" stroke-linecap="round" />}
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 60 60" class="cc-arrow-pic" aria-hidden="true">
        <g transform={`rotate(${arrowAngle(id)} 30 30)`}><path d="M10 30 H48 M36 17 L50 30 L36 43" fill="none" stroke="#14161b" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" /><path d="M10 30 H48 M36 17 L50 30 L36 43" fill="none" stroke="#ffd23f" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" /></g>
      </svg>
    );
  }
  return null;
}
function MiniCanvas({ draw }: { draw(ctx: CanvasRenderingContext2D, w: number, h: number): void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!, r = c.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1), w = r.width || 80, h = r.height || 50;
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    const ctx = c.getContext('2d')!; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
    draw(ctx, w, h);
  }, []);
  return <canvas ref={ref} class="cc-mini" aria-hidden="true" />;
}

const ARROW_NAMES: Record<string, string> = { a0: 'Right', a90: 'Down', a180: 'Left', a270: 'Up', on: 'Rolls on', stay: 'Stays still', back: 'Rolls back' };
function ariaOf(q: Question, id: string, i: number) {
  if (q.choiceKind === 'cart') return `${id[0]!.toUpperCase()}${id.slice(1)} cart`;
  if (q.choiceKind === 'arrow') return ARROW_NAMES[id] ?? `Arrow ${i + 1}`;
  return choiceName(q.choiceKind, id) ?? id;
}

/** `waiting`: taps don't count right now (a lesson is running, or it's been answered). */
export function QuestionView({ current, waiting }: { current: Current; waiting: boolean }) {
  const q = current.problem.q, voice = useVoice(), player = playerFor(current.signal, q);
  const [lit, setLit] = useState<string | null>(null), [ready, setReady] = useState(false);
  const [wrong, setWrong] = useState<string[]>([]), [done, setDone] = useState<string | null>(null), [playing, setPlaying] = useState(false);
  useEffect(() => {
    void (async () => { await askIt(voice, q, setLit); if (!current.signal.aborted) setReady(true); })();
  }, []);
  const can = ready && !waiting && !done && !playing && !player.waiting.value.length;
  async function tap(id: string) {
    if (!can || current.actions.busy || wrong.includes(id)) return;
    sClink();
    if (id !== q.answer) { if (current.actions.submit(id) === 'incorrect') setWrong(w => [...w, id]); return; }
    // right: watch it happen, then it counts
    setPlaying(true); setDone(id);
    voice.cancel();
    player.reset(); player.marks.value = { ...player.marks.peek(), lit: null };
    const longest = Math.max(...Array.from({ length: lanesOf(q.scene) }, (_, i) => laneDuration(q.scene, i)));
    await player.play('all', Math.max(1, longest / 2.4), current.signal);
    if (!current.signal.aborted) current.actions.submit(id);
  }
  const hint = player.hint.value;
  return (
    <div class={cls('game', 'cc', `k-${q.kind}`, `lv-${q.level}`, `ck-${q.choiceKind}`)} data-ready={can ? 'yes' : 'no'}>
      <div class="ask">
        <button class="say-btn" aria-label="Say it again" onClick={() => void askIt(voice, q, setLit)}>🔊</button>
        <h2>{q.text}</h2>
        <button class="help-btn" aria-label="Help" onClick={() => current.actions.help(() => help(current.problem, current.signal))}>🔎</button>
      </div>
      <div class={cls('cc-body', `sb-${q.scene.type}`)}>
        <div class={cls('cc-stage', `st-${q.scene.type}`)}><SceneCanvas q={q} player={player} label={q.text} /></div>
        <div class={cls('cc-choices', `n${q.choices.length}`)}>
          {q.choices.map((id, i) => (
            <button key={id} class={cls('choice', 'cc-choice', `ck-${q.choiceKind}`, wrong.includes(id) && 'wrong', (done === id || hint === id) && 'right', lit === id && 'lit')}
              aria-label={ariaOf(q, id, i)} onClick={() => void tap(id)}>
              <ChoicePic q={q} id={id} />
              {named(q) && <span class="nm">{choiceName(q.choiceKind, id)}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
