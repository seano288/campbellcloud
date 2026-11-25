// Drawing the Jump, flat from the side, on a 2D canvas: the night arena (stands full of his crowd with camera flashes, floodlight towers,
// his arena pieces), the dirt, his ramp (run-up, kicker, landing ramp), the Row, his truck, and after the landing the yellow tape rolling
// out from the lip with black numbers, zero at the lip. A moving piece count is kept small for an iPad 9: the crowd is drawn once into a
// strip and scrolled.
import { OBSTACLES, itemOf, type ArenaItem, type ObstacleKind } from '../arena/catalog';
import type { TruckLook } from '../arena/arena';
import { drawTruck, TRUCK_LEN } from '../art/truck';
import { groundAt, kickerLen, startX, windOf, type Sim } from './sim';

export interface SceneOpts {
  look: TruckLook;
  night: boolean;
  /** People in the stands, and his arena pieces (ids). */
  crowd: number;
  arena: readonly string[];
  /** The Row, laid out from the lip. */
  parts: readonly (readonly [ObstacleKind, number])[];
  rowFeet: number;
  /** The landing ramp's length (0: none). */
  landing: number;
  reduced: boolean;
}
export interface Frame { tape: number | null; crunched: number | null; squash: number; flashes: boolean }

/** The truck is this many feet long in the world. */
const TRUCK_FT = 15;
/** Where each thing in the Row stands: [kind, from, to] in feet from the lip. */
export function layRow(parts: SceneOpts['parts']): { kind: ObstacleKind; from: number; to: number }[] {
  const out: { kind: ObstacleKind; from: number; to: number }[] = [];
  let x = 1;
  for (const [k, n] of parts) for (let i = 0; i < n; i++) { const len = OBSTACLES[k].len; out.push({ kind: k, from: x, to: x + len }); x += len + 1; }
  return out;
}

function obstacle(ctx: CanvasRenderingContext2D, kind: ObstacleKind, x0: number, x1: number, gy: number, ft: number, flat: boolean) {
  const o = OBSTACLES[kind], w = x1 - x0, h = (flat ? Math.min(1.2, o.h * .3) : o.h) * ft, y = gy - h;
  ctx.lineWidth = Math.max(1.5, ft * .25); ctx.strokeStyle = '#111'; ctx.fillStyle = o.colour;
  if (kind === 'pool' || kind === 'mud') { ctx.fillRect(x0, gy - ft * .4, w, ft * 1.4); ctx.strokeRect(x0, gy - ft * .4, w, ft * 1.4); if (kind === 'pool') { ctx.font = `${ft * 3}px sans-serif`; ctx.fillText('🦆', x0 + w * .4, gy); } return; }
  if (kind === 'ring') {
    ctx.strokeStyle = '#ff4d1a'; ctx.lineWidth = ft * 1.1; ctx.beginPath(); ctx.ellipse((x0 + x1) / 2, gy - h / 2 - ft, ft * 2, h / 2, 0, 0, 7); ctx.stroke();
    ctx.fillStyle = '#ffd23f'; for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; ctx.beginPath(); ctx.arc((x0 + x1) / 2 + Math.cos(a) * ft * 2, gy - h / 2 - ft + Math.sin(a) * h / 2, ft * .7, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#6b7280'; ctx.fillRect((x0 + x1) / 2 - ft * .3, gy - ft, ft * .6, ft); return;
  }
  if (kind === 'cone') { ctx.beginPath(); ctx.moveTo(x0, gy); ctx.lineTo((x0 + x1) / 2, y); ctx.lineTo(x1, gy); ctx.closePath(); ctx.fill(); ctx.stroke(); return; }
  if (kind === 'hay') { ctx.fillRect(x0, y, w, h); ctx.strokeRect(x0, y, w, h); ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.moveTo(x0, y + h / 2); ctx.lineTo(x1, y + h / 2); ctx.stroke(); return; }
  if (kind === 'plane' || kind === 'heli' || kind === 'rocket' || kind === 'whale') {
    ctx.beginPath(); ctx.ellipse((x0 + x1) / 2, gy - h * .45, w / 2, h * .32, 0, 0, 7); ctx.fill(); ctx.stroke();
    if (kind === 'plane') { ctx.fillStyle = '#c9d1da'; ctx.beginPath(); ctx.moveTo(x0 + w * .4, gy - h * .45); ctx.lineTo(x0 + w * .55, gy - h * .05); ctx.lineTo(x0 + w * .62, gy - h * .45); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x0 + w * .04, gy - h * .5); ctx.lineTo(x0, gy - h); ctx.lineTo(x0 + w * .14, gy - h * .55); ctx.fill(); ctx.stroke(); }
    if (kind === 'heli') { ctx.strokeStyle = '#111'; ctx.beginPath(); ctx.moveTo(x0, gy - h * .85); ctx.lineTo(x1, gy - h * .85); ctx.stroke(); }
    if (kind === 'rocket') { ctx.fillStyle = '#e63946'; ctx.beginPath(); ctx.moveTo(x1 - w * .05, gy - h * .7); ctx.lineTo(x1 + w * .08, gy - h * .45); ctx.lineTo(x1 - w * .05, gy - h * .2); ctx.fill(); }
    return;
  }
  if (kind === 'dino') { ctx.beginPath(); ctx.moveTo(x0, gy - h * .3); ctx.quadraticCurveTo(x0 + w * .3, gy - h, x0 + w * .55, gy - h * .55); ctx.lineTo(x1, gy - h * .9); ctx.lineTo(x1, gy - h * .6); ctx.lineTo(x0 + w * .75, gy - h * .3); ctx.lineTo(x0 + w * .7, gy); ctx.lineTo(x0 + w * .3, gy); ctx.closePath(); ctx.fill(); ctx.stroke(); return; }
  if (kind === 'crane') { ctx.fillRect(x0, gy - h * .3, w * .5, h * .3); ctx.strokeRect(x0, gy - h * .3, w * .5, h * .3); ctx.beginPath(); ctx.moveTo(x0 + w * .2, gy - h * .3); ctx.lineTo(x1, gy - h); ctx.lineWidth = ft * .8; ctx.strokeStyle = o.colour; ctx.stroke(); return; }
  // wheeled things: a body, windows, wheels
  const r = Math.min(h * .2, ft * 1.6);
  ctx.beginPath(); ctx.roundRect(x0, y, w, h - r, ft * .6); ctx.fill(); ctx.stroke();
  if (!flat) { ctx.fillStyle = 'rgba(191,230,255,.9)'; const n = Math.max(1, Math.floor(w / (ft * 5))); for (let i = 0; i < n; i++) ctx.fillRect(x0 + ft + i * (w - ft * 2) / n, y + h * .12, (w - ft * 2) / n - ft * .6, h * .25); }
  ctx.fillStyle = '#1b1e24';
  for (const wx of [x0 + w * .18, x1 - w * .18]) { ctx.beginPath(); ctx.arc(wx, gy - r, r, 0, 7); ctx.fill(); }
}

export function createScene(canvas: HTMLCanvasElement, o: SceneOpts) {
  const ctx = canvas.getContext('2d')!;
  let W = 0, H = 0, dpr = 1;
  const resize = () => {
    const r = canvas.getBoundingClientRect(); dpr = Math.min(2, devicePixelRatio || 1); W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  };
  resize();
  const row = layRow(o.parts), arena = o.arena.map(id => itemOf(id) as ArenaItem).filter(i => i.cat === 'arena');
  const has = (does: string) => arena.some(a => a.does === does);
  const seen = { camX: 0, scale: 0 };

  function frame(s: Sim, t: number, f: Frame) {
    if (!W) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const S = s.setup, gy = H * (H > W ? .68 : .8);
    // the camera: the truck a little left of middle; zooms out as it climbs, so the ground stays in sight; once it has landed, the whole
    // tape from the lip to the truck fits across the screen
    const tapeFit = f.tape !== null ? Math.max(2, Math.min(W / 46, H / 22, (W * .84) / (s.feet + 12))) : 0;
    const want = f.tape !== null ? tapeFit : Math.min(W / 70, (gy - 30) / Math.max(18, s.y + 14), H / 26), ft = seen.scale ? seen.scale + (want - seen.scale) * .08 : want;
    seen.scale = ft;
    const focus = f.tape !== null ? -6 - (W * .08) / ft : s.x - W * .35 / ft;
    seen.camX = seen.camX ? seen.camX + (focus - seen.camX) * (f.tape !== null ? .1 : .25) : focus;
    const X = (x: number) => (x - seen.camX) * ft, Y = (y: number) => gy - y * ft;
    // the sky
    // a night arena always; a Night Show (or night jumps) is darker still, with more stars
    const sky = ctx.createLinearGradient(0, 0, 0, gy);
    if (o.night) { sky.addColorStop(0, '#020208'); sky.addColorStop(1, '#151330'); } else { sky.addColorStop(0, '#0b1030'); sky.addColorStop(1, '#2a2552'); }
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, gy);
    ctx.fillStyle = '#fff';
    for (let i = 0; i < (o.night ? 60 : 24); i++) ctx.fillRect(((i * 97.3 - seen.camX * ft * .05) % W + W) % W, (i * 41.7) % (gy * .5), 1.6, 1.6);
    // the stands: a band of crowd, scrolled slower than the ground
    const standTop = gy - Math.min(H * .42, H * .14 + Math.sqrt(o.crowd) * 2.4), par = seen.camX * ft * .4;
    ctx.fillStyle = o.night ? '#16131f' : '#4a5563'; ctx.fillRect(0, standTop, W, gy - standTop);
    const step = 9, rows = Math.floor((gy - standTop - 14) / step);
    for (let rI = 0; rI < rows; rI++) for (let i = -1; i < W / step + 1; i++) {
      const k = Math.floor(par / step) + i, seed = (k * 73 + rI * 37) % 101;
      if (seed > 20 + Math.min(80, o.crowd / 60)) continue;
      const x = i * step - (par % step) + (rI % 2) * 4, y = standTop + 8 + rI * step;
      ctx.fillStyle = ['#e63946', '#ffd23f', '#2f8fe8', '#2fa84f', '#ff7aa8', '#f6f8fb', '#ff7a00'][seed % 7]!;
      ctx.globalAlpha = o.night ? .55 : .8; ctx.beginPath(); ctx.arc(x, y + Math.sin(t * 6 + seed) * (f.flashes ? 1.5 : .5), 2.6, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (let i = 0; i < (has('flashes') ? 12 : 5); i++) { const seed = Math.floor(t * 7) * 13 + i * 31; if (seed % 5) continue; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc((seed * 47) % W, standTop + 10 + (seed * 13) % Math.max(10, gy - standTop - 20), 2.5, 0, 7); ctx.fill(); }
    // floodlights and arena pieces
    if (has('night')) {
      for (let i = 0; i < 3; i++) {
        const lx = ((i * W) / 2.5 - (par * .5) % (W / 2.5) + W) % (W + 80) - 40;
        ctx.fillStyle = '#9aa3ad'; ctx.fillRect(lx, standTop - 70, 5, 70);
        ctx.fillStyle = '#fff6c4'; ctx.fillRect(lx - 10, standTop - 78, 25, 10);
        const g = ctx.createLinearGradient(lx, standTop - 70, lx + 60, gy); g.addColorStop(0, 'rgba(255,246,196,.35)'); g.addColorStop(1, 'rgba(255,246,196,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(lx - 8, standTop - 70); ctx.lineTo(lx + 140, gy); ctx.lineTo(lx - 120, gy); ctx.fill();
      }
    }
    ctx.font = '26px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    for (const a of arena) { const ax = (a.spot * 97 - par * .7) % (W + 200); ctx.fillText(a.icon, ax < -40 ? ax + W + 200 : ax, a.icon === '🎈' ? standTop - 60 - (a.spot % 3) * 12 : standTop - 6); }
    // the dirt
    ctx.fillStyle = '#6b4226'; ctx.fillRect(0, gy, W, H - gy);
    ctx.fillStyle = '#7d5230'; for (let i = 0; i < 30; i++) { const x = ((i * 113 - seen.camX * ft) % W + W) % W; ctx.fillRect(x, gy + 6 + (i % 5) * 7, 10, 3); }
    // the run-up and the kicker
    const k = kickerLen(S);
    ctx.fillStyle = '#8b5a2b'; ctx.fillRect(X(startX(S)), gy - 3, (S.runUp) * ft, 6);
    ctx.fillStyle = '#ffd23f'; ctx.fillRect(X(startX(S)), gy - 4, 3, -18);
    ctx.fillStyle = '#c46a2f'; ctx.strokeStyle = '#111'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(X(-k), Y(0)); ctx.lineTo(X(0), Y(S.lip)); ctx.lineTo(X(0), Y(0)); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 1; for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(X(-k + (k * i) / 6), Y(0)); ctx.lineTo(X(-k + (k * i) / 6), Y(groundAt(S, -k + (k * i) / 6))); ctx.stroke(); }
    // the Row
    row.forEach((r, i) => obstacle(ctx, r.kind, X(r.from), X(r.to), gy, ft, f.crunched !== null && i === f.crunched));
    // the landing ramp past the Row
    if (o.landing > 0) { ctx.fillStyle = '#c46a2f'; ctx.strokeStyle = '#111'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(X(o.rowFeet + 1), Y(Math.min(6, o.landing / 6))); ctx.lineTo(X(o.rowFeet + 1 + o.landing), Y(0)); ctx.lineTo(X(o.rowFeet + 1), Y(0)); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    // the end of the Row: a flag on the ground, so he can see how far he must go
    if (o.rowFeet > 0) { ctx.fillStyle = '#fff'; ctx.fillRect(X(o.rowFeet), Y(0) - 34, 3, 34); ctx.fillStyle = '#2fa84f'; ctx.beginPath(); ctx.moveTo(X(o.rowFeet) + 3, Y(0) - 34); ctx.lineTo(X(o.rowFeet) + 22, Y(0) - 28); ctx.lineTo(X(o.rowFeet) + 3, Y(0) - 22); ctx.fill(); }
    // the tape: zero at the lip, a tick every foot (every five when they'd crowd), a number every ten
    if (f.tape !== null) {
      const end = f.tape, ty = gy + 8, th = Math.max(16, ft * 1.6);
      ctx.fillStyle = '#ffd23f'; ctx.strokeStyle = '#111'; ctx.lineWidth = 2;
      ctx.fillRect(X(0), ty, end * ft, th); ctx.strokeRect(X(0), ty, end * ft, th);
      const every = ft >= 6 ? 1 : ft >= 2 ? 5 : 10;
      ctx.fillStyle = '#111'; ctx.font = `bold ${Math.max(11, Math.min(18, th * .7))}px Nunito, sans-serif`; ctx.textAlign = 'center';
      for (let n = 0; n <= end; n += every) {
        const big = n % 10 === 0, x = X(n);
        if (x < -20 || x > W + 20) continue;
        ctx.fillRect(x - 1, ty, 2, big ? th * .55 : th * .3);
        if (big) ctx.fillText(String(n), x, ty + th - 2);
      }
      ctx.fillStyle = '#e63946'; ctx.beginPath(); ctx.moveTo(X(end), ty - 4); ctx.lineTo(X(end) - 8, ty - 16); ctx.lineTo(X(end) + 8, ty - 16); ctx.fill();
    }
    // the wind he feels
    const wind = windOf(S) + (S.help > 0 ? 1 : 0);
    if ((has('windsock') && S.wind) || S.help > 0) {
      ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.font = '22px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(`💨 ${wind > 0 ? '→'.repeat(Math.min(5, S.help + (S.wind > 0 ? 1 : 0))) : '←'.repeat(Math.min(3, Math.ceil(-S.wind / 2)))}`, 14, 30);
    }
    // the truck (its x is its back wheels' place on the tape; its middle is half a truck ahead)
    const sc = (TRUCK_FT * ft) / TRUCK_LEN, back = TRUCK_LEN * .3 * sc;
    const pitch = s.phase === 'run' && s.x > -k ? S.angle : s.pitch;
    const rad = (pitch * Math.PI) / 180;
    drawTruck(ctx, o.look, X(s.x) + Math.cos(rad) * back, Y(s.y) - Math.sin(rad) * back, sc, pitch, o.reduced ? 0 : t * (s.phase === 'run' ? 1 + s.v / 20 : .5), f.squash);
  }
  return { frame, resize, layRow: () => row, scale: () => seen.scale };
}
