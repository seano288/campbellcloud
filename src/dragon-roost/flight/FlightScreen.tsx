// The Flight on screen. First its card (the place's name, his best there), and the first few times, how to fly: hold a finger anywhere
// to set the dragon's height, hold Breathe to light the beacons, tap a trick. Then about a minute over the land; then what he did: the
// beacons lit, the Flames caught, a new best, the dragon growing, a new mark, a new rank or trophy. A Flight is only used at its end, so
// leaving halfway (🏠 twice) costs nothing.
//
// Controls keep off the screen's edges: the steering is the whole sky, and Breathe and the tricks sit above a 56px floor and in from the
// sides. Keys too (↑ ↓, space, 1 to 5) for a keyboard and the tour.
import { useEffect, useRef, useState } from 'preact/hooks';
import { sBoing, sChime, sClink, sFanfare, sPop, sWhoosh, tone } from '../../audio/sfx';
import { confetti } from '../../celebrate/effects';
import { IconButton } from '../../ui/bits';
import { CurrencyIcon } from '../../ui/currency';
import { MyDragon } from '../art/MyDragon';
import { CUR } from '../branding';
import { player, settleFlight } from '../game';
import { flightNumber, fly, screen } from '../nav';
import { earnedLine } from '../../currency/kind';
import type { Phrase } from '../phrases';
import { markName, STAGE_NAMES } from '../roost/dragons';
import { lookOf, planFlight, unnamed, type FlightPay, type FlightPlan } from '../roost/roost';
import { NameDragon } from '../roost/NameDragon';
import { useVoice } from '../voice';
import { CEILING } from './course';
import { renderFlight, unitFor, viewFor, type Burst } from './render';
import { NO_INPUT, resultOf, startSim, step, type Input, type Sim } from './sim';

/** A beacon, as the HUD and the results count it: a stone bowl with its fire lit (Flames, the currency, are a flame on its own). */
const Beacon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
    <path d="M20 4 C24 11 29 13 29 20 C29 25 25 27 20 27 C15 27 11 25 11 20 C11 16 14 14 16 11 C17 14 18 15 19 16 C19 12 19 8 20 4 Z" fill="#ffb02e" stroke="#7a1406" stroke-width="2.5" stroke-linejoin="round" />
    <path d="M5 23 H35 L30 34 H10 Z" fill="#8e94a0" stroke="#2a1a12" stroke-width="3" stroke-linejoin="round" />
  </svg>
);

const still = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion:reduce)').matches;
const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');

export function FlightScreen() {
  const voice = useVoice();
  const state = player.state.value, need = unnamed(state.roost);
  const [naming, setNaming] = useState(!!need);
  if (naming && need) return <div class="screen dr-flight-screen"><NameDragon dragon={need} onDone={() => setNaming(false)} /></div>;
  void voice;
  return <Flying key="fly" />;
}

function Flying() {
  const voice = useVoice();
  const [plan] = useState<FlightPlan>(() => planFlight(player.state.peek().roost, flightNumber.peek() ?? undefined));
  const [phase, setPhase] = useState<'card' | 'fly' | 'done'>('card');
  const [pay, setPay] = useState<FlightPay | null>(null);
  const [armed, setArmed] = useState(false);
  const [hud, setHud] = useState({ lit: 0, flames: 0, lights: 0, tricks: '' });
  // Only a speed trick beats the bird, so without one on a button it just flies by: he isn't told to race what he can't catch
  const canRace = plan.tricks.some(t => t.effect === 'zoom');
  const canvas = useRef<HTMLCanvasElement>(null), sim = useRef<Sim>(startSim(plan.c, plan.fly));
  const input = useRef<{ target: number | null; breath: boolean; trick: number | null }>({ ...NO_INPUT });
  const steer = useRef<number | null>(null);
  const look = lookOf(plan.dragon);
  const [, force] = useState(0);
  const firstFlights = player.state.peek().roost.flown < 3;

  // the card: where he is going, then (the first few times) how to fly
  useEffect(() => {
    void (async () => {
      const name = plan.c.name;
      if (name) await voice.say(plan.fresh ? 'A new place!' : 'Welcome to', name);
      else if (plan.fresh) await voice.say('A new place!');
      if (plan.c.night && voice.active) await voice.say('Night flight!');
      if (voice.active && plan.best !== null) await voice.say('Your best:', `${Math.min(100, plan.best)}`);
      if (voice.active && firstFlights) await voice.say('Hold your finger to fly up and down!', 'Hold Breathe to light the beacons!', ...(plan.tricks.length ? ['Tap a trick!'] : []));
      else if (voice.active) await voice.say('Light the beacons!');
      if (voice.active) setPhase('fly');
    })();
  }, []);

  // the flight itself
  useEffect(() => {
    if (phase !== 'fly') return;
    const c = canvas.current!, ctx = c.getContext('2d');
    if (!ctx) return;
    const s = sim.current, bursts: Burst[] = [];
    let raf = 0, last = performance.now(), acc = 0, t = 0;
    const loop = (ms: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(.1, (ms - last) / 1000); last = ms; acc += dt; t += dt;
      while (acc >= 1 / 60) {
        acc -= 1 / 60;
        const inp: Input = { target: input.current.target, breath: input.current.breath, trick: input.current.trick };
        input.current.trick = null;
        step(s, 1 / 60, inp);
        for (const e of s.events) {
          if (e.kind === 'lit') { sChime(); const b = s.c.beacons[e.i]!; bursts.push({ x: b.x, y: b.y + 3, t: 0, colour: '#ffb02e', kind: 'lit' }); }
          if (e.kind === 'pop') { sPop(); const cl = s.c.clouds[e.i]!; bursts.push({ x: cl.x, y: cl.y, t: 0, colour: '#ffffff', kind: 'pop' }); }
          if (e.kind === 'flame') { sClink(); const f = s.c.flames[e.i]!; bursts.push({ x: f.x, y: f.y, t: 0, colour: '#ff7a1a', kind: 'flame' }); }
          if (e.kind === 'bounce') sBoing();
          if (e.kind === 'trick') sWhoosh(.4);
          if (e.kind === 'bird' && canRace) void voice.sayMore('A bird! Race it!');
          if (e.kind === 'beat') { sFanfare(); void voice.sayMore('You beat the bird!'); }
        }
        if (s.done) break;
      }
      for (const b of bursts) b.t += dt * 1.6;
      while (bursts.length && bursts[0]!.t > 1) bursts.shift();
      if (bursts.length > 24) bursts.splice(0, bursts.length - 24);
      const r = c.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
      if (c.width !== Math.round(r.width * dpr) || c.height !== Math.round(r.height * dpr)) { c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      renderFlight(ctx, s, plan, look, viewFor(r.width, r.height, s), t, bursts, still());
      const { lit, flames, lights } = resultOf(s), tricks = s.tricks.map(x => (x.wait > 0 ? 1 : 0)).join('');
      setHud(h => (h.lit === lit && h.flames === flames && h.lights === lights && h.tricks === tricks ? h : { lit, flames, lights, tricks }));
      if (s.done) { cancelAnimationFrame(raf); finish(); }
    };
    raf = requestAnimationFrame(loop);
    const keys = (e: KeyboardEvent, down: boolean) => {
      const cur = sim.current;
      if (e.key === 'ArrowUp') input.current.target = down ? Math.min(CEILING, cur.y + 30) : null;
      if (e.key === 'ArrowDown') input.current.target = down ? Math.max(0, cur.y - 30) : null;
      if (e.key === ' ') { input.current.breath = down; e.preventDefault(); }
      if (down && /^[1-5]$/.test(e.key)) input.current.trick = Number(e.key) - 1;
    };
    const kd = (e: KeyboardEvent) => keys(e, true), ku = (e: KeyboardEvent) => keys(e, false);
    addEventListener('keydown', kd); addEventListener('keyup', ku);
    return () => { cancelAnimationFrame(raf); removeEventListener('keydown', kd); removeEventListener('keyup', ku); };
  }, [phase]);

  // the tour reads the Flight from here (dev only)
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    (window as unknown as { __flight(): unknown }).__flight = () => ({ phase, sim: sim.current, view: canvas.current?.getBoundingClientRect() });
  });

  async function finish() {
    const res = resultOf(sim.current), p = settleFlight(player, plan, res);
    setPay(p); setPhase('done');
    if (!p) return;
    sFanfare(); confetti(30, voice.signal);
    const lines: Phrase[][] = [['You made it!'], ['You lit', `${res.lit}`, 'out of', `${res.beacons}`, 'beacons.']];
    if (p.allLit) lines.push(['Every beacon is lit!']);
    if (p.newBest) lines.push(['New best!']);
    if (p.flames) lines.push([earnedLine(CUR, p.flames)]);
    if (p.stage === 1) lines.push(['Your dragon grew!', 'It is young now!']);
    if (p.stage === 2) lines.push(['Your dragon grew!', 'It is a great dragon now!']);
    if (p.mark) lines.push([markName(p.mark)]);
    if (p.rank) lines.push(['You are now a', p.rank.name]);
    for (const tr of p.trophies) lines.push(['You won a trophy!', tr.name]);
    for (const l of lines) { if (!voice.active) return; await voice.say(...l); }
  }

  // steering: a finger anywhere on the sky sets the height
  const toWorld = (clientY: number) => { const r = canvas.current!.getBoundingClientRect(); return Math.max(0, Math.min(CEILING, (r.bottom - clientY) / unitFor(r.width, r.height))); };
  const down = (e: PointerEvent) => { if (phase !== 'fly') return; steer.current = e.pointerId; (e.target as Element).setPointerCapture?.(e.pointerId); input.current.target = toWorld(e.clientY); };
  const move = (e: PointerEvent) => { if (steer.current === e.pointerId) input.current.target = toWorld(e.clientY); };
  const up = (e: PointerEvent) => { if (steer.current === e.pointerId) { steer.current = null; input.current.target = null; } };
  const breath = (on: boolean) => (e: PointerEvent) => { e.preventDefault(); input.current.breath = on; force(x => x + 1); if (on) tone(140, .2, 'sawtooth', 0, .05, 90); };
  function home() {
    if (!voice.active) return;
    if (armed || phase === 'done') { screen.value = 'roost'; return; }
    setArmed(true); void voice.say('Tap again to leave.'); setTimeout(() => setArmed(false), 4000);
  }
  const roost = player.state.value.roost;
  return (
    <div class={cls('screen', 'dr-flight-screen', `ph-${phase}`)}>
      <canvas ref={canvas} class="dr-flight" role="img" aria-label="Your dragon flying" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} />
      <div class="dr-hud">
        <IconButton label={armed ? 'Tap again to leave' : 'Home'} class={armed ? 'armed' : ''} onClick={home}>🏠</IconButton>
        <span class="dr-hud-chip" aria-label={`${hud.lit} of ${plan.c.beacons.length} beacons`}><Beacon size={24} /> {hud.lit}/{plan.c.beacons.length}</span>
        <span class="dr-hud-chip" aria-label={`${hud.flames} Flames caught`}><CurrencyIcon kind={CUR} size={22} /> {hud.flames}</span>
        {plan.best !== null && <span class={cls('dr-hud-chip', 'best', hud.lights > plan.best && 'beat')} aria-label={`${hud.lights}, your best ${plan.best}`}>🏅 {hud.lights}/{plan.best}</span>}
      </div>
      {phase === 'card' && (
        <div class="dr-flight-card">
          <h2>{plan.c.name ?? `Flight ${plan.c.n}`}</h2>
          <p>{plan.c.night ? '🌙' : '☀️'} {plan.c.weather === 'snow' ? '❄️' : plan.c.weather === 'rain' ? '🌧️' : plan.c.weather === 'wind' ? '💨' : ''}</p>
          <button class="big-btn go pulse" aria-label="Fly" onClick={() => { if (voice.active) { voice.cancel(); setPhase('fly'); } }}><span class="e">▶</span></button>
        </div>
      )}
      {phase === 'fly' && (
        <div class="dr-pad">
          <div class="dr-tricks">
            {plan.tricks.map((tr, i) => {
              const st = sim.current.tricks[i];
              return <button key={tr.id} class={cls('dr-trick', st && st.wait > 0 && 'wait')} aria-label={tr.name} onPointerDown={e => { e.preventDefault(); input.current.trick = i; void voice.sayMore(tr.name); }}><span aria-hidden="true">{tr.icon}</span><small>{tr.name}</small></button>;
            })}
          </div>
          <button class={cls('dr-breathe', input.current.breath && 'on')} aria-label="Breathe" onPointerDown={breath(true)} onPointerUp={breath(false)} onPointerCancel={breath(false)} onPointerLeave={breath(false)}>
            <span aria-hidden="true">🔥</span><small>Breathe</small>
          </button>
        </div>
      )}
      {phase === 'done' && pay && (
        <div class="dr-flight-card done">
          <h2>{plan.c.name ?? `Flight ${plan.c.n}`}</h2>
          <div class="dr-results">
            <span><Beacon size={30} /> {pay.result.lit}/{pay.result.beacons}</span><span>☁️ {pay.result.popped}</span>{pay.result.birds > 0 && <span>🐦 {pay.result.birds}</span>}
            <span><CurrencyIcon kind={CUR} size={22} /> +{pay.flames}</span>
          </div>
          {pay.newBest && <p class="dr-best">🏅 New best!</p>}
          {pay.stage !== null && <p class="dr-best">🐉 {STAGE_NAMES[pay.stage]}</p>}
          {pay.mark && <p class="dr-best">⭐ {markName(pay.mark)}</p>}
          {pay.rank && <p class="dr-best">🎖️ {pay.rank.name}{pay.rank.number ? ` ${pay.rank.number}` : ''}</p>}
          {pay.trophies.map(t => <p key={t.id} class="dr-best">{t.icon} {t.name}</p>)}
          <div class="btns">
            <button class="big-btn garage" aria-label="Roost" onClick={() => { screen.value = 'roost'; }}><span class="e">🏔️</span><span class="btn-word">Roost</span></button>
            {roost.flights > 0 && <button class="big-btn go pulse" aria-label="Fly again" onClick={() => fly()}><span class="e"><MyDragon /></span><span class="btn-word">{roost.flights}</span></button>}
            <button class="big-btn go again second" aria-label="Play" onClick={() => { screen.value = 'home'; }}><span class="e">▶</span></button>
          </div>
        </div>
      )}
      {phase === 'done' && !pay && <div class="dr-flight-card done"><h2>Play a Round to earn a Flight!</h2><button class="big-btn go" aria-label="Play" onClick={() => { screen.value = 'home'; }}><span class="e">▶</span></button></div>}
    </div>
  );
}
