// Draws a fight on a 2D canvas: the arena, its hazards, the robots, and everything that makes a hit feel like one (sparks, a shake, the
// number flying off). It reads the sim and never changes it. Effects live here, so losing a frame loses nothing that matters.
import { drawBot } from '../bot/draw';
import type { Mount } from '../bot/parts';
import { ARENA, sawAt, ventState, WALL, type ArenaDef, type Ev, type Fight, type Fighter } from './sim';

const O = '#10151f', TAU = Math.PI * 2;
interface Spark { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; color: string; drag: number }
interface Label { x: number; y: number; text: string; life: number; color: string; size: number }

function floorOf(a: ArenaDef) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = ARENA;
  const c = canvas.getContext('2d')!;
  c.fillStyle = a.floor; c.fillRect(0, 0, ARENA, ARENA);
  c.strokeStyle = a.line; c.lineWidth = 5; // the floor's steel plates
  for (let i = 0; i <= 5; i++) { const p = WALL + (i * (ARENA - WALL * 2)) / 5; c.beginPath(); c.moveTo(p, 0); c.lineTo(p, ARENA); c.moveTo(0, p); c.lineTo(ARENA, p); c.stroke(); }
  c.fillStyle = '#00000022';
  const plate = (ARENA - WALL * 2) / 5;
  for (let x = 0; x < 5; x++) for (let y = 0; y < 5; y++) for (const [dx, dy] of [[12, 12], [plate - 12, 12], [12, plate - 12], [plate - 12, plate - 12]] as const) { c.beginPath(); c.arc(WALL + x * plate + dx, WALL + y * plate + dy, 4, 0, TAU); c.fill(); }
  // the wall: hazard stripes, with spikes in arenas that have them
  c.fillStyle = '#1b2530'; c.fillRect(0, 0, ARENA, WALL); c.fillRect(0, ARENA - WALL, ARENA, WALL); c.fillRect(0, 0, WALL, ARENA); c.fillRect(ARENA - WALL, 0, WALL, ARENA);
  const stripe = (x: number, y: number, w: number, h: number) => { c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); c.fillStyle = '#ffd23f'; c.fillRect(x, y, w, h); c.fillStyle = '#10151f'; for (let i = -ARENA; i < ARENA * 2; i += 64) { c.beginPath(); c.moveTo(i, y); c.lineTo(i + 32, y); c.lineTo(i + 32 + (h > w ? ARENA : h), y + (h > w ? ARENA : h)); c.lineTo(i + (h > w ? ARENA : h), y + (h > w ? ARENA : h)); c.closePath(); c.fill(); } c.restore(); };
  stripe(0, WALL - 12, ARENA, 12); stripe(0, ARENA - WALL, ARENA, 12); stripe(WALL - 12, 0, 12, ARENA); stripe(ARENA - WALL, 0, 12, ARENA);
  if (a.spikes) {
    c.fillStyle = '#dfe5ea'; c.strokeStyle = O; c.lineWidth = 3;
    const tri = (x: number, y: number, dx: number, dy: number) => { c.beginPath(); c.moveTo(x - dy * 13, y - dx * 13); c.lineTo(x + dx * 22, y + dy * 22); c.lineTo(x + dy * 13, y + dx * 13); c.closePath(); c.fill(); c.stroke(); };
    for (let p = 60; p < ARENA - 40; p += 54) { tri(p, WALL, 0, 1); tri(p, ARENA - WALL, 0, -1); tri(WALL, p, 1, 0); tri(ARENA - WALL, p, -1, 0); }
  }
  return canvas;
}

export function createStage(canvas: HTMLCanvasElement, reducedMotion: boolean) {
  const c = canvas.getContext('2d')!;
  let floor: HTMLCanvasElement | null = null, sparks: Spark[] = [], labels: Label[] = [], shake = 0, last = 0, smokeAt = 0;

  const burst = (x: number, y: number, n: number, color: string, speed: number, size = 7) => {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, v = speed * (.3 + Math.random() * .7), life = .22 + Math.random() * .34;
      sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life, max: life, size: size * (.5 + Math.random() * .7), color, drag: 3 });
    }
  };
  const say = (x: number, y: number, text: string, color = '#fff', size = 46) => labels.push({ x, y: y - 40, text, life: .85, color, size });

  function take(ev: Ev, s: Fight) {
    switch (ev.t) {
      case 'hit': {
        const big = ev.big;
        burst(ev.x, ev.y, ev.blocked ? 8 : big ? 26 : 9, ev.blocked ? '#9fe2ff' : big ? '#ffd23f' : '#ffb02e', big ? 720 : 380);
        if (ev.by !== 'saw' || big) say(ev.x, ev.y, ev.blocked ? `${ev.dmg}` : `${ev.dmg}`, ev.blocked ? '#9fe2ff' : ev.on === 1 ? '#ffd23f' : '#ff8b7a', big ? 66 : 44);
        shake = Math.min(26, shake + (big ? 16 : ev.dmg > 5 ? 5 : 1));
        break;
      }
      case 'bolt': burst(ev.x, ev.y, 10, '#ffd23f', 300); say(ev.x, ev.y, '+1', '#ffd23f', 44); break;
      case 'heal': burst(ev.x, ev.y, 18, '#55e08a', 320); say(ev.x, ev.y, '+', '#55e08a', 70); break;
      case 'land': burst(ev.x, ev.y, 10, '#c9d3db', 300, 11); shake = Math.min(26, shake + 9); break;
      case 'pit': { const f = s.bots[ev.on]; burst(f.x, f.y, 22, '#8fa3b5', 420, 10); break; }
      case 'boost': { const f = s.bots[ev.on]; burst(f.x, f.y, 10, '#ff9a1e', 320); break; }
      case 'ko': { const f = s.bots[ev.on]; burst(f.x, f.y, 60, '#ffd23f', 900, 9); burst(f.x, f.y, 26, '#ffffff', 600, 7); shake = 34; break; }
      case 'swing': if (ev.kind === 'hammer') burst(ev.x, ev.y, 5, '#c9d3db', 220, 8); break;
      default: break;
    }
  }

  function drawHazards(s: Fight) {
    for (const h of s.arena.hazards) {
      if (h.kind === 'pit') {
        c.beginPath(); c.arc(h.x, h.y, h.r + 14, 0, TAU); c.fillStyle = '#ffd23f'; c.fill(); c.lineWidth = 6; c.strokeStyle = O; c.stroke();
        c.beginPath(); c.arc(h.x, h.y, h.r, 0, TAU); c.fillStyle = '#05080c'; c.fill();
        c.beginPath(); c.arc(h.x, h.y, h.r * .62, 0, TAU); c.fillStyle = '#000'; c.fill();
      } else if (h.kind === 'vent') {
        const on = ventState(h, s.t);
        c.beginPath(); c.arc(h.x, h.y, h.r, 0, TAU); c.fillStyle = on === 'on' ? '#ff5a10' : on === 'warn' ? '#a8461c' : '#2a2f36'; c.fill(); c.lineWidth = 6; c.strokeStyle = O; c.stroke();
        c.strokeStyle = O; c.lineWidth = 7; for (const d of [-40, -14, 14, 40]) { c.beginPath(); const half = Math.sqrt(Math.max(0, h.r * h.r - d * d)) - 6; c.moveTo(h.x + d, h.y - half); c.lineTo(h.x + d, h.y + half); c.stroke(); }
        if (on === 'on') for (let i = 0; i < 2; i++) {
          const a = Math.random() * TAU, r = Math.random() * h.r * .8, life = .3 + Math.random() * .3;
          sparks.push({ x: h.x + Math.cos(a) * r, y: h.y + Math.sin(a) * r, vx: 0, vy: -130 - Math.random() * 120, life, max: life, size: 16 + Math.random() * 18, color: Math.random() < .5 ? '#ffb02e' : '#ff5a10', drag: 1 });
        }
      } else {
        const p = sawAt(h, s.t);
        c.save(); c.translate(p.x, p.y); c.rotate(s.t * 14);
        c.beginPath(); for (let i = 0; i < 14; i++) { const a = (i / 14) * TAU; c.lineTo(Math.cos(a) * h.r, Math.sin(a) * h.r); c.lineTo(Math.cos(a + .12) * (h.r + 14), Math.sin(a + .12) * (h.r + 14)); c.lineTo(Math.cos(a + .26) * h.r, Math.sin(a + .26) * h.r); } c.closePath();
        c.fillStyle = '#dfe5ea'; c.fill(); c.lineWidth = 5; c.strokeStyle = O; c.stroke();
        c.beginPath(); c.arc(0, 0, h.r * .3, 0, TAU); c.fillStyle = '#e13a2c'; c.fill(); c.stroke();
        c.restore();
      }
    }
  }

  function drawPickups(s: Fight) {
    for (const p of s.pickups) {
      const bob = 1 + Math.sin((s.t - p.born) * 6) * .08;
      c.save(); c.translate(p.x, p.y); c.scale(bob, bob);
      c.beginPath(); c.ellipse(5, 9, 28, 24, 0, 0, TAU); c.fillStyle = '#00000044'; c.fill();
      if (p.kind === 'bolt') {
        c.beginPath(); for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; c.lineTo(Math.cos(a) * 25, Math.sin(a) * 25); } c.closePath();
        c.fillStyle = '#ffd23f'; c.fill(); c.lineWidth = 5; c.strokeStyle = O; c.stroke();
        c.beginPath(); c.arc(0, 0, 9, 0, TAU); c.fillStyle = '#a8761a'; c.fill(); c.lineWidth = 4; c.stroke();
      } else {
        c.beginPath(); c.roundRect(-30, -30, 60, 60, 9); c.fillStyle = '#e9edf1'; c.fill(); c.lineWidth = 5; c.strokeStyle = O; c.stroke();
        c.fillStyle = '#17a457'; c.fillRect(-7, -20, 14, 40); c.fillRect(-20, -7, 40, 14);
      }
      c.restore();
    }
  }

  function drawFighter(f: Fighter, s: Fight, t: number, marker: boolean) {
    const up = f.air > 0 ? Math.sin(Math.min(1, f.air / .95) * Math.PI) : 0;
    const swing: Partial<Record<Mount, number>> = {};
    f.fitted.forEach(a => { swing[a.mount] = a.swing; });
    c.save();
    c.translate(f.x + up * 26, f.y + up * 34); // its shadow slides away as it leaves the floor
    c.beginPath(); c.ellipse(7, 12, f.stats.radius * (1.12 - up * .3), f.stats.radius * (1 - up * .3), 0, 0, TAU); c.fillStyle = '#00000050'; c.fill();
    c.restore();
    c.save();
    c.translate(f.x, f.y);
    if (marker) { c.save(); c.rotate(f.a); c.beginPath(); c.arc(0, 0, f.stats.radius * 1.42, -.42, .42); c.lineWidth = 7; c.strokeStyle = '#ffd23f'; c.stroke(); c.restore(); }
    c.scale(1 + up * .55, 1 + up * .55);
    c.rotate(f.a);
    if (f.safe > 0 && Math.floor(t * 12) % 2) c.globalAlpha = .45;
    drawBot(c, f.build, { spin: t, swing, flash: f.flash > .08, out: f.hp <= 0, hurt: f.hp < f.maxHp * .3, rolling: f.drove / 200 });
    c.restore();
    if (f.stun > .08 && f.hp > 0) { // the stars of a robot that's seeing them
      for (let i = 0; i < 3; i++) { const a = t * 6 + (i * TAU) / 3, x = f.x + Math.cos(a) * f.stats.radius * .9, y = f.y + Math.sin(a) * f.stats.radius * .5 - f.stats.radius * .4; c.beginPath(); for (let k = 0; k < 10; k++) { const r = k % 2 ? 5 : 12, b = (k / 10) * TAU; c.lineTo(x + Math.cos(b) * r, y + Math.sin(b) * r); } c.closePath(); c.fillStyle = '#ffd23f'; c.fill(); c.lineWidth = 2.5; c.strokeStyle = O; c.stroke(); }
    }
    if (f.boost > 0) burst(f.x - Math.cos(f.a) * f.stats.radius, f.y - Math.sin(f.a) * f.stats.radius, 2, '#ff9a1e', 180, 12);
    if (f.hp > 0 && f.hp < f.maxHp * .3 && t > smokeAt) { smokeAt = t + .12; const life = .7; sparks.push({ x: f.x, y: f.y, vx: 10, vy: -90, life, max: life, size: 22, color: '#2a3040aa', drag: .5 }); }
    if (f.power > 0) { c.beginPath(); c.arc(f.x, f.y, f.stats.radius * 1.3 + Math.sin(t * 30) * 4, 0, TAU); c.lineWidth = 5; c.strokeStyle = '#fff36b'; c.stroke(); }
    void s;
  }

  return {
    frame(s: Fight, now: number) {
      const box = canvas.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1), size = Math.round(Math.min(box.width, box.height) * dpr);
      if (!size) return;
      if (canvas.width !== size) { canvas.width = canvas.height = size; }
      floor ??= floorOf(s.arena);
      const dt = Math.min(.05, last ? now - last : 0);
      last = now;
      for (const ev of s.events) take(ev, s);
      s.events.length = 0;
      const k = size / ARENA;
      c.setTransform(k, 0, 0, k, 0, 0);
      c.clearRect(0, 0, ARENA, ARENA);
      c.save();
      if (shake > .5 && !reducedMotion) c.translate((Math.random() - .5) * shake, (Math.random() - .5) * shake);
      shake *= Math.exp(-9 * dt);
      c.drawImage(floor, 0, 0);
      drawHazards(s);
      drawPickups(s);
      const [you, foe] = s.bots;
      for (const f of [you, foe].sort((a, b) => a.air - b.air)) drawFighter(f, s, now, f === you);
      sparks = sparks.filter(p => (p.life -= dt) > 0);
      for (const p of sparks) {
        p.x += p.vx * dt; p.y += p.vy * dt; const d = Math.exp(-p.drag * dt); p.vx *= d; p.vy *= d;
        c.globalAlpha = Math.min(1, (p.life / p.max) * 1.6);
        c.fillStyle = p.color;
        c.beginPath(); c.arc(p.x, p.y, p.size * (p.life / p.max * .6 + .4), 0, TAU); c.fill();
      }
      c.globalAlpha = 1;
      labels = labels.filter(l => (l.life -= dt) > 0);
      c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
      for (const l of labels) {
        l.y -= 90 * dt;
        c.globalAlpha = Math.min(1, l.life * 3);
        c.font = `400 ${l.size}px Bungee, Nunito, sans-serif`;
        c.lineWidth = 11; c.strokeStyle = O; c.strokeText(l.text, l.x, l.y);
        c.fillStyle = l.color; c.fillText(l.text, l.x, l.y);
      }
      c.globalAlpha = 1;
      c.restore();
    },
  };
}
