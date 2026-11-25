// Drawing a Flight from the side: a mountain sky at dawn (or night), far peaks, the rolling land with its lakes, castles and peaks, the
// beacons (stone bowls that blaze when breathed on), the clouds, the Flames to catch, a racing bird, the dragon he flies with its breath
// and its trail, and little bursts when something is lit or popped. Everything is in world units (0 the valley floor, 100 the top of the
// sky), scaled to the canvas. Moving pieces are capped so it holds 60 fps on an iPad 9.
import { drawDragon, MOUTH, type DragonLook } from '../art/dragon';
import { CEILING, groundAt, isLake, LAKE_LEVEL, type Course } from './course';
import { inBreath, reachOf, TUNING, type Sim } from './sim';
import type { FlightPlan } from '../roost/roost';
import { stageOf, marksOf } from '../roost/dragons';

export interface Burst { x: number; y: number; t: number; colour: string; kind: 'lit' | 'pop' | 'flame' | 'bounce' }
export interface View { w: number; h: number; u: number; camX: number }

const THEMES = [
  { sky: ['#ff9fb8', '#ffd28f', '#fff1cf'], far: '#c98aa6', land: '#3f9b4f', land2: '#2f7a3e', rock: '#b9735a' },
  { sky: ['#8fd0ff', '#ffd3a8', '#fff3dc'], far: '#9aa9c9', land: '#4caf50', land2: '#2e7d32', rock: '#a1887f' },
  { sky: ['#f6a26b', '#ffd27f', '#ffeec7'], far: '#b56f5a', land: '#7cab3e', land2: '#557a2b', rock: '#c0704a' },
  { sky: ['#b9d4ff', '#e8f0ff', '#ffffff'], far: '#a9b8d6', land: '#e9f1fb', land2: '#bcd0e8', rock: '#8a9bb5' },
  { sky: ['#9fb3c8', '#cfd9e2', '#eef2f5'], far: '#8796a8', land: '#3f8f6b', land2: '#2a6b4f', rock: '#7d8a8f' },
  { sky: ['#2a2a6e', '#5b3f8f', '#c26f9b'], far: '#3b2e66', land: '#2f5f4a', land2: '#204536', rock: '#5a4a6e' },
] as const;
const NIGHT = { sky: ['#0b1030', '#1d2160', '#3b2e66'], far: '#1c1a40' } as const;

/** Pixels per world unit: the whole sky fits the height, and at least 80 units fit across, so a tall phone still sees what is coming
 *  (its extra height is more sky). */
export const unitFor = (w: number, h: number) => Math.min(h / 100, w / 80);
export const viewFor = (w: number, h: number, s: Sim): View => {
  const u = unitFor(w, h);
  return { w, h, u, camX: s.x - (w * TUNING.dragonAt) / u };
};
const sx = (v: View, x: number) => (x - v.camX) * v.u;
const sy = (v: View, y: number) => v.h - y * v.u;

export function renderFlight(ctx: CanvasRenderingContext2D, s: Sim, plan: FlightPlan, look: DragonLook, v: View, t: number, bursts: readonly Burst[], still: boolean) {
  const c = s.c, th = THEMES[c.theme % THEMES.length]!, night = c.night, sky = night ? NIGHT.sky : th.sky;
  // sky
  const g = ctx.createLinearGradient(0, 0, 0, v.h);
  g.addColorStop(0, sky[0]); g.addColorStop(.6, sky[1]); g.addColorStop(1, sky[2]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, v.w, v.h);
  if (night) { ctx.fillStyle = '#fff'; for (let i = 0; i < 40; i++) { const x = ((i * 137.5 - v.camX * .05 * v.u) % v.w + v.w) % v.w; ctx.globalAlpha = .4 + (i % 3) * .2; ctx.fillRect(x, (i * 53) % (v.h * .5), 2, 2); } ctx.globalAlpha = 1; ctx.fillStyle = '#fff6d6'; ctx.beginPath(); ctx.arc(v.w * .8, v.h * .16, v.u * 6, 0, Math.PI * 2); ctx.fill(); }
  else { ctx.fillStyle = '#fff3b0'; ctx.beginPath(); ctx.arc(v.w * .78, v.h * .2, v.u * 8, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff8d8aa'; ctx.beginPath(); ctx.arc(v.w * .78, v.h * .2, v.u * 11, 0, Math.PI * 2); ctx.fill(); }
  // far peaks, slower
  ctx.fillStyle = night ? NIGHT.far : th.far;
  ctx.beginPath(); ctx.moveTo(0, v.h);
  for (let px = 0; px <= v.w + 16; px += 16) { // far mountains: sharp peaks, not hills
    const wx = v.camX * .3 + px / v.u, p = (wx / 52) % 1, q = (wx / 31 + .4) % 1;
    ctx.lineTo(px, v.h - (30 + 20 * (1 - Math.abs(p - .5) * 2) + 7 * (1 - Math.abs(q - .5) * 2)) * v.u);
  }
  ctx.lineTo(v.w, v.h); ctx.closePath(); ctx.fill();
  // weather far off
  if (c.weather === 'rain' || c.weather === 'snow') {
    ctx.strokeStyle = c.weather === 'rain' ? '#ffffff55' : '#ffffffaa'; ctx.fillStyle = '#ffffffcc'; ctx.lineWidth = 1.5;
    for (let i = 0; i < 50; i++) {
      const x = ((i * 97 + t * (c.weather === 'rain' ? 40 : 15) * (still ? 0 : 1)) % v.w + v.w) % v.w, y = ((i * 61 + t * (c.weather === 'rain' ? 300 : 60) * (still ? 0 : 1)) % v.h);
      if (c.weather === 'rain') { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 10); ctx.stroke(); } else { ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill(); }
    }
  }
  // clouds
  c.clouds.forEach((cl, i) => {
    if (s.popped[i]) return;
    const x = sx(v, cl.x), y = sy(v, cl.y), r = cl.r * v.u;
    if (x < -r * 3 || x > v.w + r * 3) return;
    ctx.fillStyle = night ? '#c9c4e8' : '#ffffff';
    ctx.strokeStyle = '#00000022'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x - r * .8, y + r * .2, r * .7, 0, Math.PI * 2); ctx.arc(x, y - r * .2, r, 0, Math.PI * 2); ctx.arc(x + r * .9, y + r * .15, r * .75, 0, Math.PI * 2); ctx.fill();
  });
  // land
  ctx.fillStyle = th.land;
  ctx.beginPath(); ctx.moveTo(0, v.h);
  for (let px = 0; px <= v.w + 6; px += 6) ctx.lineTo(px, sy(v, groundAt(c, v.camX + px / v.u)));
  ctx.lineTo(v.w, v.h); ctx.closePath(); ctx.fill();
  ctx.fillStyle = th.land2;
  ctx.beginPath(); ctx.moveTo(0, v.h);
  for (let px = 0; px <= v.w + 6; px += 6) ctx.lineTo(px, sy(v, groundAt(c, v.camX + px / v.u) - 4));
  ctx.lineTo(v.w, v.h); ctx.closePath(); ctx.fill();
  // lakes
  for (const l of c.lakes) {
    const x0 = sx(v, l.x0), x1 = sx(v, l.x1);
    if (x1 < 0 || x0 > v.w) continue;
    ctx.fillStyle = night ? '#28457a' : '#4fb3e8';
    ctx.fillRect(x0, sy(v, LAKE_LEVEL + .5), x1 - x0, LAKE_LEVEL * v.u);
    ctx.fillStyle = '#ffffff66'; for (let k = 0; k < 4; k++) ctx.fillRect(x0 + (x1 - x0) * (k + .3) / 4, sy(v, LAKE_LEVEL), 14, 2);
  }
  // castles, towers and peaks
  for (const tw of c.towers) {
    const x0 = sx(v, tw.x), w = tw.w * v.u;
    if (x0 + w < 0 || x0 > v.w) continue;
    if (tw.kind === 'peak') {
      const top = sy(v, groundAt(c, tw.x + tw.w / 2));
      ctx.fillStyle = th.rock; ctx.beginPath(); ctx.moveTo(x0, sy(v, groundAt(c, tw.x))); ctx.lineTo(x0 + w / 2, top); ctx.lineTo(x0 + w, sy(v, groundAt(c, tw.x + tw.w))); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(x0 + w / 2, top); ctx.lineTo(x0 + w * .38, top + w * .16); ctx.lineTo(x0 + w * .62, top + w * .16); ctx.closePath(); ctx.fill();
    } else {
      const top = sy(v, groundAt(c, tw.x + tw.w / 2));
      ctx.fillStyle = tw.kind === 'castle' ? '#d8c9b0' : '#c9b79a'; ctx.strokeStyle = '#5a4a3a'; ctx.lineWidth = 3;
      ctx.fillRect(x0, top, w, v.h - top); ctx.strokeRect(x0, top, w, v.h - top);
      const n = Math.max(2, Math.round(tw.w / 5));
      for (let k = 0; k < n; k += 2) ctx.fillRect(x0 + (w / n) * k, top - v.u * 2, w / n, v.u * 2);
      ctx.fillStyle = '#5a4a3a'; ctx.fillRect(x0 + w / 2 - v.u, top + v.u * 3, v.u * 2, v.u * 3);
      ctx.fillStyle = '#e8483b'; ctx.beginPath(); ctx.moveTo(x0 + w / 2, top - v.u * 2); ctx.lineTo(x0 + w / 2, top - v.u * 8); ctx.lineTo(x0 + w / 2 + v.u * 4, top - v.u * 6.5); ctx.lineTo(x0 + w / 2, top - v.u * 5); ctx.fill();
    }
  }
  // beacons: a stone bowl on the land (or on a post), lit or waiting
  c.beacons.forEach((b, i) => {
    const x = sx(v, b.x), y = sy(v, b.y);
    if (x < -40 || x > v.w + 40) return;
    const ground = sy(v, groundAt(c, b.x));
    if (ground - y > v.u * 3) { ctx.fillStyle = '#7a5a3a'; ctx.fillRect(x - v.u * .6, y, v.u * 1.2, ground - y); }
    ctx.strokeStyle = '#2a1a12'; ctx.lineWidth = Math.max(2, v.u * .4);
    if (s.lit[i]) { // a blaze, with a warm glow round it
      const f = still ? 1 : 1 + Math.sin(t * 12 + i) * .15;
      ctx.fillStyle = '#ffd23f55'; ctx.beginPath(); ctx.arc(x, y - v.u * 3, v.u * 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff8a1f'; ctx.beginPath(); ctx.moveTo(x, y - v.u * 8 * f); ctx.quadraticCurveTo(x + v.u * 3.4, y - v.u * 2.5, x + v.u * 2, y - v.u * 1.4); ctx.lineTo(x - v.u * 2, y - v.u * 1.4); ctx.quadraticCurveTo(x - v.u * 3.4, y - v.u * 2.5, x, y - v.u * 8 * f); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff3a8'; ctx.beginPath(); ctx.ellipse(x, y - v.u * 3, v.u * 1.1, v.u * 2 * f, 0, 0, Math.PI * 2); ctx.fill();
    } else { // logs waiting for his breath
      ctx.fillStyle = '#8a5a2b';
      ctx.beginPath(); ctx.roundRect(x - v.u * 2.2, y - v.u * 2.6, v.u * 4.4, v.u * 1.1, v.u * .5); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.roundRect(x - v.u * 1.6, y - v.u * 3.5, v.u * 3.2, v.u * 1.1, v.u * .5); ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = '#8e94a0'; // the stone bowl, in front
    ctx.beginPath(); ctx.moveTo(x - v.u * 3, y - v.u * 1.8); ctx.lineTo(x + v.u * 3, y - v.u * 1.8); ctx.lineTo(x + v.u * 1.6, y + v.u * .6); ctx.lineTo(x - v.u * 1.6, y + v.u * .6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#b4bac4'; ctx.fillRect(x - v.u * 2.6, y - v.u * 1.6, v.u * 5.2, v.u * .5);
    if (!s.lit[i] && plan.lookout) { // the Lookout's little arrow over a beacon still to light
      ctx.fillStyle = '#ffffffcc'; ctx.beginPath(); ctx.moveTo(x, y - v.u * 5); ctx.lineTo(x - v.u * 1.5, y - v.u * 8); ctx.lineTo(x + v.u * 1.5, y - v.u * 8); ctx.fill();
    }
  });
  // Flames to catch
  c.flames.forEach((f, i) => {
    if (s.got[i]) return;
    const x = sx(v, f.x), y = sy(v, f.y) + (still ? 0 : Math.sin(t * 3 + i) * v.u);
    if (x < -30 || x > v.w + 30) return;
    ctx.fillStyle = '#ff7a1a'; ctx.strokeStyle = '#7a1406'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, y - v.u * 3); ctx.quadraticCurveTo(x + v.u * 2.4, y, x, y + v.u * 2); ctx.quadraticCurveTo(x - v.u * 2.4, y, x, y - v.u * 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(x, y + v.u * .6, v.u * 1, 0, Math.PI * 2); ctx.fill();
  });
  // a racing bird
  for (const b of s.birds) {
    if (b.state !== 'racing') continue;
    const x = sx(v, b.x), y = sy(v, b.y), flap = still ? 0 : Math.sin(t * 14) * v.u * 1.5;
    ctx.strokeStyle = '#3a2a2a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x - v.u * 3, y - flap); ctx.quadraticCurveTo(x - v.u * 1.5, y - v.u * 1.5, x, y); ctx.quadraticCurveTo(x + v.u * 1.5, y - v.u * 1.5, x + v.u * 3, y - flap); ctx.stroke();
  }
  // the trail behind the dragon
  const dx = sx(v, s.x), dy = sy(v, s.y);
  if (plan.trail && plan.trail.hex) {
    for (let k = 1; k <= 8; k++) {
      ctx.globalAlpha = .5 - k * .05;
      ctx.fillStyle = plan.trail.hex === 'rainbow' ? ['#e8483b', '#ff8a1f', '#f5c518', '#2fae5a', '#3b82e8', '#8a4fd6'][k % 6]! : k % 2 ? plan.trail.hex : plan.trail.core;
      ctx.beginPath(); ctx.arc(dx - k * v.u * 2.4, dy + Math.sin(t * 6 - k) * v.u * .6, v.u * (1.4 - k * .1), 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  // the breath
  if (s.breathing) drawBreath(ctx, s, plan, v, t, still);
  // the dragon itself, tipped by how it climbs, spun by a ring trick
  const d = plan.dragon, size = v.u * 15 * [.8, .92, 1][stageOf(d.flights)]!;
  const spin = s.tricks.find(tr => tr.left > 0 && (tr.effect === 'ring'));
  const tilt = Math.max(-.5, Math.min(.5, (s.target - s.y) * -.03));
  ctx.save();
  ctx.translate(dx, dy);
  ctx.rotate(still ? 0 : spin ? (1 - spin.left / 1.2) * Math.PI * 2 * (spin.left > 0 ? 1 : 0) : tilt);
  drawDragon(ctx, look, size, { stage: stageOf(d.flights), t, flap: still ? 0 : 2.6, open: s.breathing, marks: marksOf(d.flights), saddle: plan.saddle, hat: plan.hat });
  ctx.restore();
  // bursts
  for (const b of bursts) {
    const k = b.t, x = sx(v, b.x), y = sy(v, b.y);
    ctx.globalAlpha = Math.max(0, 1 - k);
    ctx.strokeStyle = b.colour; ctx.fillStyle = b.colour; ctx.lineWidth = 3;
    if (b.kind === 'pop') for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; ctx.beginPath(); ctx.arc(x + Math.cos(a) * k * v.u * 8, y + Math.sin(a) * k * v.u * 8, v.u * 1.2, 0, Math.PI * 2); ctx.fill(); }
    else { ctx.beginPath(); ctx.arc(x, y, k * v.u * 9, 0, Math.PI * 2); ctx.stroke(); }
    ctx.globalAlpha = 1;
  }
  void CEILING; void isLake;
}

function drawBreath(ctx: CanvasRenderingContext2D, s: Sim, plan: FlightPlan, v: View, t: number, still: boolean) {
  const kind = plan.fly.breath, reach = reachOf(s), spread = TUNING.breath[kind].spread;
  const tint = plan.breathColour?.hex, rainbow = kind === 'rainbow' || tint === 'rainbow';
  const base = tint && tint !== 'rainbow' ? tint : kind === 'frost' ? '#9fd8ff' : kind === 'sparks' ? '#ffe14d' : kind === 'bubbles' ? '#bfe8ff' : '#ff8a1f';
  const mouthX = s.x + 4, mouthY = s.y + 1;
  const n = 14;
  for (let i = 0; i < n; i++) {
    const k = ((i / n) + (still ? 0 : t * 2.2)) % 1, wx = mouthX + k * reach, wobble = still ? 0 : Math.sin(i * 7 + t * 9) * k * reach * spread * .6;
    const x = sx(v, wx), y = sy(v, mouthY + wobble), r = v.u * (1 + k * reach * spread * .35);
    ctx.globalAlpha = .85 - k * .55;
    ctx.fillStyle = rainbow ? ['#e8483b', '#ff8a1f', '#f5c518', '#2fae5a', '#3b82e8', '#8a4fd6'][i % 6]! : i % 3 ? base : '#fff6c8';
    ctx.beginPath();
    if (kind === 'bubbles') { ctx.strokeStyle = base; ctx.lineWidth = 2; ctx.arc(x, y, r * .8, 0, Math.PI * 2); ctx.stroke(); }
    else if (kind === 'sparks') { ctx.arc(x, y, r * .45, 0, Math.PI * 2); ctx.fill(); }
    else { ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
  }
  ctx.globalAlpha = 1;
  void inBreath; void MOUTH;
}
export type { Course };
