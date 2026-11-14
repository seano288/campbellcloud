// A trip, the reward: the launch, the flight and the planet drive, then what he found. He presses the big red button to start the
// countdown, steers the rocket with his finger to catch Bolts, and lands; then the rover rolls out and he drives it to the flag spot,
// jumping for crystals on the way, and plants his flag. The first time on a planet his rover gets a gadget. The launch is used, and
// what he caught and found is paid, only when the flag is planted: leaving halfway (🏠 twice) costs nothing and pays nothing.
//
// Controls stay clear of the screen's bottom edge and sides, which belong to iPadOS (a swipe that starts there opens the Dock or the app
// switcher, and a page can't stop it), as in Math Bots' fight. Keys work on a computer: arrows, space.
import { useEffect, useRef, useState } from 'preact/hooks';
import { sBoing, sChime, sClink, sFanfare, sSiren, sWhoosh } from '../../audio/sfx';
import { confetti } from '../../celebrate/effects';
import { earnedLine } from '../../currency/kind';
import { seeded } from '../../game/rng';
import { IconButton } from '../../ui/bits';
import { CurrencyIcon } from '../../ui/currency';
import { GlobeView, RocketView, RoverView } from '../art/Art';
import { rungOf } from '../base/parts';
import { CRYSTALS, SPACE_BOLTS, type TripPay } from '../base/base';
import { GADGETS, planet as planetBy, type GadgetId } from '../base/planets';
import { ROVER_CURRENCY } from '../branding';
import { player, settleTrip } from '../game';
import { launch, screen, tripTo } from '../nav';
import { backLine, exploredLine, gadgetLine, type Phrase } from '../phrases';
import { startRound } from '../round';
import { useVoiceScope, type VoiceScope } from '../voice';
import { createDrive, drawDrive, progress, stepDrive, TOP_SPEED, type Drive } from './drive';
import { climb, CLIMB_S, createFlight, drawFlight, LAND_S, resize, stepFlight, type Flight } from './flight';
import { boost, clunk, countBeep, ignition, landing, rocketRoar, roverMotor, sizzle, touchdown, type Running } from './sounds';

type Phase = 'flight' | 'drive' | 'end';
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion:reduce)').matches;

/** Runs a loop on a canvas sized to its box: `step` advances the world by dt, `draw` paints it. */
function useCanvasLoop(ref: { current: HTMLCanvasElement | null }, run: boolean, step: (dt: number) => void, draw: (c: CanvasRenderingContext2D, w: number, h: number) => void) {
  const latest = useRef({ step, draw });
  latest.current = { step, draw };
  useEffect(() => {
    if (!run) return;
    const canvas = ref.current!, c = canvas.getContext('2d')!;
    let raf = 0, last = 0;
    const loop = (ms: number) => {
      raf = requestAnimationFrame(loop);
      const dt = last ? Math.min(.05, (ms - last) / 1000) : 0;
      last = ms;
      if (document.hidden) return;
      const box = canvas.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1), w = Math.round(box.width * dpr), h = Math.round(box.height * dpr);
      if (!w || !h) return;
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      latest.current.step(dt);
      c.setTransform(1, 0, 0, 1, 0, 0);
      latest.current.draw(c, w, h);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [run]);
}

/** Lines that don't matter are dropped while he's mid-sentence, so the voice never queues up behind the action. */
function chatter(voice: VoiceScope) {
  let talking = false;
  return (...line: Phrase[]) => { if (talking) return; talking = true; void voice.say(...line).then(() => { talking = false; }); };
}

export function TripScreen() {
  const voice = useVoiceScope(), state = player.state.value, base = state.base, planet = planetBy(tripTo.value);
  const first = base.trips === 0, newPlanet = !(base.visits[planet.id] ?? 0);
  const [phase, setPhase] = useState<Phase>('flight'), [armed, setArmed] = useState(false), [pay, setPay] = useState<TripPay | null>(null);
  const [started, setStarted] = useState(false), [caught, setCaught] = useState(0), [got, setGot] = useState(0), [atFlag, setAtFlag] = useState(false), [planted, setPlanted] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null), bar = useRef<HTMLElement>(null);
  const flight = useRef<Flight>(createFlight(1, seeded(Date.now() >>> 0))), drive = useRef<Drive | null>(null);
  const pointer = useRef<number | null>(null), keys = useRef(new Set<string>()), dir = useRef(0), jump = useRef(false), plantAt = useRef(0);
  const say = useRef(chatter(voice)).current;
  const roar = useRef<Running | null>(null), motor = useRef<Running | null>(null);

  useEffect(() => {
    void voice.say('Press the big button to launch!');
    return () => { roar.current?.stop(); motor.current?.stop(); };
  }, []);
  // keys on a computer
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (e.type === 'keydown') { keys.current.add(k); if (k === ' ' && !e.repeat) jump.current = true; } else keys.current.delete(k);
      dir.current = +(keys.current.has('arrowright') || keys.current.has('d')) - +(keys.current.has('arrowleft') || keys.current.has('a'));
      if (k.startsWith('arrow') || k === ' ') e.preventDefault();
    };
    addEventListener('keydown', key); addEventListener('keyup', key);
    // Safari's own touch handling stays out of the way: no scroll, zoom or callout while he steers
    const hold = (e: TouchEvent) => { if ((e.target as Element).closest('canvas,.drive-ctl')) e.preventDefault(); };
    const root = document.querySelector('.trip-screen');
    root?.addEventListener('touchstart', hold as EventListener, { passive: false });
    root?.addEventListener('touchmove', hold as EventListener, { passive: false });
    return () => { removeEventListener('keydown', key); removeEventListener('keyup', key); root?.removeEventListener('touchstart', hold as EventListener); root?.removeEventListener('touchmove', hold as EventListener); };
  }, []);

  function blastOff() {
    if (started || !voice.active) return;
    setStarted(true);
    flight.current.started = true;
    sClink();
    roar.current = rocketRoar(rungOf(base.rocket, 'engine')); // started inside the tap, as iPad Safari likes
    void (async () => {
      for (const n of ['3', '2', '1'] as const) { countBeep(Number(n)); await Promise.all([voice.say(n), voice.wait(1000)]); if (!voice.active) return; }
      ignition(); sWhoosh(2); void voice.say('Blast off!');
    })();
  }

  // the flight
  useCanvasLoop(canvas, phase === 'flight', dt => {
    const f = flight.current, c = canvas.current!;
    if (c.clientHeight) { const aspect = c.clientWidth / c.clientHeight; if (Math.abs(Math.max(560, 1000 * aspect) - f.width) > 1) resize(f, aspect); }
    const kx = dir.current;
    stepFlight(f, dt, pointer.current, kx);
    // the roar: a pilot flame on the pad, building through the countdown, full at lift-off, easing off to land
    const ct = climb(f);
    if (f.started) roar.current?.set(
      ct < -1.2 ? .12 : ct < 0 ? .35 + .5 * (1 + ct / 1.2) : ct < 2 ? 1 : ct < CLIMB_S ? .75 : .75 - .5 * Math.min(1, (ct - CLIMB_S) / LAND_S),
      ct < 0 ? .1 : ct < CLIMB_S ? .5 + .5 * (ct / CLIMB_S) : .4);
    for (const e of f.events) {
      if (e === 'catch') { sChime(); setCaught(f.caught); }
      if (e === 'bonk') clunk();
      if (e === 'blast') say('Move your finger to steer!');
      if (e === 'first-bolt') say('Catch the Bolts!');
      if (e === 'first-rock') say('Look out!');
      if (e === 'arrive') { sWhoosh(1.5); say('Landing!'); }
      if (e === 'done') {
        roar.current?.stop(); roar.current = null; touchdown();
        drive.current = createDrive(planet, base.gadgets, base.trips * 31 + 7); setPhase('drive');
      }
    }
  }, (c, w, h) => drawFlight(c, flight.current, w, h, base.rocket, planet, reduced(), pointer.current));

  // the planet
  useEffect(() => {
    if (phase !== 'drive') return;
    motor.current = roverMotor();
    if (base.gadgets.includes('siren')) sSiren(); // his Siren Lights, as the rover rolls out
    void voice.say(newPlanet ? 'Drive to the flag!' : backLine(planet.said as Parameters<typeof backLine>[0]), ...(newPlanet ? [] : ['Drive to the flag!' as const]), ...(first ? ['Hold the arrows to drive!', 'Tap the button to jump!'] as const : []));
    return () => { motor.current?.stop(); motor.current = null; };
  }, [phase]);
  useCanvasLoop(canvas, phase === 'drive', dt => {
    const d = drive.current!, falling = -d.vy;
    stepDrive(d, dt, planted ? 0 : dir.current, jump.current);
    jump.current = false;
    // the motor: a quiet hum standing still, revving with his speed and higher with the wheels off the ground; off at the flag
    const speed = Math.abs(d.vx) / TOP_SPEED;
    motor.current?.set(d.atFlag ? 0 : .15 + .85 * speed, Math.min(1, speed * .8 + (d.grounded ? 0 : .3)));
    for (const e of d.events) {
      if (e === 'jump' || e === 'bounce') sBoing();
      if (e === 'boost') boost();
      if (e === 'land' && falling > 150) landing(falling);
      if (e === 'hot') sizzle();
      if (e === 'crystal') { sChime(); setGot(d.got); if (d.got <= 2) say('A crystal!'); }
      if (e === 'flag') { setAtFlag(true); sFanfare(); void voice.say('Plant your flag!'); }
    }
    if (bar.current) bar.current.style.transform = `scaleX(${progress(d)})`;
  }, (c, w, h) => drawDrive(c, drive.current!, w, h, base.rocket, plantAt.current ? Math.min(1, (performance.now() - plantAt.current) / 900) : 0, reduced()));

  function plant() {
    if (planted || !voice.active || !drive.current) return;
    setPlanted(true);
    plantAt.current = performance.now();
    sFanfare(); confetti(50, voice.signal);
    const d = drive.current, paid = settleTrip(player, planet.id, flight.current.caught, d.got);
    setPay(paid);
    void (async () => {
      await voice.wait(1100);
      if (!voice.active) return;
      setPhase('end');
      if (!paid) return;
      const lines: Phrase[] = [newPlanet ? exploredLine(planet.said as Parameters<typeof exploredLine>[0]) : backLine(planet.said as Parameters<typeof backLine>[0])];
      if (d.got === 1) lines.push('You found 1 crystal!'); else if (d.got > 1) lines.push('You found', `${d.got}` as Phrase, 'crystals!');
      if (paid.bolts > 0) lines.push(earnedLine(ROVER_CURRENCY, paid.bolts));
      if (paid.gadget) lines.push(gadgetLine(GADGETS[paid.gadget]));
      await voice.say(...lines);
    })();
  }

  const leave = () => {
    if (!voice.active) return;
    if (phase === 'end' || armed) { screen.value = 'base'; return; }
    setArmed(true);
    void voice.say('Tap again to leave.');
    setTimeout(() => setArmed(false), 3000);
  };
  const aim = (e: PointerEvent) => {
    const c = canvas.current;
    if (!c?.clientWidth || phase !== 'flight') return;
    const box = c.getBoundingClientRect();
    pointer.current = ((e.clientX - box.left) / box.width) * flight.current.width;
  };
  const hold = (d: number) => (e: PointerEvent) => { e.preventDefault(); (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); dir.current = d; };
  const release = (e: PointerEvent) => { e.preventDefault(); dir.current = 0; };
  const after = player.state.value.base;

  return (
    <div class={`trip-screen ${phase}`} data-phase={phase}>
      <canvas ref={canvas} class="trip-canvas" aria-label={phase === 'flight' ? 'Your rocket in the sky' : `Your rover on ${planet.name}`}
        onPointerDown={e => { aim(e); canvas.current?.setPointerCapture(e.pointerId); }} onPointerMove={e => { if (e.buttons || e.pointerType === 'touch') aim(e); }}
        onPointerUp={() => { pointer.current = null; }} onPointerCancel={() => { pointer.current = null; }} />
      <header class="trip-hud">
        <IconButton label={armed ? 'Tap again to leave' : 'Leave'} class={armed ? 'armed' : ''} onClick={leave}>🏠</IconButton>
        <span class="trip-to"><GlobeView planet={planet} />{planet.name}</span>
        {phase === 'flight'
          ? <span class="trip-count" aria-label={`${caught} Bolts caught`}><CurrencyIcon kind={ROVER_CURRENCY} size={28} />{caught}/{SPACE_BOLTS}</span>
          : <span class="trip-count" aria-label={`${got} crystals`}>💎{got}/{CRYSTALS}</span>}
      </header>
      {phase === 'drive' && <div class="trip-progress" aria-hidden="true"><i ref={bar} /><span>🚩</span></div>}
      {phase === 'flight' && !started && (
        <div class="launch-ready">
          <button class="big-red pulse" aria-label="Launch" onClick={blastOff}><span>🚀</span></button>
        </div>
      )}
      {phase === 'drive' && !atFlag && (
        <div class="drive-ctl">
          <div class="drive-lr">
            <button class="ctl" aria-label="Back" onPointerDown={hold(-1)} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}>◀</button>
            <button class="ctl" aria-label="Forward" onPointerDown={hold(1)} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}>▶</button>
          </div>
          <button class={`ctl jump ${first ? 'teach' : ''}`} aria-label="Jump" onPointerDown={e => { e.preventDefault(); jump.current = true; }}>⤴</button>
        </div>
      )}
      {phase === 'drive' && atFlag && !planted && (
        <div class="launch-ready"><button class="big-btn go plant-btn pulse" aria-label="Plant your flag" onClick={plant}><span class="e">🚩</span></button></div>
      )}
      {phase === 'end' && (
        <div class="trip-result" role="dialog"><div class="result-card">
          <h2>{planet.name}</h2>
          <GlobeView planet={planet} class="result-globe" label={null} />
          {pay && pay.bolts > 0 && <div class="result-bolts"><CurrencyIcon kind={ROVER_CURRENCY} size={40} />+{pay.bolts}</div>}
          {pay?.gadget && <Prize gadget={pay.gadget} gadgets={after.gadgets} />}
          <div class="btns">
            <button class="big-btn garage my-rocket" aria-label="Space Base" onClick={() => { if (voice.active) screen.value = 'base'; }}><RocketView rocket={after.rocket} label={null} /></button>
            {after.launches > 0
              ? <button class="big-btn go" aria-label="Launch again" onClick={() => { if (voice.active) launch(); }}><span class="e">🚀</span></button>
              : <button class="big-btn go" aria-label="Play" onClick={() => { if (voice.active) startRound(); }}><span class="e">▶</span></button>}
          </div>
        </div></div>
      )}
    </div>
  );
}

function Prize({ gadget, gadgets }: { gadget: GadgetId; gadgets: readonly GadgetId[] }) {
  return (
    <div class="prize">
      <RoverView gadgets={gadgets} live label={`Your rover with ${GADGETS[gadget]}`} />
      <span class="prize-name">{GADGETS[gadget]}</span>
    </div>
  );
}
