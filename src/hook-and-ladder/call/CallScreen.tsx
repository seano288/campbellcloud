// The Call: a short drive with a big Siren button, then the scene. He holds a finger on the scene and the hose sprays at it, the
// water flying in an arc; he taps someone at a window and the ladder goes up for them. About 45 seconds, no clock, nothing to lose.
// When everything is out and everyone is down, the Town says thank you: Bolts, and for a new Call a badge and a building.
//
// One canvas, drawn every frame from call/sim.ts (the numbers) by call/draw.ts (the picture). The controls are DOM buttons kept off
// the screen's edges and above the bottom band, which belong to iPadOS.
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { sChime, sFanfare } from '../../audio/sfx';
import { confetti } from '../../celebrate/effects';
import { earnedLine } from '../../currency/kind';
import { IconButton } from '../../ui/bits';
import { CurrencyIcon } from '../../ui/currency';
import { truckPic } from '../art/truck';
import { LADDER_CURRENCY } from '../branding';
import { player, settleCall } from '../game';
import { goCall, screen } from '../nav';
import { type Phrase } from '../phrases';
import { startRound } from '../round';
import { TANKS } from '../station/parts';
import { callOf, gearOf, lookOf, sirenOf, type CallPay } from '../station/station';
import { useVoice } from '../voice';
import { drawBackdrop, drawCall, drawDrive, toWorld, viewOf } from './draw';
import { chop, createHose, ding, gurgle, siren, sizzle, whirr } from './sounds';
import { aim, dropWater, release, startCall, step, tapRescue, takeEvents, type CallState } from './sim';

const DRIVE_S = 4.2;

export function CallScreen() {
  const voice = useVoice(), start = player.state.peek().station;
  const scene = useMemo(() => callOf(start), []), look = useMemo(() => lookOf(start), []), gear = useMemo(() => gearOf(start), []);
  const sim = useMemo<CallState>(() => startCall(scene, gear, Date.now() & 0xffff), []);
  const canvas = useRef<HTMLCanvasElement>(null), tankBar = useRef<HTMLSpanElement>(null);
  const [phase, setPhase] = useState<'drive' | 'work' | 'done'>('drive');
  const [pay, setPay] = useState<CallPay | null>(null), [awake, setAwake] = useState(false), [armed, setArmed] = useState(false);
  const live = useRef({ phase: 'drive' as 'drive' | 'work' | 'done', driveT: 0, siren: 0, fps: [] as number[], told: new Set<string>(), pointer: null as number | null });

  useEffect(() => {
    const c = canvas.current!, ctx = c.getContext('2d')!, hose = createHose(gear.hose);
    let raf = 0, last = performance.now(), w = 0, h = 0, dpr = 1, backdrop: HTMLCanvasElement | null = null, view = viewOf(scene, 1, 1), wasSpraying = false;
    function size() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      const r = c.getBoundingClientRect();
      w = Math.max(1, Math.round(r.width * dpr)); h = Math.max(1, Math.round(r.height * dpr));
      c.width = w; c.height = h;
      view = viewOf(scene, w, h);
      backdrop = document.createElement('canvas');
      backdrop.width = w; backdrop.height = h;
      drawBackdrop(backdrop.getContext('2d')!, scene, view, w, h);
    }
    size();
    const ro = new ResizeObserver(size);
    ro.observe(c);
    const L = live.current;
    void voice.say('Wee-oo!', 'Off to', scene.name as Phrase, 'Tap the siren!');
    function frame(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      L.fps.push(dt); if (L.fps.length > 120) L.fps.shift();
      L.siren = Math.max(0, L.siren - dt);
      if (L.phase === 'drive') {
        L.driveT += dt;
        drawDrive(ctx, look, w, h, L.driveT, L.siren, !!scene.night);
        if (L.driveT >= DRIVE_S) {
          L.phase = 'work'; setPhase('work');
          void voice.say('Drag your finger to spray!', ...(scene.rescues.length ? ['Tap them to send the ladder!' as const] : []));
        }
      } else {
        step(sim, dt);
        const spraying = !!sim.aim && sim.refill <= 0 && sim.phase === 'work';
        if (spraying !== wasSpraying) { hose.set(spraying); wasSpraying = spraying; }
        for (const e of takeEvents(sim)) react(e);
        drawCall(ctx, backdrop, sim, view, look, w, h, true);
        if (tankBar.current) tankBar.current.style.width = `${sim.stats.tank === Infinity ? 100 : sim.refill > 0 ? (1 - sim.refill / 1.6) * 100 : (sim.tank / sim.stats.tank) * 100}%`;
      }
      raf = requestAnimationFrame(frame);
    }
    function once(key: string, ...lines: Phrase[]) { if (L.told.has(key)) return; L.told.add(key); void voice.say(...lines); }
    function react(e: string) {
      if (e === 'out') { sizzle(); if (sim.phase === 'work') { sChime(); if (Math.random() < 0.4) void voice.say('Out!'); } }
      else if (e === 'saved') { ding(); void voice.say('Thank you!'); }
      else if (e === 'tooHighFire') once('pump', 'A stronger Pump will reach that one!');
      else if (e === 'tooHighLadder') { whirr(); once('ladder', 'A longer Ladder will reach them!'); }
      else if (e === 'empty') { gurgle(); void voice.say('Refilling!'); if (gear.tank < TANKS.length - 1) once('tank', 'A bigger Tank sprays longer!'); }
      else if (e === 'help') { chop(); void voice.say('Here comes help!'); }
      else if (e === 'drop') { chop(); void voice.say('Drop it!'); }
      else if (e === 'done') finish();
    }
    function finish() {
      if (L.phase === 'done') return;
      L.phase = 'done';
      hose.set(false);
      const paid = settleCall(player, scene.id);
      setPay(paid); setPhase('done');
      sFanfare(); confetti(40, voice.signal);
      const lines: Phrase[] = ['All the fires are out!', ...(paid ? [earnedLine(LADDER_CURRENCY, paid.bolts)] : []), ...(paid?.firstTime ? ['You got a new badge!', 'It is in your Town now!'] as const : [])];
      void voice.say(...lines).then(() => { if (voice.active) setAwake(true); });
      setTimeout(() => { if (voice.active) setAwake(true); }, 7000); // a stalled voice never keeps the buttons asleep
    }
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); hose.stop(); };
  }, []);

  // the tour reads the Call from here, as a child sees it (tools/hook-and-ladder/tour.ts)
  if (import.meta.env.DEV) (window as unknown as { __call(): unknown }).__call = () => {
    const c = canvas.current, L = live.current;
    if (!c) return null;
    const r = c.getBoundingClientRect(), dpr = c.width / Math.max(1, r.width), v = viewOf(scene, c.width, c.height);
    const xy = (x: number, y: number) => ({ x: r.left + (v.ox + x * v.k) / dpr, y: r.top + (v.oy - y * v.k) / dpr });
    const fps = L.fps.length ? L.fps.length / L.fps.reduce((a, b) => a + b, 0) : 0;
    return {
      phase: L.phase, sim: sim.phase, scene: scene.id, live: sim.live, fps, worst: Math.max(0, ...L.fps),
      fires: sim.fires.map(f => ({ ...xy(f.x, f.y), out: f.out, reach: f.reach })),
      rescues: sim.rescues.map(p => ({ ...xy(p.x, p.y), state: p.state, reach: p.reach })), ladder: sim.ladder.phase,
    };
  };

  function pointer(e: PointerEvent, kind: 'down' | 'move' | 'up') {
    const L = live.current;
    if (L.phase !== 'work') return;
    const c = canvas.current!, r = c.getBoundingClientRect(), dpr = c.width / Math.max(1, r.width);
    const p = toWorld(viewOf(scene, c.width, c.height), (e.clientX - r.left) * dpr, (e.clientY - r.top) * dpr);
    if (kind === 'down') {
      if (L.pointer !== null) return;
      if (tapRescue(sim, p.x, p.y)) { whirr(); return; }
      L.pointer = e.pointerId;
      c.setPointerCapture?.(e.pointerId);
      aim(sim, p.x, p.y);
    } else if (e.pointerId === L.pointer) {
      if (kind === 'move') aim(sim, p.x, p.y);
      else { L.pointer = null; release(sim); }
    }
  }

  function leave() {
    if (!voice.active) return;
    if (phase === 'done' || armed) { screen.value = 'station'; return; }
    setArmed(true);
    void voice.say('Tap again to leave.');
    setTimeout(() => setArmed(false), 4000);
  }
  const sirenTap = () => { live.current.siren = 2; siren(sirenOf(player.state.peek().station)); };
  const go = (fn: () => void) => () => { if (awake && voice.active) fn(); };
  const calls = player.state.value.station.calls, balance = player.state.value.currency.balance;
  return (
    <div class={`screen call-screen ${phase}`}>
      <canvas ref={canvas} class="call-canvas" onPointerDown={e => pointer(e, 'down')} onPointerMove={e => pointer(e, 'move')} onPointerUp={e => pointer(e, 'up')} onPointerCancel={e => pointer(e, 'up')} />
      <div class="call-hud">
        <IconButton label={armed ? 'Tap again to leave' : 'Leave'} class={armed ? 'armed' : ''} onClick={leave}>🏠</IconButton>
        {phase === 'work' && <div class="tank" aria-label="Water"><span class="tank-drop" aria-hidden="true">💧</span><span class="tank-track"><span ref={tankBar} class="tank-fill" /></span></div>}
        <span class="hud-gap" />
        {phase === 'work' && gear.truck === 'heli' && <button class="hud-btn drop-btn" aria-label="Drop water" onClick={() => { if (dropWater(sim)) chop(); }}>🪣</button>}
        {phase === 'work' && <button class="hud-btn siren-btn small" aria-label="Siren" onClick={sirenTap}>🚨</button>}
      </div>
      {phase === 'drive' && <button class="big-btn siren-btn big pulse" aria-label="Siren" onClick={sirenTap}><span aria-hidden="true">🚨</span></button>}
      {phase === 'done' && (
        <div class="call-done">
          <div class="done-card">
            <h2>All the fires are out!</h2>
            <div class="done-badge" aria-hidden="true">{scene.badge}</div>
            <div class="thanks">Thank you!</div>
            {pay && <div class="done-pay">+{pay.bolts}<CurrencyIcon kind={LADDER_CURRENCY} size={32} /></div>}
            {pay?.firstTime && <div class="done-new">New badge!</div>}
            <div class={`btns ${awake ? '' : 'asleep'}`}>
              <button class="big-btn garage to-station" aria-label="Station" onClick={go(() => { screen.value = 'station'; })}><img src={truckPic(look)} alt="" /></button>
              {calls > 0 && <button class="big-btn go call-again pulse" aria-label="Call again" onClick={go(goCall)}><span aria-hidden="true">🚒</span>{calls}</button>}
              <button class={`big-btn go again ${calls > 0 ? 'second' : 'pulse'}`} aria-label="Play" onClick={go(() => startRound())}><span class="e">▶</span></button>
            </div>
            <span class="sr-only">{balance}</span>
          </div>
        </div>
      )}
    </div>
  );
}
