// The Job, the reward he drives: about a minute through the city he built, from above. First a card with the Job's name and his
// vehicle, then he drives. He holds a finger where he wants to go and the vehicle finds its way there along the streets (job/sim.ts):
// the held-finger pattern of Math Bots' fight, copied here, not imported. A quick tap sends it to that spot. The next stop has a
// big star and its people waiting; reaching it stops the vehicle, they get on (or the parcels go), and the count is said as it goes
// up in equal groups: "3. 6. 9." There's no clock and nothing to lose; kerbs and cars only bounce him, and every Job ends with a cheer.
//
// The whole screen is the street map, so his finger never has to reach the edges, which belong to iPadOS; the buttons sit in the
// top corners and above the bottom band. Keys work on a computer: the arrows drive toward the next stop.
import { useEffect, useRef, useState } from 'preact/hooks';
import { sFanfare } from '../../audio/sfx';
import { confetti } from '../../celebrate/effects';
import { earnedLine } from '../../currency/kind';
import { IconButton } from '../../ui/bits';
import { CurrencyIcon } from '../../ui/currency';
import { drawPerson, drawVehicle, emoji, O, vehicleSize } from '../art/draw';
import { SKYLINE_CURRENCY } from '../branding';
import { DISTRICTS, itemOf, vehicleOf } from '../city/catalog';
import { type JobPay, type JobRef } from '../city/city';
import { drawCars, drawCity, type Camera } from '../city/paint';
import { player, settleJob } from '../game';
import { job, jobRef, screen } from '../nav';
import { canSay, n, named, NUMBERS_TO, type Phrase } from '../phrases';
import { startRound } from '../round';
import { useVoiceScope } from '../voice';
import { jobTitle, planJob, type Job } from './plan';
import { createJob, STEP, stepJob, type JobSim } from './sim';
import { motorSound, sBump, sDing } from './sounds';
import { seeded } from '../../game/rng';
import type { Pt } from '../city/grid';

type Phase = 'card' | 'live' | 'end';
const TAP_MS = 2200;

/** What the Job is called, said: "Old Town Loop", or "Bus Route number 41". */
export function titleSpeech(ref: JobRef): Phrase[] {
  return 'named' in ref ? [named(ref.named.name)] : [named(jobTitle(ref)), ...(canSay(ref.n) && ref.n <= NUMBERS_TO ? ['number' as const, n(ref.n)] : [])];
}

function paintOf(vehicle: string): string {
  const p = player.state.peek().city.paint[vehicle], paint = p ? itemOf(p) : null;
  return paint && 'colour' in paint ? paint.colour : vehicleOf(vehicle)!.colour;
}

export function JobScreen() {
  const voice = useVoiceScope();
  const ref = jobRef.value ?? null;
  const [phase, setPhase] = useState<Phase>('card'), [pay, setPay] = useState<JobPay | null>(null), [total, setTotal] = useState(0), [armed, setArmed] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null), stopsEl = useRef<HTMLSpanElement>(null), countEl = useRef<HTMLSpanElement>(null);
  const plan = useRef<Job | null>(null);
  if (!plan.current && ref) plan.current = planJob(player.state.peek().city, ref);
  const j = plan.current;
  const first = player.state.peek().city.done === 0;

  useEffect(() => { if (phase === 'card' && ref) void voice.say(...titleSpeech(ref)); }, [phase]);

  useEffect(() => {
    if (phase !== 'live' || !j || !ref) return;
    const stop = new AbortController(), c = canvas.current!, g = c.getContext('2d')!;
    const sim: JobSim = createJob(j.plan, j.stats, seeded(Date.now() >>> 0));
    const motor = motorSound(j.stats.fly), vehicle = vehicleOf(j.vehicle)!, colour = paintOf(j.vehicle);
    const city = player.state.peek().city;
    const cam: Camera = { x: sim.car.x, y: sim.car.y, zoom: 1 };
    let target: Pt | null = null, held: number | null = null, tapUntil = 0, raf = 0, last = 0, spare = 0, settled = false, popups: { x: number; y: number; text: string; life: number }[] = [];
    const keys = new Set<string>();
    if (import.meta.env.DEV) (window as unknown as { __job?: unknown }).__job = {
      /** The next stop on screen, in CSS pixels from the canvas's corner, for the tour's finger. */
      next: () => { const s = sim.plan.stops[sim.next]; if (!s) return null; const r = c.getBoundingClientRect(); return { x: (s.at.x - cam.x) * cam.zoom + r.width / 2, y: (s.at.y - cam.y) * cam.zoom + r.height / 2 }; },
      done: () => sim.done,
    };

    const size = () => {
      const dpr = Math.min(2, devicePixelRatio || 1), w = c.clientWidth, h = c.clientHeight;
      if (c.width !== Math.round(w * dpr)) c.width = Math.round(w * dpr);
      if (c.height !== Math.round(h * dpr)) c.height = Math.round(h * dpr);
      return { w, h, dpr };
    };
    const toWorld = (e: PointerEvent): Pt => {
      const r = c.getBoundingClientRect();
      return { x: cam.x + (e.clientX - r.left - r.width / 2) / cam.zoom, y: cam.y + (e.clientY - r.top - r.height / 2) / cam.zoom };
    };
    const down = (e: PointerEvent) => { if (held !== null) return; held = e.pointerId; c.setPointerCapture(e.pointerId); target = toWorld(e); tapUntil = Infinity; };
    const move = (e: PointerEvent) => { if (e.pointerId === held) target = toWorld(e); };
    const up = (e: PointerEvent) => { if (e.pointerId !== held) return; held = null; tapUntil = performance.now() + TAP_MS; };
    c.addEventListener('pointerdown', down, { signal: stop.signal });
    c.addEventListener('pointermove', move, { signal: stop.signal });
    c.addEventListener('pointerup', up, { signal: stop.signal });
    c.addEventListener('pointercancel', up, { signal: stop.signal });
    // Safari's own touch handling stays out of it: no scroll, zoom or callout while he drives
    const hold = (e: TouchEvent) => { if ((e.target as Element).closest('canvas')) e.preventDefault(); };
    for (const type of ['touchstart', 'touchmove'] as const) c.addEventListener(type, hold as EventListener, { passive: false, signal: stop.signal });
    const key = (e: KeyboardEvent) => { if (e.key.startsWith('Arrow')) { e.preventDefault(); if (e.type === 'keydown') keys.add(e.key); else keys.delete(e.key); } };
    addEventListener('keydown', key, { signal: stop.signal }); addEventListener('keyup', key, { signal: stop.signal });

    const heard = () => {
      for (const ev of sim.events) {
        if (ev.t === 'arrive') { /* people step up to the door */ }
        if (ev.t === 'stop') {
          sDing();
          const at = sim.plan.stops[ev.index]!.at;
          popups.push({ x: at.x, y: at.y - 30, text: `${ev.total}`, life: 1.4 });
          if (stopsEl.current) stopsEl.current.textContent = `${sim.next}/${sim.plan.stops.length}`;
          if (countEl.current) countEl.current.textContent = String(ev.total);
          void voice.say(n(ev.total), ...(sim.next === sim.plan.stops.length - 1 ? ['Last stop!' as const] : []));
        }
        if (ev.t === 'bump') sBump(ev.hard);
        if (ev.t === 'done') finish();
      }
    };
    const finish = () => {
      if (settled) return;
      settled = true;
      const p = settleJob(player, ref, sim.collected);
      setTotal(sim.collected); setPay(p);
      setTimeout(() => { if (!stop.signal.aborted) setPhase('end'); }, 900);
    };

    const frame = (ms: number) => {
      raf = requestAnimationFrame(frame);
      const now = ms / 1000, dt = last ? Math.min(.1, now - last) : 0;
      last = now;
      if (document.hidden) return;
      if (held === null && performance.now() > tapUntil) target = null;
      // keys: head for the next stop, like a finger held on it
      const aim = keys.size ? sim.plan.stops[sim.next]?.at ?? null : target;
      spare += dt;
      while (spare >= STEP) { spare -= STEP; stepJob(sim, aim); heard(); }
      // a tap's spot is done once he's there
      if (held === null && target && Math.hypot(target.x - sim.car.x, target.y - sim.car.y) < 30) target = null;
      motor.set(Math.hypot(sim.car.vx, sim.car.vy) / j.stats.speed);
      const { w, h, dpr } = size();
      cam.zoom = Math.max(.62, Math.min(1.5, Math.min(w, h) / 560)) * dpr;
      cam.x += (sim.car.x - cam.x) * Math.min(1, dt * 4); cam.y += (sim.car.y - cam.y) * Math.min(1, dt * 4);
      const W = c.width, H = c.height;
      drawCity(g, city, j.plan.bounds, cam, W, H, 0);
      drawCars(g, sim.traffic, cam, W, H);
      g.save(); g.scale(cam.zoom, cam.zoom); g.translate(-(cam.x - W / 2 / cam.zoom), -(cam.y - H / 2 / cam.zoom));
      // the stops still to come, the next one big with its star and its people waiting
      sim.plan.stops.forEach((s, i) => {
        if (i < sim.next) return;
        const next = i === sim.next, pulse = 1 + Math.sin(now * 5) * .08;
        g.globalAlpha = next ? 1 : .45;
        g.fillStyle = next ? '#ffd23f' : '#ffffff'; g.strokeStyle = O; g.lineWidth = 3;
        g.beginPath(); g.arc(s.at.x, s.at.y, (next ? 26 : 14) * pulse, 0, Math.PI * 2); g.fill(); g.stroke();
        emoji(g, next ? '⭐' : '•', s.at.x, s.at.y, next ? 26 : 12);
        if (next && sim.dwell === 0) for (let k = 0; k < Math.min(10, j.plan.group); k++) drawPerson(g, s.at.x - 24 + (k % 5) * 12, s.at.y + 34 + Math.floor(k / 5) * 16, (k * 61) % 360, now * 6 + k);
        g.globalAlpha = 1;
      });
      // the people getting on, walking into the vehicle
      if (sim.dwell > 0) {
        const s = sim.plan.stops[sim.next]!, k = 1 - sim.dwell / 1.4;
        for (let p = 0; p < Math.min(10, j.plan.group); p++) { const t = Math.min(1, k * 1.4 - p * .08); if (t > 0 && t < 1) drawPerson(g, s.at.x + (sim.car.x - s.at.x) * t - 24 + (p % 5) * 12 * (1 - t), s.at.y + 34 * (1 - t) + (sim.car.y - s.at.y) * t, (p * 61) % 360, now * 8); }
      }
      // where his finger is
      if (target) { g.strokeStyle = '#ffffffcc'; g.lineWidth = 4; g.beginPath(); g.arc(target.x, target.y, 16, 0, Math.PI * 2); g.stroke(); }
      drawVehicle(g, vehicle, colour, sim.car.x, sim.car.y, sim.car.angle, now, sim.car.wobble);
      popups = popups.filter(p => (p.life -= dt) > 0);
      for (const p of popups) { g.font = '900 34px Nunito,sans-serif'; g.textAlign = 'center'; g.lineWidth = 6; g.strokeStyle = O; g.strokeText(p.text, p.x, p.y - (1.4 - p.life) * 30); g.fillStyle = '#ffd23f'; g.fillText(p.text, p.x, p.y - (1.4 - p.life) * 30); }
      g.restore();
      // an arrow at the edge toward the next stop when it's off screen
      const s = sim.plan.stops[sim.next];
      if (s) {
        const sx = (s.at.x - cam.x) * cam.zoom + W / 2, sy = (s.at.y - cam.y) * cam.zoom + H / 2, m = 60 * dpr;
        if (sx < 0 || sy < 0 || sx > W || sy > H) {
          const a = Math.atan2(sy - H / 2, sx - W / 2), ex = Math.max(m, Math.min(W - m, sx)), ey = Math.max(m + 40 * dpr, Math.min(H - m - 40 * dpr, sy));
          g.save(); g.translate(ex, ey); g.rotate(a); g.fillStyle = '#ffd23f'; g.strokeStyle = O; g.lineWidth = 4 * dpr;
          g.beginPath(); g.moveTo(26 * dpr, 0); g.lineTo(-14 * dpr, -18 * dpr); g.lineTo(-6 * dpr, 0); g.lineTo(-14 * dpr, 18 * dpr); g.closePath(); g.fill(); g.stroke(); g.restore();
        }
      }
    };
    raf = requestAnimationFrame(frame);
    void voice.say('Go!', ...(first ? ['Hold your finger where you want to go!', 'Head for the star!'] as const : []));
    return () => { cancelAnimationFrame(raf); stop.abort(); motor.stop(); };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'end' || !pay || !j) return;
    sFanfare(); confetti(40, voice.signal);
    const more: Phrase[] = [];
    if (pay.best) more.push('New best!');
    if (pay.district !== null) more.push('You opened a new District!', named(DISTRICTS[pay.district]!.name));
    for (const t of pay.trophies) more.push('You won', named(t.name));
    void voice.say('Job done!', n(Math.min(total, 200)), named(j.thing), earnedLine(SKYLINE_CURRENCY, Math.min(6, pay.bricks)), ...more);
  }, [phase, pay]);

  useEffect(() => { if (!ref || !j) screen.value = 'city'; }, []); // no Job to drive: back to the City (after render, not during it)
  if (!ref || !j) return null;
  const leave = () => {
    if (!voice.active) return;
    if (phase !== 'live' || armed) { screen.value = 'city'; return; }
    setArmed(true); void voice.say('Tap again to leave.');
    setTimeout(() => setArmed(false), 3000);
  };
  const after = player.state.value.city;
  const v = vehicleOf(j.vehicle)!;

  if (phase === 'card') {
    return (
      <div class="screen sl-job-screen card-phase" data-phase="card">
        <header class="job-head"><IconButton label="City" onClick={() => { if (voice.active) screen.value = 'city'; }}>🏙️</IconButton></header>
        <div class="job-card">
          <div class="job-ticket">
            <h2>{jobTitle(ref)}{'named' in ref ? '' : ` ${ref.n}`}</h2>
            <VehiclePic vehicle={j.vehicle} />
            <div class="job-meta"><p class="job-vehicle">{v.name}</p><p class="job-stops">⭐ × {j.plan.stops.length}</p></div>
          </div>
          <button class="big-btn go pulse" aria-label="Go" onClick={() => { if (voice.active) setPhase('live'); }}><span class="e">▶</span></button>
        </div>
      </div>
    );
  }
  return (
    <div class="screen sl-job-screen" data-phase={phase}>
      <canvas ref={canvas} class="job-canvas" aria-label="Your city's streets: hold your finger where you want to go" />
      <div class="job-hud">
        <IconButton label={armed ? 'Tap again to leave' : 'Leave'} class={armed ? 'armed' : ''} onClick={leave}>🏠</IconButton>
        <span class="hud-chip">⭐ <span ref={stopsEl}>0/{j.plan.stops.length}</span></span>
        <span class="hud-chip">{j.kind === 'parcel' ? '📦' : j.kind === 'icecream' ? '🍦' : j.kind === 'bins' ? '🗑️' : j.kind === 'sweeper' ? '🍂' : j.kind === 'fire' ? '🔥' : j.kind === 'heli' ? '📷' : '👥'} <span ref={countEl}>0</span></span>
      </div>
      {phase === 'end' && pay && (
        <div class="job-result" role="dialog"><div class="result-card">
          <h2>Job done!</h2>
          <p class="result-total">{total} {j.thing.replace('!', '')}</p>
          <div class="result-bricks"><CurrencyIcon kind={SKYLINE_CURRENCY} size={40} />+{pay.bricks}</div>
          {pay.best && <p class="result-line">⭐ New best!</p>}
          {pay.district !== null && <p class="result-line">🗺️ {DISTRICTS[pay.district]!.name}</p>}
          {pay.trophies.map(t => <p key={t.key} class="result-line">{t.emoji} {t.name}</p>)}
          <div class="btns">
            <button class="big-btn garage" aria-label="City" onClick={() => { if (voice.active) screen.value = 'city'; }}><span class="e">🏙️</span></button>
            {after.jobs > 0
              ? <button class="big-btn go" aria-label="Job again" onClick={() => { if (voice.active) job(); }}><span class="e">🚌</span></button>
              : <button class="big-btn go" aria-label="Play" onClick={() => { if (voice.active) startRound(); }}><span class="e">▶</span></button>}
          </div>
        </div></div>
      )}
    </div>
  );
}

/** His vehicle on the Job's card: drawn from above as it drives, as big as fits, on a stretch of road with its lane line. */
export function VehiclePic({ vehicle, paint }: { vehicle: string; paint?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const g = c.getContext('2d')!, v = vehicleOf(vehicle)!, W = 480, H = 240, { L, W: wide } = vehicleSize(v);
    c.width = W; c.height = H;
    // pavement, kerbs, the road and its dashed lane line
    g.fillStyle = '#d9d2c3'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#5b6170'; g.fillRect(0, 34, W, H - 68);
    g.fillStyle = O; g.fillRect(0, 30, W, 5); g.fillRect(0, H - 35, W, 5);
    g.strokeStyle = '#ffd23f'; g.lineWidth = 7; g.setLineDash([34, 24]); g.beginPath(); g.moveTo(0, H / 2 + 26); g.lineTo(W, H / 2 + 26); g.stroke(); g.setLineDash([]);
    const k = Math.min(300 / L, 96 / wide, 5);
    g.save(); g.translate(W / 2, v.fly ? H / 2 : H / 2 - 22); g.scale(k, k); drawVehicle(g, v, paint ?? paintOf(vehicle), 0, 0, 0, 0.3); g.restore();
  }, [vehicle, paint]);
  return <canvas ref={ref} class="vehicle-pic" aria-hidden="true" />;
}
