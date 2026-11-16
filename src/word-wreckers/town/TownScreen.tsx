// The Town, the screen he shows off: his streets from the side, every building he has put up standing on its lot (gold ones shining),
// his decorations along the pavement and in the sky, the features his Road Jobs put on the road, and his traffic driving up and down
// on its own. He drives any of his machines along the road (hold ◀ or ▶) and honks (📯, with his horn). Driving through a feature
// works it: the Car Wash bubbles, the Jump Ramp jumps, the Loop the Loop goes round, the Tunnel swallows him, the Turbo Pad zooms...
// Tapping a building says its name and it bounces; tapping a decoration, a car or a feature does the same (a car honks, a feature goes
// off); an empty lot says a Job will fill it; the next street, still fenced off, says what it costs. The six districts (Farm Lane,
// the Fairground, Beach Road, Airport Way, Snowy Peak, Dino Valley) each have their own scenery behind the lots. Nothing here can be lost.
//
// Controls act on pointerdown and are big; the canvas takes touch directly (touch-action: none). Only what's on screen is drawn.
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { noise, sBoing, sChime, sPop, sWhoosh, tone } from '../../audio/sfx';
import { IconButton } from '../../ui/bits';
import { CurrencyPile } from '../../ui/currency';
import { buildingSvg, LOT_W } from '../art/buildings';
import { FEATURE_H, FEATURE_VIEW, FEATURE_W, featureSvg, IN_FRONT } from '../art/features';
import { lookOf, MachineView } from '../art/Pics';
import { WRECKERS_CURRENCY } from '../branding';
import { player, updateYard } from '../game';
import { playHorn } from '../horns';
import { drawBolt, drawMachine, drawSvg } from '../job/draw';
import { eatNextClick, goJob, justBuilt, screen } from '../nav';
import { NUMBERS_TO, type Phrase } from '../phrases';
import { useVoiceScope, type VoiceScope } from '../voice';
import {
  building, DECOS, feature, isSkyDeco, keyOf, LOTS_PER_STREET, MACHINES, ROAD_SLOTS, STREETS, TRAFFIC, type Effect, type FeatureId, type MachineId, type Scene,
} from '../yard/shop';
import { isOwned, ownsMachine, type YardState } from '../yard/yard';

export const T_VIEW_H = 640, T_GROUND = 520, LOT_GAP = 250, STREET_PAD = 160, M_SCALE_T = .62;
const ROAD_Y = T_GROUND + 56, F_SCALE = .85, TRAFFIC_Y = T_GROUND + 40, M_W = 240 * M_SCALE_T;
const EMOJI = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
const CONFETTI = ['#e63946', '#ffd23f', '#2bb673', '#3d9be0', '#ff7ac0', '#7a4fd8'];

interface Spot { kind: 'lot'; x: number; i: number }
interface StreetSpan { id: string; name: string; x0: number; x1: number; owned: boolean; price: number; ground: string; sky: string; scene?: Scene }

/**
 * Where everything stands along the road: each owned street's lots (in the shop's order), then the cheapest street he hasn't got,
 * fenced off. Each owned street also has ROAD_SLOTS places on its road for features, in front of its second, fourth and sixth lots.
 */
export function layout(yard: Pick<YardState, 'owned'>) {
  const streets: StreetSpan[] = [], lots: Spot[] = [], slots: number[] = [];
  let x = 60, lot = 0;
  const owned = STREETS.filter(st => isOwned(yard, keyOf('street', st.id)));
  const next = STREETS.filter(st => !isOwned(yard, keyOf('street', st.id))).sort((a, b) => a.price - b.price)[0];
  for (const st of [...owned, ...(next ? [next] : [])]) {
    const mine = st !== next, x0 = x;
    x += STREET_PAD;
    if (mine) for (let k = 0; k < LOTS_PER_STREET; k++, lot++) {
      lots.push({ kind: 'lot', x: x + LOT_GAP / 2, i: lot });
      if (k % 2 === 1 && slots.length < (streets.length + 1) * ROAD_SLOTS) slots.push(x + LOT_GAP / 2);
      x += LOT_GAP;
    }
    else x += LOT_GAP * 2;
    streets.push({ id: st.id, name: st.name, x0, x1: x, owned: mine, price: st.price, ground: st.ground, sky: st.sky, scene: 'scene' in st ? st.scene : undefined });
  }
  return { streets, lots, slots, width: x + 120 };
}

function chatter(voice: VoiceScope) {
  let talking = false;
  return (...line: Phrase[]) => { if (talking) return; talking = true; void voice.say(...line).then(() => { talking = false; }); };
}

interface Particle { x: number; y: number; vx: number; vy: number; t: number; life: number; color: string; kind: 'dot' | 'bubble' | 'star' | 'rect' }
interface Car { id: string; x: number; dir: 1 | -1 }
/** What his machine is doing because of a feature: jumping, looping, bumping, zooming. */
interface Ride { jump: number; loop: number; bumps: number; turbo: number }

const SOUNDS: Record<Effect, () => void> = {
  wash: () => noise({ dur: 1, vol: .2, type: 'bandpass', f: 1500, beat: .05 }),
  jump: () => tone(300, .5, 'sine', 0, .2, 900),
  bumps: () => { for (let i = 0; i < 3; i++) tone(160, .1, 'square', i * .14, .1, 110); },
  tunnel: () => tone(220, .9, 'triangle', 0, .1, 160),
  splash: () => noise({ dur: .5, vol: .35, type: 'bandpass', f: 900, f2: 300 }),
  loop: () => tone(260, 1.2, 'sine', 0, .18, 1040),
  bubbles: () => { for (let i = 0; i < 5; i++) tone(900 + i * 160, .08, 'sine', i * .09, .08); },
  confetti: sPop,
  spray: () => noise({ dur: .9, vol: .15, type: 'highpass', f: 2500 }),
  sparkle: sChime,
  turbo: () => sWhoosh(.7),
  fireworks: () => { for (let i = 0; i < 3; i++) { tone(400, .3, 'sine', i * .35, .12, 1600); noise({ dur: .4, vol: .3, f: 1200, when: i * .35 + .3 }); } },
};

export function TownScreen() {
  const voice = useVoiceScope(), yard = player.state.value.yard, say = useRef(chatter(voice)).current;
  const { streets, lots, slots, width } = useMemo(() => layout(yard), [yard.owned]);
  const mine = MACHINES.map(m => m.id).filter(m => ownsMachine(yard, m)) as MachineId[];
  const decos = useMemo(() => DECOS.filter(d => isOwned(yard, keyOf('deco', d.id))), [yard.owned]);
  const roads = useMemo(() => yard.roads.slice(0, slots.length).map((f, i) => ({ f, x: slots[i]! })), [yard.roads, slots]);
  const canvas = useRef<HTMLCanvasElement>(null), drive = useRef<-1 | 0 | 1>(0), keys = useRef(new Set<string>());
  const shown = justBuilt.peek(), startLot = shown ? yard.town.findIndex(l => l.b === shown) : -1;
  const pos = useRef({
    x: startLot >= 0 ? lots[startLot]!.x - 300 : 80, flip: false, bounce: new Map<number, number>(), hop: new Map<number, number>(), launch: new Map<number, number>(),
    honk: 0, t: 0, inside: new Set<number>(), ride: { jump: 0, loop: 0, bumps: 0, turbo: 0 } as Ride, tunnel: false, fired: 0, last: '' as string, tapped: '' as string,
  });
  const particles = useRef<Particle[]>([]);
  const cars = useRef<Car[]>([]);
  const toWorld = useRef<(x: number, y: number) => { x: number; y: number }>(() => ({ x: 0, y: 0 }));
  const [, redraw] = useState(0);

  // his traffic, spread out along the road, half of it each way
  useEffect(() => {
    const owned = TRAFFIC.filter(t => isOwned(yard, keyOf('traffic', t.id)));
    cars.current = owned.map((t, i) => ({ id: t.id, x: 120 + ((i * 397) % Math.max(400, width - 300)), dir: i % 2 ? -1 : 1 }));
  }, [yard.owned, width]);

  useEffect(() => {
    // through chatter, so a feature going off doesn't talk over it
    say('Your Town!', ...(shown && startLot >= 0 ? [building(yard.town[startLot]!.b).name] as Phrase[] : ['Hold the arrows to drive!'] as Phrase[]));
    if (startLot >= 0) pos.current.bounce.set(startLot, 0);
    // a feature he's parked on doesn't go off until he drives out and back in
    roads.forEach((rd, i) => { if (Math.abs(pos.current.x + M_W / 2 - rd.x) < 90) pos.current.inside.add(i); });
    justBuilt.value = null;
    const key = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (e.type === 'keydown') { keys.current.add(k); if (k === ' ' && !e.repeat) honk(); } else keys.current.delete(k);
      if (k.startsWith('arrow') || k === ' ') e.preventDefault();
    };
    addEventListener('keydown', key); addEventListener('keyup', key);
    return () => { removeEventListener('keydown', key); removeEventListener('keyup', key); };
  }, []);
  if (import.meta.env.DEV) (window as unknown as { __town(): unknown }).__town = () => {
    const p = pos.current;
    return { x: p.x, width, lots: lots.length, built: yard.town.length, roads: roads.map(r => ({ f: r.f, x: r.x })), cars: cars.current.map(c => ({ id: c.id, x: c.x })), decos: decos.map((d, j) => ({ id: d.id, ...decoAt(j) })), fired: p.fired, last: p.last, tapped: p.tapped, ride: { ...p.ride }, particles: particles.current.length };
  };

  // ---------- effects ----------
  function burst(x: number, y: number, kind: Particle['kind'], n: number, colors: readonly string[], spread = 1) {
    const out = particles.current;
    for (let i = 0; i < n && out.length < 180; i++) {
      const a = Math.random() * Math.PI * 2, v = (60 + Math.random() * 160) * spread;
      out.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (kind === 'bubble' ? 60 : 120), t: 0, life: .9 + Math.random() * .6, color: colors[i % colors.length]!, kind });
    }
  }
  /** A feature goes off at x: its particles and sound, and (when he drove through it) what it does to his machine. */
  function fire(f: FeatureId, x: number, byMachine: boolean) {
    const e = feature(f).effect, p = pos.current, top = ROAD_Y - FEATURE_H * F_SCALE;
    SOUNDS[e]();
    p.fired++; p.last = f;
    if (e === 'wash') burst(x, ROAD_Y - 60, 'bubble', 26, ['#bfe6f5', '#ffffff', '#c3a8f0'], .6);
    if (e === 'bubbles') burst(x, top + 30, 'bubble', 22, ['#bfe6f5', '#ffc4e0', '#c3a8f0'], .7);
    if (e === 'splash') burst(x, ROAD_Y - 8, 'dot', 24, f === 'mud' ? ['#7a4a2a', '#a8743f'] : ['#3d9be0', '#bfe6f5']);
    if (e === 'spray') { burst(x - 70, ROAD_Y - 20, 'dot', 14, ['#3d9be0', '#bfe6f5'], .8); burst(x + 70, ROAD_Y - 20, 'dot', 14, ['#3d9be0', '#bfe6f5'], .8); }
    if (e === 'confetti') burst(x, top + 30, 'rect', 36, CONFETTI);
    if (e === 'sparkle') burst(x, top + 20, 'star', 20, CONFETTI, .8);
    if (e === 'fireworks') for (let i = 0; i < 3; i++) burst(x + (i - 1) * 110, 120 + (i % 2) * 50, 'dot', 26, [CONFETTI[i * 2]!, '#fff6a0'], 1.2);
    if (e === 'turbo') burst(x, ROAD_Y - 10, 'star', 10, ['#2bb673', '#ffd23f'], .6);
    if (!byMachine) return;
    if (e === 'jump') p.ride.jump = .01;
    if (e === 'loop') p.ride.loop = .01;
    if (e === 'bumps') p.ride.bumps = .01;
    if (e === 'turbo') p.ride.turbo = 3;
  }

  // the loop
  useEffect(() => {
    const cv = canvas.current!, c = cv.getContext('2d')!;
    let raf = 0, last = 0;
    const loop = (ms: number) => {
      raf = requestAnimationFrame(loop);
      const dt = last ? Math.min(.05, (ms - last) / 1000) : 0;
      last = ms;
      if (document.hidden) return;
      const box = cv.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1), w = Math.round(box.width * dpr), h = Math.round(box.height * dpr);
      if (!w || !h) return;
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
      step(dt);
      c.setTransform(1, 0, 0, 1, 0, 0);
      draw(c, w, h);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [yard]);

  function step(dt: number) {
    const p = pos.current, r = p.ride, dir = drive.current || (keys.current.has('arrowright') ? 1 : keys.current.has('arrowleft') ? -1 : 0);
    p.t += dt;
    r.turbo = Math.max(0, r.turbo - dt);
    const looping = r.loop > 0;
    if (!looping) p.x = Math.max(20, Math.min(width - 300, p.x + dir * 300 * (r.turbo > 0 ? 2.2 : 1) * dt));
    if (dir) p.flip = dir < 0;
    if (r.jump > 0) { r.jump += dt; if (r.jump > .9) r.jump = 0; }
    if (r.loop > 0) { r.loop += dt; if (r.loop > 1.3) r.loop = 0; }
    if (r.bumps > 0) { r.bumps += dt; if (r.bumps > .8) r.bumps = 0; }
    // driving into a feature works it, once each time he goes through
    const cx = p.x + M_W / 2;
    p.tunnel = false;
    roads.forEach((rd, i) => {
      const near = Math.abs(cx - rd.x) < 50;
      if (near && rd.f === 'tunnel') p.tunnel = true;
      if (near && !p.inside.has(i)) { p.inside.add(i); fire(rd.f, rd.x, true); say(feature(rd.f).line); }
      else if (!near && Math.abs(cx - rd.x) > 90) p.inside.delete(i);
    });
    for (const [k, v] of p.bounce) { if (v > 1.2) p.bounce.delete(k); else p.bounce.set(k, v + dt); }
    for (const [k, v] of p.hop) { if (v > .8) p.hop.delete(k); else p.hop.set(k, v + dt); }
    for (const [k, v] of p.launch) { if (v > 3) p.launch.delete(k); else p.launch.set(k, v + dt); }
    p.honk = Math.max(0, p.honk - dt);
    for (const car of cars.current) {
      const t = TRAFFIC.find(x => x.id === car.id)!;
      car.x += car.dir * t.speed * dt;
      if (car.x > width - 140) car.dir = -1;
      if (car.x < 80) car.dir = 1;
    }
    const ps = particles.current;
    for (const q of ps) { q.t += dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += (q.kind === 'bubble' ? -30 : 320) * dt; q.vx *= 1 - dt; }
    particles.current = ps.filter(q => q.t < q.life);
  }

  function scenery(c: CanvasRenderingContext2D, st: StreetSpan, t: number) {
    const x0 = st.x0, x1 = st.x1, w = x1 - x0, g = T_GROUND - 40;
    c.save();
    c.beginPath(); c.rect(x0, -10, w, T_VIEW_H); c.clip();
    if (st.scene === 'farm') {
      c.fillStyle = '#8fc45a'; for (let x = x0 - 60; x < x1; x += 320) { c.beginPath(); c.ellipse(x + 160, g, 220, 90, 0, Math.PI, 0); c.fill(); }
      c.strokeStyle = '#8a5a2a'; c.lineWidth = 5; c.beginPath(); for (let x = x0; x < x1; x += 40) { c.moveTo(x, g); c.lineTo(x, g - 34); } c.moveTo(x0, g - 26); c.lineTo(x1, g - 26); c.moveTo(x0, g - 12); c.lineTo(x1, g - 12); c.stroke();
      c.font = `40px ${EMOJI}`; c.textAlign = 'center';
      ['🐄', '🐑', '🐖', '🐓'].forEach((e, i) => c.fillText(e, x0 + 260 + i * 380 + Math.sin(t * .6 + i) * 12, g - 40));
    } else if (st.scene === 'fair') {
      const cx = x0 + w * .5, cy = 230, r = 150;
      c.strokeStyle = '#f5b3d0'; c.lineWidth = 8; c.beginPath(); c.arc(cx, cy, r, 0, 7); c.stroke();
      c.lineWidth = 3; c.beginPath(); for (let i = 0; i < 12; i++) { const a = t * .3 + i * Math.PI / 6; c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } c.stroke();
      for (let i = 0; i < 12; i++) { const a = t * .3 + i * Math.PI / 6; c.fillStyle = CONFETTI[i % 6]!; c.fillRect(cx + Math.cos(a) * r - 10, cy + Math.sin(a) * r - 4, 20, 16); }
      c.strokeStyle = '#1d1d1f'; c.lineWidth = 2; c.beginPath(); c.moveTo(x0, 70); for (let x = x0; x < x1; x += 60) c.quadraticCurveTo(x + 30, 100, x + 60, 70); c.stroke();
      for (let x = x0; x < x1; x += 30) { c.fillStyle = CONFETTI[(x / 30) % 6 | 0]!; c.beginPath(); c.moveTo(x, 76 + Math.sin((x - x0) / 60 * Math.PI) * 12); c.lineTo(x + 18, 76 + Math.sin((x - x0) / 60 * Math.PI) * 12); c.lineTo(x + 9, 98); c.fill(); }
    } else if (st.scene === 'beach') {
      c.fillStyle = '#3d9be0'; c.fillRect(x0, g - 110, w, 110);
      c.strokeStyle = '#bfe6f5'; c.lineWidth = 4; c.beginPath();
      for (let row = 0; row < 3; row++) for (let x = x0 - 60 + ((t * 30 + row * 25) % 60); x < x1; x += 60) { c.moveTo(x, g - 90 + row * 30); c.quadraticCurveTo(x + 15, g - 98 + row * 30, x + 30, g - 90 + row * 30); }
      c.stroke();
      c.font = `46px ${EMOJI}`; c.textAlign = 'center';
      c.fillText('⛵', x0 + ((t * 25) % w), g - 80); c.fillText('🏖️', x0 + 120, g - 6); c.fillText('🌞', x1 - 120, 90);
    } else if (st.scene === 'airport') {
      c.fillStyle = '#8a929b'; c.fillRect(x0 + 60, g - 150, 40, 150); c.fillStyle = '#bfe6f5'; c.strokeStyle = '#1d1d1f'; c.lineWidth = 3;
      c.beginPath(); c.roundRect(x0 + 44, g - 190, 72, 44, 6); c.fill(); c.stroke();
      c.fillStyle = '#ff7a1a'; c.beginPath(); c.moveTo(x1 - 80, g - 120); c.lineTo(x1 - 30 - Math.sin(t * 3) * 6, g - 112); c.lineTo(x1 - 80, g - 104); c.fill();
      c.fillStyle = '#1d1d1f'; c.fillRect(x1 - 82, g - 122, 4, 122);
      const k = (t % 9) / 9;
      c.font = `54px ${EMOJI}`; c.textAlign = 'center'; c.fillText('✈️', x0 + k * w, g - 40 - k * k * 360);
    } else if (st.scene === 'snow') {
      c.fillStyle = '#a9b4c8';
      for (let x = x0 - 100; x < x1; x += 300) { c.beginPath(); c.moveTo(x, g); c.lineTo(x + 170, g - 260); c.lineTo(x + 340, g); c.fill(); }
      c.fillStyle = '#fff'; for (let x = x0 - 100; x < x1; x += 300) { c.beginPath(); c.moveTo(x + 120, g - 188); c.lineTo(x + 170, g - 260); c.lineTo(x + 220, g - 188); c.quadraticCurveTo(x + 170, g - 170, x + 120, g - 188); c.fill(); }
      for (let i = 0; i < 40; i++) { const fx = x0 + ((i * 113) % w) + Math.sin(t + i) * 10, fy = ((i * 71 + t * 40) % (g - 20)); c.beginPath(); c.arc(fx, fy, 3, 0, 7); c.fill(); }
    } else if (st.scene === 'dino') {
      const vx = x0 + w * .7;
      c.fillStyle = '#7a4a2a'; c.beginPath(); c.moveTo(vx - 200, g); c.lineTo(vx - 50, g - 230); c.lineTo(vx + 50, g - 230); c.lineTo(vx + 200, g); c.fill();
      c.fillStyle = '#ff7a1a'; c.beginPath(); c.moveTo(vx - 50, g - 230); c.lineTo(vx - 20, g - 180); c.lineTo(vx, g - 215); c.lineTo(vx + 25, g - 170); c.lineTo(vx + 50, g - 230); c.fill();
      for (let i = 0; i < 4; i++) { const k = ((t * .4 + i / 4) % 1); c.fillStyle = `rgba(140,140,140,${.7 - k * .6})`; c.beginPath(); c.arc(vx + Math.sin(k * 6 + i) * 20, g - 250 - k * 180, 20 + k * 30, 0, 7); c.fill(); }
      c.font = `56px ${EMOJI}`; c.textAlign = 'center'; c.fillText('🌴', x0 + 120, g); c.fillText('🌴', x0 + w * .35, g);
      c.fillText('🦕', x0 + w * .5 + Math.sin(t * .5) * 40, g - 10);
    }
    c.restore();
  }

  function draw(c: CanvasRenderingContext2D, cw: number, ch: number) {
    const s = ch / T_VIEW_H, vw = cw / s, p = pos.current;
    const x0 = Math.max(0, Math.min(width - vw, p.x + 80 - vw / 2));
    c.setTransform(s, 0, 0, s, -x0 * s, 0);
    toWorld.current = (px, py) => { const r = canvas.current!.getBoundingClientRect(), k = cw / r.width; return { x: ((px - r.left) * k) / s + x0, y: ((py - r.top) * k) / s }; };
    const seen = (a: number, b: number) => b > x0 - 20 && a < x0 + vw + 20;
    // each street's own sky and grass, and a district's scenery
    for (const st of streets) {
      if (!seen(st.x0, st.x1)) continue;
      c.fillStyle = st.sky; c.fillRect(st.x0, -10, st.x1 - st.x0 + 1, T_VIEW_H);
      if (st.owned && st.scene) scenery(c, st, p.t);
      c.fillStyle = st.ground; c.fillRect(st.x0, T_GROUND - 40, st.x1 - st.x0 + 1, 40);
    }
    c.fillStyle = '#9fd8f5'; c.fillRect(-10, -10, 70, T_VIEW_H); c.fillRect(width - 130, -10, 140, T_VIEW_H);
    const rocket = streets.find(st => st.id === 'rocket' && st.owned);
    if (rocket) { c.fillStyle = '#fff'; for (let i = 0; i < 30; i++) c.fillRect(rocket.x0 + ((i * 97) % (rocket.x1 - rocket.x0)), 20 + ((i * 53) % 200), 3, 3); }
    // the road
    c.fillStyle = '#c9c3b8'; c.fillRect(x0 - 10, T_GROUND, vw + 20, 22);
    c.fillStyle = '#4a4d52'; c.fillRect(x0 - 10, T_GROUND + 22, vw + 20, T_VIEW_H);
    c.strokeStyle = '#ffd23f'; c.lineWidth = 5; c.setLineDash([30, 22]); c.beginPath(); c.moveTo(x0 - 10, T_GROUND + 75); c.lineTo(x0 + vw + 10, T_GROUND + 75); c.stroke(); c.setLineDash([]);
    c.strokeStyle = '#1d1d1f'; c.lineWidth = 4; c.beginPath(); c.moveTo(x0 - 10, T_GROUND); c.lineTo(x0 + vw + 10, T_GROUND); c.stroke();
    // street signs and the fence round the street for sale
    for (const st of streets) {
      if (!seen(st.x0, st.x1)) continue;
      const sx = st.x0 + 70;
      c.fillStyle = '#1d1d1f'; c.fillRect(sx - 3, T_GROUND - 120, 6, 120);
      c.fillStyle = st.owned ? '#2f8a4a' : '#8a929b'; c.strokeStyle = '#1d1d1f'; c.lineWidth = 3;
      c.beginPath(); c.roundRect(sx - 64, T_GROUND - 150, 128, 36, 6); c.fill(); c.stroke();
      c.fillStyle = '#fff'; c.font = '900 17px Nunito, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(st.name, sx, T_GROUND - 131);
      if (!st.owned) {
        const fx = st.x0 + STREET_PAD;
        c.fillStyle = '#ffd23f'; c.fillRect(fx, T_GROUND - 70, st.x1 - fx, 40);
        c.fillStyle = '#1d1d1f'; for (let x = fx; x < st.x1 - 20; x += 36) { c.beginPath(); c.moveTo(x, T_GROUND - 30); c.lineTo(x + 18, T_GROUND - 70); c.lineTo(x + 30, T_GROUND - 70); c.lineTo(x + 12, T_GROUND - 30); c.fill(); }
        c.strokeRect(fx, T_GROUND - 70, st.x1 - fx, 40);
        c.fillStyle = '#fff'; c.beginPath(); c.roundRect(fx + LOT_GAP - 80, T_GROUND - 160, 160, 64, 10); c.fill(); c.stroke();
        c.fillStyle = '#1d1d1f'; c.font = '900 22px Nunito, sans-serif'; c.fillText('For sale', fx + LOT_GAP, T_GROUND - 140);
        c.fillText(`${st.price}`, fx + LOT_GAP - 12, T_GROUND - 114); drawBolt(c, fx + LOT_GAP + 22, T_GROUND - 114, 11);
      }
    }
    c.textBaseline = 'alphabetic';
    // the lots and the buildings on them
    for (const lot of lots) {
      if (!seen(lot.x - LOT_W, lot.x + LOT_W)) continue;
      const l = yard.town[lot.i];
      if (!l) { c.font = `44px ${EMOJI}`; c.textAlign = 'center'; c.fillText('🚧', lot.x, T_GROUND - 6); continue; }
      const { svg, h } = buildingSvg(l.b, l.gold);
      const b = p.bounce.get(lot.i), k = b === undefined ? 1 : 1 + Math.sin(Math.min(1, b) * Math.PI * 3) * .06 * (1 - Math.min(1, b));
      const dw = (LOT_W + 20) * k, dh = (h + 16) * k;
      drawSvg(c, svg, lot.x - dw / 2, T_GROUND - dh, dw, dh);
      if (l.gold && Math.floor(p.t * 2 + lot.i) % 3 === 0) { c.fillStyle = '#fff6a0'; c.beginPath(); c.arc(lot.x + 60, T_GROUND - h * .7, 5, 0, 7); c.fill(); }
    }
    // decorations: along the pavement, or up in the sky; a tapped one hops, a tapped rocket takes off
    c.textAlign = 'center';
    decos.forEach((d, j) => {
      const { x, y, size } = decoAt(j);
      if (!seen(x - 60, x + 60)) return;
      const hop = p.hop.get(j), up = hop === undefined ? 0 : Math.sin(Math.min(1, hop / .8) * Math.PI) * 40;
      const fly = p.launch.get(j), lift = fly === undefined ? 0 : fly < 1.5 ? fly * fly * 300 : Math.max(0, (3 - fly) * 450);
      c.font = `${size}px ${EMOJI}`;
      c.fillText(d.icon, x, y - up - lift);
    });
    // the features on the road behind him, and his traffic in the far lane
    for (const rd of roads) if (!IN_FRONT.has(rd.f) && seen(rd.x - 120, rd.x + 120)) drawFeature(c, rd.f, rd.x);
    c.font = `46px ${EMOJI}`;
    for (const car of cars.current) {
      if (!seen(car.x - 40, car.x + 40)) continue;
      const t = TRAFFIC.find(x => x.id === car.id)!;
      c.save(); c.translate(car.x, TRAFFIC_Y + Math.abs(Math.sin(p.t * 8 + car.x)) * 2);
      if (car.dir !== t.faces) c.scale(-1, 1);
      c.fillText(t.icon, 0, 0);
      c.restore();
    }
    // his machine on the road, jumping, looping or bumping when a feature makes it
    const m = mine.includes(yard.machine) ? yard.machine : 'crane', r = p.ride;
    const bob = Math.abs(Math.sin(p.t * 10)) * (drive.current || keys.current.size ? 2 : 0);
    const jump = r.jump > 0 ? Math.sin((r.jump / .9) * Math.PI) * 110 : 0, bumps = r.bumps > 0 ? Math.abs(Math.sin(r.bumps * 24)) * 10 : 0;
    if (r.loop > 0) {
      const a = Math.min(1, r.loop / 1.2) * Math.PI * 2, R = 70 * F_SCALE, cx = p.x + M_W / 2, cy = ROAD_Y - R;
      c.save(); c.translate(cx + Math.sin(a) * R * .3, cy + Math.cos(a) * R); c.rotate(-a);
      drawMachine(c, m, lookOf(yard, m), -M_W / 2, 0, M_SCALE_T, true, false);
      c.restore();
    } else drawMachine(c, m, lookOf(yard, m), p.x, ROAD_Y - bob - jump - bumps, M_SCALE_T, true, p.flip);
    if (r.turbo > 0) { c.strokeStyle = '#ffd23f'; c.lineWidth = 5; for (let i = 0; i < 3; i++) { const sx = p.flip ? p.x + M_W + 10 : p.x - 10; c.beginPath(); c.moveTo(sx, ROAD_Y - 30 - i * 20); c.lineTo(sx + (p.flip ? 40 : -40), ROAD_Y - 30 - i * 20); c.stroke(); } }
    for (const rd of roads) if (IN_FRONT.has(rd.f) && seen(rd.x - 120, rd.x + 120)) drawFeature(c, rd.f, rd.x);
    // bubbles, splashes, confetti and sparks
    for (const q of particles.current) {
      const a = Math.max(0, 1 - q.t / q.life);
      c.globalAlpha = a; c.fillStyle = q.color;
      if (q.kind === 'bubble') { c.strokeStyle = '#1d1d1f'; c.lineWidth = 1.5; c.beginPath(); c.arc(q.x, q.y, 9, 0, 7); c.fill(); c.stroke(); }
      else if (q.kind === 'rect') c.fillRect(q.x, q.y, 9, 6);
      else if (q.kind === 'star') { c.beginPath(); for (let i = 0; i < 8; i++) { const ang = i * Math.PI / 4, rr = i % 2 ? 4 : 10; c.lineTo(q.x + Math.cos(ang) * rr, q.y + Math.sin(ang) * rr); } c.fill(); }
      else { c.beginPath(); c.arc(q.x, q.y, 5, 0, 7); c.fill(); }
    }
    c.globalAlpha = 1;
    if (p.honk > 0) { c.font = '900 34px Nunito, sans-serif'; c.fillStyle = '#1d1d1f'; c.fillText('HONK!', p.x + (p.flip ? -10 : 170), T_GROUND - 50 - (1 - p.honk) * 30); }
  }
  function drawFeature(c: CanvasRenderingContext2D, f: FeatureId, x: number) {
    const k = F_SCALE;
    drawSvg(c, featureSvg(f), x + (FEATURE_VIEW.x - FEATURE_W / 2) * k, ROAD_Y + (FEATURE_VIEW.y - FEATURE_H) * k, FEATURE_VIEW.w * k, FEATURE_VIEW.h * k);
  }
  /** Where the j-th decoration stands: by the lots, along the pavement or in the sky. */
  function decoAt(j: number) {
    const d = decos[j]!, spots = Math.max(1, lots.length), at = lots[j % spots], sky = isSkyDeco(d), t = pos.current.t;
    const x = (at?.x ?? 300) + LOT_GAP / 2 - 6 + Math.floor(j / spots) * 30;
    return { x: x + (sky ? Math.sin(t + j) * 30 : 0), y: sky ? 110 + (j % 3) * 40 : T_GROUND + 14, size: sky ? 60 : 48, sky };
  }

  function honk() {
    if (!voice.active) return;
    playHorn(yard.horn); pos.current.honk = 1;
    if (yard.horn === 'honk') say('Honk honk!');
  }
  function tap(e: PointerEvent) {
    if (!voice.active) return;
    const w = toWorld.current(e.clientX, e.clientY), p = pos.current;
    // a decoration (in front of the far lane): it hops (a rocket takes off) and says its name
    const j = decos.findIndex((_, i) => { const d = decoAt(i); return Math.abs(d.x - w.x) < d.size * .5 && Math.abs(d.y - d.size * .35 - w.y) < d.size * .5; });
    if (j >= 0) {
      const d = decos[j]!;
      p.tapped = `deco:${d.id}`;
      if (d.id === 'rocket') { p.launch.set(j, 0); sWhoosh(1); } else { p.hop.set(j, 0); sBoing(); }
      if (d.id === 'fireworks') { const at = decoAt(j); for (let i = 0; i < 3; i++) burst(at.x + (i - 1) * 90, 100 + i * 30, 'dot', 22, [CONFETTI[i]!, '#fff6a0'], 1.2); SOUNDS.fireworks(); }
      say(d.name);
      return;
    }
    // a car in the far lane: it honks and says its name
    const car = cars.current.find(cc => Math.abs(cc.x - w.x) < 40 && Math.abs(w.y - (TRAFFIC_Y - 16)) < 36);
    if (car) { const t = TRAFFIC.find(x => x.id === car.id)!; tone(700, .15, 'square', 0, .1); tone(700, .15, 'square', .2, .1); p.tapped = `car:${car.id}`; say(t.name); return; }
    // a feature on the road (below the pavement, so a building above it still takes its own taps): it goes off
    const rd = roads.find(r => Math.abs(r.x - w.x) < FEATURE_W * F_SCALE / 2 && w.y > T_GROUND - 20 && w.y < ROAD_Y + 20);
    if (rd) { fire(rd.f, rd.x, false); p.tapped = `feature:${rd.f}`; say(feature(rd.f).name, feature(rd.f).line); return; }
    const lot = lots.find(l => Math.abs(l.x - w.x) < LOT_GAP / 2 && w.y < T_GROUND + 10);
    if (lot) {
      const l = yard.town[lot.i];
      if (l) { sPop(); p.bounce.set(lot.i, 0); say(building(l.b).name); }
      else { sChime(); say('Do a Job to build here!'); }
      return;
    }
    const st = streets.find(s => !s.owned && w.x > s.x0 && w.x < s.x1);
    if (st) say('This street is for sale!', 'It costs', `${Math.min(st.price, NUMBERS_TO)}` as Phrase, 'Bolts.');
  }
  function nextMachine() {
    if (!voice.active || mine.length < 2) return;
    const m = mine[(mine.indexOf(yard.machine) + 1) % mine.length]!;
    updateYard(y => ({ ...y, machine: m }));
    sPop(); say(MACHINES.find(x => x.id === m)!.name);
    redraw(n => n + 1);
  }
  const hold = (dir: -1 | 1) => ({
    onPointerDown: (e: PointerEvent) => { e.preventDefault(); (e.currentTarget as Element).setPointerCapture(e.pointerId); drive.current = dir; },
    onPointerUp: () => { drive.current = 0; }, onPointerCancel: () => { drive.current = 0; }, onLostPointerCapture: () => { drive.current = 0; },
  });
  const next = mine.length > 1 ? mine[(mine.indexOf(yard.machine) + 1) % mine.length]! : null;

  return (
    <div class="town-screen">
      <canvas ref={canvas} class="town-canvas" aria-label="Your Town" onPointerDown={tap} />
      <header class="job-hud">
        <IconButton label="Home" onClick={() => { if (voice.active) screen.value = 'home'; }}>🏠</IconButton>
        <span class="job-title">Town</span>
        <CurrencyPile kind={WRECKERS_CURRENCY} count={player.state.value.currency.balance} />
      </header>
      <div class="town-side">
        {next && <button class="town-swap" aria-label="Switch machine" onPointerDown={e => { e.preventDefault(); nextMachine(); }}><MachineView id={next} label={null} /><span aria-hidden="true">🔄</span></button>}
        <button class="town-swap yard-go" aria-label="Yard" onPointerDown={e => { e.preventDefault(); if (voice.active) { eatNextClick(); screen.value = 'yard'; } }}><span aria-hidden="true">🚜</span></button>
        {yard.jobs > 0 && <button class="town-swap job-go" aria-label="Job" onPointerDown={e => { e.preventDefault(); if (voice.active) { eatNextClick(); goJob(); } }}><span aria-hidden="true">🏗️</span><b>{yard.jobs}</b></button>}
      </div>
      <div class="job-ctl left"><button class="ctl back" aria-label="Drive back" {...hold(-1)}>◀</button></div>
      <div class="job-ctl right town-right">
        <button class="ctl honk" aria-label="Honk" onPointerDown={e => { e.preventDefault(); honk(); }}>📯</button>
        <button class="ctl fwd" aria-label="Drive" {...hold(1)}>▶</button>
      </div>
    </div>
  );
}
