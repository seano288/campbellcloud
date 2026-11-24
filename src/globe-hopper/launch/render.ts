// Draws the Launch from the side on a 2D canvas: the base on the ground (the pad, the tower, the buildings he has), the sky going from
// blue to black with stars, the clouds, the wide path (dotted chevrons once he has the Control Room), his rocket with its flame and the
// stages falling away. The camera follows the rocket. No art files and no library; a few dozen shapes a frame, tuned for an iPad 9.
import { drawRocket, rocketSize, type RocketLook } from '../art/rocket';
import { pathX, TUNING, type Sim, type Stage } from './sim';

export interface LaunchScene {
  resize(): void;
  frame(s: Sim, now: number): void;
  /** The lean a finger at screen x asks for, relative to the rocket: -1 to 1. */
  toSteer(x: number): number;
}
export interface SceneSetup {
  readonly look: RocketLook;
  readonly night: boolean;
  /** The path drawn plainly (the Control Room), and wider (Mission Control: drawn only; the sim is the same). */
  readonly guide: boolean;
  /** The base's buildings he owns, by catalogue id, to stand on the ground. */
  readonly buildings: readonly string[];
  readonly reduced: boolean;
}

interface Falling { stage: Stage; x: number; alt: number; vx: number; va: number; spin: number; rot: number }
const mix = (a: number[], b: number[], k: number) => `rgb(${a.map((v, i) => Math.round(v + (b[i]! - v) * k)).join(',')})`;

export function createScene(canvas: HTMLCanvasElement, setup: SceneSetup): LaunchScene {
  const ctx = canvas.getContext('2d')!;
  let W = 0, H = 0, dpr = 1, k = 1, rocketPx = 0;
  const size = rocketSize(setup.look);
  const falling: Falling[] = [];
  let lastStages: Stage[] | null = null;
  const stars = Array.from({ length: 70 }, (_, i) => ({ x: (i * 137.5) % 1, y: (i * 61.8) % 1, r: i % 7 === 0 ? 2 : 1.2 }));
  const smoke: { x: number; alt: number; r: number; life: number }[] = [];

  function resize() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(2, devicePixelRatio || 1);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    // world units to pixels: about 520 units of height in view; the rocket drawn a good size
    k = H / 520;
    rocketPx = Math.min(H * .3, W * .5) / size.h;
  }
  resize();

  function frame(s: Sim, now: number) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const camAlt = s.alt, camX = s.x;
    const rocketY = H * .62; // where the rocket's base is on screen
    const sy = (alt: number) => rocketY - (alt - camAlt) * k, sx = (x: number) => W / 2 + (x - camX) * k;
    // sky: blue near the ground, black in space (night is dark from the start)
    const up = Math.min(1, s.alt / TUNING.space);
    const top = setup.night ? mix([10, 16, 40], [0, 0, 6], up) : mix([70, 150, 235], [2, 4, 18], Math.pow(up, .8));
    const low = setup.night ? mix([30, 44, 90], [4, 6, 20], up) : mix([170, 215, 255], [12, 18, 50], Math.pow(up, .9));
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, top); g.addColorStop(1, low);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const starA = setup.night ? .4 + up * .6 : Math.max(0, (up - .45) / .55);
    if (starA > 0) { ctx.fillStyle = `rgba(255,255,255,${starA})`; for (const st of stars) ctx.fillRect(st.x * W, ((st.y * H + camAlt * k * .05) % H), st.r, st.r); }

    // the ground and the base
    const groundY = sy(0);
    if (groundY < H + 40) {
      ctx.fillStyle = setup.night ? '#1d2b1d' : '#6fae52'; ctx.fillRect(0, groundY, W, H - groundY + 40);
      ctx.fillStyle = setup.night ? '#3a3f48' : '#b8bec6'; ctx.fillRect(sx(-70), groundY - 6, 140 * k, 10); // the pad
      ctx.strokeStyle = '#14161b'; ctx.lineWidth = 3; ctx.strokeRect(sx(-70), groundY - 6, 140 * k, 10);
      drawGround(ctx, setup, sx, groundY, k);
    }
    // the path: chevrons up the middle, faint edges (plain ones with the Control Room)
    const pathA = setup.guide ? .9 : .5;
    for (let alt = Math.floor((camAlt - 300) / 40) * 40; alt < camAlt + 400; alt += 40) {
      if (alt < 30 || alt > TUNING.orbit) continue;
      const px = sx(pathX(alt)), py = sy(alt), hw = TUNING.halfWidth * k;
      ctx.fillStyle = `rgba(255,230,120,${pathA * .9})`;
      ctx.beginPath(); ctx.moveTo(px - 10, py + 6); ctx.lineTo(px, py - 6); ctx.lineTo(px + 10, py + 6); ctx.lineTo(px + 10, py + 11); ctx.lineTo(px, py - 1); ctx.lineTo(px - 10, py + 11); ctx.closePath(); ctx.fill();
      ctx.fillStyle = `rgba(255,255,255,${pathA * .45})`; ctx.fillRect(px - hw - 2, py - 8, 4, 16); ctx.fillRect(px + hw - 2, py - 8, 4, 16);
    }
    // clouds
    for (const c of s.clouds) {
      const cx = sx(c.x), cy = sy(c.alt);
      if (cy < -120 || cy > H + 120) continue;
      ctx.fillStyle = setup.night ? 'rgba(180,190,220,.35)' : 'rgba(255,255,255,.92)';
      const r = c.r * k;
      for (const [dx, dy, rr] of [[0, 0, 1], [-.7, .2, .7], [.7, .25, .75], [-.3, -.3, .7], [.35, -.25, .65]] as const) { ctx.beginPath(); ctx.arc(cx + dx * r, cy + dy * r, rr * r * .7, 0, Math.PI * 2); ctx.fill(); }
    }
    // stages that dropped: they fall away and tumble
    if (lastStages && lastStages.length > s.stages.length) for (const st of lastStages.filter(x => !s.stages.includes(x))) falling.push({ stage: st, x: s.x, alt: s.alt, vx: (st === 'boosters' ? 0 : -8), va: -5, spin: (Math.random() - .5) * 2, rot: s.tilt });
    lastStages = [...s.stages];
    for (const f of falling) {
      f.va -= 30 / 60; f.alt += f.va / 60 * 4; f.x += f.vx / 60; f.rot += f.spin / 60;
      const py = sy(f.alt);
      if (py > H + 200) continue;
      ctx.save(); ctx.translate(sx(f.x), py); ctx.rotate(f.rot);
      ctx.globalAlpha = .9;
      drawRocket(ctx, setup.look, 0, 0, rocketPx * .9, { only: f.stage });
      ctx.restore();
    }
    // smoke at lift-off
    if (s.phase === 'climb' && s.alt < 120 && !setup.reduced && smoke.length < 40) smoke.push({ x: s.x + (Math.random() - .5) * 30, alt: Math.max(0, s.alt - 10), r: 10, life: 1 });
    for (const p of smoke) { p.r += 1.2; p.life -= .012; }
    for (let i = smoke.length - 1; i >= 0; i--) if (smoke[i]!.life <= 0) smoke.splice(i, 1);
    ctx.fillStyle = 'rgba(240,240,245,.55)';
    for (const p of smoke) { ctx.globalAlpha = Math.max(0, p.life); ctx.beginPath(); ctx.arc(sx(p.x), sy(p.alt), p.r * k * 1.4, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1;
    // the rocket
    const shake = s.phase === 'count' && s.pt > TUNING.countdown - 2.5 ? (Math.random() - .5) * 2 : 0;
    const wob = Math.sin(now * 18) * s.wobble * .08;
    ctx.save(); ctx.translate(sx(s.x) + shake, rocketY); ctx.rotate(s.tilt + wob);
    const burn = s.phase === 'climb' ? (s.empty ? .5 : 1) : s.phase === 'count' && s.pt > TUNING.countdown - 1.5 ? .4 : 0;
    drawRocket(ctx, setup.look, 0, 0, rocketPx, { stages: s.stages, burn, t: now });
    ctx.restore();
  }

  function toSteer(x: number) { return Math.max(-1, Math.min(1, (x - W / 2) / (W * .3))); }
  return { resize, frame, toSteer };
}

/** The base's buildings on the ground, left and right of the pad, simple shapes in their colours. */
function drawGround(ctx: CanvasRenderingContext2D, setup: SceneSetup, sx: (x: number) => number, gy: number, k: number) {
  const has = (id: string) => setup.buildings.includes(id);
  const block = (x: number, w: number, h: number, fill: string) => { ctx.fillStyle = fill; ctx.fillRect(sx(x), gy - h * k, w * k, h * k); ctx.strokeStyle = '#14161b'; ctx.lineWidth = 2.5; ctx.strokeRect(sx(x), gy - h * k, w * k, h * k); };
  // the tower beside the pad, taller with each level
  const level = 1 + ['b:tower1', 'b:tower2', 'b:tower3'].filter(has).length, th = 80 + level * 55;
  ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 3;
  const tx = sx(-60), tw = 22 * k;
  ctx.strokeRect(tx, gy - th * k, tw, th * k);
  for (let y = 0; y < th; y += 18) { ctx.beginPath(); ctx.moveTo(tx, gy - y * k); ctx.lineTo(tx + tw, gy - (y + 18) * k); ctx.stroke(); }
  if (has('b:arm')) { ctx.fillStyle = '#8a9099'; ctx.fillRect(tx + tw, gy - th * k * .8, 26 * k, 6); }
  block(-160, 50, 26, '#d9dde2'); // the hut
  if (has('b:vab')) block(-330, 110, 150, '#eef1f5');
  if (has('b:control')) block(120, 70, 40, '#5b8cc0');
  if (has('b:fuel1')) { ctx.fillStyle = '#f6f8fb'; ctx.beginPath(); ctx.arc(sx(230), gy - 22 * k, 22 * k, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
  if (has('b:water')) block(270, 24, 90, '#9fb7cc');
  if (has('b:dish1')) { ctx.fillStyle = '#e8edf2'; ctx.beginPath(); ctx.arc(sx(330), gy - 50 * k, 26 * k, Math.PI * .9, Math.PI * 1.9); ctx.closePath(); ctx.fill(); ctx.stroke(); block(326, 8, 40, '#8a9099'); }
  if (has('b:lights')) for (const x of [-120, 90]) { block(x, 6, 120, '#5b616c'); ctx.fillStyle = setup.night ? '#fff6b0' : '#ffe58a'; ctx.fillRect(sx(x - 6), gy - 126 * k, 18 * k, 8 * k); }
  if (has('b:stand')) block(400, 90, 24, '#e63946');
  if (has('b:flags')) for (const x of [-220, -200, -180]) { block(x, 3, 60, '#5b616c'); ctx.fillStyle = ['#e63946', '#2f8fe8', '#ffd23f'][Math.abs(x / 20) % 3]!; ctx.fillRect(sx(x + 3), gy - 60 * k, 18 * k, 11 * k); }
}
