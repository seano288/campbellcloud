// The Flight, the reward he flies. First the card: where he's flying, its weather, his plane, his bests there (or the Charter's number and
// its prize). Then he flies: from the gate along the taxiway with a held finger (from above), the take-off with the throttle held (from
// the side), the cruise picking up stars, and the line of lights down to the far runway. It cannot be failed (sim.ts). Then the results:
// the landing, the stars, the Bolts, his new bests, the new Route, a Charter prize, his passengers and rank, and any Trophy.
//
// Controls stay clear of the screen's bottom edge and sides, which belong to iPadOS. Keys work on a computer: up and down fly, space is
// the throttle, D drops water.
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { sChime, sFanfare } from '../../audio/sfx';
import { confetti } from '../../celebrate/effects';
import { earnedLine } from '../../currency/kind';
import { IconButton } from '../../ui/bits';
import { CurrencyIcon } from '../../ui/currency';
import { has, lightHex, liveryOf, planFlight, rankOf, runwayLevel, type AirportState, type FlightPay } from '../airport/airport';
import { PLANE_SPECS, PLANES } from '../airport/catalog';
import { standFor } from '../airport/plot';
import { lookOf, planePic } from '../art/plane';
import { JET_CURRENCY } from '../branding';
import { player, settleFlight } from '../game';
import { fly, screen } from '../nav';
import { sayNum, type Phrase } from '../phrases';
import { startRound } from '../round';
import { useVoiceScope, type VoiceScope } from '../voice';
import { createScene } from './render';
import { createFlight, firesOut, starsGot, STEP, stepFlight, takeEvents, type Flight } from './sim';
import { boom, cheer, engineSound, gustSound, lightPing, splash, starPing, touchdown, type Engine } from './sounds';
import { TROPHIES } from '../airport/airport';

type Phase = 'card' | 'live' | 'end';
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion:reduce)').matches;
const WEATHER_ICON = { clear: '☀️', cloud: '⛅', rain: '🌧️', snow: '❄️', wind: '💨', fog: '🌫️' } as const;
const GRADE: Record<1 | 2 | 3, Phrase> = { 1: 'Bumpy landing!', 2: 'Good landing!', 3: 'Smooth landing!' };

/** Lines that don't matter are dropped while the voice is mid-sentence, so it never queues up behind the action. */
function commentator(voice: VoiceScope) {
  let talking = false;
  return (line: readonly Phrase[], must = false) => {
    if (talking && !must) return;
    talking = true;
    void voice.say(...line).then(() => { talking = false; });
  };
}

/** His runway in Flight units: longer runways and each stretch make a longer roll before the trees. */
const runwayLength = (a: AirportState) => 700 + runwayLevel(a) * 200 + Math.min(4, a.more.stretch) * 40;

interface Result { pay: FlightPay | null; stars: number; grade: 1 | 2 | 3 }

export function FlightScreen() {
  const voice = useVoiceScope(), a = player.state.value.airport;
  const plan = useMemo(() => planFlight(a), []);
  const start = useRef({ airport: a, first: a.flown === 0 }).current;
  const dest = plan.dest, model = plan.plane, spec = PLANE_SPECS[model];
  const look = useMemo(() => lookOf(model, liveryOf(a, model), a.airline.mark), []);
  const rec = plan.mode === 'charter' ? null : a.routes[dest.id];
  const [phase, setPhase] = useState<Phase>('card'), [armed, setArmed] = useState(false), [result, setResult] = useState<Result | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null), starEl = useRef<HTMLSpanElement>(null), tipEl = useRef<HTMLDivElement>(null);
  const finger = useRef<{ id: number; x: number; y: number } | null>(null), throttle = useRef(false), drop = useRef(false), keys = useRef(new Set<string>());
  const [hud, setHud] = useState<'taxi' | 'roll' | 'air'>('taxi');
  const engine = useRef<Engine | null>(null);

  // the card
  useEffect(() => {
    if (phase !== 'card') return;
    if (plan.mode === 'charter') void voice.say('Charter Flight!', ...(plan.charter <= 100 ? ['Charter' as const, ...sayNum(plan.charter)] : []), 'Fly to', dest.name as Phrase);
    else void voice.say('Fly to', dest.name as Phrase);
  }, [phase]);

  // the Flight
  useEffect(() => {
    if (phase !== 'live') return;
    const stop = new AbortController();
    const owned = (id: string) => has(start.airport, id);
    // the Crossing Runway lets him land into the wind: gusts are half as strong
    const f: Flight = createFlight({
      dest: has(start.airport, 'piece:crossing') ? { ...dest, wind: dest.wind / 2 } : dest, ability: spec.ability, speed: spec.speed, runway: runwayLength(start.airport), approachLights: has(start.airport, 'sign:approach'), radar: has(start.airport, 'piece:radar'),
      taxi: spec.ability === 'heli' ? null : { from: standFor(owned), owned },
    });
    const scene = createScene(canvas.current!, dest, reduced());
    if (import.meta.env.DEV) Object.assign(window, { __flight: f, __scene: scene });
    const say = commentator(voice), light = lightHex(start.airport.lights);
    engine.current = engineSound(spec.jet);
    const key = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (e.type === 'keydown') keys.current.add(k); else keys.current.delete(k);
      if (k === 'd' && e.type === 'keydown') drop.current = true;
      if (k.startsWith('arrow') || k === ' ') e.preventDefault();
    };
    addEventListener('keydown', key); addEventListener('keyup', key);
    const hold = (e: TouchEvent) => { if ((e.target as Element).closest('canvas,.fl-act')) e.preventDefault(); };
    const root = canvas.current!.closest('.flight-screen')!;
    for (const type of ['touchstart', 'touchmove'] as const) root.addEventListener(type, hold as EventListener, { passive: false, signal: stop.signal });
    const onResize = () => scene.resize();
    addEventListener('resize', onResize, { signal: stop.signal });

    let raf = 0, last = 0, spare = 0, done = false, lastHud = '', lastStars = -1, keyAlt: number | null = null;
    const tip = (text: string) => { if (tipEl.current) tipEl.current.textContent = text; };
    if (f.phase === 'taxi') { say(['Hold your finger on the taxiway to lead the plane!'], true); tip('👆 Lead the plane to the green circle'); }
    else { say(['Hold the throttle!'], true); tip('👆 Hold the throttle'); }
    const ended = () => {
      if (done) return;
      done = true;
      engine.current?.stop();
      const res = { stars: starsGot(f), grade: (f.grade || 2) as 1 | 2 | 3, fires: firesOut(f) };
      const pay = settleFlight(player, plan, res);
      setResult({ pay, stars: res.stars + res.fires, grade: res.grade });
      setPhase('end');
    };
    const loop = (ms: number) => {
      raf = requestAnimationFrame(loop);
      const now = ms / 1000, dt = last ? Math.min(.1, now - last) : 0;
      last = now;
      if (document.hidden) return;
      spare += dt;
      const fg = finger.current;
      // the keys stand in for a finger on a computer
      if (keys.current.has('arrowup')) keyAlt = (keyAlt ?? f.alt) + 6; else if (keys.current.has('arrowdown')) keyAlt = (keyAlt ?? f.alt) - 6;
      while (spare >= STEP && f.phase !== 'done') {
        spare -= STEP;
        const air = f.phase !== 'taxi';
        stepFlight(f, {
          taxiTo: !air && fg ? scene.toPlot(fg.x, fg.y) : null,
          alt: air && fg && f.phase !== 'roll' ? scene.toAlt(fg.y) : air ? keyAlt : null,
          throttle: throttle.current || keys.current.has(' ') || (f.phase === 'roll' && !!fg),
          drop: drop.current,
        });
        drop.current = false;
      }
      for (const e of takeEvents(f)) {
        if (e.t === 'lineup') { say(['Line up!', 'Hold the throttle!'], true); tip('👆 Hold the throttle'); }
        if (e.t === 'lift') { say(['Lift off!'], true); tip(''); }
        if (e.t === 'cruise') { say(['Hold your finger where you want to fly!', spec.ability === 'cargo' ? 'Pick up the crates!' : 'Pick up the stars!'], true); if (spec.ability === 'water') say(['Tap Drop on the fires!']); tip(spec.ability === 'cargo' ? '👆 Fly to the crates' : '👆 Fly to the stars'); }
        if (e.t === 'boom') { boom(); say(['Boom!']); }
        if (e.t === 'star') starPing(e.i);
        if (e.t === 'fire') { splash(); say(['Fire out!']); }
        if (e.t === 'gust') gustSound();
        if (e.t === 'approach') { say(['Follow the lights down!'], true); tip('👆 Follow the lights down'); }
        if (e.t === 'light') lightPing();
        if (e.t === 'goaround') { say(['Too high! Go around!', 'The plane will land itself.'], true); tip(''); }
        if (e.t === 'followme') { say(['Follow the car!'], true); }
        if (e.t === 'grass' && start.first) say(['On the grass you go slow.']);
        if (e.t === 'touchdown') { touchdown(e.grade); say(['Touchdown!', GRADE[e.grade]], true); tip(''); }
        if (e.t === 'done') ended();
      }
      const kind = f.phase === 'taxi' ? 'taxi' : f.phase === 'roll' ? 'roll' : 'air';
      if (kind !== lastHud) { lastHud = kind; setHud(kind); }
      const got = starsGot(f) + firesOut(f);
      if (got !== lastStars && starEl.current) { lastStars = got; starEl.current.textContent = `${got}/${dest.stars.length + (spec.ability === 'water' ? dest.fires.length : 0)}`; }
      scene.frame(f, now, look, start.airport, fg, light);
      engine.current?.set(f.phase === 'taxi' ? .15 : f.phase === 'roll' ? (throttle.current || fg ? 1 : .4) : f.phase === 'rollout' || f.phase === 'done' ? .1 : .6);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); removeEventListener('keydown', key); removeEventListener('keyup', key); stop.abort(); engine.current?.stop(); };
  }, [phase]);

  // the results, said aloud
  useEffect(() => {
    if (phase !== 'end' || !result) return;
    const { pay } = result;
    void (async () => {
      cheer(); confetti(result.grade === 3 ? 50 : 24, voice.signal);
      await voice.say('Welcome to', dest.name as Phrase);
      if (!pay) return;
      await voice.say(earnedLine(JET_CURRENCY, pay.bolts));
      if (pay.bestStars || pay.bestLanding) { sChime(); await voice.say('New best!'); }
      await voice.say(...sayNum(pay.passengers), 'passengers flew with you!');
      if (pay.rank) { sFanfare(); confetti(40, voice.signal); await voice.say('Your airport is now a', pay.rank.name); }
      if (pay.prize) { sFanfare(); confetti(40, voice.signal); await voice.say('You won a Charter prize!', pay.prize.name); }
      for (const id of pay.trophies) { const tr = TROPHIES.find(x => x.id === id); if (tr) { sFanfare(); await voice.say('You won a Trophy!', tr.name); } }
      if (pay.opened) { sChime(); await voice.say('A new Route is open!'); }
      else if (!pay.prize && !pay.rank) await voice.say('Great flight!');
    })();
  }, [phase, result]);

  const leave = () => {
    if (!voice.active) return;
    if (phase !== 'live' || armed) { screen.value = 'airport'; return; }
    setArmed(true);
    void voice.say('Tap again to leave.');
    setTimeout(() => setArmed(false), 3000);
  };
  const at = (e: PointerEvent) => { const b = canvas.current!.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; };
  const down = (e: PointerEvent) => { if (finger.current) return; finger.current = { id: e.pointerId, ...at(e) }; canvas.current!.setPointerCapture(e.pointerId); };
  const move = (e: PointerEvent) => { if (finger.current?.id === e.pointerId) finger.current = { id: e.pointerId, ...at(e) }; };
  const up = (e: PointerEvent) => { if (finger.current?.id === e.pointerId) finger.current = null; };

  if (phase === 'card') {
    const name = PLANES.find(p => p.model === model)!.name;
    return (
      <div class="flight-screen fl-card" data-phase="card">
        <header class="fl-head"><IconButton label="Airport" onClick={leave}>🏠</IconButton>
          <h1>{plan.mode === 'charter' ? `Charter ${plan.charter}` : dest.name}</h1>
          <span class="fl-chip">{WEATHER_ICON[dest.weather]}{dest.night ? '🌙' : ''}</span></header>
        <div class="fl-route">
          <div class="fl-from"><img src={planePic(look)} alt="" /><strong>{name}</strong></div>
          <div class="fl-arrow" aria-hidden="true">✈ ✈ ✈</div>
          <div class="fl-to"><span class="fl-icon" aria-hidden="true">{dest.icon}</span><strong>{dest.name}</strong></div>
        </div>
        <div class="fl-foot">
          {rec && rec.flown > 0 && <span class="fl-best" aria-label="Your best">🏅 ⭐{rec.bestStars} · {'🛬'.repeat(rec.bestLanding)}</span>}
          {plan.mode === 'charter' && plan.dest && 'prize' in plan.dest && (plan.dest as { prize: unknown }).prize ? <span class="fl-best">🎁 Prize!</span> : null}
          {plan.mode === 'route' && <span class="fl-best">🆕 New Route!</span>}
          <button class="big-btn go pulse" aria-label="Go" onClick={() => { if (voice.active) setPhase('live'); }}><span class="e">▶</span><span class="go-word">Go</span></button>
        </div>
      </div>
    );
  }

  const after = player.state.value.airport;
  return (
    <div class="flight-screen" data-phase={phase} data-hud={hud}>
      <canvas ref={canvas} class="fl-canvas" aria-label={`Flying to ${dest.name}`}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onLostPointerCapture={up} />
      <div class="fl-hud">
        <IconButton label={armed ? 'Tap again to leave' : 'Leave'} class={armed ? 'armed' : ''} onClick={leave}>🏠</IconButton>
        <span class="hud-chip">{spec.ability === 'cargo' ? '📦' : '⭐'} <span ref={starEl}>0</span></span>
        <span class="hud-chip">{dest.icon} {dest.name}</span>
      </div>
      <div class="fl-tip" ref={tipEl} aria-live="polite" />
      {phase === 'live' && hud === 'roll' && (
        <div class="fl-acts"><button class="fl-act throttle pulse" aria-label="Throttle" onPointerDown={e => { e.preventDefault(); throttle.current = true; }} onPointerUp={() => { throttle.current = false; }} onPointerCancel={() => { throttle.current = false; }} onPointerLeave={() => { throttle.current = false; }}>🔥<b>Hold</b></button></div>
      )}
      {phase === 'live' && hud === 'air' && spec.ability === 'water' && (
        <div class="fl-acts"><button class="fl-act drop" aria-label="Drop" onPointerDown={e => { e.preventDefault(); drop.current = true; }}>💧<b>Drop</b></button></div>
      )}
      {phase === 'end' && result && (
        <div class="fl-result" role="dialog"><div class="result-card">
          <h2>{dest.name}!</h2>
          <div class="fl-grade" aria-label={`Landing ${result.grade} of 3`}>{'🛬'.repeat(result.grade)}<span>{result.grade === 3 ? 'Smooth!' : result.grade === 2 ? 'Good!' : 'Bumpy!'}</span></div>
          <div class="fl-row"><span>{spec.ability === 'cargo' ? '📦' : '⭐'} {result.stars}</span>{result.pay && <span class="result-bolts"><CurrencyIcon kind={JET_CURRENCY} size={36} />+{result.pay.bolts}</span>}</div>
          {result.pay && <div class="fl-row pax">🧍 +{result.pay.passengers} <small>{rankOf(after.passengers).name}{rankOf(after.passengers).number ? ` ${rankOf(after.passengers).number}` : ''}</small></div>}
          {(result.pay?.bestStars || result.pay?.bestLanding) && <div class="won-line">🏅 New best!</div>}
          {result.pay?.prize && <div class="won-line prize">🎁 {result.pay.prize.name}{'number' in result.pay.prize ? ` ${result.pay.prize.number}` : ''} {'glyph' in result.pay.prize ? result.pay.prize.glyph : ''}</div>}
          {result.pay?.trophies.map(id => { const tr = TROPHIES.find(x => x.id === id)!; return <div key={id} class="won-line">🏆 {tr.icon} {tr.name}</div>; })}
          {result.pay?.opened && <div class="won-line">🗺️ {result.pay.opened.icon} {result.pay.opened.name}</div>}
          <div class="btns">
            <button class="big-btn garage" aria-label="Airport" onClick={() => { if (voice.active) screen.value = 'airport'; }}>🏗️</button>
            {after.flights > 0
              ? <button class="big-btn go" aria-label="Fly again" onClick={() => { if (voice.active) fly(); }}><span class="e">✈️</span><span class="race-count">{after.flights}</span></button>
              : <button class="big-btn go" aria-label="Play" onClick={() => { if (voice.active) startRound(); }}><span class="e">▶</span></button>}
          </div>
        </div></div>
      )}
    </div>
  );
}
