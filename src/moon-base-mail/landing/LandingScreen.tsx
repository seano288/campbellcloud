// The Landing, the reward he flies with his hands. First the card: what the supply ship brings (the newest module waiting, or a supply
// crate), its number, and his bests. Then he lands it: he holds the big Engine button to slow the fall (or rise), and a finger held on
// the moon slides the ship toward it. It cannot be failed (sim.ts): a hard landing bounces on its legs, and off the pad it hops across by
// itself. When it settles on the pad, the results: how soft and how close, his bests, the Bolts, the moon rock it brought back, any special
// crate, and the module waiting to be put on a plot (the Base opens to put it down).
//
// Controls stay clear of the screen's bottom edge and sides, which belong to iPadOS. Keys work on a computer: up or space fires the
// engine, left and right slide.
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { sCheer, sChime, sFanfare } from '../../audio/sfx';
import { confetti } from '../../celebrate/effects';
import { earnedLine } from '../../currency/kind';
import { IconButton } from '../../ui/bits';
import { CurrencyIcon } from '../../ui/currency';
import { Shown } from '../art/pics';
import { CUR } from '../branding';
import { player, settleGo } from '../game';
import { land, screen } from '../nav';
import { said, type Phrase } from '../phrases';
import { startRound } from '../round';
import { useVoiceScope, type VoiceScope } from '../voice';
import { BADGES, has, lightsHex, paintHex, planGo, specOf, type GoPay } from '../base/base';
import { ModuleArt, moduleName, moduleWords } from '../base/BaseMap';
import { RockArt, specialWords } from '../base/BaseScreen';
import { rockFor } from '../base/gen';
import { createScene } from './render';
import { closeWord, createSim, softWord, STEP, step, takeEvents, type Input } from './sim';
import { engineBurst, hopSound, legsBump, touchdown } from './sounds';

type Phase = 'card' | 'live' | 'end';
/** Lines that don't matter are dropped while the voice is mid-sentence, so it never queues up behind the action. */
function commentator(voice: VoiceScope) {
  let talking = false;
  return (line: readonly Phrase[], must = false) => {
    if (talking && !must) return;
    talking = true;
    void voice.say(...line).then(() => { talking = false; });
  };
}

export function LandingScreen() {
  const voice = useVoiceScope(), state = player.state.value, b = state.base;
  const plan = useMemo(() => planGo(b), []);
  const look = useMemo(() => ({ kind: b.lander, paint: paintHex(b), lights: lightsHex(b), carrying: true }), []);
  const rock = useMemo(() => rockFor(plan.n, has(b, 'module:moonmine')), []);
  const [phase, setPhase] = useState<Phase>('card'), [pay, setPay] = useState<GoPay | null>(null), [result, setResult] = useState<{ soft: number; close: number } | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null), engine = useRef(false), finger = useRef<number | null>(null), keys = useRef(new Set<string>());
  const sceneRef = useRef<ReturnType<typeof createScene> | null>(null);

  useEffect(() => {
    if (phase !== 'card') return;
    void voice.say('Landing', ...(plan.n <= 100 ? [`${plan.n}` as Phrase] : []), ...(plan.landing.night ? ['Night landing!' as const] : []),
      ...(plan.carrying ? moduleWords(plan.carrying).map(said) : ['A supply crate for the crew!' as const]));
  }, [phase]);

  useEffect(() => {
    if (phase !== 'live') return;
    const stop = new AbortController();
    const s = createSim(plan.landing, specOf(b)), scene = createScene(canvas.current!, plan.landing);
    sceneRef.current = scene;
    if (import.meta.env.DEV) Object.assign(window, { __landing: s, __scene: scene });
    const say = commentator(voice);
    say(['Hold the engine to slow down!', 'Slide your finger to steer!'], true);
    const key = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (e.type === 'keydown') keys.current.add(k); else keys.current.delete(k);
      if (k.startsWith('arrow') || k === ' ') e.preventDefault();
    };
    addEventListener('keydown', key, { signal: stop.signal }); addEventListener('keyup', key, { signal: stop.signal });
    const hold = (e: TouchEvent) => { if ((e.target as Element).closest('canvas,.mb-engine')) e.preventDefault(); };
    const root = canvas.current!.closest('.landing-screen')!;
    for (const type of ['touchstart', 'touchmove'] as const) root.addEventListener(type, hold as EventListener, { passive: false, signal: stop.signal });
    addEventListener('resize', () => scene.resize(), { signal: stop.signal });
    let raf = 0, last = 0, spare = 0, done = false, burst = 0;
    const loop = (ms: number) => {
      raf = requestAnimationFrame(loop);
      const now = ms / 1000, dt = last ? Math.min(0.1, now - last) : 0;
      last = now;
      if (document.hidden) return;
      spare += dt;
      while (spare >= STEP) {
        spare -= STEP;
        const k = keys.current, to = finger.current !== null ? scene.toWorld(finger.current) : k.has('arrowleft') ? s.x - 40 : k.has('arrowright') ? s.x + 40 : null;
        const input: Input = { engine: engine.current || k.has('arrowup') || k.has(' '), to };
        step(s, input);
      }
      if (s.engine && now - burst > 0.25) { burst = now; engineBurst(); }
      for (const e of takeEvents(s)) {
        if (e.t === 'touch') { legsBump(e.speed); scene.puff(s.x, s.y - 6, now); }
        if (e.t === 'bounce') say([e.speed > 15 ? 'Big bounce!' : 'Bump!']);
        if (e.t === 'hop') { hopSound(); say(['Hop, hop!']); }
        if (e.t === 'idle') say(['Hold the engine to slow down!']);
        if (e.t === 'padTouch') say(['Touchdown!'], true);
        if (e.t === 'landed' && !done) {
          done = true;
          touchdown();
          setResult({ soft: e.soft, close: e.close });
          setPay(settleGo(player, plan, { soft: e.soft, close: e.close }));
          setPhase('end');
        }
      }
      scene.frame(s, now, look);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); stop.abort(); };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'end' || !pay || !result) return;
    void (async () => {
      sFanfare(); confetti(40, voice.signal);
      await voice.say(softWord(result.soft) as Phrase, closeWord(result.close) as Phrase);
      if (pay.bestSoft) { sCheer(); await voice.say('Softest landing!', 'New best!'); }
      if (pay.bestClose) { sCheer(); await voice.say('Closest to the middle!', 'New best!'); }
      await voice.say(earnedLine(CUR, pay.bolts));
      await voice.say('Here is a moon rock!', said(rock.colour), said(rock.word));
      if (pay.special) { sChime(); await voice.say('A special crate!', ...specialWords(pay.special)); }
      if (pay.carrying) { sChime(); await voice.say('Your new module is here!'); }
      else await voice.say('A supply crate for the crew!');
      for (const t of pay.badges) { sChime(); await voice.say('You won a badge!', said(BADGES.find(x => x.id === t)!.name)); }
    })();
  }, [phase]);

  const after = player.state.value.base;
  const exit = () => { if (voice.active) screen.value = 'base'; };
  if (phase === 'card') {
    return (
      <div class="screen landing-screen mb-card-screen">
        <header class="mb-head"><IconButton label="Moon Base" onClick={exit}>🏠</IconButton><h1>Landing {plan.n}</h1></header>
        <div class="mb-go-card">
          <div class="mb-go-cargo">{plan.carrying ? <ModuleArt id={plan.carrying} b={b} size={72} /> : <span class="mb-crate" aria-hidden="true">📦</span>}
            <span class="mb-go-name">{plan.carrying ? moduleName(plan.carrying) : 'Supplies'}</span></div>
          {plan.special && <div class="mb-go-special">🎁 + <Shown show={plan.special.icon} size={32} /></div>}
          <div class="mb-bests">🪶 {b.bests.soft ?? '–'} · 🎯 {b.bests.close ?? '–'}</div>
          <button class="big-btn go go-btn pulse" aria-label="Go" onClick={() => { if (voice.active) setPhase('live'); }}><span class="e">🛬</span><span class="go-word">Go</span></button>
        </div>
      </div>
    );
  }
  return (
    <div class="screen landing-screen">
      <canvas ref={canvas} class="mb-canvas"
        onPointerDown={e => { (e.target as Element).setPointerCapture?.(e.pointerId); finger.current = e.clientX - (e.target as Element).getBoundingClientRect().left; }}
        onPointerMove={e => { if (finger.current !== null) finger.current = e.clientX - (e.target as Element).getBoundingClientRect().left; }}
        onPointerUp={() => { finger.current = null; }} onPointerCancel={() => { finger.current = null; }} />
      <div class="mb-landing-top"><IconButton label="Moon Base" onClick={exit}>🏠</IconButton></div>
      {phase === 'live' && (
        <button class="big-btn mb-engine" aria-label="Engine"
          onPointerDown={e => { e.preventDefault(); (e.target as Element).setPointerCapture?.(e.pointerId); engine.current = true; }}
          onPointerUp={() => { engine.current = false; }} onPointerCancel={() => { engine.current = false; }} onPointerLeave={() => { engine.current = false; }}>
          <span aria-hidden="true">🔥</span><span class="side-word">Engine</span>
        </button>
      )}
      {phase === 'end' && pay && result && (
        <div class="reward mb-land-result fl-result">
          <h2>{softWord(result.soft)}</h2>
          <div class="mb-result-row"><span>🪶 {result.soft}{pay.bestSoft ? ' ⭐' : ''}</span><span>🎯 {result.close}{pay.bestClose ? ' ⭐' : ''}</span></div>
          <div class="mb-result-row"><span class="mb-earn"><CurrencyIcon kind={CUR} size={36} /> +{pay.bolts}</span><span class="mb-rock"><RockArt r={rock} size={56} /> {rock.colour} {rock.word}</span></div>
          {pay.special && <div class="mb-result-row">🎁 <Shown show={pay.special.icon} size={36} /> {pay.special.name}</div>}
          <div class="mb-result-row">{pay.carrying ? <><ModuleArt id={pay.carrying} b={after} size={44} /> {moduleName(pay.carrying)}</> : <>📦 Supplies</>}</div>
          <div class="btns">
            <button class={`big-btn go ${after.toPlace ? 'pulse' : ''}`} aria-label="Moon Base" onClick={exit}><span class="e">🌕</span><span class="btn-word">Base</span></button>
            {after.landings > 0 && !after.toPlace && <button class="big-btn go race-btn" aria-label="Land again" onClick={() => { if (voice.active) land(); }}><span class="race-flag">🛬</span><span class="race-count">{after.landings}</span></button>}
            <button class="big-btn go again second" aria-label="Play" onClick={() => { if (voice.active) startRound(); }}><span class="e">▶</span></button>
          </div>
        </div>
      )}
    </div>
  );
}
