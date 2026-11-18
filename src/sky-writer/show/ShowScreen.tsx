// A Show (show.ts is the simulation; this draws it and takes his finger). First he picks a place he has opened; then his plane takes
// off and he leads it with a held finger through ten rings, with Loop and Roll (and the trick he picked) on buttons. Clouds and
// balloons only wobble it. After about 40 seconds the rings are done, whatever happened: the Show is used and paid, a new place's patch
// goes on his Wall and the next place opens. Then the sky is his (Free Sky): smoke only while his finger is down, and it stays, so he
// can draw; 📮 keeps it as a postcard on the Wall.
//
// The canvas runs at most 1.5 device pixels a CSS pixel and the trail keeps at most TRAIL_MAX pieces, for the iPad 9's 60 fps.
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { sChime, sFanfare, sNope, sPop } from '../../audio/sfx';
import { confetti } from '../../celebrate/effects';
import { seeded } from '../../game/rng';
import { IconButton } from '../../ui/bits';
import { lookOf } from '../art/PlanePic';
import { drawPlane, EMOJI_FONT } from '../art/plane';
import { chatter, useCanvasLoop } from '../art/loop';
import { SHAPES, TRICKS, type TrickId } from '../airfield/parts';
import { flight, hasGear, MAX_POSTCARDS, openShows, specialTrick } from '../airfield/state';
import { keepCard, player, settleShow } from '../game';
import { flying, screen } from '../nav';
import type { Phrase } from '../phrases';
import { useVoiceScope } from '../voice';
import { paintBackdrop } from './backdrop';
import { show, SHOWS, type ShowId } from './places';
import { smokeColorOf } from './postcard';
import { createShow, currentRing, H, postcardPoints, resize, RING_R, RINGS, startTrick, stepShow, turbo, type ShowWorld } from './show';
import { propDrone, sBoingShield, sBonk, sRing, sTakeoff, sTrick, type Drone } from './sounds';

type Phase = 'pick' | 'fly' | 'free';
const HAZARD_PIC = { cloud: '☁️', balloon: '🎈', bird: '🐦' } as const;

export function ShowScreen() {
  const voice = useVoiceScope(), a = player.state.value.airfield;
  // what's said as things happen (a bump, a trick) is dropped while the voice is still talking, so it never queues up behind the action
  const quip = useMemo(() => chatter((line: Phrase) => voice.sayMore(line)), [voice]);
  const [at, setAt] = useState<ShowId>(flying.value!.at), [phase, setPhase] = useState<Phase>('pick');
  const [passed, setPassed] = useState(0), [armed, setArmed] = useState(false), [kept, setKept] = useState<'no' | 'yes' | 'full'>('no'), [drawn, setDrawn] = useState(0);
  const look = lookOf(a), fl = flight(a), special = specialTrick(a), here = show(at);
  const smokeId = a.fitted.smoke, shape = SHAPES.find(s => s.id === a.fitted.shape) ?? SHAPES[0];
  const gear = { magnet: hasGear(a, 'magnet'), shield: hasGear(a, 'shield'), turbo: hasGear(a, 'turbo'), autopilot: hasGear(a, 'autopilot') };
  const extras = { sparkle: hasGear(a, 'sparkle'), banner: hasGear(a, 'banner'), confetti: hasGear(a, 'confetti'), fireworks: hasGear(a, 'fireworks') };
  const canvas = useRef<HTMLCanvasElement>(null), world = useRef<ShowWorld | null>(null), finger = useRef<{ x: number; y: number; id: number } | null>(null);
  const view = useRef({ sc: 1, dpr: 1, w: 0, h: 0 }), bg = useRef<{ key: string; cv: HTMLCanvasElement } | null>(null);
  const layer = useRef<{ cv: HTMLCanvasElement; key: string; strokes: number; points: number } | null>(null);
  const parts = useRef<{ x: number; y: number; vx: number; vy: number; t: number; s: string; c?: string }[]>([]);
  const drone = useRef<Drone | null>(null), settled = useRef(false), frames = useRef(0);
  const phaseRef = useRef(phase), drawnRef = useRef(0);
  phaseRef.current = phase;

  useEffect(() => {
    void voice.say('Pick a place to fly!');
    return () => { drone.current?.stop(); };
  }, []);

  if (import.meta.env.DEV) (window as unknown as { __show(): unknown }).__show = () => {
    const w = world.current, r = canvas.current?.getBoundingClientRect(), { sc, dpr } = view.current;
    return { phase, frames: frames.current, at, passed: w?.passed ?? 0, t: w?.t ?? 0, drawn: w?.drawn ?? 0, x: w?.x, y: w?.y, ring: w ? currentRing(w) : null, rect: r ? { left: r.left, top: r.top } : null, scale: sc / dpr, kept };
  };

  function takeOff() {
    if (!voice.active) return;
    setPhase('fly');
    sTakeoff();
    drone.current = propDrone();
    void voice.say('Take off!', 'Hold your finger on the sky to steer!', 'Fly through the rings!');
  }
  function pick(id: ShowId, open: boolean) {
    if (!voice.active) return;
    if (!open) { sNope(); void voice.say('Fly a new Show to open it!'); return; }
    setAt(id); bg.current = null; sPop(); void voice.say(show(id).name as Phrase);
  }

  const burst = (x: number, y: number, s: string, n: number, c?: string) => { for (let i = 0; i < n && parts.current.length < 90; i++) parts.current.push({ x, y, vx: (Math.random() - 0.5) * 500, vy: (Math.random() - 0.7) * 500, t: 0, s, c }); };

  useCanvasLoop(canvas, phase !== 'pick', dt => {
    frames.current++;
    const w = world.current;
    if (!w) return;
    const f = finger.current;
    stepShow(w, dt, f ? { x: f.x, y: f.y } : null, !!f);
    drone.current?.set(phaseRef.current === 'pick' ? 0 : 0.8, Math.min(1, w.speed / 700));
    for (const e of w.events) {
      if (e === 'ring' || e === 'first-ring' || e === 'last-ring') {
        if (e !== 'last-ring') { sRing(w.passed); setPassed(w.passed); const r = w.rings.filter(x => x.passed).at(-1)!; burst(r.x, r.y, '✨', 6); if (extras.confetti) burst(r.x, r.y, '', 14, 'confetti'); if (extras.fireworks) burst(r.x, r.y - 120, '🎆', 3); }
        if (e === 'first-ring') void voice.sayMore('Through the ring!');
        if (e === 'last-ring') void voice.sayMore('Last ring!');
      }
      if (e === 'bump') { sBonk(); quip('Wobble!'); }
      if (e === 'boing') { sBoingShield(); quip('Boing!'); }
      if (e === 'trick') sTrick();
      if (e === 'turbo') quip('Zoom!');
      if (e === 'full') quip('Out of smoke!');
      if (e === 'rings-done') ringsDone(w);
    }
    if (extras.sparkle && frames.current % 6 === 0) burst(w.x - Math.cos(w.heading) * 20, w.y - Math.sin(w.heading) * 20, '✨', 1);
    for (const p of parts.current) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 500 * dt; }
    parts.current = parts.current.filter(p => p.t < 1.1);
    if (w.drawn !== drawnRef.current) { drawnRef.current = w.drawn; if (w.drawn % 10 === 0) setDrawn(w.drawn); }
  }, (c, cw, ch, dpr) => {
    const sc = ch / H;
    view.current = { sc, dpr, w: cw, h: ch };
    if (!world.current) world.current = createShow(cw / ch, fl, gear, seeded(Date.now() % 100000), here.thing as 'cloud');
    const w = world.current;
    if (Math.abs(w.width - cw / sc) > 2) resize(w, cw / ch);
    const key = `${cw}x${ch}:${at}`;
    if (bg.current?.key !== key) bg.current = { key, cv: paintBackdrop(here, cw, ch) };
    c.drawImage(bg.current.cv, 0, 0);
    const X = (x: number) => x * sc, Y = (y: number) => y * sc, t = w.t;
    // things in the sky
    c.textAlign = 'center'; c.textBaseline = 'middle';
    for (const h of w.hazards) { c.font = `${h.r * 2.2 * sc}px ${EMOJI_FONT}`; c.globalAlpha = h.hit > 0 ? 0.6 : 1; c.fillText(HAZARD_PIC[h.kind], X(h.x), Y(h.y + Math.sin(h.bob) * 12)); }
    c.globalAlpha = 1;
    // the ring, its back half
    const ring = currentRing(w), rr = RING_R * sc, pulse = 1 + Math.sin(t * 6) * 0.05;
    const hoop = (front: boolean) => {
      if (!ring) return;
      const ttl = Math.max(0, 1 - (w.t - ring.born) / 7);
      c.lineWidth = 14 * sc; c.strokeStyle = '#14161c';
      c.beginPath(); c.ellipse(X(ring.x), Y(ring.y), rr * 0.42 * pulse, rr * pulse, 0, front ? -Math.PI / 2 : Math.PI / 2, front ? Math.PI / 2 : Math.PI * 1.5); c.stroke();
      c.lineWidth = 8 * sc; c.strokeStyle = here.ring; c.stroke();
      if (!front) { c.globalAlpha = 0.25 * ttl; c.fillStyle = here.ring; c.beginPath(); c.ellipse(X(ring.x), Y(ring.y), rr * 0.42 * pulse, rr * pulse, 0, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1; }
    };
    hoop(false);
    // Free Sky's drawing, kept on its own layer: only new points are drawn each frame
    if (w.phase === 'free') {
      const lk = `${cw}x${ch}`;
      if (!layer.current || layer.current.key !== lk) { const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch; layer.current = { cv, key: lk, strokes: 0, points: 0 }; }
      const L = layer.current, lc = L.cv.getContext('2d')!;
      lc.lineCap = 'round'; lc.lineJoin = 'round';
      for (let si = Math.max(0, L.strokes - 1); si < w.drawing.length; si++) {
        const s = w.drawing[si]!, from = si === L.strokes - 1 ? L.points : 0;
        if (s.length - from < 1 || s.length < 2) continue;
        const col = smokeColorOf(smokeId, si * 7);
        lc.strokeStyle = col; lc.lineWidth = 16 * sc; lc.globalAlpha = 1;
        lc.beginPath(); const start = Math.max(0, from - 1); lc.moveTo(X(s[start]!.x), Y(s[start]!.y)); for (let i = start + 1; i < s.length; i++) lc.lineTo(X(s[i]!.x), Y(s[i]!.y)); lc.stroke();
        if (shape.mark && shape.mark !== 'dot' && shape.mark !== 'bubble') { lc.font = `${30 * sc}px ${EMOJI_FONT}`; lc.textAlign = 'center'; lc.textBaseline = 'middle'; for (let i = Math.max(1, from); i < s.length; i++) if (i % 6 === 0) lc.fillText(shape.mark, X(s[i]!.x), Y(s[i]!.y)); }
        L.strokes = si + 1; L.points = s.length;
      }
      c.drawImage(L.cv, 0, 0);
    }
    // the smoke trail behind the plane: in a few bands, fading toward its end
    const tr = w.trail, bands = 6;
    if (tr.length > 1) {
      c.lineCap = 'round'; c.lineJoin = 'round';
      for (let b = 0; b < bands; b++) {
        const i0 = Math.floor((b * (tr.length - 1)) / bands), i1 = Math.floor(((b + 1) * (tr.length - 1)) / bands);
        if (i1 <= i0) continue;
        c.globalAlpha = 0.2 + (0.7 * (b + 1)) / bands; c.strokeStyle = smokeColorOf(smokeId, b * 9 + Math.floor(t * 4));
        c.lineWidth = (8 + (b * 12) / bands) * sc * (shape.mark === 'dot' ? 0.5 : 1);
        c.beginPath(); c.moveTo(X(tr[i0]!.x), Y(tr[i0]!.y)); for (let i = i0 + 1; i <= i1; i++) c.lineTo(X(tr[i]!.x), Y(tr[i]!.y)); c.stroke();
      }
      if (shape.mark) {
        c.font = `${26 * sc}px ${EMOJI_FONT}`;
        for (let i = tr.length - 1, n = 0; i >= 0 && n < 40; i -= 7, n++) {
          c.globalAlpha = i / tr.length;
          if (shape.mark === 'dot') { c.fillStyle = smokeColorOf(smokeId, i); c.beginPath(); c.arc(X(tr[i]!.x), Y(tr[i]!.y), 9 * sc, 0, Math.PI * 2); c.fill(); }
          else if (shape.mark === 'bubble') { c.strokeStyle = smokeColorOf(smokeId, i); c.lineWidth = 3 * sc; c.beginPath(); c.arc(X(tr[i]!.x), Y(tr[i]!.y - 10), 14 * sc, 0, Math.PI * 2); c.stroke(); }
          else c.fillText(shape.mark, X(tr[i]!.x), Y(tr[i]!.y));
        }
      }
      c.globalAlpha = 1;
    }
    // a banner behind the plane
    if (extras.banner && tr.length > 20) { const p = tr[tr.length - 20]!; c.fillStyle = '#ffffff'; c.strokeStyle = '#14161c'; c.lineWidth = 3 * sc; c.beginPath(); c.roundRect(X(p.x) - 60 * sc, Y(p.y) - 20 * sc, 120 * sc, 40 * sc, 6 * sc); c.fill(); c.stroke(); c.font = `${26 * sc}px ${EMOJI_FONT}`; c.fillStyle = '#e63946'; c.fillText('★ ★ ★', X(p.x), Y(p.y)); }
    // the plane, the right way up unless it's looping
    c.save(); c.translate(X(w.x), Y(w.y)); c.rotate(w.heading);
    if (Math.cos(w.heading) < 0 && !w.trick) c.scale(1, -1);
    const wob = w.wobble > 0 ? Math.sin(t * 40) * w.wobble * 0.25 : 0;
    c.rotate(wob);
    drawPlane(c, look, sc * 0.8, t, w.roll);
    if (gear.shield) { c.strokeStyle = '#9fe0ff'; c.globalAlpha = 0.5; c.lineWidth = 4 * sc; c.beginPath(); c.arc(0, 0, 90 * sc, 0, Math.PI * 2); c.stroke(); c.globalAlpha = 1; }
    c.restore();
    hoop(true);
    // sparkles, confetti, fireworks
    for (const p of parts.current) {
      c.globalAlpha = Math.max(0, 1 - p.t);
      if (p.c) { c.fillStyle = `hsl(${(p.x * 3) % 360} 90% 60%)`; c.fillRect(X(p.x), Y(p.y), 10 * sc, 6 * sc); }
      else { c.font = `${(p.s === '🎆' ? 90 : 34) * sc}px ${EMOJI_FONT}`; c.fillText(p.s, X(p.x), Y(p.y)); }
    }
    c.globalAlpha = 1;
  }, 1.5);

  function ringsDone(w: ShowWorld) {
    setPhase('free');
    finger.current = null;
    if (settled.current) return;
    settled.current = true;
    const done = settleShow(player, at);
    sFanfare(); confetti(40, voice.signal);
    const lines: Phrase[] = ['Show done!', 'You flew through', `${Math.min(100, w.passed)}` as Phrase, 'rings!'];
    if (done?.patch) lines.push('You earned a patch!');
    if (done?.opens) lines.push('A new place to fly!');
    void voice.say(...lines).then(() => { if (voice.active) void voice.say('The sky is yours!', 'Draw with your smoke!'); });
  }

  // ---------- his finger leads the plane ----------
  function toWorld(e: PointerEvent) {
    const r = canvas.current!.getBoundingClientRect(), { sc, dpr } = view.current;
    return { x: ((e.clientX - r.left) * dpr) / sc, y: ((e.clientY - r.top) * dpr) / sc };
  }
  function down(e: PointerEvent) {
    if (phase === 'pick' || finger.current) return;
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    finger.current = { ...toWorld(e), id: e.pointerId };
  }
  function move(e: PointerEvent) { if (finger.current?.id === e.pointerId) finger.current = { ...toWorld(e), id: e.pointerId }; }
  function up(e: PointerEvent) { if (finger.current?.id === e.pointerId) finger.current = null; }

  function trick(id: TrickId) {
    const w = world.current;
    if (!w || !voice.active) return;
    if (startTrick(w, id)) { const name = TRICKS.find(x => x.id === id)!.name; quip(id === 'loop' ? 'Loop!' : id === 'roll' ? 'Roll!' : name as Phrase); }
  }
  function leave() {
    if (!voice.active) return;
    if (phase !== 'fly' || armed) { screen.value = 'airfield'; return; }
    setArmed(true); void voice.say('Tap again to leave.'); setTimeout(() => setArmed(false), 4000);
  }
  function keep() {
    const w = world.current;
    if (!w || !voice.active || kept === 'yes') return;
    const pts = postcardPoints(w);
    if (pts.length < 4) { sNope(); void voice.say('Draw something first!'); return; }
    if (player.state.peek().airfield.postcards.length >= MAX_POSTCARDS) { sNope(); setKept('full'); void voice.say('Your Wall is full!'); return; }
    if (keepCard(player, { show: at, smoke: smokeId, shape: shape.id, pts })) { setKept('yes'); sChime(); confetti(25, voice.signal); void voice.say('You kept a postcard!'); }
  }

  const open = openShows(a);
  return (
    <div class="screen show-screen" style={{ '--sky1': here.sky[0], '--sky2': here.sky[1] }}>
      <div class="show-hud">
        <IconButton label={armed ? 'Tap again to leave' : 'Airfield'} class={armed ? 'armed' : ''} onClick={leave}>🛫</IconButton>
        {phase === 'fly' && <span class="show-rings" aria-label={`${passed} rings`}>⭕ {passed}/{RINGS}</span>}
        {phase === 'free' && <span class="show-rings">🎨 {drawn ? '✏️' : ''}</span>}
        <span class="show-place">{here.patch} {here.name}</span>
      </div>
      <div class="show-field">
        <canvas ref={canvas} class="show-canvas" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} aria-label="The sky: hold to steer" />
        {phase === 'pick' && (
          <div class="show-card-wrap">
            <div class="show-card">
              <h2>Pick a place!</h2>
              <div class="show-places" role="group" aria-label="Places">
                {SHOWS.map(s => {
                  const isOpen = open.includes(s.id);
                  return (
                    <button key={s.id} class={`show-place-btn ${s.id === at ? 'on' : ''} ${isOpen ? '' : 'locked'}`} aria-label={s.name} onClick={() => pick(s.id, isOpen)}>
                      <span class="ico">{isOpen ? s.patch : '🔒'}</span>
                      {a.flown.includes(s.id) && <span class="flown" aria-hidden="true">✓</span>}
                    </button>
                  );
                })}
              </div>
              <button class="big-btn go pulse show-go" aria-label="Take off" onClick={takeOff}>Take off! 🛫</button>
            </div>
          </div>
        )}
        {phase === 'fly' && (
          <div class="show-pad">
            <button class="show-btn" aria-label="Loop" onPointerDown={e => { e.preventDefault(); trick('loop'); }}>🔄</button>
            <button class="show-btn" aria-label="Roll" onPointerDown={e => { e.preventDefault(); trick('roll'); }}>🌀</button>
            {special && <button class="show-btn" aria-label={TRICKS.find(x => x.id === special)!.name} onPointerDown={e => { e.preventDefault(); trick(special); }}>{TRICKS.find(x => x.id === special)!.pic}</button>}
            {gear.turbo && <button class="show-btn" aria-label="Turbo" onPointerDown={e => { e.preventDefault(); if (world.current) turbo(world.current); }}>⚡</button>}
          </div>
        )}
        {phase === 'free' && (
          <div class="show-pad free">
            {kept !== 'yes' && <button class="big-btn go show-keep" aria-label="Keep it" onClick={keep}>📮 Keep</button>}
            {kept === 'yes' && <button class="big-btn garage" aria-label="Wall" onClick={() => { screen.value = 'wall'; }}>🖼️</button>}
            <button class="big-btn garage show-done" aria-label="Done" onClick={() => { screen.value = 'airfield'; }}>✓</button>
          </div>
        )}
      </div>
    </div>
  );
}
