// The Landing on a 2D canvas, from the side: a black sky with stars and the Earth (which hangs still over the Moon: from the near side it
// never rises or sets), the grey hills and craters, the pad with its lights, and the supply ship with its legs, its paint, its lights and
// its engine's flame. The camera follows the ship and keeps the ground in view. Pieces are few, so it holds 60 fps on an iPad 9.
import type { LanderKind } from '../base/catalog';
import { groundAt, landingLength, STEP_X, type LandingPlan } from '../base/gen';
import type { Sim } from './sim';

export interface Look { kind: LanderKind; paint: string; lights: string | null; carrying: boolean }

export function createScene(canvas: HTMLCanvasElement, plan: LandingPlan) {
  const ctx = canvas.getContext('2d')!;
  let w = 0, h = 0, dpr = 1;
  const stars = Array.from({ length: 70 }, (_, i) => ({ x: (i * 97.13) % 1, y: (i * 61.7) % 1, r: 0.6 + ((i * 13) % 5) / 4 }));
  const puffs: { x: number; y: number; t: number }[] = [];
  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const r = canvas.getBoundingClientRect();
    w = r.width; h = r.height;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  }
  resize();
  /** World units across the screen: about 300, more on a wide screen. */
  const scale = () => Math.max(w / 340, h / 300);
  let camX = plan.startX, camY = plan.startY - 80;
  const toScreen = (x: number, y: number): [number, number] => { const s = scale(); return [(x - camX) * s + w / 2, h * 0.62 - (y - camY) * s]; };
  const toWorld = (sx: number) => (sx - w / 2) / scale() + camX;

  function frame(s: Sim, t: number, look: Look) {
    const sc = scale();
    // the camera: the ship a little left of the middle when it is far from the pad, the ground in view
    camX += (s.x - camX) * 0.12;
    const g = groundAt(plan, s.x), wantY = Math.max(g + 40, Math.min(s.y - 30, g + 140));
    camY += (wantY - camY) * 0.08;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = plan.night ? '#05070f' : '#0b1022';
    ctx.fillRect(0, 0, w, h);
    for (const st of stars) { ctx.fillStyle = '#ffffffcc'; ctx.beginPath(); ctx.arc(((st.x * w * 1.6 - camX * 0.08) % w + w) % w, st.y * h * 0.7, st.r, 0, 7); ctx.fill(); }
    // the Earth, high in the sky
    const ex = w * 0.8, ey = h * 0.16, er = Math.max(18, h * 0.07);
    ctx.fillStyle = '#3a86ff'; ctx.beginPath(); ctx.arc(ex, ey, er, 0, 7); ctx.fill();
    ctx.fillStyle = '#2ec45a'; ctx.beginPath(); ctx.ellipse(ex - er * 0.25, ey - er * 0.1, er * 0.35, er * 0.22, 0.4, 0, 7); ctx.fill();
    ctx.fillStyle = '#05070f88'; ctx.beginPath(); ctx.arc(ex + er * 0.45, ey, er, 0, 7); ctx.fill();
    // the ground
    const x0 = Math.max(0, toWorld(-20)), x1 = Math.min(landingLength(plan), toWorld(w + 20));
    ctx.beginPath();
    const [sx0] = toScreen(x0, 0);
    ctx.moveTo(sx0, h);
    for (let x = x0; x <= x1; x += STEP_X / 4) { const [px, py] = toScreen(x, groundAt(plan, x)); ctx.lineTo(px, py); }
    const [sx1] = toScreen(x1, 0);
    ctx.lineTo(sx1, h); ctx.closePath();
    ctx.fillStyle = '#8a8f99'; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = '#111'; ctx.stroke();
    for (const c of plan.craters) { const [cx, cy] = toScreen(c.x, groundAt(plan, c.x)); ctx.fillStyle = '#5d626c'; ctx.beginPath(); ctx.ellipse(cx, cy + 2, c.r * sc * 0.8, c.d * sc * 0.35, 0, 0, 7); ctx.fill(); }
    // the pad and its lights
    const padY = groundAt(plan, plan.padX), [pl, py] = toScreen(plan.padX - plan.padW / 2, padY), [pr] = toScreen(plan.padX + plan.padW / 2, padY);
    ctx.fillStyle = '#d9dde3'; ctx.fillRect(pl, py - 6, pr - pl, 8); ctx.strokeRect(pl, py - 6, pr - pl, 8);
    const blink = Math.floor(t * 3) % 2 === 0;
    for (const [lx, on] of [[pl, blink], [pr, !blink], [(pl + pr) / 2, true]] as const) { ctx.fillStyle = on ? '#ffd23f' : '#6b5a1f'; ctx.beginPath(); ctx.arc(lx, py - 10, 6, 0, 7); ctx.fill(); ctx.stroke(); }
    // a pointer to the pad when it is off the screen
    if (pr < 0 || pl > w) {
      const right = pl > w, ax = right ? w - 30 : 30, ay = h * 0.45;
      ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.moveTo(ax + (right ? 18 : -18), ay); ctx.lineTo(ax, ay - 16); ctx.lineTo(ax, ay + 16); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    // dust puffs
    for (const p of puffs) { const [qx, qy] = toScreen(p.x, p.y), a = 1 - (t - p.t) / 0.8; if (a <= 0) continue; ctx.fillStyle = `rgba(200,200,210,${a})`; ctx.beginPath(); ctx.arc(qx, qy, (1 - a) * 30 + 6, 0, 7); ctx.fill(); }
    while (puffs.length && t - puffs[0]!.t > 0.8) puffs.shift();
    drawShip(s, t, look, sc);
  }

  function drawShip(s: Sim, t: number, look: Look, sc: number) {
    const [x, y] = toScreen(s.x, s.y), k = sc * 1.1, wide = look.kind === 'wide' ? 1.5 : look.kind === 'crane' ? 1.3 : 1, tall = look.kind === 'tall' ? 1.35 : 1;
    ctx.save(); ctx.translate(x, y); ctx.lineWidth = 3; ctx.strokeStyle = '#111'; ctx.lineJoin = 'round';
    // the flame
    if (s.engine) { const f = 10 + Math.sin(t * 40) * 3; ctx.fillStyle = '#ff8c1a'; ctx.beginPath(); ctx.moveTo(-4 * k, 2 * k); ctx.lineTo(0, (8 + f) * k * 0.6); ctx.lineTo(4 * k, 2 * k); ctx.closePath(); ctx.fill(); }
    // legs
    ctx.beginPath(); ctx.moveTo(-6 * k * wide, -2 * k); ctx.lineTo(-11 * k * wide, 6 * k); ctx.moveTo(6 * k * wide, -2 * k); ctx.lineTo(11 * k * wide, 6 * k); ctx.stroke();
    // body
    ctx.fillStyle = look.paint;
    ctx.beginPath(); ctx.moveTo(-8 * k * wide, -2 * k); ctx.lineTo(-6 * k * wide, -14 * k * tall); ctx.lineTo(6 * k * wide, -14 * k * tall); ctx.lineTo(8 * k * wide, -2 * k); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (look.kind === 'star') { ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(0, -18 * k * tall, 3 * k, 0, 7); ctx.fill(); ctx.stroke(); }
    if (look.kind === 'hopper') { ctx.beginPath(); ctx.arc(-11 * k, 7 * k, 2 * k, 0, 7); ctx.arc(11 * k, 7 * k, 2 * k, 0, 7); ctx.stroke(); }
    if (look.kind === 'crane') { ctx.beginPath(); ctx.moveTo(6 * k, -12 * k); ctx.lineTo(16 * k, -18 * k); ctx.lineTo(16 * k, -6 * k); ctx.stroke(); }
    // window
    ctx.fillStyle = '#9fd3ff'; ctx.beginPath(); ctx.arc(0, -8 * k * tall, 3 * k, 0, 7); ctx.fill(); ctx.stroke();
    // lights
    if (look.lights) { const hue = look.lights === 'rainbow' ? `hsl(${(t * 200) % 360} 90% 60%)` : look.lights; ctx.fillStyle = Math.floor(t * 4) % 2 ? hue : '#333'; ctx.beginPath(); ctx.arc(-6 * k * wide, -12 * k * tall, 2 * k, 0, 7); ctx.arc(6 * k * wide, -12 * k * tall, 2 * k, 0, 7); ctx.fill(); }
    // the crate it carries
    if (look.carrying) { ctx.fillStyle = '#c8873a'; ctx.fillRect(-4 * k, -1 * k, 8 * k, 5 * k); ctx.strokeRect(-4 * k, -1 * k, 8 * k, 5 * k); }
    ctx.restore();
  }

  return { resize, frame, toWorld, puff: (x: number, y: number, t: number) => puffs.push({ x, y, t }) };
}
