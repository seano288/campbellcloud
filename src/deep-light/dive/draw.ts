// Drawing the Dive. The sea, its floor and the animals are drawn first; then the dark, as ONE fill over the whole screen with the
// headlight's cone cut out of it (an even-odd path) and a soft gradient inside the cone's far end. That was the fastest of the three
// ways measured for an iPad 9 (.scratch/deep-light/spec.md, "Drawing the dark"): an offscreen dark layer with the cone erased and
// drawn over the sea cost a frame and a half at full size, and a quarter-size one scaled up cost three, while this costs a fraction
// of a millisecond. After the dark come the things that shine by themselves, added on top: animals' own light, his submarine and its
// headlight, the glow stripes, the crystals, the sonar ring and the outlines it draws, and the photo rings.
//
// Each animal is drawn once into a small picture (a sprite) at the size it needs, and stamped every frame.
import { seeded } from '../../game/rng';
import { CREATURE_BOX, drawCreature, glowAt } from '../art/creatures';
import { drawSub } from '../art/sub';
import type { SubLook } from '../dock/dock';
import { zone as zoneOf } from '../sea/zones';
import { FLASH_S, OUTLINE_S, WORLD, type DiveState, type Swimmer } from './sim';

type C = CanvasRenderingContext2D;
/** Dev only, for tools/deep-light/perf.ts: ?skip=water,dark,lighter,sub,scenery,animals,motes leaves those out, to find what costs. */
const SKIP: string = import.meta.env?.DEV && typeof location !== 'undefined' ? new URLSearchParams(location.search).get('skip') ?? '' : '';
const skip = (part: string) => SKIP.includes(part);
/** How big his submarine is in the sea (its drawing is about 260 units wide). */
export const SUB_SCALE = 0.62;
/** How big an animal of size 1 is (its drawing is about 100 units wide). */
const ANIMAL_SCALE = 0.9;

export interface View { k: number; ox: number; oy: number; w: number; h: number }
/** How the sea maps onto the screen: the camera follows the submarine, kept inside the sea. Sizes in device pixels. */
export function viewOf(s: Pick<DiveState, 'sub'>, w: number, h: number, dpr: number): View {
  const css = Math.min(w, h) / dpr, k = Math.max(0.5, Math.min(1.3, css / 620)) * dpr;
  const half = { x: w / 2 / k, y: h / 2 / k };
  const cx = WORLD.w <= half.x * 2 ? WORLD.w / 2 : Math.max(half.x, Math.min(WORLD.w - half.x, s.sub.x));
  const cy = Math.max(Math.min(half.y, WORLD.top + 40), Math.min(WORLD.h - half.y, s.sub.y));
  return { k, ox: w / 2 - cx * k, oy: h / 2 - cy * k, w, h };
}
export const toScreen = (v: View, x: number, y: number) => ({ x: v.ox + x * v.k, y: v.oy + y * v.k });
export const toWorld = (v: View, px: number, py: number) => ({ x: (px - v.ox) / v.k, y: (py - v.oy) / v.k });

// ---------- sprites ----------

export interface Sprites { body: Map<string, HTMLCanvasElement>; outline: Map<string, HTMLCanvasElement>; glow: Map<string, HTMLCanvasElement>; k: number }
function canvas(w: number, h: number) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }
export function makeSprites(s: DiveState, k: number): Sprites {
  const out: Sprites = { body: new Map(), outline: new Map(), glow: new Map(), k };
  for (const m of s.animals) {
    const kk = k * ANIMAL_SCALE * m.a.size, c = canvas(CREATURE_BOX.w * kk, CREATURE_BOX.h * kk), ctx = c.getContext('2d')!;
    ctx.translate(c.width / 2, c.height / 2); ctx.scale(kk, kk); drawCreature(ctx, m.a, 0.3);
    out.body.set(m.a.id, c);
    // the sonar's outline: the animal's shape, filled sea-green
    const o = canvas(c.width, c.height), octx = o.getContext('2d')!;
    octx.drawImage(c, 0, 0); octx.globalCompositeOperation = 'source-in'; octx.fillStyle = '#5affd0'; octx.fillRect(0, 0, o.width, o.height);
    out.outline.set(m.a.id, o);
    if (m.a.glow && !out.glow.has(m.a.glow)) {
      const g = canvas(64, 64), gctx = g.getContext('2d')!, rg = gctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      rg.addColorStop(0, '#ffffff'); rg.addColorStop(0.18, m.a.glow); rg.addColorStop(0.5, m.a.glow + '66'); rg.addColorStop(1, m.a.glow + '00');
      gctx.fillStyle = rg; gctx.fillRect(0, 0, 64, 64);
      out.glow.set(m.a.glow, g);
    }
  }
  return out;
}

// ---------- the sea's scenery, made once per Dive ----------

export interface Scenery { rocks: { x: number; w: number; h: number; c: string }[]; weeds: { x: number; h: number; c: string }[]; motes: { x: number; y: number; z: number }[]; seed: number }
export function makeScenery(s: DiveState): Scenery {
  const rng = seeded(s.zone.length * 97 + 5), z = s.zone;
  const coral = ['#ff7a9a', '#ffb02e', '#9a5aff', '#ff5a5a', '#5af0d0'];
  return {
    rocks: Array.from({ length: 14 }, (_, i) => ({ x: i * 180 + rng() * 120, w: 60 + rng() * 120, h: 30 + rng() * 70, c: z === 'reef' ? coral[i % coral.length]! : z === 'vents' ? '#3a1c14' : z === 'ice' ? '#3a5068' : '#2a3040' })),
    weeds: Array.from({ length: z === 'reef' ? 22 : z === 'wreck' || z === 'twilight' ? 10 : 0 }, () => ({ x: rng() * WORLD.w, h: 80 + rng() * 140, c: z === 'reef' ? '#3aa860' : '#2a6a48' })),
    motes: Array.from({ length: 46 }, () => ({ x: rng(), y: rng(), z: 0.3 + rng() * 0.7 })),
    seed: rng(),
  };
}

function drawScenery(ctx: C, s: DiveState, sc: Scenery, t: number) {
  const z = zoneOf(s.zone);
  // the floor
  ctx.fillStyle = z.floor;
  ctx.beginPath(); ctx.moveTo(-50, WORLD.h + 50);
  for (let x = -50; x <= WORLD.w + 50; x += 100) ctx.lineTo(x, WORLD.floor + Math.sin(x * 0.013 + sc.seed * 9) * 12);
  ctx.lineTo(WORLD.w + 50, WORLD.h + 50); ctx.closePath(); ctx.fill();
  ctx.lineWidth = 4; ctx.strokeStyle = '#00000055'; ctx.stroke();
  // sea weed swaying
  for (const w of sc.weeds) {
    ctx.beginPath(); ctx.moveTo(w.x, WORLD.floor + 6);
    ctx.quadraticCurveTo(w.x + Math.sin(t + w.x) * 24, WORLD.floor - w.h / 2, w.x + Math.sin(t * 0.8 + w.x) * 30, WORLD.floor - w.h);
    ctx.lineWidth = 10; ctx.strokeStyle = w.c; ctx.lineCap = 'round'; ctx.stroke();
  }
  // rocks and coral
  for (const r of sc.rocks) {
    ctx.beginPath(); ctx.ellipse(r.x, WORLD.floor, r.w / 2, r.h, 0, Math.PI, 0); ctx.fillStyle = r.c; ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = '#141414'; ctx.stroke();
  }
  if (s.zone === 'wreck') { // the shipwreck: a broken hull lying on its side, a mast leaning
    ctx.save(); ctx.translate(1300, WORLD.floor - 40); ctx.rotate(-0.12);
    ctx.beginPath(); ctx.moveTo(-380, -60); ctx.lineTo(320, -80); ctx.lineTo(260, 60); ctx.lineTo(-300, 70); ctx.closePath();
    ctx.fillStyle = '#5a3a24'; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = '#141414'; ctx.stroke();
    for (let x = -300; x < 260; x += 70) { ctx.beginPath(); ctx.arc(x, -10, 14, 0, 7); ctx.fillStyle = '#1a1410'; ctx.fill(); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(-40, -70); ctx.lineTo(60, -420); ctx.lineWidth = 16; ctx.stroke(); ctx.lineWidth = 10; ctx.strokeStyle = '#6a4a30'; ctx.stroke();
    ctx.restore();
  }
  if (s.zone === 'vents') { // chimneys on the floor, hot water rising out of them
    for (const x of [380, 980, 1600, 2150]) {
      ctx.beginPath(); ctx.moveTo(x - 50, WORLD.floor + 4); ctx.lineTo(x - 20, WORLD.floor - 200); ctx.lineTo(x + 20, WORLD.floor - 200); ctx.lineTo(x + 50, WORLD.floor + 4); ctx.closePath();
      ctx.fillStyle = '#2a1410'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = '#141414'; ctx.stroke();
      for (let i = 0; i < 4; i++) { const y = WORLD.floor - 220 - ((t * 60 + i * 50) % 200); ctx.beginPath(); ctx.arc(x + Math.sin(t * 2 + i) * 14, y, 16 + i * 4, 0, 7); ctx.fillStyle = '#3a3038aa'; ctx.fill(); }
    }
  }
  if (s.zone === 'ice') { // the ice overhead
    ctx.beginPath(); ctx.moveTo(-50, -200);
    for (let x = -50; x <= WORLD.w + 50; x += 70) ctx.lineTo(x, 40 + ((x * 7) % 50));
    ctx.lineTo(WORLD.w + 50, -200); ctx.closePath(); ctx.fillStyle = '#dff4ff'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#7ab8d8'; ctx.stroke();
  }
  if (s.zone === 'trench') { // the trench's steep walls
    ctx.fillStyle = '#0a0c12';
    ctx.beginPath(); ctx.moveTo(-50, -200); ctx.lineTo(140, -200); ctx.lineTo(60, WORLD.h); ctx.lineTo(-50, WORLD.h); ctx.fill();
    ctx.beginPath(); ctx.moveTo(WORLD.w + 50, -200); ctx.lineTo(WORLD.w - 140, -200); ctx.lineTo(WORLD.w - 60, WORLD.h); ctx.lineTo(WORLD.w + 50, WORLD.h); ctx.fill();
  }
}

function drawTreasure(ctx: C, kind: string, x: number, y: number) {
  ctx.font = '44px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText({ chest: '🧰', pearl: '🦪', coins: '🪙', crown: '👑', gem: '💎' }[kind] ?? '💰', x, y);
}

/** A #rrggbb colour at this opacity. */
const tint = (c: string, a: number) => `rgba(${parseInt(c.slice(1, 3), 16)},${parseInt(c.slice(3, 5), 16)},${parseInt(c.slice(5, 7), 16)},${a})`;

/** A colour between two #rrggbb colours. */
function mix(a: string, b: string, f: number) {
  const n = (c: string, i: number) => parseInt(c.slice(1 + i * 2, 3 + i * 2), 16);
  return `rgb(${[0, 1, 2].map(i => Math.round(n(a, i) + (n(b, i) - n(a, i)) * f)).join(',')})`;
}

/** Where an animal is drawn this frame, with its bob and wiggle. */
const bob = (m: Swimmer, t: number) => Math.sin(t * 2 + m.phase) * 6;

// ---------- a frame ----------

export interface Bubble { x: number; y: number; r: number; life: number }

export function drawDive(ctx: C, s: DiveState, v: View, look: SubLook, sprites: Sprites, sc: Scenery, bubbles: readonly Bubble[], t: number) {
  const z = zoneOf(s.zone), k = v.k;
  // the water, darker the deeper the camera is: one solid colour (a full-screen gradient fill cost more than everything else together
  // in the measurements, and the dark covers most of the screen anyway)
  const depth = Math.max(0, Math.min(1, ((v.h / 2 - v.oy) / k) / WORLD.h));
  ctx.fillStyle = mix(z.top, z.bottom, depth); ctx.fillRect(0, 0, v.w, v.h);
  ctx.save(); ctx.setTransform(k, 0, 0, k, v.ox, v.oy);
  if (!skip('scenery')) drawScenery(ctx, s, sc, t);
  for (const tr of s.treasures) if (!tr.got) drawTreasure(ctx, tr.kind, tr.x, tr.y);
  for (const m of skip('animals') ? [] : s.animals) {
    const img = sprites.body.get(m.a.id);
    if (!img) continue;
    ctx.save(); ctx.translate(m.x, m.y + bob(m, t)); ctx.rotate(Math.sin(t * 20) * 0.12 * m.wiggle); ctx.scale(m.face / sprites.k, 1 / sprites.k);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();
  }
  ctx.restore();

  // the dark: one fill over the whole screen with his headlight's cone cut out of it
  const dark = z.dark * (s.flash > 0 ? 1 - Math.min(1, (s.flash / FLASH_S) * 1.6) : 1);
  const sub = toScreen(v, s.sub.x, s.sub.y), reach = s.gear.reach * k, a0 = s.sub.aim - s.gear.half, a1 = s.sub.aim + s.gear.half;
  if (dark > 0.01 && !skip('dark')) {
    const shade = `rgba(2,6,20,${dark.toFixed(3)})`;
    ctx.fillStyle = shade;
    ctx.beginPath(); ctx.rect(0, 0, v.w, v.h);
    ctx.moveTo(sub.x, sub.y); ctx.arc(sub.x, sub.y, reach, a0, a1); ctx.closePath();
    ctx.fill('evenodd');
    // the far end of the cone fades into the dark, tinted his headlight's colour: a gradient over only the outer band of the cone
    // (an annulus), since the measurements found a gradient over the whole cone, or an extra additive wash, cost as much as the rest
    const inner = reach * 0.68, fade = ctx.createRadialGradient(sub.x, sub.y, inner, sub.x, sub.y, reach);
    fade.addColorStop(0, tint(look.beam, 0.16)); fade.addColorStop(1, shade);
    ctx.fillStyle = fade; ctx.beginPath(); ctx.arc(sub.x, sub.y, reach, a0, a1); ctx.arc(sub.x, sub.y, inner, a1, a0, true); ctx.closePath(); ctx.fill();
  }

  ctx.save(); ctx.setTransform(k, 0, 0, k, v.ox, v.oy);
  // what shines by itself, added on top of the dark
  if (!skip('lighter')) {
  ctx.globalCompositeOperation = 'lighter';
  for (const m of s.animals) {
    if (!m.a.glow) continue;
    const img = sprites.glow.get(m.a.glow)!, [gx, gy] = glowAt(m.a, t), r = 60 * m.a.size * (1 + Math.sin(t * 3 + m.phase) * 0.1);
    const x = m.x + gx * ANIMAL_SCALE * m.a.size * m.face, y = m.y + bob(m, t) + gy * ANIMAL_SCALE * m.a.size;
    ctx.globalAlpha = 0.9; ctx.drawImage(img, x - r, y - r, r * 2, r * 2);
  }
  ctx.globalAlpha = 1;
  // the crystals in the cave: lit by his beam, they flash and bounce a narrow beam of their own
  for (const c of s.crystals) {
    const d = Math.atan2(c.y - s.sub.y, c.x - s.sub.x), off = Math.atan2(Math.sin(d - s.sub.aim), Math.cos(d - s.sub.aim));
    const lit = Math.hypot(c.x - s.sub.x, c.y - s.sub.y) < s.gear.reach && Math.abs(off) < s.gear.half;
    if (lit) { // it bounces his light like a mirror: the angle in is the angle out, about the crystal's face
      const face = c.tilt + Math.PI / 2, out = 2 * face - d;
      ctx.strokeStyle = look.beam; ctx.globalAlpha = 0.55; ctx.lineWidth = 16; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(c.x + Math.cos(out) * 340, c.y + Math.sin(out) * 340); ctx.stroke(); ctx.globalAlpha = 1;
    }
    ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.tilt);
    ctx.fillStyle = lit ? '#bff6ff' : '#4a3a8a';
    ctx.beginPath(); ctx.moveTo(0, -46); ctx.lineTo(18, 0); ctx.lineTo(0, 30); ctx.lineTo(-18, 0); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  }
  ctx.globalCompositeOperation = 'source-over';
  // the sonar ring and what it found
  if (s.ping) {
    ctx.beginPath(); ctx.arc(s.sub.x, s.sub.y, s.ping.r, 0, Math.PI * 2);
    ctx.lineWidth = 5; ctx.strokeStyle = `rgba(90,255,208,${(0.7 * (1 - s.ping.r / s.gear.sonarRange)).toFixed(3)})`; ctx.stroke();
  }
  for (const m of s.animals) {
    if (m.outline <= 0 || m.lit) continue; // the outline is for what his light can't show him
    const img = sprites.outline.get(m.a.id)!;
    ctx.save(); ctx.globalAlpha = 0.5 * Math.min(1, m.outline / (OUTLINE_S * 0.4)); ctx.translate(m.x, m.y + bob(m, t)); ctx.scale(m.face / sprites.k, 1 / sprites.k);
    ctx.drawImage(img, -img.width / 2, -img.height / 2); ctx.restore();
  }
  for (const tr of s.treasures) if (!tr.got && tr.outline > 0) { ctx.globalAlpha = Math.min(1, tr.outline); ctx.beginPath(); ctx.arc(tr.x, tr.y, 34, 0, 7); ctx.lineWidth = 5; ctx.strokeStyle = '#5affd0'; ctx.stroke(); ctx.globalAlpha = 1; }
  // the photo rings: filling up while his light is on an animal; a tick once it's in the Logbook
  for (const m of s.animals) {
    if (m.photo <= 0.02 && !(m.done && m.lit)) continue;
    const r = 56 * m.a.size + 10;
    ctx.beginPath(); ctx.arc(m.x, m.y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, m.photo));
    ctx.lineWidth = 9; ctx.strokeStyle = m.done ? '#3fd07f' : '#ffd23f'; ctx.lineCap = 'round'; ctx.stroke();
    if (m.done) { ctx.font = '900 34px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#3fd07f'; ctx.fillText('📷', m.x + r * 0.75, m.y - r * 0.75); }
  }
  // his bubbles, then his submarine, lit by its own lights
  for (const b of bubbles) { ctx.globalAlpha = Math.max(0, b.life); ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.lineWidth = 3; ctx.strokeStyle = look.trail; ctx.stroke(); }
  ctx.globalAlpha = 1;
  if (!skip('sub')) {
  ctx.save(); ctx.translate(s.sub.x, s.sub.y);
  const tilt = Math.max(-0.35, Math.min(0.35, (s.sub.vy / Math.max(1, s.gear.speed)) * 0.4)) * s.sub.face;
  ctx.rotate(tilt); ctx.scale(SUB_SCALE * s.sub.face, SUB_SCALE);
  drawSub(ctx, look, t);
  if (!skip('glow')) { ctx.globalCompositeOperation = 'lighter'; drawSub(ctx, look, t, true); ctx.globalCompositeOperation = 'source-over'; }
  ctx.restore();
  }
  ctx.restore();
  // the flash: the whole screen lights up white for a moment
  if (s.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${(0.6 * (s.flash / FLASH_S)).toFixed(3)})`; ctx.fillRect(0, 0, v.w, v.h); }
  // marine snow drifting past, nearer flakes faster (screen space)
  ctx.fillStyle = 'rgba(220,240,255,0.5)';
  for (const m of skip('motes') ? [] : sc.motes) {
    const x = (((m.x * v.w - (v.ox * m.z) * 0.3 + t * 8 * m.z) % v.w) + v.w) % v.w, y = (((m.y * v.h - (v.oy * m.z) * 0.3 + t * 14 * m.z) % v.h) + v.h) % v.h;
    ctx.fillRect(x, y, 2 + m.z * 3, 2 + m.z * 3);
  }
}
