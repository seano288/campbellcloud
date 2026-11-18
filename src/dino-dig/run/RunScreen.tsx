// Alive: he plays as a dinosaur he brought to life. It starts, the first time, with the skeleton growing its skin ("It is alive!").
// Then, from the side: hold anywhere (or the ▶) to walk, tap (or ⬆) to jump, and 🦖 to roar, across the land he picked in the shop to
// his nest. Every dinosaur moves its own way (run.ts), wears its own colours, markings and hat, and roars its own roar. It pays nothing
// and costs nothing, and he can play any living dinosaur again from the Museum as often as he likes.
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { sBoing, sChime, sCrunch, sFanfare, sPop, sThud, noise } from '../../audio/sfx';
import { confetti } from '../../celebrate/effects';
import { seeded } from '../../game/rng';
import { IconButton } from '../../ui/bits';
import { bounds, drawDino } from '../art/dino';
import { chatter, EMOJI_FONT, useCanvasLoop } from '../art/loop';
import { player } from '../game';
import { running, screen } from '../nav';
import type { Phrase } from '../phrases';
import { playRoar } from '../sounds';
import { useVoiceScope } from '../voice';
import { dino, type DinoId } from '../museum/dinos';
import { hasGear, lookOf } from '../museum/state';
import { GEAR, LANDS, type GearId } from '../shop/shop';
import { abilities, AIR, createRun, HIGH, LENGTH, progress, stepRun, type Input, type RunWorld } from './run';
import { paintBackdrop, strip, type Backdrop } from './backdrop';

const VIEW_H = 760, GROUND = .8;
const THING_PIC: Record<string, string> = { log: '🪵', crab: '🦀', puddle: '🟫', cactus: '🌵', snowman: '⛄', lava: '🔥', gumdrop: '🍬' };
const WAKE_S = 2.6;

/** How big the dinosaur is in the run: its height in world units (small ones small, the long-necks tall) and its length. */
export function runSize(id: DinoId) {
  const d = dino(id), b = bounds(d), height = Math.max(130, Math.min(330, d.size * .85));
  return { height, length: height * b.width / b.height, px: height / b.height, left: b.left };
}

export function RunScreen() {
  const voice = useVoiceScope(), say = useRef(chatter<Phrase>((...l) => voice.say(...l))).current;
  const r = running.value!, d = dino(r.dino), m = player.state.value.museum, look = lookOf(m, r.dino);
  const land = LANDS.find(l => l.id === m.land) ?? LANDS[0]!;
  const gear = useMemo(() => new Set(GEAR.filter(g => hasGear(m, g.id)).map(g => g.id as GearId)), []);
  const can = useMemo(() => abilities(d, gear), []), size = useMemo(() => runSize(r.dino), []);
  const world = useRef<RunWorld>(createRun(size, land.id, seeded(m.done + r.dino.length)));
  const input = useRef<Input>({ walk: false, jumpHeld: false, jumpPressed: false, roar: false });
  const canvas = useRef<HTMLCanvasElement>(null), wake = useRef(r.waking ? 0 : WAKE_S), frames = useRef(0);
  const parts = useRef<{ x: number; y: number; vx: number; vy: number; t: number; c: string; s: string }[]>([]);
  const [phase, setPhase] = useState<'wake' | 'run' | 'done'>(r.waking ? 'wake' : 'run'), [eaten, setEaten] = useState(0), [armed, setArmed] = useState(false);
  const press = useRef<{ at: number; id: number } | null>(null), scenery = useRef<Backdrop | null>(null);

  useEffect(() => {
    if (r.waking) void voice.say('It is alive!', d.line as Phrase).then(() => { if (voice.active) void voice.say('Hold to walk!', 'Tap to jump!'); });
    else void voice.say(d.name as Phrase, 'Hold to walk!', 'Tap to jump!');
  }, []);

  if (import.meta.env.DEV) (window as unknown as { __run(): unknown }).__run = () => ({ phase, frames: frames.current, x: world.current.x, y: world.current.y, done: world.current.done, eaten: world.current.eaten, length: LENGTH });

  const burst = (x: number, y: number, s: string, n = 6) => { for (let i = 0; i < n && parts.current.length < 90; i++) parts.current.push({ x, y, vx: (Math.random() - .5) * 400, vy: -200 - Math.random() * 300, t: 0, c: '', s }); };

  useCanvasLoop(canvas, true, dt => {
    frames.current++;
    if (phase === 'wake') {
      wake.current += dt;
      if (wake.current >= WAKE_S) setPhase('run');
      return;
    }
    const w = world.current;
    if (phase !== 'run') return;
    const events = stepRun(w, dt, can, input.current);
    input.current.jumpPressed = false; input.current.roar = false;
    const head = { x: w.x + size.length * .45, y: w.y - size.height * .8 };
    for (const e of events) {
      if (e.kind === 'jump') sBoing();
      if (e.kind === 'land') { sThud(); if (gear.has('sparkle')) burst(w.x, 0, '✨', 4); }
      if (e.kind === 'eat') { sPop(); setEaten(w.eaten); if (w.eaten % 5 === 1) say('Yum!'); burst(e.snack.x, -e.snack.y, '✨', 3); }
      if (e.kind === 'bonk') { sBoing(); say('Bonk!'); }
      if (e.kind === 'smash') { sCrunch(); say('Smash!'); burst(e.block.x + e.block.w / 2, -30, '🪨', 6); }
      if (e.kind === 'move') { sThud(); say('Stomp!'); }
      if (e.kind === 'splash') { noise({ dur: .25, vol: .2, type: 'highpass', f: 1500 }); burst(w.x, 0, '💧', 3); }
      if (e.kind === 'roar') { playRoar(look.roar, d.size); if (gear.has('confetti')) burst(head.x + 40, head.y, '🎉', 10); }
      if (e.kind === 'shake') { say('Crunch!'); }
      if (e.kind === 'hint') say('Hold to walk!');
      if (e.kind === 'finish') {
        setPhase('done'); sFanfare(); confetti(50, voice.signal);
        void voice.say('You made it!', 'You ate', `${Math.min(100, w.eaten)}` as Phrase, 'snacks!');
      }
    }
    if (gear.has('trail') && w.vx > 50 && frames.current % 3 === 0) parts.current.push({ x: w.x - size.length * .3, y: w.y - size.height * .4, vx: 0, vy: 0, t: 0, c: `hsl(${(w.t * 300) % 360} 90% 60%)`, s: '' });
    for (const p of parts.current) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.s) p.vy += 900 * dt; }
    parts.current = parts.current.filter(p => p.t < (p.s ? 1 : .6));
  }, (c, cw, ch) => {
    const w = world.current, sc = ch / VIEW_H, gy = ch * GROUND, camX = w.x - (cw / sc) * .3;
    const X = (x: number) => (x - camX) * sc, Y = (y: number) => gy + y * sc;
    // the scenery: painted once for this size; the nearer hills slide slowly and the ground with him
    const key = `${cw}x${ch}:${land.id}`;
    if (scenery.current?.key !== key) scenery.current = { ...paintBackdrop(land, cw, ch, gy, sc), key };
    const bd = scenery.current;
    c.drawImage(bd.sky, 0, 0);
    strip(c, bd.near, camX * sc * .4, bd.nearTop, cw);
    strip(c, bd.ground, camX * sc, gy, cw);
    c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    // ponds, trees, the nest
    for (const p of w.ponds) { if (X(p.x + p.w) < 0 || X(p.x) > cw) continue; c.fillStyle = '#4aa3df'; c.fillRect(X(p.x), gy - 2, p.w * sc, 40 * sc); c.fillStyle = '#ffffff66'; c.fillRect(X(p.x) + 10, gy + 6 * sc, p.w * sc * .5, 4 * sc); }
    // trees stand on the ground line (an emoji's picture sits a little below its baseline, so it's lifted to stand on it)
    c.font = `${250 * sc}px ${EMOJI_FONT}`;
    for (const t of w.trees) { if (X(t.x) < -200 || X(t.x) > cw + 200) continue; c.fillText(land.id === 'beach' || land.id === 'desert' ? '🌴' : land.id === 'snow' ? '🌲' : land.id === 'candy' ? '🍭' : '🌳', X(t.x), gy - 22 * sc); }
    c.font = `${120 * sc}px ${EMOJI_FONT}`; c.fillText('🪺', X(LENGTH + 60), gy);
    // things in the way
    for (const b of w.blocks) {
      if (b.gone || X(b.x + b.w) < -50 || X(b.x) > cw + 50) continue;
      if (b.kind === 'rock') {
        c.fillStyle = '#8d8f86'; c.strokeStyle = '#1b1410'; c.lineWidth = 3;
        c.beginPath(); c.moveTo(X(b.x), gy); c.lineTo(X(b.x + b.w * .15), Y(-b.h)); c.lineTo(X(b.x + b.w * .7), Y(-b.h * 1.05)); c.lineTo(X(b.x + b.w), gy); c.closePath(); c.fill(); c.stroke();
      } else { c.font = `${b.h * 1.6 * sc}px ${EMOJI_FONT}`; c.fillText(THING_PIC[land.thing] ?? '🪵', X(b.x + b.w / 2), gy + 4 * sc); }
    }
    // snacks
    for (const s of w.snacks) {
      if (s.eaten || X(s.x) < -40 || X(s.x) > cw + 40) continue;
      const pic = s.kind === 'fruit' ? '🍎' : s.kind === 'high' ? '🍃' : s.kind === 'air' ? (land.id === 'candy' ? '🍭' : '🦋') : land.snack;
      c.font = `${(s.kind === 'low' ? 46 : 54) * sc}px ${EMOJI_FONT}`;
      c.fillText(pic, X(s.x), Y(-s.y) + (s.kind === 'air' ? Math.sin(w.t * 5 + s.id) * 8 * sc : 0));
      if (s.kind === 'high') { c.strokeStyle = '#6b4523'; c.lineWidth = 5 * sc; c.beginPath(); c.moveTo(X(s.x) - 40 * sc, Y(-HIGH) - 30 * sc); c.lineTo(X(s.x) + 30 * sc, Y(-HIGH) - 26 * sc); c.stroke(); }
      void AIR;
    }
    // the trail, then the dinosaur
    for (const p of parts.current) if (!p.s) { c.globalAlpha = 1 - p.t / .6; c.fillStyle = p.c; c.beginPath(); c.arc(X(p.x), Y(p.y), 14 * sc, 0, Math.PI * 2); c.fill(); }
    c.globalAlpha = 1;
    const k = phase === 'wake' ? Math.min(1, Math.max(0, (wake.current - .6) / 1.4)) : 1;
    const stride = Math.min(1, Math.abs(w.vx) / Math.max(1, can.speed * .6)), wob = w.wobble > 0 ? Math.sin(w.wobble * 40) * .08 : 0;
    const pose = { phase: w.phase, stride: phase === 'wake' ? 0 : stride, jaw: w.roar > .4 ? 1 : 0, flap: can.fly && !w.onGround ? Math.sin(w.t * 14) : 0 };
    c.save(); c.translate(X(w.x), Y(w.y)); c.rotate(wob);
    const px = size.px * sc;
    if (k < 1) { c.globalAlpha = 1 - k; drawDino(c, d, { mode: 'bones', px, have: d.bones, pose }); }
    if (k > 0) { c.globalAlpha = k; drawDino(c, d, { mode: 'skin', px, look, pose, t: w.t }); }
    c.restore(); c.globalAlpha = 1;
    if (phase === 'wake') { c.font = `${50 * sc}px ${EMOJI_FONT}`; for (let i = 0; i < 8; i++) { const a = wake.current * 3 + i; c.fillText('✨', X(w.x) + Math.cos(a) * 160 * sc, Y(-size.height / 2) + Math.sin(a) * 120 * sc); } }
    for (const p of parts.current) if (p.s) { c.globalAlpha = 1 - p.t; c.font = `${40 * sc}px ${EMOJI_FONT}`; c.fillText(p.s, X(p.x), Y(p.y)); }
    c.globalAlpha = 1;
  }, 1.5); // a full-screen canvas: fill rate, not detail, is the iPad 9's limit

  // ---------- controls ----------
  const walk = (on: boolean) => { input.current.walk = on; };
  const jump = () => { input.current.jumpPressed = true; input.current.jumpHeld = true; };
  const unjump = () => { input.current.jumpHeld = false; };
  /** On the picture: holding walks; a quick tap jumps. */
  function down(e: PointerEvent) {
    if (phase !== 'run' || press.current) return;
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    press.current = { at: performance.now(), id: e.pointerId };
    walk(true);
  }
  function up(e: PointerEvent) {
    if (!press.current || press.current.id !== e.pointerId) return;
    if (performance.now() - press.current.at < 180) { jump(); setTimeout(unjump, 120); }
    press.current = null;
    walk(false);
  }
  function home() {
    if (!voice.active) return;
    if (phase === 'done' || armed) { screen.value = 'museum'; return; }
    setArmed(true); void voice.say('Tap again to leave.'); setTimeout(() => setArmed(false), 4000);
  }
  function again() {
    world.current = createRun(size, land.id, seeded(Math.floor(Math.random() * 1e6)));
    setEaten(0); setPhase('run'); sChime();
    void voice.say('Hold to walk!');
  }
  const prog = progress(world.current);
  return (
    <div class="screen run-screen">
      <div class="run-hud">
        <IconButton label={armed ? 'Tap again to leave' : 'Museum'} class={armed ? 'armed' : ''} onClick={home}>🏛️</IconButton>
        <span class="run-track" aria-hidden="true"><i style={{ width: `${prog * 100}%` }} /><b style={{ left: `${prog * 100}%` }}>🦖</b><em>🪺</em></span>
        <span class="run-eaten" aria-label={`${eaten} snacks`}>{land.snack} {eaten}</span>
      </div>
      <div class="run-field">
        <canvas ref={canvas} class="run-canvas" onPointerDown={down} onPointerUp={up} onPointerCancel={up} />
        {phase === 'run' && (
          <div class="run-pad">
            <button class="run-btn walk" aria-label="Walk" onPointerDown={e => { e.preventDefault(); walk(true); }} onPointerUp={() => walk(false)} onPointerLeave={() => walk(false)} onPointerCancel={() => walk(false)}>▶</button>
            <span class="run-gap" />
            <button class="run-btn roar" aria-label="Roar" onPointerDown={e => { e.preventDefault(); input.current.roar = true; }}>🦖</button>
            <button class="run-btn jump" aria-label="Jump" onPointerDown={e => { e.preventDefault(); jump(); }} onPointerUp={unjump} onPointerLeave={unjump} onPointerCancel={unjump}>⬆</button>
          </div>
        )}
        {phase === 'done' && (
          <div class="run-card-wrap">
            <div class="run-card">
              <h2>You made it!</h2>
              <p class="run-ate">{land.snack} × {eaten}</p>
              <div class="run-card-btns">
                <button class="big-btn garage" aria-label="Museum" onClick={() => { screen.value = 'museum'; }}>🏛️</button>
                <button class="big-btn go pulse" aria-label="Play again" onClick={again}>▶</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export { sPop };
