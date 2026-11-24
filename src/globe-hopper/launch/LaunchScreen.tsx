// The Launch, the reward he flies. First the card: his rocket on the pad, its payload, and the photo mission ("Fly over Africa and take a
// picture!"). Then the countdown from ten, the climb (a finger on the screen burns and steers, Drop drops each stage), the orbit (let the
// payload go, then tap when the place is right under the camera, then free time to photograph whatever he flies over), and the results:
// the Bolts, his bests, the payload on his Station, the photos, a patch, his rank. It cannot be failed (launch/sim.ts, orbit/sim.ts).
//
// "Watch the launch" (replay) flies his rocket by itself, from the countdown to orbit, and pays nothing.
//
// Controls stay clear of the screen's bottom edge and sides, which belong to iPadOS. Keys work on a computer: space burns, the arrows
// steer, D drops, P takes a picture.
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { sChime, sFanfare, sWhoosh } from '../../audio/sfx';
import { confetti } from '../../celebrate/effects';
import { earnedLine } from '../../currency/kind';
import { IconButton } from '../../ui/bits';
import { CurrencyIcon } from '../../ui/currency';
import { sceneFor } from '../art/base';
import { BaseCanvas } from '../art/BaseCanvas';
import { MiniGlobe } from '../art/MiniGlobe';
import { has, planLaunch, rankOf, type LaunchPay } from '../base/base';
import { PAYLOADS, ROCKET_KINDS, SUPPLIES, TEST_PAYLOAD } from '../base/catalog';
import { targetEmoji, targetLabel, targetSaid, whereSaid } from '../base/labels';
import { targetOf, type TargetId } from '../base/missions';
import { CUR } from '../branding';
import { player, settleLaunch } from '../game';
import { launch as launchAgain, screen } from '../nav';
import { createOrbitScene } from '../orbit/render';
import { createSim as createOrbit, stepSim as stepOrbit, takeEvents as orbitEvents, STEP as OSTEP, type Sim as OrbitSim } from '../orbit/sim';
import type { Phrase } from '../phrases';
import { startRound } from '../round';
import { useVoiceScope, type VoiceScope } from '../voice';
import { PatchBadge } from '../base/PatchBadge';
import { createScene } from './render';
import { createSim, inputFor, smoothness, starsFor, STEP, stepSim, takeEvents, type Sim } from './sim';
import { cameraClick, dropSound, engineSound, type Engine } from './sounds';
import { seeded } from '../../game/rng';

type Phase = 'card' | 'launch' | 'orbit' | 'end';
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion:reduce)').matches;
const COUNT: Record<number, Phrase> = { 10: 'Ten.', 9: 'Nine.', 8: 'Eight.', 7: 'Seven.', 6: 'Six.', 5: 'Five.', 4: 'Four.', 3: 'Three.', 2: 'Two.', 1: 'One.' };
const say = (x: string) => x as Phrase;

/** Lines that don't matter are dropped while the voice is mid-sentence, so it never queues up behind the action. */
function commentator(voice: VoiceScope) {
  // which line is talking: a line cut off by a newer one finishes too, and must not mark the newer one as done
  let talking = 0, n = 0;
  return (line: readonly Phrase[], must = false) => {
    if (talking && !must) return;
    const mine = ++n;
    talking = mine;
    void voice.say(...line).then(() => { if (talking === mine) talking = 0; });
  };
}
function missionLine(targets: readonly { id: TargetId }[]): Phrase[] {
  const [first, ...rest] = targets;
  return ['Fly over', ...targetSaid(first!.id), ...rest.flatMap(t => ['Then' as Phrase, ...targetSaid(t.id)]), 'and take a picture!'];
}

interface Result { pay: LaunchPay | null; stars: 1 | 2 | 3; smooth: number; caught: TargetId[] }

export function LaunchScreen({ replay = false }: { replay?: boolean }) {
  const voice = useVoiceScope(), a = player.state.value.base;
  const plan = useMemo(() => planLaunch(a), []);
  const start = useRef({ base: a }).current;
  const [phase, setPhase] = useState<Phase>('card'), [armed, setArmed] = useState(false), [result, setResult] = useState<Result | null>(null);
  const [drop, setDrop] = useState<null | 'boosters' | 'main'>(null), [deploy, setDeploy] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null), tipEl = useRef<HTMLDivElement>(null), gotEl = useRef<HTMLSpanElement>(null);
  const finger = useRef<{ id: number; x: number } | null>(null), dropTap = useRef(false), photoTap = useRef(false), deployTap = useRef(false), keys = useRef(new Set<string>());
  const launchResult = useRef<{ smooth: number } | null>(null);
  const engine = useRef<Engine | null>(null);
  const payloadIcon = PAYLOADS.find(p => p.id === plan.payload)?.icon ?? (plan.payload === TEST_PAYLOAD.id ? TEST_PAYLOAD.icon : plan.payload.startsWith('m:') ? '🧩' : SUPPLIES.icon);
  const tip = (text: string) => { if (tipEl.current) tipEl.current.textContent = text; };

  // the card
  useEffect(() => {
    if (phase !== 'card') return;
    if (replay) { setPhase('launch'); return; }
    void voice.say(...missionLine(plan.m.targets), ...(plan.night ? ['Night launch!' as const] : []));
  }, [phase]);

  const keyHandler = () => {
    const key = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (e.type === 'keydown') keys.current.add(k); else keys.current.delete(k);
      if (e.type === 'keydown' && k === 'd') dropTap.current = true;
      if (e.type === 'keydown' && (k === 'p' || k === 'enter')) photoTap.current = true;
      if (k.startsWith('arrow') || k === ' ') e.preventDefault();
    };
    addEventListener('keydown', key); addEventListener('keyup', key);
    return () => { removeEventListener('keydown', key); removeEventListener('keyup', key); };
  };

  // the climb
  useEffect(() => {
    if (phase !== 'launch') return;
    const stop = new AbortController();
    const s: Sim = createSim({ boosters: !!(start.base.rockets[plan.kind] && (plan.look.boosters !== 'p:boosters:none' || plan.kind === 'heavy')), upper: ROCKET_KINDS[plan.kind].upper, load: plan.load, calm: plan.calm, seed: plan.m.n });
    const scene = createScene(canvas.current!, { look: plan.look, night: plan.night, guide: plan.guide, base: sceneFor(start.base, plan.night), reduced: reduced() });
    if (import.meta.env.DEV) Object.assign(window, { __launch: s });
    const sayIt = commentator(voice), unkey = keyHandler(), rng = seeded(7);
    engine.current = engineSound();
    const root = canvas.current!.closest('.launch-screen')!;
    for (const type of ['touchstart', 'touchmove'] as const) root.addEventListener(type, (e => { if ((e.target as Element).closest('canvas,.ls-act')) e.preventDefault(); }) as EventListener, { passive: false, signal: stop.signal });
    addEventListener('resize', () => scene.resize(), { signal: stop.signal });
    let raf = 0, last = 0, spare = 0, done = false;
    tip('');
    const loop = (ms: number) => {
      raf = requestAnimationFrame(loop);
      const now = ms / 1000, dt = last ? Math.min(.1, now - last) : 0;
      last = now;
      if (document.hidden) return;
      spare += dt;
      while (spare >= STEP && s.phase !== 'orbit') {
        spare -= STEP;
        const f = finger.current, kb = keys.current;
        const auto = replay ? inputFor(s, 'skilled', rng) : null;
        const steer = auto ? auto.steer : f ? scene.toSteer(f.x) : kb.has('arrowleft') ? -1 : kb.has('arrowright') ? 1 : kb.has(' ') ? 0 : null;
        stepSim(s, auto ?? { burn: !!f || kb.has(' ') || kb.has('arrowleft') || kb.has('arrowright'), steer, drop: dropTap.current });
        dropTap.current = false;
      }
      for (const e of takeEvents(s)) {
        if (e.t === 'tick') sayIt([COUNT[e.n]!], true);
        if (e.t === 'liftoff') { sayIt(['Lift off!', ...(replay ? [] : ['Hold your finger on the screen to fire the engines!', 'Move your finger left or right to steer!'] as const)], true); tip(replay ? '' : '👆 Hold to fly · ◀ ▶ steer'); }
        if (e.t === 'hold' && !replay) sayIt(['Hold your finger on the screen to fire the engines!'], true);
        if (e.t === 'clouds') sayIt(['Into the clouds!']);
        if (e.t === 'bump') sayIt(['Bump!']);
        if (e.t === 'path' && e.inside) sayIt(['Back on the path!']);
        if (e.t === 'empty') { setDrop(e.stage === 'boosters' ? 'boosters' : 'main'); sayIt([e.stage === 'boosters' ? 'Tap to drop the boosters!' : 'Tap to drop the main stage!'], true); }
        if (e.t === 'drop') { setDrop(null); dropSound(); sayIt([e.stage === 'boosters' ? 'Boosters away!' : 'Main stage away!'], true); }
        if (e.t === 'space') sayIt(['Look! The sky is turning black.']);
        if (e.t === 'orbit' && !done) {
          done = true;
          engine.current?.stop();
          launchResult.current = { smooth: smoothness(s) };
          sChime();
          void voice.say('You made it to orbit!').then(() => { if (!voice.active) return; if (replay) screen.value = 'base'; else setPhase('orbit'); });
        }
      }
      scene.frame(s, now);
      engine.current?.set(s.phase === 'climb' ? (finger.current || replay ? 1 : .4) : s.phase === 'count' ? .08 : 0);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); unkey(); stop.abort(); engine.current?.stop(); };
  }, [phase]);

  // the orbit
  useEffect(() => {
    if (phase !== 'orbit') return;
    const stop = new AbortController();
    const o: OrbitSim = createOrbit({ targets: plan.m.targets, free: plan.free, seed: plan.m.n });
    const scene = createOrbitScene(canvas.current!, { night: plan.night, gps: plan.gps, payloadIcon, reduced: reduced() });
    if (import.meta.env.DEV) Object.assign(window, { __orbit: o });
    const sayIt = commentator(voice), unkey = keyHandler();
    addEventListener('resize', () => scene.resize(), { signal: stop.signal });
    let raf = 0, last = 0, spare = 0, ended = false;
    setDeploy(true);
    sayIt(['Let the payload go! Tap!'], true);
    tip('');
    const loop = (ms: number) => {
      raf = requestAnimationFrame(loop);
      const now = ms / 1000, dt = last ? Math.min(.1, now - last) : 0;
      last = now;
      if (document.hidden) return;
      spare += dt;
      while (spare >= OSTEP && o.phase !== 'done') {
        spare -= OSTEP;
        stepOrbit(o, { tap: photoTap.current, deploy: deployTap.current });
        photoTap.current = false; deployTap.current = false;
      }
      for (const e of orbitEvents(o)) {
        if (e.t === 'deployed') { setDeploy(false); sWhoosh(.6); sayIt(['Payload away!'], true); }
        if (e.t === 'next') { sayIt([...missionLine([plan.m.targets[e.i]!]), 'Tap when it is right under the camera!'], true); tip(`📷 ${targetEmoji(plan.m.targets[e.i]!.id)} ${targetLabel(plan.m.targets[e.i]!.id)}`); }
        if (e.t === 'notyet') sayIt(['Not yet!']);
        if (e.t === 'missed') sayIt(['It went past. Here it comes again!'], true);
        if (e.t === 'photo') { cameraClick(); sChime(); const id = e.id as TargetId; sayIt([e.auto ? 'Got it!' : 'Snap!', 'This is', ...targetSaid(id), ...whereSaid(id)], true); }
        if (e.t === 'free') { sayIt(['Free time! Tap to take a picture of anything you fly over.'], true); tip('📷 ✨'); }
        if (e.t === 'snap') { cameraClick(); if (e.isNew) sayIt(['You took a picture of', ...targetSaid(e.id as TargetId)]); }
        if (e.t === 'done' && !ended) {
          ended = true;
          const caught = o.caught as TargetId[];
          const smooth = launchResult.current?.smooth ?? 1, stars = starsFor(smooth);
          const pay = settleLaunch(player, plan, { stars, smooth, caught: [...new Set(caught)] });
          void voice.say('Coming home!').then(() => { setResult({ pay, stars, smooth, caught: [...new Set(caught)] }); setPhase('end'); });
        }
      }
      if (gotEl.current) gotEl.current.textContent = `${o.caught.length}`;
      const f0 = performance.now();
      scene.frame(o, now);
      // the browser tour reports how long the turning globe takes to draw (tools/globe-hopper/tour.ts)
      if (import.meta.env.DEV) { const w = window as unknown as { __frames?: number[] }; (w.__frames ??= []).push(performance.now() - f0); }
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); unkey(); stop.abort(); };
  }, [phase]);

  // the results, said aloud
  useEffect(() => {
    if (phase !== 'end' || !result) return;
    const { pay } = result;
    void (async () => {
      sFanfare(); confetti(result.stars === 3 ? 50 : 24, voice.signal);
      await voice.say('Welcome home!');
      if (!pay) return;
      await voice.say(earnedLine(CUR, pay.bolts));
      if (pay.bestSmooth) { sChime(); await voice.say('New best!', 'Smoothest launch!'); }
      if (pay.bestCaught) { sChime(); await voice.say('New best!', 'Most places in one orbit!'); }
      if (pay.newPayload) { sChime(); await voice.say(pay.newPayload.startsWith('m:') || PAYLOADS.find(p => p.id === pay.newPayload)?.kind === 'module' ? 'It joined your Station!' : 'Your satellite is in orbit!'); }
      else await voice.say(plan.payload === TEST_PAYLOAD.id ? 'The test payload flew!' : 'Supplies for the Station!');
      if (plan.kind === 'flyback' && has(start.base, 'b:landing')) await voice.say('The booster landed on the pad!');
      if (plan.kind === 'spaceplane' && has(start.base, 'b:runway')) await voice.say('The spaceplane landed on the runway!');
      if (pay.patch) { sFanfare(); confetti(40, voice.signal); await voice.say('A new patch for your wall!'); }
      if (pay.rank) { sFanfare(); await voice.say('You are now a', say(pay.rank.name)); }
      if (!pay.patch && !pay.rank) await voice.say('Great flying!');
    })();
  }, [phase, result]);

  const leave = () => {
    if (!voice.active) return;
    if (phase === 'card' || phase === 'end' || armed) { screen.value = 'base'; return; }
    setArmed(true);
    void voice.say('Tap again to leave.');
    setTimeout(() => setArmed(false), 3000);
  };
  const down = (e: PointerEvent) => {
    if (phase === 'orbit') { photoTap.current = true; return; }
    if (finger.current) return;
    finger.current = { id: e.pointerId, x: e.clientX - canvas.current!.getBoundingClientRect().left }; canvas.current!.setPointerCapture(e.pointerId);
  };
  const move = (e: PointerEvent) => { if (finger.current?.id === e.pointerId) finger.current = { id: e.pointerId, x: e.clientX - canvas.current!.getBoundingClientRect().left }; };
  const up = (e: PointerEvent) => { if (finger.current?.id === e.pointerId) finger.current = null; };

  if (phase === 'card') {
    const best = start.base.bests;
    return (
      <div class="launch-screen ls-card" data-phase="card">
        <header class="ls-head"><IconButton label="Rocket Base" onClick={leave}>🏗️</IconButton><h1>Launch {plan.m.n}</h1>{plan.night && <span class="ms-chip" aria-label="Night">🌙</span>}</header>
        <div class="ls-route">
          <div class="ls-rocket"><BaseCanvas scene={sceneFor(start.base, plan.night)} opts={{ centerFlying: true, zoom: 1.4, ground: .9 }} label={`${ROCKET_KINDS[plan.kind].name} on the pad`} /><strong>{ROCKET_KINDS[plan.kind].name}</strong></div>
          <div class="ls-brief">
            <div class="ls-payload"><span class="e" aria-hidden="true">{payloadIcon}</span><span>{plan.payloadName}</span></div>
            <div class="ls-mission">{plan.m.targets.map((t, i) => <span key={t.id} class="ls-target"><b>{i + 1}</b><MiniGlobe at={targetOf(t.id)} class="ls-target-globe" />{targetLabel(t.id)}</span>)}</div>
            {plan.m.patch && <div class="ls-patch"><PatchBadge patch={plan.m.patch} size={56} /> 🎁</div>}
          </div>
        </div>
        <div class="ls-foot">
          {start.base.flown > 0 && <span class="ms-best" aria-label="Your bests">🏅 {best.smooth}% · 📷 {best.caught}</span>}
          <button class="big-btn go pulse" aria-label="Go" onClick={() => { if (voice.active) setPhase('launch'); }}><span class="e">🚀</span><span class="go-word">Go</span></button>
        </div>
      </div>
    );
  }

  const after = player.state.value.base, rank = rankOf(after.flown);
  return (
    <div class={`launch-screen ${phase === 'orbit' ? 'in-orbit' : ''}`} data-phase={phase}>
      <canvas ref={canvas} class="ls-canvas" aria-label={phase === 'orbit' ? 'Orbit: tap to take a picture' : 'Launch: hold to fly'}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onLostPointerCapture={up} />
      <div class="ls-hud">
        <IconButton label={armed ? 'Tap again to leave' : 'Leave'} class={armed ? 'armed' : ''} onClick={leave}>🏠</IconButton>
        {phase === 'orbit' && <span class="hud-chip">📷 <span ref={gotEl}>0</span></span>}
      </div>
      <div class="ls-tip" ref={tipEl} aria-live="polite" />
      {phase === 'launch' && drop && !replay && (
        <div class="ls-acts"><button class="ls-act drop pulse" aria-label={drop === 'boosters' ? 'Drop the boosters' : 'Drop the main stage'} onPointerDown={e => { e.preventDefault(); dropTap.current = true; }}>⬇️<b>Drop</b></button></div>
      )}
      {phase === 'orbit' && deploy && (
        <div class="ls-acts"><button class="ls-act deploy pulse" aria-label="Let the payload go" onPointerDown={e => { e.preventDefault(); deployTap.current = true; }}><span aria-hidden="true">{payloadIcon}</span><b>Go!</b></button></div>
      )}
      {phase === 'end' && result && (
        <div class="ms-result" role="dialog"><div class="result-card">
          <h2>Launch {plan.m.n}!</h2>
          <div class="ls-stars" aria-label={`${result.stars} stars`}>{'⭐'.repeat(result.stars)}<small>{Math.round(result.smooth * 100)}%</small></div>
          {result.pay && <div class="ms-row"><span class="result-bolts"><CurrencyIcon kind={CUR} size={36} />+{result.pay.bolts}</span></div>}
          <div class="ls-photos">{result.caught.slice(0, 8).map(id => <span key={id} class="ls-photo"><MiniGlobe at={targetOf(id)} class="ls-photo-globe" />{targetLabel(id)}</span>)}</div>
          {result.pay?.bestSmooth && <div class="won-line">🏅 Smoothest launch!</div>}
          {result.pay?.bestCaught && <div class="won-line">📷 Most places in one orbit!</div>}
          {result.pay?.newPayload && <div class="won-line">{payloadIcon} {plan.payloadName}</div>}
          {result.pay?.patch && <div class="won-line"><PatchBadge patch={result.pay.patch} size={40} /> Patch {result.pay.patch.n / 5}</div>}
          {result.pay?.rank && <div class="won-line">🎖️ {result.pay.rank.name}{result.pay.rank.number ? ` ${result.pay.rank.number}` : ''}</div>}
          <div class="ms-row log">🚀 {after.flown} <small>{rank.name}{rank.number ? ` ${rank.number}` : ''}</small></div>
          <div class="btns">
            <button class="big-btn garage" aria-label="Rocket Base" onClick={() => { if (voice.active) screen.value = 'base'; }}>🏗️</button>
            {after.launches > 0
              ? <button class="big-btn go" aria-label="Launch again" onClick={() => { if (voice.active) launchAgain(); }}><span class="e">🚀</span><span class="race-count">{after.launches}</span></button>
              : <button class="big-btn go" aria-label="Play" onClick={() => { if (voice.active) startRound(); }}><span class="e">▶</span></button>}
          </div>
        </div></div>
      )}
    </div>
  );
}
