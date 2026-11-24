// The Dive: about a minute in the dark sea. He holds a finger where he wants to go and the submarine follows, its headlights pointing
// there; he sees only what his light touches (and the animals that make their own light). Holding his light on an animal takes its
// picture for the Logbook; passing close to treasure, the Claw picks it up. Sonar pings by itself and outlines what it finds, lit or
// not; the Sonar button pings now, the Horn makes the animals near him wiggle, the Flash (once bought) lights the whole sea for a
// moment. Then the submarine rises by itself. Nothing chases him and nothing can hurt him.
//
// One canvas, drawn every frame from dive/sim.ts (the numbers) by dive/draw.ts (the picture). The controls are DOM buttons kept off
// the screen's edges and above the bottom band, which belong to iPadOS.
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { sChime, sFanfare } from '../../audio/sfx';
import { confetti } from '../../celebrate/effects';
import { earnedLine } from '../../currency/kind';
import { IconButton } from '../../ui/bits';
import { CurrencyIcon } from '../../ui/currency';
import { AnimalPic, subImage } from '../art/Pics';
import { DEEP_CURRENCY } from '../branding';
import { DIVE_S, diveZone, gearOf, hornOf, lookOf, type DivePay } from '../dock/dock';
import { player, settleDive } from '../game';
import { goDive, screen } from '../nav';
import type { Phrase } from '../phrases';
import { startRound } from '../round';
import { animal } from '../sea/animals';
import { zone as zoneOf } from '../sea/zones';
import { bubble, click, clunk, flashPop, horn as hornSound, ping as pingSound } from '../sounds';
import { useVoice } from '../voice';
import { drawDive, makeScenery, makeSprites, toScreen, toWorld, viewOf, type Bubble, type Sprites } from './draw';
import { flash, hold, horn, inBeam, ping, release, startDive, step, takeEvents, type DiveState } from './sim';

/** Seconds with no finger on the sea before he's reminded what to do. */
const IDLE_S = 7;

export function DiveScreen() {
  const voice = useVoice(), start = player.state.peek().dock;
  const zoneId = useMemo(() => diveZone(start), []), look = useMemo(() => lookOf(start), []), gear = useMemo(() => gearOf(start), []);
  const known = useMemo(() => new Set<string>(start.photos), []);
  const sim = useMemo<DiveState>(() => startDive(zoneId, gear, start.photos, Date.now() & 0xffff), []);
  const canvas = useRef<HTMLCanvasElement>(null), air = useRef<HTMLSpanElement>(null);
  const [phase, setPhase] = useState<'dive' | 'done'>('dive'), [flashes, setFlashes] = useState(gear.flashes);
  const [pay, setPay] = useState<DivePay | null>(null), [awake, setAwake] = useState(false), [armed, setArmed] = useState(false);
  const live = useRef({ fps: [] as number[], work: [] as number[], told: new Set<string>(), pointer: null as number | null, idle: 0, nudges: 0, view: null as ReturnType<typeof viewOf> | null, dpr: 1, cap: 2, slow: 0 });

  useEffect(() => {
    const c = canvas.current!, ctx = c.getContext('2d')!, z = zoneOf(zoneId), scenery = makeScenery(sim), bubbles: Bubble[] = [];
    let raf = 0, last = performance.now(), w = 0, h = 0, sprites: Sprites | null = null, puff = 0;
    const L = live.current;
    function size() {
      L.dpr = Math.min(L.cap, window.devicePixelRatio || 1);
      const r = c.getBoundingClientRect();
      w = Math.max(1, Math.round(r.width * L.dpr)); h = Math.max(1, Math.round(r.height * L.dpr));
      c.width = w; c.height = h;
      const k = viewOf(sim, w, h, L.dpr).k;
      if (!sprites || Math.abs(sprites.k - k) > 0.01) sprites = makeSprites(sim, k);
    }
    size();
    const ro = new ResizeObserver(size);
    ro.observe(c);
    void voice.say(z.name, 'Down we go!', 'Hold your finger where you want to go!');
    function frame(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      L.fps.push(dt); if (L.fps.length > 120) L.fps.shift();
      // a device that can't keep up draws the Dive at fewer pixels: two seconds under 50 fps steps the canvas down from 2× to 1.5×
      // to 1× (the sea is dark and soft, so it hardly shows)
      L.slow = dt > 1 / 50 ? L.slow + dt : Math.max(0, L.slow - dt * 0.5);
      if (L.slow > 2 && L.cap > 1 && (window.devicePixelRatio || 1) > 1) { L.cap = Math.max(1, Math.min(L.cap, window.devicePixelRatio) - 0.5); L.slow = 0; size(); }
      const w0 = performance.now();
      step(sim, dt);
      // a child who does nothing is told again what to do, a few times (nothing happens to him for waiting)
      L.idle = L.pointer === null && sim.phase === 'dive' && L.nudges < 3 ? L.idle + dt : 0;
      if (L.idle > IDLE_S) { L.idle = 0; L.nudges++; void voice.say('Hold your finger where you want to go!'); }
      // bubbles stream out behind him as he moves
      puff -= dt;
      if (puff <= 0 && Math.hypot(sim.sub.vx, sim.sub.vy) > 40) {
        puff = 0.09;
        bubbles.push({ x: sim.sub.x - 90 * sim.sub.face * 0.62, y: sim.sub.y + (Math.random() - 0.5) * 20, r: 4 + Math.random() * (look.trailPattern ? 9 : 6), life: 1 });
      }
      for (const b of bubbles) { b.y -= 40 * dt; b.x += Math.sin(now / 300 + b.r) * 0.4; b.life -= dt * 0.8; }
      while (bubbles.length && bubbles[0]!.life <= 0) bubbles.shift();
      if (bubbles.length > 40) bubbles.splice(0, bubbles.length - 40);
      for (const e of takeEvents(sim)) react(e);
      const view = viewOf(sim, w, h, L.dpr);
      L.view = view;
      drawDive(ctx, sim, view, look, sprites!, scenery, bubbles, now / 1000);
      L.work.push(performance.now() - w0); if (L.work.length > 120) L.work.shift();
      if (air.current) air.current.style.width = `${Math.max(0, 100 - (sim.t / DIVE_S) * 100)}%`;
      raf = requestAnimationFrame(frame);
    }
    function once(key: string, ...lines: Phrase[]) { if (L.told.has(key)) return; L.told.add(key); void voice.say(...lines); }
    function react(e: string) {
      if (e.startsWith('photo:')) {
        const id = e.slice(6);
        click();
        if (!known.has(id)) { known.add(id); sChime(); void voice.say('A new animal!', animal(id).name as Phrase); }
        else void voice.say('Click!');
      } else if (e.startsWith('lit:')) {
        const id = e.slice(4);
        if (!sim.animals.find(m => m.a.id === id)?.done) once('lit', 'Hold your light on it!');
      } else if (e === 'treasure') { clunk(); void voice.say('Treasure!'); }
      else if (e === 'ping') {
        pingSound();
        // the first time sonar outlines something his light isn't on, say so
        setTimeout(() => { if (sim.animals.some(m => m.outline > 0 && !inBeam(sim, m.x, m.y))) once('sonar', 'Your sonar found something!'); }, 700);
      } else if (e === 'flash') { flashPop(); setFlashes(sim.flashes); void voice.say('Flash!'); }
      else if (e === 'bump') bubble();
      else if (e === 'rise') { L.pointer = null; void voice.say('Time to go up!'); }
      else if (e === 'done') finish();
    }
    // in a dark place, the first animal that makes its own light, seen in the dark: that's how he can see it
    const glowCheck = setInterval(() => {
      if (z.dark < 0.5 || sim.phase !== 'dive' || !L.view) return;
      const v = L.view, seen = sim.animals.find(m => m.a.glow && !m.lit && !m.done && (() => { const p = toScreen(v, m.x, m.y); return p.x > 0 && p.y > 0 && p.x < w && p.y < h; })());
      if (seen) once('glow', 'You can see it because it makes its own light!');
    }, 1000);
    function finish() {
      const paid = settleDive(player, sim.photos, sim.treasure);
      setPay(paid); setPhase('done');
      sFanfare(); confetti(40, voice.signal);
      const fresh = paid?.fresh.length ?? 0;
      const lines: Phrase[] = ['Dive done!', ...(fresh === 1 ? ['You found a new animal!' as const] : fresh > 1 ? ['You found' as const, `${fresh}` as Phrase, 'new animals!' as const] : []),
        ...(fresh ? ['It is in your Logbook!' as const] : []), ...(paid && paid.pearls ? [earnedLine(DEEP_CURRENCY, paid.pearls)] : [])];
      void voice.say(...lines).then(() => { if (voice.active) setAwake(true); });
      setTimeout(() => { if (voice.active) setAwake(true); }, 8000); // a stalled voice never keeps the buttons asleep
    }
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); clearInterval(glowCheck); };
  }, []);

  // the tour reads the Dive from here, as a child sees it (tools/deep-light/tour.ts)
  if (import.meta.env.DEV) (window as unknown as { __dive(): unknown }).__dive = () => {
    const c = canvas.current, L = live.current;
    if (!c || !L.view) return null;
    const r = c.getBoundingClientRect(), xy = (x: number, y: number) => { const p = toScreen(L.view!, x, y); return { x: r.left + p.x / L.dpr, y: r.top + p.y / L.dpr }; };
    const avg = (a: number[]) => (a.length ? a.reduce((p, q) => p + q, 0) / a.length : 0);
    return {
      phase: sim.phase, t: sim.t, zone: sim.zone, photos: [...sim.photos], treasure: sim.treasure, fps: L.fps.length ? 1 / avg(L.fps) : 0, worst: Math.max(0, ...L.fps),
      work: avg(L.work), workMax: Math.max(0, ...L.work), scale: L.dpr, sub: xy(sim.sub.x, sim.sub.y),
      animals: sim.animals.map(m => ({ id: m.a.id, ...xy(m.x, m.y), done: m.done })), treasures: sim.treasures.map(t => ({ ...xy(t.x, t.y), got: t.got })),
    };
  };

  function pointer(e: PointerEvent, kind: 'down' | 'move' | 'up') {
    const L = live.current;
    if (sim.phase !== 'dive' || !L.view) return;
    const c = canvas.current!, r = c.getBoundingClientRect();
    const p = toWorld(L.view, (e.clientX - r.left) * L.dpr, (e.clientY - r.top) * L.dpr);
    if (kind === 'down') {
      if (L.pointer !== null) return;
      L.idle = 0;
      L.pointer = e.pointerId;
      c.setPointerCapture?.(e.pointerId);
      hold(sim, p.x, p.y);
    } else if (e.pointerId === L.pointer) {
      if (kind === 'move') hold(sim, p.x, p.y);
      else { L.pointer = null; release(sim); }
    }
  }

  function leave() {
    if (!voice.active) return;
    if (phase === 'done' || armed) { screen.value = 'dock'; return; }
    setArmed(true);
    void voice.say('Tap again to leave.');
    setTimeout(() => setArmed(false), 4000);
  }
  const go = (fn: () => void) => () => { if (awake && voice.active) fn(); };
  const dives = player.state.value.dock.dives;
  return (
    <div class={`screen dive-screen ${phase}`}>
      <canvas ref={canvas} class="dive-canvas" onPointerDown={e => pointer(e, 'down')} onPointerMove={e => pointer(e, 'move')} onPointerUp={e => pointer(e, 'up')} onPointerCancel={e => pointer(e, 'up')} />
      <div class="dive-hud">
        <IconButton label={armed ? 'Tap again to leave' : 'Leave'} class={armed ? 'armed' : ''} onClick={leave}>🏠</IconButton>
        {phase === 'dive' && <div class="air" aria-label="Time left"><span class="air-icon" aria-hidden="true">🫧</span><span class="air-track"><span ref={air} class="air-fill" /></span></div>}
        <span class="hud-gap" />
      </div>
      {phase === 'dive' && (
        <div class="dive-tools">
          <button class="hud-btn" aria-label="Sonar" onClick={() => { ping(sim); }}>📡</button>
          <button class="hud-btn" aria-label="Horn" onClick={() => { hornSound(hornOf(player.state.peek().dock)); horn(sim); }}>📯</button>
          {gear.flashes > 0 && <button class="hud-btn cam-btn" aria-label="Camera flash" disabled={flashes <= 0} onClick={() => { flash(sim); }}>📸<b>{flashes}</b></button>}
        </div>
      )}
      {phase === 'done' && (
        <div class="dive-done">
          <div class="done-card">
            <h2>Dive done!</h2>
            {pay && pay.fresh.length > 0 && <div class="done-new" aria-label="New animals">{pay.fresh.map(id => <span key={id} class="done-animal"><AnimalPic id={id} label={animal(id).name} /><b>{animal(id).name}</b></span>)}</div>}
            {pay && pay.pearls > 0 && <div class="done-pay">+{pay.pearls}<CurrencyIcon kind={DEEP_CURRENCY} size={32} /></div>}
            <div class={`btns ${awake ? '' : 'asleep'}`}>
              <button class="big-btn garage to-dock" aria-label="Dock" onClick={go(() => { screen.value = 'dock'; })}><img src={subImage(look)} alt="" /></button>
              {dives > 0 && <button class="big-btn go dive-again pulse" aria-label="Dive again" onClick={go(goDive)}><span aria-hidden="true">🌊</span>{dives}</button>}
              <button class={`big-btn go again ${dives > 0 ? 'second' : 'pulse'}`} aria-label="Play" onClick={go(() => startRound())}><span class="e">▶</span></button>
            </div>
            <IconButton label="Logbook" class={awake ? '' : 'asleep'} onClick={go(() => { screen.value = 'logbook'; })}>📖</IconButton>
          </div>
        </div>
      )}
    </div>
  );
}
